// OP-25 Aportar, retirar o ajustar una inversión (01 §5.4, 04 §3.4; P3, H13, supuesto 17):
// a) aporte: efectivo −X, inversión +X y una línea a una categoría normal (consumo de débito);
// b) retiro: inversión −X, efectivo +X, otras entradas de LPA (§4.13), con X ≤ valor;
// c) ajuste de valor: inversión ±X, sin efecto presupuestario, con valor resultante ≥ 0.
import { valorDeInversion } from '../calculo/saldos';
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { alta, categoriaNormal, cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

export function op25(antes: H.Instantanea, x: H.ComandoOp25): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const i = cuentaDe(h, x.inversionId, 'inversion');
  if (esRechazo(i)) return i;
  // El valor es el saldo de la inversión con todos sus efectos, como el capital pendiente de OP-24.
  const valor = valorDeInversion(h, i.id);
  if (x.modalidad === 'ajuste') {
    // El total de la transacción es |X|; el signo va en el efecto (03 §4.5.1).
    if (x.total === Centavos.cero) throw new TypeError('OP-25: ajuste de valor 0');
    if (Centavos.sumar(valor, x.total) < Centavos.cero)
      return { codigo: 'valor_inversion_negativo', datos: { valor, ajuste: x.total } };
    const total = Centavos.max(x.total, Centavos.negar(x.total));
    const partes = [{ cuentaId: i.id, monto: x.total }];
    return { cambios: alta({ ...x, total }, 'ajuste_inversion', partes) };
  }
  const k = cuentaDe(h, x.cuentaId, 'efectivo');
  if (esRechazo(k)) return k;
  const menos = Centavos.negar(x.total);
  if (x.modalidad === 'retiro') {
    if (x.total > valor)
      return { codigo: 'retiro_mayor_que_valor', datos: { valor, total: x.total } };
    const partes = [
      { cuentaId: i.id, monto: menos },
      { cuentaId: k.id, monto: x.total },
    ];
    return { cambios: alta(x, 'retiro_inversion', partes) };
  }
  const c = categoriaNormal(h, x.categoriaId);
  if (esRechazo(c)) return c;
  const partes = [
    { cuentaId: k.id, monto: menos },
    { cuentaId: i.id, monto: x.total },
  ];
  const linea = { monto: x.total, categoriaId: c.id, deudorId: null };
  return { cambios: alta(x, 'aporte_inversion', partes, [linea]) };
}
