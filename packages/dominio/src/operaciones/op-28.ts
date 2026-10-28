// OP-28 Editar transacción (01 §5.4, 04 §3.4; P12, I6, supuestos 5 y 12, A-1): PE por campo según la
// tabla de 01 OP-28, y PC si estaba conciliada y cambió su fecha, su total o el efecto en la cuenta
// conciliada. Aquí viven también los eventos de una línea y el PC, que usa OP-29. Fecha contra apertura
// y hoy, archivo de cuentas y categorías e invariantes 9 a 11 los verifica `aplicar`.
import { capitalPendiente } from '../calculo/saldos';
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type { Efecto } from './aplicar';
import { pagoDe } from './op-01';
import { claveOrdenEditada, distintos } from './op-02';
import { buscar } from './op-07';
import { categoriaNormal, sumaDistinta } from './op-20';
import { esRechazo } from './rechazos';

type R = H.Rechazo;
type Destino = Pick<H.Linea, 'categoriaId' | 'deudorId'>;
type Objetivo = Destino & { readonly monto: Centavos; readonly linea?: H.Linea | undefined };

/** Los eventos de la línea (supuesto 12): sus devoluciones y las fechas de cobros, condonaciones y devoluciones. */
export function eventosDe(h: H.Hechos, l: H.Linea) {
  const devoluciones = h.lineas.filter((x) => x.lineaOriginalId === l.id);
  const de = new Set(devoluciones.map((x) => x.transaccionId));
  const fechas: FechaLocal[] = [
    ...h.transacciones.filter((t) => t.lineaCobradaId === l.id || de.has(t.id)).map((t) => t.fecha),
    ...h.condonaciones.filter((x) => x.lineaId === l.id).map((x) => x.fecha),
  ];
  return { devoluciones, fechas: fechas.sort() };
}

const conciliada = (t: H.Transaccion) =>
  t.estadoBancario === 'conciliada' && t.conciliacionId !== null;

/** AV-16 (P12, N6): antes de editar o eliminar una conciliada. */
export const av16 = (t: H.Transaccion): H.AvisoOperacion => ({
  ...{ codigo: 'AV-16', momento: 'antes', requiereConfirmacion: true },
  datos: { transaccionId: t.id },
});

/** PC (04 §3.0.4): la foto de lo conciliado; `transaccionId` nulo si la operación la elimina. */
export function cambioPosterior(
  h: H.Hechos,
  t: H.Transaccion,
  motivos: readonly H.MotivoCambio[],
  x: Pick<H.ComandoOp28, 'instante' | 'ids'>,
): H.Cambio {
  const conciliacionId = t.conciliacionId as H.Uuid;
  const cuentaId = h.conciliaciones.find((y) => y.id === conciliacionId)?.cuentaId;
  const efecto = h.efectos.find((e) => e.transaccionId === t.id && e.cuentaId === cuentaId);
  const transaccionId = motivos.includes('eliminacion') ? null : t.id;
  const foto = {
    fecha: t.fecha,
    montoEfecto: efecto?.monto ?? Centavos.cero,
    comercio: t.comercio,
  };
  const fila = { id: x.ids.siguiente(), conciliacionId, transaccionId, registradoEn: x.instante };
  return { tipo: 'insertar', tabla: 'cambios_posteriores', fila: { ...fila, motivos, ...foto } };
}

/** El destino pedido (04 §3.0.2); `deudorNuevo` reutiliza el deudor de igual nombre o lo crea. */
function destinoDe(h: H.Hechos, d: H.DestinoLinea, x: H.ComandoOp28, nuevos: H.Deudor[]) {
  if ('categoriaId' in d) {
    const c = categoriaNormal(h, d.categoriaId);
    return esRechazo(c) ? c : { categoriaId: c.id, deudorId: null };
  }
  if ('deudorId' in d) {
    const k = buscar(h.deudores, d.deudorId, 'deudores');
    return esRechazo(k) ? k : { categoriaId: null, deudorId: k.id };
  }
  const igual = (y: H.Deudor) => y.nombre.toLowerCase() === d.deudorNuevo.toLowerCase();
  const nombre = d.deudorNuevo;
  const k = h.deudores.find(igual) ??
    nuevos.find(igual) ?? { id: x.ids.siguiente(), nombre, revision: null };
  if (!h.deudores.includes(k) && !nuevos.includes(k)) nuevos.push(k);
  return { categoriaId: null, deudorId: k.id };
}

