// `formulario({ operacion: 'devolver', transaccionOriginalId?, busqueda? })` (04 §6.14.4): sin compra, las candidatas
// de devolución; con ella, la compra y la capacidad de devolución de cada línea (inv. 11). Del dominio (inv. 27).
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'devolver' }>;

export function devolver({ i }: ContextoConsulta, p: P) {
  try {
    return formulario(i, {
      operacion: 'devolver',
      ...sinIndefinidos({ transaccionOriginalId: p.transaccionOriginalId, busqueda: p.busqueda }),
    });
  } catch (e) {
    if (e instanceof RangeError) throw noEncontrado(); // la compra no existe o no es un gasto
    throw e;
  }
}
