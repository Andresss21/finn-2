// `/actividad/[transaccionId]` (FT-25; 05 §2.6; `pantallas/03-detalle-de-transaccion` del export): de dónde vino la transacción, sus
// partes con su cobertura, sus efectos, sus eventos, su conciliación y los cambios posteriores. Dibuja lo que trae el DTO: no calcula
// montos (PF-3). Lo que el DTO no trae (Disponible de cada categoría tras la compra, deuda de la tarjeta) queda fuera.
import type { DetalleTransaccionDto } from '@finn/aplicacion/consultas/detalle-transaccion';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Icono } from '../../../../componentes/base/icono';
import { Monto } from '../../../../componentes/dominio/monto';
import {
  PublicarAcciones,
  type AccionPantalla,
} from '../../../../componentes/marco/publicar-acciones';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { formatearFechaTexto, formatearInstante, formatearMonto } from '../../../../formato';
import { actividad as a } from '../../../../textos/actividad';
import { dominio } from '../../../../textos/dominio';
import { transaccion as t } from '../../../../textos/transaccion';

const ENLACE =
  'inline-flex min-h-11 items-center gap-1.5 self-start rounded-control font-semibold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const TARJETA_LISTA =
  'divide-y divide-borde-sutil rounded-contenedor bg-superficie shadow-elevacion-1';
const TARJETA_FILAS =
  'divide-y divide-borde-sutil rounded-contenedor bg-superficie px-4 py-1 shadow-elevacion-1';
const TARJETA_PARTES =
  'divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1';
const RESUMEN = 'text-cuerpo-pequeno text-texto-secundario';
const RESUMEN_SIN_CUBRIR = 'text-cuerpo-pequeno text-problema-texto';
// ACT-17: un glifo por estado (reloj, visto y conciliación), el mismo de la fila de Actividad.
const GLIFO_ESTADO_BANCARIO = {
  pendiente: 'clock',
  confirmada: 'check',
  conciliada: 'reconcile',
} as const;
const PASTILLA =
  'inline-flex min-h-8 items-center gap-1.5 rounded-pastilla bg-superficie-hundida px-3 text-cuerpo-pequeno font-medium';

type Linea = DetalleTransaccionDto['lineas'][number];

function Seccion({
  titulo,
  children,
}: {
  readonly titulo: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-2.5">
      <h2 className="flex min-h-11 items-center text-titulo-seccion">{titulo}</h2>
      {children}
    </section>
  );
}

