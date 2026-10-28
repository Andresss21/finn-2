// PRU-INT-POOL (TA-059; 07 §5.3, §19.5; 04 §4.4, V-05; CH-05, CT-06): el patrón transaccional de 04 §4.2
// detrás de PgBouncer en modo transacción, sin sentencias preparadas y con 2 conexiones de servidor (V7-05).
// Portado de docs/anexos/07-pruebas-verificacion/07-pruebas-verificacion/pooler/pool.ts y pool04/correr.sh.
// Diferencia con el prototipo: en vez de repetir y esperar que el azar del pool junte a dos clientes en la misma
// conexión de servidor, `conLibre` retiene la otra conexión y fija dónde cae cada transacción (07 §7.1).
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { consultar, crearBasePrueba } from './ayudantes/base.ts';
import {
  clientePrisma,
  conCliente,
  conLibre,
  levantarPgBouncer,
  type ClientePrisma,
  type Tx,
} from './ayudantes/pgbouncer.ts';

const HOY = '2027-02-05';
// Zona de la base distinta de UTC: así "la zona forzada no se filtra" no pasa por casualidad (H-07)
const ZONA = 'America/El_Salvador';
const RC = { isolationLevel: 'ReadCommitted', timeout: 20_000, maxWait: 5_000 };

type Estado = { pid: number; bloqueo: boolean; marca: boolean; zona: string; hoy: string; op: string };

/** SQLSTATE de un error de `pg` o de Prisma (P2039 lo lleva en meta.driverAdapterError.cause, 04 V-01). */
const sqlstate = (e: unknown): string | undefined => {
  const x = e as {
    code?: string;
    meta?: { driverAdapterError?: { cause?: { originalCode?: string } } };
    cause?: { originalCode?: string };
  };
  return x.meta?.driverAdapterError?.cause?.originalCode ?? x.cause?.originalCode ?? x.code;
};
const error = (p: Promise<unknown>): Promise<unknown> =>
  p.then(
    () => undefined,
    (e: unknown) => e,
  );

