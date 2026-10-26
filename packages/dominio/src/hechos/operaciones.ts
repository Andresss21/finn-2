// Contrato de `aplicar` (04 §2.4, §7.5): comando, cambios, rechazos, impacto y avisos.
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type {
  Cuenta,
  FilasPorTabla,
  Inversion,
  Meta,
  Movimiento,
  MovimientoLinea,
  Prestamo,
  ReglaComercio,
  Tarjeta,
} from './filas';
import type { OrigenTransaccion, TipoMovimientoBancario } from './enums';
import type { Hechos } from './hechos';
import type { DecimalTexto, GeneradorIds, Instante, Uuid } from './identificadores';

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

/** OP-07 (04 §3.2): un grupo o una categoría; la variante en lote (CF-19) es una lista de estos. */
export interface ElementoOp07 {
  readonly id: Uuid;
  readonly tipo: 'grupo' | 'categoria';
  readonly nombre: string;
  readonly grupoId?: Uuid; // solo en una categoría
}
export interface ComandoOp07 extends ElementoOp07 {
  readonly operacion: 'OP-07';
}
/** OP-08: valor absoluto; el `esperado` (4.6.2) lo compara la aplicación bajo el bloqueo. */
export interface ComandoOp08 {
  readonly operacion: 'OP-08';
  readonly tipo: 'grupo' | 'categoria';
  readonly id: Uuid;
  readonly nombre?: string;
  readonly grupoId?: Uuid; // solo en una categoría
  readonly orden?: number; // posición pedida en su lista, desde 1
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
export interface ComandoOp10 {
  readonly operacion: 'OP-10';
  readonly categoriaId: Uuid;
  readonly desarchivarGrupo?: boolean;
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
export interface ComandoOp13 {
  readonly operacion: 'OP-13';
  readonly accion: 'eliminar_categoria' | 'eliminar_grupo' | 'archivar_grupo';
  readonly id: Uuid;
  readonly reglas?: readonly ReglaComercio[]; // las de la categoría, [H] (BE-10)
}
// ── TA-116: presupuesto y metas (04 §3.3). `esperado` lo compara la aplicación (4.6.2).
/** OP-14: valor absoluto de Asig(c, p); puede ser negativo (supuesto 6, CB-09). */
export interface ComandoOp14 {
  readonly operacion: 'OP-14';
  readonly categoriaId: Uuid;
  readonly periodoInicio: FechaLocal;
  readonly montoNuevo: Centavos;
  readonly ids: GeneradorIds;
}
export interface ComandoOp15 {
  readonly operacion: 'OP-15';
  readonly origenId: Uuid;
  readonly destinoId: Uuid;
  readonly periodoInicio: FechaLocal;
  readonly monto: Centavos; // > 0
  readonly ids: GeneradorIds;
}
export interface ComandoOp17 {
  readonly operacion: 'OP-17';
  readonly periodoInicio: FechaLocal;
  readonly categorias?: readonly Uuid[];
  readonly ids: GeneradorIds;
}
/** Atributos de una meta que se editan (01 OP-18); `fechaObjetivo: null` la quita de una anual. */
export type CamposMeta = Partial<Pick<Meta, 'monto' | 'modo' | 'fechaObjetivo'>>;
export type ComandoOp18 = { readonly operacion: 'OP-18' } & (
  | ({ readonly accion: 'crear'; readonly id: Uuid; readonly categoriaId: Uuid } & Pick<
      Meta,
      'tipo' | 'monto'
    > &
      CamposMeta)
  | ({ readonly accion: 'editar'; readonly metaId: Uuid } & CamposMeta)
  | { readonly accion: 'eliminar'; readonly metaId: Uuid }
);

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

// ── TA-117: registrar transacciones (04 §3.4). Los montos llegan > 0 (MontoTexto, CB-28).
/** Lo común de las altas (PT, 04 §3.0.4); `origen` por defecto es `manual`. */
export interface AltaTransaccion {
  readonly id: Uuid;
  readonly instante: Instante;
  readonly ids: GeneradorIds;
  readonly fecha: FechaLocal;
  readonly total: Centavos;
  readonly comercio?: string;
  readonly nota?: string;
  readonly monedaOriginal?: string; // junto con montoOriginal (M4)
  readonly montoOriginal?: DecimalTexto;
  readonly origen?: OrigenTransaccion;
}
/** Destino de una línea (04 §3.0.2); `deudorNuevo` reutiliza el deudor con ese nombre. */
export type DestinoLinea =
  { readonly categoriaId: Uuid } | { readonly deudorId: Uuid } | { readonly deudorNuevo: string };
export interface ComandoOp20 extends AltaTransaccion {
  readonly operacion: 'OP-20';
  readonly cuentaId: Uuid;
  readonly lineas: readonly { readonly monto: Centavos; readonly destino: DestinoLinea }[];
}
export interface ComandoOp21 extends AltaTransaccion {
  readonly operacion: 'OP-21';
  readonly cuentaId: Uuid;
}
export interface ComandoOp22 extends AltaTransaccion {
  readonly operacion: 'OP-22';
  readonly origenId: Uuid;
  readonly destinoId: Uuid;
}
export interface ComandoOp23 extends AltaTransaccion {
  readonly operacion: 'OP-23';
  readonly origenId: Uuid;
  readonly tarjetaId: Uuid;
}
/** OP-24: el desglose es el que confirmó el usuario (el propuesto por el modelo, o corregido). */
export interface ComandoOp24 extends AltaTransaccion {
  readonly operacion: 'OP-24';
  readonly modalidad: 'cuota' | 'abono';
  readonly origenId: Uuid;
  readonly prestamoId: Uuid;
  readonly categoriaId: Uuid;
  readonly capital: Centavos;
  readonly interes: Centavos;
  readonly seguro: Centavos;
}
export type ComandoOp27 = AltaTransaccion & {
  readonly operacion: 'OP-27';
  readonly tarjetaId: Uuid;
} & (
    | { readonly modalidad: 'avance'; readonly cuentaId: Uuid }
    | { readonly modalidad: 'entrada' }
    | { readonly modalidad: 'transferencia_deuda'; readonly tarjetaDestinoId: Uuid }
  );

// ── TA-118: editar, eliminar y estado bancario (04 §3.4). `esperado` lo compara la aplicación (4.6.2).
/** Una línea de la lista completa de OP-28: con `lineaId` se conserva; sin `destino`, el suyo. */
export interface LineaEditada {
  readonly lineaId?: Uuid;
  readonly monto: Centavos;
  readonly destino?: DestinoLinea; // obligatorio en una línea nueva
}
/**
 * OP-28: solo los campos que cambian. Con un efecto movible, `cuentaId`; con dos, `origenId` (el
 * efecto negativo) y `destinoId` (el positivo). El efecto sobre el préstamo de una cuota sigue al
 * desglose.
 */
export interface ComandoOp28 {
  readonly operacion: 'OP-28';
  readonly transaccionId: Uuid;
  readonly instante: Instante;
  readonly ids: GeneradorIds;
  readonly fecha?: FechaLocal;
  readonly total?: Centavos;
  readonly cuentaId?: Uuid;
  readonly origenId?: Uuid;
  readonly destinoId?: Uuid;
  readonly lineas?: readonly LineaEditada[];
  readonly comercio?: string | null;
  readonly nota?: string | null;
  readonly monedaOriginal?: string | null; // junto con montoOriginal (M4)
  readonly montoOriginal?: DecimalTexto | null;
  readonly desglose?: {
    readonly capital: Centavos;
    readonly interes: Centavos;
    readonly seguro: Centavos;
  };
}
/** OP-29: los movimientos [H] con `transaccion_id` = la transacción los resuelve la aplicación (BE-10). */
export interface ComandoOp29 {
  readonly operacion: 'OP-29';
  readonly transaccionId: Uuid;
  readonly instante: Instante;
  readonly ids: GeneradorIds;
  readonly movimientos: readonly Movimiento[];
}
export interface ComandoOp30 {
  readonly operacion: 'OP-30';
  readonly transaccionId: Uuid;
  readonly estadoNuevo: 'pendiente' | 'confirmada';
}

// ── TA-119: cobrar y renombrar deudor (04 §3.5). `esperado` de OP-52 lo compara la aplicación (4.6.2).
/** OP-31: con `asignarAPagoTarjeta`, la misma operación asigna R a pago(t) en el activo (BE-36). */
export interface ComandoOp31 extends AltaTransaccion {
  readonly operacion: 'OP-31';
  readonly lineaId: Uuid; // la línea por cobrar
  readonly cuentaId: Uuid; // efectivo o tarjeta
  readonly asignarAPagoTarjeta?: boolean; // solo si el por cobrar fue con tarjeta y C entra en efectivo
}
export interface ComandoOp52 {
  readonly operacion: 'OP-52';
  readonly deudorId: Uuid;
  readonly nombre: string; // TextoLimpio
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
  | ComandoOp08
  | ComandoOp09
  | ComandoOp10
  | ComandoOp11
  | ComandoOp12
  | ComandoOp13
  | ComandoOp14
  | ComandoOp15
  | ComandoOp17
  | ComandoOp18
  | ComandoOp48
  // TA-120
  | ComandoOp35
  // TA-117
  | ComandoOp20
  | ComandoOp21
  | ComandoOp22
  | ComandoOp23
  | ComandoOp24
  | ComandoOp27
  // TA-118
  | ComandoOp28
  | ComandoOp29
  | ComandoOp30
  // TA-119
  | ComandoOp31
  | ComandoOp52;

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
