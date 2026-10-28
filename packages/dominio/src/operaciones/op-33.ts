// OP-33 Devolver (01 §5.5, §4.4, §4.10; 04 §3.5; P10, H7, N2, I5, Q2, supuesto 13, C-3, ajuste 1):
// una transacción `devolucion` con +X en efectivo o tarjeta. a) Vinculada a un gasto: una línea por
// parte del reparto, con el destino de su línea original (aunque su categoría esté archivada, inv. 20)
// y `lineaOriginalId`. b) Sin compra original: una línea a una categoría normal y activa. Los casos
// D-1 a D-4 y el saldo abierto los derivan `aportes` y `porCobrar`. Fecha, archivo e inv. 9 a 12 en
// el momento del evento los verifica `aplicar`.
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { alta, categoriaNormal, cuentaDe, type LineaNueva } from './op-20';
import { eventosDe } from './op-28';
import { esRechazo } from './rechazos';

type R = H.Rechazo;
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

/** PT con `tipo = 'devolucion'` y +total en la cuenta. */
const devolucion = (x: H.ComandoOp33, cuentaId: H.Uuid, lineas: readonly LineaNueva[]): Efecto => ({
  cambios: alta(x, 'devolucion', [{ cuentaId, monto: x.total }], lineas),
});

function vinculada(antes: H.Instantanea, x: H.ComandoOp33a): Efecto | R {
  const { hechos: h } = antes;
  const t = buscar(h.transacciones, x.transaccionOriginalId, 'transacciones');
  if (esRechazo(t)) return t;
  // C-3, CB-31: una cuota, un abono o un aporte no admiten devoluciones vinculadas.
  if (t.tipo !== 'gasto')
    return { codigo: 'devolucion_de_no_gasto', datos: { transaccionId: t.id, tipo: t.tipo } };
  const deLaCompra = h.efectos.find((e) => e.transaccionId === t.id)?.cuentaId;
  const k = cuentaDe(h, x.cuentaId ?? (deLaCompra as H.Uuid), 'efectivo', 'tarjeta');
  if (esRechazo(k)) return k;
  const sumaReparto = suma(x.reparto.map((y) => y.monto));
  if (sumaReparto !== x.total)
    return { codigo: 'reparto_devolucion_distinto', datos: { suma: sumaReparto, total: x.total } };
  const propias = h.lineas.filter((l) => l.transaccionId === t.id);
  const pedido = new Map<H.Linea, Centavos>();
  for (const { lineaId, monto } of x.reparto) {
    const l = buscar(propias, lineaId, 'lineas');
    if (esRechazo(l)) return l;
    pedido.set(l, Centavos.sumar(pedido.get(l) ?? Centavos.cero, monto));
  }
  // Inv. 11: el total frente a lo que queda de la compra.
  const devuelto = suma(propias.flatMap((l) => eventosDe(h, l).devoluciones.map((y) => y.monto)));
  if (x.total > Centavos.restar(t.total, devuelto))
    return { codigo: 'devolucion_mayor_que_total', datos: { total: t.total, devuelto } };
  // Inv. 10 e inv. 9: cada parte frente a la capacidad de su línea (CB-02, ESC-29).
  for (const [l, monto] of pedido) {
    const abierto = antes.porCobrar.find((y) => y.lineaId === l.id)?.abierto;
    const previas = suma(eventosDe(h, l).devoluciones.map((y) => y.monto));
    const capacidad = abierto ?? Centavos.restar(l.monto, previas);
    if (monto > capacidad)
      return { codigo: 'devolucion_mayor_que_linea', datos: { lineaId: l.id, capacidad } };
  }
  const lineas = x.reparto.map(({ lineaId, monto }) => {
    const o = propias.find((l) => l.id === lineaId) as H.Linea;
    return { monto, categoriaId: o.categoriaId, deudorId: o.deudorId, lineaOriginalId: o.id };
  });
  return devolucion(x, k.id, lineas);
}

export function op33(antes: H.Instantanea, x: H.ComandoOp33): Efecto | R {
  if (x.transaccionOriginalId !== undefined) return vinculada(antes, x);
  const { hechos: h } = antes;
  const k = cuentaDe(h, x.cuentaId, 'efectivo', 'tarjeta');
  if (esRechazo(k)) return k;
  const c = categoriaNormal(h, x.categoriaId);
  if (esRechazo(c)) return c;
  const linea = { monto: x.total, categoriaId: c.id, deudorId: null };
  return devolucion(x, k.id, [linea]);
}
