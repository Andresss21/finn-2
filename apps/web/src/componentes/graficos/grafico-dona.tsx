// Gráfico de dona como Server Component (05 §10.8, FE-44): d3-shape corre solo acá y el cliente recibe SVG. El ángulo de cada
// porción sale de los `porcentaje` (puntos básicos) del DTO; no divide montos (PF-3). La leyenda va en el mismo orden y la
// tabla equivalente la pone quien lo usa (P5-13). Con más de 8 categorías, las que siguen van juntas en «Otras».
import { arc, pie } from 'd3-shape';
import { formatearPorcentaje } from '../../formato';
import { cuentas } from '../../textos/cuentas';
import { reportes as t } from '../../textos/reportes';

export interface PorcionDona {
  readonly clave: string;
  readonly etiqueta: string;
  /** Puntos básicos (04 §6.9.2): las porciones suman 10.000. */
  readonly porcentaje: number;
  /** La porción «Otras» no usa un color de la paleta categórica. */
  readonly otras?: boolean;
}

export interface PropsGraficoDona {
  readonly titulo: string;
  readonly resumen: string;
  readonly porciones: readonly PorcionDona[];
}

// Clases completas: Tailwind solo genera las que ve escritas.
const RELLENO = [
  'fill-grafico-serie-1',
  'fill-grafico-serie-2',
  'fill-grafico-serie-3',
  'fill-grafico-serie-4',
  'fill-grafico-serie-5',
  'fill-grafico-serie-6',
  'fill-grafico-serie-7',
  'fill-grafico-serie-8',
] as const;
const FONDO = [
  'size-3 shrink-0 rounded-full bg-grafico-serie-1',
  'size-3 shrink-0 rounded-full bg-grafico-serie-2',
  'size-3 shrink-0 rounded-full bg-grafico-serie-3',
  'size-3 shrink-0 rounded-full bg-grafico-serie-4',
  'size-3 shrink-0 rounded-full bg-grafico-serie-5',
  'size-3 shrink-0 rounded-full bg-grafico-serie-6',
  'size-3 shrink-0 rounded-full bg-grafico-serie-7',
  'size-3 shrink-0 rounded-full bg-grafico-serie-8',
] as const;
const OTRAS = 'size-3 shrink-0 rounded-full bg-grafico-otras';
const arco = arc<{ startAngle: number; endAngle: number }>().innerRadius(44).outerRadius(80);
const reparto = pie<PorcionDona>()
  .value((p) => p.porcentaje)
  .sort(null);

export function GraficoDona({ titulo, resumen, porciones }: PropsGraficoDona) {
  if (porciones.length === 0) {
    return (
      <div
        data-grafico-vacio
        className="flex h-[180px] items-center justify-center rounded-2xl bg-superficie-hundida p-4 text-center text-cuerpo-pequeno text-texto-secundario"
      >
        {cuentas.grafico.sinDatos}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        role="img"
        aria-label={cuentas.grafico.resumen(titulo, resumen)}
        viewBox="-90 -90 180 180"
        className="h-auto w-full max-w-60"
        data-grafico="dona"
      >
        {reparto([...porciones]).map((a, i) => (
          <path
            key={a.data.clave}
            d={arco(a) ?? ''}
            data-porcion={a.data.clave}
            data-porcentaje={a.data.porcentaje}
            className={a.data.otras === true ? 'fill-grafico-otras' : RELLENO[i % RELLENO.length]}
          />
        ))}
      </svg>
      <ul aria-label={t.leyenda} className="flex w-full flex-col gap-1 text-cuerpo-pequeno">
        {porciones.map((p, i) => (
          <li
            key={p.clave}
            data-leyenda={p.clave}
            className="flex min-h-8 items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className={p.otras === true ? OTRAS : FONDO[i % FONDO.length]}
              />
              <span className="truncate">{p.etiqueta}</span>
            </span>
            <span className="font-semibold tabular-nums">{formatearPorcentaje(p.porcentaje)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
