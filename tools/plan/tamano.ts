// tools/plan/tamano.ts — tamaño de un diff según DT-01 (08 §1.1), con la clase portado (DT-14, CH-10) y la excepción
// DT-15 (08 §11.3). Lo usa tools/plan/mergear.ts (TA-010). Node 24 lo ejecuta sin compilar.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Clase = 'prueba' | 'dato' | 'generado' | 'produccion';
// nuevo: estado A en el diff; blob: id de blob de git del archivo en la cabeza (su huella)
export type Archivo = {
  ruta: string;
  agregadas: number;
  borradas: number;
  nuevo: boolean;
  blob?: string;
};
// Un archivo ya verificado (anexo, bloque de código de docs/ o archivo de la entrada) y las rutas a las que sirve
export type Fuente = { huella: string; origen: string; acepta: (ruta: string) => boolean };
export type Excepciones = Record<string, { tareas: string[]; medida: string; maximo: number }>;

const LIMITES = { prod: 400, archivos: 12, ca: 10, migraciones: 1, total: 1200 };
const GENERADO =
  /^(pnpm-lock\.yaml|packages\/db\/prisma\/catalogo-esperado\.txt|pruebas\/inventario\.json)$|(^|\/)generado\//;
const DATO =
  /^(packages\/dominio\/escenarios\/datos\/|pruebas\/[^/]+\.json$|pruebas\/manuales\.md$|plan\/tareas\.json$|docs\/)|(^|\/)(__datos__|muestras)\/|\.md$/;
const PRUEBA =
  /\.test\.ts$|\.cmp\.test\.tsx$|\.e2e\.ts$|\.bench\.ts$|(^|\/)test\/|^tools\/lint\/controles\//;
const MIGRACION = /^packages\/db\/prisma\/migrations\/([^/]+)\//;
const NOMBRES: Record<string, string> = {
  prod: 'producción',
  archivos: 'archivos de producción',
  ca: 'CA',
  migraciones: 'migraciones nuevas',
  total: 'total',
};
const nombre = (r: string): string => r.slice(r.lastIndexOf('/') + 1);

