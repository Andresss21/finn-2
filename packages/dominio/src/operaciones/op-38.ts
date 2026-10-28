// OP-38 Aprobar todos (01 §5.6, §7.1; 04 §3.6, §4.8; error 9, ajuste 2). Una lista de aprobaciones
// independientes: cada elemento es un OP-37 completo con su propio `aplicar` sobre los hechos que
// dejó el anterior (un `escribir()` por elemento). Solo se aprueban los Pendiente que cumplen OP-37;
// no se aprueban en lote los pagos de tarjeta (necesitan `origenId`) ni lo que exigiría confirmar
// (AV-01, retroactivo). Los demás quedan sin cambios y AV-19 los lista con el código de su motivo.
import type * as H from '../hechos';
import type { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';
import { estadoNoValido } from './op-36';

/** Un movimiento del lote con su id de transacción (`ids[movimientoId]` de la entrada). */
export type ElementoOp38 = H.MovimientoConLineas &
  Pick<H.AprobacionMovimiento, 'id' | 'instante' | 'recibidoEn' | 'ids'>;

/** El resultado de un elemento, en el orden de la entrada. */
export interface ResultadoOp38 {
  readonly movimientoId: H.Uuid;
  readonly salida: H.ResultadoAplicar;
}

/** Motivos propios del lote (04 OP-38); el mensaje lo arma la aplicación (7.10). */
const PAGO = 'pago_sin_origen'; // "Elegí de qué cuenta salió el pago."
const INDIVIDUAL = 'requiere_revision_individual'; // "Requiere revisión individual (…)."

const no = (r: H.Rechazo): H.ResultadoAplicar => ({ ok: false, rechazos: [r] });

/** Un elemento del lote: la aplicación lo corre en su propio `escribir()` (4.8). */
export function aprobarDelLote(
  hechos: H.Hechos,
  e: ElementoOp38,
  hoy: FechaLocal,
): H.ResultadoAplicar {
  const m = e.movimiento;
  if (m.estado !== 'pendiente') return no(estadoNoValido(m));
  if (m.tipoPropuesto === 'pago_tarjeta')
    return no({ codigo: PAGO, datos: { movimientoId: m.id } });
  const salida = aplicar(hechos, { operacion: 'OP-37', ...e }, hoy);
  // La confirmación no se pide en lote: lo que la exigiría queda para la revisión individual.
  if (salida.ok && salida.avisos.some((a) => a.requiereConfirmacion))
    return no({ codigo: INDIVIDUAL, datos: { movimientoId: m.id } });
  return salida;
}

export function op38(
  hechos: H.Hechos,
  lote: { readonly elementos: readonly ElementoOp38[] },
  hoy: FechaLocal,
) {
  let h = hechos;
  // inv. 15: un movimiento repetido en el lote ya está aprobado con su transacción.
  const aprobados = new Map<H.Uuid, H.Uuid>();
  const resultados = lote.elementos.map((e): ResultadoOp38 => {
    const previa = aprobados.get(e.movimiento.id);
    const movimiento: H.Movimiento =
      previa === undefined
        ? e.movimiento
        : { ...e.movimiento, estado: 'aprobado', transaccionId: previa };
    const salida = aprobarDelLote(h, { ...e, movimiento }, hoy);
    if (salida.ok) {
      h = salida.hechosNuevos;
      aprobados.set(movimiento.id, e.id);
    }
    return { movimientoId: movimiento.id, salida };
  });
  const motivos = resultados.flatMap(({ movimientoId: id, salida: s }) =>
    s.ok || aprobados.has(id) ? [] : [[id, s.rechazos[0]?.codigo ?? ''] as const],
  );
  const av19 = { codigo: 'AV-19', momento: 'despues', requiereConfirmacion: false } as const;
  const avisos: H.AvisoOperacion[] =
    motivos.length > 0 ? [{ ...av19, datos: Object.fromEntries(motivos) }] : [];
  return { resultados, hechos: h, avisos };
}
