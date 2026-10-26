// Reporte `patrimonio` (04 §6.9.2): la posición neta de hoy (01 §4.14) y la serie que evalúa §4.14 al
// fin de cada período de W con los saldos, por cobrar y valores a esa fecha. Con filtro K solo
// cuentan las cuentas de K y los por cobrar cuya compra salió de una de ellas.
import type { PatrimonioNeto } from '../../calculo/patrimonio';
import { patrimonioNeto } from '../../calculo/patrimonio';
import { porCobrar } from '../../calculo/por-cobrar';
import type { Instantanea } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import { conjuntoDeCuentas, type FiltroDeReporte, periodosDeVentana } from './comunes';

export interface PuntoDePatrimonio {
  readonly periodo: FechaLocal;
  /** Efectivo, saldos a favor, inversiones y por cobrar. */
  readonly activos: Centavos;
  /** Deudas de tarjeta y capital pendiente de préstamos. */
  readonly deudas: Centavos;
  readonly neto: Centavos;
}

export interface ReporteDePatrimonio {
  readonly hoy: PatrimonioNeto;
  readonly serie: readonly PuntoDePatrimonio[];
}

/** §4.14 con los hechos hasta `hasta` (todos si no se da) y las cuentas de K. */
function alFin(
  i: Instantanea,
  hasta: FechaLocal | undefined,
  cuentaIds?: Parameters<typeof conjuntoDeCuentas>[0],
) {
  const k = conjuntoDeCuentas(cuentaIds);
  const h = i.hechos;
  const transacciones = h.transacciones.filter((t) => hasta === undefined || t.fecha <= hasta);
  const ids = new Set(transacciones.map((t) => t.id));
  const hechos = {
    ...h,
    transacciones,
    efectos: h.efectos.filter((e) => ids.has(e.transaccionId)),
    lineas: h.lineas.filter((l) => ids.has(l.transaccionId)),
    condonaciones: h.condonaciones.filter((x) => hasta === undefined || x.fecha <= hasta),
  };
  const cobros = porCobrar(hechos, hasta).filter((x) => k === undefined || k.has(x.medio.cuentaId));
  const cuentas = hechos.cuentas.filter((x) => k === undefined || k.has(x.id));
  return patrimonioNeto({ ...hechos, cuentas }, cobros);
}

export function patrimonio(i: Instantanea, filtro: FiltroDeReporte = {}): ReporteDePatrimonio {
  return {
    hoy:
      conjuntoDeCuentas(filtro.cuentaIds) === undefined
        ? i.patrimonio
        : alFin(i, undefined, filtro.cuentaIds),
    serie: periodosDeVentana(i, filtro.ventana).map((p) => {
      const x = alFin(i, p.fin, filtro.cuentaIds);
      return {
        periodo: p.inicio,
        activos: [x.efectivo, x.saldosAFavor, x.inversiones, x.porCobrar].reduce(Centavos.sumar),
        deudas: Centavos.sumar(x.deudasDeTarjeta, x.prestamos),
        neto: x.total,
      };
    }),
  };
}
