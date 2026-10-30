// Glosario de la interfaz (05 §12.3). Una pantalla no usa un sinónimo de estos términos.
export const glosario = {
  listoParaAsignar: 'Listo para asignar',
  disponible: 'Disponible',
  asignado: 'Asignado',
  gastado: 'Gastado',
  arrastrado: 'Arrastrado',
  teFaltaReservar: 'Te falta reservar',
  reservado: 'Reservado',
  reservadoDeMas: 'Reservado de más',
  pagasteDeMas: 'Pagaste de más',
  enCamino: 'En camino',
  sobregiroConDebitoOEfectivo: 'Sobregiro con débito o efectivo',
  deudaSinReservar: 'Deuda sin reservar',
  movimiento: 'Movimiento',
  transaccion: 'Transacción',
  periodoActual: 'Período actual',
  periodoCerrado: 'Período cerrado',
  periodoFuturo: 'Período futuro',
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  conciliada: 'Conciliada',
  porCobrar: 'Por cobrar',
  patrimonio: 'Patrimonio',
  posicionNeta: 'Posición neta',
  loQueTeQuedoDelPeriodo: 'Lo que te quedó del período',
  bandeja: 'Bandeja',
} as const;

// [R2] Donde "deuda sin reservar" (por categoría) y "te falta reservar" (total de la tarjeta)
// aparecen juntos, el texto nombra siempre el alcance. Los montos llegan ya formateados (5.4).
export const alcanceReserva = {
  deudaEnCategoria: (categoria: string, monto: string) =>
    `${glosario.deudaSinReservar} en ${categoria}: ${monto}`,
  faltaParaTarjeta: (tarjeta: string, monto: string) =>
    `${glosario.teFaltaReservar} para ${tarjeta}: ${monto} (total de la tarjeta)`,
  sumaALoQueFalta: (tarjeta: string) =>
    `Esta deuda suma a lo que te falta reservar para ${tarjeta}`,
} as const;
