// `/presupuesto` (FT-09; 06-identidad-visual §5): el período con su selector, Listo para asignar, filtros, grupos, pagos de
// tarjeta, totales y las archivadas con dinero. Dibuja lo que trae el DTO: no calcula montos (PF-3). Período cerrado: solo
// lectura, sin asignar, mover ni auto-asignar y sin franja de Listo para asignar (inv. 18, 05 §7.7). Período futuro: sin pagos
// de tarjeta (su "te falta reservar" solo existe en el activo, inv. 2).
import type { PresupuestoDto } from '@finn/aplicacion/consultas/presupuesto';
import type { ReactNode } from 'react';
import { Pastillas } from '../../../componentes/base/pastillas';
import { Vacio } from '../../../componentes/base/vacio';
import { SacarDeUnToque } from './sacar-un-toque';
import type { AccionEscritura } from '../../../formularios/use-operacion';
import { FilaCategoria } from '../../../componentes/dominio/fila-categoria';
import { FilaPagoTarjeta } from '../../../componentes/dominio/fila-pago';
import { ResumenListoParaAsignar } from '../../../componentes/dominio/billete';
import { Monto } from '../../../componentes/dominio/monto';
import { PublicarAcciones } from '../../../componentes/marco/publicar-acciones';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { EntradaDePeriodo } from '../../../componentes/navegacion/direccion-periodo';
import { SelectorPeriodo } from '../../../componentes/navegacion/selector-periodo';
import { dominio } from '../../../textos/dominio';
import { glosario } from '../../../textos/glosario';
import { presupuesto as t } from '../../../textos/presupuesto';
import { MontoDestello } from '../../../componentes/dominio/monto-destello';

/** Los valores de `?filtro=` en la URL (BE-39); sin ninguno, "todas". */
export type FiltroDeUrl = 'sobregiradas' | 'sin-fondos' | 'cubiertas';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;
const TONAL = `inline-flex min-h-11 flex-1 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion hover:bg-superficie-hundida ${FOCO}`;
const ACCION = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;
const CONTENEDOR = 'flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie';
// Cada bloque de la derecha (franja, pagos, totales, archivadas) en teléfono es un hijo directo de `<main>` (`contents`), para
// ordenarlo con `order`; en computadora es una columna.
const O1 = 'order-1 md:order-none';
const O2 = 'order-2 flex flex-col gap-5 md:order-none';
const O3 = 'order-3 md:order-none';
const O4 =
  'order-4 flex scroll-mt-20 flex-col gap-4.5 md:order-none md:gap-0 md:rounded-contenedor md:bg-superficie md:px-1 md:py-3.5 md:shadow-elevacion-1';
const O5 = 'order-5 md:order-none';
const O6 =
  'order-6 grid grid-cols-3 gap-2 rounded-contenedor bg-superficie-hundida p-3.5 md:order-none';
const O7 = 'order-7 md:order-none';
const ENCABEZADO_TABLA =
  'hidden gap-3 border-b-2 border-texto pb-2 pl-3 md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(3,110px)]';
const COMO_SE_COMPONE = `-mt-4 inline-flex min-h-11 items-center justify-end text-etiqueta font-bold text-enlace hover:underline ${FOCO}`;
const GRUPO = `${CONTENEDOR} md:rounded-none md:bg-transparent`;
const PAGOS = `${CONTENEDOR} shadow-elevacion-1`;

/** [CH-269] C-43: «Editar estructura» en el menú «En Presupuesto», como «En Cuentas» (E6-11). */
const ACCIONES = [
  {
    etiqueta: t.editarEstructura,
    detalle: t.editarEstructuraDetalle,
    ruta: '/presupuesto/estructura',
    icono: 'grid',
  },
] as const;
const PRINCIPAL = `inline-flex min-h-11 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion ${FOCO}`;

const OPCIONES_FILTRO: readonly { readonly valor?: FiltroDeUrl; readonly etiqueta: string }[] = [
  { etiqueta: t.filtros.todas },
  { valor: 'sobregiradas', etiqueta: t.filtros.sobregiradas },
  { valor: 'sin-fondos', etiqueta: t.filtros.sinFondos },
  { valor: 'cubiertas', etiqueta: t.filtros.cubiertas },
];

