// Dirección de entrada de una pantalla (06-identidad-visual §11 **[CH-220]** **[CH-241]**, GLO-01 y GLO-02): de dónde viene el contenido
// según de qué ruta a qué ruta se navega. Función pura y sin Next: la usa el marco, que la deja en `#contenido[data-entrada]`; el
// movimiento lo resuelve `globals.css` con esa variable, sin JS por ruta.
import { SECCIONES, seccionDeRuta, volverDeRuta } from './secciones';

export type DireccionEntrada =
  | 'derecha' // pestaña a la derecha de la actual
  | 'izquierda' // pestaña a la izquierda
  | 'hija' // abrir un detalle: desde la derecha
  | 'volver' // volver al padre: desde la izquierda
  | 'registrar' // Registrar: sube desde abajo
  | 'cerrar-registrar'; // cerrar Registrar: aparece con 8 px hacia arriba

const SIN_BUSQUEDA = { get: (): null => null };
const esRegistrar = (ruta: string): boolean =>
  ruta === '/registrar' || ruta.startsWith('/registrar/');
const esHija = (ruta: string): boolean => volverDeRuta(ruta, SIN_BUSQUEDA) !== null;
const posicion = (ruta: string): number => {
  const id = seccionDeRuta(ruta);
  return SECCIONES.findIndex((s) => s.id === id);
};

/** `null` si no hay de dónde venir (primera pantalla) o la ruta no cambia de pantalla. */
export function direccionDeEntrada(previa: string | null, nueva: string): DireccionEntrada | null {
  if (previa === null || previa === nueva) return null;
  if (esRegistrar(nueva)) return esRegistrar(previa) ? null : 'registrar';
  if (esRegistrar(previa)) return 'cerrar-registrar';
  if (esHija(nueva) && !esHija(previa)) return 'hija';
  if (esHija(previa) && !esHija(nueva)) return 'volver';
  const antes = posicion(previa);
  const ahora = posicion(nueva);
  if (antes < 0 || ahora < 0 || antes === ahora) return null;
  return ahora > antes ? 'derecha' : 'izquierda';
}
