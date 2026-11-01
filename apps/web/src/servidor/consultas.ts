// Colaboradores de las consultas que llaman las páginas (04 §2.3.2): la sesión de la petición, la memoria de la instancia y
// el reloj de prueba. Las lecturas interactivas arman los mismos en `lectura.ts`. Se usan dentro de `consultar()` (05 §7.3).
import { relojDePrueba } from '@finn/aplicacion';
import type { DepsConsulta } from '@finn/aplicacion/consultas/comun';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { sesionDeLaPeticion, usuarioPermitido } from './sesion.ts';

export async function depsDeConsulta(): Promise<DepsConsulta> {
  return {
    memoria: memoriaDeInstancia,
    sesion: await sesionDeLaPeticion(),
    usuarioPermitido: usuarioPermitido(),
    opciones: () => ({ reloj: relojDePrueba() }),
  };
}
