// OP-47 Terminar conciliación (01 §5.8, 04 §3.8; P11, P12, supuesto 11 modificado): reclasifica los
// pares marcados con los hechos del momento (BE-48) y crea el registro con la diferencia aceptada
// (F3) antes de marcar las transacciones (F4). Nunca crea transacciones (inv. 14). Aquí vive también
// el registro y AV-21, que usa OP-53.
import { saldoAl } from '../calculo/saldos';
import { coincidenciasDeConciliacion } from '../criterios/conciliacion';
import type * as H from '../hechos';
import { candidatasDelEstado, partidaDe } from '../selectores/conciliacion';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

type Registro = Pick<H.Conciliacion, 'fechaEstado' | 'saldoEstado' | 'modo'>;

/** La propuesta de ajuste de AV-21 según la cuenta y el signo de d (CF-01; 06 §3.2.5). */
export const ajuste = (tipo: H.TipoCuenta, d: Centavos) =>
  d < 0
    ? { operacion: 'OP-20' }
    : tipo === 'tarjeta'
      ? { operacion: 'OP-27', modalidad: 'entrada' }
      : { operacion: 'OP-21' };

/** F3 la conciliación con d = saldo según el estado − saldo(cuenta, fecha del estado); F4 las marcadas. */
export function registrar(
  antes: H.Instantanea,
  k: H.Cuenta,
  x: { readonly id: H.Uuid; readonly instante: H.Instante },
  r: Registro,
  marcadas: readonly H.Uuid[],
): Efecto {
  const diferencia = Centavos.restar(r.saldoEstado, saldoAl(antes.hechos, k.id, r.fechaEstado));
  const fila: H.Conciliacion = {
    ...{ id: x.id, cuentaId: k.id, ...r, terminadaEn: x.instante },
    ...{ diferenciaAceptada: diferencia, revision: null },
  };
  const campos = { estadoBancario: 'conciliada', conciliacionId: x.id } as const;
  const cambios: H.Cambio[] = [
    { tipo: 'insertar', tabla: 'conciliaciones', fila },
    ...marcadas.map((id): H.Cambio => ({ tipo: 'actualizar', tabla: 'transacciones', id, campos })),
  ];
  if (diferencia === Centavos.cero) return { cambios };
  const monto = Centavos.max(diferencia, Centavos.negar(diferencia));
  const datos = {
    ...{ conciliacionId: x.id, cuentaId: k.id, fechaEstado: r.fechaEstado, diferencia },
    ...{ ...ajuste(k.tipo, diferencia), monto, comercio: 'Ajuste de conciliación' },
  };
  return {
    cambios,
    avisos: [{ codigo: 'AV-21', momento: 'despues', requiereConfirmacion: false, datos }],
  };
}

export function op47(antes: H.Instantanea, x: H.ComandoOp47): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const k = cuentaDe(h, x.cuentaId, 'efectivo', 'tarjeta');
  if (esRechazo(k)) return k;
  const candidatas = candidatasDelEstado(h, k.id, x.estado);
  const [ts, ms] = [new Set<H.Uuid>(), new Set<number>()];
  for (const { transaccionId, movimientoIndice } of x.coincidencias) {
    const m = x.estado.movimientos.find((y) => y.indice === movimientoIndice);
    if (m === undefined)
      throw new TypeError(`OP-47: movimiento ${movimientoIndice} fuera de la carga`);
    const t = buscar(h.transacciones, transaccionId, 'transacciones');
    if (esRechazo(t)) return t;
    if (t.estadoBancario === 'conciliada')
      return { codigo: 'transaccion_ya_conciliada', datos: { transaccionId } };
    // El criterio de §4.17 sobre este par, 1 a 1 entre los marcados.
    const c = candidatas.filter((y) => y.id === t.id);
    const cumple = coincidenciasDeConciliacion([partidaDe(k.id, m)], c).size === 1;
    if (!cumple || ts.has(t.id) || ms.has(m.indice))
      return { codigo: 'coincidencia_no_valida', datos: { transaccionId, movimientoIndice } };
    ts.add(t.id);
    ms.add(m.indice);
  }
  const { fechaEstado, saldoFinal: saldoEstado } = x.estado;
  return registrar(antes, k, x, { fechaEstado, saldoEstado, modo: 'estado_cuenta' }, [...ts]);
}
