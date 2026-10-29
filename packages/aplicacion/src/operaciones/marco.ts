// Marco de operaciones (04 §2.3, §4.2 a §4.9): `previsualizar` y `confirmar` construidos con la `DefinicionOperacion`
// de cada OP/OPT. Aquí viven, una sola vez, el comando resuelto (BE-10), la huella y la confirmación (BE-13), la
// idempotencia por clase (BE-17), los reintentos (BE-18), los efectos posteriores (BE-19) y los ids (BE-31).
// Nada de este módulo habla con Prisma: solo `escribir()`/`leer()` de @finn/db y sus `EscritorTx`/`LectorTx`.
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
  type AvisoMostrado,
  type ErrorFinn,
  type ResultadoAccion,
} from '../errores/index.ts';
import { generadorAleatorio, generadorDerivado } from '../ids.ts';

/** Clase de idempotencia de una operación (04 §4.6). */
export type ClaseIdempotencia = 'creacion' | 'valor_absoluto' | 'eliminacion' | 'natural';

/** Lo que la comprobación de idempotencia decide, bajo el bloqueo (paso 5 de 04 §4.2). */
export type Veredicto<Salida> =
  | { readonly tipo: 'aplicar' }
  /** La operación ya estaba aplicada: se responde con la salida que habría tenido, sin escribir. */
  | { readonly tipo: 'ya_aplicada'; readonly salida: Salida }
  /** Creación: el id existe con datos distintos (4.6.1). */
  | { readonly tipo: 'conflicto_id' }
  /** Valor absoluto: el valor actual no es ni el esperado ni el nuevo (4.6.2). */
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
   * Paso 5 de 04 §4.2: compara la entrada con lo que hay (por clase, 4.6) con lecturas puntuales por id. Sin ella la
   * operación siempre sigue y la unicidad de la base y el dominio rechazan lo demás.
   */
  comprobarIdempotencia?(lector: LectorTx, entrada: Entrada): Promise<Veredicto<Salida>>;
  /** Paso 6: carga lo que `comando()` necesita y no está en los hechos [M] (BE-10). */
  resolver(lector: LectorTx, entrada: Entrada): Promise<Resuelto>;
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
  /** El reloj de prueba de la petición (CT-01); vacío en producción. */
  readonly opciones?: () => OpcionesTx;
  /** El instante de `previsualizar`: `leer()` no lo da (el de `confirmar` es `finn.instante()`, BE-27). */
  readonly instante?: () => Instante;
  readonly pausar?: (ms: number) => Promise<void>;
  readonly azar?: () => number;
  readonly cronometro?: () => number;
  readonly nuevoIdError?: () => string;
  readonly generadorAleatorio?: () => GeneradorIds;
  /** Registro de `eventos_sistema`; por omisión, en una transacción propia de `escribir()` (ver el PR). */
  readonly registrar?: (evento: NuevoEvento) => Promise<void>;
  /** Texto de un aviso (catálogo de 04 §3.0.5); por omisión, su código. */
  readonly mensajeDeAviso?: (aviso: AvisoOperacion) => string;
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

/** Lo que `confirmar` acepta además de la entrada de la operación (4.3). */
export type ConfirmacionOpcional = { revisionVista?: string; huellaImpacto?: string };

const ESPERA_MINIMA_MS = 300;
const ESPERA_VARIABLE_MS = 300;
const TOPE_REINTENTO_MS = 15_000;
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const MENSAJE_INCIERTO =
  'No pudimos confirmar si se guardó. Volvé a intentarlo; no se duplicará.';
const MENSAJE_CONFIRMAR = 'Revisá el impacto antes de confirmar.';

/** `E-` y 6 caracteres de Crockford base32 (04 §7.8). */
export const nuevoIdErrorAleatorio = (): string =>
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

const esConexion = (e: unknown): boolean => {
  const o = (typeof e === 'object' && e !== null ? e : {}) as { code?: unknown; message?: unknown };
  const texto = `${typeof o.code === 'string' ? o.code : ''} ${typeof o.message === 'string' ? o.message : ''}`;
  return /\b(P1001|P1002|P1008|P1017|ECONNRESET|ECONNREFUSED|EPIPE|ETIMEDOUT)\b|Connection terminated|connection (?:closed|lost)/i.test(
    texto,
  );
};

