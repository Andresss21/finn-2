// node consumos.test.js
var assert = require('assert'), c = require('./consumos.js');
var per = { inicio: '2026-09-21', fin: '2026-10-20' };
var L = [ // en el orden del servidor (D2: del más antiguo al más reciente)
  { fecha: '2026-09-23', medio: 'debito', monto: 4210, cubierto: 4210, noCubierto: 0 },
  { fecha: '2026-09-30', medio: 'tarjeta', monto: 2560, cubierto: 2560, noCubierto: 0 },
  { fecha: '2026-10-05', medio: 'debito', monto: 875, cubierto: 875, noCubierto: 0 },
  { fecha: '2026-10-08', medio: 'debito', monto: 2305, cubierto: 2305, noCubierto: 0 },
  { fecha: '2026-10-11', medio: 'debito', monto: 2830, cubierto: 2050, noCubierto: 780 },
  { fecha: '2026-10-13', medio: 'debito', monto: 1850, cubierto: 0, noCubierto: 1850 }];
// 1. Semanas de la más reciente a la más antigua, filas del más reciente al más antiguo
var g = c.agrupar(L, per);
assert.deepStrictEqual(g.map(function (x) { return x.titulo; }), ['12–18 oct', '5–11 oct', '28 sep – 4 oct', '21–27 sep']);
assert.deepStrictEqual(g[1].filas.map(function (x) { return x.fecha; }), ['2026-10-11', '2026-10-08', '2026-10-05']);
assert.strictEqual(g[1].cuenta, '3 consumos'); assert.strictEqual(g[0].cuenta, '1 consumo');
// 2. Filtros visibles
assert.deepStrictEqual(c.filtrosVisibles(L).map(function (f) { return f.texto; }), ['Todos · 6', 'No cubiertos · 2', 'Débito', 'Tarjeta']);
assert.deepStrictEqual(c.filtrosVisibles([L[0]]), []);
// 3. Filtrar por día y por estado
assert.strictEqual(c.filtrar(L, 'todos', '2026-10-11').length, 1);
assert.strictEqual(c.filtrar(L, 'nocubiertos', null).length, 2);
assert.strictEqual(c.filtrar(L, 'tarjeta', null).length, 1);
// 4. Plegado: con 6 consumos todo abierto; con 45, solo la primera
assert.strictEqual(c.abierta(g[2], 2, 6, 'todos', null, {}), true);
assert.strictEqual(c.abierta(g[0], 0, 45, 'todos', null, {}), true);
assert.strictEqual(c.abierta(g[2], 2, 45, 'todos', null, {}), false);
assert.strictEqual(c.abierta(g[2], 2, 45, 'todos', null, { '2026-09-28': true }), true);
assert.strictEqual(c.abierta(g[2], 2, 45, 'debito', null, {}), true);
// 5. Semana recortada al período
assert.strictEqual(c.agrupar([{ fecha: '2026-08-21', medio: 'debito', monto: 1, cubierto: 1, noCubierto: 0 }], { inicio: '2026-08-21', fin: '2026-09-20' })[0].titulo, '21–23 ago');
// 6. Línea del orden
assert.strictEqual(c.explicarOrden(L), true); assert.strictEqual(c.explicarOrden(L.slice(0, 2)), false);
console.log('consumos: 6 casos, todo bien');
