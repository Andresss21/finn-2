// Piezas que comparten OP-07 a OP-13 (04 §3.2, §4.6): búsquedas en los hechos [M] y la posición de una fila en su lista.
import { calcular } from '@finn/dominio';
import type { Categoria, Grupo, Hechos, Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';

export const categoriaDe = (h: Hechos, id: Uuid): Categoria | undefined =>
  h.categorias.find((c) => c.id === id);

export const grupoDe = (h: Hechos, id: Uuid): Grupo | undefined =>
  h.grupos.find((g) => g.id === id);

/** Posición (desde 1) de `id` en su lista ordenada por `orden` y, a igualdad, por id (04 §4.6.2). */
export function posicionEn(lista: readonly { id: Uuid; orden: number }[], id: Uuid): number {
  const orden = [...lista].sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1));
  return orden.findIndex((x) => x.id === id) + 1;
}

/** Inicio del período activo A para el `hoy` de la transacción. */
export const inicioActivo = (h: Hechos, hoy: string): FechaLocal =>
  calcular(h, FechaLocal.desdeTexto(hoy)).presupuesto.activo.inicio;

/** Asig(c, A): la asignación de la categoría en el período activo (0 si no hay fila). */
export const asignacionEn = (h: Hechos, categoriaId: Uuid, inicio: FechaLocal): number =>
  h.asignaciones.find((a) => a.categoriaId === categoriaId && a.periodoInicio === inicio)?.monto ??
  0;
