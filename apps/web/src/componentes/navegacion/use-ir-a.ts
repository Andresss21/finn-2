'use client';
// `router.push` a otra ruta de la app desde un control que no es un enlace (por ejemplo el selector segmentado de la Bandeja, CH-139).
// L19 deja `useRouter` en `navegacion/`: la pantalla recibe esta función.
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useIrA(): (href: string) => void {
  const router = useRouter();
  return useCallback(
    (href) => {
      router.push(href);
    },
    [router],
  );
}
