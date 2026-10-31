'use client';
// Entrada de fechas (05 §5.3, §5.5, FE-19): entrega una `FechaLocal` ('AAAA-MM-DD') sin `Date`. El valor inicial
// es el `hoy` del Encabezado que pasa el llamador, nunca la fecha del dispositivo.
import { FechaLocal } from '@finn/dominio/valores';
import { useState } from 'react';
import { formatearFecha } from '../../formato';
import { base } from '../../textos/base';
import { EntradaTexto } from '../base/campo';

export interface PropsEntradaFecha {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly valor: FechaLocal;
  readonly alCambiar: (fecha: FechaLocal) => void;
  readonly minima?: FechaLocal;
  readonly maxima?: FechaLocal;
  readonly error?: string | undefined;
  readonly requerido?: boolean;
  readonly deshabilitado?: boolean;
}

function aFecha(texto: string): FechaLocal | undefined {
  try {
    return FechaLocal.desdeTexto(texto);
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
}: PropsEntradaFecha) {
  // El navegador entrega '' mientras la fecha está a medio escribir: el borrador se guarda aparte y el valor del
  // formulario solo cambia con una fecha completa y dentro del rango.
  const [borrador, setBorrador] = useState<string>(valor);
  const [anterior, setAnterior] = useState<string>(valor);
  if (valor !== anterior) {
    setAnterior(valor);
    setBorrador(valor);
  }
  const fecha = aFecha(borrador);
  const fuera =
    fecha !== undefined &&
    ((minima !== undefined && FechaLocal.comparar(fecha, minima) < 0) ||
      (maxima !== undefined && FechaLocal.comparar(fecha, maxima) > 0));
  const mensaje = fuera ? base.fechaFuera : error;

  return (
    <EntradaTexto
      etiqueta={etiqueta}
      {...(fecha === undefined || fuera
        ? {}
        : { descripcion: base.fechaVistaPrevia(formatearFecha(fecha)) })}
      {...(mensaje === undefined ? {} : { error: mensaje })}
      requerido={requerido}
      name={nombre}
      type="date"
      value={borrador}
      min={minima}
      max={maxima}
      disabled={deshabilitado}
      onChange={(e) => {
        const texto = e.target.value;
        setBorrador(texto);
        const f = aFecha(texto);
        if (f === undefined) return;
        if (minima !== undefined && FechaLocal.comparar(f, minima) < 0) return;
        if (maxima !== undefined && FechaLocal.comparar(f, maxima) > 0) return;
        alCambiar(f);
      }}
    />
  );
}
