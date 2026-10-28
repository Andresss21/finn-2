// OP-42 Crear, editar, desactivar o reactivar una programada (01 §5.7, 04 §3.7; P17, M3, CF-20):
// cuentas abiertas y del tipo de 03 §4.5.4; líneas a categorías normales activas que suman el monto;
// el calendario no cambia con historial (P3-6b, HZ-3). Sin efecto presupuestario (inv. 13).
// Reactivar fija `reactivadaDesde` = hoy; desactivar no la toca.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { distintos } from './op-02';
import { buscar } from './op-07';
import { categoriaNormal, cuentaDe, sumaDistinta } from './op-20';
import { esRechazo, rechazo } from './rechazos';

type Lineas = 'una' | 'varias' | 'ninguna';
type Forma = readonly [origen: H.TipoCuenta[], destino: H.TipoCuenta | null, lineas: Lineas];
/** Cuentas de origen, de destino y líneas por tipo (03 §4.5.4; DB-16: el pago no guarda líneas). */
const FORMA: Readonly<Record<H.TipoProgramada, Forma>> = {
  gasto: [['efectivo', 'tarjeta'], null, 'varias'],
  pago_tarjeta: [['efectivo'], 'tarjeta', 'ninguna'],
  cuota_prestamo: [['efectivo', 'tarjeta'], 'prestamo', 'una'],
  aporte_inversion: [['efectivo'], 'inversion', 'una'],
};
const CAMPOS = [
  ...['tipo', 'cuentaId', 'cuentaDestinoId', 'comercio', 'monto', 'tolerancia', 'frecuencia'],
  ...['frecuenciaDias', 'primeraFecha', 'fechaFin', 'registroAutomatico'],
] as const;
const CALENDARIO = ['primeraFecha', 'frecuencia', 'frecuenciaDias'];

/** Una cuenta del tipo pedido y abierta (§5.0.5). */
function abierta(h: H.Hechos, id: H.Uuid, tipos: H.TipoCuenta[]): H.Rechazo | undefined {
  const k = cuentaDe(h, id, ...tipos);
  if (esRechazo(k)) return k;
  return k.archivada ? rechazo('cuenta_archivada', { cuentaId: k.id }) : undefined;
}

/** Las precondiciones de la programada `id` resultante y sus líneas (04 OP-42). */
function validar(
  h: H.Hechos,
  id: H.Uuid,
  p: H.CamposProgramada,
  lineas: readonly H.LineaProgramada[],
): H.Rechazo | undefined {
  const [origen, destino, forma] = FORMA[p.tipo];
  const n = lineas.length;
  const cuantas = forma === 'ninguna' ? n === 0 : forma === 'una' ? n === 1 : n > 0;
  const fin = p.fechaFin !== null && p.fechaFin < p.primeraFecha;
  const dias = (p.frecuencia === 'cada_n_dias') !== (p.frecuenciaDias !== null);
  const sinDestino = (destino === null) !== (p.cuentaDestinoId === null);
  if (p.monto <= 0 || p.tolerancia < 0 || !cuantas || fin || dias || sinDestino)
    throw new TypeError(`OP-42: programada ${p.tipo} mal formada`);
  const r = abierta(h, p.cuentaId, origen);
  if (r) return r;
  if (destino !== null && p.cuentaDestinoId !== null) {
    const d = abierta(h, p.cuentaDestinoId, [destino]);
    if (d) return d;
  }
  if (n > 0) {
    const distinta = sumaDistinta(
      p.monto,
      lineas.map((l) => l.monto),
    );
    if (distinta) return distinta;
  }
  for (const l of lineas) {
    const c = categoriaNormal(h, l.categoriaId);
    if (esRechazo(c)) return c;
    if (c.archivada) return rechazo('categoria_archivada', { categoriaId: c.id });
  }
  // QB-1 [R2]: el registro automático de una cuota necesita el modelo de cálculo del préstamo.
  const prestamo = h.prestamos.find((x) => x.cuentaId === p.cuentaDestinoId);
  if (p.tipo === 'cuota_prestamo' && p.registroAutomatico && !prestamo?.modeloCalculo)
    return { codigo: 'registro_automatico_sin_modelo', datos: { programadaId: id } };
  return undefined;
}

/** F2 de las líneas viejas y F3 de las nuevas, con orden nuevo 1..n (BE-16). */
function lineasNuevas(
  h: H.Hechos,
  programadaId: H.Uuid,
  lineas: readonly H.LineaProgramada[],
  ids: H.GeneradorIds,
): H.Cambio[] {
  const tabla = 'programada_lineas';
  const viejas = h.programada_lineas.filter((l) => l.programadaId === programadaId);
  return [
    ...viejas.map((l): H.Cambio => ({ tipo: 'eliminar', tabla, id: l.id })),
    ...lineas.map((l, k): H.Cambio => {
      const fila = { id: ids.siguiente(), programadaId, orden: k + 1, ...l, revision: null };
      return { tipo: 'insertar', tabla, fila };
    }),
  ];
}

export function op42(antes: H.Instantanea, x: H.ComandoOp42): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const tabla = 'programadas';
  if (x.accion === 'crear') {
    const campos = Object.fromEntries(CAMPOS.map((k) => [k, x[k]])) as H.CamposProgramada;
    const r = validar(h, x.id, campos, x.lineas);
    if (r) return r;
    const fila = { id: x.id, ...campos, activa: true, reactivadaDesde: null, revision: null };
    const lineas = lineasNuevas(h, x.id, x.lineas, x.ids);
    return { cambios: [{ tipo: 'insertar', tabla, fila }, ...lineas] };
  }
  const p = buscar(h.programadas, x.programadaId, tabla);
  if (esRechazo(p)) return p;
  const actuales = h.programada_lineas
    .filter((l) => l.programadaId === p.id)
    .sort((a, b) => a.orden - b.orden)
    .map(({ monto, categoriaId }) => ({ monto, categoriaId }));
  if (x.accion === 'activar') {
    if (x.activa === p.activa) return { cambios: [] };
    const campos = x.activa ? { activa: true, reactivadaDesde: antes.hoy } : { activa: false };
    const r = x.activa ? validar(h, p.id, p, actuales) : undefined;
    return r ?? { cambios: [{ tipo: 'actualizar', tabla, id: p.id, campos }] };
  }
  const campos = distintos(p, x.campos ?? {}) ?? {};
  const historial =
    x.coincidencias > 0 || h.ocurrencias_resueltas.some((o) => o.programadaId === p.id);
  if (historial && CALENDARIO.some((k) => k in campos))
    return { codigo: 'calendario_con_historial', datos: { programadaId: p.id } };
  const r = validar(h, p.id, { ...p, ...campos }, x.lineas ?? actuales);
  if (r) return r;
  const cambios: H.Cambio[] =
    Object.keys(campos).length > 0 ? [{ tipo: 'actualizar', tabla, id: p.id, campos }] : [];
  if (x.lineas !== undefined) cambios.push(...lineasNuevas(h, p.id, x.lineas, x.ids));
  return { cambios };
}
