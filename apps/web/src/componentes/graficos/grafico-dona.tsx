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
  /** Monto ya formateado que da el DTO (PF-3): va en la leyenda, antes del porcentaje. Para «Otras» es `montoOtras` del DTO (CH-177): nunca una suma de la interfaz. */
  readonly monto?: string;
  /** La porción «Otras» no usa un color de la paleta categórica. */
  readonly otras?: boolean;
}

export interface PropsGraficoDona {
  readonly titulo: string;
  readonly resumen: string;
  readonly porciones: readonly PorcionDona[];
  /** Total al centro, ya formateado: lo da el DTO (PF-3, la dona no suma montos). Sin él, el centro queda vacío. */
  readonly total?: string;
  readonly etiquetaTotal?: string;
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
  'size-3 shrink-0 rounded-sm bg-grafico-serie-1',
  'size-3 shrink-0 rounded-sm bg-grafico-serie-2',
  'size-3 shrink-0 rounded-sm bg-grafico-serie-3',
  'size-3 shrink-0 rounded-sm bg-grafico-serie-4',
  'size-3 shrink-0 rounded-sm bg-grafico-serie-5',
  'size-3 shrink-0 rounded-sm bg-grafico-serie-6',
  'size-3 shrink-0 rounded-sm bg-grafico-serie-7',
  'size-3 shrink-0 rounded-sm bg-grafico-serie-8',
] as const;
// «Otras» va rayada, como en el diseño: no usa un color de la paleta categórica y se distingue sin color.
const OTRAS =
  'size-3 shrink-0 rounded-sm border border-grafico-otras bg-[repeating-linear-gradient(135deg,var(--grafico-otras)_0_1.5px,transparent_1.5px_4px)]';
const arco = arc<{ startAngle: number; endAngle: number }>()
  .innerRadius(62)
  .outerRadius(84)
  .padAngle(0.025);
const reparto = pie<PorcionDona>()
  .value((p) => p.porcentaje)
  .sort(null);

export function GraficoDona({
  titulo,
  resumen,
  porciones,
  total,
  etiquetaTotal,
}: PropsGraficoDona) {
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
    <div className="flex flex-col items-center gap-3 md:flex-row md:gap-5">
      <svg
        role="img"
        aria-label={cuentas.grafico.resumen(titulo, resumen)}
        viewBox="-90 -90 180 180"
        style={{ maxWidth: 180 }}
        className="h-auto w-full shrink-0"
        data-grafico="dona"
      >
        <defs>
          <pattern
            id="finn-rayado-otras"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="5" height="5" className="fill-superficie" />
            <rect width="1.8" height="5" className="fill-grafico-otras" />
          </pattern>
        </defs>
        {reparto([...porciones]).map((a, i) => (
          <path
            key={a.data.clave}
            d={arco(a) ?? ''}
            data-porcion={a.data.clave}
            data-porcentaje={a.data.porcentaje}
            className={a.data.otras === true ? undefined : RELLENO[i % RELLENO.length]}
            {...(a.data.otras === true ? { fill: 'url(#finn-rayado-otras)' } : {})}
          />
        ))}
        {total === undefined ? null : (
          <>
            <text
              data-total
              x="0"
              y={etiquetaTotal === undefined ? 6 : -2}
              textAnchor="middle"
              fontSize="20"
              fontWeight="800"
              className="fill-grafico-tinta"
            >
              {total}
            </text>
            {etiquetaTotal === undefined ? null : (
              <text
                x="0"
                y="14"
                textAnchor="middle"
                fontSize="11"
                className="fill-texto-secundario"
              >
                {etiquetaTotal}
              </text>
            )}
          </>
        )}
      </svg>
      <ul aria-label={t.leyenda} className="flex w-full min-w-0 flex-col gap-1 text-cuerpo-pequeno">
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
            <span className="flex shrink-0 items-baseline gap-3 tabular-nums">
              {p.monto === undefined ? null : <span className="font-semibold">{p.monto}</span>}
              <span
                className={
                  p.monto === undefined ? 'font-semibold' : 'w-10 text-right text-texto-secundario'
                }
              >
                {formatearPorcentaje(p.porcentaje)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