/** Tipos cuya cuenta pasa entre efectivo y tarjeta (01 OP-28; C-1 en la cuota). */
const DOS_MEDIOS = new Set<string>([
  'gasto',
  'cuota_prestamo',
  'abono_capital',
  'cobro',
  'devolucion',
]);

export function op28(antes: H.Instantanea, x: H.ComandoOp28): Efecto | R {
  const { hechos: h } = antes;
  const t = buscar(h.transacciones, x.transaccionId, 'transacciones');
  if (esRechazo(t)) return t;
  const total = x.total ?? t.total;
  const mal = (que: string) => new TypeError(`OP-28 ${t.id}: ${que}`);
  if (total <= 0) throw mal('total no positivo (CB-28)');
  const moneda = x.monedaOriginal === undefined ? t.monedaOriginal : x.monedaOriginal;
  const original = x.montoOriginal === undefined ? t.montoOriginal : x.montoOriginal;
  if ((moneda === null) !== (original === null)) throw mal('moneda y monto original juntos (M4)');
  const actuales = h.lineas
    .filter((l) => l.transaccionId === t.id)
    .sort((a, b) => a.orden - b.orden);
  const eventos = new Map(actuales.map((l) => [l, eventosDe(h, l)]));
  const ev = (l: H.Linea) => eventos.get(l) ?? { devoluciones: [], fechas: [] };

  // Fecha: ningún evento queda antes de la compra (inv. 12).
  const primero = actuales.flatMap((l) => ev(l).fechas).sort()[0];
  if (x.fecha !== undefined && primero !== undefined && primero < x.fecha)
    return { codigo: 'fecha_posterior_a_eventos', datos: { fecha: primero } };

  // Cuenta: un efecto movible toma `cuentaId`; dos, `origenId` (−) y `destinoId` (+).
  const tipoDe = new Map(h.cuentas.map((k) => [k.id, k.tipo]));
  const cuota = t.tipo === 'cuota_prestamo' || t.tipo === 'abono_capital';
  const efectos = h.efectos.filter((e) => e.transaccionId === t.id);
  const fijo = efectos.find((e) => cuota && tipoDe.get(e.cuentaId) === 'prestamo');
  const movibles = efectos.filter((e) => e !== fijo);
  const uno = movibles.length === 1;
  if (uno ? x.destinoId !== undefined : x.cuentaId !== undefined) throw mal('cuenta no aplicable');
  const nuevas = new Map<H.Uuid, H.Uuid>();
  for (const e of movibles) {
    const id = uno ? (x.cuentaId ?? x.origenId) : e.monto < 0 ? x.origenId : x.destinoId;
    if (id === undefined || id === e.cuentaId) continue;
    const k = buscar(h.cuentas, id, 'cuentas');
    if (esRechazo(k)) return k;
    const medio = k.tipo === 'efectivo' || k.tipo === 'tarjeta';
    if (DOS_MEDIOS.has(t.tipo) ? !medio : k.tipo !== tipoDe.get(e.cuentaId))
      return {
        codigo: 'cambio_tipo_de_cuenta_incompatible',
        datos: { cuentaId: k.id, tipo: k.tipo },
      };
    if (actuales.some((l) => ev(l).devoluciones.length > 0))
      return { codigo: 'cambio_cuenta_con_devoluciones', datos: { transaccionId: t.id } };
    nuevas.set(e.id, k.id);
  }
  const cuentaDe = (e: H.Efecto) => nuevas.get(e.id) ?? e.cuentaId;
  const igual = efectos.find((e, n) =>
    efectos.some((y, m) => m < n && cuentaDe(y) === cuentaDe(e)),
  );
  if (igual) return { codigo: 'cuentas_iguales', datos: { cuentaId: cuentaDe(igual) } };

  // Desglose de una cuota: las precondiciones de OP-24, con el pendiente sin esta cuota.
  if (x.desglose !== undefined && fijo === undefined) throw mal('sin desglose');
  let prestamo: Partial<H.Efecto> = {};
  if (fijo !== undefined) {
    const [abono, cero] = [t.tipo === 'abono_capital', Centavos.cero];
    const { capital, interes, seguro } =
      x.desglose ??
      (abono
        ? { capital: total, interes: cero, seguro: cero }
        : {
            capital: Centavos.negar(fijo.monto),
            interes: fijo.interes ?? cero,
            seguro: fijo.seguro ?? cero,
          });
    if ([capital, interes, seguro].some((v) => v < 0) || (abono && interes + seguro !== 0))
      throw mal(`desglose inválido ${capital}/${interes}/${seguro}`);
    const suma = Centavos.sumar(Centavos.sumar(capital, interes), seguro);
    if (suma !== total) return { codigo: 'desglose_no_cuadra', datos: { suma, total } };
    const pendiente = Centavos.restar(capitalPendiente(h, fijo.cuentaId), fijo.monto);
    if (capital > pendiente)
      return { codigo: 'capital_mayor_que_pendiente', datos: { capital, pendiente } };
    prestamo = { monto: Centavos.negar(capital), ...(abono ? {} : { interes, seguro }) };
  }

  // Líneas: la lista completa pedida, o las actuales (la única sigue al total).
  const deudores: H.Deudor[] = [];
  let objetivo: Objetivo[] = [];
  if (x.lineas === undefined)
    objetivo = actuales.map((l) => ({
      ...l,
      linea: l,
      monto: actuales.length === 1 ? total : l.monto,
    }));
  else if (actuales.length === 0) throw mal('sin líneas');
  for (const p of x.lineas ?? []) {
    const linea = actuales.find((l) => l.id === p.lineaId);
    if (p.lineaId !== undefined && (linea === undefined || objetivo.some((o) => o.linea === linea)))
      throw mal(`línea ${p.lineaId} ajena o repetida`);
    const pedido = p.destino ?? linea;
    if (pedido === undefined) throw mal('línea nueva sin destino');
    const mismo = (k: 'categoriaId' | 'deudorId') =>
      k in pedido && linea?.[k] === pedido[k as never];
    const d =
      mismo('categoriaId') || mismo('deudorId')
        ? (linea as H.Linea)
        : destinoDe(h, pedido as H.DestinoLinea, x, deudores);
    if (esRechazo(d)) return d;
    objetivo.push({ linea, monto: p.monto, categoriaId: d.categoriaId, deudorId: d.deudorId });
  }
  const tarjeta =
    t.tipo === 'pago_tarjeta' ? movibles.find((e) => nuevas.has(e.id) && e.monto > 0) : undefined;
  const pago = tarjeta && pagoDe(h, cuentaDe(tarjeta));
  if (pago) objetivo = objetivo.map((o) => ({ ...o, categoriaId: pago.id }));
  if (objetivo.some((o) => o.monto <= 0)) throw mal('línea no positiva (CB-28)');
  const distinta =
    actuales.length > 0 &&
    sumaDistinta(
      total,
      objetivo.map((o) => o.monto),
    );
  if (distinta) return distinta;

  // BE-16: una línea sin eventos que cambia se reemplaza; una con eventos cambia por F4.
  const lineas: H.Cambio[] = deudores.map((fila) => ({
    tipo: 'insertar',
    tabla: 'deudores',
    fila,
  }));
  let orden = Math.max(0, ...actuales.map((l) => l.orden));
  const insertar = ({ monto, categoriaId, deudorId }: Objetivo): H.Cambio => {
    const fila = { id: x.ids.siguiente(), transaccionId: t.id, orden: ++orden, monto, categoriaId };
    return {
      tipo: 'insertar',
      tabla: 'lineas',
      fila: { ...fila, deudorId, lineaOriginalId: null, revision: null },
    };
  };
  for (const l of actuales) {
    const o = objetivo.find((y) => y.linea === l);
    const { devoluciones, fechas } = ev(l);
    const campos =
      o && distintos(l, { monto: o.monto, categoriaId: o.categoriaId, deudorId: o.deudorId });
    if (o !== undefined && campos === undefined) continue;
    if (fechas.length === 0) {
      lineas.push({ tipo: 'eliminar', tabla: 'lineas', id: l.id }, ...(o ? [insertar(o)] : []));
      continue;
    }
    const de = antes.porCobrar.find((y) => y.lineaId === l.id);
    const resuelto = (
      de ? [de.restituido, de.condonado, de.devuelto] : devoluciones.map((y) => y.monto)
    ).reduce(Centavos.sumar, Centavos.cero);
    if (o === undefined || o.monto < resuelto)
      return { codigo: 'linea_menor_que_eventos', datos: { lineaId: l.id, resuelto } };
    if ((o.categoriaId === null) !== (l.categoriaId === null) || o.deudorId !== l.deudorId)
      return { codigo: 'linea_con_eventos_cambio_destino', datos: { lineaId: l.id } };
    // DB-05: sus devoluciones vinculadas no guardan destino; siguen a la línea sin escribirse.
    lineas.push({ tipo: 'actualizar', tabla: 'lineas', id: l.id, campos: campos ?? {} });
  }
  lineas.push(...objetivo.filter((o) => o.linea === undefined).map(insertar));

  // PE, y PC si cambió la fecha, el total o el efecto sobre la cuenta conciliada (P12).
  const nuevosEfectos = efectos.flatMap((e): H.Cambio[] => {
    const signo = e.monto < 0 ? Centavos.negar(total) : total;
    const campos = distintos(e, e === fijo ? prestamo : { cuentaId: cuentaDe(e), monto: signo });
    return campos ? [{ tipo: 'actualizar', tabla: 'efectos', id: e.id, campos }] : [];
  });
  const { fecha, comercio, nota, monedaOriginal, montoOriginal } = x;
  const tx: Partial<Record<keyof H.Transaccion, unknown>> = {
    ...distintos(t, { fecha, total: x.total, comercio, nota, monedaOriginal, montoOriginal }),
  };
  if (tx.fecha !== undefined) tx.claveOrden = claveOrdenEditada(x.instante, t.claveOrden);
  const cuentaConciliada = h.conciliaciones.find((y) => y.id === t.conciliacionId)?.cuentaId;
  const motivos: H.MotivoCambio[] = tx.total === undefined ? [] : ['monto'];
  if (tx.fecha !== undefined) motivos.push('fecha');
  if (efectos.some((e) => nuevas.has(e.id) && e.cuentaId === cuentaConciliada))
    motivos.push('cuenta');
  const pc = conciliada(t) && motivos.length > 0;
  if (pc) Object.assign(tx, { estadoBancario: 'confirmada', conciliacionId: null });
  const cambios: H.Cambio[] = [
    ...(Object.keys(tx).length > 0
      ? [{ tipo: 'actualizar', tabla: 'transacciones', id: t.id, campos: tx } as H.Cambio]
      : []),
    ...nuevosEfectos,
    ...lineas,
    ...(pc ? [cambioPosterior(h, t, motivos, x)] : []),
  ];
  return { cambios, avisos: conciliada(t) && cambios.length > 0 ? [av16(t)] : [] };
}
