// tools/plan/encargo.ts — plantilla del encargo (§32) y V8-04.
// Uso:
//   node tools/plan/encargo.ts --plan 08-tareas.md --tarea TA-nnn            → imprime el encargo de una tarea
//   node tools/plan/encargo.ts --plan 08-tareas.md --docs docs --todas [--negativo]
//        → genera el encargo de cada tarea y comprueba: (1) que tenga todas sus secciones con contenido;
//          (2) que cada referencia "0n §x.y" de "Leer" exista como encabezado en el documento n (docs/0n-*.md).
// Sale con 1 si encuentra errores.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

type Ficha = { id: string; titulo: string; datos: Record<string, string>; secciones: Record<string, string> };
const SECCIONES = ['Qué construir', 'Leer', 'Archivos', 'Pruebas primero', 'Comandos', 'Terminada cuando'];

function argumento(n: string): string | undefined { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; }

export function leerFichas(plan: string): Ficha[] {
  const salida: Ficha[] = [];
  const re = /^#### (TA-\d{3}) ([^\n]*)\n([\s\S]*?)(?=^#{2,4} |(?![\s\S]))/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plan)) !== null) {
    const cuerpo = m[3] as string;
    const b = /```tarea\n([\s\S]*?)```/.exec(cuerpo);
    if (!b) continue;
    const datos: Record<string, string> = {};
    for (const l of (b[1] as string).split('\n')) { const i = l.indexOf(':'); if (i > 0) datos[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
    const secciones: Record<string, string> = {};
    for (const s of SECCIONES) {
      const r = new RegExp('\\*\\*' + s + '\\.\\*\\*([\\s\\S]*?)(?=\\n\\*\\*(' + SECCIONES.join('|') + ')\\.\\*\\*|$)').exec(cuerpo);
      secciones[s] = r ? (r[1] as string).trim() : '';
    }
    salida.push({ id: m[1] as string, titulo: m[2] as string, datos, secciones });
  }
  return salida;
}

// [F8] DT-32: Opus para las tareas de revisión obligatoria (motor, migraciones, seguridad, reloj, CI, CLAUDE.md); Sonnet para el resto.
// `plan/tareas.json` puede subir una tarea a opus (escalamiento del orquestador); nunca la baja.
export function modelo(d: Record<string, string>): 'opus' | 'sonnet' {
  if (d['modelo'] === 'opus' || d['modelo'] === 'sonnet') return d['modelo'];
  return d['revision'] === 'obligatoria' ? 'opus' : 'sonnet';
}

export function encargo(f: Ficha): string {
  const d = f.datos;
  return [
    `# Encargo ${f.id} — ${f.titulo}`,
    '',
    `Sos el agente de la tarea ${f.id} de Finn 2.0. Seguí \`CLAUDE.md\` (se carga solo). Esta es tu única tarea en esta sesión.`,
    '',
    '## Datos',
    `- Bloque ${d['bloque']}, hito ${d['hito']}, revisión **${d['revision']}**. Depende de: ${d['depende']} (deben figurar \`terminada\` en \`plan/tareas.json\`).`,
    `- Cubre: ${d['cubre']}. Pruebas con identificador: ${d['pru']}.` + (d['pendiente'] ? ` Pendientes de punta a punta (DT-27): ${d['pendiente']}.` : '') + (d['e2e'] ? ` E2E que completás (DT-27): ${d['e2e']}.` : ''),
    `- **Modelo: ${modelo(d)}** (DT-32): el orquestador lanza el subagente \`tarea-${modelo(d)}\`, en su propio worktree (DT-34).`,
    `- Tamaño estimado: ${d['tamano']}. Si el diff medido pasa un límite de DT-01, pará y proponé cómo partirla.`,
    `- Paralelo: ${d['paralelo']}. TU necesarias: ${d['tu']}.`,
    '',
    '## Antes de empezar', `Estás en tu worktree (DT-34). Primero: \`git fetch origin\`, \`git branch -m ${f.id.toLowerCase()}-<tema>\` y \`pnpm install --frozen-lockfile\`. Nunca toques \`C:\\finn\\repo\` fuera de tu worktree.`, '',
    '## Qué construir', f.secciones['Qué construir'] ?? '',
    '', '## Leé solo esto', f.secciones['Leer'] ?? '',
    '', '## Archivos', f.secciones['Archivos'] ?? '',
    '', '## Pruebas primero', f.secciones['Pruebas primero'] ?? '',
    '', '## Comandos', f.secciones['Comandos'] ?? '',
    '', '## Terminada cuando', f.secciones['Terminada cuando'] ?? '',
    '',
    '## Al terminar',
    '1. `pnpm ci:local` en verde; máximo 2 pushes (DT-07).',
    '2. `pnpm pr:mergear <n> --resumen` y pegá la salida en el PR.',
    '3. Descripción del PR = el informe de `CLAUDE.md`, con **Qué mirar** apuntando a lo más riesgoso del cambio.',
    '4. No mergeás ni usás `--aprobado`: tu respuesta final al orquestador es el informe, con el número de PR.' + (d['revision'] === 'obligatoria' ? ' Es de revisión obligatoria: el orquestador se la presenta al usuario (§1.5).' : ''),
    '5. Si encontrás una contradicción entre documentos, no la resuelvas en el código: informala con una propuesta de CH y esperá.',
  ].join('\n');
}

// Referencias "0n §a.b" en "Leer": comprueba que el encabezado exista en el documento.
export function referencias(texto: string): { doc: string; sec: string }[] {
  const salida: { doc: string; sec: string }[] = [];
  for (const segmento of texto.split(/;|\n/)) {
    let doc = '';
    const re = /(?<![\w-])(0[1-7])(-identidad-visual)?(?=\s)|§(\d+(?:\.\d+)*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(segmento)) !== null) {
      if (m[1]) { doc = m[2] ? '' : (m[1] as string); continue; }
      if (doc && m[3]) salida.push({ doc, sec: m[3] as string });
    }
  }
  return salida;
}

