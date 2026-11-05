'use client';
// Las piezas que comparten los estados con pantalla propia de `/bandeja/[movimientoId]` (S4 del export, CH-137): la tabla de datos
// (rótulo a la izquierda, valor a la derecha) y la nota informativa con el ícono, sobre el fondo hundido. Solo muestran lo que
// dice el servidor (PF-3).
import type { ReactNode } from 'react';
import { Icono } from '../../componentes/base/icono';

// Clases literales (L13): el enlace con el aspecto del botón principal o del tonal (D1)
export const ENLACE = {
  principal:
    'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion',
  tonal:
    'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion',
} as const;

export function TablaDatos({ filas }: { readonly filas: readonly (readonly [string, string])[] }) {
  return (
    <dl className="rounded-contenedor bg-superficie px-4 py-1">
      {filas.map(([rotulo, valor]) => (
        <div
          key={rotulo}
          className="flex items-baseline justify-between gap-4 border-b border-borde-sutil py-2 last:border-b-0"
        >
          <dt className="text-cuerpo-pequeno text-texto-secundario">{rotulo}</dt>
          <dd className="text-cuerpo min-w-0 text-right font-medium tabular-nums break-words">
            {valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Nota({ children }: { readonly children: ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-contenedor bg-superficie-hundida px-4 py-3 text-cuerpo-pequeno text-texto">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-texto-secundario">
        <Icono nombre="info" tamano={18} />
      </span>
      {children}
    </p>
  );
}
