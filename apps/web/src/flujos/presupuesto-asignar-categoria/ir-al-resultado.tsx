'use client';
// E2-13 [CH-248]: el flujo terminó y se abrió desde el detalle de la categoría: `router.replace` a ese detalle con el resultado
// en la URL (`resultado.ts`). Sirve igual superpuesto que en página completa: el detalle se vuelve a pedir y trae los números nuevos.
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function IrAlResultado({ ruta }: { readonly ruta: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(ruta);
  }, [router, ruta]);
  return null;
}
