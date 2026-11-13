// `/` (FT-08; 06-identidad-visual §4): el billete de Listo para asignar, «Necesita tu atención», los Primeros pasos (FT-04) y el
// patrimonio. Dibuja lo que trae `inicio()`: no calcula montos (PF-3). Los sobregiros se ven sin monto (PF-2) y el monto aparece al
// abrir cada uno. Sin cuentas, los Primeros pasos ocupan el lugar de la atención; con alguna, van encima (CF-18, 05 §2.3).
import type { InicioDto } from '@finn/aplicacion/consultas/inicio';
import type { ReactNode } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Icono } from '../../componentes/base/icono';
import { ResumenListoParaAsignar } from '../../componentes/dominio/billete';
import { Monto } from '../../componentes/dominio/monto';
import { TarjetaActivarNotificaciones } from '../../componentes/dominio/tarjeta-activar-notificaciones';
import { PublicarEncabezado } from '../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { CirculoEstado, FOCO, FilaAtencion, TextoDeFila } from './fila-atencion';
import { SacarDeUnToque } from './presupuesto/sacar-un-toque';
import { MarcarLeido } from './marcar-leido';
import { hrefDeOcurrencia, ProximosPagos, Recientes, TodoAlDia } from './inicio-secciones';
import { HallazgosRitmo } from './reportes/[tipo]/ritmo-hallazgos';
import { ReservaExcedente } from './reserva-excedente';
import { formatearFecha, formatearMonto } from '../../formato';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { dominio } from '../../textos/dominio';
import { glosario } from '../../textos/glosario';
import { inicio as t } from '../../textos/inicio';
import { inicioEntrega4 } from '../../textos/inicio-entrega-4';
import type { RegistrarSuscripcion } from '../../cliente/notificaciones';
import { PrimerosPasosDeInicio } from './primeros-pasos';

const CONTENEDOR =
  'flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1';
const BASE_ENLACE = `inline-flex min-h-11 items-center gap-1.5 text-etiqueta font-bold no-underline ${FOCO}`;
const ENLACE = `${BASE_ENLACE} text-enlace`;
const SUMARIO_BASE = `grid min-h-17 grid-cols-[36px_minmax(0,1fr)_18px] items-center gap-3 px-4 no-underline ${FOCO}`;
const SUMARIO = `${SUMARIO_BASE} cursor-pointer list-none [&::-webkit-details-marker]:hidden`;
const FILA_PATRIMONIO = `flex min-h-16 items-center justify-between gap-3 rounded-contenedor bg-superficie px-3.5 no-underline shadow-elevacion-1 ${FOCO}`;

/**
 * Sin `conTitulo` la sección queda vacía y oculta, pero montada: la salida «Deshacer» de la propuesta de AV-08 vive adentro y
 * debe seguir en su lugar cuando la revalidación hace desaparecer la fila (05 §4.14, regla 4).
 */
function Seccion({
  titulo,
  conTitulo = true,
  children,
}: {
  readonly titulo: string;
  readonly conTitulo?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-2.5 empty:hidden">
      {conTitulo ? (
        <h2 className="flex min-h-11 items-center text-titulo-seccion">{titulo}</h2>
      ) : null}
      {children}
    </section>
  );
}

function Sobregiro({ fila }: { readonly fila: InicioDto['atencion']['sobregiradas'][number] }) {
  const { categoria, sobregiro: s } = fila;
  const conDebito = s.tipo !== 'tarjeta';
  const conTarjeta = s.tipo !== 'debito';
  return (
    <details className="group" data-sobregiro={categoria.id}>
      <summary className={SUMARIO}>
        <CirculoEstado estado={conDebito ? 'problema' : 'deuda-sin-respaldo'} />
        <TextoDeFila
          etiquetas={[
            ...(conDebito ? [{ estado: 'problema' as const, texto: dominio.sobregiroDebito }] : []),
            ...(conTarjeta
              ? [{ estado: 'deuda-sin-respaldo' as const, texto: dominio.deudaSinReservar }]
              : []),
          ]}
        >
          {categoria.nombre}
        </TextoDeFila>
        <span className="group-open:rotate-90">
          <Icono nombre="chevR" tamano={18} />
        </span>
      </summary>
      <div className="flex flex-col gap-1.5 px-4 pb-3 pl-16 text-cuerpo-pequeno">
        <p>
          {t.sobregiro}{' '}
          <Monto
            centavos={s.total}
            rol="cifra"
            estado={conDebito ? 'problema' : 'deuda-sin-respaldo'}
          />
        </p>
        {conDebito ? <p>{t.reducira(formatearMonto(s.parteDebito))}</p> : null}
        {conTarjeta ? <p>{t.deudaTarjeta(formatearMonto(s.parteTarjeta))}</p> : null}
        <EnlaceFinn href={`/presupuesto/categorias/${categoria.id}`} className={ENLACE}>
          {t.verCategoria(categoria.nombre)}
        </EnlaceFinn>
      </div>
    </details>
  );
}

