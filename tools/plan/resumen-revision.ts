// tools/plan/resumen-revision.ts — las tres secciones de 08 §1.5 (Pruebas, Tamaño y áreas, Desvíos) que
// `pr:mergear --resumen` imprime en Markdown para pegar en el PR (TA-014; DT-20, RS7-09). Funciones puras:
// mergear.ts les pasa el diff y los textos que leyó con git.

// 07 §2.1: identificador al inicio del título y lo que cubre entre corchetes
const TITULO =
  /['"`](PRU-[A-Z0-9]+-[A-Z0-9]+-\d{3}|PRU-ESC-\d+@\w+)\s*(?:\[([^\]]*)\])?\s*([^'"`]*)/;
// Decisiones del plan: las cubre la revisión, no una prueba
const DECISION = /^(DT|DP|ADR|CH|P\d)-?/;
const DEPS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

/** La sección **Archivos.** de una ficha: cada tramo entre `` con {a,b}, * y ** a una expresión regular. */
export const patrones = (seccion: string): RegExp[] =>
  [...seccion.matchAll(/`([^`]+)`/g)].flatMap(([, p = '']) => {
    const [, a = '', lista, b = ''] = /^(.*)\{([^}]*)\}(.*)$/.exec(p) ?? [];
    return (lista === undefined ? [p] : lista.split(',').map((x) => a + x.trim() + b)).map(glob);
  });
const glob = (r: string): RegExp =>
  new RegExp(
    `^${r.replace(/[.+?^$()|[\]\\]/g, '\\$&').replace(/\*\*\/?|\*/g, (s) => (s === '*' ? '[^/]*' : '.*'))}$`,
  );

/** De `git diff -U0`: por archivo, las líneas agregadas de la cabeza y las quitadas con su posición en la cabeza. */
function hunks(diff: string) {
  const sal = new Map<string, { agregadas: Set<number>; quitadas: [number, string][] }>();
  let [actual, pos] = [undefined as ReturnType<typeof sal.get>, 0];
  for (const l of diff.split('\n')) {
    const [, ruta] = /^\+\+\+ b\/(.+)$/.exec(l) ?? [];
    const [, desde] = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l) ?? [];
    if (/^--- (a\/|\/dev\/null)/.test(l) || l.startsWith('diff --git')) actual = undefined;
    else if (ruta) sal.set(ruta, (actual = { agregadas: new Set(), quitadas: [] }));
    else if (desde) pos = Number(desde);
    else if (actual && l.startsWith('+')) actual.agregadas.add(pos++);
    else if (actual && l.startsWith('-')) actual.quitadas.push([pos, l.slice(1)]);
  }
  return sal;
}

/** Cada prueba con identificador cuyo bloque (de su título al siguiente) tocó el diff; `numero`: una prueba
 * existente con una línea quitada que lleva un número (RS7-09). */
export function pruebasDelDiff(diff: string, texto: (ruta: string) => string, nuevos: Set<string>) {
  return [...hunks(diff)].flatMap(([archivo, h]) => {
    const ts = texto(archivo)
      .split('\n')
      .flatMap((l, i) => {
        const m = TITULO.exec(l);
        return m ? [{ linea: i + 1, id: m[1] ?? '', cubre: m[2] ?? '', titulo: m[3] ?? '' }] : [];
      });
    return ts.flatMap((t, i) => {
      const dentro = (n: number): boolean => n >= t.linea && n < (ts[i + 1]?.linea ?? Infinity);
      const quitadas = h.quitadas.filter(([n]) => dentro(n)).map(([, q]) => q);
      const nueva =
        nuevos.has(archivo) ||
        (h.agregadas.has(t.linea) && !quitadas.some((q) => q.includes(t.id)));
      if (!nueva && !quitadas.length && ![...h.agregadas].some(dentro)) return [];
      const [cubre, titulo] = [t.cubre.split(',').map((s) => s.trim()), t.titulo.trim()];
      const numero = !nueva && quitadas.some((q) => /\d/.test(q));
      return [{ id: t.id, cubre: cubre.filter(Boolean), titulo, archivo, nueva, numero }];
    });
  });
}

/** Nombres de dependencias de un package.json de la cabeza que no estaban en la base. */
export function depsNuevas(base: string, cabeza: string): string[] {
  const leer = (t: string): string[] => {
    try {
      const j = JSON.parse(t) as Record<string, Record<string, string> | undefined>;
      return DEPS.flatMap((k) => Object.keys(j[k] ?? {}));
    } catch {
      return [];
    }
  };
  const b = new Set(leer(base));
  return leer(cabeza).filter((d) => !b.has(d));
}

// datos: archivos de datos de prueba cambiados (RS7-09); fuera: producción fuera del campo Archivos de la ficha
type Listas =
  'cubre' | 'pru' | 'datos' | 'criticos' | 'portados' | 'fuera' | 'deps' | 'diffCompleto';
export type Revision = Record<'medido' | 'declarado' | 'excepcion', string> &
  Record<Listas, string[]> & { pruebas: ReturnType<typeof pruebasDelDiff>; normalCritica: boolean };

export function revision(r: Revision): string {
  const citados = new Set(r.pruebas.flatMap((p) => [p.id, ...p.cubre]));
  const sin = r.cubre.filter((c) => !citados.has(c));
  const lista = (xs: string[]): string => xs.map((x) => `\`${x}\``).join(', ') || 'ninguno';
  const sub = (xs: string[]): string[] => xs.map((x) => `  - ${x}`);
  const cambiadas = r.pruebas.filter((p) => p.numero).map((p) => p.id);
  return [
    '### Pruebas',
    '',
    ...r.pruebas.map(
      (p) =>
        `- ${p.id} [${p.cubre.join(', ')}] ${p.titulo} — ${p.nueva ? 'nueva' : 'cambiada'} (\`${p.archivo}\`)`,
    ),
    ...(r.pruebas.length ? [] : ['- Ninguna prueba con identificador nueva o cambiada']),
    `- **Objetivos de \`cubre\` sin prueba:** ${lista(sin.filter((c) => !DECISION.test(c)))}`,
    `- Decisiones de \`cubre\` (las cubre la revisión): ${lista(sin.filter((c) => DECISION.test(c)))}`,
    `- **\`pru\` sin prueba:** ${lista(r.pru.filter((x) => !citados.has(x)))}`,
    `- **Número esperado o título cambiado (RS7-09):** ${lista([...cambiadas, ...r.datos])}`,
    '',
    '### Tamaño y áreas',
    '',
    `- Medido: ${r.medido}`,
    `- Declarado: ${r.declarado}`,
    ...(r.excepcion ? [`- ${r.excepcion}`] : []),
    `- Producción en áreas críticas: ${r.criticos.length ? '' : 'ninguna'}`.trimEnd(),
    ...sub(r.criticos),
    `- Portados: ${r.portados.length ? '' : 'ninguno'}`.trimEnd(),
    ...sub(r.portados),
    '',
    '### Desvíos',
    '',
    `- Fuera del campo \`archivos\` de la ficha: ${lista(r.fuera)}`,
    `- Dependencias npm nuevas: ${lista(r.deps)}`,
    `- Área crítica en una tarea \`normal\`: ${r.normalCritica ? 'sí, se trata como obligatoria' : 'no'}`,
    r.diffCompleto.length
      ? `- **Diff completo requerido** (paso 4 de 08 §1.5): ${lista(r.diffCompleto)}`
      : '- Diff completo: no requerido',
  ].join('\n');
}
