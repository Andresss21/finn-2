'use client';
// `useConexion` (05 §6.8, §7.4; FE-35): `enLinea` a partir de `navigator.onLine` y los eventos `online` y `offline`.
// Lo usan `useOperacion` (4.8, que deshabilita los envíos con su motivo) y el aviso «Estás sin conexión» del marco.
// No guarda ningún dato del servidor: la app es solo en línea (FE-20).
import { useSyncExternalStore } from 'react';

function suscribir(avisar: () => void): () => void {
  window.addEventListener('online', avisar);
  window.addEventListener('offline', avisar);
  return () => {
    window.removeEventListener('online', avisar);
    window.removeEventListener('offline', avisar);
  };
}

/** `false` solo si el navegador dice que no hay conexión. En el servidor y en la hidratación, con conexión. */
export function useConexion(): { readonly enLinea: boolean } {
  const enLinea = useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    () => true,
  );
  return { enLinea };
}
