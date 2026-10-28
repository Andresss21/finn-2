// Servicio de transacciones (04 §4.1, BE-11): el único módulo del repositorio que llama a `$transaction`.
// - `escribir()`: el protocolo de 04 §4.2 (BE-12): READ COMMITTED, el bloqueo global como primera sentencia,
//   la zona y el reloj de la transacción (BE-33, BE-30, CT-01) y la primera lectura con revisión, hoy e instante
//   (BE-27, CT-02). `finn.operacion` solo con `set_config(…, true)` y su lista cerrada (04 §4.4, BE-14).
// - `leer()`: 04 §5.1 (BE-20): REPEATABLE READ, solo lectura como primera sentencia (`transaction_read_only` local,
//   CH-25), la zona y el reloj, y la primera lectura con revisión y hoy, que toma la instantánea.
// Las operaciones solo ven `LectorTx` y `EscritorTx`; el cliente de la transacción queda dentro de @finn/db.
import type { Cambio } from '@finn/dominio';
import { cliente, type Cliente } from './cliente.ts';
import { aplicarCambios, type ValoresDeLaBase } from './hechos/traductor.ts';
import { Prisma } from './generado/prisma/client.ts';

type TxPrisma = Prisma.TransactionClient;

/**
 * El reloj de prueba de la petición (07 §4.1; CT-01): `hoy` para `finn.hoy()` y `desfaseMs` para
 * `finn.ahora()` y `finn.instante()`. Lo calcula `relojDePrueba()` de @finn/aplicacion y es `null` fuera de
 * las pruebas; la base solo lo respeta si es una base de prueba (07 §4.3, barreras 3 y 4).
 */
export type RelojTx = { readonly hoy: string; readonly desfaseMs: number };
export type OpcionesTx = { readonly reloj?: RelojTx | null };

/** Las únicas excepciones que una operación declara (04 §4.4; 03 §13.4, DB-20). */
export const OPERACIONES_DECLARADAS = ['fusion', 'eliminar_cuenta'] as const;
export type OperacionDeclarada = (typeof OPERACIONES_DECLARADAS)[number];

/** Primera lectura de `leer()` (paso 4 de 04 §5.1): `revision` en texto (BE-28) y `hoy` como AAAA-MM-DD. */
export type EstadoLectura = { readonly revision: string; readonly hoy: string };
/** Primera lectura de `escribir()` (paso 3 de 04 §4.2): además, el instante posterior al bloqueo (BE-27). */
export type EstadoEscritura = EstadoLectura & { readonly instante: string };

export interface LectorTx {
  readonly estado: EstadoLectura;
}
export interface EscritorTx {
  readonly estado: EstadoEscritura;
  /** Paso 10 de 04 §4.2: `set_config('finn.operacion', op, true)`, solo con un valor de la lista cerrada. */
  declararOperacion(op: OperacionDeclarada): Promise<void>;
  /** Paso 11 de 04 §4.2: los cambios en el orden de 04 §4.5 y lo que fijó la base (BE-15, BE-32). */
  aplicarCambios(cambios: readonly Cambio[]): Promise<ValoresDeLaBase>;
  /** Paso 13 de 04 §4.2: la revisión después de las escrituras de la transacción. */
  revisionActual(): Promise<string>;
}
export type TrabajoLectura<T> = (tx: LectorTx) => Promise<T>;
export type TrabajoEscritura<T> = (tx: EscritorTx) => Promise<T>;

// ADR-06 y 04 §4.2: `timeout` ≥ 20 s porque la espera del bloqueo puede durar hasta 10 s; 04 §5.1 para leer
export const OPCIONES_ESCRITURA = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  timeout: 20_000,
  maxWait: 5_000,
} as const;
export const OPCIONES_LECTURA = {
  isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  timeout: 10_000,
  maxWait: 5_000,
} as const;

// El cliente de cada transacción abierta, para los repositorios y el traductor de @finn/db (no sale de index.ts)
const prismaDe = new WeakMap<LectorTx, TxPrisma>();

/** El cliente de Prisma de la transacción de `tx`. Solo para el código y las pruebas de @finn/db. */
export function txPrisma(tx: LectorTx): TxPrisma {
  const p = prismaDe.get(tx);
  if (!p) throw new Error('La transacción no es de escribir() ni de leer()');
  return p;
}

