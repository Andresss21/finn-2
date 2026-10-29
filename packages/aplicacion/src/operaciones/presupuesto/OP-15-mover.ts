// OP-15 Mover dinero entre categorías (04 §3.3): valor absoluto sobre las dos celdas Asig(o, p) y Asig(d, p) (4.6.2).
// Con las dos ya movidas es `ya_aplicada`, con las vistas se aplica y cualquier otra mezcla es
// `conflicto_desactualizado`. LPA no cambia, así que no hay confirmación; el origen archivado equivale a OP-11.
import { op15, type EntradaOp15, type SalidaPresupuesto } from '../../contratos/presupuesto.ts';
import { asignacionEn, categoriaDe } from '../categorias/comunes.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP15: DefinicionOperacion<EntradaOp15, EntradaOp15, SalidaPresupuesto> = {
  id: 'OP-15',
  contrato: op15,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(_tx, e, h) {
    if (categoriaDe(h, e.origenId) === undefined || categoriaDe(h, e.destinoId) === undefined)
      return { tipo: 'no_encontrado' };
    if (e.origenId === e.destinoId) return { tipo: 'aplicar' }; // lo rechaza el dominio (destino_igual_origen)
    const origen = asignacionEn(h, e.origenId, e.periodoInicio);
    const destino = asignacionEn(h, e.destinoId, e.periodoInicio);
    const { asignacionOrigen, asignacionDestino } = e.esperado;
    if (origen === asignacionOrigen - e.monto && destino === asignacionDestino + e.monto)
      return { tipo: 'ya_aplicada', salida: {} };
    if (origen === asignacionOrigen && destino === asignacionDestino) return { tipo: 'aplicar' };
    return {
      tipo: 'conflicto_desactualizado',
      actuales: { asignacionOrigen: origen, asignacionDestino: destino },
    };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, _instante, ids) => ({
    operacion: 'OP-15',
    origenId: e.origenId,
    destinoId: e.destinoId,
    periodoInicio: e.periodoInicio,
    monto: e.monto,
    ids,
  }),
  salida: () => ({}),
};
