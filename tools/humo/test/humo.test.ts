// Prueba de humo contra un PostgreSQL local (TA-250; 04 §17.1 a §17.3; 07 §19.1, nivel SEG). Un contenedor de
// PG_MAYOR vacío con los roles que trae Supabase (tools/pruebas/roles-supabase.sql) hace de proyecto: `humo.sh`
// corre ahí el bootstrap (H-02), las migraciones (H-05), el patrón transaccional de patron.ts (H-06, TA-243) y el
// respaldo con su restauración en otro contenedor (H-08). Los dos puertos del pooler son el del contenedor (sin Supavisor ni
// `<rol>.<ref>`) y la Data API es un servidor HTTP local que responde 404 (H-11). Todas las variables secretas
// llevan valores de prueba reconocibles, que se buscan en stdout y stderr. psql y pg_dump corren dentro de los
// contenedores con `tools/respaldo/test/pg-docker.mjs`, como en PRU-RES-RESP-101.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pgMayor } from '../../../packages/db/test/ayudantes/base.ts';

const raiz = fileURLToPath(new URL('../../../', import.meta.url)).replaceAll('\\', '/');
// Valores de prueba: existen solo en este contenedor efímero y en esta prueba
const SECRETOS = {
  admin: 'humoAdminZq81',
  servicio: 'humo_servicio_secreto_Zq82',
  vercel: 'humoVercelZq83',
  migraciones: 'humoMigracionesZq84',
  app: 'humoAppZq85',
  respaldo: 'humoRespaldoZq86',
  destino: 'humoDestinoZq87',
} as const;
const PASOS = [
  'H-01',
  'H-02',
  'H-03',
  'H-04',
  'H-05',
  'H-06',
  'H-07',
  'H-08',
  'H-09',
  'H-10',
  'H-11',
  'H-12',
];

type Linea = { paso: string; resultado: string; medido: Record<string, unknown>; detalle: string };

let contenedor = '';
let puerto = '';
let api: Server | undefined;
let urlApi = '';

const docker = (...args: string[]): string => {
  const r = spawnSync('docker', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`docker ${args[0] ?? ''}: ${r.stderr}`);
  return r.stdout.trim();
};

beforeAll(async () => {
  // Publicado en todas las interfaces: el contenedor de restauración de H-08 lo alcanza por host.docker.internal
  contenedor = docker(
    'run',
    ...['-d', '--rm', '-e', `POSTGRES_PASSWORD=${SECRETOS.admin}`, '-p', '5432'],
    `public.ecr.aws/docker/library/postgres:${pgMayor()}`,
  );
  let listo = false;
  for (let i = 0; i < 600 && !listo; i++)
    listo =
      spawnSync('docker', ['exec', contenedor, 'pg_isready', '-q', '-h', '127.0.0.1']).status === 0;
  if (!listo) throw new Error('el PostgreSQL de la prueba de humo no quedó listo');
  puerto = docker('port', contenedor, '5432/tcp').split('\n')[0]?.split(':').pop() ?? '';
  const roles = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      contenedor,
      'psql',
      '-U',
      'postgres',
      '-X',
      '-q',
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      '-',
    ],
    { input: readFileSync(`${raiz}tools/pruebas/roles-supabase.sql`), encoding: 'utf8' },
  );
  if (roles.status !== 0) throw new Error(`roles-supabase.sql: ${roles.stderr}`);
  // La Data API desactivada: no responde datos
  api = createServer((_pet, res) => {
    res.writeHead(404).end('{"message":"no disponible"}');
  });
  await new Promise<void>((listo2) => api?.listen(0, '127.0.0.1', listo2));
  urlApi = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
}, 600_000);

afterAll(async () => {
  if (contenedor) docker('rm', '-f', contenedor);
  await new Promise<void>((fin) => {
    if (api)
      api.close(() => {
        fin();
      });
    else fin();
  });
});

