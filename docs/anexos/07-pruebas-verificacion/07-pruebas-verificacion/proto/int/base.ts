// Prototipo del ayudante de integración (V7-01): una base por archivo, clonada de la plantilla
// ya migrada y verificada (C3–C6), marcada como base de prueba y con el reloj simulado instalado.
import pg from 'pg';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const HOST = '127.0.0.1', PORT = 5433;
const admin = () => new pg.Client({ host: HOST, port: PORT, user: 'postgres', database: 'postgres' });
export async function crearBase(plantilla = 'finn_v7') {
  const nombre = 'finn_t_' + randomBytes(4).toString('hex');
  const t0 = performance.now();
  const a = admin(); await a.connect();
  await a.query(`CREATE DATABASE ${nombre} TEMPLATE ${plantilla}`);
  await a.query(`ALTER DATABASE ${nombre} SET finn.reloj_simulado = 'on'`);
  await a.end();
  execFileSync('psql', ['-h', '/tmp', '-p', String(PORT), '-U', 'finn_migraciones', '-d', nombre, '-qAtX', '-v', 'ON_ERROR_STOP=1',
    '-f', '/home/claude/v7/repo/tools/pruebas/reloj-simulado.sql']);
  const ms = performance.now() - t0;
  const conectar = (user = 'finn_app', password = 'a') => { const c = new pg.Client({ host: HOST, port: PORT, user, password, database: nombre }); return c.connect().then(() => c); };
  const destruir = async () => { const b = admin(); await b.connect(); await b.query(`DROP DATABASE ${nombre} WITH (FORCE)`); await b.end(); };
  return { nombre, ms, conectar, destruir };
}
/** escribir(): protocolo de 04 §4.2 reducido (bloqueo, zona UTC, hoy y desfase simulados). */
export async function escribir<T>(c: pg.Client, hoy: string | null, f: (c: pg.Client) => Promise<T>): Promise<T> {
  await c.query('BEGIN ISOLATION LEVEL READ COMMITTED');
  try {
    await c.query('SELECT finn.tomar_bloqueo()');
    await c.query(`SELECT set_config('TimeZone','UTC',true)`);
    if (hoy) await c.query(`SELECT set_config('finn.hoy',$1,true), set_config('finn.desfase_ms', (round(extract(epoch FROM ($1::date + time '12:00' AT TIME ZONE 'America/El_Salvador' - now()))*1000))::text, true)`, [hoy]);
    const r = await f(c); await c.query('COMMIT'); return r;
  } catch (e) { await c.query('ROLLBACK'); throw e; }
}
