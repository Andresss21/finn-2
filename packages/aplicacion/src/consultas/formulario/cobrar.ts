// `formulario({ operacion: 'cobrar', lineaId?, deudorId?, fecha? })` (04 §6.14.4): las líneas por cobrar abiertas, con
// la propuesta AV-22 si la compra fue con tarjeta. Todo sale del selector del dominio (inv. 27).
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'cobrar' }>;

export function cobrar({ i }: ContextoConsulta, p: P) {
  try {
    return formulario(i, {
      operacion: 'cobrar',
      ...sinIndefinidos({ lineaId: p.lineaId, deudorId: p.deudorId, fecha: p.fecha }),
    });
  } catch (e) {
    if (e instanceof RangeError) throw noEncontrado(); // la línea o el deudor no existe
    throw e;
  }
}
