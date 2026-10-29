// `formulario({ operacion: 'meta', categoriaId?, metaId? })` (04 §6.14.4): la meta (6.10) y las categorías sin meta
// para crear una, con el selector `metas` del dominio (inv. 27).
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'meta' }>;

export function meta({ i }: ContextoConsulta, p: P) {
  if (p.categoriaId !== undefined && !i.hechos.categorias.some((c) => c.id === p.categoriaId))
    throw noEncontrado();
  if (p.metaId !== undefined && !i.hechos.metas.some((m) => m.id === p.metaId))
    throw noEncontrado();
  return formulario(i, {
    operacion: 'meta',
    ...sinIndefinidos({ categoriaId: p.categoriaId, metaId: p.metaId }),
  });
}
