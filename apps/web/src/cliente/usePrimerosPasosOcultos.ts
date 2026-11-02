'use client';
// "Ocultar por ahora" (FT-04; 06 §3.15): preferencia del DISPOSITIVO en `localStorage`, no un hecho ni algo que viaje al servidor.
// Sin almacenamiento, la escritura se pierde y el bloque se muestra siempre, sin avisar.
import { useSyncExternalStore } from 'react';
import { almacen } from './almacen';

const CLAVE = 'finn:primeros-pasos:oculto';
const oyentes = new Set<() => void>();
const avisar = (): void => {
  for (const o of oyentes) o();
};
const suscribir = (alCambiar: () => void): (() => void) => {
  oyentes.add(alCambiar);
  window.addEventListener('storage', alCambiar);
  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener('storage', alCambiar);
  };
};

export function usePrimerosPasosOcultos(): {
  oculto: boolean;
  ocultar: () => void;
  mostrar: () => void;
} {
  const oculto = useSyncExternalStore(
    suscribir,
    () => almacen.leerLocal(CLAVE) === '1',
    () => false,
  );
  return {
    oculto,
    ocultar: () => {
      almacen.escribirLocal(CLAVE, '1');
      avisar();
    },
    mostrar: () => {
      almacen.borrarLocal(CLAVE);
      avisar();
    },
  };
}
