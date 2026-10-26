// OP-09 Archivar categoría, compuesta (01 §5.2, §7.6; 04 §3.2): deja Disp(c, A) = 0 contra el
// destino elegido, devuelve sus asignaciones futuras, decide sus programadas activas y la archiva. Su
// meta se conserva sin evaluarse (B-11, CB-34). Aquí viven las reglas de dinero de OP-11 y OP-12.
import type * as H from '../hechos';
import { bloqueosDeArchivo, puedeArchivar } from '../selectores/estructura';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { esRechazo } from './rechazos';

type R = H.Rechazo;

/** Disp(c, A). */
export const disponibleEnA = (i: H.Instantanea, categoriaId: H.Uuid) =>
  i.presupuesto.celdas
    .filter(
      (x) => x.categoriaId === categoriaId && x.periodo.inicio === i.presupuesto.activo.inicio,
    )
    .reduce((s, x) => Centavos.sumar(s, x.disponible), Centavos.cero);

/** F4/F3/F2 de Asig(c, p) += delta: actualiza, inserta o elimina la fila si queda en 0. */
export function ajustar(
  h: H.Hechos,
  ids: H.GeneradorIds,
  categoriaId: H.Uuid,
  periodoInicio: FechaLocal,
  delta: Centavos,
): H.Cambio[] {
  if (delta === 0) return [];
  const a = h.asignaciones.find(
    (x) => x.categoriaId === categoriaId && x.periodoInicio === periodoInicio,
  );
  const monto = Centavos.sumar(a?.monto ?? Centavos.cero, delta);
  if (a === undefined) {
    const fila = { id: ids.siguiente(), categoriaId, periodoInicio, monto, revision: null };
    return [{ tipo: 'insertar', tabla: 'asignaciones', fila }];
  }
  if (monto === 0) return [{ tipo: 'eliminar', tabla: 'asignaciones', id: a.id }];
  return [{ tipo: 'actualizar', tabla: 'asignaciones', id: a.id, campos: { monto } }];
}

/** Una categoría destino de dinero o de programadas: existe, ≠ origen, normal y activa. */
export function destinoValido(h: H.Hechos, categoriaId: H.Uuid, origenId: H.Uuid): H.Categoria | R {
  const d = buscar(h.categorias, categoriaId, 'categorias');
  const datos = { categoriaId };
  if (esRechazo(d)) return d;
  if (d.id === origenId) return { codigo: 'destino_igual_origen', datos };
  if (d.clase === 'pago') return { codigo: 'categoria_de_pago_no_permitida', datos };
  return d.archivada ? { codigo: 'categoria_archivada', datos } : d;
}

/** Mueve `monto` de Asig(c, A) al destino (o a LPA, que sube por la fórmula). */
export function mover(
  i: H.Instantanea,
  ids: H.GeneradorIds,
  c: H.Uuid,
  destino: H.DestinoDinero,
  monto: Centavos,
) {
  const { hechos: h } = i;
  const A = i.presupuesto.activo.inicio;
  const d = destino === 'lpa' ? undefined : destinoValido(h, destino.categoriaId, c);
  if (d !== undefined && esRechazo(d)) return d;
  return [
    ...ajustar(h, ids, c, A, Centavos.negar(monto)),
    ...(d ? ajustar(h, ids, d.id, A, monto) : []),
  ];
}

const desactualizado = (campo: string): R => ({ codigo: 'conflicto_desactualizado', campo });

export function op09(antes: H.Instantanea, x: H.ComandoOp09): Efecto | R {
  const { hechos: h } = antes;
  const c = buscar(h.categorias, x.categoriaId, 'categorias');
  if (esRechazo(c)) return c;
  const datos = { categoriaId: c.id };
  if (!puedeArchivar(c))
    return {
      codigo: c.clase === 'pago' ? 'categoria_de_pago_con_tarjeta' : 'categoria_ya_archivada',
      datos,
    };
  const bloqueos = bloqueosDeArchivo(antes, c.id);
  const cambios: H.Cambio[] = [];
  if (bloqueos.includes('disponible')) {
    const disp = disponibleEnA(antes, c.id);
    const destino = disp > 0 ? x.destinoDisponible : x.cubrirSobregiroCon;
    if (destino === undefined)
      return desactualizado(disp > 0 ? 'destinoDisponible' : 'cubrirSobregiroCon');
    const movidos = mover(antes, x.ids, c.id, destino, disp);
    if (esRechazo(movidos)) return movidos;
    cambios.push(...movidos);
  }
  if (bloqueos.includes('asignaciones_futuras')) {
    if (x.devolverAsignacionesFuturas !== true)
      return desactualizado('devolverAsignacionesFuturas');
    const futuras = h.asignaciones.filter(
      (a) => a.categoriaId === c.id && a.periodoInicio > antes.presupuesto.activo.inicio,
    );
    for (const a of futuras) cambios.push({ tipo: 'eliminar', tabla: 'asignaciones', id: a.id });
  }
  const activas = new Set(h.programadas.filter((p) => p.activa).map((p) => p.id));
  const lineas = h.programada_lineas.filter(
    (l) => l.categoriaId === c.id && activas.has(l.programadaId),
  );
  const decisiones = new Map((x.programadas ?? []).map((d) => [d.programadaId, d]));
  const pendientes = new Set(lineas.map((l) => l.programadaId).filter((p) => !decisiones.has(p)));
  if (pendientes.size > 0)
    return { codigo: 'programada_sin_decision', datos: { ...datos, n: pendientes.size } };
  for (const p of new Set(lineas.map((l) => l.programadaId))) {
    const d = decisiones.get(p) as H.DecisionProgramada;
    if (d.accion === 'desactivar') {
      cambios.push({ tipo: 'actualizar', tabla: 'programadas', id: p, campos: { activa: false } });
      continue;
    }
    const nueva = destinoValido(h, d.categoriaId, c.id);
    if (esRechazo(nueva)) return nueva;
    for (const l of lineas.filter((y) => y.programadaId === p))
      cambios.push({
        tipo: 'actualizar',
        tabla: 'programada_lineas',
        id: l.id,
        campos: { categoriaId: nueva.id },
      });
  }
  cambios.push({ tipo: 'actualizar', tabla: 'categorias', id: c.id, campos: { archivada: true } });
  return { cambios };
}
