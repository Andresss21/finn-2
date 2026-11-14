// OP-31b Cobrar varios (01 §5.5, 04 §3.5 [CH-291]): un pago de un deudor repartido entre sus líneas por cobrar marcadas.
// La regla de reparto es `repartoDeCobro`: de la más antigua a la más nueva (fecha de la compra y, a igual fecha, id de la
// línea), cada saldo abierto se cierra completo antes de pasar a la siguiente; la última que toca puede quedar parcial y,
// si el pago pasa la suma de los saldos marcados, el excedente va a la última marcada (§4.10). Después es un OP-31 por línea
// con monto > 0, con la misma cuenta, fecha e instante, en un solo `aplicar`: se registran todos o ninguno.
import { porCobrar } from '../calculo/por-cobrar';
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { op31 } from './op-31';
import { esRechazo, rechazo } from './rechazos';

/** Lo que el pago cobra de una línea y el saldo abierto con que queda. */
export interface ParteDeCobro {
  readonly lineaId: H.Uuid;
  readonly monto: Centavos;
  readonly queda: Centavos;
}

type Pedido = Pick<H.ComandoOp31b, 'deudorId' | 'lineaIds' | 'fecha' | 'total'>;

const menor = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** El reparto del pago entre las líneas marcadas, con las precondiciones de OP-31 para cada una. */
export function repartoDeCobro(h: H.Hechos, x: Pedido): ParteDeCobro[] | H.Rechazo {
  const todas = porCobrar(h);
  const alCobro = porCobrar(h, x.fecha); // B-7, CB-23: el saldo con los eventos hasta la fecha del cobro
  const marcadas: {
    readonly lineaId: H.Uuid;
    readonly fecha: string;
    readonly abierto: Centavos;
  }[] = [];
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
  const montos = Centavos.llenarEnOrden(
    x.total,
    marcadas.map((m) => m.abierto),
  );
  return marcadas.flatMap((m, i) => {
    const monto = montos[i] ?? Centavos.cero;
    const queda = Centavos.max(Centavos.cero, Centavos.restar(m.abierto, monto));
    return monto > 0 ? [{ lineaId: m.lineaId, monto, queda }] : [];
  });
}

export function op31b(antes: H.Instantanea, x: H.ComandoOp31b): Efecto | H.Rechazo {
  if (x.lineaIds.length === 0 || new Set(x.lineaIds).size !== x.lineaIds.length)
    throw new TypeError(`OP-31b ${x.id}: sin líneas o con líneas repetidas`);
  const reparto = repartoDeCobro(antes.hechos, x);
  if (esRechazo(reparto)) return reparto;
  const cambios: H.Cambio[] = [];
  const avisos: H.AvisoOperacion[] = [];
  for (const [i, p] of reparto.entries()) {
    // Las líneas son distintas: cada OP-31 sobre la instantánea de antes ve lo mismo que vería después de los otros.
    const r = op31(antes, {
      operacion: 'OP-31',
      id: i === 0 ? x.id : x.ids.siguiente(),
      instante: x.instante,
      ids: x.ids,
      fecha: x.fecha,
      total: p.monto,
      lineaId: p.lineaId,
      cuentaId: x.cuentaId,
    });
    if (esRechazo(r)) return r;
    cambios.push(...r.cambios);
    avisos.push(...(r.avisos ?? []));
  }
  return { cambios, avisos };
}
