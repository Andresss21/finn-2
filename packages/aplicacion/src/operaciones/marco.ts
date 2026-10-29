// Marco de operaciones (04 §2.3, §4.2 a §4.9): `previsualizar` y `confirmar` construidos con la `DefinicionOperacion`
// de cada OP/OPT. Aquí viven, una sola vez, el comando resuelto (BE-10), la huella y la confirmación (BE-13), la
// idempotencia por clase (BE-17), los reintentos (BE-18), los efectos posteriores (BE-19) y los ids (BE-31).
// Solo ve `escribir()`/`leer()` de @finn/db y sus `EscritorTx`/`LectorTx`.
import { createHash, randomBytes } from 'node:crypto';
import type { z } from 'zod';
import { aplicar as aplicarDominio, formaCanonicaDelImpacto } from '@finn/dominio';
import type {
  AvisoOperacion,
  ComandoDominio,
  GeneradorIds,
  Hechos,
  Impacto,
  Instante,
  OperacionDeclarada,
  Rechazo,
  ResultadoAplicar,
  Uuid,
} from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import {
  cargarHechos,
  escribir as escribirDb,
  leer as leerDb,
  registrarEvento,
  sanearMensaje,
  sqlstateDe,
  type DatosEvento,
  type EscritorTx,
  type LectorTx,
  type Memoria,
  type NuevoEvento,
  type OpcionesTx,
  type ValoresDeLaBase,
} from '@finn/db';
import { errorDeBase } from '../errores-de-base.ts';
import {
  errorDeValidacion,
  mensajeDeRechazo,
  mensajeInterno,
  type ErrorFinn,
  type ResultadoAccion,
} from '../errores/index.ts';
import { generadorAleatorio, generadorDerivado } from '../ids.ts';

/** Clase de idempotencia de una operación (04 §4.6). */
export type ClaseIdempotencia = 'creacion' | 'valor_absoluto' | 'eliminacion' | 'natural';

/** Lo que la comprobación de idempotencia decide, bajo el bloqueo (paso 5 de 04 §4.2). */
export type Veredicto<Salida> =
  | { readonly tipo: 'aplicar' }
  | { readonly tipo: 'ya_aplicada'; readonly salida: Salida } // misma salida que habría tenido
  | { readonly tipo: 'conflicto_id' } // creación: el id existe con datos distintos (4.6.1)
  | {
      readonly tipo: 'conflicto_desactualizado';
      readonly actuales: Readonly<Record<string, unknown>>;
    }
  | { readonly tipo: 'no_encontrado' };

/** Un efecto posterior al COMMIT (04 §4.9): push, notificación, revalidación de rutas, evento. */
export interface EfectoPosterior {
  readonly nombre: string;
  ejecutar(): Promise<void>;
}

export type Exito = Extract<ResultadoAplicar, { ok: true }>;

/** 04 §2.3.1. */
export interface DefinicionOperacion<Entrada, Resuelto, Salida> {
  readonly id: `OP-${string}` | `OPT-${string}`;
  readonly contrato: z.ZodType<Entrada>;
  readonly idempotencia: ClaseIdempotencia;
  readonly operacionDeclarada?: OperacionDeclarada;
  /** OP-06, OP-12 y OP-19 piden confirmación aunque no haya avisos previos (04 §4.3, paso 9). */
  readonly exigeConfirmacion?: boolean;
  /** El id del hecho principal que envía el cliente (4.6.1): con él, los ids secundarios son UUIDv5 (BE-31). */
  idPrincipal?(entrada: Entrada): Uuid;
  /**
   * Paso 5: compara la entrada con lo que hay, según la clase (4.6). Sin ella la operación siempre sigue. `hechos` son
   * los [M] que el marco ya tiene para esta transacción (de la `Memoria` o de su carga): la definición no los recarga.
   */
  comprobarIdempotencia?(
    lector: LectorTx,
    entrada: Entrada,
    hechos: Hechos,
  ): Veredicto<Salida> | Promise<Veredicto<Salida>>;
  /** Paso 6: carga lo que `comando()` necesita y no está en los hechos [M] (BE-10); recibe los mismos `hechos`. */
  resolver(lector: LectorTx, entrada: Entrada, hechos: Hechos): Promise<Resuelto>;
  comando(resuelto: Resuelto, instante: Instante, ids: GeneradorIds): ComandoDominio;
  /** Paso 12: escrituras en tablas que el motor no modela. */
  extra?(escritor: EscritorTx, resuelto: Resuelto, resultado: Exito): Promise<void>;
  posteriores?(resultado: Exito): readonly EfectoPosterior[];
  salida(resultado: Exito, resuelto: Resuelto): Salida;
}

