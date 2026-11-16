// `/presupuesto/categorias/[categoriaId]` (FT-14; 06-identidad-visual §6): de dónde sale el Disponible de una categoría. Dibuja
// lo que trae el DTO: no calcula montos (PF-3) ni períodos (05 §3.4). Los montos del sobregiro aparecen acá, al tocar la fila
// (PF-2). Período cerrado: sin acciones de asignación (inv. 18). Archivada: sin asignar ni mover hacia ella, con «Sacar» y
// «Desarchivar». La categoría de pago de tarjeta es de FT-29 y no cambia.
// [CH-294] C-52 «Un recorrido» (`docs/anexos/finn-detalle-de-categoria/`): una sola página en el orden en que se lee
// (encabezado con el selector, Disponible, cifras, avisos y meta, «¿En qué se fue?», consumos, programadas y reglas), con la
// barra de acciones fija al pie en el teléfono; en computadora, 380 px fijos a la izquierda y el recorrido a la derecha.
import type { DetalleCategoriaDto } from '@finn/aplicacion/consultas/detalle-categoria';
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { AvisoEnLinea } from '../../../../../componentes/base/aviso';
import { Icono } from '../../../../../componentes/base/icono';
import { IndicadorEstado } from '../../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../../componentes/dominio/monto';
import { ResumenMeta } from '../../../../../componentes/dominio/resumen-meta';
import type { AccionEscritura } from '../../../../../formularios/use-operacion';
import {
  PublicarAcciones,
  type AccionPantalla,
} from '../../../../../componentes/marco/publicar-acciones';
import { PublicarEncabezado } from '../../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../../componentes/navegacion/enlace-finn';
import { VolverEnTitulo } from '../../../../../componentes/navegacion/volver-en-titulo';
import { SelectorPeriodo } from '../../../../../componentes/navegacion/selector-periodo';
import { formatearFecha, formatearMonto, formatearPeriodoNumerico } from '../../../../../formato';
import { categoriaDetalle as t } from '../../../../../textos/categoria-detalle';
import { AnunciosDelDetalle } from './anuncios';
import { Recorrido } from './calendario';
import { Desarchivar } from './desarchivar';
import { SacarDeUnToque } from '../../sacar-un-toque';
import { Historial } from './historial';
import { ResultadoDelFlujo } from './resultado';
import {
  enlaceDeFlujo,
  type ResultadoPresupuesto,
} from '../../../../../flujos/presupuesto-asignar-categoria/resultado';
import { PantallaPagoTarjeta } from './pago';
import { MontoDestello } from '../../../../../componentes/dominio/monto-destello';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-bold text-enlace ${FOCO}`;
const PRINCIPAL = `inline-flex min-h-12 items-center justify-center gap-1.5 rounded-control bg-accion px-4 font-semibold text-texto-sobre-accion ${FOCO}`;
const TONAL = `inline-flex min-h-12 items-center justify-center rounded-control bg-accion-tonal px-4 font-semibold text-accion ${FOCO}`;
const CONTENEDOR = 'flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie';
// L13: clases literales. Teléfono: `main` en una columna y las dos columnas son `contents`, así que sus bloques siguen el orden
// de C-52 §2; computadora (`@[996px]`): 380 px fijos (`sticky`) más el resto, con 40 px de separación (§3).
const MAIN =
  'mx-auto flex max-w-5xl flex-col gap-5 px-5 py-4 @[996px]:grid @[996px]:grid-cols-[380px_minmax(0,1fr)] @[996px]:items-start @[996px]:gap-x-10';
const IZQUIERDA =
  'contents @[996px]:sticky @[996px]:top-0 @[996px]:flex @[996px]:flex-col @[996px]:gap-5';
// La derecha baja lo que ocupan «Más acciones» y la campana del marco, arriba a la derecha.
const DERECHA =
  'contents @[996px]:mt-14 @[996px]:flex @[996px]:min-w-0 @[996px]:flex-col @[996px]:gap-6';
const SOLO_COMPUTADORA = 'hidden flex-col gap-5 @[996px]:flex';
const SOLO_TELEFONO = 'flex flex-col gap-5 @[996px]:hidden';

function Seccion({
  titulo,
  atributo,
  children,
}: {
  readonly titulo: string;
  readonly atributo: string;
  readonly children: ReactNode;
}) {
  return (
    <section data-seccion={atributo} className="flex flex-col gap-2">
      <h2 className="text-titulo-seccion">{titulo}</h2>
      {children}
    </section>
  );
}

export function PantallaDetalleCategoria({
  dto,
  desarchivar,
  sacar,
  resultado,
  asignar,
  mover,
}: {
  readonly dto: DetalleCategoriaDto;
  /** E2-13 [CH-248]: lo que dejó Asignar o Mover (`?resultado=`, ya validado) y `asignarEnCategoria` para su «Deshacer». */
  readonly resultado?: ResultadoPresupuesto | undefined;
  readonly asignar?: AccionEscritura;
  /** [CH-254] `moverDinero` (OP-15) para el «Deshacer» de Mover. */
  readonly mover?: AccionEscritura;
  readonly desarchivar: AccionEscritura;
  /** `sacarDisponible` (OP-11): la pone el lector; sin ella no se ofrece la propuesta de AV-14. */
  readonly sacar?: AccionEscritura;
}) {
  const { categoria, periodoActivo } = dto;
  const conPeriodo = (ruta: string): string =>
    dto.periodo.inicio === periodoActivo.inicio ? ruta : `${ruta}?periodo=${dto.periodo.inicio}`;
  const raiz = `/presupuesto/categorias/${categoria.id}`;
  const enPeriodoActivo = dto.periodo.inicio === periodoActivo.inicio;
  const volver = `${raiz}${enPeriodoActivo ? '' : `?periodo=${dto.periodo.inicio}`}`;
  const flujo = (ruta: string): string =>
    enlaceDeFlujo(ruta, volver, enPeriodoActivo ? undefined : dto.periodo.inicio);
  const delFlujo =
    asignar === undefined || resultado === undefined ? undefined : (
      <ResultadoDelFlujo
        resultado={resultado}
        categoriaId={categoria.id}
        nombre={categoria.nombre}
        periodoInicio={dto.periodo.inicio}
        asignar={asignar}
        {...(mover === undefined ? {} : { mover })}
      />
    );
  if (dto.clase === 'pago') return <PantallaPagoTarjeta dto={dto} resultado={delFlujo} />;

  const { numeros, sobregiro, acciones, meta, periodo } = dto;
  const cerrado = periodo.estado === 'cerrado';
  const archivada = categoria.archivada === true;
  const tarjetas = [
    ...new Set(dto.consumos.filter((x) => x.medio === 'tarjeta').map((x) => x.cuenta.nombre)),
  ];
  const estadoDisponible =
    sobregiro === null
      ? undefined
      : sobregiro.tipo === 'tarjeta'
        ? 'deuda-sin-respaldo'
        : 'problema';
  const bloqueo = acciones.bloqueosArchivo[0];
  // «Más acciones» de la barra (P1-04, CH-115): los enlaces que antes iban sueltos en el contenido. Los motivos de bloqueo
  // los da el DTO (PF-3). C-52 §5: «Archivar» vive solo acá, con su motivo cuando no se puede (E4-29).
  const bloqueoArchivar =
    bloqueo === undefined && acciones.puedeArchivar ? undefined : (bloqueo ?? 'disponible');
  const menu: AccionPantalla[] = [
    {
      etiqueta: t.acciones.editar,
      ruta: `/presupuesto/estructura/categorias/${categoria.id}`,
      icono: 'edit',
    },
    {
      etiqueta: meta === null ? t.acciones.crearMeta : t.acciones.verMetas,
      ruta: meta === null ? `/metas/nueva?categoria=${categoria.id}` : `/metas/${meta.id}`,
      icono: 'target',
    },
    ...(acciones.puedeAsignar && !cerrado
      ? [
          {
            etiqueta: t.acciones.mover,
            ruta: flujo(`/presupuesto/mover?categoria-origen=${categoria.id}`),
            icono: 'swap',
          } as const,
        ]
      : []),
    // E4-9: en un período cerrado «Archivar» no se ofrece (D-5, CA-E4-15); «Fusionar con otra» sigue siendo válida.
    ...(archivada || cerrado
      ? []
      : [
          bloqueoArchivar === undefined
            ? ({ etiqueta: t.acciones.archivar, ruta: `${raiz}/archivar`, icono: 'inbox' } as const)
            : ({
                etiqueta: t.acciones.archivar,
                motivo: t.acciones.bloqueos[bloqueoArchivar],
                icono: 'inbox',
              } as const),
        ]),
    ...(archivada
      ? []
      : [{ etiqueta: t.acciones.fusionar, ruta: `${raiz}/fusionar`, icono: 'repeat' } as const]),
    acciones.puedeEliminar
      ? {
          etiqueta: t.acciones.eliminar,
          ruta: `/presupuesto/estructura/categorias/${categoria.id}`,
          icono: 'trash',
          peligro: true,
        }
      : {
          etiqueta: t.acciones.eliminar,
          motivo: t.acciones.bloqueos.eliminar,
          icono: 'trash',
          peligro: true,
        },
  ];
  const hrefAsignar = flujo(`/presupuesto/asignar/${categoria.id}`);
  const faltaMeta = meta !== null && meta.falta > 0 ? meta.falta : undefined;
  // D9: una categoría de ahorro (meta con progreso) que nunca tuvo gasto no muestra historial de gasto.
  const ahorroSinGasto =
    meta?.progresoBp !== undefined &&
    numeros.gastado === 0 &&
    dto.historial.every((h) => h.gastado === 0);
  // §5: sin barra en un período cerrado (el aviso lleva «Ir al período actual») ni en una archivada (Sacar y Desarchivar).
  const conBarra = acciones.puedeAsignar && !cerrado && !archivada;
  const numero = (rotulo: string, centavos: Centavos) => (
    <div key={rotulo} className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
      <dd className="whitespace-nowrap font-semibold">
        <Monto centavos={centavos} />
      </dd>
    </div>
  );
  // §2.8 y §3: programadas (nombre, «Próxima: dd/mm» y monto) y reglas; al final en el teléfono, en la columna fija en
  // computadora. Se dibujan en los dos lugares y cada uno se oculta en el otro ancho (`display: none`: el lector lee uno).
  const programadasYReglas = (clase: string) =>
    dto.programadas.length === 0 && dto.reglas.length === 0 ? null : (
      <div data-programadas-y-reglas className={clase}>
        {dto.programadas.length === 0 ? null : (
          <Seccion titulo={t.programadas.titulo} atributo="programadas">
            <ul className={CONTENEDOR}>
              {dto.programadas.map((p) => (
                <li
                  key={p.programada.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <EnlaceFinn href={`/programadas/${p.programada.id}`} className={ENLACE}>
                      {p.programada.nombre}
                    </EnlaceFinn>
                    {p.proxima === undefined ? null : (
                      <span className="px-2 text-cuerpo-pequeno text-texto-secundario">
                        {t.programadas.proxima(formatearFecha(p.proxima).slice(0, 5))}
                      </span>
                    )}
                  </span>
                  <Monto centavos={p.monto} />
                </li>
              ))}
            </ul>
          </Seccion>
        )}
        {dto.reglas.length === 0 ? null : (
          <Seccion titulo={t.reglas.titulo} atributo="reglas">
            <ul className="flex flex-wrap gap-2">
              {dto.reglas.map((r) => (
                <li
                  key={r.id}
                  className="rounded-pastilla bg-superficie-hundida px-3.5 py-2 text-cuerpo-pequeno font-semibold"
                >
                  {r.patron}
                </li>
              ))}
            </ul>
          </Seccion>
        )}
      </div>
    );

  return (
    <main data-detalle-categoria className={MAIN}>
      <PublicarEncabezado encabezado={dto} />
      <PublicarAcciones titulo={categoria.nombre} acciones={menu} />
      <AnunciosDelDetalle
        nombre={categoria.nombre}
        periodoInicio={periodo.inicio}
        fechas={formatearPeriodoNumerico(periodo)}
        cerrado={cerrado}
      >
        <div data-columna="izquierda" className={IZQUIERDA}>
          <header className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-rotulo text-texto-secundario">{dto.grupo.nombre}</p>
              {/* En el teléfono ← y ⋯ van en la barra del marco (§2.1); en computadora la flecha va junto al título (A5). */}
              <div className="flex items-center gap-1 md:-ml-2">
                <VolverEnTitulo href={conPeriodo('/presupuesto')} etiqueta={t.volver} />
                <h1 className="fz-titulo-detalle min-w-0 flex-1">{categoria.nombre}</h1>
              </div>
              {archivada ? <p className="text-etiqueta">{t.archivada}</p> : null}
            </div>
            <SelectorPeriodo
              periodo={periodo}
              periodoActivo={periodoActivo}
              {...(dto.navegacion.anterior === undefined
                ? {}
                : { anterior: dto.navegacion.anterior })}
              {...(dto.navegacion.siguiente === undefined
                ? {}
                : { siguiente: dto.navegacion.siguiente })}
              ruta={raiz}
              parametros={{}}
              sinIrAlActual
            />
            <div data-disponible className="flex flex-col gap-1">
              <p className="text-cuerpo-pequeno">{t.numeros.disponible}</p>
              <p>
                <MontoDestello
                  centavos={numeros.disponible}
                  rol="cifra-principal"
                  {...(estadoDisponible ? { estado: estadoDisponible } : {})}
                />
              </p>
              {sobregiro === null ? null : (
                <div className="flex flex-wrap gap-2">
                  {sobregiro.parteDebito === 0 ? null : (
                    <IndicadorEstado estado="problema" etiqueta={t.sobregiro.debito} />
                  )}
                  {sobregiro.parteTarjeta === 0 ? null : (
                    <IndicadorEstado estado="deuda-sin-respaldo" etiqueta={t.sobregiro.tarjeta} />
                  )}
                </div>
              )}
            </div>
          </header>

          <dl
            data-numeros
            className="grid grid-cols-3 gap-3 rounded-contenedor bg-superficie p-3.5"
          >
            {numero(t.numeros.asignado, numeros.asignado)}
            {numero(t.numeros.gastado, numeros.gastado)}
            {numero(t.numeros.arrastre, numeros.arrastre)}
            {numero(t.numeros.fondo, numeros.fondo)}
            {numero(t.numeros.entradas, numeros.entradas)}
            {sobregiro === null
              ? null
              : sobregiro.tipo === 'tarjeta'
                ? numero(t.sobregiro.conTarjeta, sobregiro.parteTarjeta)
                : numero(t.numeros.sobregiro, sobregiro.total)}
          </dl>

          {cerrado ? (
            // D-5 con C-51: el aviso lleva «Ir al período actual»; no hay barra de acciones (§5, §6).
            <AvisoEnLinea
              estado="informacion"
              titulo={t.periodoCerradoTitulo(formatearPeriodoNumerico(periodo))}
              accion={<EnlaceFinn href={raiz}>{t.irAlActual}</EnlaceFinn>}
            >
              {t.periodoCerrado}
            </AvisoEnLinea>
          ) : null}

          {sobregiro === null ? null : sobregiro.tipo === 'tarjeta' ? (
            // §6: deuda sin reservar (solo tarjeta), con `card` en `--deuda-sin-respaldo-texto`; explica, sin botón.
            <div data-sobregiro={sobregiro.tipo}>
              <AvisoEnLinea
                estado="deuda-sin-respaldo"
                icono="card"
                titulo={
                  <>
                    {t.sobregiro.tituloTarjeta(categoria.nombre)}{' '}
                    <Monto centavos={sobregiro.parteTarjeta} />
                  </>
                }
              >
                {tarjetas.map((x) => `${t.sobregiro.sumaALoQueFalta(x)}.`).join(' ')}
              </AvisoEnLinea>
            </div>
          ) : (
            // §6: débito o mixto, tono problema con el borde de C-51 y sin botón: «Cubrir» va en las acciones.
            <div data-sobregiro={sobregiro.tipo}>
              <AvisoEnLinea
                estado="problema"
                titulo={
                  <>
                    {t.sobregiro.tituloDebito} <Monto centavos={sobregiro.total} />
                  </>
                }
              >
                {t.sobregiro.conDebito} <Monto centavos={sobregiro.parteDebito} /> ·{' '}
                {t.sobregiro.conTarjetaMinuscula} <Monto centavos={sobregiro.parteTarjeta} />.{' '}
                {cerrado ? t.sobregiro.alCerrarCerrado : t.sobregiro.alCerrar}{' '}
                <Monto centavos={sobregiro.parteDebito} />.
              </AvisoEnLinea>
            </div>
          )}

          {archivada && numeros.disponible > 0 ? (
            <div data-aviso="av-14">
              <AvisoEnLinea
                estado="advertencia"
                titulo={t.archivadaConDinero(categoria.nombre, formatearMonto(numeros.disponible))}
              >
                <div className="flex flex-col gap-2">
                  <p>{t.archivadaTexto}</p>
                  {sacar === undefined ? null : (
                    <SacarDeUnToque
                      categoriaId={categoria.id}
                      asignado={numeros.asignado}
                      disponible={numeros.disponible}
                      accion={sacar}
                    />
                  )}
                  <EnlaceFinn href={`${raiz}/sacar`} className={TONAL}>
                    {t.elegirDestino}
                  </EnlaceFinn>
                </div>
              </AvisoEnLinea>
            </div>
          ) : null}

          {meta === null ? null : (
            <Seccion titulo={t.meta.titulo} atributo="meta">
              <ResumenMeta meta={meta} conseguido={numeros.disponible} />
              {archivada ? (
                <p data-meta-pausa className="text-cuerpo-pequeno text-texto-secundario">
                  {t.metaEnPausa(categoria.nombre)}
                </p>
              ) : null}
            </Seccion>
          )}

          {conBarra ? (
            // §5: fija al pie en el teléfono (`fz-barra-acciones`, globals.css); dos botones a lo ancho en la columna fija.
            <nav aria-label={t.acciones.etiqueta} className="fz-barra-acciones">
              <div className="grid grid-cols-2 gap-2">
                <EnlaceFinn href={hrefAsignar} className={PRINCIPAL}>
                  {sobregiro === null ? (
                    <>
                      <Icono nombre="plus" tamano={20} />
                      {t.acciones.asignar}
                      {/* A9: con meta, el principal lleva lo que falta del DTO; Asignar no preselecciona la opción (CH-221) */}
                      {faltaMeta === undefined ? null : (
                        <>
                          {' '}
                          <Monto centavos={faltaMeta} />
                        </>
                      )}
                    </>
                  ) : (
                    // CA-14.7: abre Asignar, que trae `rapida.cubrirSobregiro`; el enlace no lleva ningún monto.
                    <>
                      {t.sobregiro.cubrir} <Monto centavos={sobregiro.total} />
                    </>
                  )}
                </EnlaceFinn>
                <EnlaceFinn
                  href={flujo(`/presupuesto/mover?categoria-origen=${categoria.id}`)}
                  className={TONAL}
                >
                  {t.acciones.mover}
                </EnlaceFinn>
              </div>
            </nav>
          ) : null}
          {delFlujo}
          {archivada ? (
            <div className="flex flex-col gap-2">
              <Desarchivar categoriaId={categoria.id} accion={desarchivar} />
              <p className="text-cuerpo-pequeno text-texto-secundario">{t.desarchivarPrimero}</p>
            </div>
          ) : null}
          {programadasYReglas(SOLO_COMPUTADORA)}
        </div>

        <div data-columna="derecha" className={DERECHA}>
          <Recorrido
            consumos={dto.consumos}
            calendario={dto.calendario}
            periodo={periodo}
            hoy={dto.hoy}
            volver={conPeriodo(raiz)}
            periodosHistorial={dto.historial.length}
            historial={
              ahorroSinGasto ? null : (
                <Historial historial={dto.historial} resumen={dto.historialResumen} />
              )
            }
          />
          {dto.entradasDelPeriodo.length === 0 ? null : (
            <Seccion titulo={t.consumos.entradas} atributo="entradas">
              <ul className={CONTENEDOR}>
                {dto.entradasDelPeriodo.map((e) => (
                  <li
                    key={`${e.transaccionId}-${e.fecha}`}
                    className="flex items-center justify-between gap-3 px-3.5 py-3"
                  >
                    <EnlaceFinn
                      href={`/actividad/${e.transaccionId}?volver=${encodeURIComponent(conPeriodo(raiz))}`}
                      className={ENLACE}
                    >
                      {formatearFecha(e.fecha)}
                    </EnlaceFinn>
                    <Monto centavos={e.monto} />
                  </li>
                ))}
              </ul>
            </Seccion>
          )}
          {programadasYReglas(SOLO_TELEFONO)}
        </div>
      </AnunciosDelDetalle>
    </main>
  );
}
