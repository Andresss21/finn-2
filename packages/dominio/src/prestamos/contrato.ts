// Contrato de un modelo de cálculo de préstamos (01 §2.2.23, Anexo A.1). Un modelo nunca cambia
// hechos ni números del presupuesto, y el capital pendiente sigue siendo el registrado (01 §4.3).
import type { Uuid } from '../hechos';
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';

/** Entradas del préstamo (A.1): M, F₀, i (millonésimas, 03 DB-13), S₁, Q y n. */
export interface CondicionesModelo {
  readonly montoOriginal: Centavos;
  readonly fechaApertura: FechaLocal;
  readonly tasaNominalAnualMillonesimas: number;
  readonly seguroPrimerMes: Centavos;
  readonly cuotaPactada: Centavos;
  readonly plazoCuotas: number;
}

/** Cuota o abono a capital registrado (A.1): fecha, desglose y número de cuota si se indicó. */
export interface PagoPrestamo {
  readonly id: Uuid;
  readonly tipo: 'cuota' | 'abono';
  readonly fecha: FechaLocal;
  readonly capital: Centavos;
  readonly interes: Centavos;
  readonly seguro: Centavos;
  readonly numeroCuota: number | null;
}

export interface DesgloseCuota {
  readonly interes: Centavos;
  readonly seguro: Centavos;
  readonly capital: Centavos;
}

/** Salida 1: una cuota de la proyección. */
export interface CuotaProyectada extends DesgloseCuota {
  readonly tipo: 'cuota';
  readonly numero: number;
  readonly fecha: FechaLocal;
  readonly dias: number;
  readonly saldoInicial: Centavos;
  readonly saldoFinal: Centavos;
}

/** Un abono a capital registrado, como fila de la proyección (fila "—" del ejemplo de A.2). */
export interface AbonoProyectado {
  readonly tipo: 'abono';
  readonly pagoId: Uuid;
  readonly fecha: FechaLocal;
  readonly saldoInicial: Centavos;
  readonly capital: Centavos;
  readonly saldoFinal: Centavos;
}

export type FilaProyeccion = CuotaProyectada | AbonoProyectado;

/** Salida 3: la cuota con la que se empareja un pago real, o `null` si ninguna. */
export interface Emparejamiento {
  readonly pagoId: Uuid;
  readonly numero: number | null;
}

/** Salida 4. */
export type EstadoCuota = 'pagada' | 'parcial' | 'pendiente' | 'atrasada';

export interface DesgloseConTotal extends DesgloseCuota {
  readonly total: Centavos;
}

/** Salidas 4 y 5: estado de una cuota y comparación entre lo proyectado y lo pagado. */
export interface ComparacionCuota {
  readonly numero: number;
  readonly fecha: FechaLocal;
  readonly estado: EstadoCuota;
  readonly pagos: readonly Uuid[];
  readonly proyectado: DesgloseConTotal;
  readonly pagado: DesgloseConTotal;
}

export interface ModeloCalculo {
  /** Salida 1, con los abonos a capital registrados. */
  proyectar(c: CondicionesModelo, pagos: readonly PagoPrestamo[]): readonly FilaProyeccion[];
  /** Salida 2: desglose propuesto de la cuota `numero` con el capital pendiente registrado. */
  desglosePropuesto(
    c: CondicionesModelo,
    numero: number,
    capitalPendiente: Centavos,
  ): DesgloseCuota;
  /** Salida 3, una por cuota real, en el orden en que se procesan. */
  emparejar(c: CondicionesModelo, pagos: readonly PagoPrestamo[]): readonly Emparejamiento[];
  /** Salidas 4 y 5; `hoy` es una entrada externa (01 §0.4). */
  comparar(
    c: CondicionesModelo,
    pagos: readonly PagoPrestamo[],
    hoy: FechaLocal,
  ): readonly ComparacionCuota[];
}
