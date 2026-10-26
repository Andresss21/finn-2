// Coincidencia de conciliación (01 §4.17, supuesto 10): misma cuenta, mismo monto y |Δ fecha| ≤ 3
// días, 1 a 1. Cada partida del estado, en el orden en que llega, toma de las transacciones que
// quedan la de fecha más cercana y, si empatan, la de clave de orden más antigua.
import type { Instante, Uuid } from '../hechos';
import type { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';

export interface Partida {
  readonly id: string;
  readonly cuentaId: Uuid;
  readonly fecha: FechaLocal;
  readonly monto: Centavos;
}

export interface Candidata extends Partida {
  readonly claveOrden: Instante;
}

/** Partida → transacción con la que coincide; las partidas sin coincidencia no aparecen. */
export function coincidenciasDeConciliacion(
  partidas: readonly Partida[],
  candidatas: readonly Candidata[],
): ReadonlyMap<string, string> {
  const usadas = new Set<string>();
  const pares = new Map<string, string>();
  for (const p of partidas) {
    const dias = (c: Candidata) => Math.abs(FechaLocal.diasEntre(c.fecha, p.fecha));
    const clave = (a: Candidata, b: Candidata) =>
      a.claveOrden < b.claveOrden ? -1 : a.claveOrden > b.claveOrden ? 1 : 0;
    // Con la misma distancia y clave queda el orden de entrada (en BE-48, el de la secuencia).
    const [elegida] = candidatas
      .filter((c) => !usadas.has(c.id) && c.cuentaId === p.cuentaId && c.monto === p.monto)
      .filter((c) => dias(c) <= 3)
      .sort((a, b) => dias(a) - dias(b) || clave(a, b));
    if (elegida === undefined) continue;
    usadas.add(elegida.id);
    pares.set(p.id, elegida.id);
  }
  return pares;
}
