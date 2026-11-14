'use client';
// [CH-268] Entrada de porcentaje (C-41, C-45; CAMPOS-V3 §2 y §5): hasta 3 enteros sin separador y 2 decimales, con el «%» fijo
// fuera del input y teclado decimal. Solo da forma al texto: el rango y el mensaje los pone quien la usa (PF-3).
import { enmascararPorcentaje } from '../../formato';
import { base } from '../../textos/base';
import { EntradaTexto } from '../base/campo';

export interface PropsEntradaPorcentaje {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly valor: string | undefined;
  readonly alCambiar: (texto: string) => void;
  readonly error?: string | undefined;
  readonly descripcion?: string | undefined;
  readonly requerido?: boolean;
  readonly deshabilitado?: boolean;
}

export function EntradaPorcentaje({
  nombre,
  etiqueta,
  valor,
  alCambiar,
  error,
  descripcion,
  requerido = false,
  deshabilitado = false,
}: PropsEntradaPorcentaje) {
  return (
    <EntradaTexto
      etiqueta={etiqueta}
      {...(descripcion === undefined ? {} : { descripcion })}
      {...(error === undefined ? {} : { error })}
      requerido={requerido}
      sufijo={base.porcentaje}
      name={nombre}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      // Lo que llega guardado se ve entero (una tasa de cuatro decimales, 04 §3.9 y DB-13); la máscara corre al escribir.
      value={valor ?? ''}
      disabled={deshabilitado}
      className="tabular-nums"
      onChange={(e) => {
        alCambiar(enmascararPorcentaje(e.target.value));
      }}
    />
  );
}
