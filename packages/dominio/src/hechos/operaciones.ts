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
  Programada,
  ProgramadaLinea,
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
// ── TA-136: asignación rápida y cambiar el ciclo (04 §3.3).
/** Variantes de 01 OP-16; `cubrir_sobregiro` es la de CF-25. */
export type VarianteAsignacionRapida =
  'falta_meta' | 'igual_periodo_anterior' | 'promedio_gasto' | 'cubrir_sobregiro';
/** OP-16: el dominio calcula el valor y lo aplica con OP-14. */
export interface ComandoOp16 {
  readonly operacion: 'OP-16';
  readonly categoriaId: Uuid;
  readonly periodoInicio: FechaLocal;
  readonly variante: VarianteAsignacionRapida;
  readonly ids: GeneradorIds;
}
/** OP-19: nuevo día de inicio (1 a 31); R lo calcula el dominio (01 §4.2 punto 9). */
export interface ComandoOp19 {
  readonly operacion: 'OP-19';
  readonly diaInicio: number;
  readonly ids: GeneradorIds;
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

// ── TA-137: inversiones y desembolso (04 §3.4).
/** OP-25: en el ajuste, `total` lleva signo (MontoTextoConSigno ≠ 0) y no hay cuenta de efectivo. */
export type ComandoOp25 = AltaTransaccion & {
  readonly operacion: 'OP-25';
  readonly inversionId: Uuid;
} & (
    | { readonly modalidad: 'aporte'; readonly cuentaId: Uuid; readonly categoriaId: Uuid }
    | { readonly modalidad: 'retiro'; readonly cuentaId: Uuid }
    | { readonly modalidad: 'ajuste' }
  );
export interface ComandoOp26 extends AltaTransaccion {
  readonly operacion: 'OP-26';
  readonly prestamoId: Uuid;
  readonly cuentaId: Uuid;
}

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

// ── TA-138: condonar, devolver y eliminar evento (04 §3.5).
export interface ComandoOp32 {
  readonly operacion: 'OP-32';
  readonly id: Uuid; // de la condonación
  readonly instante: Instante; // su clave de orden
  readonly lineaId: Uuid; // la línea por cobrar
  readonly monto: Centavos;
  readonly fecha: FechaLocal;
  readonly categoriaId: Uuid;
}
/** OP-33a, vinculada a una compra: `cuentaId` por defecto, la de la compra. */
export interface ComandoOp33a extends AltaTransaccion {
  readonly operacion: 'OP-33';
  readonly transaccionOriginalId: Uuid;
  readonly cuentaId?: Uuid;
  readonly reparto: readonly { readonly lineaId: Uuid; readonly monto: Centavos }[];
}
/** OP-33b, sin compra original: una línea a la categoría (D-2 o D-4). */
export interface ComandoOp33b extends AltaTransaccion {
  readonly operacion: 'OP-33';
  readonly transaccionOriginalId?: never;
  readonly cuentaId: Uuid;
  readonly categoriaId: Uuid;
}
export type ComandoOp33 = ComandoOp33a | ComandoOp33b;
/** OP-34; los movimientos [H] de la transacción del evento los resuelve la aplicación, como en OP-29. */
export type ComandoOp34 = Omit<ComandoOp29, 'operacion' | 'transaccionId'> & {
  readonly operacion: 'OP-34';
} & (
    | { readonly tipo: 'cobro' | 'devolucion'; readonly transaccionId: Uuid }
    | { readonly tipo: 'condonacion'; readonly condonacionId: Uuid }
  );

// ── TA-123: conciliación y verificar saldo (04 §3.8, §9.5). La firma de la carga la verifica la aplicación (BE-49).
/** Un movimiento del estado de cuenta; `monto` con signo, como efecto en la cuenta. */
export interface MovimientoDelEstado {
  readonly indice: number; // posición en el archivo (04 §9.2)
  readonly fecha: FechaLocal;
  readonly monto: Centavos;
}
/** El contenido de la carga firmada de OP-45; `saldoFinal` en la convención de 01 §0.4. */
export interface EstadoDeCuenta {
  readonly fechaEstado: FechaLocal;
  readonly saldoFinal: Centavos;
  readonly movimientos: readonly MovimientoDelEstado[];
}
/** Las altas que ejecuta OP-46 (01 §5.8: "OP-20 u otra operación según el tipo"). */
export type AltaDesdeEstado =
  ComandoOp20 | ComandoOp21 | ComandoOp22 | ComandoOp23 | ComandoOp24 | ComandoOp27 | ComandoOp31;
/** OP-46: la fecha y el origen del alta los fija el movimiento (`importada`, `confirmada`). */
export interface ComandoOp46 {
  readonly operacion: 'OP-46';
  readonly cuentaId: Uuid;
  readonly estado: EstadoDeCuenta;
  readonly movimientoIndice: number;
  readonly alta: AltaDesdeEstado;
}
export interface ComandoOp47 {
  readonly operacion: 'OP-47';
  readonly id: Uuid; // de la conciliación
  readonly instante: Instante;
  readonly cuentaId: Uuid;
  readonly estado: EstadoDeCuenta;
  readonly coincidencias: readonly {
    readonly transaccionId: Uuid;
    readonly movimientoIndice: number;
  }[];
}
/** OP-53 (CF-01): `saldoEstado` como lo escribe el usuario; en una tarjeta, positivo = deuda. */
export interface ComandoOp53 {
  readonly operacion: 'OP-53';
  readonly id: Uuid; // de la conciliación
  readonly instante: Instante;
  readonly cuentaId: Uuid;
  readonly fechaEstado: FechaLocal;
  readonly saldoEstado: Centavos;
  readonly marcar: { readonly todas: true } | { readonly ids: readonly Uuid[] };
}

// ── TA-121: editar, aprobar y resolver movimientos (04 §3.6). `esperado` lo compara la aplicación (4.6.2).
/** El movimiento [H] y sus líneas, que resuelve la aplicación (BE-10). */
export interface MovimientoConLineas {
  readonly movimiento: Movimiento;
  readonly lineas: readonly MovimientoLinea[];
}
/** Destino de una línea de movimiento (04 OP-36); sin destino, la línea queda sin destino. */
export type DestinoMovimiento = DestinoLinea | { readonly lineaOriginalId: Uuid };
/** OP-36: solo los campos que cambian; `lineas` es la lista completa. */
export interface ComandoOp36 extends MovimientoConLineas {
  readonly operacion: 'OP-36';
  readonly ids: GeneradorIds;
  readonly campos: Partial<
    Pick<Movimiento, 'cuentaId' | 'fecha' | 'monto' | 'comercio' | 'tipoPropuesto' | 'nota'>
  >;
  readonly lineasNuevas?: readonly {
    readonly monto: Centavos;
    readonly destino?: DestinoMovimiento;
  }[];
}
/** Lo que OP-37 agrega al movimiento (también la confirmación de OP-40). */
export interface AprobacionMovimiento {
  readonly id: Uuid; // de la transacción nueva; no se usa si se vincula a una registrada
  readonly instante: Instante; // de la operación (cambio posterior de una registrada conciliada)
  readonly recibidoEn: Instante; // del SMS: hora de registro y clave de orden (D2)
  readonly ids: GeneradorIds;
  readonly origenId?: Uuid; // obligatorio en un pago de tarjeta
  readonly recordarRegla?: boolean;
  readonly reglas?: readonly ReglaComercio[]; // las actuales, con `recordarRegla`
}
/** OP-37; con `categoriaId`, la variante "aprobar con categoría" (CF-21), sin `recordarRegla`. */
export interface ComandoOp37 extends MovimientoConLineas, AprobacionMovimiento {
  readonly operacion: 'OP-37';
  readonly categoriaId?: Uuid;
}
/** OP-40: para rechazar una coincidencia, la bandeja y el texto del SMS (duplicados, §4.17). */
export type ComandoOp40 = MovimientoConLineas & { readonly operacion: 'OP-40' } & (
    | ({ readonly decision: 'confirmar_coincidencia' } & AprobacionMovimiento)
    | {
        readonly decision: 'rechazar_coincidencia';
        readonly texto: string;
        readonly movimientos: readonly MovimientoConTexto[];
      }
    | { readonly decision: 'es_legitimo' | 'es_duplicado' }
  );

// ── TA-122: descartar, reglas, reprocesar y crear a mano (04 §3.6). OP-38 es un lote (`op38`).
/** OP-39; para restaurar, la bandeja y el texto del SMS (pasos 7 y 8 de OP-35, §4.17). */
export type ComandoOp39 = { readonly operacion: 'OP-39'; readonly movimiento: Movimiento } & (
  | { readonly accion: 'descartar' }
  | {
      readonly accion: 'restaurar';
      readonly texto: string;
      readonly movimientos: readonly MovimientoConTexto[];
    }
);
/** OP-41; `reglas` son las actuales, que la aplicación lee bajo el bloqueo (7.4). */
export type ComandoOp41 = {
  readonly operacion: 'OP-41';
  readonly reglas: readonly ReglaComercio[];
} & (
  | {
      readonly accion: 'crear';
      readonly id: Uuid;
      readonly patron: string;
      readonly categoriaId: Uuid;
    }
  | {
      readonly accion: 'editar';
      readonly reglaId: Uuid;
      readonly patron?: string;
      readonly categoriaId?: Uuid;
    }
  | { readonly accion: 'eliminar'; readonly reglaId: Uuid }
);
/** OP-49: OP-35 sobre el mismo SMS, con su instante de recepción original (N-02), y su movimiento. */
export interface ComandoOp49 extends Omit<ComandoOp35, 'operacion' | 'id'>, MovimientoConLineas {
  readonly operacion: 'OP-49';
}
/** OP-50: OP-37 sobre un movimiento en `error` (N-02 punto 3), sin la variante de CF-21. */
export interface ComandoOp50 extends MovimientoConLineas, AprobacionMovimiento {
  readonly operacion: 'OP-50';
}

// ── TA-139: transacciones programadas (04 §3.7). `esperado` de editar lo compara la aplicación (4.6.2).
/** Una línea de una programada (03 §3.24): solo a categorías normales y activas. */
export type LineaProgramada = Pick<ProgramadaLinea, 'monto' | 'categoriaId'>;
/** Los campos de una programada que trae la entrada (sin id, estado, reactivación ni revisión). */
export type CamposProgramada = Omit<Programada, 'id' | 'activa' | 'reactivadaDesde' | 'revision'>;
/**
 * OP-42; editar trae solo los campos que cambian y, si cambian, la lista completa de líneas.
 * `coincidencias`: movimientos y SMS procesados con esta programada como esperada, [H] (BE-10).
 */
export type ComandoOp42 = { readonly operacion: 'OP-42' } & (
  | ({
      readonly accion: 'crear';
      readonly id: Uuid;
      readonly ids: GeneradorIds;
    } & CamposProgramada & {
        readonly lineas: readonly LineaProgramada[];
      })
  | {
      readonly accion: 'editar';
      readonly programadaId: Uuid;
      readonly ids: GeneradorIds;
      readonly campos?: Partial<Omit<CamposProgramada, 'tipo'>>;
      readonly lineas?: readonly LineaProgramada[];
      readonly coincidencias: number;
    }
  | { readonly accion: 'activar'; readonly programadaId: Uuid; readonly activa: boolean }
);
/** OP-43 de un toque; sin campos editables, los de la programada (el automático, `op43Automatico`). */
export interface ComandoOp43 {
  readonly operacion: 'OP-43';
  readonly programadaId: Uuid;
  readonly fechaEsperada: FechaLocal;
  readonly id: Uuid; // de la transacción
  readonly instante: Instante;
  readonly ids: GeneradorIds;
  readonly monto?: Centavos;
  readonly lineas?: readonly LineaProgramada[]; // solo en un gasto
  readonly desglose?: {
    readonly capital: Centavos;
    readonly interes: Centavos;
    readonly seguro: Centavos;
  };
}
export interface ComandoOp44 {
  readonly operacion: 'OP-44';
  readonly id: Uuid; // de la resolución
  readonly programadaId: Uuid;
  readonly fechaEsperada: FechaLocal;
}
/** OP-51; `referencias`: filas de `movimientos` y `sms_procesamientos` que la apuntan, [H] (BE-10). */
export interface ComandoOp51 {
  readonly operacion: 'OP-51';
  readonly programadaId: Uuid;
  readonly referencias: number;
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
  | ComandoOp52
  // TA-123
  | ComandoOp46
  | ComandoOp47
  | ComandoOp53
  // TA-121
  | ComandoOp36
  | ComandoOp37
  | ComandoOp40
  // TA-122
  | ComandoOp39
  | ComandoOp41
  | ComandoOp49
  | ComandoOp50
  // TA-137
  | ComandoOp25
  | ComandoOp26
  // TA-136
  | ComandoOp16
  | ComandoOp19
  // TA-138
  | ComandoOp32
  | ComandoOp33
  | ComandoOp34
  // TA-139
  | ComandoOp42
  | ComandoOp43
  | ComandoOp44
  | ComandoOp51;

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
