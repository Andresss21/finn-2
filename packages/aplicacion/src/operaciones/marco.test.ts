// Marco de operaciones (TA-159; 04 §4.3, §4.6 a §4.9; BE-13, BE-17, BE-18, BE-19) sin base de datos: `escribir()` y
// `leer()` son dobles que ejecutan el trabajo contra una transacción falsa, y `aplicar` devuelve lo que cada caso necesita.
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Memoria, type EscritorTx, type NuevoEvento } from '@finn/db';
import type { Hechos, Uuid } from '@finn/dominio';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
  type Veredicto,
} from './marco.ts';

const ID = '0f6a8f3e-5b1c-4e0a-9a52-0d2a6f0c9e11' as Uuid;
const IMPACTO = {
  deltaLpa: 0,
  deltaDisponible: [],
  deltaTarjetas: [],
  deltaReduccionProyectadaLpaAlCierre: 0,
  avisos: [],
};
const AVISO_PREVIO = { codigo: 'AV-01', momento: 'antes', requiereConfirmacion: true } as const;

const envuelto = (sqlstate: string, codigo = 'P2039') => ({
  code: codigo,
  meta: { driverAdapterError: { cause: { originalCode: sqlstate } } },
});

type Efectos = string[];

/** Un mundo falso: la revisión crece con cada escritura y todo lo que pasa queda en `registro`. */
function mundo(
  opciones: { fallos?: unknown[]; ultimaFalla?: unknown; aplicado?: () => unknown } = {},
) {
  const registro: string[] = [];
  const eventos: NuevoEvento[] = [];
  const fallos = [...(opciones.fallos ?? [])];
  let revision = 5;
  const memoria = new Memoria();
  void memoria.hechos('5', () => Promise.resolve({} as Hechos));
  const tx = (): EscritorTx => ({
    estado: { revision: String(revision), hoy: '2027-02-05', instante: '2027-02-05T12:00:00.000Z' },
    declararOperacion: () => Promise.resolve(),
    aplicarCambios: () => (registro.push('escribe'), Promise.resolve([])),
    revisionActual: () => Promise.resolve(String(revision + 1)),
  });
  const deps: DepsMarco = {
    memoria,
    escribir: (async (trabajo: (t: EscritorTx) => Promise<unknown>) => {
      const f = fallos.shift();
      if (f !== undefined) throw f as Error;
      const r = await trabajo(tx());
      revision++;
      return r;
    }) as never,
    leer: (async (trabajo: (t: unknown) => Promise<unknown>) => trabajo(tx())) as never,
    aplicar: ((_h: unknown, c: unknown) =>
      opciones.aplicado?.() ?? {
        ok: true,
        cambios: [],
        hechosNuevos: {},
        impacto: IMPACTO,
        avisos: [],
        c,
      }) as never,
    instante: () => '2027-02-05T12:00:00.000Z' as never,
    pausar: (ms) => (registro.push(`pausa ${ms}`), Promise.resolve()),
    azar: () => 0.5,
    nuevoIdError: () => 'E-TEST01',
    registrar: (e) => (eventos.push(e), Promise.resolve()),
  };
  return { deps, registro, eventos, revision: () => revision };
}

function definicion(
  parcial: Partial<DefinicionOperacion<{ id: Uuid }, null, Uuid>> = {},
  efectos: Efectos = [],
): DefinicionOperacion<{ id: Uuid }, null, Uuid> {
  return {
    id: 'OP-01',
    contrato: z.object({ id: z.string() }) as unknown as z.ZodType<{ id: Uuid }>,
    idempotencia: 'creacion',
    idPrincipal: (e) => e.id,
    resolver: () => Promise.resolve(null),
    comando: () => ({ operacion: 'OP-03', orden: [] }),
    salida: () => ID,
    posteriores: () => [
      { nombre: 'push', ejecutar: () => (efectos.push('push'), Promise.resolve()) },
    ],
    ...parcial,
  };
}

