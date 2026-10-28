// Fechas e instantes entre la base y el dominio (04 §13.2, §13.1.2; ADR-16; V-14, V-17). Único módulo que usa
// `Date`, y `Date` nunca sale de @finn/db: los repositorios convierten aquí y entregan texto al dominio.
// Solo métodos UTC: con otra zona del proceso, `getDate()` y compañía devuelven el día anterior (V-14).
import { FechaLocal } from '@finn/dominio/valores';

/** Lectura con Prisma de una columna `@db.Date`: medianoche UTC → 'AAAA-MM-DD'. */
export const fechaLocalDeDate = (d: Date): FechaLocal =>
  FechaLocal.desdeTexto(d.toISOString().slice(0, 10));

/** Escritura con Prisma de una columna `@db.Date`: la medianoche UTC de la fecha. */
export const dateDeFechaLocal = (f: FechaLocal): Date => new Date(`${f}T00:00:00.000Z`);

const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** Lectura de un `timestamptz` (sesión en UTC, 04 §13.6): texto ISO UTC con milisegundos (un `Instante`). */
export const instanteDeDate = (d: Date): string => d.toISOString();

/** Escritura de un `timestamptz`: acepta solo el formato de 04 §13.3 (`2026-10-14T04:04:00.549Z`). */
export function dateDeInstante(i: string): Date {
  const d = new Date(i);
  if (!INSTANTE.test(i) || Number.isNaN(d.getTime()) || d.toISOString() !== i)
    throw new RangeError(`instante con formato inválido: "${i}"`);
  return d;
}
