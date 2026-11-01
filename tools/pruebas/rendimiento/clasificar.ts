// Presupuestos de bytes de 05 §13.1 y método de 05 §13.4 (FE-48, V5-20, V5-35): lo puro de apps/web/e2e/rendimiento.
// Compartido = lo que cargan todas las rutas. Biblioteca de formularios = lo que cargan todas las rutas con formulario y
// ninguna sin formulario. Por ruta = el resto; lo que comparten solo algunas rutas con formulario cuenta en cada una.
export interface Presupuestos {
  compartidoKb: number;
  formulariosKb: number;
  precacheKb: number;
  porRutaKb: number;
  reportesKb: number;
  lcpMs: number;
  cls: number;
  inpMs: number;
  ejemplosDeRuta: Record<string, string>;
}
export interface MedidaRuta {
  ruta: string;
  formulario: boolean;
  /** Ruta del archivo → bytes transferidos con gzip. */
  scripts: Record<string, number>;
}
export interface Clasificacion {
  compartidoKb: number;
  formulariosKb: number;
  rutas: { ruta: string; kb: number; topeKb: number }[];
  excesos: string[];
}

/** 05 §13.1, CH-61: una ruta tiene formulario si carga la biblioteca; React Hook Form conserva esta opción al minificar. */
export const cargaBibliotecaDeFormularios = (cuerpos: string[]): boolean =>
  cuerpos.some((c) => /\bshouldUnregister\b/.test(c));

const kb = (bytes: number): number => Math.round(bytes / 10) / 100; // 05 §13.1: KB = 1.000 bytes

const comunes = (grupo: MedidaRuta[]): Set<string> => {
  const [primera, ...resto] = grupo;
  return new Set(
    Object.keys(primera?.scripts ?? {}).filter((f) => resto.every((m) => f in m.scripts)),
  );
};

export function clasificar(medidas: MedidaRuta[], p: Presupuestos): Clasificacion {
  const compartido = comunes(medidas);
  const sinFormulario = medidas.filter((m) => !m.formulario);
  const biblioteca = new Set(
    [...comunes(medidas.filter((m) => m.formulario))].filter(
      (f) => !compartido.has(f) && !sinFormulario.some((m) => f in m.scripts),
    ),
  );
  const suma = (m: MedidaRuta | undefined, de: (f: string) => boolean): number =>
    Object.entries(m?.scripts ?? {}).reduce((t, [f, b]) => t + (de(f) ? b : 0), 0);
  const compartidoKb = kb(suma(medidas[0], (f) => compartido.has(f)));
  const formulariosKb = kb(
    suma(
      medidas.find((m) => m.formulario),
      (f) => biblioteca.has(f),
    ),
  );
  const rutas = medidas.map((m) => ({
    ruta: m.ruta,
    kb: kb(suma(m, (f) => !compartido.has(f) && !biblioteca.has(f))),
    topeKb: m.ruta.startsWith('/reportes/') ? p.reportesKb : p.porRutaKb,
  }));
  const excesos = [
    ...(compartidoKb > p.compartidoKb
      ? [`JS compartido: ${compartidoKb} KB > ${p.compartidoKb} KB`]
      : []),
    ...(formulariosKb > p.formulariosKb
      ? [`biblioteca de formularios: ${formulariosKb} KB > ${p.formulariosKb} KB`]
      : []),
    ...rutas.filter((r) => r.kb > r.topeKb).map((r) => `${r.ruta}: ${r.kb} KB > ${r.topeKb} KB`),
  ];
  return { compartidoKb, formulariosKb, rutas, excesos };
}

/** Las páginas de `(finn)` en `.next/app-path-routes-manifest.json`, sin los slots ni las interceptaciones. */
export function rutasDeFinn(manifiesto: Record<string, string>): { clave: string; ruta: string }[] {
  return Object.entries(manifiesto)
    .filter(([c]) => c.startsWith('/(finn)/') && c.endsWith('/page'))
    .filter(([c]) => !c.includes('/@') && !c.includes('(.)'))
    .map(([clave, ruta]) => ({ clave, ruta }));
}

/**
 * Las rutas de `(finn)`, con slots e interceptaciones, que la compilación dejó prerenderizadas (CH-66), según
 * `.next/app-path-routes-manifest.json` y `.next/prerender-manifest.json`.
 */
export function prerenderizadasDeFinn(
  rutas: Record<string, string>,
  prerender: {
    routes: Record<string, { srcRoute?: string | null }>;
    dynamicRoutes: Record<string, unknown>;
  },
): string[] {
  const estaticas = new Set(Object.keys(prerender.dynamicRoutes));
  for (const [ruta, { srcRoute }] of Object.entries(prerender.routes)) {
    estaticas.add(ruta);
    if (srcRoute) estaticas.add(srcRoute);
  }
  return Object.entries(rutas)
    .filter(
      ([c, ruta]) => c.startsWith('/(finn)/') && /\/(page|route)$/.test(c) && estaticas.has(ruta),
    )
    .map(([, ruta]) => ruta);
}

/** La URL con la que se mide una ruta; las de parámetros necesitan su ejemplo de la semilla, o `null`. */
export const urlDe = (ruta: string, ejemplos: Record<string, string>): string | null =>
  ruta.includes('[') ? (ejemplos[ruta] ?? null) : ruta;

export function mediana(valores: number[]): number {
  const o = [...valores].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 === 1 ? (o[m] ?? 0) : ((o[m - 1] ?? 0) + (o[m] ?? 0)) / 2;
}

/** La tabla del resumen del job, con la diferencia contra la última medida de `main` si la hay (05 §13.4). */
export function tabla(c: Clasificacion, base: Clasificacion | null, nota: string): string {
  const delta = (actual: number, antes: number | undefined): string =>
    antes === undefined
      ? '—'
      : `${actual >= antes ? '+' : ''}${Math.round((actual - antes) * 100) / 100}`;
  const filas = [
    ['Compartido', c.compartidoKb, base?.compartidoKb],
    ['Biblioteca de formularios', c.formulariosKb, base?.formulariosKb],
    ...c.rutas.map((r) => [r.ruta, r.kb, base?.rutas.find((x) => x.ruta === r.ruta)?.kb] as const),
  ] as const;
  return [
    `### Tamaño de JS (05 §13.1)`,
    '',
    nota,
    '',
    '| Qué | KB gzip | Contra main |',
    '|---|---|---|',
    ...filas.map(([q, a, b]) => `| ${q} | ${a} | ${delta(a, b)} |`),
    '',
  ].join('\n');
}
