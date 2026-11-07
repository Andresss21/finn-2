// tools/pruebas/puerta.ts — la puerta de salida de 07 §30 (P7-8), `pnpm pruebas:puerta` (TA-485, CH-211).
// Evalúa las 7 condiciones por separado, con lo que hay en el repositorio, y da por cada una `pasa`, `falla` o
// `manual pendiente` con sus motivos. Node 24 lo ejecuta sin compilar.
//   node tools/pruebas/puerta.ts [--simular] [--resultados <dir>] [--base <rama>]
// --resultados: informes JSON de la última corrida verde de main (condición 1, M15); --base: rama de firmas.sh
// (origin/main). Sin --simular sale con 1 si alguna condición no pasa. Con --simular sale siempre con 0, y lo que
// espera un registro del usuario (una fila de resultados.md, una TU) o un artefacto de CI fuera del repositorio queda
// "manual pendiente": nunca se inventa. Lo que el repositorio contradice falla también al simular.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { FORMATOS, INSTITUCIONES } from './anonimizar.ts';
import { cargarEntradas, informe, inventarioVencido, verificar } from './matriz.ts';

export type Estado = 'pasa' | 'falla' | 'manual pendiente';
export interface Condicion {
  n: number;
  titulo: string;
  estado: Estado;
  motivos: string[];
}
export interface Cobertura {
  sms: { institucion: string; archivo: string; tipos: Record<string, number> }[];
  csv: { formato: string; institucion: string; archivos: string[] }[];
}
export interface EntradasPuerta {
  // `matriz.ts verificar` en modo puerta: errores (M1 a M18), fichas con manual pendiente y si tuvo --resultados
  matriz: { errores: string[]; fichasConManualPendiente: string[]; conCorrida: boolean };
  resultados: string; // pruebas/manuales/resultados.md (solo lectura)
  diferidas: Record<string, string>; // [CH-219] manuales diferidas al uso diario (pruebas/manuales.md) y su motivo
  cobertura: Cobertura | null; // pruebas/muestras-cobertura.json; null si todavía no existe
  existe: (ruta: string) => boolean;
  migraciones: string[]; // migration.sql de packages/db/prisma/migrations, en orden
  firmas: { codigo: number; salida: string }; // tools/pruebas/firmas.sh: 0 pasa, 1 falla, 2 no puede verificar
}

// Un motivo que el repositorio contradice (falla) o que espera al usuario o a CI (pendiente)
type Motivo = { pendiente: boolean; texto: string };
const falla = (texto: string): Motivo => ({ pendiente: false, texto });
const pendiente = (texto: string): Motivo => ({ pendiente: true, texto });

// ---------------------------------------------------------------- resultados.md (07 §22.2)
interface Fila {
  id: string;
  fecha: string;
  resultado: string;
  nota: string;
}
/** Filas `| Manual | Fecha | Dispositivo | Resultado | Quién | Versión | Nota |`; las incompletas las rechaza M16. */
function filas(texto: string): Fila[] {
  return texto.split('\n').flatMap((l) => {
    const [, id = '', fecha = '', , resultado = '', , , nota = ''] = l
      .split('|')
      .map((x) => x.trim());
    return /^PRU-MAN-[A-Z0-9]+-\d{3}$/.test(id) && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
      ? [{ id, fecha, resultado, nota }]
      : [];
  });
}
/** Vale el último resultado: el de fecha mayor y, a igual fecha, la fila posterior (como `ultimoResultado` de M16). */
function ultimo(texto: string, id: string): Fila | undefined {
  return filas(texto)
    .filter((f) => f.id === id)
    .reduce<Fila | undefined>((a, f) => (!a || f.fecha >= a.fecha ? f : a), undefined);
}
/** Filas `exclusión SP-01 | institucion:<nombre> | <motivo>` y `exclusión SP-01 | csv:<formato> | <motivo>` (CH-03). */
function exclusiones(texto: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const l of texto.split('\n')) {
    const c = l
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((x) => x.trim());
    if (c[0] === 'exclusión SP-01' && c[1]) m.set(c[1], c[2] ?? '');
  }
  return m;
}

/** El último resultado de un manual: "pasa" y lo que su nota tiene que decir (`exige`: [patrón, qué falta]). */
function manual(
  e: EntradasPuerta,
  id: string,
  cuando: string,
  exige: [RegExp, string][] = [],
): Motivo[] {
  const f = ultimo(e.resultados, id);
  if (!f && e.diferidas[id]) return []; // [CH-219] diferida al uso diario: sin resultado no bloquea; una falla sí
  if (!f) return [pendiente(`${id} sin resultado en resultados.md (${cuando})`)];
  if (f.resultado !== 'pasa')
    return [falla(`${id}: el último resultado (${f.fecha}) es "${f.resultado}"`)];
  return exige.flatMap(([re, falta]) =>
    re.test(f.nota) ? [] : [falla(`${id}: la nota no registra ${falta}`)],
  );
}

