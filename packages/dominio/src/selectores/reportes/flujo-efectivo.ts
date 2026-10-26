// Flujo de efectivo (06 §3.3, FD-07, CF-02): cuánto cambió el efectivo real en cada período de W y
// por qué. Cada efecto en una cuenta de efectivo con fecha en el período va a exactamente una fila,
// según el tipo de su transacción, así que saldo inicial + Σ filas = saldo final (V6-03). La
// acción de cierre va como datos, sin texto (04 §7.10).
import { saldoAl } from '../../calculo/saldos';
import type { Instantanea, TipoTransaccion, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { nombres, type PeriodoDto, periodoDto, type Ref } from '../comunes';
import {
  conjuntoDeCuentas,
  contexto,
  dentro,
  type FiltroDeReporte,
  periodosDeVentana,
  type Rango,
  suma,
} from './comunes';

export type ParametrosFlujo = FiltroDeReporte;

export type FilaFlujo =
  | 'saldos_iniciales'
  | 'ingresos'
  | 'restituciones'
  | 'devoluciones'
  | 'otras_entradas'
  | 'gastos_debito'
  | 'por_cobrar_debito'
  | 'pagos_tarjeta'
  | 'prestamos_inversiones'
  | 'transferencias';

/** Las filas en el orden de la tabla de 3.3; `transferencias` solo aparece si no es cero (filtro). */
export const FILAS_DE_FLUJO: readonly FilaFlujo[] = [
  'saldos_iniciales',
  'ingresos',
  'restituciones',
  'devoluciones',
  'otras_entradas',
  'gastos_debito',
  'por_cobrar_debito',
  'pagos_tarjeta',
  'prestamos_inversiones',
  'transferencias',
];

export interface PeriodoDeFlujo {
  readonly periodo: PeriodoDto;
  readonly saldoInicial: Centavos;
  readonly saldoFinal: Centavos;
  /** Con signo. */
  readonly filas: readonly { readonly fila: FilaFlujo; readonly monto: Centavos }[];
  readonly comprasConTarjeta: Centavos;
}

export type AccionDeFlujo =
  /** OP-14 sobre pago(t): "Reservar {monto} para {tarjeta}". */
  | {
      readonly tipo: 'reservar';
      readonly tarjeta: Ref;
      readonly categoriaId: Uuid;
      readonly monto: Centavos;
      readonly montoNuevo: Centavos;
    }
  | { readonly tipo: 'ver'; readonly reporte: 'remanente' };

export interface HallazgoDeFlujo {
  readonly tipo: 'flujo';
  readonly clave: string;
  /** S(t) de la tarjeta con más falta por reservar. */
  readonly impacto: Centavos;
  readonly estado: 'deuda-sin-respaldo';
  readonly tarjeta: Ref;
  readonly comprasConTarjeta: Centavos;
  /** Pagos de tarjeta del período activo, como monto ≥ 0. */
  readonly pagosTarjeta: Centavos;
  readonly accion: Extract<AccionDeFlujo, { tipo: 'reservar' }>;
}

export interface FlujoEfectivoSel {
  readonly periodos: readonly PeriodoDeFlujo[];
  /** La propuesta o el enlace con que termina el reporte (3.3, "Acción"). */
  readonly accion: AccionDeFlujo;
  /** Uno si la acción es "Reservar"; si no, ninguno. */
  readonly hallazgos: readonly HallazgoDeFlujo[];
}

/** Tipos cuyo efecto en efectivo es una entrada o salida que va a una fila propia. */
const FILA_POR_TIPO: Partial<Record<TipoTransaccion, FilaFlujo>> = {
  saldo_inicial: 'saldos_iniciales',
  ingreso: 'ingresos',
  devolucion: 'devoluciones',
  desembolso_prestamo: 'otras_entradas',
  retiro_inversion: 'otras_entradas',
  avance_efectivo: 'otras_entradas',
  pago_tarjeta: 'pagos_tarjeta',
  cuota_prestamo: 'prestamos_inversiones',
  abono_capital: 'prestamos_inversiones',
  aporte_inversion: 'prestamos_inversiones',
  transferencia: 'transferencias',
};

const menor = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** El reporte `flujo_efectivo`: filas por período de W y la acción de cierre. */
export function flujoEfectivo(i: Instantanea, parametros: ParametrosFlujo = {}): FlujoEfectivoSel {
  const h = i.hechos;
  const nom = nombres(i);
  const k = conjuntoDeCuentas(parametros.cuentaIds);
  // K restringido a cuentas de efectivo, archivadas incluidas.
  const efectivo = new Set(
    h.cuentas
      .filter((x) => x.tipo === 'efectivo' && (k === undefined || k.has(x.id)))
      .map((x) => x.id),
  );
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const deK = new Map<Uuid, Centavos>();
  for (const e of h.efectos)
    if (efectivo.has(e.cuentaId))
      deK.set(e.transaccionId, Centavos.sumar(deK.get(e.transaccionId) ?? Centavos.cero, e.monto));
  const cobros = new Map(
    i.porCobrar.flatMap((x) => x.eventos.filter((e) => e.tipo === 'cobro')).map((e) => [e.id, e]),
  );
  const deudor = new Map<Uuid, Centavos>();
  for (const l of h.lineas)
    if (l.deudorId !== null)
      deudor.set(
        l.transaccionId,
        Centavos.sumar(deudor.get(l.transaccionId) ?? Centavos.cero, l.monto),
      );
  const consumosConTarjeta = contexto(i).consumos.filter((x) => x.tarjetaId !== null);

  const calcular = (p: Rango): Omit<PeriodoDeFlujo, 'periodo'> => {
    const hasta = p.fin < i.hoy ? p.fin : i.hoy;
    const montos = new Map<FilaFlujo, Centavos>(FILAS_DE_FLUJO.map((f) => [f, Centavos.cero]));
    const sumarA = (f: FilaFlujo, m: Centavos) =>
      montos.set(f, Centavos.sumar(montos.get(f) ?? Centavos.cero, m));
    for (const [id, total] of deK) {
      const t = txs.get(id);
      if (t === undefined || !dentro({ inicio: p.inicio, fin: hasta }, t.fecha)) continue;
      if (t.tipo === 'gasto') {
        // Las líneas por cobrar no pasan de lo que salió del efectivo.
        const porCobrar =
          total < 0
            ? Centavos.min(Centavos.negar(total), deudor.get(t.id) ?? Centavos.cero)
            : Centavos.cero;
        sumarA('por_cobrar_debito', Centavos.negar(porCobrar));
        sumarA('gastos_debito', Centavos.sumar(total, porCobrar));
      } else if (t.tipo === 'cobro') {
        const restituido = Centavos.min(total, cobros.get(t.id)?.restituido ?? Centavos.cero);
        sumarA('restituciones', restituido);
        sumarA('ingresos', Centavos.restar(total, restituido));
      } else {
        // Un tipo sin efecto en efectivo no debería llegar aquí; si llega, la identidad se conserva.
        sumarA(
          FILA_POR_TIPO[t.tipo] ?? (total < 0 ? 'prestamos_inversiones' : 'otras_entradas'),
          total,
        );
      }
    }
    const antes = FechaLocal.sumarDias(p.inicio, -1);
    const alFin = (f: FechaLocal) => suma([...efectivo].map((c) => saldoAl(h, c, f)));
    return {
      saldoInicial: alFin(antes),
      saldoFinal: alFin(hasta),
      filas: FILAS_DE_FLUJO.flatMap((fila) => {
        const monto = montos.get(fila) ?? Centavos.cero;
        return fila === 'transferencias' && monto === 0 ? [] : [{ fila, monto }];
      }),
      comprasConTarjeta: suma(
        consumosConTarjeta.filter((x) => dentro(p, x.fecha)).map((x) => x.neto),
      ),
    };
  };

  const ventana = periodosDeVentana(i, parametros.ventana);
  const periodos = ventana.map((p): PeriodoDeFlujo => ({
    periodo: periodoDto(i, p),
    ...calcular(p),
  }));

  // Acción: se evalúa sobre el período activo, esté o no en la ventana.
  const a = i.presupuesto.activo;
  const activo = calcular(a);
  const pagosTarjeta = Centavos.negar(
    activo.filas.find((x) => x.fila === 'pagos_tarjeta')?.monto ?? Centavos.cero,
  );
  const mayor = i.tarjetas
    .filter((t) => t.sinRespaldo > 0)
    .sort((x, y) => y.sinRespaldo - x.sinRespaldo || menor(x.tarjetaId, y.tarjetaId))[0];
  const pago =
    mayor === undefined
      ? undefined
      : i.presupuesto.celdas.find(
          (x) =>
            x.clase === 'pago' && x.tarjetaId === mayor.tarjetaId && x.periodo.inicio === a.inicio,
        );
  if (mayor === undefined || pago === undefined || activo.comprasConTarjeta <= pagosTarjeta)
    return { periodos, accion: { tipo: 'ver', reporte: 'remanente' }, hallazgos: [] };
  const accion = {
    tipo: 'reservar',
    tarjeta: nom.cuenta(mayor.tarjetaId),
    categoriaId: pago.categoriaId,
    monto: mayor.sinRespaldo,
    montoNuevo: Centavos.sumar(pago.asignado, mayor.sinRespaldo),
  } as const;
  return {
    periodos,
    accion,
    hallazgos: [
      {
        tipo: 'flujo',
        clave: `tarjeta:${mayor.tarjetaId}`,
        impacto: mayor.sinRespaldo,
        estado: 'deuda-sin-respaldo',
        tarjeta: accion.tarjeta,
        comprasConTarjeta: activo.comprasConTarjeta,
        pagosTarjeta,
        accion,
      },
    ],
  };
}
