// `/presupuesto` (FT-09; 06-identidad-visual §5): el período con su selector, Listo para asignar, filtros, grupos, pagos de
// tarjeta, totales y las archivadas con dinero. Dibuja lo que trae el DTO: no calcula montos (PF-3). Período cerrado: solo
// lectura, sin asignar, mover ni auto-asignar y sin franja de Listo para asignar (inv. 18, 05 §7.7). Período futuro: sin pagos
// de tarjeta (su "te falta reservar" solo existe en el activo, inv. 2).
import type { PresupuestoDto } from '@finn/aplicacion/consultas/presupuesto';
import type { ReactNode } from 'react';
import { Vacio } from '../../../componentes/base/vacio';
import { FilaCategoria } from '../../../componentes/dominio/fila-categoria';
import { FilaPagoTarjeta } from '../../../componentes/dominio/fila-pago';
import { ResumenListoParaAsignar } from '../../../componentes/dominio/billete';
import { Monto } from '../../../componentes/dominio/monto';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { SelectorPeriodo } from '../../../componentes/navegacion/selector-periodo';
import { dominio } from '../../../textos/dominio';
import { glosario } from '../../../textos/glosario';
import { presupuesto as t } from '../../../textos/presupuesto';

/** Los valores de `?filtro=` en la URL (BE-39); sin ninguno, "todas". */
export type FiltroDeUrl = 'sobregiradas' | 'sin-fondos' | 'cubiertas';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;
const ACCION = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;
const CONTENEDOR = 'flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie';
const PASTILLA = `inline-flex min-h-11 shrink-0 items-center rounded-pastilla px-4 text-cuerpo-pequeno ${FOCO}`;

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
}: {
  readonly titulo: string;
  readonly derecha?: ReactNode;
  readonly children: ReactNode;
  readonly atributo?: string;
}) {
  return (
    <section data-seccion={atributo ?? titulo} className="flex flex-col gap-2">
      <h2 className="flex items-baseline justify-between gap-3">
        <span className="text-titulo-seccion">{titulo}</span>
        {derecha === undefined ? null : <span className="text-cuerpo-pequeno">{derecha}</span>}
      </h2>
      {children}
    </section>
  );
}