describe('PRU-INT-POOL', () => {
  const base = crearBasePrueba();
  // PRU-INT-POOL-004 necesita conexiones de servidor que nunca vieron la marca: su propia base, su propio pool
  const base004 = crearBasePrueba();
  const pool = levantarPgBouncer(base);
  let db: ClientePrisma;
  let clave = '';

  beforeAll(async () => {
    // Antes de la primera conexión por el pooler: las conexiones de servidor nacen con esta zona
    await consultar(base.urlAdmin, `ALTER DATABASE ${base.nombre} SET TimeZone = '${ZONA}'`);
    [clave = ''] = await consultar(base.urlAdmin, 'SELECT finn.clave_bloqueo()');
    db = await clientePrisma(pool.url);
  });
  afterAll(async () => {
    await db.$disconnect();
  });

  /** El estado de la conexión de servidor en la transacción en curso. */
  const estado = async (tx: Tx): Promise<Estado> =>
    (
      await tx.$queryRaw<Estado[]>`SELECT pg_backend_pid() AS pid,
        EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()
          AND objid::text = ${clave} AND granted) AS bloqueo,
        coalesce(current_setting('finn.bloqueo_xact', true), '') = pg_current_xact_id()::text AS marca,
        current_setting('TimeZone') AS zona,
        coalesce(current_setting('finn.hoy', true), '') AS hoy,
        coalesce(current_setting('finn.operacion', true), '') AS op`
    )[0]!;

  /** El patrón de escritura de 04 §4.2: READ COMMITTED, bloqueo primero y ajustes locales de la transacción. */
  const escribir = <T>(fn: (tx: Tx) => Promise<T>): Promise<T> =>
    db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
      await tx.$executeRaw`SELECT set_config('TimeZone', 'UTC', true), set_config('finn.hoy', ${HOY}, true)`;
      return fn(tx);
    }, RC);

  it('PRU-INT-POOL-001 P7-2, CH-05 (V7-05, POOL-01): 50 escrituras seguidas con Prisma 7, adapter-pg y pgbouncer=true, cada una con bloqueo, set_config local y escritura, sin errores y con la revisión +50', async () => {
    const revision = async (): Promise<bigint> =>
      (
        await db.$transaction((tx) =>
          tx.$queryRaw<{ valor: bigint }[]>`SELECT valor FROM finn.revision WHERE id = 1`,
        )
      )[0]!.valor;
    const antes = await revision();
    const vistos: Estado[] = [];
    for (let i = 0; i < 50; i++)
      vistos.push(
        await escribir(async (tx) => {
          await tx.deudor.create({ data: { nombre: `POOL-001 ${i}` } });
          return estado(tx);
        }),
      );
    for (const e of vistos)
      expect(e).toMatchObject({ bloqueo: true, marca: true, zona: 'UTC', hoy: HOY });
    // Prisma abre hasta 3 conexiones de cliente; el pooler las sirve con 2 de servidor
    expect(new Set(vistos.map((e) => e.pid)).size).toBeLessThanOrEqual(2);
    expect((await revision()) - antes).toBe(50n);
    const [filas] = await consultar(
      base.urlAdmin,
      "SELECT count(*) FROM finn.deudores WHERE nombre LIKE 'POOL-001 %'",
    );
    expect(filas).toBe('50');
  });

  it('PRU-INT-POOL-002 P7-2, CH-05, H-07 (V7-05, POOL-02): las 6 transacciones siguientes en la misma conexión de servidor no ven finn.hoy, ni la zona UTC forzada, ni el bloqueo, ni la marca', async () => {
    // H-07, primer caso: sin ajuste, la sesión tiene la zona de la base
    const sinAjuste = await conCliente(pool.url, async (c) =>
      String((await c.query<{ TimeZone: string }>('SHOW TimeZone')).rows[0]?.TimeZone),
    );
    expect(sinAjuste).toBe(ZONA);
    // H-07, tercer caso: dentro de la transacción, después de set_config('TimeZone', 'UTC', true)
    const dentro = await escribir(async (tx) => {
      await tx.deudor.create({ data: { nombre: 'POOL-002' } });
      return estado(tx);
    });
    expect(dentro).toMatchObject({ bloqueo: true, marca: true, zona: 'UTC', hoy: HOY });
    const despues = await conLibre(
      pool.url,
      (p) => p === dentro.pid,
      async () => {
        const r: Estado[] = [];
        for (let i = 0; i < 6; i++) r.push(await db.$transaction(estado, RC));
        return r;
      },
    );
    expect(despues).toEqual(
      Array.from({ length: 6 }, () => ({
        pid: dentro.pid,
        bloqueo: false,
        marca: false,
        zona: ZONA,
        hoy: '',
        op: '',
      })),
    );
  });

  it('PRU-INT-POOL-003 P7-2, CH-05 (V7-05, POOL-03): control, un SET de sesión sin LOCAL queda en la conexión de servidor y lo ve otro cliente', async () => {
    const pid = await conCliente(pool.url, async (c1) => {
      // Una sola consulta: el SET y el pid salen de la misma conexión de servidor
      const r = (await c1.query(
        "SET finn.operacion = 'fusion'; SELECT pg_backend_pid() AS pid",
      )) as unknown as pg.QueryResult<{ pid: number }>[];
      return r[1]!.rows[0]!.pid;
    });
    const { visto, limpio } = await conLibre(
      pool.url,
      (p) => p === pid,
      () =>
        conCliente(pool.url, async (c2) => {
          const leer = async (): Promise<{ pid: number; op: string }> =>
            (
              await c2.query<{ pid: number; op: string }>(
                "SELECT pg_backend_pid() AS pid, coalesce(current_setting('finn.operacion', true), '') AS op",
              )
            ).rows[0]!;
          const v = await leer();
          await c2.query('RESET finn.operacion');
          return { visto: v, limpio: await leer() };
        }),
    );
    // La suite detecta el riesgo: el ajuste de c1 se filtró a c2
    expect(visto).toEqual({ pid, op: 'fusion' });
    expect(limpio).toEqual({ pid, op: '' });
  });

  it('PRU-INT-POOL-004 P7-2, CH-05, CT-06 (V7-05, V7-14, POOL-04): un bloqueo de sesión olvidado queda en la conexión de servidor; otro cliente que escribe sin tomar_bloqueo() es rechazado con FN001, sin marca y con una marca falsa', async () => {
    const pool004 = pool.urlDe(base004.nombre);
    const [clave004 = ''] = await consultar(base004.urlAdmin, 'SELECT finn.clave_bloqueo()');
    const leer = `SELECT pg_backend_pid() AS pid, current_setting('finn.bloqueo_xact', true) AS marca,
      EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()
        AND objid::text = '${clave004}' AND granted) AS bloqueo`;
    type Leido = { pid: number; marca: string | null; bloqueo: boolean };
    // El cliente A toma un bloqueo DE SESIÓN y se va: el bloqueo queda en esa conexión de servidor
    const pid = await conCliente(pool004, async (a) => {
      const r = await a.query<{ pid: number }>(
        'SELECT pg_advisory_lock($1::bigint), pg_backend_pid() AS pid',
        [clave004],
      );
      return r.rows[0]!.pid;
    });
    const r = await conLibre(
      pool004,
      (p) => p === pid,
      () =>
        conCliente(pool004, async (b) => {
          const intentar = async (marca: string): Promise<{ leido: Leido; error: unknown }> => {
            await b.query('BEGIN');
            if (marca) await b.query("SELECT set_config('finn.bloqueo_xact', $1, true)", [marca]);
            const leido = (await b.query<Leido>(leer)).rows[0]!;
            const e = await error(
              b.query("INSERT INTO finn.deudores (nombre) VALUES ('POOL-004 sin tomar_bloqueo')"),
            );
            await b.query('ROLLBACK');
            return { leido, error: e };
          };
          const sinMarca = await intentar('');
          const marcaFalsa = await intentar('1');
          // El flujo normal pasa en la misma conexión
          await b.query('BEGIN');
          await b.query('SELECT finn.tomar_bloqueo()');
          await b.query("INSERT INTO finn.deudores (nombre) VALUES ('POOL-004 con tomar_bloqueo')");
          await b.query('COMMIT');
          // Limpieza: se suelta el bloqueo olvidado
          await b.query('SELECT pg_advisory_unlock_all()');
          const alFinal = (await b.query<Leido>(leer)).rows[0]!;
          return { sinMarca, marcaFalsa, alFinal };
        }),
    );
    // Control: la conexión tiene el bloqueo en pg_locks; sin la marca de CT-06, tiene_bloqueo() lo aceptaría
    expect(r.sinMarca.leido).toEqual({ pid, marca: null, bloqueo: true });
    expect(sqlstate(r.sinMarca.error)).toBe('FN001');
    expect(r.marcaFalsa.leido).toEqual({ pid, marca: '1', bloqueo: true });
    expect(sqlstate(r.marcaFalsa.error)).toBe('FN001');
    expect(r.alFinal).toMatchObject({ pid, bloqueo: false });
    const filas = await consultar(base004.urlAdmin, 'SELECT nombre FROM finn.deudores');
    expect(filas).toEqual(['POOL-004 con tomar_bloqueo']);
  });

  it('PRU-INT-POOL-005 P7-2, CH-05 (V7-05, POOL-05): control, una sentencia preparada con nombre funciona en su conexión de servidor y falla con 26000 en la otra', async () => {
    await conCliente(pool.url, async (a) => {
      const q = { name: 'pool_005', text: 'SELECT pg_backend_pid() AS pid' };
      // Primera vez: Parse con nombre en la conexión de servidor `pid`
      const pid = (await a.query<{ pid: number }>(q)).rows[0]!.pid;
      const misma = await conLibre(
        pool.url,
        (p) => p === pid,
        async () => (await a.query<{ pid: number }>(q)).rows[0]!.pid,
      );
      expect(misma).toBe(pid);
      // `pg` ya no manda el Parse; en la otra conexión de servidor la sentencia no existe
      const e = await conLibre(
        pool.url,
        (p) => p !== pid,
        () => error(a.query(q)),
      );
      expect(sqlstate(e)).toBe('26000');
    });
  });

  it('PRU-INT-POOL-006 [V-05] P7-2, CH-05, BE-14: set_config(finn.operacion, fusion, true) habilita la excepción de inv. 18 dentro de la transacción y no se filtra a las 6 transacciones siguientes de la misma conexión de servidor', async () => {
    const periodo = (d: string): Date => new Date(`${d}T00:00:00Z`);
    const categoriaId = await escribir(async (tx) => {
      const [g] = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO finn.grupos (nombre) VALUES ('POOL-006') RETURNING id::text`;
      const [c] = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO finn.categorias (grupo_id, nombre) VALUES (${g!.id}::uuid, 'POOL-006') RETURNING id::text`;
      return c!.id;
    });
    const asignar = (tx: Tx, d: string) =>
      tx.asignacion.create({ data: { categoriaId, periodoInicio: periodo(d), monto: 10 } });
    // Con hoy = 2027-02-05 y el ciclo del día 21, 2026-12-21 y 2026-11-21 son períodos cerrados
    const sinOperacion = await error(escribir((tx) => asignar(tx, '2026-12-21')));
    expect(sqlstate(sinOperacion)).toBe('FN002');
    const fusion = await escribir(async (tx) => {
      await tx.$executeRaw`SELECT set_config('finn.operacion', 'fusion', true)`;
      await asignar(tx, '2026-12-21');
      return estado(tx);
    });
    expect(fusion.op).toBe('fusion');
    const despues = await conLibre(
      pool.url,
      (p) => p === fusion.pid,
      async () => {
        const vistos: Estado[] = [];
        for (let i = 0; i < 6; i++) vistos.push(await db.$transaction(estado, RC));
        // Y la excepción ya no rige en esa conexión: la misma escritura vuelve a ser rechazada
        const otra = await error(escribir((tx) => asignar(tx, '2026-11-21')));
        return { vistos, otra };
      },
    );
    expect(despues.vistos.map((e) => [e.pid, e.op])).toEqual(
      Array.from({ length: 6 }, () => [fusion.pid, '']),
    );
    expect(sqlstate(despues.otra)).toBe('FN002');
  });
});
