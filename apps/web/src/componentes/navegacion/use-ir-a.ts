'use client';
// `router.push` a otra ruta de la app desde un control que no es un enlace (por ejemplo el selector segmentado de la Bandeja, CH-139).
// L19 deja `useRouter` en `navegacion/`: la pantalla recibe esta función. Con `reemplazar` usa `router.replace`: el flujo que terminó
// (agregar o quitar un factor, CH-240) no queda en el historial.
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useIrA(): (href: string, reemplazar?: boolean) => void {
  const router = useRouter();
  return useCallback(
    (href, reemplazar = false) => {
      if (reemplazar) router.replace(href);
      else router.push(href);
    },
    [router],
  );
}
