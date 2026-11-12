'use client';
// «Cargar más» de `/actividad` (E6-1): mientras la navegación al cursor está pendiente, el propio enlace dice «Cargando…».
import { useLinkStatus } from 'next/link';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { actividad as t } from '../../../textos/actividad';

function Texto() {
  const { pending } = useLinkStatus();
  return <>{pending ? t.cargando : t.cargarMas}</>;
}

export function CargarMas({
  href,
  className,
}: {
  readonly href: string;
  readonly className: string;
}) {
  return (
    <EnlaceFinn href={href} className={className} data-cargar-mas>
      <Texto />
    </EnlaceFinn>
  );
}
