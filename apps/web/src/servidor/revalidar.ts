// Lo que invalida una escritura correcta (04 §5.8, CH-97): `revalidatePath(ARBOL_CON_DATOS, 'layout')`, el árbol de
// `(finn)`, donde están todas las páginas con datos. Las rutas estáticas (`/serwist/[path]`, `manifest`, `/sin-conexion`)
// no dependen de datos y no se invalidan: con `revalidatePath('/', 'layout')`, Vercel regeneraba `/serwist/sw.js` en
// runtime tras cada escritura (05 §8.1, FE-52). Sin importaciones: PRU-E2E-PWA-109 lo lee desde Playwright.

/** El segmento que se revalida; PRU-E2E-PWA-109 deriva de aquí la etiqueta y la busca en la compilación. */
export const ARBOL_CON_DATOS = '/(finn)';
