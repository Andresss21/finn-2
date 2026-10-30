// Eventos del respaldo (TA-187; 04 §3.10 OPT-09, §12.5, §15.2, §16.3, §16.4; ADR-22) contra PostgreSQL como `finn_app`:
// respaldo correcto y restauración correcta en `estado_respaldo` con su evento, deriva de C5 o C6 solo en
// `eventos_sistema`, y un secreto inválido (otro, ausente, de otra longitud o sin `Bearer`) → 401 sin escribir nada
// salvo el aviso sin datos de la petición. El secreto nunca llega a la base.
import { beforeAll, describe, expect, it } from 'vitest';
import { leer } from '@finn/db';
import { txPrisma } from '../../db/src/transacciones.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  registrarEventoRespaldo,
  type DepsRespaldo,
  type PeticionRespaldo,
} from '../src/respaldo/eventos.ts';

// Secreto de prueba de 32 caracteres; no existe fuera de esta prueba
const SECRETO = 'prueba-respaldo-0123456789abcdefg';

describe('PRU-INT-RESP', () => {
  const base = crearBasePrueba();
  const deps: DepsRespaldo = { secreto: SECRETO, opciones: () => RELOJ };
  const peticion = (p: Partial<PeticionRespaldo>): PeticionRespaldo => ({
    autorizacion: `Bearer ${SECRETO}`,
    evento: 'respaldo',
    cuerpo: JSON.stringify({ objeto: 'diarios/2026-10-29.dump.age', revision: '42', bytes: 81920 }),
    ...p,
  });
  const estado = () =>
    leer((t) => txPrisma(t).estadoRespaldo.findUnique({ where: { id: 1 } }), RELOJ);
  const eventos = () =>
    leer(
      (t) =>
        txPrisma(t).eventoSistema.findMany({
          where: { origen: 'respaldo' },
          orderBy: { id: 'asc' },
          select: { nivel: true, mensaje: true, datos: true },
        }),
      RELOJ,
    );

  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-RESP-101 OPT-09: registra respaldo correcto, restauración correcta y deriva de C5 o C6 en estado_respaldo y eventos_sistema, y rechaza un secreto inválido sin escribir', async () => {
    // 12.5: un secreto inválido → 401; nada en estado_respaldo y solo un aviso sin datos de la petición
    const antes = await estado();
    for (const autorizacion of [
      `Bearer ${SECRETO.slice(0, -1)}x`, // misma longitud
      `Bearer ${SECRETO}x`, // otra longitud
      `Bearer ${SECRETO.slice(0, 8)}`,
      null,
      SECRETO, // sin Bearer
      `Bearer  ${SECRETO}`,
    ])
      expect(await registrarEventoRespaldo(peticion({ autorizacion }), deps)).toEqual({
        estado: 401,
      });
    // El secreto configurado vacío o corto nunca vale, aunque coincida
    expect(
      await registrarEventoRespaldo(peticion({ autorizacion: 'Bearer corto' }), {
        ...deps,
        secreto: 'corto',
      }),
    ).toEqual({ estado: 401 });
    expect(await estado()).toEqual(antes);
    const avisos = await eventos();
    expect(avisos).toHaveLength(7);
    for (const a of avisos)
      expect(a).toEqual({ nivel: 'aviso', mensaje: 'token_invalido', datos: null });

    // Con el secreto válido, un evento desconocido es 404 y un cuerpo inválido, 400: tampoco escriben
    expect(await registrarEventoRespaldo(peticion({ evento: 'borrar' }), deps)).toEqual({
      estado: 404,
    });
    for (const cuerpo of [
      'no es json',
      JSON.stringify({ objeto: 'diarios/x.dump.age', revision: '42' }), // sin bytes
      JSON.stringify({ objeto: '../fuera', revision: '42', bytes: 1 }),
      JSON.stringify({ objeto: 'diarios/x.dump.age', revision: '-1', bytes: 1 }),
      JSON.stringify({ objeto: 'diarios/x.dump.age', revision: '4', bytes: 1, texto: 'x' }),
    ])
      expect(await registrarEventoRespaldo(peticion({ cuerpo }), deps)).toEqual({ estado: 400 });
    for (const cuerpo of [
      JSON.stringify({ control: 'C7', filas: 1 }),
      JSON.stringify({ control: 'C5', filas: 0 }),
      JSON.stringify({ control: 'C5', filas: 1, contenido: 'fila' }),
    ])
      expect(await registrarEventoRespaldo(peticion({ evento: 'deriva', cuerpo }), deps)).toEqual({
        estado: 400,
      });
    expect(await estado()).toEqual(antes);
    expect(await eventos()).toHaveLength(7);

    // 16.3 paso 4: respaldo correcto → ultimo_respaldo_en (instante de la base) y el objeto, con su evento
    expect(await registrarEventoRespaldo(peticion({}), deps)).toEqual({ estado: 200 });
    const tras = await estado();
    expect(tras?.ultimoRespaldoEn).toBeInstanceOf(Date);
    expect(tras?.ultimoRespaldoObjeto).toBe('diarios/2026-10-29.dump.age');
    expect(tras?.ultimaRestauracionEn ?? null).toEqual(antes?.ultimaRestauracionEn ?? null);

    // 16.4: restauración correcta → ultima_restauracion_en; el respaldo no cambia (cuerpo vacío o {})
    for (const cuerpo of ['', '{}'])
      expect(
        await registrarEventoRespaldo(peticion({ evento: 'restauracion', cuerpo }), deps),
      ).toEqual({ estado: 200 });
    const restaurada = await estado();
    expect(restaurada?.ultimaRestauracionEn).toBeInstanceOf(Date);
    expect(restaurada?.ultimoRespaldoEn).toEqual(tras?.ultimoRespaldoEn);
    expect(restaurada?.ultimoRespaldoObjeto).toBe('diarios/2026-10-29.dump.age');

    // 16.3 paso 5: deriva de C5 o C6 con el control y el número de filas; estado_respaldo no cambia
    for (const [control, filas] of [
      ['C5', 2],
      ['C6', 1],
    ] as const)
      expect(
        await registrarEventoRespaldo(
          peticion({ evento: 'deriva', cuerpo: JSON.stringify({ control, filas }) }),
          deps,
        ),
      ).toEqual({ estado: 200 });
    expect(await estado()).toEqual(restaurada);

    // 15.2: los eventos de origen `respaldo`, en orden
    expect((await eventos()).slice(7)).toEqual([
      {
        nivel: 'info',
        mensaje: 'respaldo',
        datos: { objeto: 'diarios/2026-10-29.dump.age', revision: '42', bytes: 81920 },
      },
      { nivel: 'info', mensaje: 'restauracion', datos: null },
      { nivel: 'info', mensaje: 'restauracion', datos: null },
      { nivel: 'error', mensaje: 'deriva', datos: { control: 'C5', filas: 2 } },
      { nivel: 'error', mensaje: 'deriva', datos: { control: 'C6', filas: 1 } },
    ]);

    // Una revisión numérica se guarda igual que la de texto (pg devuelve BIGINT como texto)
    const numerica = JSON.stringify({
      objeto: 'mensuales/2026-10.dump.age',
      revision: 43,
      bytes: 0,
    });
    expect(await registrarEventoRespaldo(peticion({ cuerpo: numerica }), deps)).toEqual({
      estado: 200,
    });
    expect((await eventos()).at(-1)?.datos).toEqual({
      objeto: 'mensuales/2026-10.dump.age',
      revision: '43',
      bytes: 0,
    });

    // El secreto no está en ninguna fila
    const todo = await leer((t) => txPrisma(t).eventoSistema.findMany(), RELOJ);
    expect(
      JSON.stringify(todo, (_k, v: unknown) => (typeof v === 'bigint' ? String(v) : v)),
    ).not.toContain(SECRETO.slice(0, 12));
  });

  it('PRU-INT-RESP-101 OPT-09: si la base falla, 503 y no queda nada a medias', async () => {
    const roto: DepsRespaldo = {
      ...deps,
      escribirTecnico: () => Promise.reject(new Error('sin conexión')),
    };
    const antes = await estado();
    const n = (await eventos()).length;
    expect(await registrarEventoRespaldo(peticion({}), roto)).toEqual({ estado: 503 });
    expect(await estado()).toEqual(antes);
    expect(await eventos()).toHaveLength(n);
  });
});
