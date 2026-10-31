// Gráfico de barras como Server Component (05 §10.8, FE-44): d3-scale corre solo acá y el cliente recibe SVG.
// Sirve para el gasto semanal (con referencia y semanas futuras) y para el historial (con las barras que se pasaron).
// `role="img"` con nombre y la tabla equivalente (`TablaEquivalente`) con los mismos datos (P5-13, V5-25).
import { scaleBand, scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto } from '../../formato';
import { cuentas } from '../../textos/cuentas';
import { Icono } from '../base/icono';

export interface PuntoBarra {
  readonly clave: string;
  readonly etiqueta: string;
  readonly valor: Centavos;
  /** Tope horizontal (lo asignado en la semana, `referencia` de 04 6.9.3). */
  readonly referencia?: Centavos;
  readonly actual?: boolean;
  /** Semana futura: sin barra, solo contorno punteado y su nota. */
  readonly futura?: boolean;
  readonly nota?: string;
  /** Historial: la barra que se pasó de lo asignado. */
  readonly excedido?: boolean;
}

export interface PropsGraficoBarras {
  readonly titulo: string;
  /** El dato principal; junto al título da el nombre accesible. */
  readonly resumen: string;
  readonly puntos: readonly PuntoBarra[];
}

const tope = line();
const ANCHO = 320;
const BASE = 128;
const TOPE = 26;

export function GraficoBarras({ titulo, resumen, puntos }: PropsGraficoBarras) {
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
  const maximo = Math.max(1, ...puntos.flatMap((p) => [p.valor, p.referencia ?? 0]));
  const x = scaleBand()
    .domain(puntos.map((p) => p.clave))
    .range([8, ANCHO - 8])
    .paddingInner(0.3)
    .paddingOuter(0.15);
  const y = scaleLinear().domain([0, maximo]).range([BASE, TOPE]);
  const ancho = Math.min(32, x.bandwidth());
  return (
    <svg
      role="img"
      aria-label={cuentas.grafico.resumen(titulo, resumen)}
      viewBox={`0 0 ${ANCHO} 160`}
      className="h-auto w-full"
      data-grafico="barras"
    >
      <line x1="0" x2={ANCHO} y1={BASE} y2={BASE} className="stroke-grafico-rejilla" />
      {puntos.map((p) => {
        const centro = (x(p.clave) ?? 0) + x.bandwidth() / 2;
        const izq = centro - ancho / 2;
        const alto = Math.max(0, BASE - y(p.valor));
        const relleno =
          p.excedido === true
            ? 'fill-problema-borde'
            : p.actual === true
              ? 'fill-accion'
              : 'fill-grafico-tinta';
        return (
          <g key={p.clave} data-punto={p.clave}>
            {p.futura === true ? (
              <rect
                x={izq}
                y={TOPE + 20}
                width={ancho}
                height={BASE - TOPE - 20}
                rx="8"
                className="fill-none stroke-borde-control"
                strokeDasharray="3 3"
              />
            ) : (
              <>
                <rect
                  x={izq}
                  y={y(p.valor)}
                  width={ancho}
                  height={alto}
                  rx="8"
                  className={relleno}
                />
                <rect
                  x={izq}
                  y={BASE - Math.min(8, alto)}
                  width={ancho}
                  height={Math.min(8, alto)}
                  className={relleno}
                />
                <text
                  x={centro}
                  y={y(p.valor) - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className={p.excedido === true ? 'fill-problema-texto' : 'fill-texto'}
                >
                  {formatearMonto(p.valor)}
                </text>
              </>
            )}
            {p.referencia === undefined ? null : (
              <>
                <path
                  d={
                    tope([
                      [centro - 22, y(p.referencia)],
                      [centro + 22, y(p.referencia)],
                    ]) ?? ''
                  }
                  strokeWidth="2"
                  fill="none"
                  className="stroke-grafico-referencia"
                />
                <circle
                  cx={centro - 22}
                  cy={y(p.referencia)}
                  r="2.6"
                  className="fill-superficie stroke-grafico-referencia"
                />
                <circle
                  cx={centro + 22}
                  cy={y(p.referencia)}
                  r="2.6"
                  className="fill-superficie stroke-grafico-referencia"
                />
              </>
            )}
            <text
              x={centro}
              y={BASE + 16}
              textAnchor="middle"
              fontSize="11"
              fontWeight={p.actual === true ? 700 : 400}
              className="fill-texto-secundario"
            >
              {p.etiqueta}
            </text>
            {p.excedido === true ? (
              <g transform={`translate(${centro - 7} ${BASE + 21})`}>
                <Icono nombre="problema" tamano={14} className="text-problema-texto" />
              </g>
            ) : null}
            {p.actual === true ? (
              <circle cx={centro} cy={BASE + 24} r="2" className="fill-accion" />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
