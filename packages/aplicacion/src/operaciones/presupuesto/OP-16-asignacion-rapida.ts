// OP-16 Asignación rápida (04 §3.3): el dominio calcula el valor de la variante y lo aplica con las reglas de OP-14
// (AV-11 incluido). Idempotencia de OP-14, valor absoluto sobre Asig(c, p) (4.6.2): el valor objetivo sale de un
// ensayo de `aplicar` sobre los mismos hechos. Con la celda ya en él es `ya_aplicada`; con la vista, se aplica; con
// otro valor, `conflicto_desactualizado`. Una variante que el dominio no ofrece (por ejemplo "cubrir el sobregiro"
// cuando ya no hay sobregiro) es una entrada sin sentido: VALIDACION, o conflicto si la celda ya cambió.
import { aplicar } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { op16, type EntradaOp16, type SalidaPresupuesto } from '../../contratos/presupuesto.ts';
import { generadorAleatorio } from '../../ids.ts';
import { asignacionEn, categoriaDe } from '../categorias/comunes.ts';
import { ErrorValidacion, type DefinicionOperacion } from '../marco.ts';

export const OP16: DefinicionOperacion<EntradaOp16, EntradaOp16, SalidaPresupuesto> = {
  id: 'OP-16',
  contrato: op16,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(tx, e, h) {
    if (categoriaDe(h, e.categoriaId) === undefined) return { tipo: 'no_encontrado' };
    const actual = asignacionEn(h, e.categoriaId, e.periodoInicio);
    const conflicto = {
      tipo: 'conflicto_desactualizado',
      actuales: { monto: actual },
    } as const;
    let objetivo: number | undefined;
    try {
      const r = aplicar(
        h,
        { operacion: 'OP-16', ...e, ids: generadorAleatorio() },
        FechaLocal.desdeTexto(tx.estado.hoy),
      );
      if (r.ok) objetivo = asignacionEn(r.hechosNuevos, e.categoriaId, e.periodoInicio);
    } catch (error) {
      // 04 §6.14.4: el dominio lanza `TypeError` si la variante no se ofrece.
      if (!(error instanceof TypeError)) throw error;
      if (actual !== e.esperado.monto) return conflicto;
      throw new ErrorValidacion('variante', 'Esa opción no está disponible para esta categoría.');
    }
    if (objetivo === actual) return { tipo: 'ya_aplicada', salida: {} };
    return actual === e.esperado.monto ? { tipo: 'aplicar' } : conflicto;
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, _instante, ids) => ({
    operacion: 'OP-16',
    categoriaId: e.categoriaId,
    periodoInicio: e.periodoInicio,
    variante: e.variante,
    ids,
  }),
  salida: () => ({}),
};
