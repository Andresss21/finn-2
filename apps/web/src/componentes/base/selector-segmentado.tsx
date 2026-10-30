'use client';
// Selector segmentado (06-identidad-visual 2.3): `role="radiogroup"` con radios nativos; las flechas cambian la opción.
import { useId } from 'react';
import './base.css';

export interface OpcionSegmento {
  readonly valor: string;
  readonly etiqueta: string;
}

export interface PropsSelectorSegmentado {
  readonly etiqueta: string;
  readonly opciones: readonly OpcionSegmento[];
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
}

export function SelectorSegmentado({
  etiqueta,
  opciones,
  valor,
  alCambiar,
}: PropsSelectorSegmentado) {
  const nombre = useId();
  return (
    <div role="radiogroup" aria-label={etiqueta} className="f-segmentado">
      {opciones.map((o) => (
        <label key={o.valor} className="f-segmento">
          <input
            type="radio"
            name={nombre}
            value={o.valor}
            checked={o.valor === valor}
            onChange={() => {
              alCambiar(o.valor);
            }}
          />
          {o.etiqueta}
        </label>
      ))}
    </div>
  );
}
