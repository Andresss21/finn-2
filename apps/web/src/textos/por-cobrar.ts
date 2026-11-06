// Textos de `/por-cobrar` (FT-45) y de renombrar un deudor (FT-48; 05 §2, §7.2, §12). Voseo (05 §12.2). `/por-cobrar` no tiene
// errores propios (06 FT-45); los de renombrar (`nombre_repetido`, `conflicto_desactualizado`) los trae el servidor en `mensaje`.
// Cobrar y condonar son de FT-46 y FT-47: acá solo sus enlaces.
import { glosario } from './glosario.ts';

export const porCobrar = {
  titulo: glosario.porCobrar,
  teDeben: 'Te deben',
  enCamino: glosario.enCamino,
  /** AV-09 (04 §6.12.3): `enCamino` sale de la consulta; la interfaz no resta nada. */
  avisoEnCamino:
    'Pagaste con débito por otras personas: Listo para asignar está más bajo por ese monto hasta que te paguen.',
  avisoSinEnCamino: 'Lo que pagaste con tarjeta no baja Listo para asignar.',
  teDebe: 'Te debe',
  desde: (fecha: string) => `desde el ${fecha}`,
  renombrar: 'Renombrar',
  cobrar: 'Cobrar',
  condonar: 'Condonar',
  renombrarA: (nombre: string) => `Renombrar a ${nombre}`,
  cobrarA: (comercio: string) => `Cobrar ${comercio}`,
  condonarA: (comercio: string) => `Condonar ${comercio}`,
  medios: { debito: 'Débito', tarjeta: 'Tarjeta' },
  estados: { abierto: 'Abierto', parcial: 'Parcial', cerrado: 'Cerrado' },
  montos: {
    compartido: 'Compartido',
    cobrado: 'Cobrado',
    condonado: 'Condonado',
    devuelto: 'Devuelto',
    abierto: 'Abierto',
  },
  vacioTitulo: 'Nadie te debe nada',
  vacioTexto: 'Cuando pagues por otra persona, dividí el gasto y marcá su parte como por cobrar.',
  verCerrados: 'Ver los cerrados',
} as const;

export const porCobrarRenombrar = {
  titulo: 'Renombrar deudor',
  nombre: 'Nombre',
  obligatorio: 'Completá este campo.',
  guardar: 'Guardar nombre',
  guardando: 'Guardando…',
  guardado: 'Nombre guardado',
  sinCambios: 'Todavía no cambiaste el nombre.',
  usarValorActual: 'Usar el valor actual',
} as const;
