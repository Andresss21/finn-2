// `formulario({ operacion: 'verificar_saldo', cuentaId, fecha? })` (04 §6.14.4, CF-01): la cuenta, la fecha pedida (o hoy), las
// candidatas a marcar y la última conciliación. Una cuenta que no es de efectivo ni tarjeta, archivada, o una fecha posterior a
// hoy no se ofrece (la operación lo rechaza con su código si llega a OP-53).
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'verificar_saldo' }>;

export function verificar({ i }: ContextoConsulta, p: P) {
  const k = i.hechos.cuentas.find((x) => x.id === p.cuentaId);
  const verificable =
    k !== undefined && !k.archivada && (k.tipo === 'efectivo' || k.tipo === 'tarjeta');
  if (!verificable || (p.fecha !== undefined && p.fecha > i.hoy)) throw noEncontrado();
  return formulario(i, {
    operacion: 'verificar_saldo',
    cuentaId: p.cuentaId,
    ...sinIndefinidos({ fecha: p.fecha }),
  });
}
