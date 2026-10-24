// Generadores de fast-check para el núcleo (V7-03). Fechas en 2027 (ciclo 21) como en 01 §8.0.
import fc from 'fast-check';
import { inicio, siguiente, pago, type Hechos, type Gasto } from './nucleo';
const DIAS_MES = [31, 28, 31, 30, 31, 30, 31];
export const FECHAS: string[] = []; DIAS_MES.forEach((n, i) => { for (let d = 1; d <= n; d++) FECHAS.push(`2027-${String(i + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`); });
const CATS = ['Super', 'Salidas', 'Ropa'];
const monto = fc.integer({ min: 1, max: 60000 });
export const hechosArb = (opts: { sinPagoFuturoSiguiente?: boolean } = {}) => fc.record({
  iHoy: fc.integer({ min: 25, max: FECHAS.length - 1 }),
  tarjetas: fc.subarray(['T', 'U']),
  deudaIni: fc.tuple(fc.integer({ min: 0, max: 40000 }), fc.integer({ min: 0, max: 40000 })),
  saldoIni: fc.integer({ min: 0, max: 300000 }),
  ingresos: fc.array(fc.tuple(fc.nat(), monto), { maxLength: 4 }),
  gastos: fc.array(fc.record({ i: fc.nat(), cuenta: fc.nat(), clave: fc.nat({ max: 1e9 }), lineas: fc.array(fc.tuple(fc.constantFrom(...CATS), monto), { minLength: 1, maxLength: 3 }) }), { maxLength: 14 }),
  pagos: fc.array(fc.tuple(fc.nat(), fc.nat(), monto), { maxLength: 4 }),
  asig: fc.array(fc.tuple(fc.nat(), fc.nat(), fc.integer({ min: -20000, max: 80000 }).filter(x => x !== 0)), { maxLength: 12 }),
  devs: fc.array(fc.tuple(fc.nat(), fc.constantFrom(...CATS), monto), { maxLength: 2 }),
}).map((r): Hechos => {
  const hoy = FECHAS[r.iHoy];
  const fecha = (k: number) => FECHAS[k % (r.iHoy + 1)];
  const tarjetas = Object.fromEntries(r.tarjetas.map((t, k) => [t, r.deudaIni[k]]));
  const cuentas = ['Ahorro', ...r.tarjetas];
  const periodos: string[] = []; let p = inicio(FECHAS[0]); const lim = siguiente(siguiente(inicio(hoy))); while (p <= lim) { periodos.push(p); p = siguiente(p); }
  const cats = [...CATS, ...r.tarjetas.map(pago)];
  // Las claves de orden son únicas, como en la base (instante + secuencia, CB-21)
  const usadas = new Set<number>();
  const gastos: Gasto[] = r.gastos.map((g, k) => { let c = g.clave; while (usadas.has(c)) c++; usadas.add(c);
    return { id: 'g' + k, cuenta: cuentas[g.cuenta % cuentas.length], fecha: fecha(g.i), clave: c, lineas: g.lineas }; });
  const m = new Map<string, [string, string, number]>();
  for (const [ci, pi, x] of r.asig) {
    const c = cats[ci % cats.length], per = periodos[pi % periodos.length];
    if (opts.sinPagoFuturoSiguiente && c.startsWith('Pago ') && per === siguiente(inicio(hoy))) continue;
    m.set(c + '|' + per, [c, per, x]);       // un hecho por (categoría, período), DM-2
  }
  return { hoy, efectivo: { Ahorro: r.saldoIni }, tarjetas, categorias: CATS,
    ingresos: r.ingresos.map(([i, x]) => ['Ahorro', fecha(i), x]), gastos,
    pagos: r.tarjetas.length ? r.pagos.map(([i, t, x]) => ['Ahorro', r.tarjetas[t % r.tarjetas.length], fecha(i), x]) : [],
    asig: [...m.values()], devoluciones: r.devs.map(([i, c, x]) => ['Ahorro', fecha(i), c, x]) };
});
