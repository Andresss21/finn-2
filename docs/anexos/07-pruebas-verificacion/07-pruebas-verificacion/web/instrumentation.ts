// Barrera 1 de CT-01 (P7-10): fuera de la lista de permitidos, si existe una variable del reloj de prueba, la app no arranca.
import { relojPermitido, hayVariableDeReloj } from './lib/reloj-permitido';
export async function register() {
  if (!relojPermitido() && hayVariableDeReloj()) {
    console.error('finn: reloj de prueba fuera de un entorno de pruebas; la aplicación no arranca (BE-30, CT-01)');
    process.exit(1);
  }
}