/** Colaboradores del marco; lo que no se pasa usa @finn/db o el valor de producción. */
export interface DepsMarco {
  /** La memoria de la instancia (04 §5.3). */
  readonly memoria: Memoria;
  readonly escribir?: typeof escribirDb;
  readonly leer?: typeof leerDb;
  readonly aplicar?: typeof aplicarDominio;
  /** La carga de los hechos [M] cuando la memoria no los tiene (04 §5.2). */
  readonly cargar?: typeof cargarHechos;
  /** El reloj de prueba de la petición (CT-01); vacío en producción. */
  readonly opciones?: () => OpcionesTx;
  /** El instante de `previsualizar`: `leer()` no lo da (el de `confirmar` es `finn.instante()`, BE-27). */
  readonly instante?: () => Instante;
  readonly pausar?: (ms: number) => Promise<void>;
  readonly azar?: () => number;
  readonly nuevoIdError?: () => string;
  /** Registro de `eventos_sistema`; por omisión, en una transacción propia de `escribir()` (ver el PR). */
  readonly registrar?: (evento: NuevoEvento) => Promise<void>;
  /** `after()` de Next (4.9); por omisión los efectos se esperan antes de responder. */
  readonly despues?: (tarea: () => Promise<void>) => void;
}

/** Resultado de `previsualizar` (04 §4.3). `huellaImpacto` es `null` si el dominio rechazó la operación. */
export interface ResultadoPrevisualizar {
  readonly revisionVista: string;
  readonly huellaImpacto: string | null;
  readonly impacto: Impacto | null;
  readonly avisos: readonly AvisoOperacion[];
  readonly rechazos: readonly Rechazo[];
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const MENSAJE_INCIERTO =
  'No pudimos confirmar si se guardó. Volvé a intentarlo; no se duplicará.';
const TOPE_REINTENTO_MS = 15_000;

/** `E-` y 6 caracteres de Crockford base32 (04 §7.8). */
const idErrorAleatorio = (): string =>
  `E-${[...randomBytes(6)].map((b) => CROCKFORD[b % 32]).join('')}`;

/** La huella de 04 §4.3: SHA-256 hexadecimal de la forma canónica del impacto y los avisos (ids nuevos como `@nueva#k`). */
export const huellaDe = (r: Pick<Exito, 'cambios' | 'impacto' | 'avisos'>): string =>
  createHash('sha256').update(formaCanonicaDelImpacto(r)).digest('hex');

/** Termina la operación sin escribir: se lanza dentro de `escribir()` para que la transacción acabe en ROLLBACK. */
class SinEscribir<T> extends Error {
  constructor(readonly fin: T) {
    super('operación terminada sin escribir');
  }
}

/** Una conexión perdida (BE-18): la base no dio SQLSTATE y el error habla de la conexión. */
const esConexion = (e: unknown): boolean => {
  const o = (typeof e === 'object' && e !== null ? e : {}) as { code?: unknown; message?: unknown };
  const t = `${typeof o.code === 'string' ? o.code : ''} ${typeof o.message === 'string' ? o.message : ''}`;
  return /\b(P1001|P1002|P1008|P1017|ECONNRESET|ECONNREFUSED|EPIPE|ETIMEDOUT)\b|Connection terminated|connection (?:closed|lost)/i.test(
    t,
  );
};

const opcionesDe = (d: DepsMarco): OpcionesTx => d.opciones?.() ?? {};
const errorDe = (
  codigo: string,
  categoria: ErrorFinn['categoria'],
  extra: Partial<ErrorFinn> = {},
) => ({ categoria, codigo, mensaje: mensajeDeRechazo({ codigo }) ?? codigo, ...extra });

/** Paso 4 de 04 §4.2: los hechos [M] de la revisión de `tx`, de la memoria o de una sola carga. */
const hechosDe = (tx: LectorTx, d: DepsMarco): Promise<Hechos> =>
  d.memoria.hechos(tx.estado.revision, () => (d.cargar ?? cargarHechos)(tx));

/** Dato `*Id` de un rechazo → el dato con el nombre que usan los mensajes (04 §3.0.6) y la tabla [M] que lo tiene. */
const NOMBRADOS = {
  cuentaId: ['cuenta', 'cuentas'],
  categoriaId: ['categoria', 'categorias'],
  grupoId: ['grupo', 'grupos'],
  deudorId: ['deudor', 'deudores'],
} as const;

/**
 * Los rechazos con el nombre de cada `*Id` reconocido agregado a `datos` (04 §3.0.6: el texto entre llaves es un dato
 * del rechazo). El dominio entrega ids; el nombre sale de los hechos que el marco ya cargó. Un dato que el dominio ya
 * puso no se pisa.
 */
function conNombres(rechazos: readonly Rechazo[], hechos: Hechos): readonly Rechazo[] {
  return rechazos.map((r) => {
    const datos = r.datos;
    if (datos === undefined) return r;
    const nombres: Record<string, string> = {};
    for (const [clave, [dato, tabla]] of Object.entries(NOMBRADOS)) {
      const id = datos[clave];
      if (id === undefined || dato in datos) continue;
      const filas: readonly { readonly id: string; readonly nombre: string }[] = hechos[tabla];
      const fila = filas.find((f) => f.id === id);
      if (fila !== undefined) nombres[dato] = fila.nombre;
    }
    return Object.keys(nombres).length === 0 ? r : { ...r, datos: { ...datos, ...nombres } };
  });
}

/** Pasos 6 y 7 de 04 §4.2 (5 y 6 de 4.3): comando resuelto y `aplicar` sobre los hechos del paso 4. */
async function aplicarEn<E, R, S>(
  def: DefinicionOperacion<E, R, S>,
  entrada: E,
  tx: LectorTx,
  hechos: Hechos,
  instante: Instante,
  d: DepsMarco,
): Promise<{ resuelto: R; resultado: ResultadoAplicar }> {
  const resuelto = await def.resolver(tx, entrada, hechos);
  const ids = def.idPrincipal ? generadorDerivado(def.idPrincipal(entrada)) : generadorAleatorio();
  const comando = def.comando(resuelto, instante, ids);
  const hoy = FechaLocal.desdeTexto(tx.estado.hoy);
  const resultado = (d.aplicar ?? aplicarDominio)(hechos, comando, hoy);
  return {
    resuelto,
    resultado: resultado.ok
      ? resultado
      : { ...resultado, rechazos: conNombres(resultado.rechazos, hechos) },
  };
}

const interno = (codigo: string, idError: string): ErrorFinn => ({
  categoria: 'INTERNO',
  codigo,
  mensaje: mensajeInterno(idError),
  idError,
});

/** Un rechazo del dominio como `ErrorFinn` (7.5). `invariante_violada` es un error interno. */
function errorDeRechazos(rechazos: readonly Rechazo[], idError: string): ErrorFinn {
  const primero = rechazos[0];
  if (primero === undefined || primero.codigo === 'invariante_violada')
    return interno('invariante_violada', idError);
  const texto = (r: Rechazo): string => mensajeDeRechazo(r) ?? r.codigo;
  const campos: Record<string, string> = {};
  for (const r of rechazos)
    if (r.campo !== undefined && !(r.campo in campos)) campos[r.campo] = texto(r);
  return {
    categoria: primero.codigo === 'no_encontrado' ? 'NO_ENCONTRADO' : 'DOMINIO',
    codigo: primero.codigo,
    mensaje: texto(primero),
    ...(Object.keys(campos).length > 0 ? { campos } : {}),
  };
}

type Contexto = { operacion: string; idError: string; inicio: number; revision?: string };
const contexto = (operacion: string, d: DepsMarco): Contexto => ({
  operacion,
  idError: (d.nuevoIdError ?? idErrorAleatorio)(),
  inicio: performance.now(),
});

/** Registro best-effort de un evento: nunca cambia la respuesta (4.9, 7.8). */
async function registrar(d: DepsMarco, evento: NuevoEvento): Promise<void> {
  try {
    if (d.registrar) await d.registrar(evento);
    else
      await (d.escribir ?? escribirDb)(async (tx) => {
        await registrarEvento(tx, evento);
      }, opcionesDe(d));
  } catch {
    // queda solo la respuesta al usuario
  }
}

const evento = (
  d: DepsMarco,
  c: Contexto,
  nivel: NuevoEvento['nivel'],
  mensaje: string,
  datos: DatosEvento = {},
) =>
  registrar(d, {
    nivel,
    origen: 'app',
    mensaje,
    datos: { idError: c.idError, operacion: c.operacion, ...datos },
  });

/** Traduce un error de la base o del código a `ErrorFinn` y lo registra (7.2, 7.4, 7.8). */
async function errorDeExcepcion(e: unknown, confirmado: boolean, c: Contexto, d: DepsMarco) {
  const s = sqlstateDe(e);
  const { idError } = c;
  const error: ErrorFinn =
    s === null && esConexion(e) && confirmado
      ? { categoria: 'INCIERTO', codigo: 'incierto', mensaje: MENSAJE_INCIERTO, idError }
      : (errorDeBase(e, idError) ?? interno('interno', idError));
  await evento(
    d,
    c,
    error.categoria === 'OCUPADO' ? 'aviso' : 'error',
    `${error.categoria} ${error.codigo} ${c.operacion}`,
    {
      categoria: error.categoria,
      codigo: error.codigo,
      duracionMs: Math.round(performance.now() - c.inicio),
      mensajeSaneado: sanearMensaje(e instanceof Error ? e.message : ''),
      ...s,
      ...(c.revision === undefined ? {} : { revision: c.revision }),
    },
  );
  return error;
}

/**
 * Corre `intento` con la política de 04 §4.7: un reintento tras 300–600 ms ante `55P03`/`40P01` (si el total va
 * por debajo de 15 s) o ante una conexión perdida antes del COMMIT; nunca tras un COMMIT dudoso.
 */
async function conReintentos<T>(
  intento: () => Promise<T>,
  confirmado: () => boolean,
  c: Contexto,
  d: DepsMarco,
): Promise<{ ok: true; valor: T } | { ok: false; error: unknown }> {
  for (let n = 0; ; n++) {
    try {
      return { ok: true, valor: await intento() };
    } catch (e) {
      if (e instanceof SinEscribir) return { ok: true, valor: e.fin as T };
      const s = sqlstateDe(e);
      const reintentable =
        s?.sqlstate === '55P03' ||
        s?.sqlstate === '40P01' ||
        (s === null && esConexion(e) && !confirmado());
      if (n > 0 || !reintentable || performance.now() - c.inicio >= TOPE_REINTENTO_MS)
        return { ok: false, error: e };
      const ms = 300 + (d.azar ?? Math.random)() * 300;
      await (d.pausar ?? ((t) => new Promise<void>((r) => setTimeout(r, t))))(ms);
    }
  }
}

/** 04 §4.3, `previsualizar(entrada)`: en `leer()`, sin bloqueo, sin persistir. */
export async function previsualizar<E, R, S>(
  def: DefinicionOperacion<E, R, S>,
  cruda: unknown,
  d: DepsMarco,
): Promise<ResultadoAccion<ResultadoPrevisualizar>> {
  const analizada = def.contrato.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  if (!d.instante) throw new Error('previsualizar necesita DepsMarco.instante');
  const instante = d.instante;
  const c = contexto(def.id, d);
  const r = await conReintentos(
    () =>
      (d.leer ?? leerDb)(async (tx): Promise<ResultadoPrevisualizar> => {
        c.revision = tx.estado.revision;
        const hechos = await hechosDe(tx, d);
        const { resultado } = await aplicarEn(def, analizada.data, tx, hechos, instante(), d);
        const vista = { revisionVista: tx.estado.revision, rechazos: [] };
        return resultado.ok
          ? {
              ...vista,
              huellaImpacto: huellaDe(resultado),
              impacto: resultado.impacto,
              avisos: resultado.avisos,
            }
          : {
              ...vista,
              huellaImpacto: null,
              impacto: null,
              avisos: [],
              rechazos: resultado.rechazos,
            };
      }, opcionesDe(d)),
    () => false,
    c,
    d,
  );
  if (!r.ok) return { ok: false, error: await errorDeExcepcion(r.error, false, c, d) };
  return { ok: true, valor: r.valor, yaAplicada: false, avisos: [] };
}

type Fin<S> =
  | { tipo: 'error'; error: ErrorFinn; conflictoId?: true }
  | { tipo: 'ya_aplicada'; salida: S }
  | {
      tipo: 'escrito';
      salida: S;
      resultado: Exito;
      revision: string;
      valores: ValoresDeLaBase;
      efectos: readonly EfectoPosterior[];
    };

/** 04 §4.3, `confirmar(entrada & { revisionVista?, huellaImpacto? })`: la secuencia de 04 §4.2. */
export async function confirmar<E, R, S>(
  def: DefinicionOperacion<E, R, S>,
  cruda: unknown,
  d: DepsMarco,
): Promise<ResultadoAccion<S>> {
  const { revisionVista, huellaImpacto, ...sinConfirmacion } = (cruda ?? {}) as Record<
    string,
    unknown
  >;
  const analizada = def.contrato.safeParse(sinConfirmacion);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const entrada = analizada.data;
  const c = contexto(def.id, d);
  let confirmado = false; // `callbackTerminado` de 04 §4.7: el COMMIT pudo haberse aplicado
  const terminar = (fin: Fin<S>): never => {
    throw new SinEscribir<Fin<S>>(fin);
  };

  const cuerpo = async (tx: EscritorTx): Promise<Fin<S>> => {
    confirmado = false;
    c.revision = tx.estado.revision;
    // Paso 4: una sola carga de hechos por intento, que comparten la comprobación, `resolver` y `aplicar`
    const hechos = await hechosDe(tx, d);
    // Paso 5: idempotencia por clase (4.6)
    const v = (await def.comprobarIdempotencia?.(tx, entrada, hechos)) ?? {
      tipo: 'aplicar' as const,
    };
    if (v.tipo === 'ya_aplicada') return terminar({ tipo: 'ya_aplicada', salida: v.salida });
    if (v.tipo === 'conflicto_id')
      return terminar({
        tipo: 'error',
        conflictoId: true,
        error: errorDe('conflicto_id', 'CONFLICTO'),
      });
    if (v.tipo === 'conflicto_desactualizado')
      return terminar({
        tipo: 'error',
        error: errorDe('conflicto_desactualizado', 'CONFLICTO', {
          datos: { actuales: v.actuales },
        }),
      });
    if (v.tipo === 'no_encontrado')
      return terminar({ tipo: 'error', error: errorDe('no_encontrado', 'NO_ENCONTRADO') });

    // Pasos 6 y 7; paso 8: un rechazo termina sin escribir
    const { resuelto, resultado } = await aplicarEn(
      def,
      entrada,
      tx,
      hechos,
      tx.estado.instante as Instante,
      d,
    );
    if (!resultado.ok)
      return terminar({ tipo: 'error', error: errorDeRechazos(resultado.rechazos, c.idError) });

    // Paso 9: avisos "antes de confirmar" (o la operación siempre pide confirmación) y la huella (4.3)
    const huella = huellaDe(resultado);
    const pide =
      def.exigeConfirmacion === true || resultado.avisos.some((a) => a.requiereConfirmacion);
    if (pide && huellaImpacto !== huella)
      return terminar({
        tipo: 'error',
        error: errorDe('requiere_confirmacion', 'REQUIERE_CONFIRMACION', {
          mensaje: 'Revisá el impacto antes de confirmar.',
          previsualizacion: {
            revisionVista: tx.estado.revision,
            huellaImpacto: huella,
            impacto: resultado.impacto,
            avisos: resultado.avisos,
            rechazos: [],
          },
          ...(typeof revisionVista === 'string' && revisionVista !== tx.estado.revision
            ? { datos: { revisionVista, revisionActual: tx.estado.revision } }
            : {}),
        }),
      });

    // Pasos 10 a 13
    const declarada = def.operacionDeclarada ?? resultado.operacionDeclarada;
    if (declarada) await tx.declararOperacion(declarada);
    const valores = await tx.aplicarCambios(resultado.cambios);
    await def.extra?.(tx, resuelto, resultado);
    const revision = await tx.revisionActual();
    confirmado = true; // justo antes de devolver (4.7)
    return {
      tipo: 'escrito',
      salida: def.salida(resultado, resuelto),
      resultado,
      revision,
      valores,
      efectos: def.posteriores?.(resultado) ?? [],
    };
  };

  const opciones = opcionesDe(d);
  const corrida = await conReintentos(
    () => (d.escribir ?? escribirDb)(cuerpo, opciones),
    () => confirmado,
    c,
    d,
  );
  let fin: Fin<S>;
  if (corrida.ok) fin = corrida.valor;
  else {
    d.memoria.vaciar(); // ante un error la memoria no puede asegurar su revisión
    const s = sqlstateDe(corrida.error);
    const defensa =
      def.idempotencia === 'creacion' &&
      s?.sqlstate === '23505' &&
      s.restriccion?.endsWith('_pkey');
    // Defensa de 4.6.1: la PK del hecho principal se repitió a pesar del bloqueo; se relee y se compara
    const comprobar = def.comprobarIdempotencia?.bind(def);
    const nueva =
      defensa && comprobar
        ? await (d.leer ?? leerDb)(
            async (tx) => comprobar(tx, entrada, await hechosDe(tx, d)),
            opciones,
          ).catch(() => null)
        : null;
    if (defensa) await evento(d, c, 'aviso', `23505 ${s.restriccion ?? ''} ${def.id}`);
    if (nueva?.tipo === 'ya_aplicada') fin = { tipo: 'ya_aplicada', salida: nueva.salida };
    else if (nueva?.tipo === 'conflicto_id')
      fin = { tipo: 'error', conflictoId: true, error: errorDe('conflicto_id', 'CONFLICTO') };
    else fin = { tipo: 'error', error: await errorDeExcepcion(corrida.error, confirmado, c, d) };
  }

  if (fin.tipo === 'ya_aplicada')
    return { ok: true, valor: fin.salida, yaAplicada: true, avisos: [] };
  if (fin.tipo === 'error') {
    if (fin.conflictoId) await evento(d, c, 'aviso', `CONFLICTO conflicto_id ${def.id}`);
    return { ok: false, error: fin.error };
  }

  // Paso 15: la memoria con lo que fijó la base (BE-32); si algo falta, ella misma se invalida
  d.memoria.registrarEscritura(fin.revision, fin.resultado.hechosNuevos, fin.valores);
  // Efectos posteriores (4.9): el fallo de uno se registra y no cambia la respuesta
  for (const efecto of fin.efectos) {
    const tarea = async (): Promise<void> => {
      try {
        await efecto.ejecutar();
      } catch (e) {
        const mensajeSaneado = sanearMensaje(e instanceof Error ? e.message : '');
        await evento(d, c, 'error', `EFECTO ${efecto.nombre} ${def.id}`, { mensajeSaneado });
      }
    };
    if (d.despues) d.despues(tarea);
    else await tarea();
  }
  // El texto de cada aviso (catálogo de 04 §3.0.5) lo pone la interfaz con el código; el marco no lo inventa
  const avisos = fin.resultado.avisos.map((a) => ({ codigo: a.codigo, mensaje: a.codigo }));
  return { ok: true, valor: fin.salida, yaAplicada: false, avisos };
}
