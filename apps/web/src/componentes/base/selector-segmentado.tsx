'use client';
// Selector segmentado (06-identidad-visual 2.3): `role="radiogroup"` de Radix; las flechas cambian la opción.
import * as RadioGroup from '@radix-ui/react-radio-group';

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
  return (
    <RadioGroup.Root
      aria-label={etiqueta}
      value={valor}
      onValueChange={alCambiar}
      className="inline-flex rounded-pastilla bg-superficie-hundida p-1"
    >
      {opciones.map((o) => (
        <RadioGroup.Item
          key={o.valor}
          value={o.valor}
          className="min-h-11 min-w-11 cursor-pointer rounded-pastilla px-4 text-base text-texto-secundario focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco data-[state=checked]:bg-superficie data-[state=checked]:font-bold data-[state=checked]:text-texto data-[state=checked]:shadow-elevacion-1"
        >
          {o.etiqueta}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
