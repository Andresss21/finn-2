// OP-40 Resolver una coincidencia o un posible duplicado (01 §5.6, §7.1; 04 §3.6; M2, P16).
// Confirmar ejecuta OP-37; rechazar quita la propuesta y evalúa los duplicados (§4.17) con los datos
// actuales del movimiento; "es legítimo" quita la candidata y "es duplicado" lo descarta.
import { duplicado } from '../criterios/duplicados';
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { estadoNoValido } from './op-36';
import { op37 } from './op-37';

export function op40(antes: H.Instantanea, x: H.ComandoOp40): Efecto | H.Rechazo {
  const m = x.movimiento;
  const coincidencia =
    x.decision === 'confirmar_coincidencia' || x.decision === 'rechazar_coincidencia';
  if (m.estado !== (coincidencia ? 'con_coincidencia' : 'posible_duplicado'))
    return estadoNoValido(m);
  const pasa = (campos: Partial<H.Movimiento>): Efecto => ({
    cambios: [{ tipo: 'actualizar', tabla: 'movimientos', id: m.id, campos }],
  });
  switch (x.decision) {
    case 'confirmar_coincidencia':
      return op37(antes, x);
    case 'rechazar_coincidencia': {
      const { cuentaId, monto, fecha } = m;
      const otros = x.movimientos.filter((y) => y.id !== m.id);
      const sms = cuentaId && monto && fecha && { cuentaId, monto, fecha, texto: x.texto };
      const dup = sms ? duplicado(antes.hechos, otros, sms) : undefined;
      return pasa({
        estado: dup ? 'posible_duplicado' : 'pendiente',
        esperadaProgramadaId: null,
        esperadaFecha: null,
        duplicadoTransaccionId: dup?.transaccionId ?? null,
        duplicadoMovimientoId: dup?.movimientoId ?? null,
      });
    }
    case 'es_legitimo':
      return pasa({
        estado: 'pendiente',
        duplicadoTransaccionId: null,
        duplicadoMovimientoId: null,
      });
    case 'es_duplicado':
      return pasa({ estado: 'descartado' });
  }
}
