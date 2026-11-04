// Contenido del centro de notificaciones (FT-69; 05 §2.9, §3.5; 06-identidad-visual 2.17): el mismo en la página completa y en el panel
// que cae desde la campana (CF-23). Dibuja lo que trae el DTO de `notificaciones()`: no calcula ni ordena (PF-3). Tocar una
// notificación navega a su destino con `?notificacion=<id>` (FE-32); sin destino válido se queda en el centro, y una cuyo destino
// ya no existe se muestra sin enlace.
import type {
  NotificacionCentroDto,
  NotificacionesDto,
} from '@finn/aplicacion/consultas/notificaciones';
import { Icono, type NombreIcono } from '../../../componentes/base/icono';
import { Vacio } from '../../../componentes/base/vacio';
import { RUTA_CENTRO, rutaDeDestino } from '../../../componentes/navegacion/destinos';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { formatearInstante } from '../../../formato';
import type { AccionEscritura } from '../../../formularios/use-operacion';
import { navegacion } from '../../../textos/navegacion';
import { notificaciones as textos } from '../../../textos/notificaciones';
import { MarcarTodo } from './marcar-todo';

const t = textos.centro;

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-enlace ${FOCO}`;
const FILA = 'grid grid-cols-[2.5rem_minmax(0,1fr)_0.625rem] gap-3 px-3.5 py-3';
const FILA_ENLACE =
  'grid grid-cols-[2.5rem_minmax(0,1fr)_0.625rem] gap-3 rounded-contenedor px-3.5 py-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

// Ícono por motivo (04 §11.1); un motivo nuevo cae en la campana.
const ICONOS: Readonly<Record<string, NombreIcono>> = {
  sms_nuevo: 'sms',
  sms_coincidencia: 'sms',
  sms_posible_duplicado: 'sms',
  sms_no_reconocido: 'sms',
  sms_error: 'sms',
  registro_automatico: 'repeat',
  registro_automatico_fallido: 'warn',
  ocurrencia_en_periodo_cerrado: 'warn',
  cierre_periodo: 'lock',
  meta_vencida: 'target',
  pago_tarjeta_proximo: 'card',
  cuota_proxima: 'cal',
  respaldo_atrasado: 'gear',
  restauracion_atrasada: 'gear',
  deriva_catalogo: 'gear',
  tarea_fallida: 'gear',
  carga_incremental: 'gear',
  cambio_retroactivo: 'undo',
};

/** La URL del centro con el filtro y el cursor. */
function hrefDe(soloNoLeidas: boolean, cursor?: string): string {
  const q = new URLSearchParams();
  if (soloNoLeidas) q.set('no-leidas', '1');
  if (cursor !== undefined) q.set('cursor', cursor);
  const s = q.toString();
  return s === '' ? RUTA_CENTRO : `${RUTA_CENTRO}?${s}`;
}

function Cuerpo({ n }: { readonly n: NotificacionCentroDto }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={[
          'flex size-10 items-center justify-center rounded-xl',
          n.leida ? 'bg-superficie-hundida text-texto-secundario' : 'bg-accion-tonal text-accion',
        ].join(' ')}
      >
        <Icono nombre={ICONOS[n.motivo] ?? 'bell'} tamano={20} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex justify-between gap-2">
          <span className={n.leida ? 'font-semibold text-texto' : 'font-bold text-texto'}>
            {n.titulo}
          </span>
          <time
            dateTime={n.creadaEn}
            className="text-cuerpo-pequeno whitespace-nowrap text-texto-terciario"
          >
            {formatearInstante(n.creadaEn)}
          </time>
        </span>
        <span className="text-cuerpo-pequeno text-texto-secundario">{n.cuerpo}</span>
        {n.existeDestino ? null : (
          <span data-sin-destino className="text-cuerpo-pequeno text-texto-terciario">
            {t.yaNoExiste}
          </span>
        )}
      </span>
      {n.leida ? (
        <span />
      ) : (
        <span className="mt-1.5 flex flex-col items-center">
          <span aria-hidden="true" className="size-2.25 rounded-pastilla bg-accion" />
          <span className="sr-only">{t.sinLeerMarca}</span>
        </span>
      )}
    </>
  );
}

function Fila({ n }: { readonly n: NotificacionCentroDto }) {
  const atributos = { 'data-notificacion': n.id, 'data-leida': n.leida ? 'si' : 'no' };
  if (!n.existeDestino)
    return (
      <li {...atributos} className={FILA}>
        <Cuerpo n={n} />
      </li>
    );
  return (
    <li {...atributos}>
      <EnlaceFinn href={rutaDeDestino(n.destino, n.id)} className={FILA_ENLACE}>
        <Cuerpo n={n} />
      </EnlaceFinn>
    </li>
  );
}

function Grupo({
  titulo,
  filas,
}: {
  readonly titulo?: string;
  readonly filas: readonly NotificacionCentroDto[];
}) {
  if (filas.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      {titulo === undefined ? null : (
        <h2 className="text-rotulo px-1 text-texto-terciario">{titulo}</h2>
      )}
      <ul className="flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie shadow-elevacion-1">
        {filas.map((n) => (
          <Fila key={n.id} n={n} />
        ))}
      </ul>
    </section>
  );
}

export function ContenidoNotificaciones({
  dto,
  soloNoLeidas,
  cursor,
  marcarLeidas,
}: {
  readonly dto: NotificacionesDto;
  readonly soloNoLeidas: boolean;
  readonly cursor?: string;
  /** `marcarLeidas` (OPT-04): la pone el lector, así el contenido se prueba sin servidor. */
  readonly marcarLeidas: AccionEscritura;
}) {
  const sinLeer = dto.notificacionesNoLeidas;
  const lista = dto.notificaciones;
  const pestana = (activa: boolean) =>
    [
      'inline-flex min-h-11 min-w-11 items-center justify-center rounded-pastilla px-4 text-base',
      FOCO,
      activa ? 'bg-superficie font-bold text-texto shadow-elevacion-1' : 'text-texto-secundario',
    ].join(' ');
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label={t.filtro}
          className="inline-flex rounded-pastilla bg-superficie-hundida p-1"
        >
          <EnlaceFinn
            href={hrefDe(false)}
            replace
            aria-current={soloNoLeidas ? undefined : 'true'}
            className={pestana(!soloNoLeidas)}
          >
            {t.todas}
          </EnlaceFinn>
          <EnlaceFinn
            href={hrefDe(true)}
            replace
            aria-current={soloNoLeidas ? 'true' : undefined}
            className={pestana(soloNoLeidas)}
          >
            {t.sinLeer(sinLeer)}
          </EnlaceFinn>
        </nav>
        {sinLeer > 0 ? (
          <MarcarTodo accion={marcarLeidas} />
        ) : lista.length > 0 ? (
          <span
            role="status"
            className="text-cuerpo-pequeno inline-flex min-h-11 items-center gap-1.5 text-positivo-texto"
          >
            <Icono nombre="check" tamano={18} />
            {t.todoLeido}
          </span>
        ) : null}
      </div>
      {lista.length === 0 ? (
        soloNoLeidas ? (
          <Vacio titulo={t.sinLeerVacioTitulo} texto={t.sinLeerVacioTexto} icono="check" />
        ) : (
          <Vacio titulo={t.vacioTitulo} texto={t.vacioTexto} icono="bell" tono="neutro" />
        )
      ) : soloNoLeidas ? (
        <Grupo filas={lista} />
      ) : (
        <>
          <Grupo titulo={t.nuevas} filas={lista.filter((n) => !n.leida)} />
          <Grupo titulo={t.anteriores} filas={lista.filter((n) => n.leida)} />
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {dto.siguienteCursor === undefined ? null : (
          <EnlaceFinn href={hrefDe(soloNoLeidas, dto.siguienteCursor)} className={ENLACE}>
            {t.masAntiguas}
          </EnlaceFinn>
        )}
        {cursor === undefined ? null : (
          <EnlaceFinn href={hrefDe(soloNoLeidas)} className={ENLACE}>
            {t.desdeElPrincipio}
          </EnlaceFinn>
        )}
      </div>
      <p className="text-cuerpo-pequeno flex gap-2.5 rounded-contenedor bg-superficie-hundida p-3.5 text-texto-secundario">
        <Icono nombre="info" tamano={18} className="mt-0.5 shrink-0" />
        <span>
          {navegacion.notificacionesPie} {t.retencion}
        </span>
      </p>
    </div>
  );
}
