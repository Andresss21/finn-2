import type { Centavos, FechaLocal } from '@finn/dominio/valores';

/** Contrato de 04 §9.2. Puro: recibe bytes, devuelve datos (BE-01). */
export type IdFormatoCsv =
  | 'bac_tarjeta'
  | 'bac_debito'
  | 'ba_tarjeta_portal'
  | 'ba_tarjeta_pdf_csv'
  | 'ba_debito'
  | 'cuscatlan_tarjeta';

export interface MovimientoNormalizado {
  /** Posición en el archivo; identifica el movimiento en OP-46 y OP-47. */
  indice: number;
  fecha: FechaLocal;
  /** Con signo, como efecto en la cuenta: cargo negativo, abono positivo. */
  monto: Centavos;
  /** Normalizada: recorte y espacios repetidos. */
  descripcion: string;
  referencia?: string;
}

export interface EstadoNormalizado {
  formato: IdFormatoCsv;
  fechaEstado: FechaLocal;
  /** Convención de signos de la cuenta (01 §0.4): tarjeta negativa = deuda. */
  saldoFinal: Centavos;
  movimientos: MovimientoNormalizado[];
}

/** `formato_excluido` (CH-03) y `formato_no_disponible` (hasta TA-183) amplían 04 §9.2: ver el informe. */
export type CodigoErrorLectura =
  | 'archivo_pdf'
  | 'formato_no_reconocido'
  | 'formato_ambiguo'
  | 'formato_excluido'
  | 'formato_no_disponible'
  | 'fila_invalida';

export interface ErrorLectura {
  error: CodigoErrorLectura;
  /** Número de fila (desde 1) en `fila_invalida`. */
  fila?: number;
  motivo?: string;
  formato?: IdFormatoCsv;
}

/** Lo lanza `extraer`; `leerEstado` lo convierte en `ErrorLectura`. */
export class ErrorFormato extends Error {
  readonly fila: number;
  readonly motivo: string;
  constructor(fila: number, motivo: string) {
    super(`fila ${fila}: ${motivo}`);
    this.name = 'ErrorFormato';
    this.fila = fila;
    this.motivo = motivo;
  }
}

export interface Adaptador {
  id: IdFormatoCsv;
  tipoCuenta: 'efectivo' | 'tarjeta';
  /** Firma de ADR-17. */
  detectar(texto: string, filas: string[][]): boolean;
  /** Lanza `ErrorFormato` con fila y motivo. */
  extraer(filas: string[][]): EstadoNormalizado;
}
