// CTA-05 y CTA-06: las salidas de un archivar o eliminar bloqueado, como botones del sistema (tonal «Cerrar» y uno principal que
// resuelve el bloqueo), no como enlaces subrayados. Son enlaces con la forma del botón: navegan, no envían nada.
import { buttonVariants } from '../../components/ui/button';
import { cn } from '../../components/ui/utils';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { cuentasGestion } from '../../textos/cuentas-gestion';

const FORMA = 'min-h-11 flex-1 justify-center';

export function AccionesDeBloqueo({
  cerrarHref,
  principal,
}: {
  readonly cerrarHref: string;
  /** El paso que resuelve el bloqueo; sin él, solo «Cerrar». */
  readonly principal?: { readonly href: string; readonly texto: string };
}) {
  return (
    <div data-acciones-bloqueo className="flex gap-3">
      <EnlaceFinn href={cerrarHref} className={cn(buttonVariants({ variant: 'tonal' }), FORMA)}>
        {cuentasGestion.cerrar}
      </EnlaceFinn>
      {principal === undefined ? null : (
        <EnlaceFinn
          href={principal.href}
          className={cn(buttonVariants({ variant: 'default' }), FORMA)}
        >
          {principal.texto}
        </EnlaceFinn>
      )}
    </div>
  );
}
