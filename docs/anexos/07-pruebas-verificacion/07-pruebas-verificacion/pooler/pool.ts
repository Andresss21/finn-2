// V7-05 / PRU-INT-POOL (prototipo): patrón transaccional de 04 §4.2 detrás de PgBouncer en modo transacción,
// sin sentencias preparadas (max_prepared_statements = 0), con controles negativos.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../generado/prisma/client.ts';
import pg from 'pg';
const URL_POOL = 'postgresql://finn_app:a@127.0.0.1:6432/finn_v7?pgbouncer=true';
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: URL_POOL, max: 3 }) });
const RC = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 20000, maxWait: 5000 };
const res: [string, string, boolean][] = [];
const ok = (n: string, d: string, b: boolean) => res.push([n, d, b]);
async function escribir<T>(f: (tx: any) => Promise<T>) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    await tx.$executeRaw`SELECT set_config('TimeZone','UTC',true), set_config('finn.hoy','2027-02-05',true)`;
    return f(tx);
  }, RC);
}
// 1. 50 escrituras seguidas en el mismo pool
let errores = 0; const t0 = performance.now();
for (let i = 0; i < 50; i++) {
  try { await escribir(async tx => { await tx.deudor.create({ data: { nombre: `Pool ${Date.now()}-${i}` } }); const [r] = await tx.$queryRaw<any[]>`SELECT EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid() AND objid = 1179209294 AND granted) b, current_setting('TimeZone') z`; if (!r.b || r.z !== 'UTC') throw new Error('estado'); }); }
  catch (e) { errores++; if (errores === 1) console.error(e); }
}
ok('POOL-01 50 escrituras con bloqueo + SET LOCAL + Prisma', `${errores} errores, ${(performance.now() - t0).toFixed(0)} ms`, errores === 0);
// 2. Sin fugas de estado de transacción
const fugas = await Promise.all([1, 2, 3, 4, 5, 6].map(() => db.$transaction(async tx => (await tx.$queryRaw<any[]>`SELECT coalesce(current_setting('finn.hoy', true),'') h, current_setting('TimeZone') z, EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid() AND objid = 1179209294 AND granted) b`)[0])));
ok('POOL-02 transacciones siguientes sin finn.hoy, sin UTC forzado y sin bloqueo', JSON.stringify(fugas.map(f => `${f.h || '∅'}/${f.b}`)), fugas.every(f => f.h === '' && !f.b));
// 3. Control negativo A: SET de sesión (sin LOCAL) se fuga a otro cliente
const c1 = new pg.Client({ connectionString: URL_POOL }), c2 = new pg.Client({ connectionString: URL_POOL }); await c1.connect(); await c2.connect();
await c1.query(`SET finn.operacion = 'fusion'`);
const vistos = new Set<string>(); for (let i = 0; i < 8; i++) vistos.add((await c2.query(`SELECT coalesce(current_setting('finn.operacion', true),'') o`)).rows[0].o || '∅');
ok('POOL-03 control: SET de sesión se ve desde otro cliente (la suite lo detecta)', [...vistos].join(','), vistos.has('fusion'));
await c1.query(`RESET finn.operacion`);
// 4. Control negativo B: bloqueo asesor de sesión queda tomado y otro cliente "lo tiene"
await c1.query(`SELECT pg_advisory_lock(1179209294)`);
const tiene = new Set<string>(); for (let i = 0; i < 8; i++) tiene.add(String((await c2.query(`SELECT EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid() AND objid = 1179209294 AND granted) b`)).rows[0].b));
// tiene_bloqueo() (03 §4.1) consulta exactamente esto
ok('POOL-04 control: bloqueo de sesión → otro cliente pasa tiene_bloqueo() sin tomarlo', [...tiene].join(','), tiene.has('true'));
await c1.query(`SELECT pg_advisory_unlock_all()`);
// 5. Control negativo C: sentencia preparada con nombre, con 4 clientes en paralelo sobre 2 conexiones de servidor
let err5 = '';
const cs = await Promise.all([1, 2, 3, 4].map(async () => { const c = new pg.Client({ connectionString: URL_POOL }); await c.connect(); return c; }));
await Promise.all(cs.map(async (c, k) => { try { for (let i = 0; i < 25; i++) await c.query({ name: 'q_rev' + k, text: 'SELECT valor, pg_sleep(0.002) FROM finn.revision' }); } catch (e: any) { err5 ||= `${e.code} ${e.message}`; } }));
await Promise.all(cs.map(c => c.end().catch(() => {})));
ok('POOL-05 control: sentencia preparada con nombre falla en modo transacción', err5 || 'no falló', err5 !== '');
await c1.end(); await c2.end(); await db.$disconnect();
for (const [n, d, b] of res) console.log(`${b ? 'PASA' : 'FALLA'}  ${n}: ${d}`);
process.exit(res.every(r => r[2]) ? 0 : 1);
