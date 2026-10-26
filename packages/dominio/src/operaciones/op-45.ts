// OP-45 Iniciar conciliación (01 §5.8, 04 §3.8): lectura, sin hechos. La decodificación es de
// `@finn/conciliacion` y la carga firmada de la aplicación (BE-49); el dominio clasifica (BE-48).
import type * as H from '../hechos';
import { type Clasificacion, clasificarConciliacion } from '../selectores/conciliacion';
import { cuentaDe } from './op-20';
import { esRechazo } from './rechazos';

export function op45(
  antes: H.Instantanea,
  x: { readonly cuentaId: H.Uuid; readonly estado: H.EstadoDeCuenta },
): Clasificacion | H.Rechazo {
  const k = cuentaDe(antes.hechos, x.cuentaId, 'efectivo', 'tarjeta');
  return esRechazo(k) ? k : clasificarConciliacion(antes, k.id, x.estado);
}
