'use client';
// Flujo como página completa (05 §1.4, §10.7): `main` con `h1` = título y sin foco atrapado. Es lo que se ve al abrir la
// URL directamente, al recargar o con un deep link; los flujos largos también son siempre así.
import type { ReactNode } from 'react';
import { base } from '../../textos/base';
import { Icono } from '../base/icono';

export interface PropsPaginaFlujo {
  readonly titulo: string;
  readonly descripcion?: string;
  readonly alCerrar: () => void;
  readonly children: ReactNode;
  readonly acciones?: ReactNode;
}

export function PaginaFlujo({
  titulo,
  descripcion,
  alCerrar,
  children,
  acciones,
}: PropsPaginaFlujo) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col bg-fondo text-texto">
      <div className="flex items-center gap-1 pr-2 pl-2">
        <button
          type="button"
          aria-label={base.cerrar}
          onClick={alCerrar}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla"
        >
          <Icono nombre="x" />
        </button>
        <h1 className="text-titulo-pantalla min-w-0 flex-1 truncate py-3">{titulo}</h1>
      </div>
      {descripcion === undefined ? null : (
        <p className="text-cuerpo-pequeno px-5 text-texto-secundario">{descripcion}</p>
      )}
      <div className="flex-1 px-5 py-3">{children}</div>
      {acciones === undefined ? null : <div className="flex gap-3 px-5 pt-2 pb-6">{acciones}</div>}
    </main>
  );
}
