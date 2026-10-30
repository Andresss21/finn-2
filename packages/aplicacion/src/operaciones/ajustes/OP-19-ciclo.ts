// OP-19 Cambiar el ciclo (04 §3.3): valor absoluto sobre la vigencia que regirá (4.6.2) y confirmación siempre (AV-12,
// 4.3). Si la última vigencia ya tiene ese día y el vigente es otro, no hay nada que cambiar: `ya_aplicada`. Si el
// vigente ya es ese día, el dominio rechaza con `ciclo_sin_cambio`. R y las fechas de transición las calcula el dominio.
import { op19, type EntradaOp19, type SalidaAjustes } from '../../contratos/ajustes.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP19: DefinicionOperacion<EntradaOp19, EntradaOp19, SalidaAjustes> = {
  id: 'OP-19',
  contrato: op19,
  idempotencia: 'valor_absoluto',
  exigeConfirmacion: true,
  comprobarIdempotencia(tx, e, h) {
    // "rige desde" nulo es la primera vigencia (R₁ = −∞): ordena antes que cualquier fecha
    const desde = (v: { readonly rigeDesde: string | null }): string => v.rigeDesde ?? '';
    const vigencias = [...h.vigencias_ciclo].sort((a, b) => (desde(a) < desde(b) ? -1 : 1));
    const ultima = vigencias[vigencias.length - 1];
    const vigente = vigencias.filter((v) => desde(v) <= tx.estado.hoy).pop();
    return ultima?.diaInicio === e.diaInicio && vigente?.diaInicio !== e.diaInicio
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'aplicar' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, _instante, ids) => ({ operacion: 'OP-19', diaInicio: e.diaInicio, ids }),
  salida: () => ({}),
};
