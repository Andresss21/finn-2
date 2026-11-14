'use client';
// [CH-272] Grupos colapsados (C-46, C-47): preferencia del DISPOSITIVO en `localStorage`, una lista de ids de grupo por pantalla
// (`finn.colapsados.estructura`, `finn.colapsados.presupuesto`). No es un hecho ni viaja al servidor. Sin almacenamiento, todo se
// ve expandido y la escritura se pierde, sin avisar; la primera vez, y en el servidor, todo está expandido.
import { useMemo, useSyncExternalStore } from 'react';
import { almacen } from './almacen';

const oyentes = new Set<() => void>();
const suscribir = (alCambiar: () => void): (() => void) => {
  oyentes.add(alCambiar);
  window.addEventListener('storage', alCambiar);
  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener('storage', alCambiar);
  };
};

function leer(crudo: string): ReadonlySet<string> {
  try {
    const v: unknown = JSON.parse(crudo);
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function useColapsados(clave: string): {
  colapsados: ReadonlySet<string>;
  guardar: (ids: Iterable<string>) => void;
} {
  const crudo = useSyncExternalStore(
    suscribir,
    () => almacen.leerLocal(clave) ?? '[]',
    () => '[]',
  );
  const colapsados = useMemo(() => leer(crudo), [crudo]);
  return {
    colapsados,
    guardar: (ids) => {
      almacen.escribirLocal(clave, JSON.stringify([...ids]));
      for (const o of oyentes) o();
    },
  };
}
