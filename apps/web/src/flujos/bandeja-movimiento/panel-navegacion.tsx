'use client';
// «1 de N» y las flechas anterior y siguiente del panel de computadora (S4 del export, CH-137): recorren los movimientos por revisar en el
// orden de la Bandeja. Los ids y la posición los trae el servidor (`bandeja()`); la interfaz no cuenta nada (PF-3). Solo se ve en
// computadora: en teléfono el flujo es la pantalla completa.
import type { ReactNode } from 'react';
import { Icono } from '../../componentes/base/icono';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { bandeja as t } from '../../textos/bandeja';

export interface NavegacionDelPanel {
  readonly posicion: number;
  readonly total: number;
  readonly anterior?: string;
  readonly siguiente?: string;
}

const CLASE = {
  enlace: 'inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla text-texto',
  deshabilitada:
    'inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla text-texto opacity-40',
} as const;

function Flecha({
  etiqueta,
  icono,
  destino,
}: {
  readonly etiqueta: string;
  readonly icono: 'arrowL' | 'arrowR';
  readonly destino: string | undefined;
}) {
  if (destino === undefined)
    return (
      <button type="button" disabled aria-label={etiqueta} className={CLASE.deshabilitada}>
        <Icono nombre={icono} tamano={20} />
      </button>
    );
  return (
    <EnlaceFinn href={`/bandeja/${destino}`} aria-label={etiqueta} className={CLASE.enlace}>
      <Icono nombre={icono} tamano={20} />
    </EnlaceFinn>
  );
}

export function PanelNavegacion({ navegacion: n }: { readonly navegacion: NavegacionDelPanel }) {
  return (
    <div className="hidden shrink-0 items-center gap-1 lg:flex" data-panel-navegacion>
      <span className="text-cuerpo-pequeno text-texto-secundario">
        {t.revisar.panel.posicion(n.posicion, n.total)}
      </span>
      <Flecha etiqueta={t.revisar.panel.anterior} icono="arrowL" destino={n.anterior} />
      <Flecha etiqueta={t.revisar.panel.siguiente} icono="arrowR" destino={n.siguiente} />
    </div>
  );
}

// Clases literales (L13): la lista a la izquierda y el flujo como tarjeta a la derecha (S4 del export), fija al desplazar la lista
// ([CH-220 A11]). Es el envoltorio de la página, no de
// `PaginaFlujo` (compartido: PRU-REN-PWA-002 cuida sus bytes); debajo de 1024 px no hay lista ni flechas y el flujo es la pantalla completa.
const PANEL = {
  marco:
    'relative lg:mx-auto lg:grid lg:max-w-270 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-8 lg:[&>main]:max-w-none lg:[&>main]:sticky lg:[&>main]:top-6 lg:[&>main]:rounded-contenedor lg:[&>main]:bg-superficie lg:[&>main]:p-6',
  lista: 'hidden flex-col gap-4 lg:flex',
  navegacion: 'absolute top-8 right-6 z-40',
} as const;

export function PanelDeLaBandeja({
  lateral,
  navegacion,
  children,
}: {
  readonly lateral: ReactNode;
  readonly navegacion: NavegacionDelPanel | undefined;
  readonly children: ReactNode;
}) {
  if (lateral === undefined) return children;
  return (
    <div className={PANEL.marco}>
      <aside data-lista-lateral className={PANEL.lista}>
        {lateral}
      </aside>
      {children}
      {navegacion === undefined ? null : (
        <div className={PANEL.navegacion}>
          <PanelNavegacion navegacion={navegacion} />
        </div>
      )}
    </div>
  );
}
