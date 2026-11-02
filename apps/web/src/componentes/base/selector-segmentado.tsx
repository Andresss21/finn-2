'use client';
// Selector segmentado (06-identidad-visual 2.3): `role="radiogroup"` con botones nativos `role="radio"`; las flechas cambian la
// opción y mueven el foco. Sin Radix, para no sumar su biblioteca de radios a las rutas que no la usan (05 §13.1).
import { useRef, type KeyboardEvent } from 'react';

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

const SALTO: Readonly<Record<string, 1 | -1>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

export function SelectorSegmentado({
  etiqueta,
  opciones,
  valor,
  alCambiar,
}: PropsSelectorSegmentado) {
  const grupo = useRef<HTMLDivElement>(null);
  const activa = opciones.some((o) => o.valor === valor) ? valor : opciones[0]?.valor;

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>, k: number) {
    const paso = SALTO[e.key];
    if (paso === undefined) return;
    e.preventDefault();
    const destino = (k + paso + opciones.length) % opciones.length;
    const opcion = opciones[destino];
    if (opcion === undefined) return;
    alCambiar(opcion.valor);
    grupo.current?.querySelectorAll<HTMLElement>('[role=radio]')[destino]?.focus();
  }

  return (
    <div
      ref={grupo}
      role="radiogroup"
      aria-label={etiqueta}
      className="inline-flex rounded-pastilla bg-superficie-hundida p-1"
    >
      {opciones.map((o, k) => {
        const marcada = o.valor === activa;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={marcada}
            tabIndex={marcada ? 0 : -1}
            data-state={marcada ? 'checked' : 'unchecked'}
            onClick={() => {
              alCambiar(o.valor);
            }}
            onKeyDown={(e) => {
              alTeclear(e, k);
            }}
            className="min-h-11 min-w-11 cursor-pointer rounded-pastilla px-4 text-base text-texto-secundario focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco data-[state=checked]:bg-superficie data-[state=checked]:font-bold data-[state=checked]:text-texto data-[state=checked]:shadow-elevacion-1"
          >
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
