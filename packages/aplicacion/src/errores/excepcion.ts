// La excepción de una consulta (04 §2.3.2, CP-13): lleva un `ErrorFinn` completo (7.1). `consultar()` de la
// interfaz (05 §7.3) la traduce en un solo lugar; ninguna página la captura por su cuenta.
import type { ErrorFinn } from './tipos.ts';

export class ExcepcionFinn extends Error {
  constructor(readonly error: ErrorFinn) {
    super(error.mensaje);
    this.name = 'ExcepcionFinn';
  }
}
