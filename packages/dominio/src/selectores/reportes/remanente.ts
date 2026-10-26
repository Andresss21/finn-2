// Reporte `remanente` (04 §6.9.2 y §6.9.5, R3): "Lo que te quedó del período". Ingresos − Gastos por
// período y su acumulado en W; las otras entradas no cuentan (H13). No es un flujo de caja.
import type { Instantanea } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import { type FiltroDeReporte, medidor, periodosDeVentana } from './comunes';

export interface PuntoDeRemanente {
  readonly periodo: FechaLocal;
  readonly neto: Centavos;
  readonly acumulado: Centavos;
}

export function remanente(i: Instantanea, filtro: FiltroDeReporte = {}): PuntoDeRemanente[] {
  const m = medidor(i, filtro.cuentaIds);
  let acumulado = Centavos.cero;
  return periodosDeVentana(i, filtro.ventana).map((p) => {
    const neto = Centavos.restar(m.porClase('ingreso', p), m.gastos(p));
    acumulado = Centavos.sumar(acumulado, neto);
    return { periodo: p.inicio, neto, acumulado };
  });
}
