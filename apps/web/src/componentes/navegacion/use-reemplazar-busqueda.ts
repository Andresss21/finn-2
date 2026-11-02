'use client';
// `router.replace` de la misma ruta con otros parámetros de búsqueda (05 §2.2: "cambiar la fecha reemplaza `?fecha=`"). L19 deja
// `useRouter` en `navegacion/`: un flujo recibe esta función y no importa el enrutador. Vuelve a pedir la página con los
// parámetros nuevos, conserva el estado de los componentes de cliente y no agrega una entrada al historial ni sube la página.
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
