// Formato único de errores (04 §7.1; BE-24). Sin código de servidor: `errores/` lo importa también la interfaz (04 §1.4).

export type CategoriaError =
  | 'VALIDACION'
  | 'DOMINIO'
  | 'REQUIERE_CONFIRMACION'
  | 'CONFLICTO'
  | 'NO_ENCONTRADO'
  | 'NO_AUTORIZADO'
  | 'OCUPADO'
  | 'INCIERTO'
  | 'INTERNO';

/** La previsualización de 4.3 la define el marco de operaciones; aquí solo viaja con su huella. */
export interface Previsualizacion {
  readonly huellaImpacto: string;
  readonly [dato: string]: unknown;
}

/** Aviso ya formateado para la interfaz (04 §3.0.5). */
export interface AvisoMostrado {
  readonly codigo: string;
  readonly mensaje: string;
}

export interface ErrorFinn {
  readonly categoria: CategoriaError;
  /** Estable: `suma_lineas_distinta`, `conflicto_id`, `FN003`… */
  readonly codigo: string;
  /** En español, listo para mostrar (7.7). */
  readonly mensaje: string;
  readonly campos?: Readonly<Record<string, string>>;
  readonly datos?: Readonly<Record<string, unknown>>;
  readonly previsualizacion?: Previsualizacion;
  /** Solo `INTERNO`, `INCIERTO` y `OCUPADO` (7.8). */
  readonly idError?: string;
}

export type ResultadoAccion<T> =
  | {
      readonly ok: true;
      readonly valor: T;
      readonly yaAplicada: boolean;
      readonly avisos: readonly AvisoMostrado[];
    }
  | { readonly ok: false; readonly error: ErrorFinn };

export const MENSAJE_VALIDACION = 'Revisá los campos marcados.';
export const MENSAJE_OCUPADO =
  'Finn está terminando otra operación. Intentá de nuevo en unos segundos.';
export const mensajeInterno = (idError: string): string =>
  `Algo salió mal y no se guardó nada. Referencia: ${idError}.`;

/** `VALIDACION` desde los `issues` de Zod: clave = ruta unida con puntos, valor = el primer mensaje (7.6). */
export function errorDeValidacion(
  issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): ErrorFinn {
  const campos: Record<string, string> = {};
  for (const { path, message } of issues) {
    const clave = path.map(String).join('.');
    if (!(clave in campos)) campos[clave] = message;
  }
  return { categoria: 'VALIDACION', codigo: 'validacion', mensaje: MENSAJE_VALIDACION, campos };
}
