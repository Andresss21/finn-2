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
