// `/` (FT-08; 06-identidad-visual §4): el billete de Listo para asignar, «Necesita tu atención», los Primeros pasos (FT-04) y el
// patrimonio. Dibuja lo que trae `inicio()`: no calcula montos (PF-3). Los sobregiros se ven sin monto (PF-2) y el monto aparece al
// abrir cada uno. Sin cuentas, los Primeros pasos ocupan el lugar de la atención; con alguna, van encima (CF-18, 05 §2.3).
import type { InicioDto } from '@finn/aplicacion/consultas/inicio';
import type { ReactNode } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Icono } from '../../componentes/base/icono';
import { ResumenListoParaAsignar } from '../../componentes/dominio/billete';
import { IndicadorEstado, type EstadoFinanciero } from '../../componentes/dominio/indicador-estado';
import { Monto } from '../../componentes/dominio/monto';
import { PublicarEncabezado } from '../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { MarcarLeido } from './marcar-leido';
import { formatearFecha, formatearMonto } from '../../formato';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { dominio } from '../../textos/dominio';
import { glosario } from '../../textos/glosario';
import { inicio as t } from '../../textos/inicio';
import { PrimerosPasosDeInicio } from './primeros-pasos';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const CONTENEDOR = 'flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie';
const FILA = `flex min-h-17 items-center gap-3 px-4 py-3 ${FOCO}`;
const FILA_EN_CONTENEDOR = `${CONTENEDOR} flex min-h-17 items-center gap-3 px-4 py-3 ${FOCO}`;
const RESUMEN = `flex min-h-11 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden ${FOCO}`;
const ENLACE = `inline-flex min-h-11 items-center font-semibold text-enlace underline ${FOCO}`;
const ACCION = `inline-flex min-h-11 items-center font-semibold underline ${FOCO}`;

function Seccion({ titulo, children }: { readonly titulo: string; readonly children: ReactNode }) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-2">
      <h2 className="text-titulo-seccion">{titulo}</h2>
      {children}
    </section>
  );
}

/** Una fila de atención que enlaza a donde se resuelve. */
function FilaAtencion({
  href,
  estado,
  etiqueta,
  children,
}: {
  readonly href: string;
  readonly estado: EstadoFinanciero;
  readonly etiqueta: string;
  readonly children: ReactNode;
}) {
  return (
    <EnlaceFinn href={href} className={FILA}>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="font-semibold text-texto">{children}</span>
        <IndicadorEstado estado={estado} etiqueta={etiqueta} />
      </span>
      <Icono nombre="chevR" />
    </EnlaceFinn>
  );
}

