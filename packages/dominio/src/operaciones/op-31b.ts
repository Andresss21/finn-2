// OP-31b Cobrar varios (01 §5.5, 04 §3.5 [CH-291]): un pago de un deudor repartido entre sus líneas marcadas con la regla de
// `repartoDeCobro`, y un OP-31 por línea con monto > 0, misma cuenta, fecha e instante, en un solo `aplicar`: todos o ninguno.
import { porCobrar } from '../calculo/por-cobrar';
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { op31 } from './op-31';
import { esRechazo, rechazo } from './rechazos';

/** Lo que el pago cobra de una línea y el saldo abierto con que queda. */
export type ParteDeCobro = Readonly<{ lineaId: H.Uuid; monto: Centavos; queda: Centavos }>;
type Pedido = Pick<H.ComandoOp31b, 'deudorId' | 'lineaIds' | 'fecha' | 'total'>;

const menor = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * El reparto del pago (01 §5.5), con las precondiciones de OP-31 por línea: de la más antigua a la más nueva (fecha de la
 * compra y, a igual fecha, id), cierra cada saldo antes de la siguiente; la última que toca puede quedar parcial y el
 * excedente va a la última marcada (§4.10).
 */
export function repartoDeCobro(h: H.Hechos, x: Pedido): ParteDeCobro[] | H.Rechazo {
  const [todas, alCobro] = [porCobrar(h), porCobrar(h, x.fecha)]; // B-7, CB-23: saldo a la fecha del cobro
  const marcadas: { lineaId: H.Uuid; fecha: string; abierto: Centavos }[] = [];
  for (const lineaId of x.lineaIds) {
    const y = todas.find((z) => z.lineaId === lineaId);
    if (y === undefined || y.deudorId !== x.deudorId)
      return { codigo: 'linea_no_es_por_cobrar', datos: { lineaId } };
    if (x.fecha < y.fecha) return rechazo('evento_anterior_a_original', { fecha: y.fecha });
    const abierto = alCobro.find((z) => z.lineaId === lineaId)?.abierto ?? Centavos.cero;
    if (abierto <= 0) return { codigo: 'sin_saldo_abierto', datos: { lineaId, fecha: x.fecha } };
    marcadas.push({ lineaId, fecha: y.fecha, abierto });
  }
  marcadas.sort((a, b) => menor(a.fecha, b.fecha) || menor(a.lineaId, b.lineaId));
  const topes = marcadas.map(({ abierto }) => abierto);
  const montos = Centavos.llenarEnOrden(x.total, topes);
  return marcadas.flatMap(({ lineaId, abierto }, i) => {
    const monto = montos[i] ?? Centavos.cero;
    const queda = Centavos.max(Centavos.cero, Centavos.restar(abierto, monto));
    return monto > 0 ? [{ lineaId, monto, queda }] : [];
  });
}

export function op31b(antes: H.Instantanea, x: H.ComandoOp31b): Efecto | H.Rechazo {
  if (x.lineaIds.length === 0 || new Set(x.lineaIds).size !== x.lineaIds.length)
    throw new TypeError(`OP-31b ${x.id}: sin líneas o con líneas repetidas`);
  const reparto = repartoDeCobro(antes.hechos, x);
  if (esRechazo(reparto)) return reparto;
  const { instante, ids, fecha, cuentaId } = x;
  const efecto = { cambios: [] as H.Cambio[], avisos: [] as H.AvisoOperacion[] };
  // Líneas distintas: cada OP-31 sobre la instantánea de antes ve lo mismo que después de los otros
  for (const [i, { lineaId, monto }] of reparto.entries()) {
    const id = i === 0 ? x.id : ids.siguiente();
    const r = op31(antes, {
      operacion: 'OP-31',
      id,
      instante,
      ids,
      fecha,
      total: monto,
      lineaId,
      cuentaId,
    });
    if (esRechazo(r)) return r;
    efecto.cambios.push(...r.cambios);
    efecto.avisos.push(...(r.avisos ?? []));
  }
  return efecto;
}
