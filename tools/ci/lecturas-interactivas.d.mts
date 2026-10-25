export interface FalloDeLecturas {
  control: 'L10';
  archivo: string;
  mensaje: string;
}
export const LISTA_CERRADA: string[];
export function exportaciones(texto: string): string[];
export function verificarLecturas(raiz: string): FalloDeLecturas[];
