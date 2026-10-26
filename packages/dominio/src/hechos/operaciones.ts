// Contrato de `aplicar` (04 §2.4, §7.5): comando, cambios, rechazos, impacto y avisos.
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type {
  Cuenta,
  FilasPorTabla,
  Inversion,
  Movimiento,
  MovimientoLinea,
  Prestamo,
  ReglaComercio,
  Tarjeta,
} from './filas';
import type { Hechos } from './hechos';
import type { TipoMovimientoBancario } from './enums';
import type { GeneradorIds, Instante, Uuid } from './identificadores';

/** Tablas [M] y [H] que una operación puede escribir (03 §0.4). */
export type TablaEscribible = keyof FilasPorTabla;

/** Fila de cualquiera de las tablas escribibles. */
export type FilaHecho = FilasPorTabla[TablaEscribible];

/** Campos editables de un préstamo (04 OP-48: los de `prestamos` salvo `cuenta_id` y `tipo`). */
export type CamposPrestamo = Omit<Prestamo, 'cuentaId' | 'tipo' | 'revision'>;

/** OP-48 (04 §3.9): valor absoluto; `esperado` trae lo que vio la interfaz (4.6.2). */
export interface ComandoOp48 {
  readonly operacion: 'OP-48';
  readonly prestamoId: Uuid;
  readonly campos: Partial<CamposPrestamo>;
  readonly esperado: Partial<CamposPrestamo>;
}

/** Atributos de un subtipo de cuenta que trae la entrada (sin `cuentaId` ni `revision`). */
type Sub<T> = Omit<T, 'cuentaId' | 'revision'>;
export type SubtipoCuenta = Sub<Tarjeta> | Sub<Prestamo> | Sub<Inversion>;
type Editables<T> = Partial<Omit<Sub<T>, 'tipo'>>;

/** Entrada resuelta de las OP de cuentas (04 §3.1, BE-10); la aplicación agrega id, instante e ids. */
export interface ComandoOp01 {
  readonly operacion: 'OP-01';
  readonly id: Uuid;
  readonly instante: Instante;
  readonly ids: GeneradorIds;
  readonly cuenta: Pick<Cuenta, 'tipo' | 'nombre' | 'institucionId' | 'ultimos4'> & {
    readonly fechaApertura?: FechaLocal; // por defecto, hoy
  };
  readonly subtipo?: SubtipoCuenta; // falta solo en efectivo
  readonly saldo: Centavos; // como lo escribe el usuario: en una tarjeta, positivo = deuda
}
export interface ComandoOp02 {
  readonly operacion: 'OP-02';
  readonly cuentaId: Uuid;
  readonly instante: Instante;
  readonly ids: GeneradorIds;
  readonly campos: Partial<Pick<Cuenta, 'nombre' | 'institucionId' | 'ultimos4' | 'fechaApertura'>>;
  readonly subtipo?: Editables<Tarjeta> | Editables<Prestamo> | Editables<Inversion>;
}
export interface ComandoOp03 {
  readonly operacion: 'OP-03';
  readonly orden: readonly Uuid[];
}
export interface ComandoOp04 {
  readonly operacion: 'OP-04';
  readonly cuentaId: Uuid;
  readonly devolverAsignacionesFuturas?: boolean;
}
export interface ComandoOp05 {
  readonly operacion: 'OP-05';
  readonly cuentaId: Uuid;
}
export interface ComandoOp06 {
  readonly operacion: 'OP-06';
  readonly cuentaId: Uuid;
}

/** OP-07 (04 §3.2): un grupo o una categoría, la misma forma de cada elemento del lote (CF-19). */
export interface ElementoOp07 {
  readonly id: Uuid;
  readonly tipo: 'grupo' | 'categoria';
  readonly nombre: string;
  readonly grupoId?: Uuid; // solo en una categoría
}
export interface ComandoOp07 extends ElementoOp07 {
  readonly operacion: 'OP-07';
}
/** A dónde va (o de dónde sale) el dinero que se mueve: otra categoría o LPA. */
export type DestinoDinero = { readonly categoriaId: Uuid } | 'lpa';
export type DecisionProgramada =
  | { readonly programadaId: Uuid; readonly accion: 'reasignar'; readonly categoriaId: Uuid }
  | { readonly programadaId: Uuid; readonly accion: 'desactivar' };
export interface ComandoOp09 {
  readonly operacion: 'OP-09';
  readonly categoriaId: Uuid;
  readonly ids: GeneradorIds;
  readonly destinoDisponible?: DestinoDinero; // si Disp(c, A) > 0
  readonly cubrirSobregiroCon?: DestinoDinero; // si Disp(c, A) < 0
  readonly devolverAsignacionesFuturas?: boolean;
  readonly programadas?: readonly DecisionProgramada[];
}
export interface ComandoOp11 {
  readonly operacion: 'OP-11';
  readonly categoriaId: Uuid;
  readonly ids: GeneradorIds;
  readonly monto: Centavos;
  readonly destino: DestinoDinero;
}
/** OP-12: las filas [H] del origen las resuelve la aplicación (BE-10). */
export interface ComandoOp12 {
  readonly operacion: 'OP-12';
  readonly origenId: Uuid;
  readonly destinoId: Uuid;
  readonly ids: GeneradorIds;
  readonly reglas: readonly ReglaComercio[];
  readonly movimientoLineas: readonly MovimientoLinea[];
}
// ── TA-120: OP-35 Recibir SMS, pasos 2 a 11 (01 §5.6, 04 §3.6 y §8.4 c) ──
/** Un SMS ya guardado en `sms_recibidos` (03 §3.17), con lo que miran los criterios de §4.17. */
export interface SmsRecibido {
  readonly id: Uuid;
  readonly texto: string;
  readonly recibidoEn: Instante;
}
/** Un movimiento de la bandeja con el texto de su SMS (para "texto distinto", §4.17). */
export interface MovimientoConTexto extends Movimiento {
  readonly texto: string;
}
/**
 * La interpretación que hizo `@finn/sms` fuera del bloqueo (BE-45), con lo mínimo que usa el
 * dominio: el dominio no importa `@finn/sms`.
 */
