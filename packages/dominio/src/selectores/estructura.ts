// Estructura de grupos y categorías (04 §6.12.4) y las precondiciones de OP-09 y OP-13 que también
// usa el detalle de categoría. Solo lee la instantánea; `reglas_comercio` es [H] y llega aparte.
import type { Categoria, Instantanea, ReglaComercio, Uuid } from '../hechos';

/** `Ref` de 04 §6.0.3. */
export interface Ref {
  readonly id: Uuid;
  readonly nombre: string;
  readonly archivada?: true;
}

export interface FilaDeEstructura {
  readonly categoria: Ref;
  readonly clase: Categoria['clase'];
  readonly archivada: boolean;
  readonly tieneMeta: boolean;
  readonly puedeEliminar: boolean;
  readonly puedeArchivar: boolean;
}

export interface GrupoDeEstructura {
  readonly grupo: Ref & { readonly archivado: boolean; readonly sistema: boolean };
  readonly categorias: readonly FilaDeEstructura[];
}

export type BloqueoDeArchivo = 'disponible' | 'asignaciones_futuras' | 'programadas';

export const refDe = (x: {
  readonly id: Uuid;
  readonly nombre: string;
  readonly archivada?: boolean;
}): Ref =>
  x.archivada === true
    ? { id: x.id, nombre: x.nombre, archivada: true }
    : { id: x.id, nombre: x.nombre };

/** OP-13: una categoría normal sin líneas, condonaciones, asignaciones, programadas ni reglas. */
export function puedeEliminar(
  i: Instantanea,
  c: Pick<Categoria, 'id' | 'clase'>,
  reglas: readonly ReglaComercio[] = [],
): boolean {
  const h = i.hechos;
  return (
    c.clase === 'normal' &&
    !h.lineas.some((x) => x.categoriaId === c.id) &&
    !h.condonaciones.some((x) => x.categoriaId === c.id) &&
    !h.asignaciones.some((x) => x.categoriaId === c.id) &&
    !h.programada_lineas.some((x) => x.categoriaId === c.id) &&
    !reglas.some((x) => x.categoriaId === c.id)
  );
}

/** OP-09: una categoría normal y activa se puede archivar. */
export const puedeArchivar = (c: Pick<Categoria, 'clase' | 'archivada'>): boolean =>
  c.clase === 'normal' && !c.archivada;

/** Lo que OP-09 pide decidir: Disponible ≠ 0 en A, asignaciones futuras o programadas activas. */
export function bloqueosDeArchivo(i: Instantanea, categoriaId: Uuid): BloqueoDeArchivo[] {
  const activo = i.presupuesto.activo;
  const disponible = i.presupuesto.celdas.find(
    (x) => x.categoriaId === categoriaId && x.periodo.inicio === activo.inicio,
  )?.disponible;
  const activas = new Set(i.hechos.programadas.filter((p) => p.activa).map((p) => p.id));
  const bloqueos: BloqueoDeArchivo[] = [];
  if (disponible !== undefined && disponible !== 0) bloqueos.push('disponible');
  if (
    i.hechos.asignaciones.some(
      (a) => a.categoriaId === categoriaId && a.periodoInicio > activo.inicio && a.monto !== 0,
    )
  )
    bloqueos.push('asignaciones_futuras');
  if (
    i.hechos.programada_lineas.some(
      (l) => l.categoriaId === categoriaId && activas.has(l.programadaId),
    )
  )
    bloqueos.push('programadas');
  return bloqueos;
}

export const porOrden = <T extends { readonly orden: number; readonly id: string }>(
  a: T,
  b: T,
): number => a.orden - b.orden || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** `consultas.estructura()` (04 §6.12.4): el árbol de grupos y categorías, en su orden. */
export function estructura(
  i: Instantanea,
  reglas: readonly ReglaComercio[] = [],
): GrupoDeEstructura[] {
  const conMeta = new Set(i.hechos.metas.map((m) => m.categoriaId));
  return [...i.hechos.grupos].sort(porOrden).map((g) => ({
    grupo: {
      ...refDe({ id: g.id, nombre: g.nombre, archivada: g.archivado }),
      archivado: g.archivado,
      sistema: g.claveSistema !== null,
    },
    categorias: i.hechos.categorias
      .filter((c) => c.grupoId === g.id)
      .sort(porOrden)
      .map((c) => ({
        categoria: refDe(c),
        clase: c.clase,
        archivada: c.archivada,
        tieneMeta: conMeta.has(c.id),
        puedeEliminar: puedeEliminar(i, c, reglas),
        puedeArchivar: puedeArchivar(c),
      })),
  }));
}
