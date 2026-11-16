// Los 6 casos de `docs/anexos/finn-detalle-de-categoria/logica/consumos.test.js` (C-52 §4), portados sin cambiar ni un dato:
// semanas y su orden, filtros visibles, filtrar por día y por estado, plegado, semana recortada al período y la línea del
// orden. Más el nombre de los días del calendario (§7 y §9). Solo cuenta filas: ningún monto (PF-3).
import { describe, expect, it } from 'vitest';
import {
  abierta,
  agrupar,
  diaDeMes,
  explicarOrden,
  filtrar,
  filtrosVisibles,
  nombreDelDia,
  type ConsumoDeLista,
} from './consumos-por-semana';

const per = { inicio: '2026-09-21', fin: '2026-10-20' };
// En el orden del servidor (D2: del más antiguo al más reciente)
const L: (ConsumoDeLista & { monto: number; cubierto: number })[] = [
  { fecha: '2026-09-23', medio: 'debito', monto: 4210, cubierto: 4210, noCubierto: 0 },
  { fecha: '2026-09-30', medio: 'tarjeta', monto: 2560, cubierto: 2560, noCubierto: 0 },
  { fecha: '2026-10-05', medio: 'debito', monto: 875, cubierto: 875, noCubierto: 0 },
  { fecha: '2026-10-08', medio: 'debito', monto: 2305, cubierto: 2305, noCubierto: 0 },
  { fecha: '2026-10-11', medio: 'debito', monto: 2830, cubierto: 2050, noCubierto: 780 },
  { fecha: '2026-10-13', medio: 'debito', monto: 1850, cubierto: 0, noCubierto: 1850 },
];

describe('PRU-DOM-PRES-811 lista de consumos por semana del detalle de categoría', () => {
  it('PRU-DOM-PRES-811 [C-52 §4] semanas de la más reciente a la más antigua con sus filas del consumo más nuevo al más viejo, filtros según lo que hay, filtrar por día y estado, plegado con más de 10, semana recortada al período y la línea del orden', () => {
    // 1. Semanas de la más reciente a la más antigua, filas del más reciente al más antiguo
    const g = agrupar(L, per);
    expect(g.map((x) => x.titulo)).toEqual([
      '12–18 oct',
      '5–11 oct',
      '28 sep – 4 oct',
      '21–27 sep',
    ]);
    expect(g[1]?.filas.map((x) => x.fecha)).toEqual(['2026-10-11', '2026-10-08', '2026-10-05']);
    expect(g[1]?.cuenta).toBe('3 consumos');
    expect(g[0]?.cuenta).toBe('1 consumo');
    // 2. Filtros visibles
    expect(filtrosVisibles(L).map((f) => f.texto)).toEqual([
      'Todos · 6',
      'No cubiertos · 2',
      'Débito',
      'Tarjeta',
    ]);
    expect(filtrosVisibles(L.slice(0, 1))).toEqual([]);
    // 3. Filtrar por día y por estado
    expect(filtrar(L, 'todos', '2026-10-11')).toHaveLength(1);
    expect(filtrar(L, 'nocubiertos', null)).toHaveLength(2);
    expect(filtrar(L, 'tarjeta', null)).toHaveLength(1);
    // 4. Plegado: con 6 consumos todo abierto; con 45, solo la primera
    const [g0, , g2] = g as [(typeof g)[number], unknown, (typeof g)[number]];
    expect(abierta(g2, 2, 6, 'todos', null, {})).toBe(true);
    expect(abierta(g0, 0, 45, 'todos', null, {})).toBe(true);
    expect(abierta(g2, 2, 45, 'todos', null, {})).toBe(false);
    expect(abierta(g2, 2, 45, 'todos', null, { '2026-09-28': true })).toBe(true);
    expect(abierta(g2, 2, 45, 'debito', null, {})).toBe(true);
    // 5. Semana recortada al período
    expect(
      agrupar([{ fecha: '2026-08-21', medio: 'debito', noCubierto: 0 }], {
        inicio: '2026-08-21',
        fin: '2026-09-20',
      })[0]?.titulo,
    ).toBe('21–23 ago');
    // 6. Línea del orden
    expect(explicarOrden(L)).toBe(true);
    expect(explicarOrden(L.slice(0, 2))).toBe(false);
  });

  it('PRU-DOM-PRES-811 [C-52 §7] el nombre de cada día del calendario y el del anuncio: «viernes 9 de oct» y «9 de oct»', () => {
    expect(nombreDelDia('2026-10-09')).toBe('viernes 9 de oct');
    expect(nombreDelDia('2026-09-21')).toBe('lunes 21 de sep');
    expect(nombreDelDia('2026-10-11')).toBe('domingo 11 de oct');
    expect(diaDeMes('2026-10-09')).toBe('9 de oct');
  });
});
