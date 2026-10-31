// Tabla equivalente de un gráfico de barras (05 §11.3, P5-13): los mismos datos, con `caption` y encabezados de fila
// y columna. Nunca sale del árbol de accesibilidad; el selector solo la oculta a la vista.
import { cuentas } from '../../textos/cuentas';
import { Monto } from '../dominio/monto';
import type { PuntoBarra } from './grafico-barras';

const t = cuentas.grafico;

export function TablaEquivalente({
  titulo,
  puntos,
}: {
  readonly titulo: string;
  readonly puntos: readonly PuntoBarra[];
}) {
  const conReferencia = puntos.some((p) => p.referencia !== undefined);
  return (
    <table data-tabla-equivalente className="w-full text-cuerpo-pequeno">
      <caption className="sr-only">{titulo}</caption>
      <thead>
        <tr className="text-left text-rotulo text-texto-secundario">
          <th scope="col" className="py-2 font-normal">
            {t.periodo}
          </th>
          <th scope="col" className="py-2 text-right font-normal">
            {t.valor}
          </th>
          {conReferencia ? (
            <th scope="col" className="py-2 text-right font-normal">
              {t.referencia}
            </th>
          ) : null}
          <th scope="col" className="py-2 pl-3 font-normal">
            {t.estado}
          </th>
        </tr>
      </thead>
      <tbody>
        {puntos.map((p) => (
          <tr
            key={p.clave}
            className={[
              'border-t border-borde-sutil',
              p.actual === true ? 'bg-superficie-hundida' : '',
            ].join(' ')}
          >
            <th scope="row" className="py-2.5 text-left font-semibold">
              {p.etiqueta}
            </th>
            <td className="py-2.5 text-right">
              {p.futura === true ? '—' : <Monto centavos={p.valor} rol="cuerpo" />}
            </td>
            {conReferencia ? (
              <td className="py-2.5 text-right">
                {p.referencia === undefined ? '—' : <Monto centavos={p.referencia} rol="cuerpo" />}
              </td>
            ) : null}
            <td className="py-2.5 pl-3">
              {p.futura === true
                ? (p.nota ?? t.futura)
                : p.excedido === true
                  ? t.sePaso
                  : p.actual === true
                    ? t.actual
                    : (p.nota ?? '')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
