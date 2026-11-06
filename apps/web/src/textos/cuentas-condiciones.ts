// Textos de `/cuentas/[cuentaId]/condiciones` (FT-55; 05 §12). Las etiquetas de los campos son las de `/cuentas/nueva`; los
// rechazos del servidor llegan ya compuestos en `mensaje`.
import { cuentasNueva } from './cuentas-nueva.ts';

export const cuentasCondiciones = {
  titulo: 'Condiciones del préstamo',
  nota: 'Cambiar las condiciones solo cambia la tabla de amortización: tu presupuesto y el capital pendiente no se tocan.',
  seguroPrimerMes: 'Seguro del primer mes',
  comision: 'Comisión',
  guardar: 'Guardar condiciones',
  guardando: 'Guardando…',
  usarValorActual: 'Usar el valor actual',
  noSeQuita: 'Este dato ya está registrado: podés cambiarlo, pero no dejarlo vacío.',
  comunes: cuentasNueva,
} as const;
