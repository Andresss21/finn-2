'use client';
// Lo que una pantalla hija publica a la barra del marco para «Más acciones» (P1-04, CH-115), como `PublicarEncabezado` (1.6).
// Vive aparte del marco para que la pantalla no arrastre el enrutador de Next al importarlo.
import { createContext, useContext, useEffect } from 'react';
import type { NombreIcono } from '../base/icono';

/** Una acción de «Más acciones» (P1-04): un enlace a su flujo o, sin `ruta` o con `motivo`, deshabilitada con el motivo. */
export interface AccionPantalla {
  readonly etiqueta: string;
  readonly ruta?: string;
  readonly motivo?: string;
  readonly icono?: NombreIcono;
  /** [CH-269] Bajada de una acción con enlace (C-43: «Editar estructura · Grupos, categorías y su orden»). */
  readonly detalle?: string;
  /** Eliminar: al final, separada por una línea y en `peligro`. */
  readonly peligro?: boolean;
}
export interface AccionesPublicadas {
  readonly titulo: string;
  readonly acciones: readonly AccionPantalla[];
}
export const ContextoAcciones = createContext<(a: AccionesPublicadas | null) => void>(
  () => undefined,
);

/** La pantalla hija publica sus acciones, como `PublicarEncabezado` (1.6); sin salida visible. Sin acciones, no hay menú. */
export function PublicarAcciones(props: AccionesPublicadas) {
  const publicar = useContext(ContextoAcciones);
  const { titulo, acciones } = props;
  useEffect(() => {
    publicar({ titulo, acciones });
    return () => {
      publicar(null);
    };
  }, [publicar, titulo, acciones]);
  return null;
}
