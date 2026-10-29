// La transacción sin bloqueo de las tablas [T] (corrección de TA-150; 03 §5.1, §5.5, §7.1; 04 §3.10, §7.8) contra
// PostgreSQL como `finn_app`: (a) termina mientras otra transacción tiene el bloqueo global, (b) no escribe en una
// tabla [M] y (c) el error de `confirmar` queda en `eventos_sistema` aunque la transacción principal haga ROLLBACK.
// Sin `sleep` (07 §7.1): el primer escritor avisa que ya está dentro, con el bloqueo, y espera a que la prueba lo suelte.
import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { Uuid } from '@finn/dominio';
import {
  crearNotificacion,
  escribir,
  escribirTecnico,
  eventoPorIdError,
  leer,
  Memoria,
  registrarEvento,
  sqlstateDe,
  type EscritorTecnicoTx,
  type NuevoEvento,
} from '@finn/db';
import { txPrisma, txPrismaT } from '../../db/src/transacciones.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, type DefinicionOperacion, type DepsMarco } from '../src/operaciones/marco.ts';
import { marcarNotificacionesLeidas } from '../src/operaciones/notificaciones/index.ts';

const ID = 'a0000000-0000-4000-8000-000000000107' as Uuid;

/** Una puerta que la prueba abre cuando quiere (sin esperas de tiempo). */
function puerta(): { esperar: Promise<void>; abrir: () => void } {
  let abrir = (): void => undefined;
  const esperar = new Promise<void>((r) => (abrir = r));
  return { esperar, abrir };
}

/** ¿La sesión de `tx` tiene algún bloqueo consultivo? Y el aislamiento y la zona de la transacción. */
async function sesion(tx: EscritorTecnicoTx) {
  const [s] = await txPrismaT(tx).$queryRaw<{ bloqueo: boolean; iso: string; zona: string }[]>`
    SELECT EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()) AS bloqueo,
      current_setting('transaction_isolation') AS iso, current_setting('TimeZone') AS zona`;
  return s;
}

const deudores = (nombre: string): Promise<number> =>
  leer((t) => txPrisma(t).deudor.count({ where: { nombre } }), RELOJ);