/** Paso 2 de 04 §4.2 y 3 de 04 §5.1: zona UTC (BE-33) y, si hay reloj de prueba, `finn.hoy` y `finn.desfase_ms`. */
async function fijarSesion(tx: TxPrisma, reloj: RelojTx | null | undefined): Promise<void> {
  if (!reloj) {
    await tx.$executeRaw`SELECT set_config('TimeZone', 'UTC', true)`;
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reloj.hoy) || !Number.isSafeInteger(reloj.desfaseMs))
    throw new Error(`Reloj de prueba inválido: ${JSON.stringify(reloj)}`);
  await tx.$executeRaw`SELECT set_config('TimeZone', 'UTC', true),
    set_config('finn.hoy', ${reloj.hoy}, true),
    set_config('finn.desfase_ms', ${String(reloj.desfaseMs)}, true)`;
}

type Fila = { revision: string; hoy: string; instante?: string; zona: string };

/** La primera lectura: una fila de `finn.revision` y la aserción de zona de 04 §13.6 (decisión 4). */
function unaFila(filas: Fila[]): Fila {
  const [f] = filas;
  if (!f || filas.length !== 1) throw new Error('finn.revision no tiene su fila id = 1');
  if (f.zona !== 'UTC') throw new Error(`La sesión no está en UTC: ${f.zona}`);
  return f;
}

/** `escribir()` y `leer()` sobre un cliente dado; el resto del repositorio usa los del cliente del proceso. */
export function transaccionesSobre(c: Cliente) {
  async function escribir<T>(trabajo: TrabajoEscritura<T>, opciones: OpcionesTx = {}): Promise<T> {
    return c.$transaction(async (tx) => {
      // Paso 1: primera sentencia. En READ COMMITTED cada lectura posterior ve todo lo confirmado (V-08, V-09)
      await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
      await fijarSesion(tx, opciones.reloj);
      // Paso 3: primera lectura, ya con el bloqueo; el instante se toma después de esperarlo (BE-27, CT-02)
      const f = unaFila(
        await tx.$queryRaw<Fila[]>`SELECT valor::text AS revision, finn.hoy()::text AS hoy,
          to_char(date_trunc('milliseconds', finn.instante()) AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS instante,
          current_setting('TimeZone') AS zona
        FROM finn.revision WHERE id = 1`,
      );
      const escritor: EscritorTx = {
        estado: { revision: f.revision, hoy: f.hoy, instante: f.instante ?? '' },
        async declararOperacion(op) {
          if (!(OPERACIONES_DECLARADAS as readonly string[]).includes(op))
            throw new Error(`finn.operacion no admite ${JSON.stringify(op)}`);
          await tx.$executeRaw`SELECT set_config('finn.operacion', ${op}, true)`;
        },
        aplicarCambios: (cambios) => aplicarCambios(escritor, cambios),
        async revisionActual() {
          const [r] = await tx.$queryRaw<
            { revision: string }[]
          >`SELECT valor::text AS revision FROM finn.revision WHERE id = 1`;
          if (!r) throw new Error('finn.revision no tiene su fila id = 1');
          return r.revision;
        },
      };
      prismaDe.set(escritor, tx);
      return trabajo(escritor);
    }, OPCIONES_ESCRITURA);
  }

  async function leer<T>(trabajo: TrabajoLectura<T>, opciones: OpcionesTx = {}): Promise<T> {
    return c.$transaction(async (tx) => {
      // Paso 2: sentencia de control, no toma la instantánea (V-07)
      await tx.$executeRaw`SET LOCAL transaction_read_only = on`;
      await fijarSesion(tx, opciones.reloj);
      // Paso 4: primera lectura; toma la instantánea de la revisión, los hechos y las filas [H]
      const f = unaFila(
        await tx.$queryRaw<Fila[]>`SELECT valor::text AS revision, finn.hoy()::text AS hoy,
          current_setting('TimeZone') AS zona
        FROM finn.revision WHERE id = 1`,
      );
      const lector: LectorTx = { estado: { revision: f.revision, hoy: f.hoy } };
      prismaDe.set(lector, tx);
      return trabajo(lector);
    }, OPCIONES_LECTURA);
  }

  return { escribir, leer };
}

/** Toda escritura de hechos (04 §4.1, §4.2). */
export const escribir = <T>(trabajo: TrabajoEscritura<T>, opciones?: OpcionesTx): Promise<T> =>
  transaccionesSobre(cliente()).escribir(trabajo, opciones);

/** Toda lectura del motor (04 §5.1). */
export const leer = <T>(trabajo: TrabajoLectura<T>, opciones?: OpcionesTx): Promise<T> =>
  transaccionesSobre(cliente()).leer(trabajo, opciones);
