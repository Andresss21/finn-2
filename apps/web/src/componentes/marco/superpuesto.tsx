'use client';
// Superpuesto de los flujos cortos (05 §1.4, §10.7; 06-identidad-visual 2.17): hoja inferior en teléfono y panel lateral
// en computadora, salvo que `desde` fije la forma (`arriba` es el panel de notificaciones, CF-23). El diálogo (rol,
// foco atrapado, Escape, velo y devolución del foco) es `base/dialogo.tsx`.
import type { ReactNode } from 'react';
import { Dialogo } from '../base/dialogo';

export type DesdeSuperpuesto = 'abajo' | 'lado' | 'arriba';

// Mapa de clases literales (L13). `auto`: hoja inferior y, desde `md`, panel lateral.
const FORMAS: Record<DesdeSuperpuesto | 'auto', string> = {
  auto: 'inset-x-0 bottom-0 max-h-11/12 rounded-t-superpuesto md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-105 md:max-w-full md:rounded-t-none md:rounded-l-superpuesto',
  abajo: 'inset-x-0 bottom-0 max-h-11/12 rounded-t-superpuesto',
  lado: 'inset-y-0 right-0 w-105 max-w-full rounded-l-superpuesto',
  arriba: 'inset-x-0 top-0 max-h-11/12 rounded-b-superpuesto pt-12',
};
const AGARRADERAS: Record<DesdeSuperpuesto | 'auto', string | undefined> = {
  auto: 'md:hidden',
  abajo: '',
  lado: undefined,
  arriba: undefined,
};

export interface PropsSuperpuesto {
  readonly titulo: string;
  readonly descripcion?: string;
  /** `cerrarFlujo` (1.4): en un flujo superpuesto vuelve a la pantalla de origen sin recargarla. */
  readonly alCerrar: () => void;
  readonly desde?: DesdeSuperpuesto;
  readonly children: ReactNode;
  readonly acciones?: ReactNode;
}

export function Superpuesto({
  titulo,
  descripcion,
  alCerrar,
  desde,
  children,
  acciones,
}: PropsSuperpuesto) {
  const forma = desde ?? 'auto';
  const agarradera = AGARRADERAS[forma];
  return (
    <Dialogo
      titulo={titulo}
      alCerrar={alCerrar}
      forma={FORMAS[forma]}
      {...(descripcion === undefined ? {} : { descripcion })}
      {...(agarradera === undefined ? {} : { agarradera })}
      {...(acciones === undefined ? {} : { acciones })}
    >
      {children}
    </Dialogo>
  );
}
