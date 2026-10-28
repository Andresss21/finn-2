// `verificarInvariantes(i)` (04 §2.4): los invariantes de 01 §6 que se pueden comprobar sobre una
// sola instantánea. Comprueba las relaciones de §6 entre los derivados que ya trae y los hechos;
// no llama a las fórmulas de calculo/, para que un error en ellas no se compruebe contra sí mismo.
//
// No se comprueban aquí: 5 (cada dólar una vez, que en los totales es inv. 1), 7 (las líneas no
// tienen fecha por tipo), 13 a 16 (revisión, programadas y conciliación no entran en ningún
// derivado; 14 a 16 son de tablas [H]), 18 a 21 (comparan antes y después de una operación: los
// valida `aplicar`, 5.0) y 26 y 27 (propiedades del motor, con su prueba).
import { destinoDe } from './calculo/destino';
import type { Hechos, Instantanea, TipoTransaccion, Uuid, Violacion } from './hechos';
import { Centavos } from './valores/centavos';
import { FechaLocal } from './valores/fecha-local';

const cero = Centavos.cero;
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, cero);
const positivo = (x: Centavos) => Centavos.max(cero, x);

/** Tipos con líneas (inv. 6, 2.2.9). */
const CON_LINEAS: ReadonlySet<TipoTransaccion> = new Set<TipoTransaccion>([
  'gasto',
  'devolucion',
  'pago_tarjeta',
  'cuota_prestamo',
  'abono_capital',
  'aporte_inversion',
]);

type Detalle = NonNullable<Violacion['detalle']>;

/** Las filas de `xs` agrupadas por `clave`, en una pasada. */
function agrupar<T>(xs: readonly T[], clave: (x: T) => string): ReadonlyMap<string, readonly T[]> {
  const m = new Map<string, T[]>();
  for (const x of xs) {
    const k = clave(x);
    const grupo = m.get(k);
    if (grupo === undefined) m.set(k, [x]);
    else grupo.push(x);
  }
  return m;
}

/** Inv. 25: cada referencia de una fila apunta a una fila que existe. */
function referencias(h: Hechos): [string, string][] {
  const ids = (xs: readonly { readonly id: Uuid }[]) => new Set<string>(xs.map((x) => x.id));
  const cuentas = ids(h.cuentas);
  const txs = ids(h.transacciones);
  const lineas = ids(h.lineas);
  const categorias = ids(h.categorias);
  const programadas = ids(h.programadas);
  const grupos = ids(h.grupos);
  const deudores = ids(h.deudores);
  const pares: (readonly [string, string | null, ReadonlySet<string>])[] = [
    ...h.categorias.flatMap((x) => [
      [x.id, x.grupoId, grupos] as const,
      [x.id, x.tarjetaId, cuentas] as const,
    ]),
    ...[...h.tarjetas, ...h.prestamos, ...h.inversiones].map(
      (x) => [x.cuentaId, x.cuentaId, cuentas] as const,
    ),
    ...h.asignaciones.map((x) => [x.id, x.categoriaId, categorias] as const),
    ...h.metas.map((x) => [x.id, x.categoriaId, categorias] as const),
    ...h.transacciones.map((x) => [x.id, x.lineaCobradaId, lineas] as const),
    ...h.efectos.flatMap((x) => [
      [x.id, x.transaccionId, txs] as const,
      [x.id, x.cuentaId, cuentas] as const,
    ]),
    ...h.lineas.flatMap((x) => [
      [x.id, x.transaccionId, txs] as const,
      [x.id, x.categoriaId, categorias] as const,
      [x.id, x.deudorId, deudores] as const,
      [x.id, x.lineaOriginalId, lineas] as const,
    ]),
    ...h.condonaciones.flatMap((x) => [
      [x.id, x.lineaId, lineas] as const,
      [x.id, x.categoriaId, categorias] as const,
    ]),
    ...h.programadas.map((x) => [x.id, x.cuentaId, cuentas] as const),
    ...h.programada_lineas.map((x) => [x.id, x.programadaId, programadas] as const),
    ...h.ocurrencias_resueltas.map((x) => [x.id, x.programadaId, programadas] as const),
    ...h.conciliaciones.map((x) => [x.id, x.cuentaId, cuentas] as const),
  ];
  return pares.flatMap(([de, a, en]): [string, string][] =>
    a === null || en.has(a) ? [] : [[de, a]],
  );
}

