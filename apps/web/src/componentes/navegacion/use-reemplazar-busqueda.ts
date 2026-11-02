'use client';
// `router.replace` de la misma ruta con otros parámetros de búsqueda (05 §2.2). L19 deja `useRouter` en `navegacion/`: el flujo
// recibe esta función. Conserva el estado de cliente, no agrega historial ni sube la página.
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useReemplazarBusqueda(): (busqueda: Readonly<Record<string, string>>) => void {
  const router = useRouter();
  const ruta = usePathname();
  return useCallback(
    (busqueda) => {
      router.replace(`${ruta}?${new URLSearchParams(busqueda).toString()}`, { scroll: false });
    },
    [router, ruta],
  );
}
