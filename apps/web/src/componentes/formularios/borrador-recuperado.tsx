'use client';
// [CH-286] Borrador recuperado (C-51, enmienda E3-17; AVISOS-EN-LINEA §4). `AvisoBorrador`: el aviso momentáneo, sin acción y
// con su descripción, solo la primera vez que se abre un borrador (`avisar` de `useBorrador`). Se va a los ms de
// `--duracion-aviso` con el reloj de C-50 (ningún número de tiempo acá), espera con el puntero encima y se quita al escribir en
// cualquier campo de su formulario. Lleva además la región de estado del borrador («Descartaste el borrador.»).
// `DescartarBorrador`: el enlace de texto del pie, a la izquierda de guardar, mientras haya borrador. `PieConBorrador` arma esa
// fila; un borrador que se carga aparte (05 §13.1) pone su enlace en el lugar que le pasa el formulario (`pie`).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { formularios } from '../../textos/formularios';
import { AvisoEnLinea } from '../base/aviso';
import {
  crearEtiquetaReloj,
  leerMs,
  reducido,
  relojDeVentana,
  type EstadoReloj,
} from '../base/etiqueta-tiempo';

export interface EstadoBorrador {
  readonly recuperado: boolean;
  readonly avisar: boolean;
  readonly anuncio: string;
  readonly descartar: () => void;
}

const QUIETO: EstadoReloj<true> = { actual: null, fase: 'nada', pausado: false, ultimo: null };

export function AvisoBorrador({ borrador }: { readonly borrador: EstadoBorrador }) {
  const { avisar, anuncio } = borrador;
  const region = useRef<HTMLParagraphElement>(null);
  const [estado, setEstado] = useState(QUIETO);
  const [reloj] = useState(() =>
    crearEtiquetaReloj<true>({
      duracion: () => leerMs('--duracion-aviso'),
      salida: () => (reducido() ? 0 : (leerMs('--duracion-normal') ?? 0)),
      reloj: relojDeVentana,
      alCambiar: setEstado,
    }),
  );
  useEffect(() => {
    if (avisar) reloj.mostrar(true, false);
    else reloj.cerrar();
  }, [avisar, reloj]);
  useEffect(
    () => () => {
      reloj.cerrar();
    },
    [reloj],
  );
  const visible = estado.actual !== null;
  // Escribir en cualquier campo del formulario lo quita en ese momento.
  useEffect(() => {
    if (!visible) return undefined;
    const formulario = region.current?.closest('form') ?? document;
    const quitar = (): void => {
      reloj.cerrar();
    };
    formulario.addEventListener('input', quitar);
    return () => {
      formulario.removeEventListener('input', quitar);
    };
  }, [visible, reloj]);
  return (
    <>
      <p ref={region} role="status" className="sr-only" data-anuncio-borrador="">
        {anuncio}
      </p>
      {visible ? (
        <AvisoEnLinea
          estado="informacion"
          icono="undo"
          titulo={formularios.borradorRecuperado}
          aparecioDespues
          fase={estado.fase === 'saliendo' ? 'saliendo' : 'visible'}
          data-aviso-borrador=""
          onPointerEnter={() => {
            reloj.pausar('puntero');
          }}
          onPointerLeave={() => {
            reloj.reanudar('puntero');
          }}
        >
          {formularios.borradorCuerpo}
        </AvisoEnLinea>
      ) : null}
    </>
  );
}

/** «Descartar borrador»: enlace de texto de 44 px, mientras haya borrador. */
export function DescartarBorrador({ borrador }: { readonly borrador: EstadoBorrador }) {
  if (!borrador.recuperado) return null;
  return (
    <button type="button" className="fz-enlace-accion shrink-0" onClick={borrador.descartar}>
      {formularios.descartarBorrador}
    </button>
  );
}

/** El enlace de un borrador que se cargó aparte, en el lugar del pie que le pasa el formulario. */
export function DescartarEnPie({
  borrador,
  pie,
}: {
  readonly borrador: EstadoBorrador;
  readonly pie: HTMLElement | null;
}) {
  return pie === null ? null : createPortal(<DescartarBorrador borrador={borrador} />, pie);
}

/**
 * La fila del pie: «Descartar borrador» (o el lugar donde lo pone un borrador cargado aparte) a la izquierda y la acción de
 * guardar, que ocupa el resto; sin borrador, guardar queda como estaba.
 */
export function PieConBorrador({
  descartar,
  lugar,
  children,
}: {
  readonly descartar?: ReactNode;
  readonly lugar?: (e: HTMLElement | null) => void;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 [&>:last-child]:min-w-0 [&>:last-child]:flex-1">
      {lugar === undefined ? null : <span ref={lugar} className="contents" />}
      {descartar}
      {children}
    </div>
  );
}
