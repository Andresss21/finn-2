'use client';
// [CH-286] Los avisos del sistema (C-51, AVISOS-EN-LINEA §3; enmienda E6-3 y E6-8): «Estás sin conexión» y «Hay una versión nueva
// de Finn.», arriba del contenido, en la pastilla del aviso en línea; si están los dos, sin conexión va primero. Se quedan
// mientras sean ciertos. La versión que espera la publica `RegistroServiceWorker` (layout raíz); si hay un `Marco` montado, los
// dibuja él (sobre el contenido, al lado de la barra lateral), y si no (`/ingresar`), `RegistroServiceWorker`.
import { useEffect, useSyncExternalStore } from 'react';
import { formularios } from '../../textos/formularios';
import { AvisoEnLinea } from '../base/aviso';

// Clases literales (L13): al lado de la barra lateral con el marco; centrado donde no hay marco.
const LUGAR = {
  marco: 'fixed inset-x-4 top-16 z-40 flex flex-col gap-2 md:top-2 md:right-6 md:left-68',
  solo: 'fixed inset-x-4 top-16 z-40 mx-auto flex max-w-md flex-col gap-2 md:top-6',
} as const;

let espera: ServiceWorker | null = null;
let marcos = 0;
const oyentes = new Set<() => void>();
const avisar = (): void => {
  for (const o of oyentes) o();
};
const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => {
    oyentes.delete(o);
  };
};

/** La versión instalada que espera (o `null` cuando ya no hay una). */
export function publicarVersionNueva(sw: ServiceWorker | null): void {
  espera = sw;
  avisar();
}

const useEspera = () =>
  useSyncExternalStore(
    suscribir,
    () => espera,
    () => null,
  );

/** `true` si hay un `Marco` montado que dibuja los avisos del sistema. */
export const useHayMarco = (): boolean =>
  useSyncExternalStore(
    suscribir,
    () => marcos > 0,
    () => false,
  );

export function AvisosDelMarco({
  sinConexion,
  conMarco = false,
}: {
  /** El texto de sin conexión, o `null` si hay conexión. */
  readonly sinConexion: string | null;
  readonly conMarco?: boolean;
}) {
  const version = useEspera();
  useEffect(() => {
    if (!conMarco) return undefined;
    marcos += 1;
    avisar();
    return () => {
      marcos -= 1;
      avisar();
    };
  }, [conMarco]);
  if (sinConexion === null && version === null) return null;
  return (
    <div className={conMarco ? LUGAR.marco : LUGAR.solo}>
      {sinConexion === null ? null : (
        <AvisoEnLinea
          estado="advertencia"
          icono="wifioff"
          forma="pastilla"
          aparecioDespues
          data-sin-conexion=""
        >
          {sinConexion}
        </AvisoEnLinea>
      )}
      {version === null ? null : (
        <AvisoEnLinea
          estado="informacion"
          icono="refresh"
          forma="pastilla"
          aparecioDespues
          data-version-nueva=""
          accion={
            <button
              type="button"
              onClick={() => {
                version.postMessage({ type: 'SKIP_WAITING' });
              }}
            >
              {formularios.recargar}
            </button>
          }
        >
          {formularios.versionNueva}
        </AvisoEnLinea>
      )}
    </div>
  );
}
