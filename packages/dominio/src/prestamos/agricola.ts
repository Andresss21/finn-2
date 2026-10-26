// Modelo "Banco Agrícola" (01 Anexo A.2). Los puntos marcados "validar" en A.2 quedan como están:
// PRU-MAN-CTA-001 los contrasta con un estado de cuenta real (07 §22.1). Interés y seguro usan la
// proporción mitad hacia arriba de `Centavos` (01 §0.4, ADR-15 [CH-17]).
import type { Prestamo, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import type {
  AbonoProyectado,
  ComparacionCuota,
  CondicionesModelo,
  CuotaProyectada,
  DesgloseConTotal,
  DesgloseCuota,
  Emparejamiento,
  EstadoCuota,
  FilaProyeccion,
  ModeloCalculo,
  PagoPrestamo,
} from './contrato';

/** Base del interés: 365 días por la tasa en millonésimas (regla 2, 03 DB-13). */
const DEN_INTERES = 365_000_000;
/** Ventana del emparejamiento por fecha, en días (regla 7). */
const VENTANA_DIAS = 10;

/** Condiciones del modelo de un préstamo (2.2.5): solo Banco Agrícola, mensual y con tasa. */
export function condicionesAgricola(p: Prestamo, apertura: FechaLocal): CondicionesModelo | null {
  if (p.modeloCalculo !== 'banco_agricola' || p.frecuencia !== 'mensual') return null;
  if (p.tasaNominalAnualMillonesimas === null) return null;
  return {
    montoOriginal: p.montoOriginal,
    fechaApertura: apertura,
    tasaNominalAnualMillonesimas: p.tasaNominalAnualMillonesimas,
    seguroPrimerMes: p.seguroPrimerMes ?? Centavos.cero,
    cuotaPactada: p.cuotaPactada,
    plazoCuotas: p.plazoCuotas,
  };
}

/** F_k = F₀ + k meses, recortado al último día del mes (regla 1). */
const fechaCuota = (c: CondicionesModelo, k: number): FechaLocal =>
  FechaLocal.sumarMeses(c.fechaApertura, k);

/** Reglas 2 a 4 para la cuota k con saldo inicial B. */
function desglose(
  c: CondicionesModelo,
  k: number,
  saldo: Centavos,
): DesgloseCuota & { dias: number } {
  const dias = FechaLocal.diasEntre(fechaCuota(c, k - 1), fechaCuota(c, k));
  const interes = Centavos.proporcionMitadArriba(
    saldo,
    c.tasaNominalAnualMillonesimas * dias,
    DEN_INTERES,
  );
  const seguro = Centavos.proporcionMitadArriba(saldo, c.seguroPrimerMes, c.montoOriginal);
  const resto = Centavos.restar(Centavos.restar(c.cuotaPactada, interes), seguro);
  return { dias, interes, seguro, capital: Centavos.min(resto, saldo) };
}

/** Orden determinista de los pagos reales: (fecha, id), sin depender del orden de llegada. */
const ordenar = (pagos: readonly PagoPrestamo[]): PagoPrestamo[] =>
  [...pagos].sort((a, b) => FechaLocal.comparar(a.fecha, b.fecha) || (a.id < b.id ? -1 : 1));

/**
 * Reglas 1 a 5. Un abono reduce B desde la primera cuota con fecha posterior a la suya; Q se
 * mantiene y el plazo se acorta. La proyección termina con B = 0 o en la cuota n.
 */
function proyectar(c: CondicionesModelo, pagos: readonly PagoPrestamo[]): FilaProyeccion[] {
  const abonos = ordenar(pagos.filter((p) => p.tipo === 'abono'));
  const filas: FilaProyeccion[] = [];
  let saldo = c.montoOriginal;
  let a = 0;
  for (let k = 1; k <= c.plazoCuotas && saldo > 0; k++) {
    const fecha = fechaCuota(c, k);
    for (
      let ab = abonos[a];
      ab !== undefined && FechaLocal.comparar(ab.fecha, fecha) < 0;
      ab = abonos[++a]
    ) {
      const capital = Centavos.min(ab.capital, saldo);
      const fila: AbonoProyectado = {
        tipo: 'abono',
        pagoId: ab.id,
        fecha: ab.fecha,
        saldoInicial: saldo,
        capital,
        saldoFinal: Centavos.restar(saldo, capital),
      };
      filas.push(fila);
      saldo = fila.saldoFinal;
    }
    if (saldo <= 0) break;
    const { dias, interes, seguro, capital } = desglose(c, k, saldo);
    const saldoFinal = Centavos.restar(saldo, capital);
    filas.push({
      tipo: 'cuota',
      numero: k,
      fecha,
      dias,
      saldoInicial: saldo,
      interes,
      seguro,
      capital,
      saldoFinal,
    });
    saldo = saldoFinal;
  }
  return filas;
}

const totalDe = (d: DesgloseCuota): Centavos =>
  Centavos.sumar(Centavos.sumar(d.interes, d.seguro), d.capital);

/**
 * Regla 6: pagada cuando lo emparejado es ≥ 0.99 × Q, en enteros (100·pagado ≥ 99·Q). La última
 * cuota, menor que Q (regla 4), se mide contra su propio monto.
 */
const pagada = (c: CondicionesModelo, cuota: CuotaProyectada, pagado: Centavos): boolean =>
  100 * pagado >= 99 * Centavos.min(c.cuotaPactada, totalDe(cuota));

interface Asignacion {
  readonly emparejamientos: Emparejamiento[];
  readonly porCuota: Map<number, PagoPrestamo[]>;
}

/**
 * Regla 7, sobre las cuotas en orden (fecha, id): por número de cuota si se indicó; si no, con la
 * cuota no pagada a ±10 días o menos de su fecha, la más cercana (a igual distancia, la primera).
 */
function asignar(
  cuotas: readonly CuotaProyectada[],
  c: CondicionesModelo,
  pagos: readonly PagoPrestamo[],
): Asignacion {
  const porCuota = new Map<number, PagoPrestamo[]>();
  const pagadoDe = (k: number): Centavos =>
    (porCuota.get(k) ?? []).reduce((s, p) => Centavos.sumar(s, totalDe(p)), Centavos.cero);
  const emparejamientos: Emparejamiento[] = [];
  for (const p of ordenar(pagos.filter((x) => x.tipo === 'cuota'))) {
    let elegida: CuotaProyectada | undefined;
    if (p.numeroCuota !== null) elegida = cuotas.find((q) => q.numero === p.numeroCuota);
    else {
      let mejor = VENTANA_DIAS + 1;
      for (const q of cuotas) {
        const distancia = Math.abs(FechaLocal.diasEntre(q.fecha, p.fecha));
        if (distancia < mejor && !pagada(c, q, pagadoDe(q.numero)))
          [elegida, mejor] = [q, distancia];
      }
    }
    if (elegida !== undefined)
      porCuota.set(elegida.numero, [...(porCuota.get(elegida.numero) ?? []), p]);
    emparejamientos.push({ pagoId: p.id, numero: elegida?.numero ?? null });
  }
  return { emparejamientos, porCuota };
}

const soloCuotas = (filas: readonly FilaProyeccion[]): CuotaProyectada[] =>
  filas.filter((f): f is CuotaProyectada => f.tipo === 'cuota');

function sumarDesgloses(pagos: readonly PagoPrestamo[]): DesgloseConTotal {
  const suma = (campo: keyof DesgloseCuota): Centavos =>
    pagos.reduce((s, p) => Centavos.sumar(s, p[campo]), Centavos.cero);
  const d = { interes: suma('interes'), seguro: suma('seguro'), capital: suma('capital') };
  return { ...d, total: totalDe(d) };
}

function estado(
  c: CondicionesModelo,
  q: CuotaProyectada,
  pagado: Centavos,
  hoy: FechaLocal,
): EstadoCuota {
  if (pagada(c, q, pagado)) return 'pagada';
  if (FechaLocal.comparar(q.fecha, hoy) < 0) return 'atrasada';
  return pagado > 0 ? 'parcial' : 'pendiente';
}

export const bancoAgricola: ModeloCalculo = {
  proyectar,
  /** Regla 8: con B = capital pendiente registrado y las fechas programadas F_{k−1} y F_k. */
  desglosePropuesto: (c, numero, capitalPendiente) => {
    const { interes, seguro, capital } = desglose(c, numero, capitalPendiente);
    return { interes, seguro, capital };
  },
  emparejar: (c, pagos) => asignar(soloCuotas(proyectar(c, pagos)), c, pagos).emparejamientos,
  comparar: (c, pagos, hoy) => {
    const cuotas = soloCuotas(proyectar(c, pagos));
    const { porCuota } = asignar(cuotas, c, pagos);
    return cuotas.map((q): ComparacionCuota => {
      const suyos = porCuota.get(q.numero) ?? [];
      const pagado = sumarDesgloses(suyos);
      return {
        numero: q.numero,
        fecha: q.fecha,
        estado: estado(c, q, pagado.total, hoy),
        pagos: suyos.map((p): Uuid => p.id),
        proyectado: { interes: q.interes, seguro: q.seguro, capital: q.capital, total: totalDe(q) },
        pagado,
      };
    });
  },
};
