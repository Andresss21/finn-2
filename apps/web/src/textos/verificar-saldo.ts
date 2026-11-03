// Textos de `/cuentas/[cuentaId]/verificar-saldo` (FT-44; 06 §3.2; 05 §12). Voseo (05 §12.2). Lo que la previsualización rechaza llega
// como código, sin mensaje compuesto (04 §4.3): se traduce acá. Los montos y la diferencia los dice el servidor (PF-3).
export const verificarSaldo = {
  titulo: 'Verificar saldo',
  cuenta: (nombre: string) => `Cuenta: ${nombre}`,
  fecha: 'Fecha del saldo',
  saldoBanco: 'Saldo que muestra tu banco',
  deudaBanco: 'Deuda que muestra tu banco',
  debo: 'Debo',
  tengoAFavor: 'Tengo a favor',
  candidatas: (n: number) =>
    n === 1 ? '1 transacción hasta esa fecha.' : `${n} transacciones hasta esa fecha.`,
  completar: 'Completá este campo.',
  verDiferencia: 'Ver diferencia',
  calculando: 'Calculando…',
  saldoFinn: (fecha: string, monto: string) => `Saldo de Finn al ${fecha}: ${monto}`,
  diferencia: (monto: string) => `Diferencia: ${monto}`,
  coincide: 'Coincide con Finn. Dejamos marcado todo hasta esa fecha.',
  noCoincide: 'No coincide con Finn. No marcamos nada: elegí vos qué conciliar.',
  sinCandidatas: 'No hay transacciones hasta esa fecha: se registra la diferencia sin marcar nada.',
  marcar: 'Marcar como conciliadas',
  mostrando: (mostradas: number, total: number) =>
    `Mostrando las ${mostradas} más recientes de ${total}.`,
  revisar: 'Revisar',
  tituloRevisar: 'Revisá la verificación',
  seMarcan: (n: number) =>
    n === 1
      ? 'Se marca 1 transacción como conciliada.'
      : `Se marcan ${n} transacciones como conciliadas.`,
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  tituloListo: 'Saldo verificado',
  guardado: (cuenta: string, fecha: string) =>
    `Verificación de saldo guardada: ${cuenta}, al ${fecha}`,
  ajusteIngreso: (monto: string) =>
    `Tu banco muestra ${monto} más. Podés registrar un ingreso de ${monto} como ajuste.`,
  ajusteEntrada: (monto: string) =>
    `Tu banco muestra ${monto} menos de deuda. Podés registrar una entrada a la tarjeta de ${monto} como ajuste.`,
  ajusteGasto: (monto: string) =>
    `Tu banco muestra ${monto} menos. Podés registrar un gasto de ${monto} como ajuste.`,
  crearAjuste: 'Crear el ajuste',
  rechazos: {
    cuenta_tipo_no_valido: 'Solo se verifica el saldo de una cuenta de efectivo o una tarjeta.',
    cuenta_archivada: 'Esta cuenta está archivada. Desarchivala para verificar su saldo.',
    fecha_posterior_a_hoy: 'La fecha no puede ser posterior a hoy.',
    fecha_anterior_a_apertura: 'La fecha es anterior a la apertura de la cuenta.',
    transaccion_fuera_de_verificacion: 'Esa transacción es posterior a la fecha que verificaste.',
    transaccion_ya_conciliada: 'Esa transacción ya está conciliada.',
    otro: 'No se puede verificar con lo escrito. Volvé a editar y revisá los datos.',
  },
} as const;
