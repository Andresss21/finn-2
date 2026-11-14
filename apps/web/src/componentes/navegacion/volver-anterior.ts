// [CH-288] La flecha «Volver» de una pantalla hija (05 §3.3, N8) regresa a la pantalla anterior si se llegó navegando dentro de
// Finn en esta pestaña; si no, a su `rutaPadre`. Lee el historial de la pestaña con la API Navigation del navegador (las
// entradas guardan su URL de verdad, también después de un `replace`). Solo vale una entrada que este documento vio: una recarga,
// una pestaña nueva, un enlace externo o una notificación empiezan sin ninguna anterior, y van a la `rutaPadre`. Nunca vuelve
// a un flujo (cerrado o no), a un panel ni a una pantalla con `?resultado=` de un flujo terminado. Sin la API, la `rutaPadre`.
import { navegacion } from '../../textos/navegacion';
import { SECCIONES, seccionDeRuta } from './secciones';

/** Lo que se usa de una entrada de `window.navigation` (la API Navigation; TypeScript todavía no la declara). */
export interface EntradaHistorial {
  readonly key: string;
  readonly url: string | null;
  readonly index: number;
}

/** Lo que se usa de `window.navigation`. */
export interface Historial {
  readonly currentEntry: EntradaHistorial | null;
  entries(): EntradaHistorial[];
  addEventListener(tipo: 'currententrychange', escucha: () => void): void;
  removeEventListener(tipo: 'currententrychange', escucha: () => void): void;
}

/** El historial de la pestaña, o `undefined` si el navegador no tiene la API Navigation. */
export function historialDelNavegador(): Historial | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { readonly navigation?: Historial }).navigation;
}

// Las entradas que este documento vio (por su `key`, que un `replace` conserva). Una por pestaña: vive lo que vive el documento.
const vistas = new Set<string>();
const registrados = new WeakSet<Historial>();

/** El marco lo llama al montarse: desde ahí anota cada pantalla de Finn por la que pasa la pestaña. */
export function registrarHistorial(historial = historialDelNavegador()): void {
  if (historial === undefined || registrados.has(historial)) return;
  registrados.add(historial);
  const anotar = () => {
    const actual = historial.currentEntry;
    if (actual !== null) vistas.add(actual.key);
  };
  anotar();
  historial.addEventListener('currententrychange', anotar);
}

// Pantallas a las que se puede volver: las secciones de 3.1, un reporte y los detalles de 3.3 que no son flujos. Las rutas de
// flujos (`/metas/[id]`, `/reglas/[id]`, `/programadas/[id]`, `nueva`, `editar`, Apariencia, Ciclo…) quedan fuera.
const PANTALLAS: readonly RegExp[] = [
  /^\/reportes\/[^/]+$/,
  /^\/presupuesto\/categorias\/[^/]+$/,
  /^\/presupuesto\/(listo-para-asignar|estructura)$/,
  /^\/actividad\/[^/]+$/,
  /^\/cuentas\/(?!nueva$|ordenar$)[^/]+$/,
  /^\/ajustes\/(formatos|instituciones|notificaciones|seguridad|webhook)$/,
];

export function esPantallaDeFinn(pathname: string): boolean {
  return SECCIONES.some((s) => s.ruta === pathname) || PANTALLAS.some((p) => p.test(pathname));
}

/**
 * La pantalla anterior a la que puede volver la flecha: cuántos pasos atrás y su ruta. Se saltan las entradas de la misma
 * pantalla (otro período, un resultado puesto encima); la primera distinta decide. `null` si no hay una que valga.
 */
export function anteriorEnFinn(
  historial: Historial | undefined,
  origen: string,
): { readonly pasos: number; readonly ruta: string } | null {
  const actual = historial?.currentEntry;
  if (historial === undefined || actual === null || actual === undefined || actual.url === null)
    return null;
  const aqui = new URL(actual.url).pathname;
  const entradas = historial.entries();
  for (let indice = actual.index - 1; indice >= 0; indice--) {
    const entrada = entradas[indice];
    if (entrada === undefined || entrada.url === null || !vistas.has(entrada.key)) return null;
    const url = new URL(entrada.url);
    if (url.origin !== origen) return null;
    if (url.pathname === aqui) continue;
    if (!esPantallaDeFinn(url.pathname) || url.searchParams.has('resultado')) return null;
    return { pasos: actual.index - indice, ruta: `${url.pathname}${url.search}` };
  }
  return null;
}

/** El nombre accesible de la flecha que vuelve a `ruta`: «Volver a {sección}» si es una sección o un reporte; si no, «Volver». */
export function etiquetaDeVuelta(ruta: string): string {
  const pathname = ruta.split('?')[0] ?? ruta;
  const id = seccionDeRuta(pathname);
  if (id === null) return navegacion.volverA(null);
  const esSeccion = SECCIONES.some((s) => s.ruta === pathname) || /^\/reportes\//.test(pathname);
  return navegacion.volverA(esSeccion ? navegacion.secciones[id] : null);
}
