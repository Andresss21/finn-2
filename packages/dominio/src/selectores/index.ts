// Selectores de pantalla que usan las consultas de @finn/aplicacion (04 §2.4, §6.0.5): el único punto de
// entrada a `selectores/`. Cada uno recibe la instantánea y devuelve datos ya calculados (inv. 27).
export { actividad, type TransaccionFila } from './actividad';
export { periodoActivo, type PeriodoDto, type Ref, type SobregiroDto } from './comunes';
export { detalleLpa, PERIODOS_DE_HISTORIAL, type DetalleLpaSel } from './detalle-lpa';
export { inicio, type InicioSel, type OcurrenciaDto } from './inicio';
export { presupuesto, type FiltroPresupuesto, type PresupuestoSel } from './presupuesto';
