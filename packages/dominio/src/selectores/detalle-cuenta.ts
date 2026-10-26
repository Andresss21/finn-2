// Detalle de cuenta (04 §6.6). Saldos, tarjeta y préstamo salen de la instantánea y de las funciones
// del motor (`desgloseAlPagar`, `bancoAgricola`); las tablas [H] (instituciones, cambios posteriores)
// llegan como parámetro.
import { cicloDeFacturacion, desgloseAlPagar } from '../calculo/patrimonio';
import { saldoAl } from '../calculo/saldos';
import type {
  CambioPosterior,
  Cuenta,
  EstadoBancario,
  Institucion,
  Instantanea,
  Prestamo,
  Programada,
  TipoTransaccion,
  Uuid,
} from '../hechos';
import { bancoAgricola, condicionesAgricola } from '../prestamos/agricola';
import type { EstadoCuota, PagoPrestamo } from '../prestamos/contrato';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { claveDe, filaDe, indice, paginar, type TransaccionFila } from './actividad';
import { nombres } from './comunes';
import { puntosBasicos } from './reportes/comunes';

/** Lo que no está en los hechos del motor: tablas [H]. */
export interface Auxiliares {
  readonly instituciones?: readonly Institucion[];
  readonly cambios?: readonly CambioPosterior[];
}

export interface FilaDeAmortizacion {
  readonly numero: number;
  readonly fecha: FechaLocal;
  readonly interes: Centavos;
  readonly seguro: Centavos;
  readonly capital: Centavos;
  readonly saldo: Centavos;
  readonly estado: EstadoCuota;
  readonly pagado: Centavos;
}

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);

export const institucionDe = (a: Auxiliares, k: Cuenta): { institucion?: string } => {
  const x = a.instituciones?.find((y) => y.id === k.institucionId);
  return x === undefined ? {} : { institucion: x.nombre };
};

/** DM-8: saldo según el estado − saldo(cuenta, fecha del estado), siempre recalculada. */
export const diferenciaActual = (
  i: Instantanea,
  c: { readonly cuentaId: Uuid; readonly fechaEstado: FechaLocal; readonly saldoEstado: Centavos },
): Centavos => Centavos.restar(c.saldoEstado, saldoAl(i.hechos, c.cuentaId, c.fechaEstado));

/** Las cuotas y abonos registrados del préstamo, con su desglose (Anexo A.1). */
function pagosDe(i: Instantanea, cuentaId: Uuid): PagoPrestamo[] {
  const tx = new Map(i.hechos.transacciones.map((t) => [t.id, t]));
  return i.hechos.efectos.flatMap((e): PagoPrestamo[] => {
    const t = tx.get(e.transaccionId);
    if (e.cuentaId !== cuentaId || (t?.tipo !== 'cuota_prestamo' && t?.tipo !== 'abono_capital'))
      return [];
    return [
      {
        id: t.id,
        tipo: t.tipo === 'cuota_prestamo' ? 'cuota' : 'abono',
        fecha: t.fecha,
        capital: Centavos.negar(e.monto),
        interes: e.interes ?? Centavos.cero,
        seguro: e.seguro ?? Centavos.cero,
        numeroCuota: null,
      },
    ];
  });
}

/** Tabla de amortización con estado y lo pagado, o `null` si el préstamo no tiene modelo (Anexo A). */
export function amortizacionDe(
  i: Instantanea,
  p: Prestamo,
): readonly (FilaDeAmortizacion & { readonly proyectado: Centavos })[] | null {
  const apertura = i.hechos.cuentas.find((k) => k.id === p.cuentaId)?.fechaApertura;
  const condiciones = apertura === undefined ? null : condicionesAgricola(p, apertura);
  if (condiciones === null) return null;
  const pagos = pagosDe(i, p.cuentaId);
  const saldos = new Map(
    bancoAgricola
      .proyectar(condiciones, pagos)
      .flatMap((f) => (f.tipo === 'cuota' ? [[f.numero, f.saldoFinal] as const] : [])),
  );
  return bancoAgricola.comparar(condiciones, pagos, i.hoy).map((q) => ({
    numero: q.numero,
    fecha: q.fecha,
    interes: q.proyectado.interes,
    seguro: q.proyectado.seguro,
    capital: q.proyectado.capital,
    saldo: saldos.get(q.numero) ?? Centavos.cero,
    estado: q.estado,
    pagado: q.pagado.total,
    proyectado: q.proyectado.total,
  }));
}

export interface DetalleCuentaOpciones extends Auxiliares {
  readonly periodoInicio?: FechaLocal;
  readonly tipo?: TipoTransaccion;
  readonly estado?: EstadoBancario;
  readonly cursor?: string;
  readonly limite?: number;
}

type Movimiento = TransaccionFila & {
  readonly efectoEnCuenta: Centavos;
  readonly saldoDespues: Centavos;
};

