'use client';
// Diálogo modal sobre Radix (05 §10.7, L16: `@radix-ui/*` solo aquí): rol `dialog` con `aria-modal`, nombre = título,
// foco atrapado, Escape y velo cierran y al cerrar el foco vuelve al disparador (11.2). La forma la fija quien lo usa.
import * as Radix from '@radix-ui/react-dialog';
import { useState, type ReactNode } from 'react';
import { cn } from '../../components/ui/utils';
import { base } from '../../textos/base';
import { Icono } from './icono';

export interface PropsDialogo {
  readonly titulo: string;
  readonly descripcion?: string;
  readonly alCerrar: () => void;
  /** Clases de la forma (hoja, panel lateral o desde arriba): posición, radio y tamaño. */
  readonly forma: string;
  /** Agarradera de la hoja inferior (06-identidad-visual 2.17). */
  readonly agarradera?: string;
  readonly children: ReactNode;
  readonly acciones?: ReactNode;
}

export function Dialogo({
  titulo,
  descripcion,
  alCerrar,
  forma,
  agarradera,
  children,
  acciones,
}: PropsDialogo) {
  // Se lee al montar, antes de que Radix mueva el foco al diálogo.
  const [disparador] = useState(() =>
    typeof document === 'undefined' ? null : document.activeElement,
  );
  return (
    <Radix.Root
      open
      onOpenChange={(abierto) => {
        if (!abierto) alCerrar();
      }}
    >
      <Radix.Portal>
        <Radix.Overlay data-testid="velo" className="fixed inset-0 z-40 bg-velo" />
        <Radix.Content
          aria-modal="true"
          onCloseAutoFocus={(evento) => {
            // Sin `Radix.Trigger` no sabe a dónde volver: vuelve al elemento que tenía el foco al abrirse.
            evento.preventDefault();
            if (disparador instanceof HTMLElement && disparador.isConnected) disparador.focus();
          }}
          {...(descripcion === undefined ? { 'aria-describedby': undefined } : {})}
          className={cn(
            forma,
            'fixed z-50 flex flex-col bg-superficie-elevada text-texto shadow-elevacion-3',
          )}
        >
          {agarradera === undefined ? null : (
            <span
              aria-hidden="true"
              className={cn(agarradera, 'mx-auto mt-2 h-1 w-10 rounded-pastilla bg-borde-control')}
            />
          )}
          <div className="flex items-center justify-between gap-2 pr-2 pl-5">
            <Radix.Title className="text-titulo-seccion py-3">{titulo}</Radix.Title>
            <Radix.Close
              aria-label={base.cerrar}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla text-texto"
            >
              <Icono nombre="x" />
            </Radix.Close>
          </div>
          {descripcion === undefined ? null : (
            <Radix.Description className="text-cuerpo-pequeno px-5 text-texto-secundario">
              {descripcion}
            </Radix.Description>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
          {acciones === undefined ? null : (
            <div className="flex gap-3 px-5 pt-2 pb-6">{acciones}</div>
          )}
        </Radix.Content>
      </Radix.Portal>
    </Radix.Root>
  );
}
