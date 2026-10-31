// Decisión de cada página de `ingresar` en el servidor (05 §9.2, FE-36): lee `estadoAcceso()`, aplica la tabla de
// `destinoAcceso()` y redirige antes de mostrar nada. Las rutas llegan a los componentes de cliente ya armadas: así no
// importan `@finn/aplicacion` (zod, Supabase) en el navegador. `?volver=` se sanea una sola vez, acá (05 §3.6).
import { redirect } from 'next/navigation';
import {
  destinoAcceso,
  rutaInterna,
  type EstadoAcceso,
  type RutaAcceso,
} from '@finn/aplicacion/autenticacion';
import { estadoAcceso } from '../../servidor/sesion.ts';

export interface RutasAcceso {
  readonly ingresar: string;
  readonly verificar: string;
  readonly inscribir: string;
  /** A dónde sigue la sesión AAL2: `volver` saneado, o `/`. */
  readonly destino: string;
}

export interface Acceso {
  readonly estado: EstadoAcceso;
  readonly rutas: RutasAcceso;
  /** Sesión de un usuario no permitido: la página la cierra y muestra el mensaje de credenciales (no se puede en un RSC). */
  readonly cerrarSesion: boolean;
  /** Solo `/ingresar/inscribir` con `?cierre=1` y AAL2: la pantalla de cierre de FT-02 (el cliente lo marca antes de enviar el código). */
  readonly cierre: boolean;
}

type Busqueda = Promise<Readonly<Record<string, string | string[] | undefined>>>;

export const conVolver = (ruta: RutaAcceso, volver: string | null): string =>
  volver === null ? ruta : `${ruta}?volver=${encodeURIComponent(rutaInterna(volver))}`;

export async function resolverAcceso(ruta: RutaAcceso, busqueda: Busqueda): Promise<Acceso> {
  const crudo = (await busqueda)['volver'];
  const volver = typeof crudo === 'string' ? crudo : null;
  const estado = await estadoAcceso();
  // El código correcto fija las cookies y Next vuelve a pintar esta misma página: sin la marca, AAL2 redirigiría y la
  // persona nunca vería la recomendación del factor de respaldo (06 FT-02, flujo 5).
  const cierre =
    ruta === '/ingresar/inscribir' &&
    (await busqueda)['cierre'] === '1' &&
    estado.sesion === 'aal2';
  const decision = destinoAcceso(estado, ruta, volver);
  if (decision.accion === 'redirigir' && !cierre) redirect(decision.destino);
  return {
    estado,
    cierre,
    cerrarSesion: decision.cerrarSesion,
    rutas: {
      ingresar: conVolver('/ingresar', volver),
      verificar: conVolver('/ingresar/verificar', volver),
      inscribir: conVolver('/ingresar/inscribir', volver),
      destino: rutaInterna(volver),
    },
  };
}