/**
 * `consultas.detalleCuenta` (6.6). Con `periodoInicio` los movimientos son los de ese período; el saldo
 * corrido (6.0.5) acumula todo el historial de la cuenta. Lanza `RangeError` si la cuenta o el
 * período no existen (la consulta lo traduce a `NO_ENCONTRADO`).
 */
export function detalleCuenta(i: Instantanea, cuentaId: Uuid, o: DetalleCuentaOpciones = {}) {
  const h = i.hechos;
  const k = h.cuentas.find((x) => x.id === cuentaId);
  if (k === undefined) throw new RangeError(`la cuenta ${cuentaId} no existe`);
  const s = i.cuentas.find((x) => x.cuentaId === cuentaId);
  if (s === undefined) throw new RangeError(`la cuenta ${cuentaId} no tiene saldo`);
  const x = indice(i);
  const periodos = i.presupuesto.periodos;
  const inicio = o.periodoInicio ?? i.presupuesto.activo.inicio;
  const pos = periodos.findIndex((p) => p.inicio === inicio);
  const periodo = o.periodoInicio === undefined ? undefined : periodos[pos];
  if (o.periodoInicio !== undefined && periodo === undefined)
    throw new RangeError(`el período ${inicio} no está en el presupuesto`);

  // Saldo corrido: el efecto de la cuenta acumulado en el orden del motor.
  let corrido = Centavos.cero;
  const movimientos: {
    t: (typeof h.transacciones)[number];
    efecto: Centavos;
    despues: Centavos;
  }[] = [];
  const delaCuenta = h.transacciones
    .filter((t) => (x.efectos.get(t.id) ?? []).some((e) => e.cuentaId === cuentaId))
    .sort((a, b) => (claveDe(a) < claveDe(b) ? -1 : 1));
  for (const t of delaCuenta) {
    const efecto = suma(
      (x.efectos.get(t.id) ?? []).filter((e) => e.cuentaId === cuentaId).map((e) => e.monto),
    );
    corrido = Centavos.sumar(corrido, efecto);
    movimientos.push({ t, efecto, despues: corrido });
  }
  const { pagina, siguienteCursor } = paginar(
    movimientos.filter(
      (m) =>
        (periodo === undefined || (periodo.inicio <= m.t.fecha && m.t.fecha <= periodo.fin)) &&
        (o.tipo === undefined || m.t.tipo === o.tipo) &&
        (o.estado === undefined || m.t.estadoBancario === o.estado),
    ),
    o.cursor,
    o.limite,
  );

  const tarjeta = h.tarjetas.find((t) => t.cuentaId === cuentaId);
  const estadoT = i.tarjetas.find((t) => t.tarjetaId === cuentaId);
  const prestamo = h.prestamos.find((p) => p.cuentaId === cuentaId);
  const amortizacion = prestamo === undefined ? null : amortizacionDe(i, prestamo);
  const efectosDe = h.efectos.filter((e) => e.cuentaId === cuentaId);
  const tipoDe = (e: { transaccionId: Uuid }) =>
    h.transacciones.find((t) => t.id === e.transaccionId)?.tipo;
  const montos = (tipo: TipoTransaccion) =>
    suma(efectosDe.filter((e) => tipoDe(e) === tipo).map((e) => e.monto));
  const programadas = h.programadas.filter(
    (p: Programada) => p.cuentaId === cuentaId || p.cuentaDestinoId === cuentaId,
  );
  const bloqueosArchivo = k.archivada
    ? ['cuenta_ya_archivada']
    : [
        ...(s.saldo !== 0 ? ['cuenta_con_saldo'] : []),
        ...(estadoT !== undefined && estadoT.deuda !== 0 ? ['tarjeta_con_deuda'] : []),
        ...(estadoT !== undefined && estadoT.disponibleDePago !== 0
          ? ['reserva_tarjeta_no_cero']
          : []),
      ];
  const bloqueosEliminar = [
    ...(delaCuenta.some((t) => t.tipo !== 'saldo_inicial') ? ['cuenta_con_movimientos'] : []),
    ...(programadas.length > 0 ? ['cuenta_con_programadas'] : []),
  ];

  return {
    cuenta: {
      ...nombres(i).cuenta(cuentaId),
      tipo: k.tipo,
      ...institucionDe(o, k),
      ...(k.ultimos4 === null ? {} : { ultimos4: k.ultimos4 }),
      fechaApertura: k.fechaApertura,
      archivada: k.archivada,
    },
    saldo: s.saldo,
    saldoConfirmado: s.confirmado,
    navegacion: {
      ...(pos > 0 ? { anterior: periodos[pos - 1]?.inicio as FechaLocal } : {}),
      ...(pos >= 0 && pos < periodos.length - 1
        ? { siguiente: periodos[pos + 1]?.inicio as FechaLocal }
        : {}),
    },
    movimientos: pagina.map((m): Movimiento => ({
      ...filaDe(i, m.t),
      efectoEnCuenta: m.efecto,
      saldoDespues: m.despues,
    })),
    ...(siguienteCursor === undefined ? {} : { siguienteCursor }),
    conciliaciones: h.conciliaciones
      .filter((c) => c.cuentaId === cuentaId)
      .sort((a, b) => (a.fechaEstado < b.fechaEstado ? 1 : -1))
      .map((c) => ({
        id: c.id,
        fechaEstado: c.fechaEstado,
        saldoEstado: c.saldoEstado,
        terminadaEn: c.terminadaEn,
        diferenciaAceptada: c.diferenciaAceptada,
        diferenciaActual: diferenciaActual(i, c),
        modo: c.modo,
        transaccionesConciliadas: h.transacciones.filter((t) => t.conciliacionId === c.id).length,
        cambiosPosteriores: (o.cambios ?? [])
          .filter((p) => p.conciliacionId === c.id)
          .map((p) => ({
            registradoEn: p.registradoEn,
            motivos: p.motivos,
            ...(p.transaccionId === null ? {} : { transaccionId: p.transaccionId }),
            foto: {
              fecha: p.fecha,
              montoEfecto: p.montoEfecto,
              ...(p.comercio === null ? {} : { comercio: p.comercio }),
            },
          })),
      })),
    programadas: programadas.map((p) => ({
      programada: { id: p.id, nombre: p.comercio },
      rol: p.cuentaId === cuentaId ? ('origen' as const) : ('destino' as const),
      activa: p.activa,
    })),
    ...(tarjeta === undefined || estadoT === undefined
      ? {}
      : {
          tarjeta: {
            deuda: estadoT.deuda,
            saldoAFavor: Centavos.max(Centavos.cero, s.saldo),
            reservado: estadoT.reservado,
            faltaReservar: estadoT.sinRespaldo,
            reservaExcedente: estadoT.reservaExcedente,
            limite: tarjeta.limiteCredito,
            usoLimite:
              tarjeta.limiteCredito > 0 ? puntosBasicos(estadoT.deuda, tarjeta.limiteCredito) : 0,
            cicloFacturacion: cicloDeFacturacion(tarjeta.diaCorte, i.hoy),
            desgloseAlPagar: (({
              deudaAnterior,
              cargosDelCiclo,
              yaPagado,
              paraNoGenerarIntereses,
            }) => ({
              deudaAnterior,
              cargosDelCiclo,
              yaPagado,
              paraNoGenerarIntereses,
            }))(desgloseAlPagar(h, tarjeta, i.hoy)),
          },
        }),
    ...(prestamo === undefined
      ? {}
      : {
          prestamo: {
            condiciones: {
              contraparte: prestamo.contraparte,
              montoOriginal: prestamo.montoOriginal,
              tasaNominalAnualMillonesimas: prestamo.tasaNominalAnualMillonesimas,
              tipoTasa: prestamo.tipoTasa,
              seguroPrimerMes: prestamo.seguroPrimerMes,
              comision: prestamo.comision,
              frecuencia: prestamo.frecuencia,
              frecuenciaDias: prestamo.frecuenciaDias,
              cuotaPactada: prestamo.cuotaPactada,
              plazoCuotas: prestamo.plazoCuotas,
              modeloCalculo: prestamo.modeloCalculo,
              cuotasPagadasAlCrear: prestamo.cuotasPagadasAlCrear,
            },
            capitalPendiente: s.saldo,
            amortizacion:
              amortizacion?.map((q) => ({
                numero: q.numero,
                fecha: q.fecha,
                interes: q.interes,
                seguro: q.seguro,
                capital: q.capital,
                saldo: q.saldo,
                estado: q.estado,
                pagado: q.pagado,
              })) ?? null,
            comparacion:
              amortizacion === null
                ? null
                : {
                    proyectadoHastaHoy: suma(
                      amortizacion.filter((q) => q.fecha <= i.hoy).map((q) => q.proyectado),
                    ),
                    pagadoHastaHoy: suma(
                      amortizacion.filter((q) => q.fecha <= i.hoy).map((q) => q.pagado),
                    ),
                  },
            costoFinanciero: {
              interes: suma(efectosDe.map((e) => e.interes ?? Centavos.cero)),
              seguro: suma(efectosDe.map((e) => e.seguro ?? Centavos.cero)),
            },
          },
        }),
    ...(k.tipo !== 'inversion'
      ? {}
      : {
          inversion: {
            valor: s.saldo,
            aportes: montos('aporte_inversion'),
            retiros: Centavos.negar(montos('retiro_inversion')),
            ajustes: montos('ajuste_inversion'),
          },
        }),
    acciones: {
      puedeArchivar: bloqueosArchivo.length === 0,
      bloqueosArchivo,
      puedeEliminar: bloqueosEliminar.length === 0,
      bloqueosEliminar,
    },
  };
}
