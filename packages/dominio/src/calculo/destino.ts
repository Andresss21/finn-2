// Destino de una línea (03 §3.14, DB-05; 01 inv. 8, §5.5 OP-33a). Una línea de devolución vinculada
// guarda solo `lineaOriginalId` (num_nonnulls(categoria_id, deudor_id, linea_original_id) = 1): su
// categoría o su deudor son los de esa línea, que existen una sola vez. Todo lo que lee el destino
// de una línea pasa por aquí.
import type { Linea, Uuid } from '../hechos';

export type Destino = Pick<Linea, 'categoriaId' | 'deudorId'>;
type ConDestino = Destino & Pick<Linea, 'lineaOriginalId'>;

/** El destino de `l`: el propio o, en una devolución vinculada, el de su línea original. */
export function destinoDe(l: ConDestino, lineas: ReadonlyMap<Uuid, ConDestino>): Destino {
  const o = l.lineaOriginalId === null ? undefined : lineas.get(l.lineaOriginalId);
  const d = o ?? l;
  return { categoriaId: d.categoriaId, deudorId: d.deudorId };
}

/** `destinoDe` con el índice por id de `lineas` ya armado. */
export function destinos(lineas: readonly Linea[]): (l: ConDestino) => Destino {
  const porId = new Map<Uuid, ConDestino>(lineas.map((l) => [l.id, l]));
  return (l) => destinoDe(l, porId);
}
