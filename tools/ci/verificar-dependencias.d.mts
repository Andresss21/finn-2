export interface FalloDeDependencias {
  control: 'a';
  archivo: string;
  mensaje: string;
}
export function verificar(raiz: string): FalloDeDependencias[];
