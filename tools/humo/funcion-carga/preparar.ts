// tools/humo/funcion-carga/preparar.ts — lo que h09.sh necesita alrededor de la función de carga (04 §17.2, BE-58).
// Node 24 lo corre sin transformar. Subcomandos, todos por stdin y stdout:
//   semilla      el SQL del esquema `humo`: copias de las 18 tablas [M] sin triggers ni restricciones
//                (`CREATE TABLE humo.x (LIKE finn.x)`, sin NOT NULL) con el volumen alto a 10 años del generador
//                de TA-156 (07 §12.7) por COPY, y SELECT para finn_app
//   cuerpo       el cuerpo del POST: { url: $HUMO_CARGA_URL, consultas: las de 04 §5.2 sobre `humo`, veces: 10 }
//   despliegue   el cuerpo de POST /v13/deployments de Vercel: la función con $HUMO_LLAVE, `pg` y la región iad1
//   local        lee el cuerpo y responde como la función, sin desplegar (solo la prueba: FINN_HUMO_FUNCION_LOCAL)
//   informe      lee la respuesta y escribe `medido …` y `detalle …`; sale con 1 si el p95 pasa de 500 ms
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';

// El código de @finn/db y @finn/dominio importa sin extensión (como en patron.ts)
registerHooks({
  resolve(especificador, contexto, siguiente) {
    try {
      return siguiente(especificador, contexto);
    } catch (e) {
      if (
        !especificador.startsWith('.') ||
        (e as { code?: string }).code !== 'ERR_MODULE_NOT_FOUND'
      )
        throw e;
      for (const sufijo of ['.ts', '/index.ts'])
        try {
          return siguiente(especificador + sufijo, contexto);
        } catch {
          // probar el siguiente sufijo
        }
      throw e;
    }
  },
});

/** El volumen de H-09: alto a 10 años (04 §5.6), con una semilla fija. */
export const VOLUMEN = { nivel: 'alto', anios: 10, semilla: 253 } as const;
const PRESUPUESTO_MS = 500; // 02 §2.3
const VECES = 10;
const FUNCION = new URL('api/carga.mjs', import.meta.url);
const PG = '8.23.1'; // la de @finn/db

const entrada = (): string => readFileSync(0, 'utf8');
const camel = (c: string): string => c.replace(/_([a-z0-9])/g, (_, x: string) => x.toUpperCase());
// COPY en formato de texto
const ESCAPE: Record<string, string> = { '\\': '\\\\', '\t': '\\t', '\n': '\\n', '\r': '\\r' };
function celda(v: unknown): string {
  if (v === null || v === undefined) return '\\N';
  if (typeof v === 'boolean') return v ? 't' : 'f';
  const t = typeof v === 'string' ? v : JSON.stringify(v);
  return t.replace(/[\\\t\n\r]/g, (c) => ESCAPE[c] ?? c);
}

async function semilla(): Promise<string> {
  const { generarHechos, TABLAS_MOTOR } = await import('../../pruebas/volumen/generar.ts');
  const { COLUMNAS_CARGADAS } = await import('../../../packages/db/src/hechos/cargar.ts');
  const hechos = generarHechos(VOLUMEN) as unknown as Record<string, Record<string, unknown>[]>;
  const sql = ['BEGIN;', 'DROP SCHEMA IF EXISTS humo CASCADE;', 'CREATE SCHEMA humo;'];
  for (const t of TABLAS_MOTOR) sql.push(`CREATE TABLE humo.${t} (LIKE finn.${t});`);
  sql.push(`DO $$ DECLARE c record; BEGIN
  FOR c IN SELECT a.attrelid::regclass AS t, a.attname FROM pg_attribute a JOIN pg_class k ON k.oid = a.attrelid
    WHERE k.relnamespace = 'humo'::regnamespace AND a.attnum > 0 AND a.attnotnull LOOP
    EXECUTE format('ALTER TABLE %s ALTER COLUMN %I DROP NOT NULL', c.t, c.attname);
  END LOOP; END $$;`);
  for (const t of TABLAS_MOTOR) {
    const cols = COLUMNAS_CARGADAS[t];
    sql.push(`COPY humo.${t} (${cols.join(', ')}) FROM stdin;`);
    // La revisión de cada fila la pone la base al escribir; aquí, una cualquiera (cuenta en los bytes)
    for (const fila of hechos[t] ?? [])
      sql.push(
        cols
          .map((c) => celda(c === 'revision' ? (fila['revision'] ?? '1') : fila[camel(c)]))
          .join('\t'),
      );
    sql.push('\\.');
  }
  sql.push('GRANT USAGE ON SCHEMA humo TO finn_app;');
  sql.push('GRANT SELECT ON ALL TABLES IN SCHEMA humo TO finn_app;', 'COMMIT;');
  return sql.join('\n') + '\n';
}

