// [CH-295] Los nombres del viaje Presupuesto → detalle (C-52 §8): sin `'use client'`, para que los use también una pantalla del
// servidor (la fila de Presupuesto). El movimiento está en `viaje.tsx`.
import type { CSSProperties } from 'react';

export type Parte = 'nombre' | 'disp';

/** El `view-transition-name` de una parte (las dos pantallas lo usan igual). */
export function nombreDeViaje(id: string, parte: Parte): string {
  return `cat-${parte}-${id}`;
}

/** Atributos de la caja que viaja: su nombre de transición y la marca que busca FLIP. */
export function viaje(
  id: string,
  parte: Parte,
): { readonly style: CSSProperties; readonly 'data-viaje': string } {
  return {
    style: { viewTransitionName: nombreDeViaje(id, parte) },
    'data-viaje': `${parte}-${id}`,
  };
}
