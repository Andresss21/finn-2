// Reporte `cumplimiento` (04 §6.9.2): por categoría normal y período de W, lo asignado frente a lo
// gastado. Solo van las categorías que existían en el período (`existiaEn`, CF-17): una archivada sin
// actividad ni asignación no aparece.
import { asignado } from '../../calculo/d2';
import type { Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import { type FiltroDeReporte, medidor, periodosDeVentana, puntosBasicos } from './comunes';
import { existiaEn } from './existia-en';

export interface FilaDeCumplimiento {
  readonly categoria: Uuid;
  readonly periodo: FechaLocal;
  readonly asignado: Centavos;
  readonly gastado: Centavos;
  /** Asig − Gastado. */
  readonly diferencia: Centavos;
  /** Gastado / Asig en puntos básicos; `null` si Asig ≤ 0. */
  readonly porcentaje: number | null;
}

export function cumplimiento(i: Instantanea, filtro: FiltroDeReporte = {}): FilaDeCumplimiento[] {
  const m = medidor(i, filtro.cuentaIds);
  return periodosDeVentana(i, filtro.ventana).flatMap((p) =>
    m.normales
      .filter((c) => existiaEn(i, c.id, p))
      .map((c) => {
        const asig = asignado(i.hechos.asignaciones, c.id, p);
        const gast = m.gastado(c.id, p);
        return {
          categoria: c.id,
          periodo: p.inicio,
          asignado: asig,
          gastado: gast,
          diferencia: Centavos.restar(asig, gast),
          porcentaje: asig > 0 ? puntosBasicos(gast, asig) : null,
        };
      }),
  );
}
