// Selectores de pantalla que usan las consultas de @finn/aplicacion (04 §2.4, §6.0.5): el único punto de
// entrada a `selectores/`. Cada uno recibe la instantánea y devuelve datos ya calculados (inv. 27).
import type { Instantanea } from '../hechos';
import { type PeriodoDto, periodoDto } from './comunes';
export { actividad, type TransaccionFila } from './actividad';
export { type PeriodoDto, type Ref, type SobregiroDto } from './comunes';
export { cuentas } from './cuentas';
export { detalleCuenta } from './detalle-cuenta';
export { detalleTransaccion } from './detalle-transaccion';
export {
  bandeja,
  type DatosDeBandeja,
  type MovimientoDto,
  type OpcionesDeBandeja,
} from './bandeja';
export { sugerencia, type Sugerencia } from './sugerencia';
// `desglosePropuesto(prestamo, fecha)` de 04 (Anexo A.2 punto 8): también la `propuesta` de la previsualización de OP-24 (04 §4.3 [CH-36])
export { desglosePropuesto, type PropuestaCuota } from '../operaciones/op-24';
export { formulario, type AuxiliaresDeFormulario, type ParametrosFormulario } from './formulario';
export { detalleCategoria, type DetalleCategoria } from './detalle-categoria';
export { detallePagoTarjeta, type DetallePagoTarjeta } from './detalle-pago-tarjeta';
export { estructura, type GrupoDeEstructura } from './estructura';
export { metas, type Metas } from './metas';
export { detalleLpa, PERIODOS_DE_HISTORIAL, type DetalleLpaSel } from './detalle-lpa';
export { porCobrar, type EstadoPorCobrar, type PorCobrarSel } from './por-cobrar';
export {
  HORIZONTE_PROGRAMADAS,
  programadas,
  type ProgramadasSel,
  type ReferenciasDeProgramadas,
} from './programadas';
export { inicio, type InicioSel, type OcurrenciaDto } from './inicio';
export { ritmo, type RitmoSel } from './reportes/ritmo';
export { presupuesto, type FiltroPresupuesto, type PresupuestoSel } from './presupuesto';

/** El período activo de la instantánea (04 §6.0.2, `periodoActivo` del encabezado común). */
export const periodoActivo = (i: Instantanea): PeriodoDto => periodoDto(i, i.presupuesto.activo);