function Seccion({
  titulo,
  derecha,
  children,
  atributo,
  grande = false,
}: {
  readonly titulo: string;
  readonly derecha?: ReactNode;
  readonly children: ReactNode;
  readonly atributo?: string;
  /** Título de sección (Big Shoulders); sin él, el rótulo pequeño en `--texto-secundario` de 06 2.6. */
  readonly grande?: boolean;
}) {
  return (
    <section data-seccion={atributo ?? titulo} className="flex flex-col gap-2 md:gap-0">
      <h2 className="flex items-baseline justify-between gap-3 px-1 md:px-3 md:pt-3.5 md:pb-1">
        <span className={grande ? 'text-titulo-seccion' : 't-rotulo text-texto-secundario'}>
          {titulo}
        </span>
        {derecha === undefined ? null : <span className="text-cuerpo-pequeno">{derecha}</span>}
      </h2>
      {children}
    </section>
  );
}

export function PantallaPresupuesto({
  dto,
  filtro,
  sacar,
}: {
  readonly dto: PresupuestoDto;
  readonly filtro?: FiltroDeUrl;
  /** `sacarDisponible` (OP-11, FT-19): la pone el lector; sin ella no se ofrece la propuesta de un toque de AV-14. */
  readonly sacar?: AccionEscritura;
}) {
  const { periodo, periodoActivo } = dto;
  const cerrado = periodo.estado === 'cerrado';
  const futuro = periodo.estado === 'futuro';
  const activo = periodo.inicio === periodoActivo.inicio;
  const conPeriodo = (ruta: string, extra: Readonly<Record<string, string>> = {}): string => {
    const q = new URLSearchParams(extra);
    if (!activo) q.set('periodo', periodo.inicio);
    const s = q.toString();
    return s === '' ? ruta : `${ruta}?${s}`;
  };
  const hrefFiltro = (valor?: FiltroDeUrl): string =>
    conPeriodo('/presupuesto', valor === undefined ? {} : { filtro: valor });
  const gruposConFilas = dto.grupos.filter((g) => g.categorias.length > 0);
  const sinFilas = gruposConFilas.length === 0;
  // [CH-269] Sin filtro y sin filas no hay ninguna categoría, aunque haya pagos de tarjeta o archivadas con dinero.
  const sinCategorias = sinFilas && filtro === undefined;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-4 md:gap-7">
      <PublicarEncabezado encabezado={dto} />
      <PublicarAcciones titulo={t.enPresupuesto} acciones={ACCIONES} />
      {/* C12: las categorías entran desde el lado del período al que se fue */}
      <EntradaDePeriodo key={periodo.inicio} inicio={periodo.inicio} objetivo="categorias" />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <div className="contents md:grid md:grid-cols-2 md:items-start md:gap-6">
        <div className={O1}>
          <SelectorPeriodo
            periodo={periodo}
            periodoActivo={periodoActivo}
            {...(dto.navegacion.anterior === undefined
              ? {}
              : { anterior: dto.navegacion.anterior })}
            siguiente={dto.navegacion.siguiente}
            ruta="/presupuesto"
            parametros={filtro === undefined ? {} : { filtro }}
          />
        </div>
        {sinCategorias ? null : (
          <div className={O3}>
            <Pastillas
              etiqueta={t.filtros.etiqueta}
              reemplazar
              valor={filtro ?? ''}
              opciones={OPCIONES_FILTRO.map((o) => ({
                valor: o.valor ?? '',
                etiqueta: o.etiqueta,
                href: hrefFiltro(o.valor),
              }))}
            />
          </div>
        )}
      </div>

      <div className="contents md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] md:items-start md:gap-7">
        <div id="categorias" className={O4}>
          {sinCategorias ? (
            <Vacio
              titulo={t.sinCategorias.titulo}
              texto={t.sinCategorias.texto}
              accion={
                <span className="flex flex-wrap justify-center gap-2">
                  <EnlaceFinn href="/presupuesto/estructura/plantilla" className={PRINCIPAL}>
                    {t.sinCategorias.sugerida}
                  </EnlaceFinn>
                  <EnlaceFinn href="/presupuesto/estructura">{t.sinCategorias.aMano}</EnlaceFinn>
                </span>
              }
            />
          ) : sinFilas ? (
            <Vacio
              titulo={t.sinResultados.titulo}
              texto={t.sinResultados.texto}
              accion={
                <EnlaceFinn href={hrefFiltro()} replace className={BOTON}>
                  {t.sinResultados.quitar}
                </EnlaceFinn>
              }
            />
          ) : (
            <>
              <div
                aria-hidden="true"
                className={[ENCABEZADO_TABLA, cerrado ? 'pr-3' : 'pr-17'].join(' ')}
              >
                <span className="t-rotulo">{t.columnaCategoria}</span>
                {[glosario.asignado, glosario.gastado, glosario.disponible].map((c) => (
                  <span key={c} className="t-rotulo text-right">
                    {c}
                  </span>
                ))}
              </div>
              {gruposConFilas.map((g) => (
                <Seccion
                  key={g.grupo.id}
                  titulo={g.grupo.nombre}
                  atributo={g.grupo.id}
                  derecha={
                    <span className="font-semibold md:hidden">
                      <span className="sr-only">{t.grupoTotal(g.grupo.nombre)} </span>
                      <Monto centavos={g.totales.disponible} />
                    </span>
                  }
                >
                  <div className={GRUPO}>
                    {g.categorias.map((fila) => (
                      <FilaCategoria
                        key={fila.categoria.id}
                        fila={fila}
                        periodoCerrado={cerrado}
                        hrefDetalle={conPeriodo(`/presupuesto/categorias/${fila.categoria.id}`)}
                        {...(cerrado
                          ? {}
                          : {
                              hrefAsignar: conPeriodo(`/presupuesto/asignar/${fila.categoria.id}`),
                            })}
                      />
                    ))}
                  </div>
                </Seccion>
              ))}
            </>
          )}
        </div>

        <div className="contents md:flex md:flex-col md:gap-5">
          {cerrado ? null : (
            <div className={O2}>
              <ResumenListoParaAsignar
                variante="franja"
                lpa={dto.lpa}
                enCamino={dto.enCamino}
                lpaNegativo={dto.lpaNegativo}
                accion={{ href: hrefFiltro('sin-fondos'), texto: t.acciones.asignar }}
              />
              <EnlaceFinn href="/presupuesto/listo-para-asignar" className={COMO_SE_COMPONE}>
                {t.acciones.comoSeCompone}
              </EnlaceFinn>
              <nav aria-label={t.acciones.etiqueta} className="flex gap-2">
                <EnlaceFinn href={conPeriodo('/presupuesto/mover')} className={TONAL}>
                  {t.acciones.mover}
                </EnlaceFinn>
                {futuro ? null : (
                  <EnlaceFinn href={conPeriodo('/presupuesto/auto-asignar')} className={TONAL}>
                    {t.acciones.autoAsignar}
                  </EnlaceFinn>
                )}
              </nav>
            </div>
          )}

          {futuro || dto.pagosTarjeta.length === 0 ? null : (
            <div className={O5}>
              <Seccion titulo={t.pagosTarjeta} atributo="pagos-tarjeta">
                <div className={PAGOS}>
                  {dto.pagosTarjeta.map((fila) => (
                    <FilaPagoTarjeta
                      key={fila.categoria.id}
                      fila={fila}
                      hrefDetalle={conPeriodo(`/presupuesto/categorias/${fila.categoria.id}`)}
                    />
                  ))}
                </div>
              </Seccion>
            </div>
          )}

          {sinCategorias ? null : (
            <section data-seccion="totales" aria-label={t.totales} className={O6}>
              <dl className="contents">
                {(
                  [
                    [glosario.asignado, dto.totales.asignado],
                    [glosario.gastado, dto.totales.gastado],
                    [glosario.disponible, dto.totales.disponible],
                  ] as const
                ).map(([etiqueta, centavos]) => (
                  <div key={etiqueta} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="t-rotulo text-texto-secundario">{etiqueta}</dt>
                    <dd className="font-bold">
                      <MontoDestello centavos={centavos} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {dto.archivadasConDinero.length === 0 ? null : (
            <div className={O7}>
              <Seccion titulo={t.archivadas.titulo} atributo="archivadas-con-dinero" grande>
                <p className="text-cuerpo-pequeno text-texto-secundario">{t.archivadas.texto}</p>
                <ul className={CONTENEDOR}>
                  {dto.archivadasConDinero.map((fila) => (
                    <li
                      key={fila.categoria.id}
                      data-archivada={fila.categoria.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="font-semibold">{fila.categoria.nombre}</span>
                        <span className="text-cuerpo-pequeno text-texto-secundario">
                          {dominio.disponible} <Monto centavos={fila.disponible} />
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        {sacar === undefined || fila.disponible <= 0 ? null : (
                          <SacarDeUnToque
                            categoriaId={fila.categoria.id}
                            asignado={fila.asignadoEsperado}
                            disponible={fila.disponible}
                            accion={sacar}
                          />
                        )}
                        <EnlaceFinn
                          href={`/presupuesto/categorias/${fila.categoria.id}/sacar`}
                          className={ACCION}
                        >
                          {t.archivadas.sacar(fila.categoria.nombre)}
                        </EnlaceFinn>
                      </span>
                    </li>
                  ))}
                </ul>
              </Seccion>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
