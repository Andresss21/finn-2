import { barras } from './grafico';
import { formatearMonto } from '@/lib/formato';
import { Monto } from './monto';
// Prototipo de GraficoBarras (05 §10.8): SVG decorativo con resumen accesible + tabla equivalente (P5-13).
export function GraficoBarras({ titulo, datos }: { titulo: string; datos: { etiqueta: string; centavos: number }[] }) {
  const b = barras(datos);
  const mayor = [...datos].sort((p, q) => q.centavos - p.centavos)[0];
  return (
    <figure>
      <figcaption className="font-semibold">{titulo}</figcaption>
      <svg viewBox="0 0 320 160" role="img" aria-label={`${titulo}. Mayor: ${mayor?.etiqueta} con ${formatearMonto(mayor?.centavos ?? 0)}.`} className="w-full max-w-sm text-accion">
        {b.map((d) => <rect key={d.etiqueta} x={d.x} y={d.y} width={d.ancho} height={d.alto} fill="currentColor" />)}
      </svg>
      <table className="text-sm">
        <caption className="sr-only">{titulo}: datos del gráfico</caption>
        <thead><tr><th scope="col" className="text-left">Período</th><th scope="col" className="text-right">Gastado</th></tr></thead>
        <tbody>{datos.map((d) => <tr key={d.etiqueta}><th scope="row" className="text-left font-normal">{d.etiqueta}</th><td className="text-right"><Monto centavos={d.centavos} /></td></tr>)}</tbody>
      </table>
    </figure>
  );
}
