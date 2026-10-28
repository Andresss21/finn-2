// Formato de un escenario de 01 §8 como datos (07 §12.3, DP-13; portado del prototipo de V7-08). Cada operación nombra su
// `op: 'OP-nn'` (la lee la regla E13 de `plan:verificar --escenarios`). Montos en dólares, como en las tablas de 01; el
// ejecutor los pasa a centavos. Fechas 'AAAA-MM-DD'; instantes locales 'AAAA-MM-DDThh:mm' (America/El_Salvador).
export type Periodo = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
/** Inicio de cada período (01 §8.0, ciclo con día de inicio 21, 2027). */
export const PERIODOS = Object.fromEntries(
  ['01-21', '02-21', '03-21', '04-21', '05-21', '06-21'].map((f, k) => [`P${k + 1}`, `2027-${f}`]),
) as Record<Periodo, string>;

/** Atributos de un préstamo en curso que 01 §8 no da (DP-16 no los completa): los trae el dato. */
export interface DatosPrestamo {
  contraparte: string;
  montoOriginal: number;
  cuota: number;
  plazoCuotas: number;
  cuotasPagadas: number;
}

/** Operaciones que entienden los ejecutores; las demás las agrega la tarea que trae su OP (E13). */
type OpBase =
  | {
      op: 'OP-01';
      cuenta: string;
      tipo?: 'efectivo' | 'tarjeta' | 'prestamo';
      saldo?: number; // tarjeta: la deuda; préstamo: el capital pendiente
      apertura?: string; // por defecto 2027-01-21 (DP-16)
      diaCorte?: number; // tarjeta: 15 por defecto
      diaPago?: number; // tarjeta: 5 por defecto
      limite?: number; // tarjeta: $5,000 por defecto
      ultimos4?: string; // con él la cuenta tiene institución, y un SMS la encuentra (OP-35)
      prestamo?: DatosPrestamo;
    }
  | { op: 'OP-07'; categoria: string }
  | { op: 'OP-14'; categoria: string; monto: number; periodo?: Periodo } // δ sobre Asig(c, p); el ejecutor la pasa a valor absoluto
  | { op: 'OP-17'; periodo?: Periodo } // Auto-asignar: por defecto el período activo
  | { op: 'OP-15'; origen: string; destino: string; monto: number; periodo?: Periodo } // mover (por defecto, el período activo)
  | {
      op: 'OP-18';
      categoria: string;
      monto?: number; // al crear; al editar solo cambia lo que se nombra
      tipo?: 'mensual' | 'semanal' | 'anual' | 'para_fecha'; // mensual y semanal: acumular por defecto
      modo?: 'acumular' | 'rellenar_hasta';
      fecha?: string; // para_fecha: la fecha objetivo
      editar?: true; // edita la meta de la categoría en vez de crearla
    }
  | {
      op: 'OP-20';
      cuenta: string;
      monto: number; // el total
      categoria?: string; // una sola línea, por el total
      lineas?: { categoria?: string; deudor?: string; monto: number }[]; // split o por cobrar (`deudor` = por cobrar)
      etiqueta?: string; // nombre con que otras operaciones (OP-28, OP-31) citan esta transacción
      fecha?: string;
      registrado?: string;
    }
  | {
      op: 'OP-21';
      monto: number;
      cuenta?: string;
      fecha?: string;
      registrado?: string;
      etiqueta?: string;
    }
  | { op: 'OP-30'; etiqueta: string; estado: 'pendiente' | 'confirmada' } // estado bancario de la transacción `etiqueta`
  | { op: 'OP-28'; etiqueta: string; cuenta?: string; fecha?: string; monto?: number } // cambiar la cuenta (el medio), la fecha o el total
  | { op: 'OP-29'; etiqueta: string } // eliminar la transacción
  | { op: 'OP-31'; cobro: string; monto: number; cuenta?: string; fecha?: string } // cobrar el por cobrar de la transacción `cobro`
  | { op: 'OP-32'; cobro: string; categoria: string; monto: number; fecha?: string } // condonar el por cobrar de `cobro` hacia una categoría
  | {
      op: 'OP-33'; // devolver: vinculada (`compra` = etiqueta de la compra) o sin compra original (`categoria`, `cuenta`)
      monto: number;
      compra?: string;
      /** Vinculada: reparto por línea de la compra (`linea` desde 1, en el orden de su OP-20); por defecto, la línea 1 por el total. */
      reparto?: { linea: number; monto: number }[];
      categoria?: string;
      cuenta?: string; // vinculada: por defecto, la de la compra; sin compra, obligatoria
      fecha?: string;
    }
  | {
      op: 'OP-27';
      modalidad: 'avance' | 'entrada' | 'transferencia_deuda';
      tarjeta: string;
      monto: number;
      cuenta?: string; // avance: el efectivo que recibe
      destino?: string; // transferencia: la tarjeta que toma la deuda
    }
  | {
      op: 'OP-23';
      tarjeta: string;
      monto: number;
      origen?: string;
      fecha?: string;
      etiqueta?: string;
    }
  | { op: 'OP-06'; cuenta: string } // eliminar la cuenta
  | {
      op: 'OP-09'; // archivar: `destino` = 'LPA' o una categoría
      categoria: string;
      destino?: string;
      devolverFuturas?: true;
      desactivar?: string[]; // etiquetas de las programadas que se desactivan
    }
  | { op: 'OP-11'; categoria: string; monto: number; destino: string } // sacar de una archivada: 'LPA' o una categoría
  | { op: 'OP-12'; origen: string; destino: string } // fusionar categorías
  | {
      op: 'OP-24'; // cuota de préstamo desde `origen` (por defecto Ahorro)
      prestamo: string;
      categoria: string;
      capital: number;
      interes: number;
      seguro: number;
      origen?: string;
    }
  | {
      op: 'OP-42'; // programada de gasto mensual, a una categoría y sin registro automático
      etiqueta: string;
      cuenta: string;
      comercio: string;
      monto: number;
      categoria: string;
      primeraFecha: string;
    }
  | {
      op: 'OP-35'; // SMS de compra de la tarjeta `cuenta`; `recibido` = instante local de recepción
      etiqueta: string;
      cuenta: string;
      monto: number;
      comercio: string;
      recibido: string;
      fecha: string;
    }
  | { op: 'OP-37'; etiqueta: string; categoria: string; aprobado: string } // aprobar con categoría (CF-21)
  | {
      op: 'OP-47'; // terminar la conciliación de `cuenta` con el estado de cuenta (montos con signo de efecto)
      cuenta: string;
      fecha: string;
      saldo: number;
      movimientos: { indice: number; fecha: string; monto: number }[];
      coincidencias: { etiqueta: string; indice: number }[];
    };

/** `hoy`: el día en que se hace esa operación dentro del paso (un historial que cruza períodos: no se asigna a uno cerrado). */
export type Op = OpBase & { hoy?: string };

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
  extra: Record<string, number>; // las consultas de `espera.extra` que este ejecutor evalúa
  rechazo?: string; // código del rechazo, si alguna operación del paso se rechazó
  intacto?: boolean; // con un rechazo: la instantánea completa quedó igual (regla 7)
}
