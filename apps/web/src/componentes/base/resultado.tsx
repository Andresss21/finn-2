'use client';
// Resultado de una acción (06-identidad-visual 2.13, 05 §10.7, 4.14): queda en su lugar, sin tiempo límite y sin toast.
// Se anuncia por la región del marco (11.3); aquí es un contenedor `data-testid="resultado"` con la salida o el enlace.
import type { ReactNode } from 'react';
import { Icono } from './icono';

export interface PropsResultado {
  readonly texto: string;
  /** Operación inversa (4.14): solo existe si la tabla define una. */
  readonly salida?: { readonly etiqueta: string; readonly ejecutar: () => void };
  /** Enlace a la transacción u objeto afectado, por ejemplo «Ver transacción». */
  readonly enlace?: ReactNode;
}

export function Resultado({ texto, salida, enlace }: PropsResultado) {
  return (
    <div
      data-testid="resultado"
      className="flex min-h-14 items-center gap-2.5 py-2 pr-3 pl-3.5 text-texto"
    >
      <span className="shrink-0 text-positivo-texto">
        <Icono nombre="check" tamano={18} />
      </span>
      <p className="text-cuerpo-pequeno min-w-0 flex-1">{texto}</p>
      {salida === undefined ? null : (
        <button
          type="button"
          onClick={salida.ejecutar}
          className="inline-flex min-h-11 items-center gap-1 px-2 font-bold text-enlace underline"
        >
          <Icono nombre="undo" tamano={16} />
          {salida.etiqueta}
        </button>
      )}
      {enlace === undefined ? null : (
        <span className="inline-flex min-h-11 items-center font-bold text-enlace [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:underline">
          {enlace}
        </span>
      )}
    </div>
  );
}