// ---------------------------------------------------------------- las condiciones
const esM18 = (x: string): boolean => x.startsWith('M18 ');

function c1(e: EntradasPuerta): Motivo[] {
  const m = e.matriz;
  return [
    ...m.errores
      .filter((x) => !esM18(x) && !(x.startsWith('M16 ') && x.includes('manual pendiente')))
      .map(falla),
    ...m.fichasConManualPendiente.map((ft) => pendiente(`${ft} con manual pendiente (M16)`)),
    ...(m.conCorrida
      ? []
      : [
          pendiente(
            'sin los informes de la última corrida verde de main: --resultados <dir> (M15)',
          ),
        ]),
  ];
}

/** El último `SET activo = …` de una migración que nombra un formato de la institución (`'<institución> …'`). */
function activoSegunMigraciones(migraciones: string[], institucion: string): boolean | undefined {
  let activo: boolean | undefined;
  for (const sql of migraciones)
    for (const s of sql.split(';')) {
      const v = /\bactivo\s*=\s*(true|false)\b/i.exec(s);
      if (v && s.includes(`'${institucion} `)) activo = v[1]?.toLowerCase() === 'true';
    }
  return activo;
}

function c2(e: EntradasPuerta): Motivo[] {
  const r: Motivo[] = [
    ...['PRU-MAN-BAND-003', 'PRU-MAN-BAND-004', 'PRU-MAN-CONC-001'].flatMap((id) =>
      manual(e, id, 'SP-01, TU-13'),
    ),
    ...e.matriz.errores.filter((x) => x.startsWith('M11 ')).map(falla),
  ];
  const ex = exclusiones(e.resultados);
  const validas = new Set([
    ...Object.values(INSTITUCIONES).map((i) => `institucion:${i}`),
    ...Object.keys(FORMATOS).map((f) => `csv:${f}`),
  ]);
  for (const [clave, motivo] of ex) {
    if (!validas.has(clave))
      r.push(falla(`exclusión SP-01 con una clave que anonimizar.ts no conoce: ${clave} (CH-210)`));
    else if (!motivo) r.push(falla(`exclusión SP-01 | ${clave} sin motivo: no cuenta`));
  }
  const excluida = (clave: string): boolean => Boolean(ex.get(clave));
  const cob = e.cobertura;
  if (!cob) r.push(pendiente('no existe pruebas/muestras-cobertura.json (anonimizar.ts, TU-13)'));
  const perdidas = [
    ...(cob?.sms.map((s) => s.archivo) ?? []),
    ...(cob?.csv.flatMap((c) => c.archivos) ?? []),
  ];
  for (const a of perdidas.filter((x) => !e.existe(x)))
    r.push(falla(`muestras-cobertura.json cita ${a}, que no está en el repositorio`));
  // (a) SMS: cada institución de 03 §9.4 con muestras, o excluida con su fila y su formato inactivo
  for (const inst of Object.values(INSTITUCIONES)) {
    if (excluida(`institucion:${inst}`)) {
      const activo = activoSegunMigraciones(e.migraciones, inst);
      if (activo !== false)
        r.push(
          falla(
            `SMS de ${inst}: excluida, pero ${activo ? 'su formato sigue activo' : 'ninguna migración desactiva su formato'}`,
          ),
        );
    } else if (
      cob &&
      !cob.sms.some((s) => s.institucion === inst && Object.keys(s.tipos).length > 0)
    )
      r.push(
        pendiente(
          `SMS de ${inst}: sin muestras ni fila \`exclusión SP-01 | institucion:${inst} | …\``,
        ),
      );
  }
  // (b) CSV: cada formato de ADR-17 con muestras, o excluido con su fila
  for (const f of Object.keys(FORMATOS))
    if (
      cob &&
      !excluida(`csv:${f}`) &&
      !cob.csv.some((c) => c.formato === f && c.archivos.length > 0)
    )
      r.push(
        pendiente(
          `CSV ${f} (${FORMATOS[f]}): sin muestras ni fila \`exclusión SP-01 | csv:${f} | …\``,
        ),
      );
  return r;
}

function c5(e: EntradasPuerta): Motivo[] {
  if (e.firmas.codigo === 0) return [];
  const lineas = e.firmas.salida
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('FALLA '));
  const textos = lineas.length ? lineas : [`firmas.sh salió con ${e.firmas.codigo}`];
  return e.firmas.codigo === 1
    ? textos.map(falla)
    : textos.map((t) => pendiente(`no se pudo verificar (M17): ${t}`));
}

