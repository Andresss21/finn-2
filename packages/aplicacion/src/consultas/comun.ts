// Forma común de una consulta (04 §2.3.2, §5.1, §6.0.1, §6.0.2): sesión (CH-29), parámetros con Zod, `leer()`, la
// instantánea de la memoria (5.3) y el `Encabezado`. La consulta solo filtra y arma el DTO con selectores del dominio
// (inv. 27); lo que falla se lanza como `ExcepcionFinn` (CP-13). El "hoy" es el de la base (`finn.hoy()`), nunca el reloj.
import type { z } from 'zod';
import { calcular, type Instantanea } from '@finn/dominio';
import { periodoActivo, type PeriodoDto } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import {
  cargarHechos,
  contarBandeja,
  contarNoLeidas,
  escribirTecnico,
  leer as leerDb,
  registrarEvento,
  sanearMensaje,
  type ContadoresDeBandeja,
  type LectorTx,
  type Memoria,
  type NuevoEvento,
  type OpcionesTx,
} from '@finn/db';
import { exigirSesionLectura, type SesionServidor } from '../autenticacion/autorizar.ts';
import { errorDeBase } from '../errores-de-base.ts';
import {
  errorDeValidacion,
  ExcepcionFinn,
  mensajeDeRechazo,
  mensajeInterno,
  type ErrorFinn,
} from '../errores/index.ts';

/** 04 §6.0.2. */
export interface Encabezado {
  readonly revision: string;
  readonly hoy: FechaLocal;
  readonly periodoActivo: PeriodoDto;
  readonly notificacionesNoLeidas: number;
  /** [F5] CP-2: la suma de los cinco contadores de la bandeja. */
  readonly bandejaPorRevisar: number;
}

/** Colaboradores de una consulta; lo que no se pasa usa @finn/db. */
export interface DepsConsulta {
  /** La memoria de la instancia (04 §5.3), la misma que usan las operaciones. */
  readonly memoria: Memoria;
  readonly sesion: SesionServidor;
  /** `FINN_USUARIO_ID`, ya validado por la configuración. */
  readonly usuarioPermitido: string;
  readonly leer?: typeof leerDb;
  /** El reloj de prueba de la petición (CT-01); vacío en producción. */
  readonly opciones?: () => OpcionesTx;
  /** Registro de `eventos_sistema`; por omisión, en una transacción propia de `escribirTecnico()`, sin bloqueo (7.8). */
  readonly registrar?: (evento: NuevoEvento) => Promise<void>;
  readonly nuevoIdError?: () => string;
}

export interface ContextoConsulta {
  readonly tx: LectorTx;
  readonly i: Instantanea;
  readonly encabezado: Encabezado;
  readonly bandeja: ContadoresDeBandeja;
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const idErrorAleatorio = (): string =>
  `E-${Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CROCKFORD[b % 32]).join('')}`;

/** `NO_ENCONTRADO` con el mensaje común (04 §7). */
export const noEncontrado = (): ExcepcionFinn =>
  new ExcepcionFinn({
    categoria: 'NO_ENCONTRADO',
    codigo: 'no_encontrado',
    mensaje: mensajeDeRechazo({ codigo: 'no_encontrado' }) ?? 'no_encontrado',
  });

/** Un error inesperado: se registra con su `idError` antes de lanzar (7.8) y la respuesta no lleva el mensaje. */
async function errorInterno(e: unknown, consulta: string, d: DepsConsulta): Promise<ErrorFinn> {
  const idError = (d.nuevoIdError ?? idErrorAleatorio)();
  const error: ErrorFinn = errorDeBase(e, idError) ?? {
    categoria: 'INTERNO',
    codigo: 'interno',
    mensaje: mensajeInterno(idError),
    idError,
  };
  const evento: NuevoEvento = {
    nivel: 'error',
    origen: 'app',
    mensaje: `${error.categoria} ${error.codigo} ${consulta}`,
    datos: {
      idError,
      consulta,
      mensajeSaneado: sanearMensaje(e instanceof Error ? e.message : ''),
    },
  };
  try {
    if (d.registrar) await d.registrar(evento);
    else await escribirTecnico((tx) => registrarEvento(tx, evento), d.opciones?.() ?? {});
  } catch {
    // queda solo la excepción
  }
  return error;
}

/**
 * Ejecuta una consulta: `exigirSesionLectura()` primero, los parámetros con Zod, y `trabajo` dentro de una
 * sola transacción de `leer()` con la instantánea de la revisión que esa transacción vio.
 */
export async function consultar<P, T>(
  d: DepsConsulta,
  consulta: {
    readonly nombre: string;
    readonly contrato: z.ZodType<P>;
    readonly parametros: unknown;
  },
  trabajo: (c: ContextoConsulta, parametros: P) => T | Promise<T>,
): Promise<Awaited<T>> {
  const sesion = await exigirSesionLectura(d.sesion, d.usuarioPermitido);
  if (!sesion.ok) throw new ExcepcionFinn(sesion.error);
  const analizados = consulta.contrato.safeParse(consulta.parametros);
  if (!analizados.success) throw new ExcepcionFinn(errorDeValidacion(analizados.error.issues));
  try {
    return await (d.leer ?? leerDb)(async (tx) => {
      const { revision, hoy: hoyTexto } = tx.estado;
      const hoy = FechaLocal.desdeTexto(hoyTexto);
      const hechos = await d.memoria.hechos(revision, () => cargarHechos(tx));
      // La memoria es la de la instancia y no sabe de tipos: solo esta función guarda instantáneas en ella
      const i = d.memoria.instantanea(revision, hoyTexto, () =>
        calcular(hechos, hoy),
      ) as Instantanea;
      const bandeja = await contarBandeja(tx);
      const encabezado: Encabezado = {
        revision,
        hoy,
        periodoActivo: periodoActivo(i),
        notificacionesNoLeidas: await contarNoLeidas(tx),
        bandejaPorRevisar:
          bandeja.pendientes +
          bandeja.conCoincidencia +
          bandeja.posiblesDuplicados +
          bandeja.noReconocidos +
          bandeja.errores,
      };
      return trabajo({ tx, i, encabezado, bandeja }, analizados.data);
    }, d.opciones?.() ?? {});
  } catch (e) {
    if (e instanceof ExcepcionFinn) throw e;
    throw new ExcepcionFinn(await errorInterno(e, consulta.nombre, d));
  }
}
