// Envoltorio de lectura (04 §2.2.5, CP-3): la Server Action de solo lectura de las lecturas interactivas. Sesión AAL2 con
// `getClaims()` antes de leer la entrada (`exigirSesionLectura`), contrato Zod dentro de la consulta, sin `revalidatePath`
// y sin escrituras. Devuelve `ResultadoAccion` y no lanza hacia el cliente. Este archivo NO lleva 'use server'.
import { relojDePrueba } from '@finn/aplicacion';
import type { DepsConsulta } from '@finn/aplicacion/consultas/comun';
import {
  ExcepcionFinn,
  mensajeInterno,
  type ErrorFinn,
  type ResultadoAccion,
} from '@finn/aplicacion/errores';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { exigirSesionAal2Lectura, sesionDeLaPeticion, usuarioPermitido } from './sesion.ts';

export type DefinicionLectura<Salida> = (entrada: unknown, deps: DepsConsulta) => Promise<Salida>;

const interno = (): ErrorFinn => ({
  categoria: 'INTERNO',
  codigo: 'interno',
  mensaje: mensajeInterno('E-LECT000'),
  idError: 'E-LECT000',
});

export function lectura<Salida>(definicion: DefinicionLectura<Salida>) {
  return async (cruda: unknown): Promise<ResultadoAccion<Salida>> => {
    const sesion = await exigirSesionAal2Lectura();
    if (!sesion.ok) return { ok: false, error: sesion.error };
    try {
      const deps: DepsConsulta = {
        memoria: memoriaDeInstancia,
        sesion: await sesionDeLaPeticion(),
        usuarioPermitido: usuarioPermitido(),
        opciones: () => ({ reloj: relojDePrueba() }),
      };
      const valor = await definicion(cruda, deps);
      return { ok: true, valor, yaAplicada: false, avisos: [] };
    } catch (e) {
      return { ok: false, error: e instanceof ExcepcionFinn ? e.error : interno() };
    }
  };
}
