// OP-12 Fusionar categorías (01 §5.2, 04 §3.2 y §4.5.4): todo lo que apunta al origen pasa al
// destino, sus asignaciones se suman en cada período, también los cerrados (O4, inv. 18), y el
// origen y su meta se eliminan; la del destino se conserva (CB-20). Siempre se confirma (AV-13).
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { ajustar } from './op-09';
import { esRechazo } from './rechazos';

const AV13 = { codigo: 'AV-13', momento: 'antes', requiereConfirmacion: true } as const;

export function op12(antes: H.Instantanea, x: H.ComandoOp12): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const [o, d] = [
    buscar(h.categorias, x.origenId, 'categorias'),
    buscar(h.categorias, x.destinoId, 'categorias'),
  ];
  if (esRechazo(o)) return o;
  if (esRechazo(d)) return d;
  const datos = { origenId: o.id, destinoId: d.id };
  if (o.id === d.id) return { codigo: 'fusion_misma_categoria', datos };
  if (o.clase === 'pago' || d.clase === 'pago')
    return { codigo: 'fusion_categoria_de_pago', datos };
  if (d.archivada) return { codigo: 'fusion_destino_archivado', datos };
  const del = <T extends { readonly categoriaId: H.Uuid | null }>(xs: readonly T[]) =>
    xs.filter((y) => y.categoriaId === o.id);
  const a = { categoriaId: d.id };
  const pasan = (tabla: H.TablaEscribible, xs: readonly { readonly id: H.Uuid }[]) =>
    xs.map((y) => ({ tipo: 'actualizar', tabla, id: y.id, campos: a }) as H.Cambio);
  const asignaciones = del(h.asignaciones);
  const meta = h.metas.find((m) => m.categoriaId === o.id);
  const [programadas, reglas] = [del(h.programada_lineas), del(x.reglas)];
  const cambios: H.Cambio[] = [
    ...pasan('lineas', del(h.lineas)),
    ...pasan('condonaciones', del(h.condonaciones)),
    ...pasan('programada_lineas', programadas),
    ...pasan('reglas_comercio', reglas),
    ...pasan('movimiento_lineas', del(x.movimientoLineas)),
    ...asignaciones.map((y): H.Cambio => ({ tipo: 'eliminar', tabla: 'asignaciones', id: y.id })),
    ...(meta ? [{ tipo: 'eliminar', tabla: 'metas', id: meta.id } as const] : []),
    { tipo: 'eliminar', tabla: 'categorias', id: o.id },
    ...asignaciones.flatMap((y) => ajustar(h, x.ids, d.id, y.periodoInicio, y.monto)),
  ];
  // AV-13: lo que se suma en cada período, la meta que se descarta y lo que se mueve; los Δ de LPA y
  // de Disp(destino, A) van en el impacto del mismo resultado (04 §4.3).
  const periodos = Object.fromEntries(
    asignaciones.map((y) => [`asignado:${y.periodoInicio}`, y.monto]),
  );
  const movidos = {
    programadas: new Set(programadas.map((l) => l.programadaId)).size,
    reglas: reglas.length,
  };
  const aviso = {
    ...AV13,
    datos: { ...datos, ...periodos, ...movidos, metaDescartada: meta?.tipo ?? false },
  };
  return { cambios, avisos: [aviso], operacionDeclarada: 'fusion' };
}
