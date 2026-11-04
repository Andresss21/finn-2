// Las filas de «Necesita tu atención» (FT-08; S1 del export): círculo de 36 px con el glifo, el nombre y el estado en su color, el monto
// del estado a la derecha y el chevrón. Solo presentan: el monto llega del DTO (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { Icono } from '../../componentes/base/icono';
import {
  COLOR_CIRCULO,
  COLOR_TEXTO,
  type EstadoFinanciero,
} from '../../componentes/dominio/indicador-estado';
import { Monto } from '../../componentes/dominio/monto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';

export const FOCO =
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
/** La rejilla de la fila: círculo, texto, monto y chevrón (el desplegable de los sobregiros la usa sin monto). */
export const REJILLA = `grid min-h-17 grid-cols-[36px_minmax(0,1fr)_auto_18px] items-center gap-3 px-4 no-underline ${FOCO}`;

export function CirculoEstado({ estado }: { readonly estado: EstadoFinanciero }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'flex size-9 flex-none items-center justify-center rounded-full',
        COLOR_CIRCULO[estado],
      ].join(' ')}
    >
      <Icono nombre={estado} tamano={20} />
    </span>
  );
}

/** El nombre de la fila y, debajo, el estado con su color: el glifo del círculo, el color y el texto son las tres señales (PF-2). */
export function TextoDeFila({
  etiquetas,
  children,
}: {
  readonly etiquetas: readonly { readonly estado: EstadoFinanciero; readonly texto: string }[];
  readonly children: ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-px">
      <span className="font-semibold text-texto">{children}</span>
      {etiquetas.map((e) => (
        <span
          key={e.texto}
          data-estado={e.estado}
          className={['text-cuerpo-pequeno font-semibold', COLOR_TEXTO[e.estado]].join(' ')}
        >
          {e.texto}
        </span>
      ))}
    </span>
  );
}

/** Una fila de atención que enlaza a donde se resuelve. `datos` son los `data-*` que ubican la fila entera (E2E). */
export function FilaAtencion({
  href,
  estado,
  etiqueta,
  monto,
  datos,
  children,
}: {
  readonly href: string;
  readonly estado: EstadoFinanciero;
  readonly etiqueta: string;
  /** Sin monto (la Bandeja cuenta movimientos, no dinero) la columna queda vacía. */
  readonly monto?: Centavos;
  readonly datos?: Readonly<Record<`data-${string}`, string>>;
  readonly children: ReactNode;
}) {
  return (
    <EnlaceFinn href={href} className={REJILLA}>
      <span className="contents" {...datos}>
        <CirculoEstado estado={estado} />
        <TextoDeFila etiquetas={[{ estado, texto: etiqueta }]}>{children}</TextoDeFila>
        {monto === undefined ? <span /> : <Monto centavos={monto} rol="cifra" estado={estado} />}
        <Icono nombre="chevR" tamano={18} />
      </span>
    </EnlaceFinn>
  );
}
