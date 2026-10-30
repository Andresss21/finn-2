export type * from './hechos';

// ── TA-109: entrada pública del cálculo (04 §2.4, BE-09). Las fórmulas de calculo/ no se exportan (inv. 27).
export { calcular } from './calculo/calcular';
export { verificarInvariantes } from './invariantes';

// TA-110: avisos de estado (01 §5.0.7, 04 §6.0.4).
export type { AvisoEstado, IdAvisoEstado } from './avisos/estado';
export { avisosDeEstado } from './avisos/estado';

// TA-113: `aplicar` (04 §2.4) y la forma canónica de su impacto para la huella (04 §4.3, V-20).
export { aplicar } from './operaciones/aplicar';
export { formaCanonicaDelImpacto } from './operaciones/impacto';
// TA-184: OP-45 es de lectura (sin `aplicar`): la aplicación la llama con la instantánea y firma su resultado (BE-49).
export { op45 } from './operaciones/op-45';
