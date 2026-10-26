// Clave de agrupación de comercios (04 §6.9.6, BE-43 [R3]) y las piezas que comparten los reportes
// que agrupan compras: top de comercios, gastos hormiga y suscripciones. Todo puro: las reglas
// ([H]) se las pasa la consulta.
import type { Instantanea, ReglaComercio, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import { contexto, tocaK } from './comunes';

export const SIN_COMERCIO = '(sin comercio)';

/** Minúsculas, sin espacios en los extremos ni repetidos (04 §4.17). */
export const normalizar = (c: string): string => c.trim().replace(/\s+/g, ' ').toLowerCase();

export const menorPrimero = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Los patrones de todas las reglas (también las de categorías archivadas): el más largo primero. */
export const patronesOrdenados = (reglas: readonly Pick<ReglaComercio, 'patron'>[]): string[] =>
  reglas.map((r) => r.patron).sort((a, b) => b.length - a.length || menorPrimero(a, b));

export interface ClaveDeComercio {
  /** El patrón de la regla o el comercio normalizado; `(sin comercio)` si está vacío. */
  readonly clave: string;
  readonly porRegla: boolean;
  /** Si la clave es una regla, su patrón; si no, `(sin comercio)`: el llamador elige la variante más frecuente. */
  readonly etiqueta: string;
  /** El comercio normalizado (`(sin comercio)` si está vacío): el nombre de la variante. */
  readonly variante: string;
  /** El comercio tal como vino, sin espacios en los extremos. */
  readonly escrito: string;
}

/** BE-43: `patrones` viene de `patronesOrdenados`. */
export function claveDeComercio(
  patrones: readonly string[],
  comercio: string | null,
): ClaveDeComercio {
  const escrito = comercio === null ? '' : comercio.trim();
  const normal = normalizar(escrito);
  const patron = patrones.find((p) => normal.includes(p.toLowerCase()));
  const variante = normal === '' ? SIN_COMERCIO : normal;
  return {
    clave: patron ?? variante,
    porRegla: patron !== undefined,
    etiqueta: patron ?? SIN_COMERCIO,
    variante,
    escrito,
  };
}

/** La variante escrita más frecuente; a igual frecuencia, la menor. */
export function masFrecuente(escritos: ReadonlyMap<string, number>): string | undefined {
  return [...escritos].sort((a, b) => b[1] - a[1] || menorPrimero(a[0], b[0]))[0]?.[0];
}

/**
 * Devoluciones vinculadas a una línea (por id de la línea original), con fecha que cumple `enRango` y
 * cuenta en K: lo que se resta de cada línea de gasto en los reportes por comercio.
 */
export function devueltoPorLinea(
  i: Instantanea,
  enRango: (f: FechaLocal) => boolean,
  k: ReadonlySet<Uuid> | undefined,
): Map<Uuid, Centavos> {
  const cx = contexto(i);
  const txs = new Map(i.hechos.transacciones.map((t) => [t.id, t]));
  const devuelto = new Map<Uuid, Centavos>();
  for (const l of i.hechos.lineas) {
    const t = txs.get(l.transaccionId);
    if (t?.tipo !== 'devolucion' || l.lineaOriginalId === null) continue;
    if (!enRango(t.fecha) || !tocaK(k, cx.cuentasDe(t.id))) continue;
    devuelto.set(
      l.lineaOriginalId,
      Centavos.sumar(devuelto.get(l.lineaOriginalId) ?? Centavos.cero, l.monto),
    );
  }
  return devuelto;
}