export function existe(docs: Map<string, string>, doc: string, sec: string): boolean {
  const t = docs.get(doc);
  if (!t) return true; // documento que no está en disco: no se comprueba
  const esc = sec.replace(/\./g, '\\.');
  return new RegExp('^(?:#{2,5} |\\*\\*)(?:[A-Z]\\.)?' + esc + '(?:\\.|\\b)(?![.\\d])', 'm').test(t);
}

function principal(): void {
  const plan = readFileSync(argumento('--plan') ?? 'docs/08-tareas.md', 'utf8');
  const fichas = leerFichas(plan);
  const una = argumento('--tarea');
  if (una) { const f = fichas.find((x) => x.id === una); if (!f) { console.log(`No existe ${una}`); process.exit(1); } console.log(encargo(f)); return; }
  const dir = argumento('--docs') ?? 'docs';
  const docs = new Map<string, string>();
  for (const n of readdirSync(dir)) { const m = /^(0[1-7])-/.exec(n); if (m) docs.set(m[1] as string, readFileSync(join(dir, n), 'utf8')); }
  const verificar = (lista: Ficha[]): string[] => {
    const errores: string[] = [];
    for (const f of lista) {
      for (const s of SECCIONES) if (!(f.secciones[s] ?? '').trim()) errores.push(`${f.id}: sección "${s}" vacía`);
      const e = encargo(f);
      if (e.includes('undefined')) errores.push(`${f.id}: el encargo tiene un dato sin valor`);
      for (const r of referencias(f.secciones['Leer'] ?? '')) if (!existe(docs, r.doc, r.sec)) errores.push(`${f.id}: "${r.doc} §${r.sec}" no existe como sección`);
    }
    return errores;
  };
  const errores = verificar(fichas);
  const nrefs = fichas.reduce((a, f) => a + referencias(f.secciones['Leer'] ?? '').length, 0);
  console.log(`Encargos generados: ${fichas.length}; referencias a secciones comprobadas: ${nrefs}.`);
  for (const e of errores) console.log('ERROR ' + e);
  let fallo = errores.length > 0;
  if (process.argv.includes('--negativo')) {
    const copia = fichas.map((f) => ({ ...f, secciones: { ...f.secciones } }));
    (copia[0] as Ficha).secciones['Leer'] = '07 §99.9 (sección inexistente)';
    (copia[1] as Ficha).secciones['Comandos'] = '';
    const r = verificar(copia);
    const ok = r.some((x) => x.includes('§99.9')) && r.some((x) => x.includes('"Comandos" vacía'));
    console.log(`Control negativo: referencia inexistente y sección vacía ${ok ? 'detectadas' : 'NO DETECTADAS'}.`);
    if (!ok) fallo = true;
  }
  console.log(fallo ? 'RESULTADO: FALLA' : 'RESULTADO: PASA');
  process.exit(fallo ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('encargo.ts')) principal();