async function cuerpo(): Promise<string> {
  const { TABLAS_MOTOR } = await import('../../pruebas/volumen/generar.ts');
  const { consultaDe } = await import('../../../packages/db/src/hechos/cargar.ts');
  const consultas = TABLAS_MOTOR.map((tabla) => {
    const sql = consultaDe(tabla);
    if (!sql.endsWith(` FROM finn.${tabla}`)) throw new Error(`consulta inesperada de ${tabla}`);
    return { tabla, sql: `${sql.slice(0, -` FROM finn.${tabla}`.length)} FROM humo.${tabla}` };
  });
  return JSON.stringify({ url: process.env['HUMO_CARGA_URL'] ?? '', consultas, veces: VECES });
}

function despliegue(): string {
  const llave = process.env['HUMO_LLAVE'] ?? '';
  const fuente = readFileSync(FUNCION, 'utf8');
  if (!/^[0-9a-f]{32}$/.test(llave) || !fuente.includes("const LLAVE = '';"))
    throw new Error('llave o fuente');
  const archivos = {
    'api/carga.mjs': fuente.replace("const LLAVE = '';", `const LLAVE = '${llave}';`),
    'package.json': JSON.stringify({ private: true, type: 'module', dependencies: { pg: PG } }),
    'vercel.json': JSON.stringify({ regions: ['iad1'] }),
  };
  return JSON.stringify({
    name: process.env['HUMO_PROYECTO'],
    target: 'production',
    projectSettings: { framework: null },
    files: Object.entries(archivos).map(([file, data]) => ({ file, data })),
  });
}

async function local(): Promise<string> {
  const { crear } = (await import(FUNCION.href)) as {
    crear: (c: unknown, l: string) => (r: Request) => Promise<Response>;
  };
  const { Client } = createRequire(new URL('../../../packages/db/', import.meta.url))('pg') as {
    Client: unknown;
  };
  const llave = process.env['HUMO_LLAVE'] ?? '';
  const pedido = { method: 'POST', headers: { 'x-humo-llave': llave }, body: entrada() };
  return (await crear(Client, llave)(new Request('http://local/api/carga', pedido))).text();
}

function informe(): number {
  const r = JSON.parse(entrada()) as {
    region: string;
    cargas: { ms: number; bytes: number }[];
    filas: Record<string, number>;
  };
  const ms = r.cargas.map((c) => c.ms).sort((a, b) => a - b);
  // p95 por rango más cercano: con 10 cargas, la mayor
  const p95 = ms[Math.ceil(0.95 * ms.length) - 1] ?? Infinity;
  const filas = Object.values(r.filas).reduce((s, n) => s + n, 0);
  const medidas = {
    region: r.region,
    cargas: ms.length,
    p95_ms: p95,
    bytes_por_carga: r.cargas[0]?.bytes,
    filas,
  };
  for (const [k, v] of Object.entries(medidas)) console.log(`medido ${k} ${String(v)}`);
  let codigo = 0;
  if (process.env['FINN_HUMO_FUNCION_LOCAL'] !== '1' && r.region !== 'iad1') {
    console.log(`detalle la función corrió en ${r.region}, no en iad1`);
    codigo = 1;
  }
  if (ms.length !== VECES || p95 > PRESUPUESTO_MS) {
    console.log(
      `detalle p95 ${p95} ms > ${PRESUPUESTO_MS} ms: registrar el riesgo (RK-02) y decidir si la carga incremental (04 §5.7) se activa desde el inicio`,
    );
    codigo = 1;
  }
  return codigo;
}

const sub = process.argv[2];
if (sub === 'semilla') process.stdout.write(await semilla());
else if (sub === 'cuerpo') process.stdout.write(await cuerpo());
else if (sub === 'despliegue') process.stdout.write(despliegue());
else if (sub === 'local') process.stdout.write(await local());
else if (sub === 'informe') process.exitCode = informe();
else {
  console.log(`detalle subcomando desconocido: ${sub ?? ''}`);
  process.exitCode = 1;
}
