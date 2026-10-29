import type { ErrorFinn } from './tipos.ts';
export {
  formatearFecha,
  formatearFechaCorrida,
  formatearInstante,
  formatearMonto,
  MENOS,
} from './formato.ts';
export { MENSAJES_RECHAZO, mensajeDeRechazo, rellenar } from './mensajes.ts';
export {
  errorDeValidacion,
  MENSAJE_OCUPADO,
  MENSAJE_VALIDACION,
  mensajeInterno,
  type AvisoMostrado,
  type CategoriaError,
  type ErrorFinn,
  type Previsualizacion,
  type ResultadoAccion,
} from './tipos.ts';

/**
 * La excepción de una consulta (04 §2.3.2, CP-13): lleva un `ErrorFinn` completo (7.1). `consultar()` de la interfaz
 * (05 §7.3) la traduce en un solo lugar; ninguna página la captura por su cuenta.
 */
export class ExcepcionFinn extends Error {
  constructor(readonly error: ErrorFinn) {
    super(error.mensaje);
    this.name = 'ExcepcionFinn';
  }
}
