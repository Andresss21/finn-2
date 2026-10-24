// Formato de un escenario de 01 §8 como datos (DP-13, prototipo de V7-08). Montos en dólares, como en las tablas de 01;
// el ejecutor los pasa a centavos. Fechas de negocio 'AAAA-MM-DD'; instantes locales 'AAAA-MM-DDThh:mm' (America/El_Salvador).
export type Periodo = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
export const PERIODOS: Record<Periodo, string> = { P1: '2027-01-21', P2: '2027-02-21', P3: '2027-03-21', P4: '2027-04-21', P5: '2027-05-21', P6: '2027-06-21' };
export type Op =
  | { op: 'ingreso'; monto: number; fecha?: string; registrado?: string }
  | { op: 'asignar'; categoria: string; monto: number; periodo?: Periodo }              // δ, como OP-14
  | { op: 'compra'; ref: string; cuenta: string; lineas: [string, number][]; fecha?: string; registrado?: string }
  | { op: 'pagar'; tarjeta: string; monto: number; fecha?: string; registrado?: string }
  | { op: 'cambiarCuenta'; ref: string; cuenta: string };                                 // OP-28, campo cuenta
export interface Espera {
  ef?: number; lpa?: number;
  disp?: Record<string, number>;      // Disp(·, A) de la columna "Disponibles"; las no listadas deben ser 0
  fut?: number;                       // Σ asignaciones en períodos futuros ("(fut)")
  sobta?: number;
  tarjetas?: Record<string, [number, number, number]>;   // deuda · S · RE
  avisos?: string[];                  // mínimo: deben estar; la columna Notas no es exhaustiva (DP-14)
  rechazo?: string;                   // la operación se rechaza completa y nada cambia
  desglose?: { deudaAnterior: number; cargosCiclo: number; yaPagado: number; paraNoGenerarIntereses: number };
}
export interface Paso { n: string; hoy?: string; ops: Op[]; espera: Espera; alternativaDe?: string /* fila de contraste: corre en una rama */ }
export interface Escenario {
  id: string; titulo: string; refs: string[];
  hoy?: string;                        // hoy inicial; si falta, el de la base
  continua?: { escenario: string; hastaPaso: string };   // "Continúa el paso N de ESC-mm"
  cuentas?: { efectivo?: string[]; tarjetas?: { nombre: string; diaCorte?: number }[] };
  categorias?: string[];
  pasos: Paso[];
}
export const usd = (x: number) => Math.round(x * 100);
