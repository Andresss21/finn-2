// Categoría propuesta para un comercio (01 §4.17; OP-35 paso 10): la regla de comercio de patrón
// más largo contenido en el comercio, sin mayúsculas, ignorando las de categorías archivadas; si
// ninguna aplica, la categoría de la línea única más reciente de una transacción aprobada con el
// mismo comercio (sin mayúsculas ni espacios repetidos) y una categoría activa.
import { destinos } from '../calculo/destino';
import type { Hechos, ReglaComercio, Uuid } from '../hechos';

/** Sin mayúsculas, sin espacios repetidos ni en los extremos. */
export const normalizarComercio = (comercio: string): string =>
  comercio.toLowerCase().trim().replace(/\s+/g, ' ');

type ConCategorias = Pick<Hechos, 'categorias'>;

const activas = (h: ConCategorias) =>
  new Set<Uuid>(h.categorias.filter((x) => !x.archivada).map((x) => x.id));

/** La regla que aplica (la de patrón más largo; a igual largo, el patrón y luego el id menores). */
export function reglaDeComercio(
  h: ConCategorias,
  reglas: readonly ReglaComercio[],
  comercio: string,
): ReglaComercio | undefined {
  const [ok, texto] = [activas(h), comercio.toLowerCase()];
  return reglas
    .filter((r) => ok.has(r.categoriaId) && texto.includes(r.patron.toLowerCase()))
    .sort(
      (a, b) =>
        b.patron.length - a.patron.length ||
        (a.patron < b.patron ? -1 : a.patron > b.patron ? 1 : 0) ||
        (a.id < b.id ? -1 : 1),
    )[0];
}

/** Sugerencia por historial; la más reciente por fecha y clave de orden. */
export function categoriaPorHistorial(
  h: Pick<Hechos, 'categorias' | 'transacciones' | 'lineas'>,
  comercio: string,
): Uuid | undefined {
  const [ok, buscado] = [activas(h), normalizarComercio(comercio)];
  const lineas = new Map<Uuid, Uuid[]>();
  const destino = destinos(h.lineas);
  for (const l of h.lineas) {
    const categoriaId = destino(l).categoriaId as Uuid;
    lineas.set(l.transaccionId, [...(lineas.get(l.transaccionId) ?? []), categoriaId]);
  }
  const [elegida] = h.transacciones
    .filter((t) => t.comercio !== null && normalizarComercio(t.comercio) === buscado)
    .flatMap((t) => {
      const [unica, ...otras] = lineas.get(t.id) ?? [];
      return unica !== undefined && otras.length === 0 && ok.has(unica) ? [{ t, unica }] : [];
    })
    .sort((a, b) => {
      const [x, y] = [`${a.t.fecha}|${a.t.claveOrden}`, `${b.t.fecha}|${b.t.claveOrden}`];
      return x < y ? 1 : x > y ? -1 : 0;
    });
  return elegida?.unica;
}

/** Paso 10: por regla de comercio; si no hay, por historial; si no, sin destino (`null`). */
export function sugerirCategoria(
  h: Pick<Hechos, 'categorias' | 'transacciones' | 'lineas'>,
  reglas: readonly ReglaComercio[],
  comercio: string | null,
): Uuid | null {
  if (comercio === null) return null;
  return (
    reglaDeComercio(h, reglas, comercio)?.categoriaId ?? categoriaPorHistorial(h, comercio) ?? null
  );
}
