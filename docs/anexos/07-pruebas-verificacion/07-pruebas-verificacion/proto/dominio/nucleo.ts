// Prototipo del núcleo del motor (V7-03): subconjunto de 01 §4 — períodos del ciclo 21 (§4.2), saldos (§4.3),
// actividad y reparto D2 sin devoluciones de tarjeta (§4.4, §4.5), Disponible/arrastre/cierre (§4.6), sobregiros (§4.7),
// S y RE (§4.8) y LPA (§4.9). Montos en centavos enteros; fechas como 'AAAA-MM-DD'; sin Date.
// MUTANTE (solo pruebas de control negativo): 'arrastre' | 'traslado' | 'orden' | 'cierre'.
export type F = string;
export interface Gasto { id: string; cuenta: string; fecha: F; clave: number; lineas: [string, number][] }
export interface Hechos {
  hoy: F; efectivo: Record<string, number>; tarjetas: Record<string, number>; categorias: string[];
  ingresos: [string, F, number][]; gastos: Gasto[]; pagos: [string, string, F, number][];
  asig: [string, F, number][]; devoluciones: [string, F, string, number][];
}
const MUT = process.env.FINN_MUTANTE ?? '';
const DIA = 21;
const partes = (f: F) => f.split('-').map(Number) as [number, number, number];
const fmt = (a: number, m: number, d: number) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
export const inicio = (f: F): F => { const [a, m, d] = partes(f); if (d >= DIA) return fmt(a, m, DIA); return m > 1 ? fmt(a, m - 1, DIA) : fmt(a - 1, 12, DIA); };
export const siguiente = (p: F): F => { const [a, m] = partes(p); return m < 12 ? fmt(a, m + 1, DIA) : fmt(a + 1, 1, DIA); };
const diaAnterior = (p: F): F => { const [a, m] = partes(p); return fmt(a, m, DIA - 1); }; // DIA ≤ 28: el día anterior siempre existe
export const fin = (p: F): F => diaAnterior(siguiente(p));
export const pago = (t: string) => `Pago ${t}`;
export interface Celda { asig: number; arr: number; disp: number; sobt: number; sobd: number; e: number }
export interface Instantanea { A: F; lpa: number; efectivo: number; disp: Record<string, number>; fut: number; sobta: number;
  deuda: Record<string, number>; S: Record<string, number>; RE: Record<string, number>; celdas: Map<string, Celda>; periodos: F[] }

export function calcular(h: Hechos): Instantanea {
  const A = inicio(h.hoy);
  const asig = new Map<string, number>(); for (const [c, p, m] of h.asig) asig.set(c + '|' + p, (asig.get(c + '|' + p) ?? 0) + m);
  const fechas = [...h.ingresos.map(x => x[1]), ...h.gastos.map(g => g.fecha), ...h.pagos.map(x => x[2]), ...h.asig.map(x => x[1]), ...h.devoluciones.map(x => x[1]), h.hoy];
  let p = inicio(fechas.reduce((a, b) => (a < b ? a : b)));
  const ultimo = [A, ...h.asig.map(x => x[1])].reduce((a, b) => (a > b ? a : b));
  const periodos: F[] = []; while (p <= ultimo) { periodos.push(p); p = siguiente(p); }
  const tarjetas = Object.keys(h.tarjetas);
  const arr = new Map<string, number>(); const celdas = new Map<string, Celda>();
  for (const p of periodos) {
    const tr = new Map<string, number>(tarjetas.map(t => [t, 0]));
    for (const c of h.categorias) {
      const cons: [F, number, string, number, number, string][] = [];
      for (const g of h.gastos) { if (inicio(g.fecha) !== p) continue; g.lineas.forEach(([cc, m], o) => { if (cc === c) cons.push([g.fecha, g.clave, g.id, o, m, g.cuenta]); }); }
      if (MUT !== 'orden') cons.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] - y[1] || (x[2] < y[2] ? -1 : x[2] > y[2] ? 1 : x[3] - y[3])));
      const ent = h.devoluciones.filter(d => d[2] === c && inicio(d[1]) === p).reduce((s, d) => s + d[3], 0);
      const a = asig.get(c + '|' + p) ?? 0, ar = arr.get(c) ?? 0;
      const Fo = ar + a + ent; let rest = Fo, sobt = 0, gastado = 0;
      for (const [, , , , m, cu] of cons) {
        const cub = Math.max(0, Math.min(m, rest)); rest -= cub; gastado += m;
        if (cu in h.tarjetas) { tr.set(cu, tr.get(cu)! + (MUT === 'traslado' ? m : cub)); sobt += m - cub; }
      }
      const disp = Fo - gastado;
      celdas.set(c + '|' + p, { asig: a, arr: ar, disp, sobt, sobd: Math.max(0, -disp) - sobt, e: 0 });
      arr.set(c, MUT === 'arrastre' ? disp : Math.max(0, disp));
    }
    for (const t of tarjetas) {
      const c = pago(t);
      const pag = h.pagos.filter(x => x[1] === t && inicio(x[2]) === p).reduce((s, x) => s + x[3], 0);
      const a = asig.get(c + '|' + p) ?? 0, ar = arr.get(c) ?? 0;
      const disp = ar + a + tr.get(t)! - pag;
      celdas.set(c + '|' + p, { asig: a, arr: ar, disp, sobt: 0, sobd: 0, e: Math.max(0, -disp) });
      arr.set(c, Math.max(0, disp));
    }
  }
  const pcs = tarjetas.map(pago), todas = [...h.categorias, ...pcs];
  const entradas = Object.values(h.efectivo).reduce((s, x) => s + x, 0) + h.ingresos.reduce((s, x) => s + x[2], 0);
  const sumAsig = h.asig.reduce((s, x) => s + x[2], 0);
  let reducciones = 0;
  for (const p of periodos) if (fin(p) < h.hoy || (MUT === 'cierre' && p === A))
    for (const c of todas) { const k = celdas.get(c + '|' + p)!; reducciones += k.sobd + k.e; }
  const lpa = entradas - sumAsig - reducciones;
  const efectivo = entradas - h.gastos.filter(g => g.cuenta in h.efectivo).reduce((s, g) => s + g.lineas.reduce((t, l) => t + l[1], 0), 0)
    - h.pagos.reduce((s, x) => s + x[3], 0) + h.devoluciones.reduce((s, d) => s + d[3], 0);
  const disp: Record<string, number> = {}; for (const c of todas) disp[c] = celdas.get(c + '|' + A)!.disp;
  const fut = h.asig.filter(x => x[1] > A).reduce((s, x) => s + x[2], 0);
  const sobta = h.categorias.reduce((s, c) => s + celdas.get(c + '|' + A)!.sobt, 0);
  const deuda: Record<string, number> = {}, S: Record<string, number> = {}, RE: Record<string, number> = {};
  for (const t of tarjetas) {
    const saldo = -h.tarjetas[t] - h.gastos.filter(g => g.cuenta === t).reduce((s, g) => s + g.lineas.reduce((u, l) => u + l[1], 0), 0) + h.pagos.filter(x => x[1] === t).reduce((s, x) => s + x[3], 0);
    deuda[t] = Math.max(0, -saldo); const R = Math.max(0, disp[pago(t)]);
    S[t] = Math.max(0, deuda[t] - R); RE[t] = Math.max(0, R - deuda[t]);
  }
  return { A, lpa, efectivo, disp, fut, sobta, deuda, S, RE, celdas, periodos };
}
