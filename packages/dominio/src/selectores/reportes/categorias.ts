// Reporte `categorias` (04 §6.9.2): en qué se va el dinero. Gastado acumulado en W por categoría
// normal con actividad (archivadas incluidas, R4). La dona usa las de gastado > 0; las de gastado ≤ 0
// (devolución neta) van aparte. `porcentaje` en puntos básicos sobre Σ de los positivos y suma
// exactamente 10.000: el ajuste de redondeo va de a 1 punto a las categorías de mayor gasto.
import type { Instantanea, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { type FiltroDeReporte, medidor, periodosDeVentana, puntosBasicos, suma } from './comunes';

export interface FilaDeCategoria {
  readonly categoria: Uuid;
  readonly grupo: Uuid;
  readonly gastado: Centavos;
  readonly porcentaje: number;
}

export interface ReporteDeCategorias {
  readonly categorias: readonly FilaDeCategoria[];
  readonly conDevolucionNeta: readonly { readonly categoria: Uuid; readonly gastado: Centavos }[];
}

export function categorias(
  i: Instantanea,
  filtro: FiltroDeReporte & { readonly grupoId?: Uuid } = {},
): ReporteDeCategorias {
  const m = medidor(i, filtro.cuentaIds);
  const ventana = periodosDeVentana(i, filtro.ventana);
  const filas = m.normales
    .filter((c) => filtro.grupoId === undefined || c.grupoId === filtro.grupoId)
    .filter((c) => ventana.some((p) => m.hayActividad(c.id, p)))
    .map((c) => ({
      categoria: c.id,
      grupo: c.grupoId,
      gastado: suma(ventana.map((p) => m.gastado(c.id, p))),
    }));
  type Fila = (typeof filas)[number];
  const porId = (a: Fila, b: Fila) => (a.categoria < b.categoria ? -1 : 1);
  const positivas = filas
    .filter((x) => x.gastado > 0)
    .sort((a, b) => b.gastado - a.gastado || porId(a, b));
  const total = suma(positivas.map((x) => x.gastado));
  const puntos = positivas.map((x) => puntosBasicos(x.gastado, total));
  // Error de redondeo de cada porcentaje, ×total: puntos·total − gastado·10.000 (sin dividir).
  const error = (k: number) => (puntos[k] ?? 0) * total - (positivas[k]?.gastado ?? 0) * 10_000;
  const resto = positivas.length === 0 ? 0 : 10_000 - puntos.reduce((a, b) => a + b, 0);
  // Sobran puntos: van a los más redondeados hacia abajo; faltan: se quitan a los más redondeados hacia arriba.
  const turnos = positivas
    .map((_, k) => k)
    .sort((a, b) => (error(a) - error(b)) * Math.sign(resto) || a - b);
  for (let r = 0; r < Math.abs(resto); r++) {
    const k = turnos[r % turnos.length] ?? 0;
    puntos[k] = (puntos[k] ?? 0) + Math.sign(resto);
  }
  return {
    categorias: positivas.map((x, k) => ({ ...x, porcentaje: puntos[k] ?? 0 })),
    conDevolucionNeta: filas
      .filter((x) => x.gastado <= 0)
      .sort((a, b) => a.gastado - b.gastado || porId(a, b))
      .map((x) => ({ categoria: x.categoria, gastado: x.gastado })),
  };
}
