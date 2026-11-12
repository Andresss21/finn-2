// El mismo flujo, interceptado sobre Ajustes cuando se llega desde la app (05 §1.4, E6-13).
import { LectorCiclo } from '../../../../../flujos/ajustes-ciclo/lector';

export default function CicloInterceptado() {
  return <LectorCiclo superpuesto />;
}