describe('PRU-INT-ESQ', () => {
  const base = crearBasePrueba();
  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-ESQ-107 [V-01] BE-26, ADR-06: escribirTecnico() escribe [T] sin el bloqueo global (03 §5.1): termina mientras otro lo tiene, OPT-04 incluida, y no puede escribir [M]; el error de confirmar se registra después del ROLLBACK', async () => {
    const notificacion = await escribirTecnico(
      (tx) => crearNotificacion(tx, { aviso: null, motivo: 'x', titulo: 't', cuerpo: 'c' }),
      RELOJ,
    );

    // (a) Otro escritor tiene el bloqueo (es su primera sentencia) y no lo suelta hasta que la prueba abra la puerta
    const dentro = puerta();
    const soltar = puerta();
    let primeroTermino = false;
    const primero = escribir(async () => {
      dentro.abrir();
      await soltar.esperar;
    }, RELOJ).then(() => (primeroTermino = true));
    await dentro.esperar;
    const tecnica = await escribirTecnico(
      async (tx) => ({
        id: await registrarEvento(tx, { nivel: 'info', origen: 'app', mensaje: 'ESQ-107 a' }),
        sesion: await sesion(tx),
      }),
      RELOJ,
    );
    const leidas = await marcarNotificacionesLeidas({ ids: [notificacion.id] }, () => RELOJ);
    expect(primeroTermino).toBe(false); // las dos terminaron con el bloqueo todavía tomado
    expect(tecnica.sesion).toEqual({ bloqueo: false, iso: 'read committed', zona: 'UTC' });
    expect(leidas).toMatchObject({ ok: true, valor: { marcadas: 1 } });
    soltar.abrir();
    await primero;
    expect(primeroTermino).toBe(true);
    const evento = await leer(
      (t) => txPrisma(t).eventoSistema.findUnique({ where: { id: tecnica.id } }),
      RELOJ,
    );
    expect(evento).toMatchObject({ mensaje: 'ESQ-107 a' });

    // (b) Una tabla [M] desde la transacción técnica: el tipo no lo deja, `txPrisma()` la rechaza y la base también
    const sinTipo = await escribirTecnico(async (tx) => {
      // @ts-expect-error EscritorTecnicoTx no es un EscritorTx: no tiene aplicarCambios
      expect(tx.aplicarCambios).toBeUndefined();
      return Promise.resolve().then(() => txPrisma(tx as never));
    }, RELOJ).catch((e: unknown) => e);
    expect(String(sinTipo)).toContain('La transacción no es de escribir() ni de leer()');
    const enLaBase = await escribirTecnico(
      (tx) => txPrismaT(tx).deudor.create({ data: { nombre: 'ESQ-107' } }),
      RELOJ,
    ).catch((e: unknown) => e);
    expect(sqlstateDe(enLaBase)?.sqlstate).toBe('FN001'); // a_exigir_bloqueo (03 §5.2)
    expect(await deudores('ESQ-107')).toBe(0);

    // (c) confirmar escribe una fila [M], falla con 22012 y revierte; el error se registra después del ROLLBACK,
    //     en escribirTecnico() y sin bloqueo (04 §7.8). Primero con la transacción técnica de producción
    const def: DefinicionOperacion<{ id: Uuid }, null, Uuid> = {
      id: 'OP-01',
      contrato: z.object({ id: z.string() }) as unknown as z.ZodType<{ id: Uuid }>,
      idempotencia: 'natural',
      resolver: () => Promise.resolve(null),
      comando: () => ({ operacion: 'OP-03', orden: [] }),
      async extra(tx) {
        await txPrisma(tx).deudor.create({ data: { nombre: 'ESQ-107 c' } });
        await txPrisma(tx).$queryRaw`SELECT 1 / 0`;
      },
      salida: () => ID,
    };
    const deps = (idError: string): DepsMarco => ({
      memoria: new Memoria(),
      opciones: () => RELOJ,
      nuevoIdError: () => idError,
      aplicar: (() => ({
        ok: true,
        cambios: [],
        hechosNuevos: {},
        impacto: {},
        avisos: [],
      })) as never,
    });
    const r = await confirmar(def, { id: ID }, deps('E-ESQ107'));
    expect(r).toMatchObject({ ok: false, error: { categoria: 'INTERNO', idError: 'E-ESQ107' } });
    expect(await deudores('ESQ-107 c')).toBe(0);
    expect(await leer((t) => eventoPorIdError(t, 'E-ESQ107'), RELOJ)).toMatchObject({
      nivel: 'error',
      origen: 'app',
      mensaje: 'INTERNO 22012 OP-01',
    });

    // El orden y la sesión del registro: la principal ya terminó en ROLLBACK y el registro no tiene el bloqueo
    const orden: string[] = [];
    const conOrden: DepsMarco = {
      ...deps('E-ESQ108'),
      escribir: ((trabajo: never, o: never) =>
        escribir(trabajo, o).catch((e: unknown) => {
          orden.push('rollback');
          throw e;
        })) as typeof escribir,
      escribirTecnico: ((trabajo: (tx: EscritorTecnicoTx) => Promise<unknown>, o: never) =>
        escribirTecnico(async (tx) => {
          orden.push(`registro bloqueo=${String((await sesion(tx))?.bloqueo)}`);
          return trabajo(tx);
        }, o)) as typeof escribirTecnico,
    };
    expect(await confirmar(def, { id: ID }, conOrden)).toMatchObject({ ok: false });
    expect(orden).toEqual(['rollback', 'registro bloqueo=false']);
    const registrado = await leer((t) => eventoPorIdError(t, 'E-ESQ108'), RELOJ);
    expect((registrado?.datos as NuevoEvento['datos'])?.['sqlstate']).toBe('22012');
  });
});
