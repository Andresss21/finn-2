// tools/respaldo/control-dinero.ts — control de dinero diario, paso final de respaldo.yml (TA-262; 07 §31.1, DP-29;
// CH-91). Uso: node tools/respaldo/control-dinero.ts <medir|juzgar>
// - medir: con RESPALDO_DB_URL (finn_respaldo, solo lectura) carga los hechos con `leer` y `cargarHechos` de @finn/db,
//   la misma consulta que la app (04 §5.2); calcula con `calcular(hechos, hoy)` y comprueba los invariantes de 07 §31.1
//   con `verificarInvariantes` (26, el determinismo, calculando también con las filas en orden inverso). Cuenta las
//   filas por tabla y las compara con el artefacto del día anterior, si lo hay. Escribe el resultado sin montos: solo
//   invariantes, si pasan, cuántas violaciones, conteos y diferencias. Sale con 0 aunque un invariante falle, para que
//   el artefacto se suba antes de juzgar; con 1 si no pudo medir.
// - juzgar: sale con 1 si un invariante falla o si falta el resultado. Las diferencias de conteos son informativas
//   (CH-91): no hacen fallar el job.
// Node 24 corre este archivo sin transformar; el código de los paquetes importa sin extensión, así que antes de
// cargarlo se registra un resolvedor que prueba `.ts` e `/index.ts` (como verificar-motor.ts).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

/** Los invariantes calculables de 07 §31.1, en su orden. */
const INVARIANTES = [1, 2, 3, 4, 6, 9, 10, 11, 12, 17, 22, 24, 26, 28] as const;

type Resultado = { invariante: number; pasa: boolean; violaciones: number };
type Control = {
  hoy: string;
  revision: string;
  pasa: boolean;
  invariantes: Resultado[];
  conteos: Record<string, number>;
  anterior: { hoy: string; revision: string } | null;
  diferencias: Record<string, number> | null;
};

// Una sola sentencia, una sola instantánea: las filas de cada tabla del esquema finn
const CONTEOS = `SELECT c.relname, (xpath('/row/n/text()', query_to_xml(
    format('SELECT count(*) AS n FROM finn.%I', c.relname), false, true, '')))[1]::text
  FROM pg_class c WHERE c.relnamespace = 'finn'::regnamespace AND c.relkind = 'r' ORDER BY 1`;

const dir = (sufijo: string): string => join(process.env['RUNNER_TEMP'] ?? '.', sufijo);
const SALIDA = join(dir('control-dinero'), 'control-dinero.json');
const ANTERIOR = join(dir('control-dinero-anterior'), 'control-dinero.json');

