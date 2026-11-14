// Finn 2.0 · Registrar gasto · dividir mi gasto entre categorías (lógica del prototipo)
function miles(e) { return e.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function mascaraMonto(v) {
  v = (v || '').replace(/[^0-9.]/g, '');
  var i = v.indexOf('.'), ent = i < 0 ? v : v.slice(0, i), dec = i < 0 ? null : v.slice(i + 1).replace(/\./g, '').slice(0, 2);
  ent = ent.replace(/^0+(?=\d)/, '').slice(0, 9); if (i >= 0 && ent === '') ent = '0';
  ent = miles(ent); return dec === null ? ent : ent + '.' + dec;
}
function mascaraPct(v) {
  v = (v || '').replace(/[^0-9.]/g, '');
  var i = v.indexOf('.'), e = (i < 0 ? v : v.slice(0, i)).slice(0, 3).replace(/^0+(?=\d)/, ''), d = i < 0 ? null : v.slice(i + 1).replace(/\./g, '').slice(0, 2);
  return d === null ? e : (e || '0') + '.' + d;
}
function centavos(v) { v = (v || '').replace(/,/g, ''); if (!v) return 0; var p = v.split('.'); return parseInt(p[0] || '0', 10) * 100 + parseInt(((p[1] || '') + '00').slice(0, 2), 10); }
function sinSigno(c) { var e = Math.floor(c / 100), d = c % 100; return miles(String(e)) + '.' + (d < 10 ? '0' : '') + d; }
function fmt(c) { return (c < 0 ? '−$' : '$') + sinSigno(Math.abs(c)); }
function aTexto(c) { return sinSigno(Math.max(0, c)); }
function centesimas(v) { v = (v || '').trim(); if (!v) return 0; var p = v.split('.'); return parseInt(p[0] || '0', 10) * 100 + parseInt(((p[1] || '') + '00').slice(0, 2), 10); } // % × 100
function pctTxt(h) { return (h / 100).toFixed(2).replace(/\.?0+$/, ''); }
// redondeo mitad hacia arriba de total × pct (pct en centésimas de %)
function porPct(total, h) { return Math.floor((total * h + 5000) / 10000); }

var CATEGORIAS = [
  { grupo: 'Casa', items: [['super', 'Supermercado', 6285], ['luz', 'Luz y agua', 660], ['internet', 'Internet y teléfono', 0], ['farmacia', 'Farmacia', 2765]] },
  { grupo: 'Comida fuera', items: [['rest', 'Restaurantes', -2630]] },
  { grupo: 'Transporte', items: [['gas', 'Gasolina', -1875]] },
  { grupo: 'Suscripciones', items: [['netflix', 'Netflix', 1549]] },
  { grupo: 'Ahorro', items: [['fondo', 'Fondo de emergencia', 135000], ['viaje', 'Viaje', 18462]] },
  { grupo: 'Deudas', items: [['cuota', 'Cuota del préstamo', 21000]] }
];
function cat(id) { for (var i = 0; i < CATEGORIAS.length; i++) for (var j = 0; j < CATEGORIAS[i].items.length; j++) if (CATEGORIAS[i].items[j][0] === id) { var x = CATEGORIAS[i].items[j]; return { id: x[0], nombre: x[1], disp: x[2], grupo: CATEGORIAS[i].grupo }; } return null; }
var MAX_LINEAS = 20;

// Calcula el reparto: devuelve montos por fila (centavos), suma, objetivo y estado
function repartir(s) {
  var T = centavos(s.total);
  var personas = s.quien === 'alguien' ? s.personas : [];
  var P = personas.reduce(function (a, p) { return a + centavos(p.monto); }, 0);
  var mia = s.quien === 'alguien' ? centavos(s.vos) : T;
  var filas = s.filas, n = filas.length, varias = s.varias && n > 1;
  var montos = [], estado = null, pctSuma = 0;
  if (!varias) montos = [Math.max(0, mia)];
  else if (s.modo === 'iguales') {
    var base = Math.floor(Math.max(0, mia) / n), resto = Math.max(0, mia) - base * n;
    for (var i = 0; i < n; i++) montos.push(base + (i === 0 ? resto : 0));
  } else if (s.modo === 'pct') {
    pctSuma = filas.reduce(function (a, f) { return a + centesimas(f.pct); }, 0);
    for (var k = 0; k < n; k++) montos.push(porPct(Math.max(0, mia), centesimas(filas[k].pct)));
    if (pctSuma === 10000) { var dif = mia - montos.reduce(function (a, b) { return a + b; }, 0); montos[0] += dif; }
  } else {
    var otras = 0;
    for (var q = 1; q < n; q++) otras += centavos(filas[q].monto);
    for (var r = 0; r < n; r++) montos.push(r === 0 && filas[0].auto ? Math.max(0, mia - otras) : centavos(filas[r].monto));
  }
  var suma = montos.reduce(function (a, b) { return a + b; }, 0);
  return { T: T, P: P, partes: (s.quien === 'alguien' ? centavos(s.vos) : 0) + P, mia: mia, montos: montos, suma: suma, dif: mia - suma, varias: varias, pctSuma: pctSuma, lineas: n + personas.length };
}
if (typeof module !== 'undefined') module.exports = { repartir: repartir, fmt: fmt, porPct: porPct, centavos: centavos, cat: cat };
