// Reporte `tendencia` (04 §6.9.2): por período de W, ingresos, gastos, otras entradas y gastos por grupo.
import type { Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import { type FiltroDeReporte, medidor, periodosDeVentana, suma } from './comunes';

export interface PuntoDeTendencia {
  readonly periodo: FechaLocal;
  readonly ingresos: Centavos;
  readonly gastos: Centavos;
  readonly otrasEntradas: Centavos;
  /** Solo los grupos con gasto distinto de cero, en el orden del grupo. */
  readonly gastosPorGrupo: readonly { readonly grupo: Uuid; readonly monto: Centavos }[];
}

export function tendencia(i: Instantanea, filtro: FiltroDeReporte = {}): PuntoDeTendencia[] {
  const m = medidor(i, filtro.cuentaIds);
  const grupos = [...i.hechos.grupos].sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1));
  return periodosDeVentana(i, filtro.ventana).map((p) => ({
    periodo: p.inicio,
    ingresos: m.porClase('ingreso', p),
    gastos: m.gastos(p),
    otrasEntradas: m.porClase('otras_entradas', p),
    gastosPorGrupo: grupos
      .map((g) => ({
        grupo: g.id,
        monto: suma(m.normales.filter((c) => c.grupoId === g.id).map((c) => m.gastado(c.id, p))),
      }))
      .filter((x) => x.monto !== Centavos.cero),
  }));
}