describe('PRU-DOM-VAL', () => {
  it('PRU-DOM-VAL-155 BE-13: previsualizar no escribe y confirmar con su huella escribe al primer intento; sin huella o con otra pide confirmación sin escribir', async () => {
    const m = mundo({
      aplicado: () => ({
        ok: true,
        cambios: [],
        hechosNuevos: {},
        impacto: IMPACTO,
        avisos: [AVISO_PREVIO],
      }),
    });
    const def = definicion();
    const vista = await previsualizar(def, { id: ID }, m.deps);
    if (!vista.ok || vista.valor.huellaImpacto === null) throw new Error('sin previsualización');
    expect(m.registro).toEqual([]);
    expect(vista.valor.revisionVista).toBe('5');
    expect(vista.valor.huellaImpacto).toMatch(/^[0-9a-f]{64}$/);

    const sin = await confirmar(def, { id: ID }, m.deps);
    expect(sin).toMatchObject({ ok: false, error: { categoria: 'REQUIERE_CONFIRMACION' } });
    const otra = await confirmar(def, { id: ID, huellaImpacto: 'x'.repeat(64) }, m.deps);
    if (otra.ok || otra.error.previsualizacion === undefined)
      throw new Error('debía pedir confirmación');
    expect(otra.error.previsualizacion.huellaImpacto).toBe(vista.valor.huellaImpacto);
    expect(m.registro).toEqual([]); // nada se escribió

    const ok = await confirmar(def, { id: ID, ...vista.valor }, m.deps);
    expect(ok).toMatchObject({ ok: true, valor: ID, yaAplicada: false });
    expect(m.registro).toEqual(['escribe']);
    expect(m.deps.memoria.revision).toBe('6'); // la memoria sigue a la escritura (paso 15)

    // sin avisos previos se confirma directo; con `exigeConfirmacion` (OP-06, OP-12, OP-19) no
    const directa = mundo();
    expect(await confirmar(definicion(), { id: ID }, directa.deps)).toMatchObject({ ok: true });
    const siempre = mundo();
    expect(
      await confirmar(definicion({ exigeConfirmacion: true }), { id: ID }, siempre.deps),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
  });

  it('PRU-DOM-VAL-156 BE-17: cada veredicto de idempotencia responde sin escribir: ya_aplicada con la salida de siempre, conflicto_id, conflicto_desactualizado y no_encontrado; un rechazo del dominio es DOMINIO', async () => {
    const con = async (v: Veredicto<Uuid>) => {
      const m = mundo();
      const r = await confirmar(
        definicion({ comprobarIdempotencia: () => Promise.resolve(v) }),
        { id: ID },
        m.deps,
      );
      expect(m.registro).toEqual([]);
      return { r, eventos: m.eventos };
    };
    expect((await con({ tipo: 'ya_aplicada', salida: ID })).r).toEqual({
      ok: true,
      valor: ID,
      yaAplicada: true,
      avisos: [],
    });
    const conflicto = await con({ tipo: 'conflicto_id' });
    expect(conflicto.r).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    expect(conflicto.eventos).toMatchObject([{ nivel: 'aviso' }]); // 7.2: conflicto_id se registra
    const desactualizado = await con({
      tipo: 'conflicto_desactualizado',
      actuales: { monto: '180.00' },
    });
    expect(desactualizado.r).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_desactualizado', datos: { actuales: { monto: '180.00' } } },
    });
    expect(desactualizado.eventos).toEqual([]); // y conflicto_desactualizado, no
    expect((await con({ tipo: 'no_encontrado' })).r).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });

    const m = mundo({
      aplicado: () => ({ ok: false, rechazos: [{ codigo: 'no_encontrado', campo: 'cuentaId' }] }),
    });
    expect(await confirmar(definicion(), { id: ID }, m.deps)).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO', campos: { cuentaId: 'Esto ya no existe.' } },
    });
    const m2 = mundo({
      aplicado: () => ({ ok: false, rechazos: [{ codigo: 'invariante_violada' }] }),
    });
    expect(await confirmar(definicion(), { id: ID }, m2.deps)).toMatchObject({
      ok: false,
      error: { categoria: 'INTERNO', idError: 'E-TEST01' },
    });
    expect(await confirmar(definicion(), {}, m2.deps)).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
  });

  it('PRU-DOM-VAL-157 BE-18: un bloqueo ocupado se reintenta una vez tras 300 a 600 ms; si persiste es OCUPADO; una conexión perdida antes del COMMIT se reintenta y después del COMMIT es INCIERTO sin reintento', async () => {
    const reintenta = mundo({ fallos: [envuelto('55P03')] });
    expect(await confirmar(definicion(), { id: ID }, reintenta.deps)).toMatchObject({ ok: true });
    expect(reintenta.registro).toEqual(['pausa 450', 'escribe']);

    const persiste = mundo({ fallos: [envuelto('55P03'), envuelto('40P01')] });
    expect(await confirmar(definicion(), { id: ID }, persiste.deps)).toMatchObject({
      ok: false,
      error: { categoria: 'OCUPADO', idError: 'E-TEST01' },
    });
    expect(persiste.registro).toEqual(['pausa 450']);
    expect(persiste.eventos).toMatchObject([{ nivel: 'aviso', mensaje: 'OCUPADO 40P01 OP-01' }]);

    const perdida = mundo({ fallos: [new Error('Connection terminated unexpectedly')] });
    expect(await confirmar(definicion(), { id: ID }, perdida.deps)).toMatchObject({ ok: true });

    // el COMMIT pudo aplicarse: el callback terminó y la conexión se cayó al confirmar
    const m = mundo();
    let intentos = 0;
    m.deps = {
      ...m.deps,
      escribir: async (trabajo: (t: EscritorTx) => Promise<unknown>) => {
        intentos++;
        await trabajo({
          estado: { revision: '5', hoy: '2027-02-05', instante: '2027-02-05T12:00:00.000Z' },
          declararOperacion: () => Promise.resolve(),
          aplicarCambios: () => Promise.resolve([]),
          revisionActual: () => Promise.resolve('6'),
        });
        throw new Error('Connection terminated unexpectedly');
      },
    };
    expect(await confirmar(definicion(), { id: ID }, m.deps)).toMatchObject({
      ok: false,
      error: { categoria: 'INCIERTO', codigo: 'incierto' },
    });
    expect(intentos).toBe(1);
    expect(m.eventos).toMatchObject([{ nivel: 'error', mensaje: 'INCIERTO incierto OP-01' }]);

    // un rechazo de la base no se reintenta y es INTERNO
    const interno = mundo({ fallos: [envuelto('23514', 'P2010')] });
    expect(await confirmar(definicion(), { id: ID }, interno.deps)).toMatchObject({
      ok: false,
      error: { categoria: 'INTERNO', codigo: '23514' },
    });
  });

  it('PRU-DOM-VAL-158 BE-19: los efectos posteriores corren solo después de confirmar; ni una confirmación pendiente ni un rechazo los ejecutan, y el fallo de uno se registra sin cambiar la respuesta', async () => {
    const efectos: Efectos = [];
    const pendiente = mundo({
      aplicado: () => ({
        ok: true,
        cambios: [],
        hechosNuevos: {},
        impacto: IMPACTO,
        avisos: [AVISO_PREVIO],
      }),
    });
    await confirmar(definicion({}, efectos), { id: ID }, pendiente.deps);
    const rechazada = mundo({
      aplicado: () => ({ ok: false, rechazos: [{ codigo: 'no_encontrado' }] }),
    });
    await confirmar(definicion({}, efectos), { id: ID }, rechazada.deps);
    expect(efectos).toEqual([]);

    const ok = mundo();
    const tareas: (() => Promise<void>)[] = [];
    ok.deps = { ...ok.deps, despues: (t) => void tareas.push(t) };
    expect(await confirmar(definicion({}, efectos), { id: ID }, ok.deps)).toMatchObject({
      ok: true,
    });
    expect(efectos).toEqual([]); // diferido a `after()`
    await tareas[0]?.();
    expect(efectos).toEqual(['push']);

    const falla = mundo();
    const rota = definicion({
      posteriores: () => [
        { nombre: 'push', ejecutar: () => Promise.reject(new Error('sin red 500')) },
      ],
    });
    expect(await confirmar(rota, { id: ID }, falla.deps)).toMatchObject({ ok: true, valor: ID });
    expect(falla.eventos).toMatchObject([
      { nivel: 'error', mensaje: 'EFECTO push OP-01', datos: { mensajeSaneado: 'sin red #' } },
    ]);
  });
});
