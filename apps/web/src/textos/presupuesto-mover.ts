// Textos de `/presupuesto/mover` (FT-11; 05 §2.3, §4.4, §4.7). Voseo (05 §12.2). Los mensajes de rechazo
// (`destino_igual_origen`, `categoria_archivada`, `periodo_cerrado`…) los trae el servidor; acá solo lo propio del flujo.
import { glosario } from './glosario.ts';

export const presupuestoMover = {
  titulo: 'Mover dinero',
  origen: 'Sacar de',
  destino: 'Poner en',
  monto: 'Monto a mover',
  obligatorio: 'Ingresá un monto.',
  elegirCategoria: 'Elegí una categoría.',
  disponibleDe: (monto: string) => `${glosario.disponible} ${monto}`,
  mover: 'Mover',
  moviendo: 'Moviendo…',
  usarValoresActuales: 'Usar los valores actuales',
  valoresActuales: (origen: string, destino: string) =>
    `${glosario.asignado} ahora: ${origen} en el origen y ${destino} en el destino.`,
  listo: 'Dinero movido',
  // D-6 (CA-11.2): mover más que el Disponible se acepta con aviso; el negativo y los dos Disponibles los dice el servidor.
  rotuloImpacto: 'Antes de confirmar',
  calculando: 'Calculando el impacto…',
  impactoCambio: 'El impacto cambió. Revisalo antes de confirmar.',
  vaAQuedar: (nombre: string, monto: string) => `${nombre} va a quedar en ${monto}`,
  sobregirada: (monto: string) =>
    `Queda sobregirada. Si no la cubrís antes del cierre, ${glosario.listoParaAsignar} bajará ${monto}.`,
} as const;