/** `bash tools/humo/humo.sh` con las variables de la sesión; sin bloquear el proceso (la Data API es de aquí). */
function humo(
  extra: Record<string, string>,
): Promise<{ codigo: number | null; stdout: string; stderr: string }> {
  const env = {
    ...process.env,
    HUMO_ADMIN_URL: `postgresql://postgres:${SECRETOS.admin}@localhost:${puerto}/postgres`,
    HUMO_REF: '',
    HUMO_POOLER_HOST: 'localhost',
    HUMO_PUERTO_TX: puerto,
    HUMO_PUERTO_SESION: puerto,
    SUPABASE_URL: urlApi,
    HUMO_CLAVE_PUBLICA: 'clave-publica-de-prueba',
    SUPABASE_SERVICE_ROLE: SECRETOS.servicio,
    VERCEL_TOKEN: SECRETOS.vercel,
    HUMO_CLAVE_MIGRACIONES: SECRETOS.migraciones,
    HUMO_CLAVE_APP: SECRETOS.app,
    HUMO_CLAVE_RESPALDO: SECRETOS.respaldo,
    HUMO_CLAVE_DESTINO: SECRETOS.destino,
    FINN_PG_EXEC: `node ${raiz}tools/respaldo/test/pg-docker.mjs`,
    FINN_PG_CONTENEDOR: contenedor,
    FINN_PG_DESTINO_PUERTO: puerto,
    ...extra,
  };
  return new Promise((fin, falla) => {
    const h = spawn('bash', ['tools/humo/humo.sh'], {
      cwd: raiz,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const o: string[] = [];
    const e: string[] = [];
    h.stdout.on('data', (d: Buffer) => o.push(d.toString()));
    h.stderr.on('data', (d: Buffer) => e.push(d.toString()));
    h.on('error', falla);
    h.on('close', (codigo) => {
      fin({ codigo, stdout: o.join(''), stderr: e.join('') });
    });
  });
}

const lineas = (stdout: string): Linea[] =>
  stdout
    .split('\n')
    .filter((l) => l !== '')
    .map((l) => JSON.parse(l) as Linea);

const sinSecretos = (texto: string): void => {
  for (const [nombre, valor] of Object.entries(SECRETOS))
    expect(texto, nombre).not.toContain(valor);
};

// Una sola ejecución completa, que comparten las pruebas que la miran: cada una la pide y ninguna depende del orden
let completa: ReturnType<typeof humo> | undefined;
const humoCompleto = (): ReturnType<typeof humo> => (completa ??= humo({}));

/** SQL como `postgres` dentro del contenedor; con el bloqueo de Finn cuando escribe en una tabla [M]. */
const sql = (consulta: string): string => {
  const r = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      contenedor,
      'psql',
      '-U',
      'postgres',
      '-X',
      '-q',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: consulta, encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(`psql: ${r.stderr}`);
  return r.stdout.trim();
};

describe('PRU-SEG-OPER', () => {
  it('PRU-SEG-OPER-103 HUMO-base: humo.sh contra una base local con el bootstrap: cada paso de H-01 a H-12 emite una línea JSON { paso, resultado, medido, detalle }, H-01 a H-05, H-07, H-08, H-11 y H-12 pasan (H-06 tiene su propia prueba, TA-243), H-09 y H-10 (TA-253) quedan omitidos, y ninguna línea de stdout ni de stderr contiene el valor de una variable secreta; control: un error de psql que nombra un secreto sale tapado', async () => {
    const r = await humoCompleto();
    const salida = `${r.stdout}\n${r.stderr}`;
    sinSecretos(salida);
    const ls = lineas(r.stdout);
    expect(ls.map((l) => l.paso)).toEqual(PASOS);
    for (const l of ls) {
      expect(Object.keys(l).sort(), l.paso).toEqual(['detalle', 'medido', 'paso', 'resultado']);
      expect(typeof l.detalle, l.paso).toBe('string');
      expect(typeof l.medido.ms, l.paso).toBe('number');
    }
    const resultado = Object.fromEntries(ls.map((l) => [l.paso, `${l.resultado} ${l.detalle}`]));
    // H-06 ya no queda omitido: lo mira la prueba de TA-243
    for (const p of PASOS.filter((x) => !['H-06', 'H-09', 'H-10'].includes(x)))
      expect(resultado[p], p).toMatch(/^pasa /);
    expect(resultado['H-09']).toMatch(/^omitido .*TA-253/);
    expect(resultado['H-10']).toMatch(/^omitido .*TA-253/);
    const medido = Object.fromEntries(ls.map((l) => [l.paso, l.medido]));
    expect(medido['H-01']).toMatchObject({ mayor: pgMayor() });
    expect(String(medido['H-08']?.['conteos'])).toMatch(/ 0 diferencias$/);
    expect(medido['H-07']).toMatchObject({ transaccion: 'UTC' });
    expect(r.stderr).toBe('');
    expect(r.codigo).toBe(0);

    // Control: la base inexistente se llama como la clave de servicio; psql la nombra en su error
    const c = await humo({
      HUMO_PASOS: 'H-01',
      HUMO_ADMIN_URL: `postgresql://postgres:${SECRETOS.admin}@localhost:${puerto}/${SECRETOS.servicio}`,
    });
    sinSecretos(`${c.stdout}\n${c.stderr}`);
    const [h01, ...resto] = lineas(c.stdout);
    expect(resto).toEqual([]);
    expect(h01).toMatchObject({ paso: 'H-01', resultado: 'falla' });
    expect(h01?.detalle).toContain('***');
    expect(c.codigo).toBe(1);
  }, 900_000);

  it('PRU-SEG-OPER-106 HUMO-patron: humo.sh contra el contenedor local: H-06 (patron.ts por el puerto de transacción con pgbouncer=true) pasa, con el resultado de V-01, V-02, V-05 a V-08, V-10, V-11, las 50 escrituras y la limpieza en medido; la limpieza borra exactamente las 56 filas que escribió (una fila humo-patron ajena queda) y la salida sigue sin secretos', async () => {
    const r = await humoCompleto();
    sinSecretos(`${r.stdout}\n${r.stderr}`);
    expect(r.stderr).toBe('');
    const h06 = lineas(r.stdout).find((l) => l.paso === 'H-06');
    expect(h06, JSON.stringify(h06)).toMatchObject({ resultado: 'pasa', detalle: '' });
    const m = h06?.medido ?? {};
    expect(m).toMatchObject({
      'V-01': 'P2039 FN001',
      'V-02': 'revision +1',
      'V-06': 'P2002 23505 deudores_pkey',
      'V-07': 'repeatable read, read only, 25006',
      'V-11': 'sin SAVEPOINT, read committed',
      escrituras: '50',
      limpieza: '56 filas, 56 marcas en finn.eliminaciones',
    });
    expect(String(m['V-05'])).toMatch(/^sin filtrar \(\d+ lecturas\)$/);
    expect(String(m['V-08'])).toMatch(/^vio lo confirmado tras \d+ ms$/);
    // lock_timeout de finn.tomar_bloqueo(): una duración medida, no una espera de la prueba
    const v10 = /^P2010 55P03 a los (\d+) ms$/.exec(String(m['V-10']));
    expect(Number(v10?.[1])).toBeGreaterThanOrEqual(9_500);
    expect(sql("SELECT count(*) FROM finn.deudores WHERE nombre LIKE 'humo-%'")).toBe('0');

    // Control: una fila con el mismo prefijo que patron.ts no escribió sigue ahí después de otra ejecución de H-06
    const ajena = sql(`BEGIN; SELECT finn.tomar_bloqueo();
      INSERT INTO finn.deudores (nombre) VALUES ('humo-patron ajena') RETURNING id; COMMIT;`);
    const otra = await humo({ HUMO_PASOS: 'H-06' });
    sinSecretos(`${otra.stdout}\n${otra.stderr}`);
    const [h06b, ...resto] = lineas(otra.stdout);
    expect(resto).toEqual([]);
    expect(h06b?.medido).toMatchObject({ limpieza: '56 filas, 56 marcas en finn.eliminaciones' });
    expect(
      sql("SELECT string_agg(id::text, ',') FROM finn.deudores WHERE nombre LIKE 'humo-%'"),
    ).toBe(ajena);
    sql(`BEGIN; SELECT finn.tomar_bloqueo();
      DELETE FROM finn.deudores WHERE id = '${ajena}'; COMMIT;`);
    expect(otra.codigo).toBe(0);
  }, 900_000);
});
