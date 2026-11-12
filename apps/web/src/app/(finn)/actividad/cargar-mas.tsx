// «Cargar más» de `/actividad` (E6-1): mientras la navegación al cursor está pendiente, `EnlaceFinn` marca el enlace con `aria-busy` y
// el propio enlace cambia de «Cargar más» a «Cargando…» (solo CSS: no hay estado de cliente).
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { actividad as t } from '../../../textos/actividad';

export function CargarMas({
  href,
  className,
}: {
  readonly href: string;
  readonly className: string;
}) {
  return (
    <EnlaceFinn href={href} className={[className, 'group'].join(' ')} data-cargar-mas>
      <span className="group-aria-[busy=true]:hidden">{t.cargarMas}</span>
      <span className="hidden group-aria-[busy=true]:inline" aria-live="polite">
        {t.cargando}
      </span>
    </EnlaceFinn>
  );
}
