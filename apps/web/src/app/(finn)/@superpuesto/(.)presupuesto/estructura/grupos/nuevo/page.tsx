// El mismo flujo, interceptado sobre la lista de la estructura cuando se llega desde ella (05 §1.4).
import { LectorEstructura } from '../../../../../../../flujos/presupuesto-estructura/lector';

export default function GrupoNuevoInterceptado() {
  return <LectorEstructura modo="grupo-nuevo" superpuesto />;
}
