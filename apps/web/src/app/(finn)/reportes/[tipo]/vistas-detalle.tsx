// Los reportes por categoría y por comercio de FT-60 (04 §6.9.2): `categorias` con su dona, `top-comercios` y `cumplimiento`. Dibujan
// lo que trae el DTO, con su tabla equivalente (P5-13). No calculan montos (PF-3): «Otras» suma puntos básicos del DTO, nunca montos;
// su monto (`montoOtras`) y el total del centro (`total`) los trae el DTO (CH-177).
import type { ReactNode } from 'react';
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import type { Ref } from '@finn/dominio/selectores';
import type { Centavos } from '@finn/dominio/valores';
import { Monto } from '../../../../componentes/dominio/monto';
import { GraficoDona, type PorcionDona } from '../../../../componentes/graficos/grafico-dona';
import { VistaGrafico } from '../../../../componentes/graficos/vista-grafico';
import { formatearFecha, formatearMonto, formatearPorcentaje } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';

export interface Nombres {
  readonly cuentas: readonly Ref[];
  readonly grupos: readonly Ref[];
  readonly categorias: readonly Ref[];
}

const MAXIMO_PORCIONES = 8;
const monto = (c: Centavos) => <Monto centavos={c} rol="cuerpo" />;

/** El nombre con que se ve una categoría: las archivadas con actividad llevan su nombre y la marca (R4). */
function nombreDe(lista: readonly Ref[], id: string): string {
  const ref = lista.find((r) => r.id === id);
  if (ref === undefined) return id;
  return ref.archivada === true ? `${ref.nombre} (${t.archivada})` : ref.nombre;
}

export interface Columna<F> {
  readonly id: keyof typeof t.columnas;
  readonly celda: (fila: F) => ReactNode;
}

export function Tabla<F>({
  titulo,
  columnas,
  filas,
  clave,
}: {
  readonly titulo: string;
  readonly columnas: readonly Columna<NoInfer<F>>[];
  readonly filas: readonly F[];
  readonly clave: (fila: F) => string;
}) {
  return (
    <div className="overflow-x-auto in-[.sr-only]:overflow-visible">
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

export function Categorias({
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
    monto: formatearMonto(c.gastado),
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
            monto: formatearMonto(dto.montoOtras),
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
            total={formatearMonto(dto.total)}
            etiquetaTotal={t.totalDona}
          />
        }
        tabla={
          <Tabla
            titulo={t.titulos.categorias}
            filas={dto.categorias}
            clave={(f) => f.categoria}
            columnas={[
              { id: 'categoria', celda: (f) => nombre(f.categoria) },
              { id: 'gastado', celda: (f) => monto(f.gastado) },
              { id: 'porcentaje', celda: (f) => formatearPorcentaje(f.porcentaje) },
            ]}
          />
        }
      />
      {dto.conDevolucionNeta.length === 0 ? null : (
        <section data-con-devolucion-neta className="flex flex-col gap-2">
          <h3 className="text-titulo-seccion">{t.conDevolucionNeta}</h3>
          <Tabla
            titulo={t.conDevolucionNeta}
            filas={dto.conDevolucionNeta}
            clave={(f) => f.categoria}
            columnas={[
              { id: 'categoria', celda: (f) => nombre(f.categoria) },
              { id: 'gastado', celda: (f) => monto(f.gastado) },
            ]}
          />
        </section>
      )}
    </div>
  );
}

export function TopComercios({
  dto,
  nombres,
}: {
  readonly dto: ReporteDe<'top_comercios'>;
  readonly nombres: Nombres;
}) {
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
              <h3 className="text-titulo-seccion">
                {c.clave === '(sin comercio)' ? t.sinComercio : c.etiqueta}
              </h3>
              <p className="text-cuerpo-pequeno text-texto-secundario">
                {nombreDe(nombres.categorias, c.categoriaPrincipal)} · {t.compras(c.frecuencia)}
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

export function Cumplimiento({
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
        { id: 'asignado', celda: (f) => monto(f.asignado) },
        { id: 'gastado', celda: (f) => monto(f.gastado) },
        { id: 'diferencia', celda: (f) => monto(f.diferencia) },
        {
          id: 'porcentaje',
          celda: (f) =>
            f.porcentaje === null ? t.sinPorcentaje : formatearPorcentaje(f.porcentaje),
        },
      ]}
    />
  );
}
