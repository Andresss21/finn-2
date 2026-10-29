// Piezas que comparten OP-01 a OP-06 (04 §3.1, §4.6): las comparaciones de la idempotencia y los nombres del
// contrato frente a las columnas del dominio. Los hechos los entrega el marco (una sola carga por transacción).
import type { Cuenta, Hechos, Uuid } from '@finn/dominio';

export const cuentaDe = (h: Hechos, id: Uuid): Cuenta | undefined =>
  h.cuentas.find((c) => c.id === id);

/** Cada clave de `esperado` vale lo mismo en `fila`. */
export const coincide = (fila: object, esperado: object): boolean =>
  Object.entries(esperado).every(([k, v]) => (fila as Readonly<Record<string, unknown>>)[k] === v);

// Nombre del contrato → columna del dominio (tasas en millonésimas, DB-13)
const COLUMNA: Readonly<Record<string, string>> = {
  tasaAnual: 'tasaAnualMillonesimas',
  tasaNominalAnual: 'tasaNominalAnualMillonesimas',
  rendimientoAnualEsperado: 'rendimientoAnualEsperadoMillonesimas',
};
const CAMPO: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(COLUMNA).map(([campo, columna]) => [columna, campo]),
);

const renombrar = (objeto: object, nombres: Readonly<Record<string, string>>) =>
  Object.fromEntries(
    Object.entries(objeto).flatMap(([k, v]) => (v === undefined ? [] : [[nombres[k] ?? k, v]])),
  ) as Record<string, unknown>;

/** Los campos definidos de `objeto`, con los nombres del dominio. */
export const aDominio = (objeto: object): Record<string, unknown> => renombrar(objeto, COLUMNA);

/** El inverso de `aDominio`: columnas del dominio con los nombres del contrato (`actuales` de 4.6.2). */
export const aContrato = (objeto: object): Record<string, unknown> => renombrar(objeto, CAMPO);
