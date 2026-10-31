'use client';
// `router.refresh()` para el refresco automático del marco (05 §6.7). L19 deja `useRouter` en `navegacion/`: el hook de
// `cliente/` recibe esta función y no importa el enrutador. Vuelve a pedir los Server Components y conserva el estado
// de los componentes de cliente (V5-07); no navega.
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useRefrescar(): () => void {
  const router = useRouter();
  return useCallback(() => {
    router.refresh();
  }, [router]);
}
