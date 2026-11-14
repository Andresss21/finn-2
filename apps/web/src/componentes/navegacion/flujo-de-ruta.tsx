'use client';
// `cerrarFlujo()` de 05 §1.4 atado al enrutador de Next: superpuesto, `router.back()` (la pantalla de origen sigue
// montada); página completa, `router.replace(rutaPadre)`. Va aparte de los componentes para que estos se prueben sin Next.
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, type ComponentProps } from 'react';
import { PaginaFlujo } from '../marco/pagina-flujo';
import { Superpuesto } from '../marco/superpuesto';

export function SuperpuestoDeRuta(props: Omit<ComponentProps<typeof Superpuesto>, 'alCerrar'>) {
  const router = useRouter();
  return (
    <Superpuesto
      {...props}
      alCerrar={() => {
        router.back();
      }}
    />
  );
}

export function PaginaFlujoDeRuta({
  rutaPadre,
  ...props
}: Omit<ComponentProps<typeof PaginaFlujo>, 'alCerrar'> & { readonly rutaPadre: string }) {
  const router = useRouter();
  return (
    <PaginaFlujo
      {...props}
      alCerrar={() => {
        router.replace(rutaPadre);
      }}
    />
  );
}

/** `cerrarFlujo()` como función, para un botón del flujo (cancelar, volver): lo mismo que hace al terminar. */
export function useCerrarFlujo(rutaPadre: string, superpuesto: boolean): () => void {
  const router = useRouter();
  return () => {
    if (superpuesto) router.back();
    else router.replace(rutaPadre);
  };
}

/**
 * Un flujo que ya terminó: `cerrarFlujo()` apenas se monta (05 §1.4). Página completa: hacia la pantalla padre. Superpuesto:
 * `router.back()`, que vuelve a la pantalla de origen sin recargarla.
 */
export function CerrarFlujoAlMontar({
  rutaPadre,
  superpuesto = false,
}: {
  readonly rutaPadre: string;
  readonly superpuesto?: boolean;
}) {
  const router = useRouter();
  useEffect(() => {
    if (superpuesto) router.back();
    else router.replace(rutaPadre);
  }, [router, rutaPadre, superpuesto]);
  return null;
}

/**
 * [CH-285] Un panel (ruta interceptada) que terminó y deja su resultado en la URL de la pantalla de origen (`?resultado=`).
 * Primero `router.back()`, como todo superpuesto (05 §1.4); cuando el panel ya se desmontó (la vuelta terminó), `replace` a
 * `ruta` sobre la entrada de la pantalla de origen. Un `replace` hecho desde la ruta interceptada, mientras sigue en vuelo la
 * actualización que dispara la acción (`revalidatePath`), deja al enrutador de Next 16.4 con dos árboles que no coinciden
 * seguidos, y la navegación siguiente (abrir otro panel) se hace como carga completa, sin interceptar (bug 16).
 */
export function CerrarPanelConResultado({ ruta }: { readonly ruta: string }) {
  const router = useRouter();
  const volvio = useRef(false);
  const pendiente = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    // En desarrollo, StrictMode monta, desmonta y vuelve a montar enseguida: una sola vuelta, y el `replace` que dejó el
    // desmontaje simulado se cancela al volver a montar. Solo el desmontaje de verdad lo deja correr.
    clearTimeout(pendiente.current);
    if (!volvio.current) {
      volvio.current = true;
      router.back();
    }
    return () => {
      pendiente.current = setTimeout(() => {
        router.replace(ruta);
      }, 0);
    };
  }, [router, ruta]);
  return null;
}

/**
 * Una ruta interceptada que en realidad es una página completa: `/registrar/[tipo]` también atrapa `/registrar/gasto`, un flujo
 * largo (05 §1.4). Se vuelve a abrir con una navegación de documento, que no se intercepta, y `replace` para que «atrás» no
 * regrese a la entrada interceptada.
 */
export function AbrirComoPagina() {
  const pathname = usePathname();
  useEffect(() => {
    window.location.replace(`${pathname}${window.location.search}`);
  }, [pathname]);
  return null;
}
