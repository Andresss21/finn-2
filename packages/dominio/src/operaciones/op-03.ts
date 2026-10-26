// OP-03 Reordenar cuentas (01 §5.1, 04 §3.1): solo el orden, posición × 10 en las filas que cambian.
// Sin efectos de cálculo.
import type { Cambio, ComandoOp03, Instantanea, Rechazo } from '../hechos';
import type { Efecto } from './aplicar';

export function op03(antes: Instantanea, x: ComandoOp03): Efecto | Rechazo {
  const abiertas = antes.hechos.cuentas
    .filter((k) => !k.archivada)
    .sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1));
  const pedidas = new Set(x.orden);
  const completa = pedidas.size === x.orden.length && pedidas.size === abiertas.length;
  if (!completa || abiertas.some((k) => !pedidas.has(k.id)))
    return { codigo: 'conflicto_desactualizado', campo: 'orden' };
  // Valor absoluto (4.6.2): si el orden ya es el pedido, no hay nada que escribir.
  if (abiertas.every((k, i) => x.orden[i] === k.id)) return { cambios: [] };
  const actual = new Map(abiertas.map((k) => [k.id, k.orden]));
  const cambios = x.orden.flatMap((id, i): Cambio[] =>
    actual.get(id) === (i + 1) * 10
      ? []
      : [{ tipo: 'actualizar', tabla: 'cuentas', id, campos: { orden: (i + 1) * 10 } }],
  );
  return { cambios };
}
