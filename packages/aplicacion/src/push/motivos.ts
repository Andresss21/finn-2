// Catálogo de motivos de notificación (`push/motivos.ts`, 04 §11.1) (04 §11.1, §11.2, §11.4; CF-16, CF-07, CF-24): un registro por motivo con su
// aviso (o `null` si no es un aviso del dominio, 06 §3.13.1), la política del push y la pantalla de destino. La
// tabla de 04 §11.2 y la prueba de catálogo (PRU-INT-NOTIF-002) salen de esta constante.

export type Urgencia = 'high' | 'normal' | 'low';
export type EtiquetaPush = 'sms' | 'programadas' | 'cierre' | 'sistema' | 'tarjetas';
export type AccionPush = 'confirmar' | 'rechazar';
/** Vigencia del push en segundos, o hasta un instante que fija quien lo envía (CF-07, CF-24). */
export type TtlPush = number | 'hasta_fecha_de_pago' | 'hasta_fin_de_fecha_esperada';
/** `pantalla` de `DestinoNotificacion` (04 §11.4, CP-1). */
export type PantallaDestino =
  | 'inicio'
  | 'bandeja'
  | 'movimiento'
  | 'transaccion'
  | 'programada'
  | 'presupuesto'
  | 'categoria'
  | 'diagnostico'
  | 'cuenta';

export type PoliticaPush =
  | { readonly enviar: false }
  | {
      readonly enviar: true;
      readonly urgencia: Urgencia;
      readonly ttl: TtlPush;
      readonly etiqueta?: EtiquetaPush;
      readonly acciones?: readonly AccionPush[];
    };

export interface DefinicionMotivo {
  /** `notificaciones.aviso`: el aviso de 01 §5.0.7, o `null` (CF-16). */
  readonly aviso: string | null;
  readonly push: PoliticaPush;
  /** Pantalla de `datos.destino` (04 §11.4). */
  readonly destino: PantallaDestino;
}

const HORA = 3_600;
const DIA = 24 * HORA;

const push = (
  urgencia: Urgencia,
  ttl: TtlPush,
  etiqueta?: EtiquetaPush,
  acciones?: readonly AccionPush[],
): PoliticaPush => ({
  enviar: true,
  urgencia,
  ttl,
  ...(etiqueta === undefined ? {} : { etiqueta }),
  ...(acciones === undefined ? {} : { acciones }),
});
const sinPush: PoliticaPush = { enviar: false };
const sistema = (): DefinicionMotivo => ({
  aviso: null,
  push: push('normal', 3 * DIA, 'sistema'),
  destino: 'diagnostico',
});

export const MOTIVOS = {
  sms_nuevo: { aviso: 'AV-23', push: push('high', DIA, 'sms'), destino: 'movimiento' },
  sms_coincidencia: {
    aviso: 'AV-23',
    push: push('high', DIA, 'sms', ['confirmar', 'rechazar']),
    destino: 'movimiento',
  },
  sms_posible_duplicado: { aviso: 'AV-23', push: push('high', DIA, 'sms'), destino: 'movimiento' },
  sms_no_reconocido: { aviso: 'AV-23', push: push('normal', DIA, 'sms'), destino: 'movimiento' },
  sms_error: { aviso: 'AV-23', push: push('normal', DIA, 'sms'), destino: 'movimiento' },
  registro_automatico: {
    aviso: 'AV-23',
    push: push('normal', DIA, 'programadas'),
    destino: 'transaccion',
  },
  registro_automatico_fallido: {
    aviso: 'AV-23',
    push: push('normal', 3 * DIA, 'programadas'),
    destino: 'programada',
  },
  ocurrencia_en_periodo_cerrado: {
    aviso: 'AV-23',
    push: push('normal', 7 * DIA),
    destino: 'programada',
  },
  cierre_periodo: { aviso: null, push: push('normal', 7 * DIA, 'cierre'), destino: 'presupuesto' },
  meta_vencida: { aviso: 'AV-17', push: push('low', 7 * DIA), destino: 'categoria' },
  pago_tarjeta_proximo: {
    aviso: null,
    push: push('normal', 'hasta_fecha_de_pago', 'tarjetas'),
    destino: 'cuenta',
  },
  cuota_proxima: {
    aviso: null,
    push: push('normal', 'hasta_fin_de_fecha_esperada', 'programadas'),
    destino: 'programada',
  },
  respaldo_atrasado: sistema(),
  restauracion_atrasada: sistema(),
  deriva_catalogo: sistema(),
  tarea_fallida: sistema(),
  carga_incremental: sistema(),
  cambio_retroactivo: { aviso: 'AV-01', push: sinPush, destino: 'inicio' },
} as const satisfies Readonly<Record<string, DefinicionMotivo>>;

/** Unión cerrada de los motivos (04 §11.1). */
export type MotivoNotificacion = keyof typeof MOTIVOS;

export const esMotivo = (texto: string): texto is MotivoNotificacion =>
  Object.hasOwn(MOTIVOS, texto);
