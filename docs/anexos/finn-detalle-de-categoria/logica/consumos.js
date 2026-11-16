// Finn 2.0 · C-52 · Lista de consumos del detalle de categoría (lógica de presentación, sin interfaz).
// Ordena, filtra y agrupa lo que manda el servidor (04 §6.3 `consumos`). No suma ni resta montos (PF-3):
// los grupos solo cuentan filas.

var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fecha(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
function iso(d) { return d.toISOString().slice(0, 10); }
function lunesDe(s) { var d = fecha(s); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return iso(d); }

// filtro: 'todos' | 'nocubiertos' | 'debito' | 'tarjeta'; dia: 'AAAA-MM-DD' o null
function filtrar(consumos, filtro, dia) {
  return consumos.filter(function (c) {
    if (dia && c.fecha !== dia) return false;
    if (filtro === 'nocubiertos') return c.noCubierto > 0;
    if (filtro === 'debito') return c.medio === 'debito';
    if (filtro === 'tarjeta') return c.medio === 'tarjeta';
    return true;
  });
}

// Filtros que se ofrecen: «Todos · n» siempre; «No cubiertos · k» si k > 0; Débito y Tarjeta solo si hay de los dos.
function filtrosVisibles(consumos) {
  var k = consumos.filter(function (c) { return c.noCubierto > 0; }).length;
  var t = consumos.filter(function (c) { return c.medio === 'tarjeta'; }).length;
  var r = [{ clave: 'todos', texto: 'Todos · ' + consumos.length }];
  if (k) r.push({ clave: 'nocubiertos', texto: 'No cubiertos · ' + k });
  if (t && t < consumos.length) r.push({ clave: 'debito', texto: 'Débito' }, { clave: 'tarjeta', texto: 'Tarjeta' });
  return r.length > 1 ? r : [];
}

// Semanas de lunes a domingo, recortadas al período; de la más reciente a la más antigua, y dentro de cada una
// del consumo más reciente al más antiguo (el servidor los manda al revés: en el orden en que se cubren, D2).
function agrupar(consumos, periodo) {
  var grupos = [], porLunes = {};
  consumos.slice().reverse().forEach(function (c) {
    var l = lunesDe(c.fecha);
    if (!porLunes[l]) { porLunes[l] = { lunes: l, filas: [] }; grupos.push(porLunes[l]); }
    porLunes[l].filas.push(c);
  });
  grupos.forEach(function (g) {
    var a = fecha(g.lunes), b = fecha(g.lunes); b.setUTCDate(b.getUTCDate() + 6);
    var ini = fecha(periodo.inicio), fin = fecha(periodo.fin);
    if (a < ini) a = ini; if (b > fin) b = fin;
    g.titulo = a.getUTCMonth() === b.getUTCMonth() ? a.getUTCDate() + '–' + b.getUTCDate() + ' ' + MES[b.getUTCMonth()]
      : a.getUTCDate() + ' ' + MES[a.getUTCMonth()] + ' – ' + b.getUTCDate() + ' ' + MES[b.getUTCMonth()];
    g.cuenta = g.filas.length + (g.filas.length === 1 ? ' consumo' : ' consumos');
  });
  return grupos;
}

// Plegado: con más de 10 consumos y sin filtro ni día, solo la primera semana (la más reciente) arranca abierta.
// Lo que el usuario abre o cierra se respeta mientras no salga de la pantalla.
function abierta(grupo, indice, total, filtro, dia, elegidas) {
  if (total <= 10 || dia || filtro !== 'todos') return true;
  if (elegidas && grupo.lunes in elegidas) return elegidas[grupo.lunes];
  return indice === 0;
}

// La línea que explica el orden de cobertura aparece si hay algún consumo sin cubrir.
function explicarOrden(consumos) { return consumos.some(function (c) { return c.noCubierto > 0; }); }

if (typeof module !== 'undefined') module.exports = { filtrar: filtrar, filtrosVisibles: filtrosVisibles, agrupar: agrupar, abierta: abierta, explicarOrden: explicarOrden, lunesDe: lunesDe };
