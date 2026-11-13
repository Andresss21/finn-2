// [CH-251] «Coincide con» de una regla de comercio (04 §6.12.2, E4-22 de la entrega 4): los comercios de las transacciones
// cuyo comercio normalizado contiene el patrón, sin distinguir mayúsculas (el criterio de §4.17 y BE-43). Las reglas
// ([H]) se las pasa la consulta. Cuántas veces se usó una regla no se puede saber: ningún hecho guarda qué regla
// categorizó una transacción.
import type { Instantanea, ReglaComercio, Uuid } from '../hechos';
import { normalizar } from './reportes/agrupacion';

/** Ejemplos por regla. */
export const EJEMPLOS_DE_REGLA = 3;

/** Por id de regla, hasta 3 comercios distintos tal como vinieron (sin espacios en los extremos), del más reciente al más antiguo. */
export function coincidenciasDeReglas(
  i: Instantanea,
  reglas: readonly Pick<ReglaComercio, 'id' | 'patron'>[],
): ReadonlyMap<Uuid, readonly string[]> {
  const recientes = i.hechos.transacciones
    .filter((t) => t.comercio !== null && t.comercio.trim() !== '')
    .sort((a, b) => (a.claveOrden < b.claveOrden ? 1 : a.claveOrden > b.claveOrden ? -1 : 0))
    .map((t) => ({ escrito: (t.comercio ?? '').trim(), normal: normalizar(t.comercio ?? '') }));
  return new Map(
    reglas.map((r) => {
      const patron = r.patron.toLowerCase();
      const vistos = new Map<string, string>();
      for (const t of recientes)
        if (t.normal.includes(patron) && !vistos.has(t.normal) && vistos.size < EJEMPLOS_DE_REGLA)
          vistos.set(t.normal, t.escrito);
      return [r.id, [...vistos.values()]];
    }),
  );
}
