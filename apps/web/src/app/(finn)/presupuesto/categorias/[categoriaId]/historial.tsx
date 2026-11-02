// Historial de la categoría (FT-14, CA-14.5 y CA-14.9; 06-identidad-visual §6): hasta 6 períodos cerrados en que existía, como
// gráfico (con el tope de lo asignado) o como tabla. «Se pasó k de n» y el promedio gastado vienen del DTO (CF-25): la pantalla
// no cuenta ni promedia. Marcar una barra como pasada compara dos valores del DTO, no hace aritmética de montos.
import type { DetalleCategoria } from '@finn/dominio/selectores';
import { Icono } from '../../../../../componentes/base/icono';
import { Monto } from '../../../../../componentes/dominio/monto';
import { GraficoBarras, type PuntoBarra } from '../../../../../componentes/graficos/grafico-barras';
import { VistaGrafico } from './vista';
import { formatearMonto } from '../../../../../formato';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';

const t = categoriaDetalle.historial;
const etiqueta = (inicio: string): string => `${inicio.slice(8)}/${inicio.slice(5, 7)}`;

export function Historial({
  historial,
  resumen,
}: {
  readonly historial: DetalleCategoria['historial'];
  readonly resumen: DetalleCategoria['historialResumen'];
}) {
  const n = historial.length;
  if (n === 0)
    return (
      <p data-historial="vacio" className="text-cuerpo-pequeno text-texto-secundario">
        {t.vacio}
      </p>
    );
  const puntos: PuntoBarra[] = historial.map((h) => ({
    clave: h.periodo.inicio,
    etiqueta: etiqueta(h.periodo.inicio),
    valor: h.gastado,
    referencia: h.asignado,
    excedido: h.gastado > h.asignado,
  }));
  const tabla = (
    <table data-tabla-equivalente className="w-full text-cuerpo-pequeno">
      <caption className="sr-only">{t.titulo(n)}</caption>
      <thead>
        <tr className="text-left text-rotulo text-texto-secundario">
          {t.columnas.map((h, k) => (
            <th
              key={h}
              scope="col"
              className={k === 0 ? 'py-2 font-normal' : 'py-2 text-right font-normal'}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {historial.map((h) => (
          <tr
            key={h.periodo.inicio}
            data-periodo={h.periodo.inicio}
            className="border-t border-borde-sutil"
          >
            <th scope="row" className="py-2.5 text-left font-semibold">
              {etiqueta(h.periodo.inicio)}
            </th>
            <td className="py-2.5 text-right">
              <Monto centavos={h.asignado} />
            </td>
            <td className="py-2.5 text-right">
              <Monto centavos={h.gastado} />
            </td>
            <td className="py-2.5 text-right">
              {h.disponible < 0 ? (
                <Icono nombre="problema" tamano={14} className="mr-1 inline text-problema-texto" />
              ) : null}
              <Monto
                centavos={h.disponible}
                {...(h.disponible < 0 ? { estado: 'problema' as const } : {})}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <div data-historial={n} className="flex flex-col gap-3">
      <p className="flex flex-wrap items-baseline justify-between gap-2 text-cuerpo-pequeno">
        <span data-se-paso className="font-semibold">
          {t.sePaso(resumen.periodosExcedidos, n)}
        </span>
        <span className="text-texto-secundario">
          {t.promedio} <Monto centavos={resumen.promedioGastado} />
        </span>
      </p>
      <VistaGrafico
        grafico={
          <GraficoBarras
            titulo={t.titulo(n)}
            resumen={`${t.promedio} ${formatearMonto(resumen.promedioGastado)}`}
            puntos={puntos}
          />
        }
        tabla={tabla}
      />
    </div>
  );
}
