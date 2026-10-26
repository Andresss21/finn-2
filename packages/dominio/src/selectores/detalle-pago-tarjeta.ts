// Detalle de una categoría de pago, pago(t) (04 §6.3, segundo bloque). Todo sale de la instantánea:
// la celda (§4.6), los traslados del reparto D2 (§4.5), los aportes D-3 y D-4 (§4.4), los pagos
// implícitos (§4.10), E(t) (§4.7), la tarjeta de hoy (§4.8) y el desglose al pagar (§4.14).
import { desgloseAlPagar } from '../calculo/patrimonio';
import type { Periodo } from '../calculo/periodos';
import type { Instantanea, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { type CausaDeExcedente, causasDelExcedente, nombres, type Ref } from './comunes';
import { proxima } from './cuentas';
import { celdasDelHistorial, vecinos } from './detalle-categoria';
import { porOrden } from './estructura';

interface Movimiento {
  readonly transaccionId: Uuid;
  readonly fecha: FechaLocal;
  readonly monto: Centavos;
}

export interface DetallePagoTarjeta {
  readonly categoria: Ref;
  readonly tarjeta: Ref;
  readonly clase: 'pago';
  readonly periodo: Periodo;
  readonly navegacion: { readonly anterior?: FechaLocal; readonly siguiente?: FechaLocal };
  readonly numeros: {
    readonly asignado: Centavos;
    readonly actividad: Centavos;
    readonly arrastre: Centavos;
    readonly disponible: Centavos;
  };
  /** R⁺, S y RE de hoy (§4.8). */
  readonly tarjetaHoy: {
    readonly deuda: Centavos;
    readonly saldoAFavor: Centavos;
    readonly reservado: Centavos;
    readonly faltaReservar: Centavos;
    readonly reservaExcedente: Centavos;
  };
  /** E(t, p); las causas (§4.7) solo existen en el período activo. */
  readonly pagoExcedente: {
    readonly total: Centavos;
    readonly causas: readonly CausaDeExcedente[];
  } | null;
  readonly traslados: readonly { readonly categoria: Ref; readonly monto: Centavos }[];
  readonly pagos: readonly Movimiento[];
  readonly pagosImplicitos: readonly Movimiento[];
  readonly devoluciones: readonly (Movimiento & { readonly caso: 'D-3' | 'D-4' })[];
  readonly desgloseAlPagar: {
    readonly deudaAnterior: Centavos;
    readonly cargosDelCiclo: Centavos;
    readonly yaPagado: Centavos;
    readonly paraNoGenerarIntereses: Centavos;
    readonly ultimoCorte: FechaLocal;
    readonly proximoPago: FechaLocal;
  };
  /** Hasta 6 períodos cerrados anteriores en que existía la categoría (CF-17), del más antiguo al más reciente. */
  readonly historial: readonly {
    readonly periodo: Periodo;
    readonly asignado: Centavos;
    readonly disponible: Centavos;
  }[];
}

const porFecha = <T extends { readonly fecha: FechaLocal }>(xs: T[]): T[] =>
  xs.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

/**
 * `consultas.detalleCategoria` de una categoría de pago (04 §6.3) en el período que empieza en
 * `periodoInicio` (por defecto, el activo). Lanza `RangeError` si la categoría no existe, es normal
 * o el período no está en el presupuesto; la consulta lo traduce a `NO_ENCONTRADO`.
 */
export function detallePagoTarjeta(
  i: Instantanea,
  categoriaId: Uuid,
  opciones: { readonly periodoInicio?: FechaLocal } = {},
): DetallePagoTarjeta {
  const h = i.hechos;
  const cat = h.categorias.find((x) => x.id === categoriaId);
  if (cat === undefined) throw new RangeError(`la categoría ${categoriaId} no existe`);
  if (cat.clase !== 'pago' || cat.tarjetaId === null)
    throw new RangeError(`la categoría ${categoriaId} no es de pago`);
  const t = cat.tarjetaId;
  const tarjeta = h.tarjetas.find((x) => x.cuentaId === t);
  const estado = i.tarjetas.find((x) => x.tarjetaId === t);
  if (tarjeta === undefined || estado === undefined)
    throw new RangeError(`la tarjeta ${t} no existe`);
  const { periodos, celdas, repartos, aportes } = i.presupuesto;
  const inicio = opciones.periodoInicio ?? i.presupuesto.activo.inicio;
  const k = periodos.findIndex((x) => x.inicio === inicio);
  const celda = celdas.find((x) => x.categoriaId === categoriaId && x.periodo.inicio === inicio);
  if (k < 0 || celda === undefined)
    throw new RangeError(`el período ${inicio} no está en el presupuesto`);
  const p = celda.periodo;
  const dentro = (f: FechaLocal) => p.inicio <= f && f <= p.fin;
  const n = nombres(i);
  const transaccion = new Map(h.transacciones.map((x) => [x.id, x]));
  const txDeLinea = new Map(h.lineas.map((l) => [l.id, l.transaccionId]));
  const saldo = i.cuentas.find((x) => x.cuentaId === t)?.saldo ?? Centavos.cero;
  const corte = desgloseAlPagar(h, tarjeta, i.hoy);

  const pagos = new Map<Uuid, Centavos>();
  for (const l of h.lineas) {
    const tx = transaccion.get(l.transaccionId);
    if (l.categoriaId === categoriaId && tx?.tipo === 'pago_tarjeta' && dentro(tx.fecha))
      pagos.set(tx.id, Centavos.sumar(pagos.get(tx.id) ?? Centavos.cero, l.monto));
  }

  return {
    categoria: n.categoria(categoriaId),
    tarjeta: n.cuenta(t),
    clase: 'pago',
    periodo: p,
    navegacion: vecinos(periodos, k),
    numeros: {
      asignado: celda.asignado,
      actividad: celda.actividad,
      arrastre: celda.arrastre,
      disponible: celda.disponible,
    },
    tarjetaHoy: {
      deuda: estado.deuda,
      saldoAFavor: Centavos.max(Centavos.cero, saldo),
      reservado: estado.reservado,
      faltaReservar: estado.sinRespaldo,
      reservaExcedente: estado.reservaExcedente,
    },
    pagoExcedente:
      celda.reinicio > 0
        ? {
            total: celda.reinicio,
            causas: p.inicio === i.presupuesto.activo.inicio ? causasDelExcedente(i, t) : [],
          }
        : null,
    // En el orden de las categorías (`orden`), no en el del reparto.
    traslados: [...h.categorias].sort(porOrden).flatMap((x) => {
      const monto = repartos
        .find((r) => r.categoriaId === x.id && r.periodo.inicio === inicio)
        ?.traslados.get(t);
      return monto === undefined || monto <= 0 ? [] : [{ categoria: n.categoria(x.id), monto }];
    }),
    pagos: porFecha(
      [...pagos].map(([id, monto]) => ({
        transaccionId: id,
        fecha: (transaccion.get(id) as { fecha: FechaLocal }).fecha,
        monto,
      })),
    ),
    pagosImplicitos: porFecha(
      i.porCobrar
        .filter((x) => x.medio.tarjetaId === null)
        .flatMap((x) =>
          x.eventos
            .filter(
              (e) =>
                e.tipo === 'cobro' &&
                e.cuenta?.tarjetaId === t &&
                e.restituido > 0 &&
                dentro(e.fecha),
            )
            .map((e) => ({ transaccionId: e.id, fecha: e.fecha, monto: e.restituido })),
        ),
    ),
    devoluciones: porFecha(
      aportes
        .filter(
          (a) => a.tarjetaId === t && dentro(a.fecha) && (a.caso === 'D-3' || a.caso === 'D-4'),
        )
        .map((a) => ({
          transaccionId: txDeLinea.get(a.lineaId) as Uuid,
          fecha: a.fecha,
          caso: a.caso as 'D-3' | 'D-4',
          monto: Centavos.negar(a.aPago),
        })),
    ),
    desgloseAlPagar: {
      deudaAnterior: corte.deudaAnterior,
      cargosDelCiclo: corte.cargosDelCiclo,
      yaPagado: corte.yaPagado,
      paraNoGenerarIntereses: corte.paraNoGenerarIntereses,
      ultimoCorte: corte.corte,
      proximoPago: proxima(tarjeta.diaPago, i.hoy),
    },
    historial: celdasDelHistorial(i, categoriaId, p).map((x) => ({
      periodo: x.periodo,
      asignado: x.asignado,
      disponible: x.disponible,
    })),
  };
}
