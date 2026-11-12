// Textos de `/registrar/desembolso` (FT-56, 05 §12). Los rechazos del servidor (`cuenta_tipo_no_valido`, `cuenta_archivada`,
// `fecha_posterior_a_hoy`) llegan ya compuestos en `mensaje`.
export const registrarDesembolso = {
  titulo: 'Desembolso de préstamo',
  listo: 'Desembolso registrado',
  guardar: 'Guardar desembolso',
  prestamo: 'Préstamo',
  cuenta: 'Cuenta que recibe el dinero',
  elegirPrestamo: 'Elegí un préstamo.',
  guardado: (monto: string, prestamo: string, cuenta: string) =>
    `Desembolso guardado: ${monto} · ${prestamo} a ${cuenta}`,
  tipo: {
    titulo: 'Desembolso',
    detalle: 'De un préstamo nuevo',
  },
  sin: {
    prestamos: {
      titulo: 'Todavía no tenés un préstamo',
      texto: 'Un desembolso es el dinero de un préstamo. Creá el préstamo para registrarlo.',
    },
    efectivo: {
      titulo: 'Un desembolso necesita una cuenta de efectivo',
      texto: 'El dinero del préstamo entra a una cuenta de efectivo. Creá una para registrarlo.',
    },
  },
} as const;
