// El mismo flujo, interceptado sobre Ajustes cuando se llega desde la app (05 §1.4).
import { LectorToken } from '../../../../../../flujos/ajustes-webhook-token/lector';

export default function TokenInterceptado() {
  return <LectorToken superpuesto />;
}
