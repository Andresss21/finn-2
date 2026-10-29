// `formulario({ operacion: 'asignar', categoriaId, periodoInicio? })` (04 §6.14.4, CP-10a): catálogos con `asignado`
// y el contexto de OP-14, 15 y 16. Todo sale de `formulario()` del dominio (inv. 27).
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'asignar' }>;

export function asignar({ i }: ContextoConsulta, p: P) {
  if (!i.hechos.categorias.some((c) => c.id === p.categoriaId)) throw noEncontrado();
  return formulario(i, {
    operacion: 'asignar',
    categoriaId: p.categoriaId,
    ...sinIndefinidos({ periodoInicio: p.periodoInicio }),
  });
}
