'use client';
// Entrada de fechas (05 §5.3, §5.5, FE-19; P1-03 del export): campo de texto dd/mm/aaaa con las barras automáticas y un botón que
// abre el calendario. Entrega una `FechaLocal` ('AAAA-MM-DD') sin `Date`. El valor inicial es el `hoy` del Encabezado que pasa
// el llamador, nunca la fecha del dispositivo. El calendario y sus textos se cargan solo al abrirlo (05 §13.1).
import { FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { formatearFecha } from '../../formato';
import { base } from '../../textos/base';
import { EntradaTexto } from '../base/campo';
import { Icono } from '../base/icono';

const Calendario = lazy(() =>
  import('./calendario-fecha').then((m) => ({ default: m.CalendarioFecha })),
);

export interface PropsEntradaFecha {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly valor: FechaLocal;
  readonly alCambiar: (fecha: FechaLocal) => void;
  readonly minima?: FechaLocal | undefined;
  readonly maxima?: FechaLocal;
  readonly error?: string | undefined;
  readonly requerido?: boolean;
  readonly deshabilitado?: boolean;
  /** Sin la línea «Fecha elegida: …» (S5 no la tiene). */
  readonly sinVistaPrevia?: boolean;
  /** El `hoy` del servidor, para marcarlo en el calendario; sin él se toma el de `<html data-hoy>`. */
  readonly hoy?: FechaLocal;
  /**
   * [CH-240 E3-18] El mensaje va a lo ancho de la fila Fecha · Total, fuera de la celda: el campo lo entrega aquí y solo lleva
   * `aria-invalid` y `aria-describedby` hacia el elemento `id`.
   */
  readonly mensajeEnFila?: {
    readonly id: string;
    readonly alCambiar: (mensaje: string | undefined) => void;
  };
}

/** Lo escrito → `dd/mm/aaaa` con las barras puestas; acepta también un `AAAA-MM-DD` pegado completo. */
const enmascarar = (t: string): string => {
  const iso = /^(\d{4})-(\d\d)-(\d\d)$/.exec(t);
  return iso
    ? `${iso[3]}/${iso[2]}/${iso[1]}`
    : t
        .replace(/\D/g, '')
        .slice(0, 8)
        .replace(/^(\d\d)(\d)/, '$1/$2')
        .replace(/^(\d\d\/\d\d)(\d)/, '$1/$2');
};

/** `dd/mm/aaaa` completo → `FechaLocal`, o `undefined` si falta o el día no existe. */
function leer(t: string): FechaLocal | undefined {
  const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(t);
  try {
    return m ? FechaLocal.desdeTexto(`${m[3]}-${m[2]}-${m[1]}`) : undefined;
  } catch {
    return undefined;
  }
}

export function EntradaFecha({
  nombre,
  etiqueta,
  valor,
  alCambiar,
  minima,
  maxima,
  error,
  requerido = false,
  deshabilitado = false,
  sinVistaPrevia = false,
  hoy,
  mensajeEnFila,
}: PropsEntradaFecha) {
  // El borrador se guarda aparte: el valor del formulario solo cambia con una fecha completa, que exista y dentro del rango.
  const [borrador, setBorrador] = useState<string>(valor ? formatearFecha(valor) : '');
  const [anterior, setAnterior] = useState<string>(valor);
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  if (valor !== anterior) {
    setAnterior(valor);
    setBorrador(valor ? formatearFecha(valor) : '');
  }
  const fecha = leer(borrador);
  const fuera =
    fecha !== undefined &&
    ((minima !== undefined && fecha < minima) || (maxima !== undefined && fecha > maxima));
  const mensaje = fuera
    ? base.fechaFuera
    : borrador.length === 10 && fecha === undefined
      ? base.fechaNoExiste
      : error;

  const avisar = mensajeEnFila?.alCambiar;
  useEffect(() => {
    avisar?.(mensaje);
  }, [avisar, mensaje]);

  function cerrar(devolverFoco = false) {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }

  return (
    <EntradaTexto
      etiqueta={etiqueta}
      {...(fecha === undefined || fuera || sinVistaPrevia
        ? {}
        : { descripcion: base.fechaVistaPrevia(formatearFecha(fecha)) })}
      {...(mensaje === undefined || mensajeEnFila !== undefined ? {} : { error: mensaje })}
      {...(mensaje !== undefined && mensajeEnFila !== undefined
        ? { 'aria-invalid': true, 'aria-describedby': mensajeEnFila.id }
        : {})}
      requerido={requerido}
      name={nombre}
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/aaaa"
      className="pr-12 tabular-nums"
      value={borrador}
      disabled={deshabilitado}
      onChange={(e) => {
        const texto = enmascarar(e.target.value);
        setBorrador(texto);
        const f = leer(texto);
        if (f === undefined || (minima !== undefined && f < minima)) return;
        if (maxima === undefined || f <= maxima) alCambiar(f);
      }}
      acciones={
        <>
          <button
            ref={boton}
            type="button"
            aria-label={base.abrirCalendario}
            aria-expanded={abierto}
            aria-haspopup="dialog"
            disabled={deshabilitado}
            className="absolute inset-y-0 right-1 my-auto flex size-11 cursor-pointer items-center justify-center rounded-pastilla text-texto-secundario focus-visible:outline-3 focus-visible:outline-foco aria-expanded:bg-accion-tonal aria-expanded:text-accion disabled:cursor-default disabled:text-texto-deshabilitado"
            onClick={() => {
              setAbierto(!abierto);
            }}
          >
            <Icono nombre="cal" />
          </button>
          {abierto ? (
            <Suspense fallback={null}>
              <Calendario
                inicial={fecha ?? valor}
                hoy={hoy}
                minima={minima}
                maxima={maxima}
                alElegir={(f) => {
                  setBorrador(formatearFecha(f));
                  cerrar(true);
                  alCambiar(f);
                }}
                alCerrar={cerrar}
              />
            </Suspense>
          ) : null}
        </>
      }
    />
  );
}