export type InterpretacionSms =
  | {
      readonly resultado: 'reconocido';
      readonly institucionId: Uuid; // la del formato que coincidió
      readonly tipoMovimiento: TipoMovimientoBancario;
      readonly ultimos4: string;
      readonly monto: Centavos;
      readonly comercio: string | null;
      readonly fecha: FechaLocal | null;
    }
  | { readonly resultado: 'no_reconocido' };
/** OP-35: las filas [H] de la bandeja y los SMS anteriores los resuelve la aplicación (BE-10). */
export interface ComandoOp35 {
  readonly operacion: 'OP-35';
  readonly id: Uuid; // del movimiento
  readonly ids: GeneradorIds; // de sus líneas
  /** El SMS guardado en el paso 1, con la fecha local de `recibido_en` (`fechaLocalDeInstante`). */
  readonly sms: SmsRecibido & { readonly fechaRecepcion: FechaLocal };
  readonly interpretacion: InterpretacionSms;
  readonly anteriores: readonly SmsRecibido[]; // basta con los de los 10 minutos anteriores
  readonly movimientos: readonly MovimientoConTexto[];
  readonly reglas: readonly ReglaComercio[];
}

/** Comando que entiende `aplicar`. Cada OP agrega su variante al implementarse. */
export type ComandoDominio =
  | ComandoOp01
  | ComandoOp02
  | ComandoOp03
  | ComandoOp04
  | ComandoOp05
  | ComandoOp06
  | ComandoOp07
  | ComandoOp09
  | ComandoOp11
  | ComandoOp12
  | ComandoOp48
  // TA-120
  | ComandoOp35;

/** Cambio que consume el traductor de 04 §4.5; fila y campos se tipan según la tabla. */
export type Cambio =
  | {
      [T in TablaEscribible]: {
        readonly tipo: 'insertar';
        readonly tabla: T;
        readonly fila: FilasPorTabla[T];
      };
    }[TablaEscribible]
  | {
      [T in TablaEscribible]: {
        readonly tipo: 'actualizar';
        readonly tabla: T;
        readonly id: Uuid;
        readonly campos: Partial<FilasPorTabla[T]>;
      };
    }[TablaEscribible]
  | { readonly tipo: 'eliminar'; readonly tabla: TablaEscribible; readonly id: Uuid }
  | { readonly tipo: 'eliminarConciliacionesDeCuenta'; readonly cuentaId: Uuid }; // 03 §4.6.4, HZ-1

/**
 * Código de rechazo en snake_case, en español (04 §7.5, catálogo en 3.0.6). La unión cerrada se
 * arma con las operaciones; mientras tanto es texto.
 */
export type CodigoRechazo = string;

/** Rechazo de negocio (no es una excepción). El dominio produce códigos y datos, no textos. */
export interface Rechazo {
  readonly codigo: CodigoRechazo;
  readonly campo?: string;
  readonly datos?: Readonly<Record<string, Centavos | FechaLocal | string | number>>;
}

/** Código de aviso `AV-nn` (01 §5.0.7). */
export type CodigoAviso = `AV-${string}`;

/** Aviso que una operación incluye antes o después de confirmar (04 §3.0.5). */
export interface AvisoOperacion {
  readonly codigo: CodigoAviso;
  readonly momento: 'antes' | 'despues' | 'antes_y_despues';
  /** `true` para los avisos de la clase "antes de confirmar" (exigen la huella, 04 §4.3). */
  readonly requiereConfirmacion: boolean;
  readonly datos?: Readonly<Record<string, Centavos | FechaLocal | string | number | boolean>>;
}

/** Efecto de una operación en el período activo, comparable por igualdad estructural (04 §4.3). */
export interface Impacto {
  readonly deltaLpa: Centavos;
  readonly deltaDisponible: readonly { readonly categoriaId: Uuid; readonly delta: Centavos }[];
  readonly deltaTarjetas: readonly {
    readonly tarjetaId: Uuid;
    readonly deltaSaldo: Centavos; // Δ S(t)
    readonly deltaReserva: Centavos; // Δ RE(t)
  }[];
  readonly deltaReduccionProyectadaLpaAlCierre: Centavos;
  readonly avisos: readonly AvisoOperacion[];
}

/** Valores que fija `finn.operacion` (04 §4.4). */
export type OperacionDeclarada = 'fusion' | 'eliminar_cuenta';

export type ResultadoAplicar =
  | { readonly ok: false; readonly rechazos: readonly Rechazo[] }
  | {
      readonly ok: true;
      readonly cambios: readonly Cambio[];
      readonly operacionDeclarada?: OperacionDeclarada;
      readonly hechosNuevos: Hechos; // para la memoria (04 §5.3)
      readonly impacto: Impacto;
      readonly avisos: readonly AvisoOperacion[];
    };

/** Invariante de 01 §6 que no se cumple en una instantánea. */
export interface Violacion {
  readonly invariante: number;
  readonly detalle?: Readonly<Record<string, Centavos | FechaLocal | string | number>>;
}
