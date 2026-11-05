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
  /** S4 del export (CH-136): ocupa el ancho, con las opciones iguales y sin elegir ninguna mientras `valor` no es una de ellas. */
  readonly llena?: boolean;
}

// Clases literales (L13).
const BOTON =
  'min-h-11 cursor-pointer text-texto-secundario focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco data-[state=checked]:bg-superficie data-[state=checked]:font-bold data-[state=checked]:text-texto data-[state=checked]:shadow-elevacion-1';
const BOTON_LLENO = 'min-w-0 flex-1 rounded-lg px-1 text-etiqueta';
const BOTON_PASTILLA = 'min-w-11 rounded-pastilla px-4 text-base';

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
  llena = false,
}: PropsSelectorSegmentado) {
  const grupo = useRef<HTMLDivElement>(null);
  const activa = opciones.some((o) => o.valor === valor)
    ? valor
    : llena
      ? undefined
      : opciones[0]?.valor;

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
      className={
        llena
          ? 'flex gap-0.5 rounded-control bg-superficie-hundida p-0.75'
          : 'inline-flex rounded-pastilla bg-superficie-hundida p-1'
      }
    >
      {opciones.map((o, k) => {
        const marcada = o.valor === activa;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={marcada}
            tabIndex={marcada || (activa === undefined && k === 0) ? 0 : -1}
            data-state={marcada ? 'checked' : 'unchecked'}
            onClick={() => {
              alCambiar(o.valor);
            }}
            onKeyDown={(e) => {
              alTeclear(e, k);
            }}
            className={[BOTON, llena ? BOTON_LLENO : BOTON_PASTILLA].join(' ')}
          >
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
