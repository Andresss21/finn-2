// Secciones de la app y sección activa por prefijo (05 §3.1, §3.3, FE-29, FE-30). Funciones puras, sin Next.
import { navegacion } from '../../textos/navegacion';

export type IdSeccion = keyof typeof navegacion.secciones;

export interface Seccion {
  readonly id: IdSeccion;
  readonly ruta: string;
  readonly etiqueta: string;
  readonly nivel: 'principal' | 'secundaria';
}

// El orden de 3.1.
const DEFINICION: readonly (readonly [IdSeccion, string, Seccion['nivel']])[] = [
  ['inicio', '/', 'principal'],
  ['presupuesto', '/presupuesto', 'principal'],
  ['bandeja', '/bandeja', 'principal'],
  ['actividad', '/actividad', 'principal'],
  ['cuentas', '/cuentas', 'principal'],
  ['reportes', '/reportes/tendencia', 'secundaria'],
  ['metas', '/metas', 'secundaria'],
  ['programadas', '/programadas', 'secundaria'],
  ['por-cobrar', '/por-cobrar', 'secundaria'],
  ['reglas', '/reglas', 'secundaria'],
  ['notificaciones', '/notificaciones', 'secundaria'],
  ['ajustes', '/ajustes', 'secundaria'],
];

export const SECCIONES: readonly Seccion[] = DEFINICION.map(([id, ruta, nivel]) => ({
  id,
  ruta,
  etiqueta: navegacion.secciones[id],
  nivel,
}));

// Prefijo de cada sección: el de la ruta raíz, salvo Reportes (`/reportes`) y Registrar, que no tiene sección (3.3).
const PREFIJOS: readonly (readonly [string, IdSeccion | null])[] = [
  ...SECCIONES.filter((s) => s.id !== 'inicio' && s.id !== 'reportes').map(
    (s) => [s.ruta, s.id] as const,
  ),
  ['/reportes', 'reportes'],
  ['/registrar', null],
];

/** El prefijo más largo de 3.3 que contiene la ruta; `/` solo coincide exacto. Sin coincidencia, `null`. */
export function seccionDeRuta(pathname: string): IdSeccion | null {
  if (pathname === '/') return 'inicio';
  let mejor: { prefijo: string; id: IdSeccion | null } | null = null;
  for (const [prefijo, id] of PREFIJOS) {
    const coincide = pathname === prefijo || pathname.startsWith(`${prefijo}/`);
    if (coincide && (mejor === null || prefijo.length > mejor.prefijo.length))
      mejor = { prefijo, id };
  }
  return mejor?.id ?? null;
}

// `rutaPadre` de los detalles (3.3); el tercero dice si lleva el mismo `?periodo=`. `/cuentas/nueva` y `ordenar` son flujos.
const DETALLES: readonly (readonly [RegExp, string, boolean])[] = [
  [/^\/presupuesto\/categorias\/[^/]+$/, '/presupuesto', true],
  [/^\/presupuesto\/(listo-para-asignar|estructura)$/, '/presupuesto', false],
  [/^\/actividad\/[^/]+$/, '/actividad', false],
  [/^\/cuentas\/(?!nueva$|ordenar$)[^/]+$/, '/cuentas', false],
  [/^\/ajustes\/.+$/, '/ajustes', false],
];

/**
 * «Volver» de una pantalla hija (3.3, N8): `?volver=` si es una ruta interna (3.6, [R2]); si no, la `rutaPadre`. La etiqueta
 * nombra la sección de la ruta a la que vuelve. Fuera de un detalle, `null`.
 */
export function volverDeRuta(
  pathname: string,
  busqueda: Pick<URLSearchParams, 'get'>,
): { readonly ruta: string; readonly etiqueta: string } | null {
  const detalle = DETALLES.find(([patron]) => patron.test(pathname));
  if (detalle === undefined) return null;
  const [, padre, conPeriodo] = detalle;
  const pedido = busqueda.get('volver') ?? '';
  const periodo = busqueda.get('periodo');
  const ruta = /^\/(?![/\\])/.test(pedido)
    ? pedido
    : conPeriodo && periodo !== null
      ? `${padre}?periodo=${encodeURIComponent(periodo)}`
      : padre;
  const id = seccionDeRuta(ruta.split('?')[0] ?? ruta);
  return { ruta, etiqueta: navegacion.volverA(id === null ? null : navegacion.secciones[id]) };
}
