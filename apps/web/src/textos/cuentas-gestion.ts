// Textos de editar y ordenar cuentas (FT-53; 05 §2.7, §12); los rechazos del servidor llegan ya compuestos en `mensaje`.
import { cuentasNueva } from './cuentas-nueva.ts';

export const cuentasGestion = {
  cerrar: 'Cerrar',
  editar: {
    titulo: 'Editar cuenta',
    guardar: 'Guardar cambios',
    guardando: 'Guardando…',
    usarValorActual: 'Usar el valor actual',
  },
  ordenar: {
    titulo: 'Ordenar cuentas',
    guardar: 'Guardar orden',
    guardando: 'Guardando…',
    subir: (nombre: string) => `Subir ${nombre}`,
    bajar: (nombre: string) => `Bajar ${nombre}`,
    subirCorto: 'Subir',
    bajarCorto: 'Bajar',
    conflicto: 'Tus cuentas cambiaron. Recargá para ver el orden actual.',
  },
  archivar: {
    titulo: 'Archivar cuenta',
    pregunta: (nombre: string) =>
      `¿Archivar ${nombre}? Deja de aparecer en Cuentas y queda de solo lectura.`,
    futuras: 'Asignaciones en períodos futuros de su categoría de pago',
    devolver: 'Devolverlas a Listo para asignar',
    dejar: 'Dejarlas como están',
    archivar: 'Archivar',
    archivando: 'Archivando…',
    tituloBloqueo: 'No se puede archivar',
    guiaSaldo: 'Pasá el saldo a otra cuenta con una transferencia y volvé a intentarlo.',
    transferirSaldo: 'Transferir el saldo',
    volver: 'Volver a la cuenta',
    // Los bloqueos de 04 §7.5: los mismos mensajes que da el servidor, armados con lo que muestra el detalle.
    bloqueos: {
      cuenta_con_saldo: (nombre: string, saldo: string) =>
        `Para archivar ${nombre}, su saldo debe ser $0.00 (hoy es ${saldo}).`,
      tarjeta_con_deuda: (nombre: string, deuda: string) =>
        `${nombre} todavía tiene una deuda de ${deuda}.`,
      reserva_tarjeta_no_cero: (nombre: string, reservado: string) =>
        `La categoría de pago de ${nombre} tiene ${reservado}; movelo antes de archivar.`,
      cuenta_ya_archivada: (nombre: string) => `${nombre} ya está archivada.`,
    },
  },
  eliminar: {
    titulo: 'Eliminar cuenta',
    pregunta: (nombre: string) =>
      `¿Eliminar ${nombre}? Antes de hacerlo vas a ver qué cambia en tu presupuesto.`,
    verCambios: 'Ver qué cambia',
    revisando: 'Revisando…',
    eliminar: 'Eliminar cuenta',
    volver: 'Volver a la cuenta',
    archivarEnLugar: 'Archivar en lugar de eliminar',
    tituloBloqueo: 'No se puede eliminar',
    archivarCorto: 'Archivar',
    bloqueos: {
      cuenta_con_movimientos: (nombre: string) =>
        `${nombre} tiene movimientos. Podés archivarla en lugar de eliminarla.`,
      cuenta_con_programadas: (nombre: string, n: number) =>
        `${nombre} se usa en ${n} ${n === 1 ? 'transacción programada' : 'transacciones programadas'}. Cambiala o eliminala primero.`,
    },
    categoriaDePago: (nombre: string) => `Se elimina también la categoría de pago ${nombre}.`,
    conciliaciones: (n: number) =>
      `Se ${n === 1 ? 'elimina 1 conciliación' : `eliminan ${n} conciliaciones`}.`,
  },
  comunes: cuentasNueva,
} as const;
