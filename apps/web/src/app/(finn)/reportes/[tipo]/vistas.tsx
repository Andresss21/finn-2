// Los reportes por período de FT-60 (04 §6.9.2): cada uno dibuja lo que trae el DTO, con su gráfico de líneas y su tabla equivalente
// con los mismos números (P5-13). No calcula montos (PF-3).
import type { ReactNode } from 'react';
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import type { Centavos } from '@finn/dominio/valores';
import { GraficoLineas } from '../../../../componentes/graficos/grafico-lineas';
import { VistaGrafico } from '../../../../componentes/graficos/vista-grafico';
import { Monto } from '../../../../componentes/dominio/monto';
import { formatearFecha, formatearMesCorto } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';
import type { TipoDeReporte } from './tipos';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { Hormiga } from './hormiga';
import { Realidad } from './realidad';
import type { AccionesRealidad } from './realidad-hallazgos';
import { Ritmo } from './ritmo';
import { Categorias, Cumplimiento, TopComercios, type Nombres } from './vistas-detalle';
import { GastoSemanal } from './vistas-semanal';

interface Columna<F> {
  readonly id: keyof typeof t.columnas;
  readonly celda: (fila: F) => ReactNode;
}

const periodo: Columna<{ readonly periodo: string }> = {
  id: 'periodo',
  celda: (f) => formatearFecha(f.periodo),
};
/** Una columna de montos: toma del DTO el campo que se llama igual que ella. */
const campo = <K extends keyof typeof t.columnas>(
  id: K,
): Columna<{ readonly [P in K]: Centavos }> => ({
  id,
  celda: (f) => <Monto centavos={f[id]} rol="cuerpo" />,
});

interface Linea<F> {
  readonly titulo: string;
  readonly valor: (fila: F) => Centavos;
}