export function PantallaInicio({
  dto,
  marcarLeidas,
  asignar,
  sacar,
  haySinFondos = false,
  registrarSuscripcion,
}: {
  readonly dto: InicioDto;
  /** `marcarLeidas` (OPT-04): la pone el lector; sin ella no se ofrece «Marcar como leído». */
  readonly marcarLeidas?: AccionEscritura;
  /** `asignarEnCategoria` (OP-14): la pone el lector; sin ella no se ofrece la propuesta de AV-08. */
  readonly asignar?: AccionEscritura;
  /** `sacarDisponible` (OP-11): la pone el lector; sin ella no se ofrece la propuesta de AV-14. */
  readonly sacar?: AccionEscritura;
  /** Hay al menos una categoría sin fondos (`presupuesto` con ese filtro): a dónde lleva el botón del billete (P6-26). */
  readonly haySinFondos?: boolean;
  /** `registrarSuscripcion` (FT-06): la pone el lector; sin ella no se ofrece la tarjeta «Activá las notificaciones» (E5-15). */
  readonly registrarSuscripcion?: RegistrarSuscripcion;
}) {
  const { atencion: a, primerosPasos, patrimonio } = dto;
  const sinCuentas = primerosPasos !== null && !primerosPasos.cuenta;
  const filas =
    (dto.bandejaPorRevisar > 0 ? 1 : 0) +
    a.sobregiradas.length +
    a.faltaReservar.length +
    a.pagosExcedentes.length +
    a.archivadasConDisponible.length +
    a.metasVencidas.length +
    a.pagosAtrasados.length +
    a.pagosTarjetaProximos.length;
  const avisos = a.cambiosRetroactivos.length + a.hallazgosRitmo.length + a.reservaExcedente.length;
  const hayAtencion = filas + avisos > 0;
  // El botón del billete (CA-08.11, P6-26): con Listo para asignar positivo, a las categorías sin fondos si las hay; con
  // negativo, a Presupuesto. Con $0.00 no hay a dónde asignar.
  const botonLpa =
    dto.lpa === 0
      ? undefined
      : dto.lpa < 0
        ? {
            href: '/presupuesto',
            texto: t.quitar(formatearMonto(Math.abs(dto.lpa) as typeof dto.lpa)),
          }
        : {
            href: haySinFondos ? '/presupuesto?filtro=sin-fondos' : '/presupuesto',
            texto: t.asignar(formatearMonto(dto.lpa)),
          };
  return (
    <main className="mx-auto flex max-w-270 flex-col gap-7 px-5 py-4 md:[--ancho-pantalla:73.5rem] md:@[996px]:grid md:@[996px]:grid-cols-2 md:@[996px]:items-start md:@[996px]:gap-x-9">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla md:@[996px]:col-span-2">{t.titulo}</h1>
      <div className="flex flex-col gap-7 md:gap-8">
        {sinCuentas ? null : (
          <div className="flex flex-col gap-1">
            <ResumenListoParaAsignar
              variante="billete"
              lpa={dto.lpa}
              enCamino={dto.enCamino}
              lpaNegativo={dto.lpaNegativo}
              {...(botonLpa === undefined ? {} : { accion: botonLpa })}
            />
            <div className="flex justify-end">
              <EnlaceFinn href="/presupuesto/listo-para-asignar" className={ENLACE}>
                {t.verDetalle}
                <span className="text-accion">
                  <Icono nombre="chevR" tamano={16} />
                </span>
              </EnlaceFinn>
            </div>
          </div>
        )}
        {primerosPasos === null ? null : <PrimerosPasosDeInicio pasos={primerosPasos} />}
        {sinCuentas ? (
          <p className="flex items-start gap-2 text-cuerpo-pequeno text-texto-secundario">
            <span className="flex-none pt-0.5 text-informacion-texto">
              <Icono nombre="informacion" tamano={16} />
            </span>
            {inicioEntrega4.notaSinCuentas}
          </p>
        ) : null}
        {registrarSuscripcion === undefined ? null : (
          <TarjetaActivarNotificaciones registrar={registrarSuscripcion} />
        )}
        {sinCuentas ? null : (
          <Seccion titulo={t.atencion} conTitulo={hayAtencion}>
            {a.cambiosRetroactivos.map((n) => (
              <div key={n.id} data-cambio-retroactivo={n.id}>
                <AvisoEnLinea
                  estado="informacion"
                  titulo={n.titulo}
                  accion={
                    marcarLeidas === undefined ? undefined : (
                      <MarcarLeido id={n.id} accion={marcarLeidas} />
                    )
                  }
                >
                  {n.cuerpo}
                </AvisoEnLinea>
              </div>
            ))}
            {/* El mismo componente que /reportes/ritmo (CH-215): «Asignar» de un toque con «Deshacer»; sin `asignar`, enlace. */}
            <HallazgosRitmo
              hallazgos={a.hallazgosRitmo}
              periodoInicio={dto.periodoActivo.inicio}
              {...(asignar === undefined ? {} : { asignar })}
            />
            {asignar === undefined ? null : (
              <ReservaExcedente filas={a.reservaExcedente} accion={asignar} />
            )}
            {filas === 0 ? null : (
              <div className={CONTENEDOR}>
                {dto.bandejaPorRevisar === 0 ? null : (
                  <FilaAtencion
                    href="/bandeja"
                    estado="informacion"
                    etiqueta={t.bandeja(dto.bandejaPorRevisar)}
                  >
                    {glosario.bandeja}
                  </FilaAtencion>
                )}
                {a.sobregiradas.map((fila) => (
                  <Sobregiro key={fila.categoria.id} fila={fila} />
                ))}
                {a.faltaReservar.map((x) => (
                  <FilaAtencion
                    key={x.tarjeta.id}
                    href={`/cuentas/${x.tarjeta.id}`}
                    estado="deuda-sin-respaldo"
                    etiqueta={glosario.teFaltaReservar}
                  >
                    {x.tarjeta.nombre}
                  </FilaAtencion>
                ))}
                {a.pagosExcedentes.map((x) => (
                  <FilaAtencion
                    key={x.tarjeta.id}
                    href={`/cuentas/${x.tarjeta.id}`}
                    estado="problema"
                    etiqueta={glosario.pagasteDeMas}
                  >
                    {x.tarjeta.nombre}
                  </FilaAtencion>
                ))}
                {a.archivadasConDisponible.map((x) => (
                  <div
                    key={x.categoria.id}
                    data-archivada={x.categoria.id}
                    className="flex flex-col gap-2 px-4 py-3"
                  >
                    <span className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3">
                      <CirculoEstado estado="advertencia" />
                      <TextoDeFila
                        etiquetas={[
                          {
                            estado: 'advertencia',
                            texto: t.archivadaConDinero(x.categoria.nombre),
                          },
                        ]}
                      >
                        {x.categoria.nombre}
                      </TextoDeFila>
                    </span>
                    <span className="pl-12 text-cuerpo-pequeno">
                      {t.disponible} <Monto centavos={x.disponible} rol="cifra" />
                    </span>
                    {sacar === undefined || x.disponible <= 0 ? null : (
                      <SacarDeUnToque
                        categoriaId={x.categoria.id}
                        asignado={x.asignado}
                        disponible={x.disponible}
                        accion={sacar}
                      />
                    )}
                    <EnlaceFinn
                      href={`/presupuesto/categorias/${x.categoria.id}/sacar`}
                      className={ENLACE}
                    >
                      {t.sacarElDinero}
                    </EnlaceFinn>
                  </div>
                ))}
                {a.metasVencidas.map((x) => (
                  <FilaAtencion
                    key={x.categoria.id}
                    href={`/presupuesto/categorias/${x.categoria.id}`}
                    estado="advertencia"
                    etiqueta={dominio.metaVencida}
                  >
                    {x.categoria.nombre}
                  </FilaAtencion>
                ))}
                {a.pagosAtrasados.map((o) => (
                  <FilaAtencion
                    key={`${o.programada.id}-${o.fechaEsperada}`}
                    href={hrefDeOcurrencia(o)}
                    estado="advertencia"
                    etiqueta={t.atrasado}
                    datos={{ 'data-pago-atrasado': o.programada.id }}
                  >
                    {o.programada.nombre}
                  </FilaAtencion>
                ))}
                {a.pagosTarjetaProximos.map((x) => (
                  <FilaAtencion
                    key={x.tarjeta.id}
                    href={`/cuentas/${x.tarjeta.id}`}
                    estado="advertencia"
                    etiqueta={t.pagoDeTarjeta(formatearFecha(x.fechaPago).slice(0, 5))}
                    datos={{ 'data-pago-tarjeta': x.tarjeta.id }}
                  >
                    {x.tarjeta.nombre}
                  </FilaAtencion>
                ))}
              </div>
            )}
          </Seccion>
        )}
        {sinCuentas || hayAtencion ? null : <TodoAlDia />}
      </div>
      {sinCuentas ? null : (
        <div className="flex flex-col gap-7 md:gap-8">
          <ProximosPagos pagos={a.proximosPagos} />
          <Recientes filas={dto.recientes} />
          <EnlaceFinn href="/cuentas" className={FILA_PATRIMONIO}>
            <span className="flex min-w-0 flex-col gap-px">
              <span className="font-semibold text-texto">{t.patrimonio.titulo}</span>
              <span className="text-cuerpo-pequeno text-texto-secundario tabular-nums [&_[data-centavos]]:text-cuerpo-pequeno">
                {t.patrimonio.activos} <Monto centavos={patrimonio.activos} /> ·{' '}
                {t.patrimonio.deudas} <Monto centavos={patrimonio.deudas} />
              </span>
            </span>
            <span className="flex flex-none items-center gap-2.5">
              <span data-patrimonio>
                <Monto centavos={patrimonio.neto} rol="cifra" />
              </span>
              <Icono nombre="chevR" tamano={18} />
            </span>
          </EnlaceFinn>
        </div>
      )}
    </main>
  );
}