const dep = <K extends keyof DepsMarco>(d: DepsMarco, k: K, por: NonNullable<DepsMarco[K]>) =>
  d[k] ?? por;
const opcionesDe = (d: DepsMarco): OpcionesTx => d.opciones?.() ?? {};

/** Separa `revisionVista` y `huellaImpacto` de la entrada de la operación. */
function separar(cruda: unknown): { entrada: unknown; confirmacion: ConfirmacionOpcional } {
  if (typeof cruda !== 'object' || cruda === null || Array.isArray(cruda))
    return { entrada: cruda, confirmacion: {} };
  const { revisionVista, huellaImpacto, ...entrada } = cruda as Record<string, unknown>;
  return {
    entrada,
    confirmacion: {
      ...(typeof revisionVista === 'string' ? { revisionVista } : {}),
      ...(typeof huellaImpacto === 'string' ? { huellaImpacto } : {}),
    },
  };
}

function idsDe<E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: E, d: DepsMarco): GeneradorIds {
  return def.idPrincipal
    ? generadorDerivado(def.idPrincipal(entrada))
    : dep(d, 'generadorAleatorio', generadorAleatorio)();
}

/** Pasos 4 a 7 de 04 §4.2 (3 a 6 de 4.3): hechos, comando resuelto y `aplicar`. */
async function aplicarEn<E, R, S>(
  def: DefinicionOperacion<E, R, S>,
  entrada: E,
  tx: LectorTx,
  instante: Instante,
  d: DepsMarco,
): Promise<{ resuelto: R; resultado: ResultadoAplicar }> {
  const hechos: Hechos = await d.memoria.hechos(tx.estado.revision, () => cargarHechos(tx));
  const resuelto = await def.resolver(tx, entrada);
  const comando = def.comando(resuelto, instante, idsDe(def, entrada, d));
  const hoy = FechaLocal.desdeTexto(tx.estado.hoy);
  return { resuelto, resultado: dep(d, 'aplicar', aplicarDominio)(hechos, comando, hoy) };
}

const mostrar = (d: DepsMarco, a: AvisoOperacion): AvisoMostrado => ({
  codigo: a.codigo,
  mensaje: d.mensajeDeAviso ? d.mensajeDeAviso(a) : a.codigo,
});

const errorDe = (
  codigo: string,
  categoria: ErrorFinn['categoria'],
  extra: Partial<ErrorFinn> = {},
) => ({ categoria, codigo, mensaje: mensajeDeRechazo({ codigo }) ?? codigo, ...extra });

