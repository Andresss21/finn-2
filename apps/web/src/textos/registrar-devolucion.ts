// Textos de `/registrar/devolucion` (FT-28, OP-33; 05 §2.4 y §12): buscar la compra original o registrar la devolución sin ella.
// Los rechazos del servidor llegan ya compuestos en `mensaje`.
export const registrarDevolucion = {
  titulo: 'Registrar devolución',
  tipo: { titulo: 'Devolución', detalle: 'De una compra' },
  buscar: 'Buscar la compra',
  buscarAyuda:
    'Escribí el comercio o la nota: aparecen las compras que todavía se pueden devolver.',
  recientes: 'Compras recientes',
  resultados: 'Compras que coinciden',
  sinResultados: 'Ninguna compra con ese texto.',
  sinCompras: 'Todavía no hay compras que se puedan devolver.',
  quedan: 'quedan',
  sinCompra: 'Sin compra original',
  sinCompraAyuda:
    'Si la compra no está registrada, la devolución entra a una cuenta y suma al Disponible de una categoría.',
  monto: 'Monto devuelto',
  fecha: 'Fecha',
  cuenta: 'Cuenta a la que vuelve',
  categoria: 'Categoría',
  elegirCuenta: 'Elegí la cuenta',
  elegirCategoria: 'Elegí la categoría',
  completar: 'Completá este campo.',
  guardar: 'Registrar devolución',
  guardando: 'Guardando…',
  revisar: 'Revisá el impacto',
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  avisoPeriodoCerrado: 'La fecha es de un período cerrado: cambia el período activo.',
  guardada: (monto: string) => `Devolución guardada: ${monto}`,
  registrarOtra: 'Registrar otra',
} as const;
