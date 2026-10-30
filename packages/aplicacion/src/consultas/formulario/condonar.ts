// `formulario({ operacion: 'condonar', lineaId })` (04 §6.14.4): la línea por cobrar y la categoría propuesta para
// la condonación (OP-32), del selector del dominio (inv. 27).
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';

type P = Extract<Entrada, { operacion: 'condonar' }>;

export function condonar({ i }: ContextoConsulta, p: P) {
  try {
    return formulario(i, { operacion: 'condonar', lineaId: p.lineaId });
  } catch (e) {
    if (e instanceof RangeError) throw noEncontrado(); // la línea no es por cobrar
    throw e;
  }
}
