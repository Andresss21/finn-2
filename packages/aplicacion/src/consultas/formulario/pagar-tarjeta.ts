// `formulario({ operacion: 'pagar_tarjeta', tarjetaId? })` (04 §6.14.4): por tarjeta, deuda, reserva, desglose al pagar
// y origen propuesto; todo sale del selector del dominio.
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'pagar_tarjeta' }>;

export function pagarTarjeta({ i }: ContextoConsulta, p: P) {
  if (p.tarjetaId !== undefined && !i.hechos.tarjetas.some((t) => t.cuentaId === p.tarjetaId))
    throw noEncontrado();
  return formulario(i, {
    operacion: 'pagar_tarjeta',
    ...sinIndefinidos({ tarjetaId: p.tarjetaId }),
  });
}
