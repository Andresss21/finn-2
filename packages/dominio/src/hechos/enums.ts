// Enumerados de 03 §10.3 que usan las filas de los hechos. Mismos valores que los enums de Prisma.

export type TipoCuenta = 'efectivo' | 'tarjeta' | 'prestamo' | 'inversion';
export type ClaseCategoria = 'normal' | 'pago';
export type TipoTransaccion =
  | 'gasto'
  | 'ingreso'
  | 'saldo_inicial'
  | 'transferencia'
  | 'pago_tarjeta'
  | 'cuota_prestamo'
  | 'abono_capital'
  | 'aporte_inversion'
  | 'desembolso_prestamo'
  | 'retiro_inversion'
  | 'avance_efectivo'
  | 'entrada_tarjeta'
  | 'transferencia_tarjetas'
  | 'cobro'
  | 'devolucion'
  | 'ajuste_inversion';
export type OrigenTransaccion = 'sms' | 'manual' | 'importada' | 'programada';
export type EstadoBancario = 'pendiente' | 'confirmada' | 'conciliada';
export type RedTarjeta = 'visa' | 'mastercard' | 'otra';
export type TipoTasa = 'fija' | 'variable';
export type Frecuencia = 'semanal' | 'quincenal' | 'mensual' | 'anual' | 'cada_n_dias';
export type ModeloPrestamo = 'banco_agricola';
export type TipoMeta = 'mensual' | 'semanal' | 'anual' | 'para_fecha';
export type ModoMeta = 'acumular' | 'rellenar_hasta';
export type TipoProgramada = 'gasto' | 'pago_tarjeta' | 'cuota_prestamo' | 'aporte_inversion';
export type EstadoOcurrencia = 'emparejada' | 'registrada' | 'omitida';
export type TipoMovimientoBancario = 'compra' | 'deposito' | 'pago_tarjeta' | 'devolucion';
export type EstadoMovimiento =
  | 'pendiente'
  | 'con_coincidencia'
  | 'posible_duplicado'
  | 'no_reconocido'
  | 'error'
  | 'aprobado'
  | 'descartado'
  | 'autodescartado';
export type MotivoCambio = 'monto' | 'fecha' | 'cuenta' | 'eliminacion';