function Sobregiro({ fila }: { readonly fila: InicioDto['atencion']['sobregiradas'][number] }) {
  const { categoria, sobregiro: s } = fila;
  const conDebito = s.tipo !== 'tarjeta';
  const conTarjeta = s.tipo !== 'debito';
  return (
    <details className="group px-4 py-3" data-sobregiro={categoria.id}>
      <summary className={RESUMEN}>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="font-semibold text-texto">{categoria.nombre}</span>
          <span className="flex flex-wrap gap-2">
            {conDebito ? (
              <IndicadorEstado estado="problema" etiqueta={dominio.sobregiroDebito} />
            ) : null}
            {conTarjeta ? (
              <IndicadorEstado estado="deuda-sin-respaldo" etiqueta={dominio.deudaSinReservar} />
            ) : null}
          </span>
        </span>
        <span className="group-open:rotate-90">
          <Icono nombre="chevR" />
        </span>
      </summary>
      <div className="flex flex-col gap-1.5 pt-2 text-cuerpo-pequeno">
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

/** El texto y la acción del hallazgo salen del catálogo con los campos del selector (04 §7.10): ningún monto se calcula acá. */
type HallazgoDeRitmo = InicioDto['atencion']['hallazgosRitmo'][number];

function Hallazgo({ h }: { readonly h: HallazgoDeRitmo }) {
  const exceso = formatearMonto(h.exceso);
  const fin = formatearFecha(h.fin).slice(0, 5);
  const texto =
    h.sobregiroActual === 0
      ? t.hallazgo.camino(exceso, h.categoria.nombre, fin)
      : t.hallazgo.ya(formatearMonto(h.sobregiroActual), h.categoria.nombre, exceso, fin);
  const { accion } = h;
  const [href, etiqueta] =
    accion.tipo === 'mover'
      ? (['/presupuesto/mover', t.hallazgo.mover(exceso, accion.origen.nombre)] as const)
      : accion.tipo === 'asignar'
        ? ([`/presupuesto/asignar/${h.categoria.id}`, t.hallazgo.asignar(exceso)] as const)
        : ([
            `/presupuesto/categorias/${accion.categoriaId}`,
            t.hallazgo.revisar(h.categoria.nombre),
          ] as const);
  return (
    <div data-hallazgo={h.clave}>
      <AvisoEnLinea
        estado={h.estado}
        accion={
          <EnlaceFinn href={href} className={ACCION}>
            {etiqueta}
          </EnlaceFinn>
        }
      >
        {texto}
      </AvisoEnLinea>
    </div>
  );
}

export function PantallaInicio({
  dto,
  marcarLeidas,
}: {
  readonly dto: InicioDto;
  /** `marcarLeidas` (OPT-04): la pone el lector; sin ella no se ofrece «Marcar como leído». */
  readonly marcarLeidas?: AccionEscritura;
}) {
  const { atencion: a, primerosPasos, patrimonio } = dto;
  const sinCuentas = primerosPasos !== null && !primerosPasos.cuenta;
  const dias = dto.periodoActivo.diasRestantes;
  const filas =
    (dto.bandejaPorRevisar > 0 ? 1 : 0) +
    a.sobregiradas.length +
    a.faltaReservar.length +
    a.pagosExcedentes.length +
    a.metasVencidas.length;
  const hayAtencion = filas + a.cambiosRetroactivos.length + a.hallazgosRitmo.length > 0;

  return (
    <main className="mx-auto flex max-w-270 flex-col gap-7 px-5 py-4 md:grid md:grid-cols-2 md:items-start md:gap-x-10">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="sr-only">{t.titulo}</h1>
      <div className="flex flex-col gap-7">
        {sinCuentas ? null : (
          <div className="flex flex-col gap-2">
            <ResumenListoParaAsignar
              variante="billete"
              lpa={dto.lpa}
              enCamino={dto.enCamino}
              lpaNegativo={dto.lpaNegativo}
            />
            <p className="text-cuerpo-pequeno text-texto-secundario">
              {dias === undefined ? null : t.quedan(dias)}
            </p>
            <EnlaceFinn href="/presupuesto/listo-para-asignar" className={ENLACE}>
              {t.verDetalle}
            </EnlaceFinn>
          </div>
        )}
        {primerosPasos === null ? null : <PrimerosPasosDeInicio pasos={primerosPasos} />}
        {sinCuentas || !hayAtencion ? null : (
          <Seccion titulo={t.atencion}>
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
            {a.hallazgosRitmo.map((h) => (
              <Hallazgo key={h.clave} h={h} />
            ))}
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
                    {x.tarjeta.nombre} <Monto centavos={x.monto} rol="cifra" />
                  </FilaAtencion>
                ))}
                {a.pagosExcedentes.map((x) => (
                  <FilaAtencion
                    key={x.tarjeta.id}
                    href={`/cuentas/${x.tarjeta.id}`}
                    estado="problema"
                    etiqueta={glosario.pagasteDeMas}
                  >
                    {x.tarjeta.nombre} <Monto centavos={x.monto} rol="cifra" />
                  </FilaAtencion>
                ))}
                {a.metasVencidas.map((x) => (
                  <FilaAtencion
                    key={x.categoria.id}
                    href={`/presupuesto/categorias/${x.categoria.id}`}
                    estado="advertencia"
                    etiqueta={dominio.metaVencida}
                  >
                    {x.categoria.nombre} <Monto centavos={x.falta} rol="cifra" />
                  </FilaAtencion>
                ))}
              </div>
            )}
          </Seccion>
        )}
      </div>
      {sinCuentas ? null : (
        <div className="flex flex-col gap-7">
          <EnlaceFinn href="/cuentas" className={FILA_EN_CONTENEDOR}>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-rotulo">{t.patrimonio.titulo}</span>
              <span data-patrimonio className="font-semibold">
                <Monto centavos={patrimonio.neto} rol="cifra" />
              </span>
              <span className="text-cuerpo-pequeno text-texto-secundario">
                {t.patrimonio.activos} <Monto centavos={patrimonio.activos} /> ·{' '}
                {t.patrimonio.deudas} <Monto centavos={patrimonio.deudas} />
              </span>
            </span>
            <Icono nombre="chevR" />
          </EnlaceFinn>
        </div>
      )}
    </main>
  );
}
