'use client';
// `RegistroServiceWorker` (05 §8.4, FE-54, FE-55), en el layout raíz: registra `/serwist/sw.js` solo en producción, sin
// `SerwistProvider` (su `cacheOnNavigation` guardaría cada URL, FE-20, y `reloadOnOnline` perdería lo escrito, FE-21).
// Si hay una versión instalada esperando, muestra el aviso de 7.6; "Recargar" la activa y la página se recarga una vez.
// [CH-286] El aviso es el del sistema de C-51 (`AvisosDelMarco`), arriba del contenido y no al pie.
import { useEffect, useState } from 'react';
import { escucharInstalacion } from '../../cliente/instalacion';
import { AvisosDelMarco, publicarVersionNueva, useHayMarco } from './avisos-del-marco';

export function RegistroServiceWorker() {
  const [espera, setEspera] = useState<ServiceWorker | null>(null);
  const hayMarco = useHayMarco();

  // Instalación a pedido (8.7): se guarda el evento aunque no haya service worker (desarrollo).
  useEffect(() => escucharInstalacion(), []);

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

  // [CH-286] C-51 (E6-8): la versión que espera va a los avisos del sistema; los dibuja el `Marco`, o este componente donde no hay.
  useEffect(() => {
    publicarVersionNueva(espera);
  }, [espera]);
  if (hayMarco) return null;
  return <AvisosDelMarco sinConexion={null} />;
}
