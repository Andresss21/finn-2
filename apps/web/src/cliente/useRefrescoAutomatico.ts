'use client';
// `useRefrescoAutomatico` (05 §6.7, FE-21), en el marco: refresca al volver a la pestaña tras más de 60 s, al recuperar la
// conexión, a medianoche (`reloj.ts`) y en atrás/adelante si el `Encabezado` tiene más de 30 s. Recibe `refrescar`
// (`router.refresh()`, que conserva el estado de los componentes de cliente, V5-07) porque L19 deja `useRouter` en
// `navegacion/`. Los tiempos se miden con `performance.now()`: el reloj de pared solo lo usa la agenda. No calcula ni
// guarda datos (PF-3, FE-20).
import { useEffect, useRef } from 'react';
import { crearAgendaMedianoche, type AgendaMedianoche } from './reloj';

const OCULTA_MAS_DE_MS = 60_000;
const ENCABEZADO_VIEJO_MS = 30_000;
const ENTRE_REFRESCOS_MS = 10_000;

// Operaciones de `useOperacion` en vuelo: el refresco espera a que terminen (6.7).
let operacionesEnVuelo = 0;
let pendiente: (() => void) | null = null;

export function operacionIniciada(): void {
  operacionesEnVuelo += 1;
}

export function operacionTerminada(): void {
  operacionesEnVuelo = Math.max(0, operacionesEnVuelo - 1);
  if (operacionesEnVuelo > 0 || pendiente === null) return;
  const hacer = pendiente;
  pendiente = null;
  hacer();
}

export interface OpcionesRefresco {
  /** `hoy` del `Encabezado` publicado; `null` mientras ninguna página publicó (6.4). */
  readonly hoy: string | null;
  /** `performance.now()` en que llegó el `Encabezado` (`useEncabezado().recibidoEn`). */
  readonly recibidoEn: number | null;
  readonly refrescar: () => void;
}

export function useRefrescoAutomatico({ hoy, recibidoEn, refrescar }: OpcionesRefresco): void {
  const ultimoRefresco = useRef<number | null>(null);
  const agenda = useRef<AgendaMedianoche | null>(null);
  const recibidoRef = useRef(recibidoEn);
  recibidoRef.current = recibidoEn;
  const refrescarRef = useRef(refrescar);
  refrescarRef.current = refrescar;

  useEffect(() => {
    // `deMedianoche`: se salta el límite de un refresco cada 10 s.
    const pedir = (deMedianoche: boolean): void => {
      if (operacionesEnVuelo > 0) {
        pendiente = () => {
          pedir(deMedianoche);
        };
        return;
      }
      const ahora = performance.now();
      const reciente =
        ultimoRefresco.current !== null && ahora - ultimoRefresco.current < ENTRE_REFRESCOS_MS;
      if (!deMedianoche && reciente) return;
      ultimoRefresco.current = ahora;
      refrescarRef.current();
    };
    const actualizarServiceWorker = (): void => {
      // (D) 8.4: descubre una versión nueva; sin service worker registrado no hay nada que hacer.
      if (!('serviceWorker' in navigator)) return;
      void navigator.serviceWorker
        .getRegistration()
        .then((registro) => registro?.update())
        .catch(() => undefined);
    };
    const nueva = crearAgendaMedianoche(() => {
      pedir(true);
    });
    agenda.current = nueva;
    let ocultaDesde: number | null = null;
    const alCambiarVisibilidad = (): void => {
      if (document.visibilityState === 'hidden') {
        ocultaDesde = performance.now();
        return;
      }
      const estuvo = ocultaDesde === null ? 0 : performance.now() - ocultaDesde;
      ocultaDesde = null;
      nueva.alVolverVisible();
      if (estuvo > OCULTA_MAS_DE_MS) {
        pedir(false);
        actualizarServiceWorker();
      }
    };
    const alRecuperarConexion = (): void => {
      pedir(false);
    };
    const alNavegarEnHistorial = (): void => {
      const recibido = recibidoRef.current;
      if (recibido !== null && performance.now() - recibido > ENCABEZADO_VIEJO_MS) pedir(false);
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('online', alRecuperarConexion);
    window.addEventListener('popstate', alNavegarEnHistorial);
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('online', alRecuperarConexion);
      window.removeEventListener('popstate', alNavegarEnHistorial);
      nueva.cancelar();
      agenda.current = null;
    };
  }, []);

  // Cada `Encabezado` nuevo reprograma la agenda (6.7, paso 5).
  useEffect(() => {
    if (hoy !== null) agenda.current?.programar(hoy);
  }, [hoy, recibidoEn]);
}