function Fila({
  rotulo,
  children,
}: {
  readonly rotulo: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-cuerpo-pequeno text-texto-secundario">{rotulo}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function destinoDe(l: Linea): string {
  if ('categoria' in l.destino) return l.destino.categoria.nombre;
  return 'deudor' in l.destino
    ? t.deudorPorCobrar(l.destino.deudor.nombre)
    : t.devolucionDeOtraCompra;
}

/** El resumen de la parte con las cifras del DTO, sin sumar nada (PF-3). */
function resumenDe(l: Linea): { readonly texto: string; readonly sinCubrir: boolean } {
  const pc = l.porCobrar;
  const partes = [
    ...(l.reparto === undefined
      ? []
      : [
          `${t.cubierto} ${formatearMonto(l.reparto.cubierto)}`,
          ...(l.reparto.noCubierto > 0
            ? [`${t.noCubierto.toLowerCase()} ${formatearMonto(l.reparto.noCubierto)}`]
            : []),
        ]),
    ...(pc === undefined
      ? []
      : [
          `${t.restituido} ${formatearMonto(pc.restituido)}`,
          `${t.abierto.toLowerCase()} ${formatearMonto(pc.abierto)}`,
        ]),
  ];
  return { texto: partes.join(' · '), sinCubrir: (l.reparto?.noCubierto ?? 0) > 0 };
}

function Parte({
  linea,
  n,
  salida,
}: {
  readonly linea: Linea;
  readonly n: number;
  /** Una parte de un gasto es dinero que sale: se muestra con el menos (ACT-16). */
  readonly salida: boolean;
}) {
  const { texto, sinCubrir } = resumenDe(linea);
  return (
    <li className="flex flex-col gap-2 px-4 py-3" data-linea={linea.id}>
      <p className="flex items-baseline justify-between gap-3 font-semibold">
        <span>
          <span className="sr-only">{t.parteDe(n)} · </span>
          {destinoDe(linea)}
        </span>
        <Monto centavos={linea.monto} rol="cifra" presentacion={salida ? 'salida' : 'absoluto'} />
      </p>
      {linea.reparto === undefined ? null : (
        // El largo de cada tramo es el monto mismo (`flex-grow`): el navegador reparte, la interfaz no divide
        <div
          aria-hidden="true"
          className="flex h-1.5 gap-0.5 overflow-hidden rounded-pastilla bg-superficie-hundida"
        >
          <span
            className="rounded-pastilla bg-texto-secundario"
            style={{ flexGrow: linea.reparto.cubierto }}
          />
          <span
            className="bg-[image:var(--patron-sin-reservar)]"
            style={{ flexGrow: linea.reparto.noCubierto }}
            data-no-cubierto
          />
        </div>
      )}
      {texto === '' ? null : <p className={sinCubrir ? RESUMEN_SIN_CUBRIR : RESUMEN}>{texto}</p>}
      {linea.porCobrar !== undefined && linea.porCobrar.abierto > 0 && 'deudor' in linea.destino ? (
        <div className="flex gap-2" data-acciones-por-cobrar>
          <EnlaceFinn
            href={`/por-cobrar/cobrar?linea=${linea.id}&deudor=${linea.destino.deudor.id}`}
            className={ENLACE}
          >
            {t.cobrar}
          </EnlaceFinn>
          <EnlaceFinn href={`/por-cobrar/condonar/${linea.id}`} className={ENLACE}>
            {t.condonar}
          </EnlaceFinn>
        </div>
      ) : null}
    </li>
  );
}

function Eventos({
  lineas,
  transaccionId,
  sufijo,
}: {
  readonly lineas: readonly Linea[];
  readonly transaccionId: string;
  readonly sufijo: string;
}) {
  // Cada evento enlaza a eliminarlo (OP-34, FT-28): `?tipo-evento=` y `?evento=` (05 §2.6, R2)
  const eventos = lineas.flatMap((l) => [
    ...l.cobros.map((e) => [t.restituido, e.fecha, e.monto, 'cobro', e.transaccionId] as const),
    ...l.condonaciones.map((e) => [t.condonado, e.fecha, e.monto, 'condonacion', e.id] as const),
    ...l.devoluciones.map(
      (e) => [t.devuelto, e.fecha, e.monto, 'devolucion', e.transaccionId] as const,
    ),
  ]);
  if (eventos.length === 0) return null;
  return (
    <Seccion titulo={t.eventos}>
      <ul className={TARJETA_LISTA}>
        {eventos.map(([rotulo, fecha, monto, tipo, id]) => (
          <li key={id} className="flex items-center justify-between gap-3 px-4 py-1">
            <span className="flex flex-col">
              <span className="font-semibold">{rotulo}</span>
              <span className="text-cuerpo-pequeno text-texto-secundario">
                {formatearFechaTexto(fecha)}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Monto centavos={monto} presentacion="absoluto" />
              <EnlaceFinn
                href={`/actividad/${transaccionId}/eventos/eliminar?tipo-evento=${tipo}&evento=${id}${sufijo.replace('?', '&')}`}
                aria-label={t.eliminarEventoDe(rotulo, formatearFechaTexto(fecha))}
                className="inline-flex min-h-11 items-center px-2 font-semibold text-problema-texto focus-visible:outline-3 focus-visible:outline-foco"
              >
                {t.eliminar}
              </EnlaceFinn>
            </span>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function Origen({ dto }: { readonly dto: DetalleTransaccionDto }) {
  const o = dto.origenDetalle;
  if (o === undefined) return null;
  return (
    <Seccion titulo={t.origen}>
      <div className="flex flex-col gap-1.5 rounded-contenedor bg-superficie-hundida p-4">
        <p className="flex items-center gap-1.5 text-rotulo text-texto-secundario">
          <Icono nombre="sms" tamano={16} />
          {'sms' in o ? t.mensajeOriginal : t.origenes.programada}
        </p>
        {'sms' in o ? (
          <blockquote className="text-cuerpo-pequeno text-texto">{o.sms.texto}</blockquote>
        ) : (
          <p>
            {t.programadaDe(
              o.programada.programada.nombre,
              formatearFechaTexto(o.programada.fechaEsperada),
            )}
          </p>
        )}
      </div>
    </Seccion>
  );
}

export function PantallaDetalleTransaccion({
  dto,
  volver,
}: {
  readonly dto: DetalleTransaccionDto;
  /** La pantalla de la que se vino (`?volver=`, ya saneada); sin ella, la lista de Actividad. */
  readonly volver: string | undefined;
}) {
  const x = dto.transaccion;
  const origen = volver ?? '/actividad';
  const sufijo = volver === undefined ? '' : `?volver=${encodeURIComponent(volver)}`;
  const editar = `/actividad/${x.id}/editar${sufijo}`;
  // «Más acciones» (CH-115): cambiar el estado bancario (OP-30; la conciliada solo la fija OP-47) y Eliminar (OP-29) al final
  const conciliada = x.estadoBancario === 'conciliada';
  const acciones: readonly AccionPantalla[] = [
    ...(x.tipo === 'gasto'
      ? [{ etiqueta: t.registrarDevolucion, ruta: `/actividad/${x.id}/devolver${sufijo}` }]
      : []),
    {
      etiqueta: x.estadoBancario === 'pendiente' ? t.marcarConfirmada : t.marcarPendiente,
      ...(conciliada
        ? { motivo: t.estadoConciliadaNota }
        : { ruta: `/actividad/${x.id}/estado${sufijo}` }),
    },
    { etiqueta: t.eliminar, ruta: `/actividad/${x.id}/eliminar${sufijo}`, peligro: true },
  ];
  const cuentas = dto.efectos
    .map((e) => (e.cuenta.archivada === true ? t.archivada(e.cuenta.nombre) : e.cuenta.nombre))
    .join(' · ');
  const nota = x.nota === null || x.nota === '' ? undefined : x.nota;
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <PublicarAcciones titulo={x.comercio ?? dominio.sinComercio} acciones={acciones} />
      <header className="flex flex-col gap-2">
        <div className="-ml-2 flex items-center gap-1">
          <EnlaceFinn
            href={origen}
            className="hidden size-11 shrink-0 items-center justify-center rounded-pastilla focus-visible:outline-3 focus-visible:outline-foco md:inline-flex"
          >
            <Icono nombre="arrowL" tamano={22} etiqueta={t.volver} />
          </EnlaceFinn>
          <h1 className="min-w-0 flex-1 truncate text-titulo-pantalla">
            {x.comercio ?? dominio.sinComercio}
          </h1>
        </div>
        <span className="text-rotulo uppercase text-texto-secundario">
          {a.tipos[x.tipo]}
          {x.tipo === 'gasto' && dto.lineas.length > 1 ? ` · ${t.dividido(dto.lineas.length)}` : ''}
        </span>
        <Monto centavos={x.montoPresentado} rol="cifra-principal" />
        <span className="text-cuerpo-pequeno text-texto-secundario">
          {cuentas === '' ? '' : `${cuentas} · `}
          {formatearFechaTexto(x.fecha)}
        </span>
        <div className="flex flex-wrap gap-2">
          <span className={PASTILLA}>
            <Icono nombre={GLIFO_ESTADO_BANCARIO[x.estadoBancario]} tamano={16} />
            {dominio.estadoBancario[x.estadoBancario]}
          </span>
          <span className={PASTILLA}>
            <Icono nombre="sms" tamano={16} />
            {t.desde(t.origenes[x.origen])}
          </span>
        </div>
        <EnlaceFinn href={editar} className={ENLACE}>
          <Icono nombre="edit" tamano={18} />
          {t.editar}
        </EnlaceFinn>
      </header>
      <Seccion titulo={t.comercioYNota}>
        <dl className={TARJETA_FILAS}>
          <Fila rotulo={t.comercio}>{x.comercio ?? dominio.sinComercio}</Fila>
          {nota === undefined ? null : <Fila rotulo={t.nota}>{nota}</Fila>}
        </dl>
      </Seccion>
      <Seccion titulo={t.partes}>
        <ul className={TARJETA_PARTES}>
          {dto.lineas.map((l, i) => (
            <Parte key={l.id} linea={l} n={i + 1} salida={x.tipo === 'gasto'} />
          ))}
        </ul>
      </Seccion>
      <Seccion titulo={t.efectosHoy}>
        <ul className={TARJETA_FILAS}>
          {dto.efectos.map((e) => (
            <li key={e.cuenta.id} className="flex items-baseline justify-between gap-3 py-2">
              <span className="text-cuerpo-pequeno text-texto-secundario">
                {e.cuenta.archivada === true ? t.archivada(e.cuenta.nombre) : e.cuenta.nombre}
              </span>
              <Monto centavos={e.monto} />
            </li>
          ))}
        </ul>
      </Seccion>
      <Eventos lineas={dto.lineas} transaccionId={x.id} sufijo={sufijo} />
      <Origen dto={dto} />
      {dto.conciliacion === undefined ? null : (
        <AvisoEnLinea estado="informacion">
          {t.conciliacion(formatearFechaTexto(dto.conciliacion.fechaEstado))}
        </AvisoEnLinea>
      )}
      {dto.cambiosPosteriores.length === 0 ? null : (
        <Seccion titulo={t.cambiosPosteriores}>
          <ul data-cambios-posteriores className={TARJETA_LISTA}>
            {dto.cambiosPosteriores.map((c) => (
              <li key={c.registradoEn} className="px-4 py-3 text-cuerpo-pequeno">
                {t.cambioPosterior(
                  formatearInstante(c.registradoEn),
                  c.motivos.map((m) => t.motivos[m]).join(', '),
                )}
              </li>
            ))}
          </ul>
        </Seccion>
      )}
    </main>
  );
}