export function PantallaPresupuesto({
  dto,
  filtro,
}: {
  readonly dto: PresupuestoDto;
  readonly filtro?: FiltroDeUrl;
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
  const sinCategorias =
    sinFilas &&
    filtro === undefined &&
    dto.pagosTarjeta.length === 0 &&
    dto.archivadasConDinero.length === 0;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-4 md:grid md:grid-cols-[1.7fr_1fr] md:gap-x-8">
      <PublicarEncabezado encabezado={dto} />
      <div className="flex flex-col gap-3 md:col-span-2">
        <h1 className="text-titulo-pantalla">{t.titulo}</h1>
        <SelectorPeriodo
          periodo={periodo}
          periodoActivo={periodoActivo}
          {...(dto.navegacion.anterior === undefined ? {} : { anterior: dto.navegacion.anterior })}
          siguiente={dto.navegacion.siguiente}
          ruta="/presupuesto"
          parametros={filtro === undefined ? {} : { filtro }}
        />
      </div>

      <div className="order-2 flex flex-col gap-5 md:order-none md:col-start-1 md:row-start-2">
        <nav aria-label={t.filtros.etiqueta} className="flex gap-2 overflow-x-auto p-1">
          {OPCIONES_FILTRO.map((o) => {
            const activa = o.valor === filtro;
            return (
              <EnlaceFinn
                key={o.etiqueta}
                href={hrefFiltro(o.valor)}
                replace
                {...(activa ? { 'aria-current': 'true' as const } : {})}
                className={[
                  PASTILLA,
                  activa
                    ? 'bg-accion font-bold text-texto-sobre-accion'
                    : 'bg-superficie-hundida text-texto',
                ].join(' ')}
              >
                {o.etiqueta}
              </EnlaceFinn>
            );
          })}
        </nav>
        {sinCategorias ? (
          <Vacio
            titulo={t.sinCategorias.titulo}
            texto={t.sinCategorias.texto}
            accion={
              <EnlaceFinn href="/presupuesto/estructura" className={BOTON}>
                {t.sinCategorias.accion}
              </EnlaceFinn>
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
          gruposConFilas.map((g) => (
            <Seccion
              key={g.grupo.id}
              titulo={g.grupo.nombre}
              atributo={g.grupo.id}
              derecha={
                <span className="font-semibold">
                  <span className="sr-only">{t.grupoTotal(g.grupo.nombre)} </span>
                  <Monto centavos={g.totales.disponible} />
                </span>
              }
            >
              <div className={CONTENEDOR}>
                {g.categorias.map((fila) => (
                  <FilaCategoria
                    key={fila.categoria.id}
                    fila={fila}
                    periodoCerrado={cerrado}
                    hrefDetalle={conPeriodo(`/presupuesto/categorias/${fila.categoria.id}`)}
                    {...(cerrado
                      ? {}
                      : { hrefAsignar: conPeriodo(`/presupuesto/asignar/${fila.categoria.id}`) })}
                  />
                ))}
              </div>
            </Seccion>
          ))
        )}
      </div>

      <div className="contents md:col-start-2 md:row-start-2 md:flex md:flex-col md:gap-5 md:self-start">
        <div className="order-1 flex flex-col gap-5 md:order-none">
          {cerrado ? null : (
            <>
              <ResumenListoParaAsignar
                variante="franja"
                lpa={dto.lpa}
                enCamino={dto.enCamino}
                lpaNegativo={dto.lpaNegativo}
                accion={{ href: '/presupuesto/listo-para-asignar', texto: t.acciones.verListo }}
              />
              <nav aria-label={t.acciones.etiqueta} className="flex flex-wrap gap-2">
                <EnlaceFinn href={conPeriodo('/presupuesto/mover')} className={BOTON}>
                  {t.acciones.mover}
                </EnlaceFinn>
                {futuro ? null : (
                  <EnlaceFinn href={conPeriodo('/presupuesto/auto-asignar')} className={BOTON}>
                    {t.acciones.autoAsignar}
                  </EnlaceFinn>
                )}
              </nav>
            </>
          )}
        </div>

        {futuro || dto.pagosTarjeta.length === 0 ? null : (
          <div className="order-3 md:order-none">
            <Seccion titulo={t.pagosTarjeta} atributo="pagos-tarjeta">
              <div className={CONTENEDOR}>
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
          <div className="order-3 md:order-none">
            <Seccion titulo={t.totales} atributo="totales">
              <dl className="grid grid-cols-3 gap-2 rounded-contenedor bg-superficie-hundida p-3.5">
                {(
                  [
                    [glosario.asignado, dto.totales.asignado],
                    [glosario.gastado, dto.totales.gastado],
                    [glosario.disponible, dto.totales.disponible],
                  ] as const
                ).map(([etiqueta, centavos]) => (
                  <div key={etiqueta} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="text-cuerpo-pequeno text-texto-secundario">{etiqueta}</dt>
                    <dd className="font-semibold">
                      <Monto centavos={centavos} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Seccion>
          </div>
        )}

        {dto.archivadasConDinero.length === 0 ? null : (
          <div className="order-3 md:order-none">
            <Seccion titulo={t.archivadas.titulo} atributo="archivadas-con-dinero">
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
                    <EnlaceFinn
                      href={`/presupuesto/categorias/${fila.categoria.id}/sacar`}
                      className={ACCION}
                    >
                      {t.archivadas.sacar(fila.categoria.nombre)}
                    </EnlaceFinn>
                  </li>
                ))}
              </ul>
            </Seccion>
          </div>
        )}
      </div>
    </main>
  );
}