/** Un reporte con una fila por período: sus líneas y la tabla con una columna por cifra. */
function Serie<F extends { readonly periodo: string }>({
  titulo,
  filas,
  lineas,
  columnas,
}: {
  readonly titulo: string;
  readonly filas: readonly F[];
  readonly lineas: readonly Linea<NoInfer<F>>[];
  readonly columnas: readonly Columna<NoInfer<F>>[];
}) {
  const etiquetas = filas.map((f) => formatearFecha(f.periodo));
  return (
    <VistaGrafico
      grafico={
        <div className="flex flex-col gap-4">
          {lineas.map((l) => (
            <GraficoLineas
              key={l.titulo}
              titulo={l.titulo}
              resumen={t.resumenLinea(etiquetas[0] ?? '', etiquetas[etiquetas.length - 1] ?? '')}
              etiquetasTodas
              puntos={filas.map((f) => ({
                clave: f.periodo,
                etiqueta: formatearMesCorto(f.periodo),
                valor: l.valor(f),
              }))}
            />
          ))}
        </div>
      }
      tabla={
        <div className="overflow-x-auto in-[.sr-only]:overflow-visible">
          <table data-tabla-reporte className="w-full text-cuerpo-pequeno">
            <caption className="sr-only">{titulo}</caption>
            <thead>
              <tr className="text-rotulo text-texto-secundario">
                {[periodo, ...columnas].map((c, i) => (
                  <th
                    key={c.id}
                    scope="col"
                    className={
                      i === 0 ? 'py-2 text-left font-normal' : 'py-2 pl-3 text-right font-normal'
                    }
                  >
                    {t.columnas[c.id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.periodo} data-fila={f.periodo} className="border-t border-borde-sutil">
                  <th scope="row" data-col="periodo" className="py-2.5 text-left font-semibold">
                    {periodo.celda(f)}
                  </th>
                  {columnas.map((c) => (
                    <td key={c.id} data-col={c.id} className="py-2.5 pl-3 text-right">
                      {c.celda(f)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}

const sinMovimiento = (cifras: readonly Centavos[]): boolean => cifras.every((c) => c === 0);

/** El cuerpo del reporte, o `null` si la ventana no tiene movimientos (05 §2.10). */
export function cuerpoDe(
  tipo: TipoDeReporte,
  dto: unknown,
  nombres: Nombres,
  asignar?: AccionEscritura,
  realidad?: AccionesRealidad,
): ReactNode {
  switch (tipo) {
    case 'hormiga':
      // Siempre dibuja: sin grupos dice su propio estado (06 FT-64), no «No hay movimientos».
      return <Hormiga dto={dto as ReporteDe<'hormiga'>} />;
    case 'realidad': {
      const d = dto as ReporteDe<'realidad'>;
      return d.categorias.length === 0 ? null : (
        <Realidad dto={d} {...(realidad === undefined ? {} : { acciones: realidad })} />
      );
    }
    case 'ritmo': {
      const d = dto as ReporteDe<'ritmo'>;
      return d.categorias.length === 0 ? null : (
        <Ritmo dto={d} {...(asignar === undefined ? {} : { asignar })} />
      );
    }
    case 'tendencia': {
      const { periodos } = dto as ReporteDe<'tendencia'>;
      if (sinMovimiento(periodos.flatMap((p) => [p.ingresos, p.gastos, p.otrasEntradas])))
        return null;
      return (
        <Serie
          titulo={t.titulos.tendencia}
          filas={periodos}
          lineas={[
            { titulo: t.serieIngresos, valor: (f) => f.ingresos },
            { titulo: t.serieGastos, valor: (f) => f.gastos },
          ]}
          columnas={[campo('ingresos'), campo('gastos'), campo('otrasEntradas')]}
        />
      );
    }
    case 'ingresos_gastos': {
      const { periodos } = dto as ReporteDe<'ingresos_gastos'>;
      if (
        sinMovimiento(
          periodos.flatMap((p) => [p.ingresos, p.gastos, p.otrasEntradas, p.restituciones]),
        )
      )
        return null;
      return (
        <Serie
          titulo={t.titulos['ingresos-gastos']}
          filas={periodos}
          lineas={[{ titulo: t.serieDiferencia, valor: (f) => f.diferencia }]}
          columnas={[
            campo('ingresos'),
            campo('gastos'),
            campo('diferencia'),
            campo('otrasEntradas'),
            campo('restituciones'),
          ]}
        />
      );
    }
    case 'remanente': {
      const { periodos } = dto as ReporteDe<'remanente'>;
      if (sinMovimiento(periodos.map((p) => p.neto))) return null;
      return (
        <Serie
          titulo={t.titulos.remanente}
          filas={periodos}
          lineas={[{ titulo: t.serieRemanente, valor: (f) => f.acumulado }]}
          columnas={[campo('neto'), campo('acumulado')]}
        />
      );
    }
    case 'categorias': {
      const d = dto as ReporteDe<'categorias'>;
      if (d.categorias.length + d.conDevolucionNeta.length === 0) return null;
      return <Categorias dto={d} nombres={nombres} />;
    }
    case 'top_comercios': {
      const d = dto as ReporteDe<'top_comercios'>;
      return d.comercios.length === 0 ? null : <TopComercios dto={d} nombres={nombres} />;
    }
    case 'cumplimiento': {
      const d = dto as ReporteDe<'cumplimiento'>;
      return d.filas.length === 0 ? null : <Cumplimiento dto={d} nombres={nombres} />;
    }
    case 'gasto_semanal': {
      const d = dto as ReporteDe<'gasto_semanal'>;
      return d.categorias.length === 0 ? null : <GastoSemanal dto={d} nombres={nombres} />;
    }
    case 'patrimonio': {
      const { serie, posicionHoy } = dto as ReporteDe<'patrimonio'>;
      if (serie.length === 0) return null;
      return (
        <div className="flex flex-col gap-4">
          <p data-patrimonio-hoy className="flex flex-col gap-0.5">
            <Monto centavos={posicionHoy.total} rol="cifra-principal" />
            <span className="text-cuerpo-pequeno text-texto-secundario">{t.patrimonioHoy}</span>
          </p>
          <Serie
            titulo={t.titulos.patrimonio}
            filas={serie}
            lineas={[{ titulo: t.serieNeto, valor: (f) => f.neto }]}
            columnas={[campo('activos'), campo('deudas'), campo('neto')]}
          />
        </div>
      );
    }
  }
}
