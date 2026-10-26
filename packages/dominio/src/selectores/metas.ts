// Metas (04 §6.10): las metas evaluadas en el período activo, vencidas primero (AV-17). Las de una
// categoría archivada se conservan pero no se evalúan (§4.12, B-11) y no aparecen.
import type { EstadoDeMeta } from '../calculo/metas';
import type { Instantanea, Meta, Uuid } from '../hechos';
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { porOrden, type Ref, refDe } from './estructura';
import { puntosBasicos } from './reportes/comunes';

export interface MetaDeLista {
  readonly id: Uuid;
  readonly categoria: Ref;
  readonly grupo: Ref;
  readonly tipo: Meta['tipo'];
  readonly modo?: NonNullable<Meta['modo']>;
  readonly monto: Centavos;
  readonly fechaCreacion: FechaLocal;
  readonly fechaObjetivoVigente?: FechaLocal;
  readonly montoPeriodo?: Centavos;
  readonly pedido: Centavos;
  readonly falta: Centavos;
  readonly disponible: Centavos;
  /** Metas de ahorro: Disp(c, A) / monto en puntos básicos, entre 0 y 10.000. */
  readonly progreso?: number;
  readonly estado: EstadoDeMeta;
  readonly vencida: boolean;
  /** Los valores vigentes de la meta, para OP-18. */
  readonly esperado: Readonly<Record<string, unknown>>;
}

export interface Metas {
  readonly metas: readonly MetaDeLista[];
  readonly categoriasSinMeta: readonly Ref[];
}

/** El progreso (CF-25) de una meta de ahorro, o `undefined` si no lo es. */
export function progresoDeMeta(
  tipo: Meta['tipo'],
  disponible: Centavos,
  monto: Centavos,
): number | undefined {
  if (tipo === 'mensual' || tipo === 'semanal' || monto <= 0) return undefined;
  return disponible <= 0 ? 0 : Math.min(10_000, puntosBasicos(disponible, monto));
}

/** `consultas.metas()` (04 §6.10). */
export function metas(i: Instantanea): Metas {
  const activo = i.presupuesto.activo;
  const categorias = new Map(i.hechos.categorias.map((c) => [c.id, c]));
  const grupos = new Map(i.hechos.grupos.map((g) => [g.id, g]));
  const evaluadas = new Map(i.metas.map((x) => [x.metaId, x.evaluacion]));
  const lista = i.hechos.metas.flatMap((m) => {
    const ev = evaluadas.get(m.id);
    const c = categorias.get(m.categoriaId);
    const g = c === undefined ? undefined : grupos.get(c.grupoId);
    const celda = i.presupuesto.celdas.find(
      (x) => x.categoriaId === m.categoriaId && x.periodo.inicio === activo.inicio,
    );
    if (ev == null || c === undefined || g === undefined || celda === undefined) return [];
    const progreso = progresoDeMeta(m.tipo, celda.disponible, m.monto);
    const fila: MetaDeLista = {
      id: m.id,
      categoria: refDe(c),
      grupo: refDe({ id: g.id, nombre: g.nombre, archivada: g.archivado }),
      tipo: m.tipo,
      ...(m.modo === null ? {} : { modo: m.modo }),
      monto: m.monto,
      fechaCreacion: m.fechaCreacion,
      ...(ev.fechaObjetivo === null ? {} : { fechaObjetivoVigente: ev.fechaObjetivo }),
      ...(ev.montoDelPeriodo === null ? {} : { montoPeriodo: ev.montoDelPeriodo }),
      pedido: ev.pedido,
      falta: ev.falta,
      disponible: celda.disponible,
      ...(progreso === undefined ? {} : { progreso }),
      estado: ev.estado,
      vencida: ev.estado === 'vencida',
      esperado: { tipo: m.tipo, modo: m.modo, monto: m.monto, fechaObjetivo: m.fechaObjetivo },
    };
    return [{ fila, grupo: g, categoria: c }];
  });
  lista.sort(
    (a, b) =>
      Number(b.fila.vencida) - Number(a.fila.vencida) ||
      porOrden(a.grupo, b.grupo) ||
      porOrden(a.categoria, b.categoria) ||
      (a.fila.id < b.fila.id ? -1 : 1),
  );
  const conMeta = new Set(i.hechos.metas.map((m) => m.categoriaId));
  return {
    metas: lista.map((x) => x.fila),
    categoriasSinMeta: i.hechos.categorias
      .filter((c) => c.clase === 'normal' && !c.archivada && !conMeta.has(c.id))
      .sort(
        (a, b) =>
          porOrden(grupos.get(a.grupoId) ?? a, grupos.get(b.grupoId) ?? b) || porOrden(a, b),
      )
      .map(refDe),
  };
}