function registrarResolvedor(): void {
  registerHooks({
    resolve(especificador, contexto, siguiente) {
      try {
        return siguiente(especificador, contexto);
      } catch (e) {
        const relativo = especificador.startsWith('.');
        if (!relativo || (e as { code?: string }).code !== 'ERR_MODULE_NOT_FOUND') throw e;
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
}

/** El artefacto del día anterior, si se pudo bajar y leer; sin él no hay diferencias. */
function leerAnterior(): Pick<Control, 'hoy' | 'revision' | 'conteos'> | null {
  if (!existsSync(ANTERIOR)) return null;
  try {
    const a = JSON.parse(readFileSync(ANTERIOR, 'utf8')) as Partial<Control>;
    if (typeof a.hoy !== 'string' || typeof a.revision !== 'string' || !a.conteos) return null;
    return { hoy: a.hoy, revision: a.revision, conteos: a.conteos };
  } catch {
    return null;
  }
}

function diferenciasCon(
  conteos: Record<string, number>,
  anterior: Record<string, number>,
): Record<string, number> {
  const tablas = [...new Set([...Object.keys(conteos), ...Object.keys(anterior)])].sort();
  const dif: Record<string, number> = {};
  for (const t of tablas) {
    const d = (conteos[t] ?? 0) - (anterior[t] ?? 0);
    if (d !== 0) dif[t] = d;
  }
  return dif;
}

async function medir(): Promise<number> {
  const url = process.env['RESPALDO_DB_URL'];
  if (!url) {
    console.error('control-dinero medir: falta RESPALDO_DB_URL (TU-11)');
    return 1;
  }
  registrarResolvedor();
  process.env['DATABASE_URL'] = url;
  const db = await import('../../packages/db/src/index.ts');
  const dominio = await import('../../packages/dominio/src/index.ts');
  const { FechaLocal } = await import('../../packages/dominio/src/valores/index.ts');
  const { consultar } = await import('../ci/desplegar.mjs');

  const { hechos, hoy, revision } = await db.leer(async (tx) => ({
    hechos: await db.cargarHechos(tx),
    hoy: tx.estado.hoy,
    revision: tx.estado.revision,
  }));
  const fecha = FechaLocal.desdeTexto(hoy);
  const instantanea = dominio.calcular(hechos, fecha);
  const porInvariante = new Map<number, number>();
  for (const v of dominio.verificarInvariantes(instantanea))
    porInvariante.set(v.invariante, (porInvariante.get(v.invariante) ?? 0) + 1);
  // 26: los mismos hechos en otro orden dan la misma instantánea
  const invertidos = Object.fromEntries(
    Object.entries(hechos).map(([t, filas]) => [t, [...(filas as unknown[])].reverse()]),
  ) as unknown as typeof hechos;
  if (!isDeepStrictEqual(dominio.calcular(invertidos, fecha), instantanea))
    porInvariante.set(26, 1);
  const invariantes = INVARIANTES.map((invariante) => {
    const violaciones = porInvariante.get(invariante) ?? 0;
    return { invariante, pasa: violaciones === 0, violaciones };
  });

  const conteos: Record<string, number> = {};
  for (const fila of await consultar(url, CONTEOS)) {
    const [tabla = '', n = '0'] = fila.split('|');
    conteos[tabla] = Number(n);
  }
  const previo = leerAnterior();
  const control: Control = {
    hoy,
    revision,
    pasa: invariantes.every((x) => x.pasa),
    invariantes,
    conteos,
    anterior: previo && { hoy: previo.hoy, revision: previo.revision },
    diferencias: previo && diferenciasCon(conteos, previo.conteos),
  };
  mkdirSync(dir('control-dinero'), { recursive: true });
  writeFileSync(SALIDA, `${JSON.stringify(control, null, 1)}\n`);
  const tablas = Object.keys(conteos).length;
  const cambios = control.diferencias ? Object.keys(control.diferencias).length : 'sin anterior';
  console.log(`control de dinero (hoy ${hoy}): ${tablas} tablas contadas; diferencias: ${cambios}`);
  return 0;
}

function juzgar(): number {
  if (!existsSync(SALIDA)) {
    console.error('control-dinero juzgar: falta el resultado de medir');
    return 1;
  }
  const control = JSON.parse(readFileSync(SALIDA, 'utf8')) as Control;
  for (const x of control.invariantes.filter((y) => !y.pasa))
    console.log(`   inv. ${x.invariante}: ${x.violaciones} violaciones`);
  for (const [t, d] of Object.entries(control.diferencias ?? {}))
    console.log(`   ${t}: ${d > 0 ? '+' : ''}${d} filas desde el día anterior (informativo)`);
  const completos = isDeepStrictEqual(
    control.invariantes.map((x) => x.invariante),
    [...INVARIANTES],
  );
  if (control.pasa && completos) {
    console.log(`control de dinero: ${INVARIANTES.length} invariantes sin violaciones`);
    return 0;
  }
  console.log('control de dinero: un invariante falla; revisar con 07 §31.2');
  return 1;
}

// process.exit: el cliente de Prisma deja conexiones abiertas
const sub = process.argv[2] ?? '';
if (sub === 'medir') process.exit(await medir());
if (sub === 'juzgar') process.exit(juzgar());
console.error('uso: node tools/respaldo/control-dinero.ts <medir|juzgar>');
process.exit(2);
