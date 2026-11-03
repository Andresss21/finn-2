// Textos de `/actividad/[transaccionId]` y  (FT-25; 05 §2.6, §7.2). Voseo (05 §12.2). Los
// rechazos del servidor (`cambio_cuenta_con_devoluciones`, `linea_menor_que_eventos`…) llegan compuestos en `mensaje`.
import { actividad } from './actividad.ts';
import { glosario } from './glosario.ts';

export const transaccion = {
  titulo: 'Transacción',
  volver: 'Volver',
  fecha: 'Fecha',
  tipo: 'Tipo',
  estado: 'Estado',
  periodo: 'Período',
  cuentas: 'Cuentas',
  nota: 'Nota',
  origen: 'Origen',
  origenes: actividad.origenes,
  mensajeOriginal: 'Mensaje original',
  programadaDe: (nombre: string, fecha: string) => `Programada «${nombre}» del ${fecha}`,
  partes: 'Partes',
  parteDe: (n: number) => `Parte ${n}`,
  porCobrarA: (nombre: string) => `${glosario.porCobrar} a ${nombre}`,
  devolucionDeOtraCompra: 'Devolución de otra compra',
  cubierto: 'Cubierto',
  noCubierto: 'No cubierto',
  abierto: 'Por cobrar',
  restituido: 'Cobrado',
  condonado: 'Condonado',
  devuelto: 'Devuelto',
  conciliacion: (fecha: string) => `${glosario.conciliada} con el estado de cuenta del ${fecha}`,
  cambiosPosteriores: 'Cambios posteriores a la conciliación',
  cambioPosterior: (cuando: string, motivos: string) => `${cuando}: ${motivos}`,
  motivos: { monto: 'monto', fecha: 'fecha', cuenta: 'cuenta', eliminacion: 'eliminación' },
  archivada: actividad.archivada,
} as const;