/** Un rechazo del dominio como `ErrorFinn` (7.5). `invariante_violada` es un error interno. */
function errorDeRechazos(rechazos: readonly Rechazo[], idError: string): ErrorFinn {
  const primero = rechazos[0];
  if (primero === undefined || primero.codigo === 'invariante_violada')
    return {
      categoria: 'INTERNO',
      codigo: 'invariante_violada',
      mensaje: mensajeInterno(idError),
      idError,
    };
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

/** Registro best-effort de un evento: nunca cambia la respuesta (4.9, 7.8). */
async function registrar(d: DepsMarco, evento: NuevoEvento): Promise<void> {
  try {
    if (d.registrar) await d.registrar(evento);
    else
      await dep(
        d,
        'escribir',
        escribirDb,
      )(async (tx) => {
        await registrarEvento(tx, evento);
      }, opcionesDe(d));
  } catch {
    // queda solo la respuesta al usuario
  }
}

type Contexto = { operacion: string; idError: string; inicio: number; revision?: string };

/** Traduce un error de la base o del código a `ErrorFinn` y lo registra (7.2, 7.4, 7.8). */
async function errorDeExcepcion(
  e: unknown,
  confirmado: boolean,
  c: Contexto,
  d: DepsMarco,
): Promise<ErrorFinn> {
  const s = sqlstateDe(e);
  const interno: ErrorFinn = {
    categoria: 'INTERNO',
    codigo: 'interno',
    mensaje: mensajeInterno(c.idError),
    idError: c.idError,
  };
  const error: ErrorFinn =
    s === null && esConexion(e) && confirmado
      ? { categoria: 'INCIERTO', codigo: 'incierto', mensaje: MENSAJE_INCIERTO, idError: c.idError }
      : (errorDeBase(e, c.idError) ?? interno);
  const datos: DatosEvento = {
    idError: c.idError,
    operacion: c.operacion,
    categoria: error.categoria,
    codigo: error.codigo,
    duracionMs: Math.round(dep(d, 'cronometro', () => performance.now())() - c.inicio),
    mensajeSaneado: sanearMensaje(e instanceof Error ? e.message : ''),
    ...(s?.sqlstate ? { sqlstate: s.sqlstate } : {}),
    ...(s?.restriccion ? { restriccion: s.restriccion } : {}),
    ...(s?.tabla ? { tabla: s.tabla } : {}),
    ...(s?.codigoPrisma ? { codigoPrisma: s.codigoPrisma } : {}),
    ...(c.revision ? { revision: c.revision } : {}),
  };
  await registrar(d, {
    nivel: error.categoria === 'OCUPADO' ? 'aviso' : 'error',
    origen: 'app',
    mensaje: `${error.categoria} ${error.codigo} ${c.operacion}`,
    datos,
  });
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
  const cronometro = dep(d, 'cronometro', () => performance.now());
  for (let n = 0; ; n++) {
    try {
      return { ok: true, valor: await intento() };
    } catch (e) {
      if (e instanceof SinEscribir) return { ok: true, valor: e.fin as T };
      const s = sqlstateDe(e);
      const bloqueo = s?.sqlstate === '55P03' || s?.sqlstate === '40P01';
      const perdida = s === null && esConexion(e) && !confirmado();
      if (n === 0 && (bloqueo || perdida) && cronometro() - c.inicio < TOPE_REINTENTO_MS) {
        const ms = ESPERA_MINIMA_MS + dep(d, 'azar', Math.random)() * ESPERA_VARIABLE_MS;
        await dep(d, 'pausar', (t: number) => new Promise<void>((r) => setTimeout(r, t)))(ms);
        continue;
      }
      return { ok: false, error: e };
    }
  }
}

const contexto = (operacion: string, d: DepsMarco): Contexto => ({
  operacion,
  idError: dep(d, 'nuevoIdError', nuevoIdErrorAleatorio)(),
  inicio: dep(d, 'cronometro', () => performance.now())(),
});

/** 04 §4.3, `previsualizar(entrada)`: en `leer()`, sin bloqueo, sin persistir. */
export async function previsualizar<E, R, S>(
  def: DefinicionOperacion<E, R, S>,
  cruda: unknown,
  d: DepsMarco,
): Promise<ResultadoAccion<ResultadoPrevisualizar>> {
  const analizada = def.contrato.safeParse(separar(cruda).entrada);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const instante = d.instante;
  if (!instante) throw new Error('previsualizar necesita DepsMarco.instante');
  const c = contexto(def.id, d);
  const r = await conReintentos(
    () =>
      dep(
        d,
        'leer',
        leerDb,
      )(async (tx): Promise<ResultadoPrevisualizar> => {
        c.revision = tx.estado.revision;
        const { resultado } = await aplicarEn(def, analizada.data, tx, instante(), d);
        const revisionVista = tx.estado.revision;
        return resultado.ok
          ? {
              revisionVista,
              huellaImpacto: huellaDe(resultado),
              impacto: resultado.impacto,
              avisos: resultado.avisos,
              rechazos: [],
            }
          : {
              revisionVista,
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
  return {
    ok: true,
    valor: r.valor,
    yaAplicada: false,
    avisos: r.valor.avisos.map((a) => mostrar(d, a)),
  };
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
  const { entrada: sinConfirmacion, confirmacion } = separar(cruda);
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
    // Paso 5: idempotencia por clase (4.6)
    const v = (await def.comprobarIdempotencia?.(tx, entrada)) ?? { tipo: 'aplicar' as const };
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

    // Pasos 4, 6 y 7; paso 8: un rechazo termina sin escribir
    const instante = tx.estado.instante as Instante;
    const { resuelto, resultado } = await aplicarEn(def, entrada, tx, instante, d);
    if (!resultado.ok)
      return terminar({ tipo: 'error', error: errorDeRechazos(resultado.rechazos, c.idError) });

    // Paso 9: avisos "antes de confirmar" (o la operación siempre pide confirmación) y la huella (4.3)
    const huella = huellaDe(resultado);
    const pide =
      def.exigeConfirmacion === true || resultado.avisos.some((a) => a.requiereConfirmacion);
    if (pide && confirmacion.huellaImpacto !== huella) {
      const vista = confirmacion.revisionVista;
      return terminar({
        tipo: 'error',
        error: {
          categoria: 'REQUIERE_CONFIRMACION',
          codigo: 'requiere_confirmacion',
          mensaje: MENSAJE_CONFIRMAR,
          previsualizacion: {
            revisionVista: tx.estado.revision,
            huellaImpacto: huella,
            impacto: resultado.impacto,
            avisos: resultado.avisos,
            rechazos: [],
          },
          ...(vista !== undefined && vista !== tx.estado.revision
            ? { datos: { revisionVista: vista, revisionActual: tx.estado.revision } }
            : {}),
        },
      });
    }

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
    () => dep(d, 'escribir', escribirDb)(cuerpo, opciones),
    () => confirmado,
    c,
    d,
  );
  let fin: Fin<S>;
  if (corrida.ok) fin = corrida.valor;
  else {
    d.memoria.vaciar(); // ante un error la memoria no puede asegurar su revisión
    const s = sqlstateDe(corrida.error);
    // Defensa de 4.6.1: la PK del hecho principal se repitió a pesar del bloqueo; se vuelve a leer y se compara
    if (
      def.idempotencia === 'creacion' &&
      def.comprobarIdempotencia &&
      s?.sqlstate === '23505' &&
      s.restriccion?.endsWith('_pkey')
    ) {
      await registrar(d, {
        nivel: 'aviso',
        origen: 'app',
        mensaje: `23505 ${s.restriccion} ${def.id}`,
        datos: { idError: c.idError, operacion: def.id, restriccion: s.restriccion },
      });
      const comprobar = def.comprobarIdempotencia.bind(def);
      const nueva = await dep(
        d,
        'leer',
        leerDb,
      )((tx) => comprobar(tx, entrada), opciones).catch(() => null);
      if (nueva?.tipo === 'ya_aplicada') fin = { tipo: 'ya_aplicada', salida: nueva.salida };
      else if (nueva?.tipo === 'conflicto_id')
        fin = { tipo: 'error', conflictoId: true, error: errorDe('conflicto_id', 'CONFLICTO') };
      else fin = { tipo: 'error', error: await errorDeExcepcion(corrida.error, confirmado, c, d) };
    } else fin = { tipo: 'error', error: await errorDeExcepcion(corrida.error, confirmado, c, d) };
  }

  if (fin.tipo === 'ya_aplicada')
    return { ok: true, valor: fin.salida, yaAplicada: true, avisos: [] };
  if (fin.tipo === 'error') {
    if (fin.conflictoId)
      await registrar(d, {
        nivel: 'aviso',
        origen: 'app',
        mensaje: `CONFLICTO conflicto_id ${def.id}`,
        datos: { idError: c.idError, operacion: def.id },
      });
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
        await registrar(d, {
          nivel: 'error',
          origen: 'app',
          mensaje: `EFECTO ${efecto.nombre} ${def.id}`,
          datos: {
            idError: c.idError,
            operacion: def.id,
            mensajeSaneado: sanearMensaje(e instanceof Error ? e.message : ''),
          },
        });
      }
    };
    if (d.despues) d.despues(tarea);
    else await tarea();
  }
  return {
    ok: true,
    valor: fin.salida,
    yaAplicada: false,
    avisos: fin.resultado.avisos.map((a) => mostrar(d, a)),
  };
}
