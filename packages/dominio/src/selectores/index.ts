// Selectores de pantalla que usan las consultas de @finn/aplicacion (04 §2.4, §6.0.5): el único punto de
// entrada a `selectores/`. Cada uno recibe la instantánea y devuelve datos ya calculados (inv. 27).
import type { Instantanea } from '../hechos';
import { type PeriodoDto, periodoDto } from './comunes';
export { actividad, type TransaccionFila } from './actividad';
export { type PeriodoDto, type Ref, type SobregiroDto } from './comunes';
export { detalleCategoria, type DetalleCategoria } from './detalle-categoria';
export { detallePagoTarjeta, type DetallePagoTarjeta } from './detalle-pago-tarjeta';
export { estructura, type GrupoDeEstructura } from './estructura';
export { metas, type Metas } from './metas';
export { detalleLpa, PERIODOS_DE_HISTORIAL, type DetalleLpaSel } from './detalle-lpa';
export { inicio, type InicioSel, type OcurrenciaDto } from './inicio';
export { presupuesto, type FiltroPresupuesto, type PresupuestoSel } from './presupuesto';

/** El período activo de la instantánea (04 §6.0.2, `periodoActivo` del encabezado común). */
export const periodoActivo = (i: Instantanea): PeriodoDto => periodoDto(i, i.presupuesto.activo);
