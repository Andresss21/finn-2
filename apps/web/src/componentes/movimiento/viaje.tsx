'use client';
// [CH-295] C-52 §8 «Presupuesto → detalle» (`docs/anexos/finn-detalle-de-categoria/`): el nombre y el Disponible de la fila viajan
// a su lugar en el encabezado del detalle, y al volver hacen el camino inverso. La fila de Presupuesto es un `<a>` (navegación de
// documento) y la flecha «Volver» vuelve por el historial (CH-288): las dos son navegaciones entre documentos, así que el viaje lo
// hace el navegador con View Transitions entre documentos (`@view-transition`, que solo declaran estas dos pantallas) y los
// nombres `cat-nombre-{id}` y `cat-disp-{id}`. Cuando el paso es dentro del documento (la flecha sin historial vuelve con el
// enrutador), lo hace FLIP con `element.animate`: se mide antes de salir y, al llegar, se anima `translate` + `scale` desde ahí.
// Con movimiento reducido no hay viaje. Nunca se anima una cifra: viaja la caja ya dibujada (PF-3).
import { useEffect, useLayoutEffect } from 'react';
import { duracionToken } from './use-salida';
import type { Parte } from './viaje-nombres';

type Lado = 'presupuesto' | 'detalle';
const PARTES: readonly Parte[] = ['nombre', 'disp'];
/** Lo que vale una medida guardada: si la llegada tarda más (otra pantalla en el medio), no hay viaje. */
const VIGENCIA_MS = 10_000;
const REDUCIDO = '(prefers-reduced-motion: reduce)';

interface Medida {
  readonly id: string;
  readonly desde: Lado;
  readonly cuando: number;
  readonly cajas: Partial<Record<Parte, DOMRect>>;
}
// Vive lo que vive el documento: una navegación de documento la pierde, y ahí el viaje es del navegador.
let pendiente: Medida | null = null;

const caja = (raiz: ParentNode, id: string, parte: Parte): HTMLElement | null =>
  raiz.querySelector<HTMLElement>(`[data-viaje="${parte}-${id}"]`);

/** Antes de salir: mide el nombre y el Disponible de `id`. */
export function anotarViaje(id: string, desde: Lado, raiz: ParentNode = document): void {
  const cajas: Partial<Record<Parte, DOMRect>> = {};
  for (const parte of PARTES) {
    const el = caja(raiz, id, parte);
    const r = el?.getBoundingClientRect();
    if (r !== undefined && r.height > 0) cajas[parte] = r;
  }
  pendiente = { id, desde, cuando: performance.now(), cajas };
}

/** La categoría de la medida pendiente, si viene del otro lado. */
export function viajeDesde(desde: Lado): string | null {
  return pendiente?.desde === desde ? pendiente.id : null;
}

/** Al llegar: anima cada caja desde donde estaba antes de salir. Devuelve las animaciones (ninguna si no corresponde). */
export function viajar(id: string, hacia: Lado, raiz: ParentNode = document): Animation[] {
  const p = pendiente;
  if (p === null || p.id !== id || p.desde === hacia) return [];
  pendiente = null;
  if (performance.now() - p.cuando > VIGENCIA_MS || window.matchMedia(REDUCIDO).matches) return [];
  const duration = duracionToken('--duracion-transicion');
  const easing =
    getComputedStyle(document.documentElement).getPropertyValue('--curva-entrada').trim() ||
    'linear';
  const animaciones: Animation[] = [];
  for (const parte of PARTES) {
    const el = caja(raiz, id, parte);
    const antes = p.cajas[parte];
    const despues = el?.getBoundingClientRect();
    if (el === null || antes === undefined || despues === undefined || despues.height === 0)
      continue;
    const dx = antes.left - despues.left;
    const dy = antes.top - despues.top;
    const escala = antes.height / despues.height;
    animaciones.push(
      el.animate(
        [
          {
            transformOrigin: '0 0',
            transform: `translate(${String(dx)}px, ${String(dy)}px) scale(${String(escala)})`,
          },
          { transformOrigin: '0 0', transform: 'none' },
        ],
        { duration, easing },
      ),
    );
  }
  return animaciones;
}

/**
 * Declara el viaje entre documentos (solo lo declaran Presupuesto y el detalle: el resto de la app sigue sin transición) y, con
 * movimiento reducido, no lo declara. Va en las dos pantallas porque el navegador mira la de salida y la de llegada.
 */
export function PermitirViaje() {
  return (
    <style data-permitir-viaje>
      {'@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }'}
    </style>
  );
}

/** Un toque en un enlace a `/presupuesto` (la flecha «Volver», en la barra o junto al título). */
const vaAPresupuesto = (e: MouseEvent): boolean => {
  const a = e.target instanceof Element ? e.target.closest('a') : null;
  return a !== null && new URL(a.href, window.location.href).pathname === '/presupuesto';
};

/** En el detalle: al llegar dentro del documento, el viaje FLIP; al volver a Presupuesto, la medida para el camino inverso. */
export function ViajeDelDetalle({ id }: { readonly id: string }) {
  useLayoutEffect(() => {
    // Un cuadro después: el enrutador ya puso la página arriba y la caja está en su lugar final, antes de pintarla.
    const cuadro = requestAnimationFrame(() => {
      viajar(id, 'detalle');
    });
    return () => {
      cancelAnimationFrame(cuadro);
    };
  }, [id]);
  useEffect(() => {
    const alTocar = (e: MouseEvent): void => {
      if (vaAPresupuesto(e)) anotarViaje(id, 'detalle');
    };
    document.addEventListener('click', alTocar, true);
    return () => {
      document.removeEventListener('click', alTocar, true);
    };
  }, [id]);
  return null;
}

/** En Presupuesto: al tocar una fila, la medida; al llegar desde el detalle dentro del documento, el camino inverso. */
export function ViajesDePresupuesto() {
  useEffect(() => {
    const alTocar = (e: MouseEvent): void => {
      const fila =
        e.target instanceof Element
          ? e.target.closest<HTMLElement>('[data-fila-categoria] a[data-viaje-desde]')
          : null;
      const id = fila?.closest<HTMLElement>('[data-fila-categoria]')?.dataset.filaCategoria;
      if (id !== undefined) anotarViaje(id, 'presupuesto');
    };
    document.addEventListener('click', alTocar, true);
    return () => {
      document.removeEventListener('click', alTocar, true);
    };
  }, []);
  useLayoutEffect(() => {
    const id = viajeDesde('detalle');
    if (id === null) return;
    const cuadro = requestAnimationFrame(() => {
      viajar(id, 'presupuesto');
    });
    return () => {
      cancelAnimationFrame(cuadro);
    };
  }, []);
  return null;
}
