'use client';
// Movimiento reducido para lo que se mueve por JavaScript (FIXES §1, CH-220 d): cifras que ruedan, retrasos con `setTimeout`,
// la navegación tras un check. CSS ya lo anula en `globals.css`; esto es para el resto: quien lo use salta al estado final.
import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

function suscribir(aviso: () => void): () => void {
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener('change', aviso);
  return () => {
    consulta.removeEventListener('change', aviso);
  };
}

const leer = (): boolean => window.matchMedia(CONSULTA).matches;

/** `true` mientras la persona pidió reducir el movimiento; sigue los cambios de la preferencia. En el servidor, `false`. */
export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}
