// `/actividad/[transaccionId]` (FT-25; 05 §2.6): de dónde vino la transacción, sus efectos, su reparto por parte, su conciliación y
// los cambios posteriores. Dibuja lo que trae el DTO: no calcula montos (PF-3).
import type { DetalleTransaccionDto } from '@finn/aplicacion/consultas/detalle-transaccion';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Monto } from '../../../../componentes/dominio/monto';
import {
  PublicarAcciones,
  type AccionPantalla,
} from '../../../../componentes/marco/publicar-acciones';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { formatearFechaTexto, formatearInstante, formatearPeriodoCorto } from '../../../../formato';
import { actividad as a } from '../../../../textos/actividad';
import { dominio } from '../../../../textos/dominio';
import { transaccion as t } from '../../../../textos/transaccion';

const ENLACE =
  'inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

type Linea = DetalleTransaccionDto['lineas'][number];

function Dato({
  rotulo,
  children,
}: {
  readonly rotulo: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function destinoDe(l: Linea): string {
  if ('categoria' in l.destino) return l.destino.categoria.nombre;
  return 'deudor' in l.destino ? t.porCobrarA(l.destino.deudor.nombre) : t.devolucionDeOtraCompra;
}

function Parte({ linea, n }: { readonly linea: Linea; readonly n: number }) {
  const pc = linea.porCobrar;
  const eventos = [
    ...(pc === undefined
      ? []
      : ([
          [t.abierto, pc.abierto],
          [t.restituido, pc.restituido],
          [t.condonado, pc.condonado],
        ] as const)),
    ...(linea.reparto === undefined
      ? []
      : ([
          [t.cubierto, linea.reparto.cubierto],
          [t.noCubierto, linea.reparto.noCubierto],
        ] as const)),
    ...linea.devoluciones.map(
      (d) => [`${t.devuelto} · ${formatearFechaTexto(d.fecha)}`, d.monto] as const,
    ),
  ];
  return (
    <li
      className="flex flex-col gap-1 rounded-contenedor bg-superficie p-3.5"
      data-linea={linea.id}
    >
      <p className="flex items-baseline justify-between gap-3 font-semibold">
        <span>{`${t.parteDe(n)} · ${destinoDe(linea)}`}</span>
        <Monto centavos={linea.monto} rol="cifra" presentacion="absoluto" />
      </p>
      {eventos.map(([rotulo, monto]) => (
        <p key={rotulo} className="flex justify-between text-cuerpo-pequeno text-texto-secundario">
          <span>{rotulo}</span>
          <Monto centavos={monto} presentacion="absoluto" />
        </p>
      ))}
    </li>
  );
}

function Origen({ dto }: { readonly dto: DetalleTransaccionDto }) {
  const o = dto.origenDetalle;
  if (o === undefined) return null;
  return (
    <section aria-label={t.mensajeOriginal} className="flex flex-col gap-1">
      <h2 className="text-cuerpo-pequeno font-bold text-texto-secundario">
        {'sms' in o ? t.mensajeOriginal : t.origen}
      </h2>
      {'sms' in o ? (
        <blockquote className="rounded-xl bg-superficie-hundida p-3 text-cuerpo-pequeno text-texto">
          {o.sms.texto}
        </blockquote>
      ) : (
        <p>
          {t.programadaDe(
            o.programada.programada.nombre,
            formatearFechaTexto(o.programada.fechaEsperada),
          )}
        </p>
      )}
    </section>
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
    {
      etiqueta: x.estadoBancario === 'pendiente' ? t.marcarConfirmada : t.marcarPendiente,
      ...(conciliada
        ? { motivo: t.estadoConciliadaNota }
        : { ruta: `/actividad/${x.id}/estado${sufijo}` }),
    },
    { etiqueta: t.eliminar, ruta: `/actividad/${x.id}/eliminar${sufijo}`, peligro: true },
  ];
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <PublicarAcciones titulo={x.comercio ?? dominio.sinComercio} acciones={acciones} />
      <EnlaceFinn href={origen} className={ENLACE}>
        {t.volver}
      </EnlaceFinn>
      <header className="flex flex-col gap-2">
        <h1 className="text-titulo-pantalla">{x.comercio ?? dominio.sinComercio}</h1>
        <Monto centavos={x.montoPresentado} rol="cifra-principal" />
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <Dato rotulo={t.fecha}>{formatearFechaTexto(x.fecha)}</Dato>
          <Dato rotulo={t.tipo}>{a.tipos[x.tipo]}</Dato>
          <Dato rotulo={t.estado}>{dominio.estadoBancario[x.estadoBancario]}</Dato>
          <Dato rotulo={t.origen}>{t.origenes[x.origen]}</Dato>
          <Dato rotulo={t.periodo}>{formatearPeriodoCorto(x.periodo)}</Dato>
          {x.nota === null || x.nota === '' ? null : <Dato rotulo={t.nota}>{x.nota}</Dato>}
        </dl>
        <EnlaceFinn href={editar} className={ENLACE}>
          {t.editar}
        </EnlaceFinn>
      </header>
      <Origen dto={dto} />
      <section aria-label={t.cuentas} className="flex flex-col gap-1">
        <h2 className="text-titulo-seccion">{t.cuentas}</h2>
        <ul className="flex flex-col gap-1">
          {dto.efectos.map((e) => (
            <li key={e.cuenta.id} className="flex justify-between gap-3">
              <span>
                {e.cuenta.archivada === true ? t.archivada(e.cuenta.nombre) : e.cuenta.nombre}
              </span>
              <Monto centavos={e.monto} />
            </li>
          ))}
        </ul>
      </section>
      <section aria-label={t.partes} className="flex flex-col gap-2">
        <h2 className="text-titulo-seccion">{t.partes}</h2>
        <ul className="flex flex-col gap-2">
          {dto.lineas.map((l, i) => (
            <Parte key={l.id} linea={l} n={i + 1} />
          ))}
        </ul>
      </section>
      {dto.conciliacion === undefined ? null : (
        <AvisoEnLinea estado="informacion">
          {t.conciliacion(formatearFechaTexto(dto.conciliacion.fechaEstado))}
        </AvisoEnLinea>
      )}
      {dto.cambiosPosteriores.length === 0 ? null : (
        <section aria-label={t.cambiosPosteriores} className="flex flex-col gap-1">
          <h2 className="text-titulo-seccion">{t.cambiosPosteriores}</h2>
          <ul data-cambios-posteriores>
            {dto.cambiosPosteriores.map((c) => (
              <li key={c.registradoEn}>
                {t.cambioPosterior(
                  formatearInstante(c.registradoEn),
                  c.motivos.map((m) => t.motivos[m]).join(', '),
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
