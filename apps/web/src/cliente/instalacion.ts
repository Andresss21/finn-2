'use client';
// Instalación a pedido (05 §8.7, FE-58). `RegistroServiceWorker` (layout raíz, vive entre navegaciones) guarda el evento
// `beforeinstallprompt` con `preventDefault()` para que el navegador no muestre su barra (CA-05.6) y `/ajustes` lo
// consume con `useInstalacion`. Nunca se llama `prompt()` sin un toque del usuario. No guarda ningún dato del servidor.
import { useSyncExternalStore } from 'react';

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
}

export type OfertaInstalacion = 'ninguna' | 'android' | 'ios';

let evento: EventoInstalacion | null = null;
const oyentes = new Set<() => void>();
const avisar = (): void => {
  oyentes.forEach((o) => {
    o();
  });
};

/** Engancha los eventos de instalación de la ventana; devuelve cómo soltarlos. */
export function escucharInstalacion(): () => void {
  const alOfrecer = (e: Event): void => {
    e.preventDefault();
    evento = e as EventoInstalacion;
    avisar();
  };
  const alInstalar = (): void => {
    evento = null;
    avisar();
  };
  window.addEventListener('beforeinstallprompt', alOfrecer);
  window.addEventListener('appinstalled', alInstalar);
  return () => {
    window.removeEventListener('beforeinstallprompt', alOfrecer);
    window.removeEventListener('appinstalled', alInstalar);
  };
}

const instalada = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iPhone o iPad (el iPad moderno se presenta como Mac con pantalla táctil). */
const esIos = (): boolean =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

function oferta(): OfertaInstalacion {
  if (instalada()) return 'ninguna';
  if (evento !== null) return 'android';
  return esIos() ? 'ios' : 'ninguna';
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Qué ofrecer en Ajustes. En el servidor y en la hidratación, nada. */
export function useInstalacion(): {
  readonly oferta: OfertaInstalacion;
  readonly instalar: () => Promise<void>;
} {
  const actual = useSyncExternalStore<OfertaInstalacion>(suscribir, oferta, () => 'ninguna');
  const instalar = async (): Promise<void> => {
    const pendiente = evento;
    if (pendiente === null) return;
    evento = null;
    avisar();
    await pendiente.prompt();
  };
  return { oferta: actual, instalar };
}
