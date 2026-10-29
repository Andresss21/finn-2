// Piezas que comparten OP-01 a OP-06 (04 §3.1, §4.6): los hechos de la transacción y las comparaciones de la
// idempotencia. Las demás áreas de operaciones copian esta forma.
import { cargarHechos, type LectorTx } from '@finn/db';
import type { Cuenta, Hechos, Uuid } from '@finn/dominio';

const cargados = new WeakMap<LectorTx, Promise<Hechos>>();

/** Los hechos [M] vistos por esta transacción: la comprobación y el `resolver` comparten una sola carga. */
export function hechosDe(tx: LectorTx): Promise<Hechos> {
  let hechos = cargados.get(tx);
  if (hechos === undefined) cargados.set(tx, (hechos = cargarHechos(tx)));
  return hechos;
}

export async function cuentaDe(tx: LectorTx, id: Uuid): Promise<Cuenta | undefined> {
  return (await hechosDe(tx)).cuentas.find((c) => c.id === id);
}

/** Cada clave de `esperado` vale lo mismo en `fila`. */
export const coincide = (fila: object, esperado: object): boolean =>
  Object.entries(esperado).every(([k, v]) => (fila as Readonly<Record<string, unknown>>)[k] === v);

// Nombre del contrato → columna del dominio (tasas en millonésimas, DB-13)
const COLUMNA: Readonly<Record<string, string>> = {
  tasaAnual: 'tasaAnualMillonesimas',
  tasaNominalAnual: 'tasaNominalAnualMillonesimas',
  rendimientoAnualEsperado: 'rendimientoAnualEsperadoMillonesimas',
};

export const columnasDe = (claves: readonly string[]): string[] =>
  claves.map((k) => COLUMNA[k] ?? k);

/** Los campos definidos de `objeto`, con los nombres del dominio. */
export const aDominio = (objeto: object): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(objeto).flatMap(([k, v]) => (v === undefined ? [] : [[COLUMNA[k] ?? k, v]])),
  );