/** Las violaciones de los invariantes calculables de 01 §6, en orden de invariante. */
export function verificarInvariantes(i: Instantanea): readonly Violacion[] {
  const v: Violacion[] = [];
  const falla = (invariante: number, detalle: Detalle) => v.push({ invariante, detalle });
  const h = i.hechos;
  const b = i.presupuesto;
  const A = b.activo.inicio;
  const delActivo = b.celdas.filter((x) => x.periodo.inicio === A);
  const saldoDe = new Map(i.cuentas.map((k) => [k.cuentaId, k.saldo]));
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const lineas = new Map(h.lineas.map((l) => [l.id, l]));
  const categorias = new Map(h.categorias.map((x) => [x.id, x]));
  const cuentas = new Map(h.cuentas.map((k) => [k.id, k]));
  const efectosDe = agrupar(h.efectos, (e) => e.transaccionId);
  const efectosEn = agrupar(h.efectos, (e) => e.cuentaId);
  const lineasDe = agrupar(h.lineas, (l) => l.transaccionId);

  // 1. Σ efectivo = LPA + Σ_c Disp(c, A) + Σ asignaciones futuras + SobTA.
  const efectivo = suma(i.cuentas.filter((k) => k.tipo === 'efectivo').map((k) => k.saldo));
  const derecha = suma([
    i.lpa.total,
    ...delActivo.map((x) => x.disponible),
    ...h.asignaciones.filter((a) => a.periodoInicio > A).map((a) => a.monto),
    i.sobregiroConTarjeta,
  ]);
  if (efectivo !== derecha) falla(1, { efectivo, derecha });

  // 2 y 3. S(t) y RE(t) con deuda(t) y R⁺(t) = máx(0, Disp(pago(t), A)); S(t) = 0 o RE(t) = 0.
  for (const x of i.tarjetas) {
    const pago = delActivo.find((y) => y.clase === 'pago' && y.tarjetaId === x.tarjetaId);
    const r = positivo(pago?.disponible ?? cero);
    const deuda = positivo(Centavos.negar(saldoDe.get(x.tarjetaId) ?? cero));
    if (x.sinRespaldo !== positivo(Centavos.restar(deuda, r)))
      falla(2, { tarjeta: x.tarjetaId, s: x.sinRespaldo });
    if (
      x.reservaExcedente !== positivo(Centavos.restar(r, deuda)) ||
      Math.min(x.sinRespaldo, x.reservaExcedente) !== 0
    )
      falla(3, { tarjeta: x.tarjetaId, re: x.reservaExcedente });
  }

  // 4. Saldo = Σ de los efectos de la cuenta (en un préstamo, `monto` ya es solo el capital).
  for (const k of i.cuentas) {
    const efectos = suma((efectosEn.get(k.cuentaId) ?? []).map((e) => e.monto));
    if (efectos !== k.saldo) falla(4, { cuenta: k.cuentaId, saldo: k.saldo, efectos });
  }

  // 6, 8, 10, 11 y 12 por transacción y por línea.
  const devuelto = new Map<string, Centavos>();
  for (const l of h.lineas) {
    const original = l.lineaOriginalId === null ? undefined : lineas.get(l.lineaOriginalId);
    if (txs.get(l.transaccionId)?.tipo !== 'devolucion' || original === undefined) continue;
    for (const k of [original.id, original.transaccionId])
      devuelto.set(k, Centavos.sumar(devuelto.get(k) ?? cero, l.monto));
    const compra = txs.get(original.transaccionId);
    const fecha = txs.get(l.transaccionId)?.fecha;
    if (compra !== undefined && fecha !== undefined && fecha < compra.fecha)
      falla(12, { linea: l.id, fecha });
  }
  for (const t of h.transacciones) {
    const propias = lineasDe.get(t.id) ?? [];
    const suyos = efectosDe.get(t.id) ?? [];
    if (CON_LINEAS.has(t.tipo) ? suma(propias.map((l) => l.monto)) !== t.total : propias.length > 0)
      falla(6, { transaccion: t.id });
    const tarjetasDeT = new Set(suyos.map((e) => e.cuentaId));
    for (const l of propias) {
      // DB-05: una devolución vinculada tiene el destino de su línea original.
      const { categoriaId, deudorId } = destinoDe(l, lineas);
      const x = categoriaId === null ? undefined : categorias.get(categoriaId);
      const ok =
        t.tipo === 'pago_tarjeta'
          ? x?.clase === 'pago' && x.tarjetaId !== null && tarjetasDeT.has(x.tarjetaId)
          : x === undefined
            ? categoriaId === null && deudorId !== null
            : x.clase === 'normal';
      if (!ok) falla(8, { linea: l.id });
      if (l.categoriaId !== null && (devuelto.get(l.id) ?? cero) > l.monto)
        falla(10, { linea: l.id });
    }
    if ((devuelto.get(t.id) ?? cero) > t.total) falla(11, { transaccion: t.id });
    const aperturas = suyos.map((e) => cuentas.get(e.cuentaId)?.fechaApertura ?? t.fecha);
    const cobrada = t.lineaCobradaId === null ? undefined : lineas.get(t.lineaCobradaId);
    const compra = cobrada === undefined ? undefined : txs.get(cobrada.transaccionId);
    if (
      t.fecha > i.hoy ||
      aperturas.some((f) => t.fecha < f) ||
      (compra !== undefined && t.fecha < compra.fecha)
    )
      falla(12, { transaccion: t.id, fecha: t.fecha });
  }
  for (const x of h.condonaciones) {
    const l = lineas.get(x.lineaId);
    const compra = l === undefined ? undefined : txs.get(l.transaccionId);
    if (x.fecha > i.hoy || (compra !== undefined && x.fecha < compra.fecha))
      falla(12, { condonacion: x.id, fecha: x.fecha });
  }

  // 9. Restituido + condonado + devuelto ≤ monto, y el saldo abierto nunca es negativo.
  for (const x of i.porCobrar)
    if (suma([x.restituido, x.condonado, x.devuelto]) > x.monto || x.abierto < 0)
      falla(9, { linea: x.lineaId });

  // 17. Períodos sin huecos ni solapamientos y exactamente un período activo, el que contiene hoy.
  const ps = b.periodos;
  ps.forEach((p, k) => {
    const siguiente = ps[k + 1];
    if (siguiente !== undefined && siguiente.inicio !== FechaLocal.sumarDias(p.fin, 1))
      falla(17, { periodo: p.inicio });
  });
  const activos = ps.filter((p) => p.inicio <= i.hoy && i.hoy <= p.fin);
  if (activos.length !== 1 || activos[0]?.inicio !== A) falla(17, { activo: A });

  // 22. Cada tarjeta, exactamente una categoría de pago; cada categoría de pago, de una tarjeta.
  for (const k of h.cuentas.filter((y) => y.tipo === 'tarjeta')) {
    const pagos = h.categorias.filter((x) => x.clase === 'pago' && x.tarjetaId === k.id);
    if (pagos.length !== 1) falla(22, { tarjeta: k.id, categorias: pagos.length });
  }
  for (const x of h.categorias.filter((y) => y.clase === 'pago'))
    if (x.tarjetaId === null || cuentas.get(x.tarjetaId)?.tipo !== 'tarjeta')
      falla(22, { categoria: x.id });

  // 23. Una categoría de pago no tiene meta.
  for (const m of h.metas)
    if (categorias.get(m.categoriaId)?.clase === 'pago') falla(23, { meta: m.id });

  // 24. Una cuenta archivada tiene saldo cero (así, una tarjeta con deuda no está archivada).
  for (const k of h.cuentas)
    if (k.archivada && (saldoDe.get(k.id) ?? cero) !== 0) falla(24, { cuenta: k.id });

  // 25. Ninguna referencia colgante.
  for (const [de, a] of referencias(h)) falla(25, { fila: de, referencia: a });

  // 28. 0 ≤ SobT(c, p) ≤ sobregiro total, en toda celda.
  for (const x of b.celdas)
    if (x.sobT < 0 || x.sobT > x.reinicio)
      falla(28, { categoria: x.categoriaId, periodo: x.periodo.inicio });

  return v.sort((x, y) => x.invariante - y.invariante);
}
