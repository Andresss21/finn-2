// Política de push por motivo (04 §11.2, §11.3, §11.4; BE-53; CP-1, CP-18; FD-31): de una notificación ya registrada a
// lo que viaja al servicio de push. Pura: el `ahora` y el conteo de SMS los pone quien la llama (`enviar.ts`).
import type { Movimiento } from '@finn/dominio';
import type { CargaPush, DestinoNotificacion } from '../contratos/notificaciones.ts';
import { formatearMonto } from '../errores/index.ts';
import { MOTIVOS, type MotivoNotificacion, type TtlPush, type Urgencia } from './motivos.ts';

/** 11.3: con más de estos `sms_*` en 5 minutos, el push es el texto agregado. */
export const UMBRAL_AGRUPAR_SMS = 3;
/** 11.4: el protocolo admite 4 KB; Finn se queda en 2 KB. */
export const MAXIMO_CARGA_BYTES = 2_048;

export interface PeticionPush {
  readonly urgencia: Urgencia;
  readonly ttl: number;
  readonly topic?: string;
  readonly carga: CargaPush;
}

export interface ContextoPush {
  readonly notificacionId: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly destino?: DestinoNotificacion;
  readonly ahoraMs: number;
  /** Fecha local que acota el TTL de CF-07 (fp) y CF-24 (fecha esperada). */
  readonly fechaLimite?: string;
  /** `sms_*` creadas en los últimos 5 minutos, esta incluida (11.3). */
  readonly smsRecientes?: number;
}

export const esMotivoSms = (m: MotivoNotificacion): boolean => m.startsWith('sms_');

/** El último segundo de `fecha` en El Salvador (UTC−6 todo el año), en milisegundos. */
const finDeFecha = (fecha: string): number => Date.parse(`${fecha}T23:59:59-06:00`);

function ttlEnSegundos(ttl: TtlPush, c: ContextoPush): number {
  if (typeof ttl === 'number') return ttl;
  if (c.fechaLimite === undefined) throw new Error(`push: el TTL ${ttl} necesita fechaLimite`);
  return Math.max(0, Math.floor((finDeFecha(c.fechaLimite) - c.ahoraMs) / 1000));
}

/** La petición del motivo, o `null` si el motivo no manda push (BE-38, P4-11). */
export function peticionDe(motivo: MotivoNotificacion, c: ContextoPush): PeticionPush | null {
  const p = MOTIVOS[motivo].push;
  if (!p.enviar) return null;
  const etiqueta = 'etiqueta' in p ? p.etiqueta : undefined;
  const acciones = 'acciones' in p ? p.acciones : undefined;
  const agrupado = esMotivoSms(motivo) && (c.smsRecientes ?? 0) > UMBRAL_AGRUPAR_SMS;
  const carga: CargaPush = agrupado
    ? {
        notificacionId: c.notificacionId,
        titulo: 'Bandeja',
        cuerpo: `Tenés ${c.smsRecientes ?? 0} movimientos nuevos en la bandeja`,
        etiqueta: 'sms',
        destino: { pantalla: 'bandeja' },
      }
    : {
        notificacionId: c.notificacionId,
        titulo: c.titulo,
        cuerpo: c.cuerpo,
        ...(etiqueta === undefined ? {} : { etiqueta }),
        ...(c.destino === undefined ? {} : { destino: c.destino }),
        ...(acciones === undefined ? {} : { acciones: [...acciones] }),
      };
  return {
    urgencia: p.urgencia,
    ttl: ttlEnSegundos(p.ttl, c),
    ...(etiqueta === undefined ? {} : { topic: etiqueta }),
    carga,
  };
}

const MOTIVO_DE_ESTADO: Partial<Record<Movimiento['estado'], MotivoNotificacion>> = {
  pendiente: 'sms_nuevo',
  con_coincidencia: 'sms_coincidencia',
  posible_duplicado: 'sms_posible_duplicado',
  no_reconocido: 'sms_no_reconocido',
  error: 'sms_error',
};

const QUE_ES: Partial<Record<NonNullable<Movimiento['tipoPropuesto']>, string>> = {
  gasto: 'Compra',
  ingreso: 'Depósito',
  pago_tarjeta: 'Pago de tarjeta',
  devolucion: 'Devolución',
};

/** AV-23 de un movimiento recién escrito (8.4 e), o `null` si no notifica (autodescartado). Nunca el texto del SMS. */
export function avisoDeMovimiento(
  m: Pick<Movimiento, 'id' | 'estado' | 'comercio' | 'monto' | 'tipoPropuesto'>,
) {
  const motivo = MOTIVO_DE_ESTADO[m.estado];
  if (motivo === undefined) return null;
  const que = (m.tipoPropuesto && QUE_ES[m.tipoPropuesto]) ?? 'Movimiento';
  const donde = m.comercio === null ? '' : ` en ${m.comercio}`;
  const cuanto = m.monto === null ? '' : ` por ${formatearMonto(m.monto)}`;
  const cuerpo =
    donde === '' && cuanto === ''
      ? 'Llegó un SMS que no pudimos leer. Revisalo en la bandeja.'
      : `${que}${donde}${cuanto}. Revisala en la bandeja.`;
  return {
    motivo,
    aviso: {
      titulo: 'Movimiento nuevo',
      cuerpo,
      datos: { destino: { pantalla: 'movimiento', movimientoId: m.id } },
    },
  } as const;
}
