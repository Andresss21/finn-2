export type * from './hechos';

// ── TA-109: entrada pública del cálculo (04 §2.4, BE-09). Las fórmulas de calculo/ no se exportan (inv. 27).
export { calcular } from './calculo/calcular';
export { verificarInvariantes } from './invariantes';

// TA-110: avisos de estado (01 §5.0.7, 04 §6.0.4).
export type { AvisoEstado, IdAvisoEstado } from './avisos/estado';
export { avisosDeEstado } from './avisos/estado';
