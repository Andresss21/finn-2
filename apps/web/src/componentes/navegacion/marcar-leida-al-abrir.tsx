'use client';
// `MarcarLeidaAlAbrir` (05 §3.5, FE-32): la ruta de un destino se abre con `?notificacion=<id>`; esto lo detecta, ejecuta OPT-04
// para ese id una sola vez y quita el parámetro con `router.replace`, sin agregar una entrada al historial. Si OPT-04 falla no
// muestra nada: la notificación queda sin leer. La acción la pone el layout, así el componente se prueba sin servidor.
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { AccionEscritura } from '../../formularios/use-operacion';

const PARAMETRO = 'notificacion';

export function MarcarLeidaAlAbrir({ marcarLeidas }: { readonly marcarLeidas: AccionEscritura }) {
  const router = useRouter();
  const pathname = usePathname();
  const busqueda = useSearchParams();
  const id = busqueda.get(PARAMETRO);
  const hechas = useRef(new Set<string>());
  useEffect(() => {
    if (id === null || id === '' || hechas.current.has(id)) return;
    hechas.current.add(id);
    const resto = new URLSearchParams(busqueda.toString());
    resto.delete(PARAMETRO);
    const texto = resto.toString();
    // El parámetro se quita cuando OPT-04 termina, haya salido bien o no: la respuesta de la acción ya trae el marco revalidado.
    void marcarLeidas({ ids: [id] })
      .catch(() => undefined)
      .finally(() => {
        router.replace(texto === '' ? pathname : `${pathname}?${texto}`);
      });
  }, [id, busqueda, pathname, router, marcarLeidas]);
  return null;
}
