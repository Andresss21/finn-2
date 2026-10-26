// Contrato de `aplicar` (04 §2.4, §7.5): comando, cambios, rechazos, impacto y avisos.
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type { FilasPorTabla, Prestamo } from './filas';
import type { Hechos } from './hechos';
import type { Uuid } from './identificadores';

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

/** Comando que entiende `aplicar`. Cada OP agrega su variante al implementarse. */
export type ComandoDominio = ComandoOp48;

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
