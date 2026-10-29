// `formulario({ operacion: 'archivar_categoria', categoriaId })` (04 §6.14.4): lo que pide OP-09 (disponible,
// asignaciones futuras y programadas activas), con el selector del dominio (inv. 27).
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';

type P = Extract<Entrada, { operacion: 'archivar_categoria' }>;

export function archivar({ i }: ContextoConsulta, p: P) {
  if (!i.hechos.categorias.some((c) => c.id === p.categoriaId)) throw noEncontrado();
  return formulario(i, { operacion: 'archivar_categoria', categoriaId: p.categoriaId });
}
