'use client';
// `RegistroServiceWorker` (05 §8.4, FE-54, FE-55), en el layout raíz: registra `/serwist/sw.js` solo en producción, sin
// `SerwistProvider` (su `cacheOnNavigation` guardaría cada URL, FE-20, y `reloadOnOnline` perdería lo escrito, FE-21).
// Si hay una versión instalada esperando, muestra el aviso de 7.6; "Recargar" la activa y la página se recarga una vez.
import { useEffect, useState } from 'react';
import { formularios } from '../../textos/formularios';
import { AvisoEnLinea } from '../base/aviso';
import { Boton } from '../base/boton';

export function RegistroServiceWorker() {
  const [espera, setEspera] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const contenedor = navigator.serviceWorker;
    let recargando = false;
    const alCambiarControlador = (): void => {
      if (recargando) return;
      recargando = true;
      location.reload();
    };
    contenedor.addEventListener('controllerchange', alCambiarControlador);

    void contenedor
      .register('/serwist/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registro) => {
        // Una versión que espera solo es "nueva" si hay un controlador activo: en la primera visita no hay nada que avisar.
        const revisar = (): void => {
          if (registro.waiting !== null && contenedor.controller !== null)
            setEspera(registro.waiting);
        };
        revisar();
        registro.addEventListener('updatefound', () => {
          const instalando = registro.installing;
          instalando?.addEventListener('statechange', () => {
            if (instalando.state === 'installed') revisar();
          });
        });
      })
      .catch(() => undefined);

    return () => {
      contenedor.removeEventListener('controllerchange', alCambiarControlador);
    };
  }, []);

  if (espera === null) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-50 mx-auto max-w-md px-4 md:bottom-6">
      <AvisoEnLinea
        estado="informacion"
        aparecioDespues
        accion={
          <Boton
            variante="secundaria"
            onClick={() => {
              espera.postMessage({ type: 'SKIP_WAITING' });
            }}
          >
            {formularios.recargar}
          </Boton>
        }
      >
        {formularios.versionNueva}
      </AvisoEnLinea>
    </div>
  );
}
