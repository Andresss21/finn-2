// Leyenda de un gráfico de barras (export D2 y 04-reportes): una muestra con la forma de la marca y su texto. Solo rotula lo
// que el gráfico ya dibuja; los textos (y las cifras, como «Referencia $81.67») los da quien la usa, desde el DTO (PF-3).
import { cuentas } from '../../textos/cuentas';

export type FormaDeLeyenda = 'barra' | 'actual' | 'excedido' | 'referencia';

export interface ItemDeLeyenda {
  readonly forma: FormaDeLeyenda;
  readonly texto: string;
}

// Clases completas: Tailwind solo genera las que ve escritas.
const MUESTRA = {
  barra: 'size-3 shrink-0 rounded-sm bg-grafico-tinta',
  actual: 'size-3 shrink-0 rounded-sm bg-accion',
  excedido: 'size-3 shrink-0 rounded-sm bg-problema-borde',
} as const;

export function LeyendaGrafico({ items }: { readonly items: readonly ItemDeLeyenda[] }) {
  return (
    <ul
      aria-label={cuentas.grafico.leyenda}
      data-leyenda-grafico
      className="flex flex-wrap gap-x-4 gap-y-1 text-cuerpo-pequeno text-texto-secundario"
    >
      {items.map((i) => (
        <li
          key={i.forma}
          data-leyenda-forma={i.forma}
          className="flex min-h-6 items-center gap-1.5"
        >
          {i.forma === 'referencia' ? (
            <svg aria-hidden="true" width="16" height="8" viewBox="0 0 16 8" className="shrink-0">
              <line
                x1="2"
                x2="14"
                y1="4"
                y2="4"
                strokeWidth="2"
                className="stroke-grafico-referencia"
              />
              <circle cx="2" cy="4" r="2" className="fill-superficie stroke-grafico-referencia" />
              <circle cx="14" cy="4" r="2" className="fill-superficie stroke-grafico-referencia" />
            </svg>
          ) : (
            <span aria-hidden="true" className={MUESTRA[i.forma]} />
          )}
          <span>{i.texto}</span>
        </li>
      ))}
    </ul>
  );
}
