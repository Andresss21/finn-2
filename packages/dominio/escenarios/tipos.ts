// Formato de un escenario de 01 §8 como datos (07 §12.3, DP-13). Portado del prototipo de V7-08 y completado con las reglas
// 1 a 11: cada operación nombra su `op: 'OP-nn'` (la lee la regla E13 de `plan:verificar --escenarios`), hay rechazos,
// ramas y `extra`. Montos en dólares, como en las tablas de 01; el ejecutor los pasa a centavos. Fechas de negocio
// 'AAAA-MM-DD'; instantes locales 'AAAA-MM-DDThh:mm' (America/El_Salvador).
export type Periodo = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
/** Inicio de cada período (01 §8.0, ciclo con día de inicio 21, 2027). */
export const PERIODOS: Record<Periodo, string> = {
  P1: '2027-01-21',
  P2: '2027-02-21',
  P3: '2027-03-21',
  P4: '2027-04-21',
  P5: '2027-05-21',
  P6: '2027-06-21',
};

/** Atributos de un préstamo en curso que 01 §8 no da (DP-16 no los completa): los trae el dato. */
export interface DatosPrestamo {
  contraparte: string;
  montoOriginal: number;
  cuota: number;
  plazoCuotas: number;
  cuotasPagadas: number;
}

/** Operaciones que entienden los ejecutores; las demás las agrega la tarea que trae su OP (E13). */
export type Op =
  | {
      op: 'OP-01';
      cuenta: string;
      tipo?: 'efectivo' | 'tarjeta' | 'prestamo';
      saldo?: number; // tarjeta: la deuda; préstamo: el capital pendiente
      apertura?: string; // por defecto 2027-01-21 (DP-16)
      diaCorte?: number; // tarjeta: 15 por defecto
      prestamo?: DatosPrestamo;
    }
  | { op: 'OP-07'; categoria: string }
  | { op: 'OP-14'; categoria: string; monto: number; periodo?: Periodo } // δ sobre Asig(c, p); el ejecutor la pasa a valor absoluto
  | {
      op: 'OP-20';
      ref: string;
      cuenta: string;
      lineas: [string, number][];
      fecha?: string;
      registrado?: string;
    }
  | { op: 'OP-21'; monto: number; cuenta?: string; fecha?: string; registrado?: string }
  | { op: 'OP-23'; tarjeta: string; monto: number; fecha?: string; registrado?: string };

export interface Espera {
  ef?: number;
  lpa?: number;
  /** Disp(·, A) de la columna "Disponibles"; las no listadas deben ser 0 (regla 2). `{}` = la columna dice "—". */
  disp?: Record<string, number>;
  /** Σ asignaciones en períodos futuros ("(fut)"). */
  fut?: number;
  sobta?: number;
  /** Tarjeta: deuda · S · RE. */
  tarjetas?: Record<string, [number, number, number]>;
  /** Mínimo: deben estar; la columna Notas no es exhaustiva (regla 8, DP-14). */
  avisos?: string[];
  /** Código de rechazo de 04 §3.0.6: la operación se rechaza completa y la instantánea queda igual (regla 7). */
  rechazo?: string;
  /** Columnas fuera de la instantánea (regla 9): `consulta` o `consulta:argumento` → valor en dólares. */
  extra?: Record<string, number>;
}
export interface Paso {
  n: string;
  hoy?: string;
  ops: Op[];
  espera: Espera;
  /** Fila de contraste o alternativa: corre en una rama desde el estado anterior al paso `n` indicado (regla 5). */
  alternativaDe?: string;
  /** Fila siguiente de una rama: continúa la rama que abrió el paso con esa `n` (regla 5). */
  rama?: string;
}
export interface Escenario {
  id: string;
  titulo: string;
  refs: string[];
  /** Hoy inicial; si falta, 10/02/2027 (DP-16). */
  hoy?: string;
  /** "Continúa el paso N de ESC-mm" (regla 4). */
  continua?: { escenario: string; hastaPaso: string };
  /** Cuentas y categorías previas que 01 §8.0 da por existentes; solo se corre en el primer eslabón de la cadena. */
  estadoInicial?: Op[];
  pasos: Paso[];
}
export const usd = (x: number) => Math.round(x * 100);

/** Lo que observa un ejecutor después de un paso. Montos en centavos. */
export interface Observado {
  ef: number;
  lpa: number;
  disp: Record<string, number>;
  fut: number;
  sobta: number;
  tarjetas: Record<string, [number, number, number]>;
  avisos: string[];
  /** Las consultas de `espera.extra` que este ejecutor sabe evaluar, en centavos. */
  extra: Record<string, number>;
  /** Código del rechazo, si alguna operación del paso se rechazó. */
  rechazo?: string;
  /** Con un rechazo: si la instantánea completa quedó igual a la anterior (regla 7). */
  intacto?: boolean;
}
