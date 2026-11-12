// El mismo flujo, interceptado sobre Instituciones cuando se llega desde la lista: hoja, o panel de 440 px en computadora (E5-14).
import { LectorInstitucion } from '../../../../../../flujos/ajustes-instituciones-institucion/lector';

export default async function InstitucionInterceptada({
  params,
}: {
  readonly params: Promise<{ readonly institucionId: string }>;
}) {
  return <LectorInstitucion institucionId={(await params).institucionId} superpuesto />;
}
