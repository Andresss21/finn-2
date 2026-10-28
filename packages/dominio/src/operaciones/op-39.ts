// OP-39 Descartar o restaurar movimiento (01 §5.6, §7.1; 04 §3.6; A-2). Descartar desde Pendiente,
// Posible duplicado, No reconocido o error. Restaurar desde Descartado o Autodescartado reevalúa los
// pasos 7 y 8 de OP-35 (§4.17) con los datos actuales del movimiento y pasa directamente al estado
// que resulta (HZ-2), con las candidatas vigentes.
import { duplicado } from '../criterios/duplicados';
import { emparejar } from '../criterios/emparejamiento';
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { estadoNoValido } from './op-36';

const DESCARTABLES = new Set(['pendiente', 'posible_duplicado', 'no_reconocido', 'error']);
const RESTAURABLES = new Set(['descartado', 'autodescartado']);

/** Pasos 7 a 9 de OP-35 sobre un movimiento ya creado; el propio no cuenta como candidato. */
export function reevaluar(
  h: H.Hechos,
  m: H.Movimiento,
  texto: string,
  movimientos: readonly H.MovimientoConTexto[],
): Partial<H.Movimiento> {
  const otros = movimientos.filter((y) => y.id !== m.id);
  const { cuentaId, monto, fecha } = m;
  const sms = cuentaId !== null && monto !== null && fecha !== null && { cuentaId, monto, fecha };
  const esperada = sms ? emparejar(h, otros, sms) : undefined;
  const dup = sms && !esperada ? duplicado(h, otros, { ...sms, texto }) : undefined;
  return {
    estado: esperada ? 'con_coincidencia' : dup ? 'posible_duplicado' : 'pendiente',
    esperadaProgramadaId: esperada?.programadaId ?? null,
    esperadaFecha: esperada?.fecha ?? null,
    duplicadoTransaccionId: dup?.transaccionId ?? null,
    duplicadoMovimientoId: dup?.movimientoId ?? null,
  };
}

export function op39(antes: H.Instantanea, x: H.ComandoOp39): Efecto | H.Rechazo {
  const m = x.movimiento;
  const validos = x.accion === 'descartar' ? DESCARTABLES : RESTAURABLES;
  if (!validos.has(m.estado)) return estadoNoValido(m);
  const campos: Partial<H.Movimiento> =
    x.accion === 'descartar'
      ? { estado: 'descartado' }
      : reevaluar(antes.hechos, m, x.texto, x.movimientos);
  return { cambios: [{ tipo: 'actualizar', tabla: 'movimientos', id: m.id, campos }] };
}
