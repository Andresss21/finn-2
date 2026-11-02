'use client';
// `cerrarFlujo()` de 05 §1.4 atado al enrutador de Next: superpuesto, `router.back()` (la pantalla de origen sigue
// montada); página completa, `router.replace(rutaPadre)`. Va aparte de los componentes para que estos se prueben sin Next.
import { useRouter } from 'next/navigation';
import { useEffect, type ComponentProps } from 'react';
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
