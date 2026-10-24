// Funciones puras de d3 que arman el SVG de barras: se pueden usar en servidor o en cliente.
import { scaleBand, scaleLinear } from 'd3-scale';
export function barras(datos: { etiqueta: string; centavos: number }[], ancho = 320, alto = 160) {
  const x = scaleBand().domain(datos.map((d) => d.etiqueta)).range([0, ancho]).padding(0.2);
  const max = Math.max(1, ...datos.map((d) => d.centavos));
  const y = scaleLinear().domain([0, max]).range([alto, 0]);
  return datos.map((d) => ({ ...d, x: x(d.etiqueta) ?? 0, y: y(d.centavos), ancho: x.bandwidth(), alto: alto - y(d.centavos) }));
}
