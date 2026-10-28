// `escribir()` y `leer()` (TA-150; 04 §4.1, §4.2, §4.4, §5.1, §13.1, §13.6; 07 §4.1, §4.4; ADR-06): V-01, V-02,
// V-07, V-08 y V-09 de 04 como pruebas permanentes (07 §20.1). Portado de docs/anexos/04-backend-verificacion/
// t1.ts y t2.ts. Diferencia con el prototipo: en vez de `sleep` para que el segundo escritor llegue al bloqueo,
// la prueba espera a verlo en pg_locks sin el bloqueo concedido y el primero confirma cuando la prueba lo suelta
// (07 §7.1). La base tiene la zona America/Guatemala: así "la sesión está en UTC" no pasa por casualidad.
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generado/prisma/client.ts';
import type { Cliente } from '../src/cliente.ts';
import {
  type EscritorTx,
  type OperacionDeclarada,
  transaccionesSobre,
  txPrisma,
} from '../src/transacciones.ts';
import { consultar, crearBasePrueba } from './ayudantes/base.ts';

const HOY = '2027-02-05';
const DESFASE_MS = 123 * 86_400_000; // 123 días: el instante cae lejos del reloj real de la base
const RELOJ = { hoy: HOY, desfaseMs: DESFASE_MS };

/** SQLSTATE de un error de Prisma (P2039 lo lleva en meta.driverAdapterError.cause, V-01) o de `pg`. */
const sqlstate = (e: unknown): string | undefined => {
  const x = e as {
    code?: string;
    meta?: { driverAdapterError?: { cause?: { originalCode?: string } } };
    cause?: { originalCode?: string };
  };
  return x.meta?.driverAdapterError?.cause?.originalCode ?? x.cause?.originalCode ?? x.code;
};
const fallo = (p: Promise<unknown>): Promise<unknown> =>
  p.then(
    () => undefined,
    (e: unknown) => e,
  );

/** Una puerta que la prueba abre cuando quiere (sin esperas de tiempo). */
function puerta(): { esperar: Promise<void>; abrir: () => void } {
  let abrir = (): void => undefined;
  const esperar = new Promise<void>((r) => (abrir = r));
  return { esperar, abrir };
}

