// `consultar()` (05 §7.3, FE-28): el único punto donde una página traduce la `ExcepcionFinn` de una consulta (CP-13).
// Ninguna página captura sus errores por su cuenta. `redirect()` y `notFound()` lanzan: se llaman fuera del `try`.
import { ExcepcionFinn, type ErrorFinn } from '@finn/aplicacion/errores';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { rutaSinParametros, sanearVolver } from '../componentes/navegacion/parametros.ts';

export interface OpcionesConsultar {
  /** `VALIDACION` de un segmento dinámico (un id que no es UUID): es `notFound()`, no una redirección (7.3). */
  readonly validacionDeSegmento?: boolean;
}

/** Next respeta un `digest` que ya trae el error (V5-15a): la referencia que ve el usuario es el `idError`. */
function errorParaLaPantalla(error: ErrorFinn): Error {
  const salida = new Error(error.mensaje) as Error & { digest?: string };
  if (error.idError !== undefined) salida.digest = error.idError;
  return salida;
}

async function rutaActual(): Promise<string> {
  // La reemplaza `proxy.ts` en cada petición (04 §12.4): nunca viene del cliente. Se sanea igual que `?volver=`.
  return sanearVolver((await headers()).get('x-finn-ruta'));
}

async function traducir(error: ErrorFinn, opciones: OpcionesConsultar): Promise<never> {
  switch (error.categoria) {
    case 'NO_AUTORIZADO': {
      const paso = error.datos?.['aal'] === 'aal1' ? '/ingresar/verificar' : '/ingresar';
      return redirect(`${paso}?volver=${encodeURIComponent(await rutaActual())}`);
    }
    case 'NO_ENCONTRADO':
      return notFound();
    case 'VALIDACION': {
      if (opciones.validacionDeSegmento === true) return notFound();
      const sinInvalidos = rutaSinParametros(await rutaActual(), Object.keys(error.campos ?? {}));
      // Sin parámetro que quitar, redirigir a la misma URL sería un bucle: es un fallo de la página.
      if (sinInvalidos === null) throw errorParaLaPantalla(error);
      return redirect(sinInvalidos);
    }
    default:
      throw errorParaLaPantalla(error);
  }
}

export async function consultar<T>(
  consulta: () => Promise<T>,
  opciones: OpcionesConsultar = {},
): Promise<T> {
  let error: ErrorFinn;
  try {
    return await consulta();
  } catch (e) {
    if (!(e instanceof ExcepcionFinn)) throw e;
    error = e.error;
  }
  return traducir(error, opciones);
}
