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

/** Un flujo que ya terminó: `cerrarFlujo()` apenas se monta, hacia la pantalla padre (la página completa de 1.4). */
export function CerrarFlujoAlMontar({ rutaPadre }: { readonly rutaPadre: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(rutaPadre);
  }, [router, rutaPadre]);
  return null;
}
