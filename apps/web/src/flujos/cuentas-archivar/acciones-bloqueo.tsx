// CTA-05 y CTA-06: las salidas de un archivar o eliminar bloqueado, como botones del sistema (tonal «Cerrar» y uno principal que
// resuelve el bloqueo), no como enlaces subrayados. Son enlaces con la forma del botón: navegan, no envían nada. Las clases son
// las de `Boton` (05 §10.7) para esas dos variantes; `componentes/base/` no ofrece un botón-enlace.
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { cuentasGestion } from '../../textos/cuentas-gestion';

const COMUN =
  'inline-flex min-h-12 min-w-11 flex-1 cursor-pointer items-center justify-center rounded-control px-5 text-base font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const TONAL = [
  COMUN,
  'bg-accion-tonal text-accion hover:bg-superficie-hundida active:bg-superficie-hundida',
].join(' ');
const PRINCIPAL = [
  COMUN,
  'bg-accion text-texto-sobre-accion hover:bg-accion-hover active:bg-accion-presionada',
].join(' ');

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
      <EnlaceFinn href={cerrarHref} className={TONAL}>
        {cuentasGestion.cerrar}
      </EnlaceFinn>
      {principal === undefined ? null : (
        <EnlaceFinn href={principal.href} className={PRINCIPAL}>
          {principal.texto}
        </EnlaceFinn>
      )}
    </div>
  );
}
