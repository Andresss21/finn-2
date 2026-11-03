// Los siete reportes de FT-60 (04 §6.9.2): cada uno dibuja lo que trae el DTO, con su tabla equivalente (P5-13). No calcula
// montos (PF-3): las porciones de «Otras» suman los puntos básicos del DTO, nunca montos.
import type { ReactNode } from 'react';
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import type { Ref } from '@finn/dominio/selectores';
import type { Centavos } from '@finn/dominio/valores';
import { GraficoDona, type PorcionDona } from '../../../../componentes/graficos/grafico-dona';
import { GraficoLineas } from '../../../../componentes/graficos/grafico-lineas';
import { VistaGrafico } from '../../../../componentes/graficos/vista-grafico';
import { Monto } from '../../../../componentes/dominio/monto';
import { formatearFecha, formatearPorcentaje } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';
import type { TipoDeReporte } from './tipos';

export interface Nombres {
  readonly cuentas: readonly Ref[];
  readonly grupos: readonly Ref[];
  readonly categorias: readonly Ref[];
}

const MAXIMO_PORCIONES = 8;
const nombreDe = (lista: readonly Ref[], id: string): string => {
  const ref = lista.find((r) => r.id === id);
  return ref === undefined
    ? id
    : ref.archivada === true
      ? `${ref.nombre} (${t.archivada})`
      : ref.nombre;
};
const monto = (c: Centavos) => <Monto centavos={c} rol="cuerpo" />;

interface Columna<F> {
  readonly id: keyof typeof t.columnas;
  readonly celda: (fila: F) => ReactNode;
}

