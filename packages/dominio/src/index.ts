export type * from './hechos';

// ── TA-109: entrada pública del cálculo (04 §2.4, BE-09). Las fórmulas de calculo/ no se exportan (inv. 27).
export { calcular } from './calculo/calcular';
export { verificarInvariantes } from './invariantes';
