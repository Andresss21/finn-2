'use client';
// Selector segmentado (06-identidad-visual 2.3): `role="radiogroup"` con botones nativos `role="radio"`; las flechas cambian la
// opción y mueven el foco. Sin Radix, para no sumar su biblioteca de radios a las rutas que no la usan (05 §13.1).
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useEnGrupo } from './campo';

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
  'relative min-h-11 cursor-pointer text-texto-secundario focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco data-[state=checked]:bg-superficie data-[state=checked]:font-bold data-[state=checked]:text-texto data-[state=checked]:shadow-elevacion-1';
const BOTON_LLENO = 'min-w-0 flex-1 rounded-lg px-1 text-etiqueta';
const BOTON_PASTILLA = 'min-w-11 rounded-pastilla px-4 text-base';

const INDICADOR_LLENO = 'fz-segmento-indicador rounded-lg bg-superficie shadow-elevacion-1';
const INDICADOR_PASTILLA =
  'fz-segmento-indicador rounded-pastilla bg-superficie shadow-elevacion-1';

/** Posición y tamaño de la opción elegida: x, y, ancho y alto. */
type Medida = readonly [number, number, number, number];

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
  // [CH-274] Dentro de `GrupoCampos`, el segmentado v3 (C-45, CAMPOS-V3 §9; clases en globals.css). Fuera, como hoy.
  const v3 = useEnGrupo();
  const [medida, setMedida] = useState<Medida | null>(null);
  const activa = opciones.some((o) => o.valor === valor)
    ? valor
    : llena
      ? undefined
      : opciones[0]?.valor;

  // C7 (CH-220): el indicador es un elemento que se desliza a la opción elegida (posición y ancho), no un repintado de la opción.
  // Hasta medir (servidor y primer cuadro) la opción elegida pinta su propio fondo.
  useLayoutEffect(() => {
    const el = grupo.current;
    if (el === null) return;
    const medir = () => {
      const marcada = el.querySelector<HTMLElement>('[role=radio][aria-checked=true]');
      setMedida(
        marcada === null
          ? null
          : [marcada.offsetLeft, marcada.offsetTop, marcada.offsetWidth, marcada.offsetHeight],
      );
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => {
      observador.disconnect();
    };
  }, [activa, opciones]);

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
      data-indicador={medida === null ? undefined : ''}
      data-v3={v3 ? '' : undefined}
      className={
        llena
          ? 'relative flex gap-0.5 rounded-control bg-superficie-hundida p-0.75'
          : 'relative inline-flex rounded-pastilla bg-superficie-hundida p-1'
      }
    >
      {medida === null ? null : (
        <span
          aria-hidden="true"
          data-segmento-indicador
          className={llena ? INDICADOR_LLENO : INDICADOR_PASTILLA}
          style={{
            transform: `translate(${String(medida[0])}px, ${String(medida[1])}px)`,
            width: medida[2],
            height: medida[3],
          }}
        />
      )}
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
