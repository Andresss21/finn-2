// Idempotencia de una creación contra PostgreSQL (TA-159; 04 §4.6.1, BE-17; V-06): un id repetido llega como `P2002`
// sobre la clave primaria y el marco lo trata como idempotente (`ya_aplicada`) si la solicitud es la misma, y como
// `conflicto_id` si difiere. La operación de prueba es OP-01 (crear una cuenta de efectivo con saldo inicial), que sí
// crea filas secundarias con ids derivados del principal.
import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { aplicar, type ComandoDominio, type Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, escribir, eventosRecientes, leer, Memoria, sqlstateDe } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { generadorDerivado } from '../src/ids.ts';
import {
  confirmar,
  type DefinicionOperacion,
  type DepsMarco,
  type Veredicto,
} from '../src/operaciones/marco.ts';

const ID = 'a0000000-0000-4000-8000-000000000001' as Uuid;
const hoy = FechaLocal.desdeTexto(HOY);
const contrato = z.object({ id: z.uuid(), nombre: z.string() }) as unknown as z.ZodType<{
  id: Uuid;
  nombre: string;
}>;

/** OP-01 de efectivo con saldo 10.00; la clave de idempotencia es el `id` de la cuenta. */
function crearCuenta(
  comprobar: DefinicionOperacion<{ id: Uuid; nombre: string }, null, Uuid>['comprobarIdempotencia'],
): DefinicionOperacion<{ id: Uuid; nombre: string }, null, Uuid> {
  return {
    id: 'OP-01',
    contrato,
    idempotencia: 'creacion',
    idPrincipal: (e) => e.id,
    ...(comprobar ? { comprobarIdempotencia: comprobar } : {}),
    resolver: () => Promise.resolve(null),
    comando: (_r, instante, ids) =>
      ({
        operacion: 'OP-01',
        id: ID,
        instante,
        ids,
        cuenta: { tipo: 'efectivo', nombre: 'Caja', institucionId: null, ultimos4: null },
        saldo: 1000,
      }) as unknown as ComandoDominio,
    salida: () => ID,
  };
}

describe('PRU-INT-ESQ', () => {
  const base = crearBasePrueba();
  const reloj = () => RELOJ;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  // La comprobación de una creación: la fila existe y coincide (ya aplicada) o difiere (conflicto)
  const comprobarCuenta =
    (nombre: string) =>
    async (tx: Parameters<typeof cargarHechos>[0]): Promise<Veredicto<Uuid>> => {
      const cuenta = (await cargarHechos(tx)).cuentas.find((c) => c.id === ID);
      if (!cuenta) return { tipo: 'aplicar' };
      return cuenta.nombre === nombre
        ? { tipo: 'ya_aplicada', salida: ID }
        : { tipo: 'conflicto_id' };
    };

  it('PRU-INT-ESQ-005 [V-06] un id repetido llega como P2002 sobre la clave primaria de cuentas, y el marco responde ya_aplicada si la solicitud es la misma y conflicto_id si difiere', async () => {
    const antes = await leer((t) => cargarHechos(t), RELOJ);
    const r = aplicar(
      antes,
      {
        operacion: 'OP-01',
        id: ID,
        instante: '2027-02-05T12:00:00.000Z',
        ids: generadorDerivado(ID),
        cuenta: { tipo: 'efectivo', nombre: 'Caja', institucionId: null, ultimos4: null },
        saldo: 1000,
      } as unknown as ComandoDominio,
      hoy,
    );
    if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);

    // 1. La base: la primera escritura entra y la segunda, con el mismo id, es P2002 sobre cuentas_pkey
    await escribir((tx) => tx.aplicarCambios(r.cambios), RELOJ);
    const error = await escribir((tx) => tx.aplicarCambios(r.cambios), RELOJ).catch(
      (e: unknown) => e,
    );
    expect(sqlstateDe(error)).toMatchObject({
      sqlstate: '23505',
      codigoPrisma: 'P2002',
      restriccion: 'cuentas_pkey',
    });

    // 2. El marco con una memoria atrasada (la cuenta no está en sus hechos) y una comprobación que no la ve a
    //    tiempo: el INSERT choca, `escribir()` revierte y el marco relee y compara (4.6.1, paso 5)
    const revision = await leer((t) => Promise.resolve(t.estado.revision), RELOJ);
    const atrasada = async (): Promise<DepsMarco> => {
      const memoria = new Memoria();
      await memoria.hechos(revision, () => Promise.resolve(antes));
      return { memoria, opciones: reloj };
    };
    const ciega = (nombre: string) => {
      let llamadas = 0;
      const real = comprobarCuenta(nombre);
      return (tx: Parameters<typeof real>[0]) =>
        ++llamadas === 1 ? Promise.resolve({ tipo: 'aplicar' } as Veredicto<Uuid>) : real(tx);
    };

    const igual = await confirmar(
      crearCuenta(ciega('Caja')),
      { id: ID, nombre: 'Caja' },
      await atrasada(),
    );
    expect(igual).toEqual({ ok: true, valor: ID, yaAplicada: true, avisos: [] });

    const distinta = await confirmar(
      crearCuenta(ciega('Otra')),
      { id: ID, nombre: 'Otra' },
      await atrasada(),
    );
    expect(distinta).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });

    // la defensa deja un evento `aviso` (4.6.1) y el conflicto otro (7.2)
    const eventos = await leer((t) => eventosRecientes(t), RELOJ);
    expect(eventos.filter((e) => e.nivel === 'aviso').map((e) => e.mensaje)).toEqual(
      expect.arrayContaining(['23505 cuentas_pkey OP-01', 'CONFLICTO conflicto_id OP-01']),
    );

    // 3. El camino normal bajo el bloqueo: la comprobación ve la fila y no se escribe nada
    const visibles = await leer((t) => Promise.resolve(t.estado.revision), RELOJ);
    const repetida = await confirmar(
      crearCuenta(comprobarCuenta('Caja')),
      { id: ID, nombre: 'Caja' },
      { memoria: new Memoria(), opciones: reloj },
    );
    expect(repetida).toMatchObject({ ok: true, yaAplicada: true });
    expect(await leer((t) => Promise.resolve(t.estado.revision), RELOJ)).toBe(visibles);
  });

  it('PRU-INT-ESQ-005 [V-06] confirmar una creación nueva escribe la cuenta con los ids derivados del principal y deja la memoria igual a la base', async () => {
    const otro = 'a0000000-0000-4000-8000-000000000002' as Uuid;
    const def = crearCuenta(undefined);
    const nueva: typeof def = {
      ...def,
      comando: (r, i, ids) => ({ ...def.comando(r, i, ids), id: otro }) as ComandoDominio,
      salida: () => otro,
    };
    const memoria = new Memoria();
    const r = await confirmar(nueva, { id: otro, nombre: 'Caja' }, { memoria, opciones: reloj });
    expect(r).toEqual({ ok: true, valor: otro, yaAplicada: false, avisos: [] });
    const hechos = await leer((t) => cargarHechos(t), RELOJ);
    expect(hechos.cuentas.some((c) => c.id === otro)).toBe(true);
    const primero = generadorDerivado(otro).siguiente();
    // la transacción del saldo inicial y su efecto llevan el primer y el segundo id derivados (BE-31)
    expect(hechos.transacciones.some((t) => t.id === primero)).toBe(true);
    expect(memoria.revision).toBe(await leer((t) => Promise.resolve(t.estado.revision), RELOJ));
  });
});
