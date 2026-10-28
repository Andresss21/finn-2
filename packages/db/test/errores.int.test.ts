// `sqlstateDe()` (TA-151; 04 §7.3, §7.4; DB-23): V-03, V-04, V-10 y V-11 de 04 como pruebas permanentes
// (07 §20.1). Portado de docs/anexos/04-backend-verificacion/t1.ts y t2.ts. Diferencia con el prototipo: en vez de
// `sleep` para que el segundo escritor llegue al bloqueo, la prueba espera a verlo en pg_locks (07 §7.1).
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generado/prisma/client.ts';
import type { Cliente } from '../src/cliente.ts';
import { sqlstateDe } from '../src/errores.ts';
import { transaccionesSobre, txPrisma } from '../src/transacciones.ts';
import { crearBasePrueba } from './ayudantes/base.ts';

const RELOJ = { hoy: '2026-10-14', desfaseMs: 0 };
const AHORA = new Date('2026-10-14T04:04:00.549Z');
const UUID = '0b5d0c5e-4c1b-4f6e-9b0e-6f4f5f0a0001';

const fallo = (p: Promise<unknown>): Promise<unknown> =>
  p.then(
    () => undefined,
    (e: unknown) => e,
  );

describe('PRU-INT-ESQ', () => {
  const base = crearBasePrueba();
  let db: Cliente;
  let sentencias: string[] = [];
  let admin: pg.Client;
  let tx: ReturnType<typeof transaccionesSobre>;

  beforeAll(async () => {
    const c = new PrismaClient({
      adapter: new PrismaPg({ connectionString: base.url, max: 3 }),
      log: [{ emit: 'event', level: 'query' }],
    });
    c.$on('query', (e) => sentencias.push(e.query.replace(/\s+/g, ' ').trim()));
    db = c;
    tx = transaccionesSobre(db);
    admin = new pg.Client({ connectionString: base.urlAdmin });
    await admin.connect();
  });
  afterAll(async () => {
    await db.$disconnect();
    await admin.end();
  });

  it('PRU-INT-ESQ-003 [V-03] DB-23, BE-25: una restricción diferida que falla en el COMMIT llega como DriverAdapterError con FN003 en error.cause.originalCode, sin código de Prisma, y no deja filas; un error que no viene de la base da null', async () => {
    // Un gasto de 300 con una línea de 100: la regla de forma (inv. 6) se evalúa al confirmar
    const e = await fallo(
      tx.escribir(
        async (t) => {
          const deudor = await txPrisma(t).deudor.create({ data: { nombre: 'ESQ-003' } });
          await txPrisma(t).transaccion.create({
            data: {
              tipo: 'gasto',
              fecha: new Date('2026-10-10T00:00:00.000Z'),
              horaRegistro: AHORA,
              claveOrden: AHORA,
              origen: 'manual',
              estadoBancario: 'pendiente',
              total: 300,
              lineas: { create: [{ orden: 1, monto: 100, deudorId: deudor.id }] },
            },
          });
        },
        { reloj: RELOJ },
      ),
    );
    expect(e).toBeDefined();
    expect((e as { code?: string }).code).toBeUndefined();
    expect(sqlstateDe(e)).toEqual({ sqlstate: 'FN003' });
    const { rows } = await admin.query<{ n: string }>(
      'SELECT count(*) AS n FROM finn.transacciones WHERE total = 300',
    );
    expect(rows[0]?.n).toBe('0');
    // No viene de la base: ni objetos ajenos ni valores sueltos
    expect(sqlstateDe(new Error('FN003'))).toBeNull();
    expect(sqlstateDe({ code: 'P2039' })).toBeNull();
    expect(sqlstateDe('FN003')).toBeNull();
    expect(sqlstateDe(undefined)).toBeNull();
  });

  it('PRU-INT-ESQ-004 [V-04] DB-23, BE-25: una regla inmediata (inicio de período) llega como PrismaClientKnownRequestError P2039 con FN002 en meta.driverAdapterError.cause.originalCode, y una consulta cruda como P2010', async () => {
    const e = await fallo(
      tx.escribir(
        async (t) => {
          await txPrisma(t).asignacion.create({
            data: {
              categoriaId: UUID,
              periodoInicio: new Date('2026-08-21T00:00:00.000Z'),
              monto: 10,
            },
          });
        },
        { reloj: RELOJ },
      ),
    );
    expect(e).toMatchObject({ code: 'P2039' });
    expect(sqlstateDe(e)).toEqual({ sqlstate: 'FN002', codigoPrisma: 'P2039' });
    // Consulta cruda: el mismo SQLSTATE por P2010
    const cruda = await fallo(
      tx.escribir(
        async (t) => {
          await txPrisma(t)
            .$executeRaw`INSERT INTO finn.asignaciones (categoria_id, periodo_inicio, monto)
          VALUES (${UUID}::uuid, '2026-08-21'::date, 10)`;
        },
        { reloj: RELOJ },
      ),
    );
    expect(sqlstateDe(cruda)).toEqual({ sqlstate: 'FN002', codigoPrisma: 'P2010' });
  });

  it('PRU-INT-ESQ-009 [V-10] BE-12: con el bloqueo ocupado, el segundo escritor falla a los 10 s con 55P03 (lock_timeout de finn.tomar_bloqueo) y no deja fila (nocturno: tarda 10 s)', async () => {
    let soltar = (): void => undefined;
    const puerta = new Promise<void>((r) => (soltar = r));
    const primero = tx.escribir(async () => {
      await puerta;
    });
    const enElBloqueo = async (concedido: boolean): Promise<number> =>
      Number(
        (
          await admin.query<{ n: string }>(
            `SELECT count(*) AS n FROM pg_locks l JOIN pg_stat_activity a USING (pid)
             WHERE l.locktype = 'advisory' AND l.granted = $2 AND a.datname = $1`,
            [base.nombre, concedido],
          )
        ).rows[0]?.n,
      );
    for (let i = 0; i < 20_000 && (await enElBloqueo(true)) !== 1; i++);
    expect(await enElBloqueo(true)).toBe(1);
    const e = await fallo(
      tx.escribir((t) => txPrisma(t).deudor.create({ data: { nombre: 'ESQ-009' } })),
    );
    soltar();
    await primero;
    expect(sqlstateDe(e)?.sqlstate).toBe('55P03');
    const { rows } = await admin.query<{ n: string }>(
      "SELECT count(*) AS n FROM finn.deudores WHERE nombre = 'ESQ-009'",
    );
    expect(rows[0]?.n).toBe('0');
  });

  it('PRU-INT-ESQ-010 [V-11] ADR-06: ninguna escritura ni lectura de escribir() y leer() emite SAVEPOINT, ni siquiera cuando la transacción falla', async () => {
    sentencias = [];
    await tx.escribir((t) => txPrisma(t).deudor.create({ data: { nombre: 'ESQ-010' } }));
    await tx.leer((t) => txPrisma(t).deudor.count());
    await fallo(
      tx.escribir(
        async (t) => {
          await txPrisma(t).deudor.create({ data: { nombre: 'ESQ-010 b' } });
          await txPrisma(t).asignacion.create({
            data: {
              categoriaId: UUID,
              periodoInicio: new Date('2026-08-21T00:00:00.000Z'),
              monto: 1,
            },
          });
        },
        { reloj: RELOJ },
      ),
    );
    expect(sentencias.length).toBeGreaterThan(10);
    expect(sentencias.filter((q) => /SAVEPOINT/i.test(q))).toEqual([]);
    expect(sentencias.some((q) => /^ROLLBACK$/i.test(q))).toBe(true);
  });
});
