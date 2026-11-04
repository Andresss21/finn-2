'use client';
// Flujo como página completa (05 §1.4, §10.7): `main` con `h1` = título y sin foco atrapado. Es lo que se ve al abrir la
// URL directamente, al recargar o con un deep link; los flujos largos también son siempre así. En teléfono va a pantalla
// completa (06-identidad-visual §3.1, export S5): `data-pagina-flujo` hace que `globals.css` oculte las barras del marco;
// «Cerrar» a la izquierda y el pie fijo (12 16 26, `superficie`, línea superior) con las acciones.
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
    <main
      data-pagina-flujo
      className="mx-auto flex min-h-dvh max-w-xl flex-col bg-fondo text-texto md:min-h-0 md:[--ancho-pantalla:42rem]"
    >
      <div className="sticky top-0 z-30 flex min-h-15 items-center gap-1 bg-fondo pr-2 pl-5 md:static md:p-0">
        <button
          type="button"
          aria-label={base.cerrar}
          onClick={alCerrar}
          className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-pastilla"
        >
          <Icono nombre="x" tamano={22} />
        </button>
        <h1 className="text-titulo-pantalla min-w-0 flex-1 truncate max-md:text-[1.625rem]">
          {titulo}
        </h1>
      </div>
      {descripcion === undefined ? null : (
        <p className="text-cuerpo-pequeno px-5 text-texto-secundario md:px-0">{descripcion}</p>
      )}
      <div className="flex-1 px-5 py-3 md:px-0">{children}</div>
      {acciones === undefined ? null : (
        <div className="sticky bottom-0 flex gap-3 border-t border-borde-sutil bg-superficie px-4 pt-3 pb-6.5 md:static md:border-0 md:bg-transparent md:px-0">
          {acciones}
        </div>
      )}
    </main>
  );
}
