// Historial de la categoría (FT-14, CA-14.5 y CA-14.9; 06-identidad-visual §6): hasta 6 períodos cerrados en que existía, como
// gráfico (con el tope de lo asignado) o como tabla. «Se pasó k de n» y el promedio gastado vienen del DTO (CF-25): la pantalla
// no cuenta ni promedia. Marcar una barra como pasada compara dos valores del DTO, no hace aritmética de montos.
import type { DetalleCategoria } from '@finn/dominio/selectores';
import { Icono } from '../../../../../componentes/base/icono';
import { Monto } from '../../../../../componentes/dominio/monto';
import { GraficoBarras, type PuntoBarra } from '../../../../../componentes/graficos/grafico-barras';
import { LeyendaGrafico } from '../../../../../componentes/graficos/leyenda-grafico';
import { VistaGrafico } from '../../../../../componentes/graficos/vista-grafico';
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
  // D9 (06-identidad-visual 2.19): sin períodos anteriores, la caja «Gráfico sin datos» en lugar de un gráfico vacío.
  if (n === 0)
    return (
      <div
        data-historial="vacio"
        className="flex h-45 flex-col items-center justify-center gap-2 rounded-2xl bg-superficie-hundida px-6 text-center text-texto-secundario"
      >
        <Icono nombre="chart" tamano={28} />
        <p className="text-cuerpo-pequeno font-semibold text-texto">{t.sinDatos}</p>
        <p className="max-w-70 text-cuerpo-pequeno">{t.vacio}</p>
      </div>
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
  // CAT-21, CAT-31: en computadora el gráfico va arriba y la tabla debajo, a todo el ancho de la tarjeta (`tablaAlLado` las pone
  // lado a lado y la tabla se corta); la regla fuerza una sola columna sin tocar `VistaGrafico` (es del grupo E).
  return (
    <div data-historial={n} className="md:[&_[data-vista-grafico]>div:last-child]:grid-cols-1">
      <VistaGrafico
        cifra={<Monto centavos={resumen.promedioGastado} rol="cifra-principal" />}
        nota={t.promedio}
        aparte={<span data-se-paso>{t.sePaso(resumen.periodosExcedidos, n)}</span>}
        tablaAlLado
        leyenda={
          <LeyendaGrafico
            items={[
              { forma: 'barra', texto: t.leyendaGasto },
              ...(resumen.periodosExcedidos > 0
                ? [{ forma: 'excedido' as const, texto: t.leyendaSePaso }]
                : []),
              { forma: 'referencia', texto: t.leyendaAsignado },
            ]}
          />
        }
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