/** Clase de 08 §1.1. Lo explícito gana: generado, después dato, después prueba. */
export function clasificar(r: string): Clase {
  if (GENERADO.test(r)) return 'generado';
  if (DATO.test(r)) return 'dato';
  // `**/pruebas/**` es prueba, salvo `tools/pruebas/*.ts`, que es código
  if (PRUEBA.test(r) || (/(^|\/)pruebas\//.test(r) && !/^tools\/pruebas\/[^/]+\.ts$/.test(r)))
    return 'prueba';
  return 'produccion';
}

/** `git diff --numstat`: binarios con 0 líneas; renombrados con la ruta nueva. */
export const leerNumstat = (t: string) =>
  t.split('\n').flatMap((l) => {
    const [ag, bo, ...r] = l.split('\t');
    if (!r.length) return [];
    const ruta = r
      .join('\t')
      .replace(/\{[^}]* => ([^}]*)\}/, '$1')
      .replace(/^.* => /, '');
    return [
      { ruta: ruta.replace(/\/\//g, '/'), agregadas: Number(ag) || 0, borradas: Number(bo) || 0 },
    ];
  });

/** Id de blob de git: dos archivos con la misma huella son idénticos byte a byte. */
export const huella = (c: string | Buffer): string => {
  const b = typeof c === 'string' ? Buffer.from(c) : c;
  return createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
};

/** De `git ls-tree -r <ref>`: un archivo de docs/anexos/ sirve a una ruta de fuera de docs/ con su mismo nombre. */
export const fuentesDeAnexos = (lsTree: string): Fuente[] =>
  [...lsTree.matchAll(/^\d+ blob ([0-9a-f]+)\t(docs\/anexos\/.+)$/gm)].map(
    ([, h = '', o = '']) => ({
      huella: h,
      origen: o,
      acepta: (r) => !r.startsWith('docs/') && nombre(r) === nombre(o),
    }),
  );

/** Bloques de código de docs/0n-*.md: sirven a una ruta que su sección nombra (completa, o un tramo entre ``). */
export function fuentesDeBloques(docs: { nombre: string; texto: string }[]): Fuente[] {
  const sal: Fuente[] = [];
  for (const d of docs) {
    let [titulo, sec, bloques, dentro] = ['', '', [] as string[], null as string | null];
    const cerrar = (t: string, texto: string): void => {
      const nombra = (r: string): boolean =>
        texto.includes(r) || r.split('/').some((s) => t.includes('`' + s + '`'));
      for (const b of bloques)
        sal.push({
          huella: huella(b),
          origen: `${d.nombre} § ${t}`,
          acepta: (r) => !r.startsWith('docs/') && nombra(r),
        });
      [sec, bloques] = ['', []];
    };
    for (const l of d.texto.split('\n')) {
      if (dentro !== null && l.startsWith('```')) [bloques, dentro] = [[...bloques, dentro], null];
      else if (dentro !== null) dentro += l + '\n';
      else if (l.startsWith('```')) dentro = '';
      else if (/^#{1,6} /.test(l)) {
        cerrar(titulo, sec);
        titulo = l.replace(/^#+\s*/, '');
      }
      sec += l + '\n';
    }
    cerrar(titulo, sec);
  }
  return sal;
}

/** CH-10: un archivo de docs/ idéntico a uno de la carpeta de entrada (si existe en esta PC) es portado. */
export const fuentesDeCarpeta = (dir: string): Fuente[] =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { recursive: true, withFileTypes: true }).flatMap((e) => {
        const p = join(e.parentPath, e.name);
        const acepta = (r: string): boolean => r.startsWith('docs/') && nombre(r) === e.name;
        return e.isFile() ? [{ huella: huella(readFileSync(p)), origen: p, acepta }] : [];
      });

/** La tabla EXCEPCIONES de tools/plan/verificar.ts (portado; no se importa porque se ejecuta al cargarse). */
export const excepcionesDe = (fuente: string): Excepciones =>
  Object.fromEntries(
    [
      ...fuente.matchAll(/'(DT-\d+)': \{ tareas: \[([^\]]*)\], medida: '(\w+)', maximo: (\d+) \}/g),
    ].map(([, id, t = '', medida, max]) => [
      id,
      { tareas: t.match(/TA-\d{3}/g) ?? [], medida, maximo: Number(max) },
    ]),
  );

export function medir(
  arch: Archivo[],
  f: { id: string; cubre: string[]; excepcion: string },
  o: { fuentes: Fuente[]; excepciones: Excepciones },
) {
  const errores: string[] = [];
  const lim: Record<string, number> = { ...LIMITES };
  if (f.excepcion) {
    const [, id = 'Excepción', medida, n] = /^(DT-\d+) (\w+)=(\d+)$/.exec(f.excepcion) ?? [];
    const e = o.excepciones[id];
    if (!e?.tareas.includes(f.id) || e.medida !== medida || Number(n) > e.maximo)
      errores.push(`${id} la excepción no está aprobada para ${f.id}`);
    else lim[e.medida] = Number(n);
  }
  const portados: { ruta: string; fuente: string; huella: string }[] = [];
  const detalle = arch.map((a) => {
    const fu = o.fuentes.find((x) => x.huella === a.blob && x.acepta(a.ruta));
    if (fu) portados.push({ ruta: a.ruta, fuente: fu.origen, huella: fu.huella });
    return { ...a, clase: fu ? 'portado' : clasificar(a.ruta), lineas: a.agregadas + a.borradas };
  });
  const prod = detalle.filter((d) => d.clase === 'produccion');
  const sumar = (xs: typeof detalle): number => xs.reduce((s, d) => s + d.lineas, 0);
  const carpetas = arch.flatMap((a) => (a.nuevo ? (MIGRACION.exec(a.ruta)?.slice(1) ?? []) : []));
  const v = {
    prod: sumar(prod),
    archivos: prod.length,
    ca: f.cubre.filter((c) => /^CA-\d{2}\.\d+$/.test(c)).length,
    migraciones: new Set(carpetas).size,
    total: sumar(detalle.filter((d) => d.clase !== 'generado' && d.clase !== 'portado')),
  };
  for (const [k, n] of Object.entries(v))
    if (n > (lim[k] ?? 0))
      errores.push(`DT-01 ${NOMBRES[k]} ${n} > ${lim[k]}${/prod|total/.test(k) ? ' líneas' : ''}`);
  return { ...v, portados, detalle, errores };
}
