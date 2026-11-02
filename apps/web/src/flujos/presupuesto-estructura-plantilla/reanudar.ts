// Reanudación SIN borrador (06 §3.9.1; CA-04.10): se compara la lista sugerida con `estructura()`, por nombre y sin mayúsculas, dentro
// de su grupo. Lo que ya existe cuenta como creado y conserva su id (una categoría nueva cuelga del grupo existente); el resto lleva
// ids nuevos. Devuelve `null` si no existe ninguna categoría de la lista o si ya existe toda: no hay nada que retomar.
import { plantilla } from '../../textos/plantilla';

export interface Existente {
  readonly id: string;
  readonly nombre: string;
  readonly categorias: readonly { readonly id: string; readonly nombre: string }[];
}
interface Elemento {
  readonly id: string;
  readonly tipo: 'grupo' | 'categoria';
  readonly nombre: string;
  readonly grupoId?: string;
}
interface Retomada {
  readonly elementos: Elemento[];
  readonly resultados: Record<string, string | null>;
}

const norma = (n: string): string => n.trim().toLowerCase();

export function retomarPorNombre(existentes: readonly Existente[]): Retomada | null {
  const elementos: Elemento[] = [];
  const resultados: Record<string, string | null> = {};
  let categoriasExistentes = 0;
  for (const g of plantilla.grupos) {
    const previo = existentes.find((e) => norma(e.nombre) === norma(g.nombre));
    const id = previo?.id ?? crypto.randomUUID();
    elementos.push({ id, tipo: 'grupo', nombre: g.nombre });
    if (previo !== undefined) resultados[id] = null;
    for (const nombre of g.categorias) {
      const ya = previo?.categorias.find((c) => norma(c.nombre) === norma(nombre));
      const categoria = ya?.id ?? crypto.randomUUID();
      elementos.push({ id: categoria, tipo: 'categoria', nombre, grupoId: id });
      if (ya !== undefined) {
        resultados[categoria] = null;
        categoriasExistentes += 1;
      }
    }
  }
  const completa = Object.keys(resultados).length === elementos.length;
  return categoriasExistentes === 0 || completa ? null : { elementos, resultados };
}
