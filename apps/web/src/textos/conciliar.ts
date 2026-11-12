// Textos de `/cuentas/[cuentaId]/conciliar` (FT-43; 06 FT-43; 05 §12). Voseo (05 §12.2). Los rechazos de OP-45 y OP-47
// (`formato_no_reconocido`, `archivo_pdf`, `firma_vencida`, `coincidencia_no_valida`…) llegan con su mensaje desde el servidor
// (04 §7.7): aquí no se traducen. La clasificación, los saldos y la diferencia los dice el servidor (PF-3).
export const conciliar = {
  titulo: 'Conciliar',
  cuenta: (nombre: string) => `Cuenta: ${nombre}`,
  subirTitulo: 'Subí el estado de cuenta',
  subirAyuda: 'Archivo CSV que descargás del portal del banco.',
  archivo: 'Archivo CSV',
  elegirArchivo: 'Elegir archivo',
  elegirOtro: 'Elegir otro archivo',
  falta: 'Subí el archivo CSV.',
  tamano: (kb: number) => `${kb} KB`,
  revisar: 'Revisar',
  leyendo: 'Leyendo el archivo…',
  saldoEstado: (fecha: string, monto: string) => `Saldo del estado (${fecha}): ${monto}`,
  saldoFinn: (fecha: string, monto: string) => `Saldo de Finn (${fecha}): ${monto}`,
  diferencia: (monto: string) => `Diferencia: ${monto}`,
  coinciden: (n: number) => `Coinciden · ${n}`,
  coincidenAyuda: 'Marcá las que querés dejar conciliadas.',
  soloEnEstado: (n: number) => `Solo en el estado · ${n}`,
  soloEnEstadoNota: 'Finn no crea nada por su cuenta: estos movimientos no están en tu cuenta.',
  soloEnFinn: (n: number) => `Solo en Finn · ${n}`,
  soloEnFinnEtiqueta: 'solo en Finn',
  estadoBancario: { pendiente: 'pendiente', confirmada: 'confirmada', conciliada: 'conciliada' },
  editar: 'Editar',
  agregar: 'Agregar',
  agregando: 'Agregando…',
  categoriaDe: (descripcion: string) => `Categoría de ${descripcion}`,
  elegirCategoria: 'Elegí una categoría.',
  agregadoComo: {
    gasto: 'Agregado como gasto',
    ingreso: 'Agregado como ingreso',
    entrada_tarjeta: 'Agregado como entrada a la tarjeta',
  },
  confirmarPeriodo: 'Este movimiento cae en un período cerrado y cambia sus números.',
  confirmarAgregar: 'Agregar igual',
  cancelarAgregar: 'Cancelar',
  nota: 'Si al terminar queda diferencia, vas a ver la propuesta de un “Ajuste de conciliación”.',
  terminar: 'Terminar',
  terminando: 'Terminando…',
  tituloListo: 'Conciliación terminada',
  guardado: (cuenta: string, fecha: string, n: number) =>
    `Conciliación guardada: ${cuenta}, al ${fecha}. ${
      n === 1 ? 'Se concilió 1 transacción.' : `Se conciliaron ${n} transacciones.`
    }`,
  sinDiferencia: 'El estado de cuenta y Finn coinciden.',
  pendientesTitulo: 'Todavía solo en Finn',
  verCuenta: 'Ver la cuenta',
  ajusteIngreso: (monto: string) =>
    `Tu banco muestra ${monto} más. Podés registrar un ingreso de ${monto} como ajuste.`,
  ajusteEntrada: (monto: string) =>
    `Tu banco muestra ${monto} menos de deuda. Podés registrar una entrada a la tarjeta de ${monto} como ajuste.`,
  ajusteGasto: (monto: string) =>
    `Tu banco muestra ${monto} menos. Podés registrar un gasto de ${monto} como ajuste.`,
  crearAjuste: 'Crear el ajuste',
  vencida: 'Volvé a subir el archivo: si es el mismo, se restauran tus marcas.',
} as const;
