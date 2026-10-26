// OP-27 Movimientos de tarjeta sin compra (01 §5.4, 04 §3.4; Q3): a) avance de efectivo (t −X,
// efectivo +X); b) entrada a la tarjeta (t +X); c) transferencia de deuda (la deuda pasa de t a u:
// t +X, u −X; t ≠ u), con AV-24 después: el cambio en "te falta reservar" de las dos tarjetas.
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { alta, cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

const TIPO = {
  avance: 'avance_efectivo',
  entrada: 'entrada_tarjeta',
  transferencia_deuda: 'transferencia_tarjetas',
} as const;

export function op27(antes: H.Instantanea, x: H.ComandoOp27): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const t = cuentaDe(h, x.tarjetaId, 'tarjeta');
  if (esRechazo(t)) return t;
  if (x.modalidad === 'entrada')
    return { cambios: alta(x, TIPO.entrada, [{ cuentaId: t.id, monto: x.total }]) };
  const avance = x.modalidad === 'avance';
  const u = avance
    ? cuentaDe(h, x.cuentaId, 'efectivo')
    : cuentaDe(h, x.tarjetaDestinoId, 'tarjeta');
  if (esRechazo(u)) return u;
  if (u.id === t.id) return { codigo: 'cuentas_iguales', datos: { cuentaId: t.id } };
  // En el avance la tarjeta da el dinero y el efectivo lo recibe; en la transferencia, al revés:
  // la tarjeta de origen deja de deber (+X) y la destino toma la deuda (−X).
  const [da, recibe] = avance ? [t.id, u.id] : [u.id, t.id];
  const partes = [
    { cuentaId: da, monto: Centavos.negar(x.total) },
    { cuentaId: recibe, monto: x.total },
  ];
  const cambios = alta(x, TIPO[x.modalidad], partes);
  if (avance) return { cambios };
  // Sin líneas, Disp(pago(t), A) no cambia: con R⁺ = deuda + RE − S (inv. 2 y 3), S' = máx(0, deuda' − R⁺).
  const s = (k: H.Uuid, delta: Centavos) => {
    const e = antes.tarjetas.find((y) => y.tarjetaId === k);
    const saldo = antes.cuentas.find((y) => y.cuentaId === k)?.saldo ?? Centavos.cero;
    const [antesS, re] = [e?.sinRespaldo ?? Centavos.cero, e?.reservaExcedente ?? Centavos.cero];
    const deuda = (v: Centavos) => Centavos.max(Centavos.cero, Centavos.negar(v));
    const r = Centavos.restar(Centavos.sumar(deuda(saldo), re), antesS);
    const despues = Centavos.restar(deuda(Centavos.sumar(saldo, delta)), r);
    return [antesS, Centavos.max(Centavos.cero, despues)] as const;
  };
  const [[origenAntes, origenDespues], [destinoAntes, destinoDespues]] = [
    s(t.id, x.total),
    s(u.id, Centavos.negar(x.total)),
  ];
  const ids = { origenId: t.id, destinoId: u.id };
  const datos = { ...ids, origenAntes, origenDespues, destinoAntes, destinoDespues };
  const av24 = { codigo: 'AV-24', momento: 'despues', requiereConfirmacion: false, datos } as const;
  return { cambios, avisos: [av24] };
}