const CONDICIONES: [string, (e: EntradasPuerta) => Motivo[]][] = [
  ['Los CA [I] y [M] en verde en la última corrida de main, o su manual en "pasa" (M1 a M17)', c1],
  ['SP-01: muestras, manuales y exclusiones firmadas (CH-03, CH-210)', c2],
  [
    'SP-02: prueba de humo (PRU-MAN-ESQ-001) con el disparador de P7-12 resuelto',
    (e) =>
      manual(e, 'PRU-MAN-ESQ-001', 'SP-02', [
        [/P7-12/, 'cómo quedó el disparador de P7-12 (§32.1)'],
      ]),
  ],
  [
    'SP-04: MacroDroid en el teléfono (PRU-MAN-BAND-001) con variante y reintentos',
    (e) =>
      manual(e, 'PRU-MAN-BAND-001', 'SP-04, TU-15', [
        [/variante/i, 'la variante'],
        [/reintento/i, 'el plan de reintentos'],
      ]),
  ],
  ['Resultados de 2 a 4 firmados con la clave del usuario (M17, firmas.sh)', c5],
  [
    'Ensayo del despliegue de emergencia (PRU-MAN-OPER-002, §31.5)',
    (e) =>
      manual(e, 'PRU-MAN-OPER-002', 'el ensayo de TU-17', [
        [/ensayo/i, 'el motivo `ensayo` (TU-17)'],
      ]),
  ],
  [
    'Ningún CA pendiente de punta a punta salvo los de fichas [P] (M18)',
    (e) => e.matriz.errores.filter(esM18).map(falla),
  ],
];

/** Las 7 condiciones de 07 §30. Al simular, lo que solo espera al usuario o a CI queda "manual pendiente". */
export function evaluar(e: EntradasPuerta, simular: boolean): Condicion[] {
  return CONDICIONES.map(([titulo, f], i) => {
    const ms = f(e);
    const estado: Estado = ms.some((m) => !m.pendiente)
      ? 'falla'
      : ms.length === 0
        ? 'pasa'
        : simular
          ? 'manual pendiente'
          : 'falla';
    return {
      n: i + 1,
      titulo,
      estado,
      motivos: ms.map((m) => (m.pendiente ? 'pendiente: ' : '') + m.texto),
    };
  });
}

// ---------------------------------------------------------------- CLI
function argumento(nombre: string): string | undefined {
  const k = process.argv.indexOf(nombre);
  return k < 0 ? undefined : process.argv[k + 1];
}

if (import.meta.main) {
  const simular = process.argv.includes('--simular');
  const dir = argumento('--resultados');
  if (process.argv.includes('--resultados') && (dir === undefined || !existsSync(dir))) {
    console.error('--resultados necesita un directorio con los informes JSON de la corrida');
    process.exit(2);
  }
  const vencido = inventarioVencido('.', process.env['FINN_MATRIZ_INVENTARIO']);
  if (vencido !== null) {
    console.error('error  inventario ' + vencido);
    process.exit(2);
  }
  const r = verificar(cargarEntradas('.', true, dir));
  const MIG = 'packages/db/prisma/migrations';
  const cob = 'pruebas/muestras-cobertura.json';
  const f = spawnSync('bash', ['tools/pruebas/firmas.sh', argumento('--base') ?? 'origin/main'], {
    encoding: 'utf8',
  });
  const e: EntradasPuerta = {
    matriz: {
      errores: r.errores,
      fichasConManualPendiente: informe(r).fichasConManualPendiente,
      conCorrida: dir !== undefined,
    },
    diferidas: Object.fromEntries(r.man.flatMap((m) => (m.diferida ? [[m.id, m.diferida]] : []))),
    resultados: existsSync('pruebas/manuales/resultados.md')
      ? readFileSync('pruebas/manuales/resultados.md', 'utf8')
      : '',
    cobertura: existsSync(cob) ? (JSON.parse(readFileSync(cob, 'utf8')) as Cobertura) : null,
    existe: existsSync,
    migraciones: readdirSync(MIG)
      .sort()
      .filter((d) => existsSync(`${MIG}/${d}/migration.sql`))
      .map((d) => readFileSync(`${MIG}/${d}/migration.sql`, 'utf8')),
    firmas: { codigo: f.status ?? 2, salida: `${f.stdout}${f.error ? String(f.error) : ''}` },
  };
  const cs = evaluar(e, simular);
  const MAX = 15;
  for (const c of cs) {
    console.log(`${c.n} ${c.estado.padEnd(16)} ${c.titulo}`);
    for (const m of c.motivos.slice(0, MAX)) console.log(`    - ${m}`);
    if (c.motivos.length > MAX) console.log(`    … y ${c.motivos.length - MAX} más`);
  }
  for (const [id, motivo] of Object.entries(e.diferidas))
    if (!ultimo(e.resultados, id)) console.log(`diferida al uso diario (CH-219): ${id}, ${motivo}`);
  const n = (s: Estado): number => cs.filter((c) => c.estado === s).length;
  const abierta = n('pasa') === cs.length;
  console.log(
    `puerta ${abierta ? 'abierta' : 'cerrada'}${simular ? ' (simulación)' : ''}: ${n('pasa')} pasan, ` +
      `${n('falla')} fallan, ${n('manual pendiente')} con manual pendiente`,
  );
  process.exit(abierta || simular ? 0 : 1);
}
