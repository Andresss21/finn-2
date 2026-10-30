export interface RutaDelArbol {
  ruta: string;
  clase: string;
}
export function carpetaDeFlujo(ruta: string): string;
export function rutasDelArbol(markdown: string): RutaDelArbol[];
export function verificarRutas(raiz: string): string[];
