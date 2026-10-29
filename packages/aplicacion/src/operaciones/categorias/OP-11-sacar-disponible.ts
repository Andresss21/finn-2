// OP-11 Sacar el Disponible de una archivada (04 §3.2): valor absoluto sobre Asig(c, A) y, si el destino es una
// categoría, sobre la suya. `esperado` trae los valores que vio la interfaz; con los dos ya movidos es
// `ya_aplicada`, con los vistos se aplica y cualquier otra mezcla es `conflicto_desactualizado` (4.6.2).
import { op11, type EntradaOp11, type SalidaCategoria } from '../../contratos/categorias.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { asignacionEn, categoriaDe, inicioActivo } from './comunes.ts';

export const OP11: DefinicionOperacion<EntradaOp11, EntradaOp11, SalidaCategoria> = {
  id: 'OP-11',
  contrato: op11,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(tx, e, h) {
    if (categoriaDe(h, e.categoriaId) === undefined) return { tipo: 'no_encontrado' };
    const inicio = inicioActivo(h, tx.estado.hoy);
    const origen = asignacionEn(h, e.categoriaId, inicio);
    const hacia = e.destino === 'lpa' ? undefined : e.destino.categoriaId;
    const destino = hacia === undefined ? undefined : asignacionEn(h, hacia, inicio);
    const { asignacionOrigen, asignacionDestino } = e.esperado;
    const hecha =
      origen === asignacionOrigen - e.monto &&
      (destino === undefined || destino === (asignacionDestino ?? 0) + e.monto);
    if (hecha) return { tipo: 'ya_aplicada', salida: {} };
    const vista =
      origen === asignacionOrigen && (destino === undefined || destino === asignacionDestino);
    if (vista) return { tipo: 'aplicar' };
    return {
      tipo: 'conflicto_desactualizado',
      actuales: {
        asignacionOrigen: origen,
        ...(destino === undefined ? {} : { asignacionDestino: destino }),
      },
    };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, _instante, ids) => ({
    operacion: 'OP-11',
    categoriaId: e.categoriaId,
    ids,
    monto: e.monto,
    destino: e.destino,
  }),
  salida: () => ({}),
};
