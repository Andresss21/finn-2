// OP-07 Crear grupo o categoría (01 §5.2, 04 §3.2). Aquí viven también las reglas de búsqueda, de
// nombre y de grupo destino que reusan las demás OP de grupos y categorías.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { esRechazo } from './rechazos';

type R = H.Rechazo;

/** La fila `id` de `xs`, o `no_encontrado` (04 §3.0.7). */
export function buscar<T extends { readonly id: H.Uuid }>(
  xs: readonly T[],
  id: H.Uuid,
  entidad: string,
) {
  return xs.find((x) => x.id === id) ?? ({ codigo: 'no_encontrado', datos: { entidad, id } } as R);
}

/** `nombre_repetido`: otro elemento de la lista con el mismo nombre, sin mayúsculas. */
export function nombreOcupado(
  xs: readonly H.Grupo[] | readonly H.Categoria[],
  propio: H.Uuid,
  nombre: string,
  grupo?: H.Grupo,
) {
  const igual = xs.some((x) => x.id !== propio && x.nombre.toLowerCase() === nombre.toLowerCase());
  const datos = { nombre, ...(grupo && { grupo: grupo.nombre }) };
  return igual ? ({ codigo: 'nombre_repetido', campo: 'nombre', datos } as R) : undefined;
}

/** El grupo destino de una categoría de esa clase: activo, y "Pagos de tarjeta" solo para las de pago (S3-9). */
export function grupoValido(
  h: H.Hechos,
  grupoId: H.Uuid,
  clase: H.Categoria['clase'],
): H.Grupo | R {
  const g = buscar(h.grupos, grupoId, 'grupos');
  if (esRechazo(g)) return g;
  const datos = { grupo: g.nombre };
  if ((g.claveSistema === 'pagos_tarjeta') !== (clase === 'pago'))
    return { codigo: 'grupo_del_sistema', datos };
  return g.archivado ? { codigo: 'grupo_archivado', datos } : g;
}

const siguiente = (xs: readonly { readonly orden: number }[]) =>
  Math.max(0, ...xs.map((x) => x.orden)) + 1;

export function op07(antes: H.Instantanea, x: H.ComandoOp07): Efecto | R {
  const { hechos: h } = antes;
  const { id, nombre } = x;
  if (x.tipo === 'grupo') {
    const fila = {
      id,
      nombre,
      orden: siguiente(h.grupos),
      archivado: false,
      claveSistema: null,
      revision: null,
    };
    return (
      nombreOcupado(h.grupos, id, nombre) ?? {
        cambios: [{ tipo: 'insertar', tabla: 'grupos', fila }],
      }
    );
  }
  if (x.grupoId === undefined) throw new TypeError(`OP-07: la categoría ${id} no trae grupoId`);
  const g = grupoValido(h, x.grupoId, 'normal');
  if (esRechazo(g)) return g;
  const hermanas = h.categorias.filter((c) => c.grupoId === g.id);
  const repetido = nombreOcupado(hermanas, id, nombre, g);
  if (repetido !== undefined) return repetido;
  const fila = {
    id,
    grupoId: g.id,
    nombre,
    orden: siguiente(hermanas),
    clase: 'normal',
    tarjetaId: null,
    archivada: false,
    revision: null,
  } as const;
  return { cambios: [{ tipo: 'insertar', tabla: 'categorias', fila }] };
}