describe('PRU-INT-ESQ', () => {
  const base = crearBasePrueba();
  let db: Cliente;
  let sentencias: string[] = [];
  let admin: pg.Client;
  let tx: ReturnType<typeof transaccionesSobre>;

  beforeAll(async () => {
    await consultar(
      base.urlAdmin,
      `ALTER DATABASE ${base.nombre} SET TimeZone = 'America/Guatemala'`,
    );
    // Sin `options`: la zona UTC de la transacción sale solo de set_config (04 §13.6, decisión 1)
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

  const deudores = async (nombre: string): Promise<number> =>
    Number(
      (
        await admin.query<{ n: string }>(
          'SELECT count(*) AS n FROM finn.deudores WHERE nombre = $1',
          [nombre],
        )
      ).rows[0]?.n,
    );
  const crearDeudor = (t: EscritorTx, nombre: string) =>
    txPrisma(t).deudor.create({ data: { nombre } });

  /** Cuántas sesiones de `base` tienen (`concedido`) o esperan el bloqueo de Finn. */
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
  /** Espera, sin reloj ni `sleep`, a que una sesión tenga o espere el bloqueo (07 §7.1). */
  async function esperarBloqueo(concedido: boolean): Promise<void> {
    for (let i = 0; i < 20_000; i++) if ((await enElBloqueo(concedido)) === 1) return;
    throw new Error(`Ninguna sesión ${concedido ? 'tomó' : 'esperó'} el bloqueo`);
  }

  it('PRU-INT-ESQ-001 [V-01] BE-11, ADR-06: una escritura de hechos sin escribir() y sin bloqueo falla con FN001 como P2039 y no deja filas; la misma con escribir() se confirma', async () => {
    const e = await fallo(db.deudor.create({ data: { nombre: 'ESQ-001' } }));
    expect(e).toMatchObject({ code: 'P2039' });
    expect(sqlstate(e)).toBe('FN001');
    expect(await deudores('ESQ-001')).toBe(0);
    await tx.escribir((t) => crearDeudor(t, 'ESQ-001'));
    expect(await deudores('ESQ-001')).toBe(1);
  });

  it('PRU-INT-ESQ-002 [V-02] BE-12, BE-14, BE-27, BE-30, BE-33, CT-01, CT-02: bloqueo como primera sentencia, zona y reloj después, primera consulta con revisión, hoy e instante del reloj de prueba, y la revisión sube 1 con dos escrituras', async () => {
    sentencias = [];
    const r = await tx.escribir(
      async (t) => {
        await crearDeudor(t, 'ESQ-002 a');
        await crearDeudor(t, 'ESQ-002 b');
        const p = txPrisma(t);
        const [s] = await p.$queryRaw<
          {
            iso: string;
            zona: string;
            bloqueo: boolean;
            marca: boolean;
            hoy: string;
            desfase: bigint;
          }[]
        >`SELECT current_setting('transaction_isolation') AS iso, current_setting('TimeZone') AS zona,
          EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()
            AND granted) AS bloqueo,
          coalesce(current_setting('finn.bloqueo_xact', true), '') = pg_current_xact_id()::text AS marca,
          current_setting('finn.hoy') AS hoy,
          round(extract(epoch FROM (${t.estado.instante}::timestamptz - clock_timestamp())) * 1000)::bigint
            AS desfase`;
        return { estado: t.estado, despues: await t.revisionActual(), sesion: s };
      },
      { reloj: RELOJ },
    );
    const nuestras = sentencias.filter(
      (q) => !/^(BEGIN|COMMIT|SET TRANSACTION ISOLATION)/i.test(q),
    );
    expect(nuestras[0]).toBe('SELECT finn.tomar_bloqueo()');
    expect(nuestras[1]).toMatch(
      /^SELECT set_config\('TimeZone', 'UTC', true\), set_config\('finn.hoy'/,
    );
    expect(nuestras[2]).toMatch(
      /^SELECT valor::text AS revision, finn.hoy\(\)::text AS hoy, .*finn.instante\(\)/,
    );
    expect(r.sesion).toMatchObject({
      iso: 'read committed',
      zona: 'UTC',
      bloqueo: true,
      marca: true,
      hoy: HOY,
    });
    expect(r.estado.hoy).toBe(HOY);
    expect(r.estado.instante).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    // El instante es el del reloj de prueba (finn.instante() = clock_timestamp() + desfase, 07 §4.4)
    const desfase = Number(r.sesion?.desfase);
    expect(desfase).toBeLessThanOrEqual(DESFASE_MS);
    expect(desfase).toBeGreaterThan(DESFASE_MS - 60_000);
    expect(BigInt(r.despues) - BigInt(r.estado.revision)).toBe(1n);
    // Sin reloj de prueba no se fija finn.hoy: hoy es el de la base
    const sinReloj = await tx.escribir(async (t) => {
      const [x] = await txPrisma(t).$queryRaw<{ hoy: string; base: string }[]>`
        SELECT coalesce(current_setting('finn.hoy', true), '') AS hoy,
          (now() AT TIME ZONE 'America/El_Salvador')::date::text AS base`;
      return { ...x, estado: t.estado };
    });
    expect(sinReloj).toMatchObject({ hoy: '' });
    expect(sinReloj.estado.hoy).toBe(sinReloj.base);
    expect(sinReloj.estado.revision).toBe(r.despues);
    // BE-14: finn.operacion solo local y solo con la lista cerrada
    const op = await tx.escribir(async (t) => {
      await t.declararOperacion('fusion');
      return (
        await txPrisma(t).$queryRaw<{ op: string }[]>`
        SELECT current_setting('finn.operacion') AS op`
      )[0]?.op;
    });
    expect(op).toBe('fusion');
    const despues = await tx.escribir(
      async (t) =>
        (
          await txPrisma(t).$queryRaw<{ op: string }[]>`
        SELECT coalesce(current_setting('finn.operacion', true), '') AS op`
        )[0]?.op,
    );
    expect(despues).toBe('');
    const otra = await fallo(
      tx.escribir(async (t) => {
        await crearDeudor(t, 'ESQ-002 c');
        await t.declararOperacion('OP-12' as OperacionDeclarada);
      }),
    );
    expect(String(otra)).toContain('finn.operacion no admite "OP-12"');
    expect(await deudores('ESQ-002 c')).toBe(0);
  });

  it('PRU-INT-ESQ-006 [V-07] BE-20, BE-30, BE-33: leer() empieza con SET TRANSACTION READ ONLY, queda en repeatable read y solo lectura con la zona y el hoy de prueba, y una escritura dentro falla con 25006', async () => {
    sentencias = [];
    const r = await tx.leer(
      async (t) => {
        const [s] = await txPrisma(t).$queryRaw<{ iso: string; ro: string; zona: string }[]>`
        SELECT current_setting('transaction_isolation') AS iso,
          current_setting('transaction_read_only') AS ro, current_setting('TimeZone') AS zona`;
        return { estado: t.estado, sesion: s };
      },
      { reloj: RELOJ },
    );
    const nuestras = sentencias.filter(
      (q) => !/^(BEGIN|COMMIT|SET TRANSACTION ISOLATION)/i.test(q),
    );
    expect(nuestras[0]).toBe('SET TRANSACTION READ ONLY');
    expect(nuestras[1]).toMatch(/^SELECT set_config\('TimeZone', 'UTC', true\)/);
    expect(nuestras[2]).toMatch(/^SELECT valor::text AS revision, finn.hoy\(\)::text AS hoy/);
    expect(r.sesion).toEqual({ iso: 'repeatable read', ro: 'on', zona: 'UTC' });
    expect(r.estado.hoy).toBe(HOY);
    expect(r.estado.revision).toMatch(/^\d+$/);
    const e = await fallo(
      tx.leer(async (t) => {
        await txPrisma(t).$executeRaw`SELECT finn.tomar_bloqueo()`;
        await txPrisma(t).deudor.create({ data: { nombre: 'ESQ-006' } });
      }),
    );
    expect(sqlstate(e)).toBe('25006');
    expect(await deudores('ESQ-006')).toBe(0);
  });

  it('PRU-INT-ESQ-007 [V-08] BE-12, BE-27, ADR-06: con dos escritores, el segundo espera el bloqueo y después ve lo que confirmó el primero, con la revisión siguiente y un instante posterior', async () => {
    const soltar = puerta();
    const primero = tx.escribir(async (t) => {
      await crearDeudor(t, 'ESQ-007');
      await soltar.esperar;
      return { estado: t.estado, despues: await t.revisionActual() };
    });
    // El primero ya tiene el bloqueo cuando el segundo lo pide
    await esperarBloqueo(true);
    const segundo = tx.escribir(async (t) => ({
      estado: t.estado,
      vistos: await txPrisma(t).deudor.count({ where: { nombre: 'ESQ-007' } }),
    }));
    await esperarBloqueo(false);
    soltar.abrir();
    const [a, b] = await Promise.all([primero, segundo]);
    expect(b.vistos).toBe(1);
    expect(b.estado.revision).toBe(a.despues);
    expect(b.estado.instante > a.estado.instante).toBe(true);
  });

  it('PRU-INT-ESQ-008 [V-09] BE-12, ADR-06: contraste, en REPEATABLE READ con el bloqueo primero el segundo escritor no ve lo que confirmó el primero; por eso escribir() usa READ COMMITTED', async () => {
    const soltar = puerta();
    const primero = tx.escribir(async (t) => {
      await crearDeudor(t, 'ESQ-008');
      await soltar.esperar;
    });
    await esperarBloqueo(true);
    const rr = new pg.Client({ connectionString: base.url });
    await rr.connect();
    try {
      await rr.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
      const bloqueo = rr.query('SELECT finn.tomar_bloqueo()');
      await esperarBloqueo(false);
      soltar.abrir();
      await primero;
      await bloqueo;
      const { rows } = await rr.query<{ n: string }>(
        "SELECT count(*) AS n FROM finn.deudores WHERE nombre = 'ESQ-008'",
      );
      // La instantánea se tomó al empezar la sentencia del bloqueo, antes de esperarlo
      expect(rows[0]?.n).toBe('0');
    } finally {
      await rr.query('ROLLBACK');
      await rr.end();
    }
    expect(await deudores('ESQ-008')).toBe(1);
  });
});
