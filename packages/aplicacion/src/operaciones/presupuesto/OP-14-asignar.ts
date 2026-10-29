// OP-14 Asignar o desasignar (04 §3.3): valor absoluto sobre Asig(c, p) (4.6.2). Con la celda ya en el valor nuevo es
// `ya_aplicada`, con la vista se aplica y cualquier otro valor es `conflicto_desactualizado`. AV-11 (LPA negativo en
// el activo) pide confirmar con la huella; la regla de CH-31 (archivada en un período futuro) la aplica el dominio.
import { op14, type EntradaOp14, type SalidaPresupuesto } from '../../contratos/presupuesto.ts';
import { asignacionEn, categoriaDe } from '../categorias/comunes.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP14: DefinicionOperacion<EntradaOp14, EntradaOp14, SalidaPresupuesto> = {
  id: 'OP-14',
  contrato: op14,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(_tx, e, h) {
    if (categoriaDe(h, e.categoriaId) === undefined) return { tipo: 'no_encontrado' };
    const actual = asignacionEn(h, e.categoriaId, e.periodoInicio);
    if (actual === e.montoNuevo) return { tipo: 'ya_aplicada', salida: {} };
    if (actual === e.esperado.monto) return { tipo: 'aplicar' };
    return { tipo: 'conflicto_desactualizado', actuales: { monto: actual } };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, _instante, ids) => ({
    operacion: 'OP-14',
    categoriaId: e.categoriaId,
    periodoInicio: e.periodoInicio,
    montoNuevo: e.montoNuevo,
    ids,
  }),
  salida: () => ({}),
};
