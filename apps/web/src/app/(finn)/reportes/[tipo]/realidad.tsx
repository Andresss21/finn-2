// El reporte `realidad` (FT-63; 05 §2.10, 06 §3.5.6 y 3.5.7): «Presupuesto contra la realidad» con su ajuste de un toque,
// «Comparación con tu promedio» con su enlace a la categoría y una fila por categoría con los períodos que se compararon. Dibuja
// lo que trae el DTO: no calcula montos (PF-3). Una categoría con menos de 3 períodos no se evalúa y lo dice.
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { COLOR_TEXTO } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { MENOS, formatearFecha, formatearMonto, formatearPorcentaje } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';
import { HallazgosRealidad, type AccionesRealidad } from './realidad-hallazgos';
import { Tabla } from './vistas-detalle';

type Fila = ReporteDe<'realidad'>['categorias'][number];
export type HallazgoPromedio = Extract<
  ReporteDe<'realidad'>['hallazgos'][number],
  { tipo: 'promedio' }
>;

const ENLACE =
  'inline-flex min-h-11 items-center gap-1.5 text-etiqueta font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const SIN_DATO = '—';

/** Puntos básicos con su signo: `5682` → `+56.82 %`. */
const variacionTexto = (bp: number): string =>
  `${bp < 0 ? MENOS : '+'}${formatearPorcentaje(Math.abs(bp))}`;

function Periodos({ fila }: { readonly fila: Fila }) {
  return (
    <details data-periodos={fila.categoria.id} className="border-t border-borde-sutil">
      <summary className="min-h-11 cursor-pointer py-2.5 text-etiqueta text-accion">
        {t.realidad.periodosDe(fila.categoria.nombre)}
      </summary>
      <Tabla<Fila['periodos'][number]>
        enfocable
        titulo={t.realidad.periodosDe(fila.categoria.nombre)}
        clave={(p) => p.periodo}
        filas={fila.periodos}
        columnas={[
          { id: 'periodo', celda: (p) => formatearFecha(p.periodo) },
          { id: 'asignado', celda: (p) => <Monto centavos={p.asignado} rol="cuerpo" /> },
          { id: 'gastado', celda: (p) => <Monto centavos={p.gastado} rol="cuerpo" /> },
        ]}
      />
    </details>
  );
}

/** La comparación con el promedio de una categoría y su enlace; también la dibuja el reporte `hallazgos`. */
export function AvisoPromedio({ hallazgo: h }: { readonly hallazgo: HallazgoPromedio }) {
  return (
    <div data-hallazgo-promedio={h.clave}>
      <AvisoEnLinea
        estado={h.estado}
        accion={
          <EnlaceFinn
            href={`/presupuesto/categorias/${h.accion.categoriaId}`}
            className={[ENLACE, COLOR_TEXTO[h.estado]].join(' ')}
          >
            {t.realidad.revisar(h.categoria.nombre)}
          </EnlaceFinn>
        }
      >
        {t.realidad.camino(
          h.categoria.nombre,
          formatearMonto(h.gasto),
          formatearPorcentaje(Math.abs(h.variacion)),
          h.variacion >= 0,
          formatearMonto(h.promedio),
        )}
      </AvisoEnLinea>
    </div>
  );
}

export function Realidad({
  dto,
  acciones,
}: {
  readonly dto: ReporteDe<'realidad'>;
  readonly acciones?: AccionesRealidad;
}) {
  const deRealidad = dto.hallazgos.filter((h) => h.tipo === 'realidad');
  const dePromedio = dto.hallazgos.filter((h) => h.tipo === 'promedio');
  return (
    <div className="flex flex-col gap-6">
      {/* Siempre montada: la salida «Deshacer» sigue en su lugar cuando la revalidación quita el hallazgo. */}
      <section data-seccion-realidad className="flex flex-col gap-2.5">
        <h3 className="text-titulo-seccion">{t.realidad.seccionRealidad}</h3>
        {deRealidad.length === 0 ? (
          <p data-sin-hallazgos className="text-cuerpo-pequeno text-texto-secundario">
            {t.realidad.sinHallazgosRealidad}
          </p>
        ) : null}
        <HallazgosRealidad
          hallazgos={deRealidad}
          periodoInicio={dto.periodo.inicio}
          {...(acciones === undefined ? {} : { acciones })}
        />
      </section>
      <section data-seccion-promedio className="flex flex-col gap-2.5">
        <h3 className="text-titulo-seccion">{t.realidad.seccionPromedio}</h3>
        {dePromedio.length === 0 ? (
          <p data-sin-hallazgos className="text-cuerpo-pequeno text-texto-secundario">
            {t.realidad.sinHallazgosPromedio}
          </p>
        ) : null}
        {dePromedio.map((h) => (
          <AvisoPromedio key={h.clave} hallazgo={h} />
        ))}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-titulo-seccion">{t.realidad.porCategoria}</h3>
        <Tabla<Fila>
          enfocable
          titulo={t.realidad.porCategoria}
          clave={(f) => f.categoria.id}
          filas={dto.categorias}
          columnas={[
            {
              id: 'categoria',
              celda: (f) => (
                <>
                  {f.categoria.nombre}
                  {f.promedioGastado === null ? (
                    <span
                      data-sin-historia
                      className="block text-cuerpo-pequeno font-normal text-texto-secundario"
                    >
                      {t.realidad.sinHistoria}
                    </span>
                  ) : null}
                </>
              ),
            },
            {
              id: 'promedioGastado',
              celda: (f) =>
                f.promedioGastado === null ? (
                  SIN_DATO
                ) : (
                  <Monto centavos={f.promedioGastado} rol="cuerpo" />
                ),
            },
            {
              id: 'sugerido',
              celda: (f) =>
                f.sugerido === null ? SIN_DATO : <Monto centavos={f.sugerido} rol="cuerpo" />,
            },
            {
              id: 'gastoComparado',
              celda: (f) => <Monto centavos={f.gastoComparado} rol="cuerpo" />,
            },
            {
              id: 'variacion',
              celda: (f) => (f.variacion === null ? SIN_DATO : variacionTexto(f.variacion)),
            },
          ]}
        />
        <div className="flex flex-col">
          {dto.categorias
            .filter((f) => f.periodos.length > 0)
            .map((f) => (
              <Periodos key={f.categoria.id} fila={f} />
            ))}
        </div>
      </section>
    </div>
  );
}
