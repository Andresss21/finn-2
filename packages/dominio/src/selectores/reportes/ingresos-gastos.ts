// Reporte `ingresos_gastos` (04 §6.9.2): ingresos frente a gastos; otras entradas y restituciones
// van aparte (H13, D1): una restitución nunca es ingreso.
import type { Instantanea } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import { type FiltroDeReporte, medidor, periodosDeVentana } from './comunes';

export interface PuntoDeIngresosGastos {
  readonly periodo: FechaLocal;
  readonly ingresos: Centavos;
  readonly gastos: Centavos;
  /** Ingresos − Gastos. */
  readonly diferencia: Centavos;
  readonly otrasEntradas: Centavos;
  readonly restituciones: Centavos;
}

export function ingresosGastos(
  i: Instantanea,
  filtro: FiltroDeReporte = {},
): PuntoDeIngresosGastos[] {
  const m = medidor(i, filtro.cuentaIds);
  return periodosDeVentana(i, filtro.ventana).map((p) => {
    const ingresos = m.porClase('ingreso', p);
    const gastos = m.gastos(p);
    return {
      periodo: p.inicio,
      ingresos,
      gastos,
      diferencia: Centavos.restar(ingresos, gastos),
      otrasEntradas: m.porClase('otras_entradas', p),
      restituciones: m.porClase('restitucion', p),
    };
  });
}
