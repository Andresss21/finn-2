// Conciliación (04 §3.8): OP-45 a OP-47 con la carga firmada (BE-49) y OP-53 Verificar saldo. OP-45 a OP-47 necesitan
// las claves de la configuración y el reloj del servidor: se construyen una vez con `crearConciliacion`.
import type { DepsConciliacion } from '../../conciliacion/carga.ts';
import type { DepsMarco } from '../marco.ts';
import { iniciarConciliacion } from './OP-45-iniciar.ts';
import { crearOP46 } from './OP-46-agregar.ts';
import { crearOP47 } from './OP-47-terminar.ts';

export { OP53 } from './OP-53-verificar-saldo.ts';
export type { SalidaOp45 } from './OP-45-iniciar.ts';
export type { ClavesConciliacion, DepsConciliacion } from '../../conciliacion/carga.ts';

export const crearConciliacion = (d: DepsConciliacion) => ({
  /** OP-45: de lectura, fuera de `previsualizar`/`confirmar`. */
  iniciar: (entrada: unknown, deps: DepsMarco) => iniciarConciliacion(entrada, { ...deps, ...d }),
  OP46: crearOP46(d),
  OP47: crearOP47(d),
});
