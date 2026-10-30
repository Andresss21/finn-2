'use client';
// Pastillas de filtro (06-identidad-visual 2.3): botones con `aria-pressed`; lo activo se distingue por fondo invertido y peso, no por color.
import './base.css';

export interface OpcionPastilla {
  readonly valor: string;
  readonly etiqueta: string;
}

export interface PropsPastillas {
  /** Nombre del grupo para lectores de pantalla. */
  readonly etiqueta: string;
  readonly opciones: readonly OpcionPastilla[];
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
}

export function Pastillas({ etiqueta, opciones, valor, alCambiar }: PropsPastillas) {
  return (
    <div role="group" aria-label={etiqueta} className="f-pastillas">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          className="f-pastilla"
          aria-pressed={o.valor === valor}
          onClick={() => {
            alCambiar(o.valor);
          }}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
