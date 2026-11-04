// Gráfico de líneas como Server Component (05 §10.8, FE-44): d3 corre solo acá y el cliente recibe SVG. Una serie de valores
// por período, con el cero como base (los valores pueden ser negativos). `role="img"` con nombre; la tabla equivalente
// (`TablaEquivalente`) la pone quien lo usa (P5-13, V5-25). Rotula solo el primer y el último punto: el resto está en la tabla.
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto } from '../../formato';
import { cuentas } from '../../textos/cuentas';

export interface PuntoLinea {
  readonly clave: string;
  readonly etiqueta: string;
  readonly valor: Centavos;
}

export interface PropsGraficoLineas {
  readonly titulo: string;
  /** El dato principal; junto al título da el nombre accesible. */
  readonly resumen: string;
  readonly puntos: readonly PuntoLinea[];
}

const ANCHO = 320;
const ALTO = 170;
const IZQ = 16;
const DER = 16;
const ARRIBA = 28;
const ABAJO = 36;
const trazo = line<readonly [number, number]>()
  .x((p) => p[0])
  .y((p) => p[1]);

export function GraficoLineas({ titulo, resumen, puntos }: PropsGraficoLineas) {
  if (puntos.length === 0) {
    return (
      <div
        data-grafico-vacio
        className="flex h-[180px] items-center justify-center rounded-2xl bg-superficie-hundida p-4 text-center text-cuerpo-pequeno text-texto-secundario"
      >
        {cuentas.grafico.sinDatos}
      </div>
    );
  }
  const valores = puntos.map((p) => p.valor);
  const ultimo = puntos.length - 1;
  const x = scaleLinear()
    .domain([0, Math.max(1, ultimo)])
    .range([IZQ + 24, ANCHO - DER - 24]);
  const y = scaleLinear()
    .domain([Math.min(0, ...valores), Math.max(1, ...valores)])
    .range([ALTO - ABAJO, ARRIBA]);
  const xy = puntos.map((p, i): [number, number] => [x(i), y(p.valor)]);
  return (
    <svg
      role="img"
      aria-label={cuentas.grafico.resumen(titulo, resumen)}
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      style={{ maxWidth: ANCHO }}
      className="mx-auto h-auto w-full"
      data-grafico="lineas"
    >
      <line x1="0" x2={ANCHO} y1={y(0)} y2={y(0)} className="stroke-grafico-rejilla" />
      <path d={trazo(xy) ?? ''} fill="none" strokeWidth="2" className="stroke-grafico-serie-1" />
      {puntos.map((p, i) => {
        const [cx = 0, cy = 0] = xy[i] ?? [];
        const borde = ultimo > 0 && (i === 0 || i === ultimo);
        const ancla = !borde ? 'middle' : i === 0 ? 'start' : 'end';
        const pie = !borde ? cx : i === 0 ? IZQ : ANCHO - DER;
        return (
          <g key={p.clave} data-punto={p.clave}>
            <circle
              cx={cx}
              cy={cy}
              r={i === ultimo ? 4 : 3}
              className={i === ultimo ? 'fill-accion' : 'fill-grafico-serie-1'}
            />
            {i === 0 || i === ultimo ? (
              <>
                <text
                  x={cx}
                  y={cy - 9}
                  textAnchor={ancla}
                  fontSize="11"
                  fontWeight="700"
                  className="fill-texto"
                >
                  {formatearMonto(p.valor)}
                </text>
                <text
                  x={pie}
                  y={ALTO - 12}
                  textAnchor={ancla}
                  fontSize="11"
                  className="fill-texto-secundario"
                >
                  {p.etiqueta}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
