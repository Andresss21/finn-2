'use client';
// `cerrarFlujo()` de 05 §1.4 atado al enrutador de Next: superpuesto, `router.back()` (la pantalla de origen sigue
// montada); página completa, `router.replace(rutaPadre)`. Va aparte de los componentes para que estos se prueben sin Next.
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
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