function Tabla<F>({
  titulo,
  columnas,
  filas,
  clave,
}: {
  readonly titulo: string;
  readonly columnas: readonly Columna<NoInfer<F>>[];
  readonly filas: readonly F[];
  readonly clave: (fila: NoInfer<F>) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table data-tabla-reporte className="w-full text-cuerpo-pequeno">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr className="text-rotulo text-texto-secundario">
            {columnas.map((c, i) => (
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
            <tr key={clave(f)} data-fila={clave(f)} className="border-t border-borde-sutil">
              {columnas.map((c, i) =>
                i === 0 ? (
                  <th
                    key={c.id}
                    scope="row"
                    data-col={c.id}
                    className="py-2.5 text-left font-semibold"
                  >
                    {c.celda(f)}
                  </th>
                ) : (
                  <td key={c.id} data-col={c.id} className="py-2.5 pl-3 text-right">
                    {c.celda(f)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Punto {
  readonly periodo: string;
  readonly valor: Centavos;
}
function Linea({ titulo, puntos }: { readonly titulo: string; readonly puntos: readonly Punto[] }) {
  const etiquetas = puntos.map((p) => formatearFecha(p.periodo));
  return (
    <GraficoLineas
      titulo={titulo}
      resumen={t.resumenLinea(etiquetas[0] ?? '', etiquetas[etiquetas.length - 1] ?? '')}
      puntos={puntos.map((p, i) => ({
        clave: p.periodo,
        etiqueta: etiquetas[i] ?? p.periodo,
        valor: p.valor,
      }))}
    />
  );
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
  celda: (f) => monto(f[id]),
});

function Tendencia({ dto }: { readonly dto: ReporteDe<'tendencia'> }) {
  const filas = dto.periodos;
  return (
    <VistaGrafico
      grafico={
        <div className="flex flex-col gap-4">
          <Linea
            titulo={t.serieIngresos}
            puntos={filas.map((f) => ({ ...f, valor: f.ingresos }))}
          />
          <Linea titulo={t.serieGastos} puntos={filas.map((f) => ({ ...f, valor: f.gastos }))} />
        </div>
      }
      tabla={
        <Tabla
          titulo={t.titulos.tendencia}
          filas={filas}
          clave={(f) => f.periodo}
          columnas={[periodo, campo('ingresos'), campo('gastos'), campo('otrasEntradas')]}
        />
      }
    />
  );
}

function IngresosGastos({ dto }: { readonly dto: ReporteDe<'ingresos_gastos'> }) {
  const filas = dto.periodos;
  return (
    <VistaGrafico
      grafico={
        <Linea
          titulo={t.serieDiferencia}
          puntos={filas.map((f) => ({ ...f, valor: f.diferencia }))}
        />
      }
      tabla={
        <Tabla
          titulo={t.titulos['ingresos-gastos']}
          filas={filas}
          clave={(f) => f.periodo}
          columnas={[
            periodo,
            campo('ingresos'),
            campo('gastos'),
            campo('diferencia'),
            campo('otrasEntradas'),
            campo('restituciones'),
          ]}
        />
      }
    />
  );
}

function Remanente({ dto }: { readonly dto: ReporteDe<'remanente'> }) {
  const filas = dto.periodos;
  return (
    <VistaGrafico
      grafico={
        <Linea
          titulo={t.serieRemanente}
          puntos={filas.map((f) => ({ ...f, valor: f.acumulado }))}
        />
      }
      tabla={
        <Tabla
          titulo={t.titulos.remanente}
          filas={filas}
          clave={(f) => f.periodo}
          columnas={[periodo, campo('neto'), campo('acumulado')]}
        />
      }
    />
  );
}

function Patrimonio({ dto }: { readonly dto: ReporteDe<'patrimonio'> }) {
  const filas = dto.serie;
  return (
    <div className="flex flex-col gap-4">
      <p data-patrimonio-hoy className="flex items-baseline justify-between gap-3">
        <span className="text-cuerpo-pequeno text-texto-secundario">{t.patrimonioHoy}</span>
        <Monto centavos={dto.posicionHoy.total} rol="cifra" />
      </p>
      <VistaGrafico
        grafico={
          <Linea titulo={t.serieNeto} puntos={filas.map((f) => ({ ...f, valor: f.neto }))} />
        }
        tabla={
          <Tabla
            titulo={t.titulos.patrimonio}
            filas={filas}
            clave={(f) => f.periodo}
            columnas={[periodo, campo('activos'), campo('deudas'), campo('neto')]}
          />
        }
      />
    </div>
  );
}

function Categorias({
  dto,
  nombres,
}: {
  readonly dto: ReporteDe<'categorias'>;
  readonly nombres: Nombres;
}) {
  const nombre = (id: string) => nombreDe(nombres.categorias, id);
  const visibles: PorcionDona[] = dto.categorias.slice(0, MAXIMO_PORCIONES).map((c) => ({
    clave: c.categoria,
    etiqueta: nombre(c.categoria),
    porcentaje: c.porcentaje,
  }));
  const resto = dto.categorias.slice(MAXIMO_PORCIONES);
  const porciones: PorcionDona[] =
    resto.length === 0
      ? visibles
      : [
          ...visibles,
          {
            clave: 'otras',
            etiqueta: t.otras,
            porcentaje: resto.reduce((suma, c) => suma + c.porcentaje, 0),
            otras: true,
          },
        ];
  const mayor = porciones[0];
  return (
    <div className="flex flex-col gap-4">
      <VistaGrafico
        grafico={
          <GraficoDona
            titulo={t.titulos.categorias}
            resumen={
              mayor === undefined
                ? t.resumenDonaVacia
                : t.resumenDona(mayor.etiqueta, formatearPorcentaje(mayor.porcentaje))
            }
            porciones={porciones}
          />
        }
        tabla={
          <Tabla
            titulo={t.titulos.categorias}
            filas={dto.categorias}
            clave={(f) => f.categoria}
            columnas={[
              { id: 'categoria', celda: (f) => nombre(f.categoria) },
              campo('gastado'),
              { id: 'porcentaje', celda: (f) => formatearPorcentaje(f.porcentaje) },
            ]}
          />
        }
      />
      {dto.conDevolucionNeta.length === 0 ? null : (
        <section data-con-devolucion-neta className="flex flex-col gap-2">
          <h2 className="text-titulo-seccion">{t.conDevolucionNeta}</h2>
          <Tabla
            titulo={t.conDevolucionNeta}
            filas={dto.conDevolucionNeta}
            clave={(f) => f.categoria}
            columnas={[{ id: 'categoria', celda: (f) => nombre(f.categoria) }, campo('gastado')]}
          />
        </section>
      )}
    </div>
  );
}

function TopComercios({
  dto,
  nombres,
}: {
  readonly dto: ReporteDe<'top_comercios'>;
  readonly nombres: Nombres;
}) {
  const etiqueta = (e: string) => (e === '(sin comercio)' ? t.sinComercio : e);
  return (
    <ol className="flex flex-col gap-3">
      {dto.comercios.map((c) => (
        <li
          key={c.clave}
          data-comercio={c.clave}
          className="flex flex-col gap-2 rounded-contenedor bg-superficie p-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <h2 className="text-titulo-seccion">{etiqueta(c.etiqueta)}</h2>
              <p className="text-cuerpo-pequeno text-texto-secundario">
                {nombreDe(nombres.categorias, c.categoriaPrincipal)} · {c.frecuencia}{' '}
                {t.columnas.compras.toLowerCase()}
              </p>
            </div>
            <span data-monto-comercio>{monto(c.monto)}</span>
          </div>
          {c.variantes.length > 1 ? (
            <ul aria-label={t.variantes} className="flex flex-col gap-1 text-cuerpo-pequeno">
              {c.variantes.map((v) => (
                <li
                  key={v.comercio}
                  data-variante={v.comercio}
                  className="flex justify-between gap-3"
                >
                  <span className="min-w-0 truncate">{v.comercio}</span>
                  {monto(v.monto)}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function Cumplimiento({
  dto,
  nombres,
}: {
  readonly dto: ReporteDe<'cumplimiento'>;
  readonly nombres: Nombres;
}) {
  return (
    <Tabla
      titulo={t.titulos.cumplimiento}
      filas={dto.filas}
      clave={(f) => `${f.categoria}:${f.periodo}`}
      columnas={[
        { id: 'categoria', celda: (f) => nombreDe(nombres.categorias, f.categoria) },
        { id: 'periodo', celda: (f) => formatearFecha(f.periodo) },
        campo('asignado'),
        campo('gastado'),
        campo('diferencia'),
        {
          id: 'porcentaje',
          celda: (f) =>
            f.porcentaje === null ? t.sinPorcentaje : formatearPorcentaje(f.porcentaje),
        },
      ]}
    />
  );
}

const sinMovimiento = (c: readonly Centavos[]): boolean => c.every((x) => x === 0);

/** El cuerpo del reporte, o `null` si la ventana no tiene movimientos (05 §2.10). */
export function cuerpoDe(tipo: TipoDeReporte, dto: unknown, nombres: Nombres): ReactNode {
  switch (tipo) {
    case 'tendencia': {
      const d = dto as ReporteDe<'tendencia'>;
      return sinMovimiento(
        d.periodos.flatMap((p) => [p.ingresos, p.gastos, p.otrasEntradas]),
      ) ? null : (
        <Tendencia dto={d} />
      );
    }
    case 'ingresos_gastos': {
      const d = dto as ReporteDe<'ingresos_gastos'>;
      return sinMovimiento(
        d.periodos.flatMap((p) => [p.ingresos, p.gastos, p.otrasEntradas, p.restituciones]),
      ) ? null : (
        <IngresosGastos dto={d} />
      );
    }
    case 'remanente': {
      const d = dto as ReporteDe<'remanente'>;
      return sinMovimiento(d.periodos.map((p) => p.neto)) ? null : <Remanente dto={d} />;
    }
    case 'patrimonio': {
      const d = dto as ReporteDe<'patrimonio'>;
      return d.serie.length === 0 ? null : <Patrimonio dto={d} />;
    }
    case 'categorias': {
      const d = dto as ReporteDe<'categorias'>;
      return d.categorias.length + d.conDevolucionNeta.length === 0 ? null : (
        <Categorias dto={d} nombres={nombres} />
      );
    }
    case 'top_comercios': {
      const d = dto as ReporteDe<'top_comercios'>;
      return d.comercios.length === 0 ? null : <TopComercios dto={d} nombres={nombres} />;
    }
    case 'cumplimiento': {
      const d = dto as ReporteDe<'cumplimiento'>;
      return d.filas.length === 0 ? null : <Cumplimiento dto={d} nombres={nombres} />;
    }
  }
}
