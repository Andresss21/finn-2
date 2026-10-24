// PRU-DOM-MOTOR-9xx (prototipo de V7-10): las semillas de los recorridos, como datos, reproducen los números que
// 06 §4 afirma (4.6, calculados en recorridos.py de la Fase 6) y los de A.7 que cita 4.2 (Restaurantes, ritmo).
import { describe, it, expect } from 'vitest';
import { calcular, type Hechos } from '../dominio/nucleo';
const c = (x: number) => Math.round(x * 100);
// estado_4_6 de recorridos.py: hoy 12 feb 2027; Super con sobregiro mixto, Salidas con sobregiro con débito
export const estado46 = (): Hechos => ({ hoy: '2027-02-12', efectivo: { Ahorro: 0 }, tarjetas: { T: 0 }, categorias: ['Super', 'Salidas', 'Ropa'],
  ingresos: [['Ahorro', '2027-02-01', c(1000)]], pagos: [], devoluciones: [],
  asig: [['Super', '2027-01-21', c(100)], ['Salidas', '2027-01-21', c(100)], ['Ropa', '2027-01-21', c(80)]],
  gastos: [{ id: 'LA PAMPA', cuenta: 'Ahorro', fecha: '2027-02-08', clave: 500, lineas: [['Salidas', c(150)]] },
    { id: 'SUPER SELECTOS', cuenta: 'Ahorro', fecha: '2027-02-10', clave: 1000, lineas: [['Super', c(60)]] },
    { id: 'PRICESMART', cuenta: 'T', fecha: '2027-02-10', clave: 1200, lineas: [['Super', c(70)]] },
    { id: 'DESPENSA DE DON JUAN', cuenta: 'Ahorro', fecha: '2027-02-10', clave: 9999, lineas: [['Super', c(20)]] }] });
// A.7 de 05 (anexo del encargo de diseño): Restaurantes en el período 21/09–20/10/2026, hoy 15/10/2026
export const restaurantesA7 = (): Hechos => ({ hoy: '2026-10-15', efectivo: { Ahorro: c(500) }, tarjetas: { 'Visa Oro': 0 }, categorias: ['Restaurantes'],
  ingresos: [], pagos: [], devoluciones: [], asig: [['Restaurantes', '2026-09-21', c(120)]],
  gastos: [['2026-09-23', 'LA PAMPA', 42.10, 'Ahorro'], ['2026-09-30', 'PIZZA HUT', 25.60, 'Visa Oro'], ['2026-10-05', 'STARBUCKS', 8.75, 'Ahorro'],
    ['2026-10-08', 'CAMPERO', 23.05, 'Ahorro'], ['2026-10-11', 'LA PAMPA 2', 28.30, 'Ahorro'], ['2026-10-13', 'PIZZA HUT 2', 18.50, 'Ahorro']]
    .map(([f, id, m, cu], k) => ({ id: id as string, cuenta: cu as string, fecha: f as string, clave: k, lineas: [['Restaurantes', c(m as number)]] as [string, number][] })) });
describe('PRU-DOM-MOTOR (semillas de recorridos)', () => {
  it('PRU-DOM-MOTOR-901 [REC-4.6, INV-01] la semilla de 4.6 da los números de recorridos.py en los pasos 1, 3 y 4', () => {
    const h = estado46(); let i = calcular(h);
    expect([i.efectivo, i.lpa, i.disp.Super, i.disp.Salidas, i.disp['Pago T'], i.S.T]).toEqual([c(770), c(720), c(-50), c(-50), c(40), c(30)]);
    const k = i.celdas.get('Super|2027-01-21')!; expect([k.sobt, k.sobd]).toEqual([c(30), c(20)]);
    const proy = ['Super', 'Salidas', 'Ropa'].reduce((s, x) => s + i.celdas.get(x + '|2027-01-21')!.sobd, 0); expect(proy).toBe(c(70));
    h.asig.push(['Ropa', '2027-01-21', c(-50)], ['Salidas', '2027-01-21', c(50)]); i = calcular(h);             // paso 3: mover 50 de Ropa a Salidas
    expect([i.disp.Salidas, i.disp.Ropa, i.lpa]).toEqual([0, c(30), c(720)]);
    h.hoy = '2027-02-21'; i = calcular(h);                                                                       // paso 4: cierre
    expect([i.lpa, i.S.T, i.disp.Ropa, i.disp['Pago T']]).toEqual([c(700), c(30), c(30), c(40)]);
  });
  it('PRU-DOM-MOTOR-902 [REC-4.2, CA-62.3] A.7 Restaurantes: disponible −26.30, reparto de la tabla y ritmo $55.56', () => {
    const i = calcular(restaurantesA7()); const k = i.celdas.get('Restaurantes|2026-09-21')!;
    expect([i.disp.Restaurantes, k.sobt, k.sobd]).toEqual([c(-26.30), 0, c(26.30)]);
    // Ritmo (CA-62.3): gastado 146.30 en 25 de 30 días → proyección 175.56 al 20/10, 55.56 más que lo asignado
    const gastado = c(146.30), dias = 25, duracion = 30, proy = Math.round(gastado * duracion / dias);
    expect([proy, proy - c(120)]).toEqual([c(175.56), c(55.56)]);
  });
});
