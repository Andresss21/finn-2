// E3-7, la parte del marco: la API con la que el arrastre de la Bandeja (TA-576) avisa que empieza o termina. Mientras dura un
// arrastre en el teléfono el marco deja la barra inferior `inert`, para que un dedo desviado no cambie de sección a mitad del gesto.
export const EVENTO_ARRASTRE = 'finn:arrastre';

/** `true` al empezar el arrastre, `false` al terminar (o cancelarlo). */
export function avisarArrastre(arrastrando: boolean): void {
  window.dispatchEvent(new CustomEvent<boolean>(EVENTO_ARRASTRE, { detail: arrastrando }));
}
