// Tarjetas en el tiempo (06 §3.5.10, FD-16 [R1], CF-04): por tarjeta y ciclo de facturación ya
// vencido, la deuda del estado, lo pagado o acreditado a tiempo y el arrastre. Todo sale de
// `desgloseAlPagar` (01 §4.14) con f = fecha de pago; el reporte no define otra cuenta. El
// hallazgo va como datos, sin texto (04 §7.10).
import { desgloseAlPagar } from '../../calculo/patrimonio';
import { saldoAl } from '../../calculo/saldos';
import type { Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { nombres, type PeriodoDto, periodoDto, type Ref } from '../comunes';
import { conjuntoDeCuentas, type FiltroDeReporte, periodosDeVentana } from './comunes';

export type ParametrosTarjetas = FiltroDeReporte;

export interface CicloDeTarjeta {
  /** c₀: el corte del estado. */
  readonly corte: FechaLocal;
  readonly fechaPago: FechaLocal;
  /** máx(0, −saldo(t, c₀)). */
  readonly deudaEstado: Centavos;
  /** "Pagado o acreditado a tiempo": Σ efectos positivos en t con fecha en (c₀, fecha de pago]. */
  readonly pagadoATiempo: Centavos;
  /** máx(0, deuda del estado − pagado a tiempo). */
  readonly arrastre: Centavos;
}

export interface PeriodoDeTarjeta {
  readonly periodo: FechaLocal;
  /** Σ efectos negativos en t con fecha en el período, como monto ≥ 0. */
  readonly cargos: Centavos;
  /** Σ efectos positivos en t con fecha en el período. */
  readonly pagos: Centavos;
  /** deuda(t) al fin del período (o a hoy, si el período no terminó). */
  readonly deudaAlFin: Centavos;
}

export type AccionDeTarjeta =
  /** OP-14 sobre pago(t) en A: `montoNuevo` = Asig + S(t). */
  | { readonly tipo: 'reservar'; readonly categoriaId: Uuid; readonly montoNuevo: Centavos }
  | { readonly tipo: 'pagar'; readonly tarjetaId: Uuid };

export interface HallazgoDeTarjeta {
  readonly tipo: 'tarjeta';
  readonly clave: string;
  /** El arrastre del último ciclo evaluado. */
  readonly impacto: Centavos;
  readonly estado: 'advertencia' | 'deuda-sin-respaldo';
  readonly tarjeta: Ref;
  readonly arrastre: Centavos;
  readonly corte: FechaLocal;
  /** S(t) de hoy; la acción es "Reservar {S}" si es > 0. */
  readonly sinRespaldo: Centavos;
  readonly accion: AccionDeTarjeta;
}

export interface TarjetaEnElTiempo {
  readonly tarjeta: Ref;
  readonly ciclos: readonly CicloDeTarjeta[];
  readonly periodos: readonly PeriodoDeTarjeta[];
  /** Hay ciclos evaluados y todos tienen arrastre 0. */
  readonly pagaElTotal: boolean;
}

export interface TarjetasSel {
  readonly periodos: readonly PeriodoDto[];
  readonly tarjetas: readonly TarjetaEnElTiempo[];
  /** Por arrastre descendente; después por clave. */
  readonly hallazgos: readonly HallazgoDeTarjeta[];
}

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
const menor = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Las fechas de pago (día de pago recortado al fin de mes) que caen en [desde, hasta]. */
function fechasDePago(diaPago: number, desde: FechaLocal, hasta: FechaLocal): FechaLocal[] {
  const salida: FechaLocal[] = [];
  for (let m = FechaLocal.inicioDeMes(desde, 1); m <= hasta; m = FechaLocal.sumarMeses(m, 1)) {
    const fp = FechaLocal.inicioDeMes(m, diaPago);
    if (fp >= desde && fp <= hasta) salida.push(fp);
  }
  return salida;
}

/** El reporte `tarjetas`: ventana `ultimos_6` por defecto (06 §3.5.1). */
export function tarjetas(i: Instantanea, parametros: ParametrosTarjetas = {}): TarjetasSel {
  const h = i.hechos;
  const nom = nombres(i);
  const k = conjuntoDeCuentas(parametros.cuentaIds);
  const periodos = periodosDeVentana(i, parametros.ventana ?? 'ultimos_6');
  const primero = periodos[0];
  const ultimo = periodos[periodos.length - 1];
  const fechas = new Map(h.transacciones.map((t) => [t.id, t.fecha]));
  const cuentas = new Map(h.cuentas.map((x) => [x.id, x]));
  const activo = i.presupuesto.activo;

  const filas: TarjetaEnElTiempo[] = [];
  const hallazgos: HallazgoDeTarjeta[] = [];
  const delTiempo = h.tarjetas
    .filter((t) => k === undefined || k.has(t.cuentaId))
    .sort((a, b) => menor(a.cuentaId, b.cuentaId));
  for (const t of delTiempo) {
    const cuenta = cuentas.get(t.cuentaId);
    if (cuenta === undefined || primero === undefined || ultimo === undefined) continue;
    const vistos = new Set<FechaLocal>();
    const ciclos: CicloDeTarjeta[] = [];
    for (const fp of fechasDePago(t.diaPago, primero.inicio, ultimo.fin)) {
      if (fp >= i.hoy) continue;
      const d = desgloseAlPagar(h, t, fp);
      // Un ciclo anterior a la apertura de la cuenta no tiene deuda que evaluar.
      if (vistos.has(d.corte) || d.corte < cuenta.fechaApertura) continue;
      vistos.add(d.corte);
      ciclos.push({
        corte: d.corte,
        fechaPago: fp,
        deudaEstado: d.deudaAnterior,
        pagadoATiempo: d.yaPagado,
        arrastre: d.paraNoGenerarIntereses,
      });
    }
    const efectos = h.efectos.filter((e) => e.cuentaId === t.cuentaId);
    const porPeriodo = periodos.map((p): PeriodoDeTarjeta => {
      const enP = efectos.filter((e) => {
        const f = fechas.get(e.transaccionId);
        return f !== undefined && p.inicio <= f && f <= p.fin;
      });
      const hasta = p.fin < i.hoy ? p.fin : i.hoy;
      return {
        periodo: p.inicio,
        cargos: Centavos.negar(suma(enP.filter((e) => e.monto < 0).map((e) => e.monto))),
        pagos: suma(enP.filter((e) => e.monto > 0).map((e) => e.monto)),
        deudaAlFin: Centavos.max(Centavos.cero, Centavos.negar(saldoAl(h, t.cuentaId, hasta))),
      };
    });
    if (cuenta.archivada && ciclos.length === 0 && porPeriodo.every((x) => x.cargos === 0))
      continue;
    filas.push({
      tarjeta: nom.cuenta(t.cuentaId),
      ciclos,
      periodos: porPeriodo,
      pagaElTotal: ciclos.length > 0 && ciclos.every((x) => x.arrastre === 0),
    });

    const ultimoCiclo = ciclos[ciclos.length - 1];
    if (ultimoCiclo === undefined || ultimoCiclo.arrastre <= 0) continue;
    const sinRespaldo =
      i.tarjetas.find((x) => x.tarjetaId === t.cuentaId)?.sinRespaldo ?? Centavos.cero;
    const pago = i.presupuesto.celdas.find(
      (x) => x.clase === 'pago' && x.tarjetaId === t.cuentaId && x.periodo.inicio === activo.inicio,
    );
    hallazgos.push({
      tipo: 'tarjeta',
      clave: `tarjeta:${t.cuentaId}`,
      impacto: ultimoCiclo.arrastre,
      estado: sinRespaldo > 0 ? 'deuda-sin-respaldo' : 'advertencia',
      tarjeta: nom.cuenta(t.cuentaId),
      arrastre: ultimoCiclo.arrastre,
      corte: ultimoCiclo.corte,
      sinRespaldo,
      accion:
        sinRespaldo > 0 && pago !== undefined
          ? {
              tipo: 'reservar',
              categoriaId: pago.categoriaId,
              montoNuevo: Centavos.sumar(pago.asignado, sinRespaldo),
            }
          : { tipo: 'pagar', tarjetaId: t.cuentaId },
    });
  }

  hallazgos.sort((x, y) => y.impacto - x.impacto || menor(x.clave, y.clave));
  return { periodos: periodos.map((p) => periodoDto(i, p)), tarjetas: filas, hallazgos };
}
