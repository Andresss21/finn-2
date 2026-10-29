// Registro de los presupuestos de tiempo del nocturno (07 §6.6, P7-5; TA-156): `node tools/pruebas/volumen/registrar.ts`.
// Lee test-results/ren/int.json (PRU-REN-MOTOR-001 y PRU-REN-ESQ-001) y test-results/ren/bench.json (la salida de
// `pnpm bench --outputJson`, PRU-REN-MOTOR-101), deja las medianas en el resumen del job y en
// test-results/ren/ren.json y, si un presupuesto se supera, abre un aviso (`::warning::`) y fija FINN_REN_ROJO: la fecha
// desde la que el rojo está activo, en el estado de `tools/ci/minutos.ts` (`rapido` falla si pasan más de 7 días). Un
// presupuesto de tiempo superado NO falla el job ni bloquea el despliegue del día: los runners compartidos tienen ruido.
// No ajusta ningún presupuesto: con poco margen solo avisa que conviene proponer un CT con los datos.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface Medida {
  readonly id: string;
  readonly nombre: string;
  readonly medianaMs: number;
  /** `null`: se registra, sin tope (V-30 fue indicativa, 04 RS-10). */
  readonly presupuestoMs: number | null;
}
export interface Evaluacion extends Medida {
  readonly superado: boolean;
  /** (presupuesto − mediana) / presupuesto; negativo si se superó. `null` sin presupuesto. */
  readonly margen: number | null;
}

/** P7-5: con menos de 30 % de margen se propone un CT con los datos; no se ajusta solo. */
export const MARGEN_MINIMO = 0.3;
export const PRESUPUESTO_CALCULAR_MS = 150; // 02 §2.3, 04 §5.6
const ESTADO = 'test-results/ci-modo/ci-modo.json';
const RESULTADOS = 'test-results/ren';

interface SalidaInt {
  motor001?: { medianaMs: number; presupuestoMs: number };
  esq001?: { medianaMs: number; presupuestoMs: number | null };
}
interface SalidaBench {
  files: { groups: { benchmarks: { name: string; median: number }[] }[] }[];
}

/** Las tres medidas del job `ren`, de lo que escribieron la prueba de integración y `vitest bench`. */
export function medidas(int: SalidaInt, bench: SalidaBench | null): Medida[] {
  const lista: Medida[] = [];
  const calcular = bench?.files
    .flatMap((f) => f.groups.flatMap((g) => g.benchmarks))
    .find((b) => b.name.startsWith('PRU-REN-MOTOR-101'));
  if (calcular)
    lista.push({
      id: 'PRU-REN-MOTOR-101',
      nombre: 'calcular, 10 años, volumen alto',
      medianaMs: calcular.median,
      presupuestoMs: PRESUPUESTO_CALCULAR_MS,
    });
  if (int.motor001)
    lista.push({
      id: 'PRU-REN-MOTOR-001',
      nombre: 'carga de hechos con json_agg, 10 años, volumen alto',
      medianaMs: int.motor001.medianaMs,
      presupuestoMs: int.motor001.presupuestoMs,
    });
  if (int.esq001)
    lista.push({
      id: 'PRU-REN-ESQ-001',
      nombre: 'verificaciones diferidas de una escritura masiva',
      medianaMs: int.esq001.medianaMs,
      presupuestoMs: int.esq001.presupuestoMs,
    });
  return lista;
}

export function evaluar(m: Medida): Evaluacion {
  const p = m.presupuestoMs;
  return {
    ...m,
    superado: p !== null && m.medianaMs > p,
    margen: p === null ? null : (p - m.medianaMs) / p,
  };
}

/** FINN_REN_ROJO: la fecha desde la que hay un presupuesto superado; se conserva mientras siga y se borra al corregirse. */
export const nuevoRojo = (
  anterior: string | null,
  hayExceso: boolean,
  hoy: string,
): string | null => (hayExceso ? (anterior ?? hoy) : null);

/** Una línea por medida, para el resumen del job. */
export function resumen(es: Evaluacion[]): string {
  const filas = es.map((e) => {
    const tope = e.presupuestoMs === null ? 'sin tope' : `≤ ${e.presupuestoMs} ms`;
    const estado =
      e.presupuestoMs === null ? 'registrada' : e.superado ? 'SUPERADO' : 'en presupuesto';
    const margen = e.margen === null ? '' : ` (margen ${Math.round(e.margen * 100)} %)`;
    return `| ${e.id} | ${e.nombre} | ${Math.round(e.medianaMs * 100) / 100} ms | ${tope} | ${estado}${margen} |`;
  });
  return [
    '### Presupuestos de tiempo (mediana de 5, 07 §6.6)',
    '',
    '| Prueba | Qué mide | Mediana | Presupuesto | Estado |',
    '|---|---|---|---|---|',
    ...filas,
    '',
  ].join('\n');
}

/** Los avisos del job: uno por presupuesto superado y uno por el que queda con poco margen (P7-5). */
export function avisos(es: Evaluacion[]): string[] {
  return es.flatMap((e) => {
    if (e.superado)
      return [
        `::warning title=${e.id}::${e.nombre}: mediana ${Math.round(e.medianaMs)} ms, presupuesto ${e.presupuestoMs} ms. FINN_REN_ROJO activo (07 §6.6)`,
      ];
    if (e.margen !== null && e.margen < MARGEN_MINIMO)
      return [
        `::warning title=${e.id}::${e.nombre}: margen de ${Math.round(e.margen * 100)} % (< 30 %). Si se repite 3 noches, proponer un CT con estos datos; el presupuesto no se ajusta solo`,
      ];
    return [];
  });
}

const leerJson = (f: string): unknown =>
  existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;

if (import.meta.main) {
  const int = (leerJson(`${RESULTADOS}/int.json`) as SalidaInt | null) ?? {};
  const bench = leerJson(`${RESULTADOS}/bench.json`) as SalidaBench | null;
  const es = medidas(int, bench).map(evaluar);
  const esperadas = 3;
  if (es.length < esperadas)
    console.log(
      `::warning title=REN::Solo ${es.length} de ${esperadas} medidas: falta int.json o bench.json`,
    );
  for (const a of avisos(es)) console.log(a);
  const texto = resumen(es);
  console.log(texto);
  if (process.env['GITHUB_STEP_SUMMARY']) appendFileSync(process.env['GITHUB_STEP_SUMMARY'], texto);
  const estado = (leerJson(ESTADO) as Record<string, unknown> | null) ?? {};
  const hayExceso = es.some((e) => e.superado);
  const hoy = new Date().toISOString().slice(0, 10);
  const rojo = nuevoRojo(
    (estado['ren_rojo_desde'] as string | null | undefined) ?? null,
    hayExceso,
    hoy,
  );
  mkdirSync(dirname(ESTADO), { recursive: true });
  writeFileSync(ESTADO, JSON.stringify({ ...estado, ren_rojo_desde: rojo }, null, 2) + '\n');
  writeFileSync(
    `${RESULTADOS}/ren.json`,
    JSON.stringify({ hoy, ren_rojo_desde: rojo, medidas: es }, null, 2) + '\n',
  );
  if (process.env['GITHUB_OUTPUT'])
    appendFileSync(process.env['GITHUB_OUTPUT'], `ren_rojo=${rojo ?? ''}\n`);
}
