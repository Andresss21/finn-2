// Finn 2.0 · Estructura · tres propuestas de colapso y arrastre (lógica del prototipo)
var GRUPOS0 = [
  { id: 'casa', nombre: 'Casa', cats: [
    { id: 'super', nombre: 'Supermercado', sub: 'Meta mensual $350.00' },
    { id: 'luz', nombre: 'Luz y agua', sub: '' },
    { id: 'internet', nombre: 'Internet y teléfono', sub: '' },
    { id: 'farmacia', nombre: 'Farmacia', sub: '' }] },
  { id: 'comida', nombre: 'Comida fuera', cats: [{ id: 'rest', nombre: 'Restaurantes', sub: '' }] },
  { id: 'transporte', nombre: 'Transporte', cats: [{ id: 'gas', nombre: 'Gasolina', sub: '' }] },
  { id: 'subs', nombre: 'Suscripciones', cats: [{ id: 'netflix', nombre: 'Netflix', sub: 'Meta mensual $15.49' }] },
  { id: 'ahorro', nombre: 'Ahorro', cats: [
    { id: 'fondo', nombre: 'Fondo de emergencia', sub: 'Meta para el 30/06/2027 · $3,000.00' },
    { id: 'viaje', nombre: 'Viaje', sub: 'Meta anual $1,200.00' }] },
  { id: 'deudas', nombre: 'Deudas', cats: [{ id: 'cuota', nombre: 'Cuota del préstamo', sub: '' }] }
];
var NOMBRES_NUEVOS = ['Mascota', 'Regalos', 'Ropa', 'Salud', 'Educación', 'Hogar'];
var ORD_F = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima', 'octava', 'novena', 'décima'];
var ORD_M = ['primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo'];

function clonar(gs) { return gs.map(function (g) { return { id: g.id, nombre: g.nombre, cats: g.cats.slice() }; }); }
function buscarGrupo(gs, gid) { for (var i = 0; i < gs.length; i++) if (gs[i].id === gid) return gs[i]; return null; }
function posicion(gs, cid) {
  for (var i = 0; i < gs.length; i++) for (var j = 0; j < gs[i].cats.length; j++) if (gs[i].cats[j].id === cid) return { gid: gs[i].id, idx: j, gi: i };
  return null;
}
function posGrupo(gs, gid) { for (var i = 0; i < gs.length; i++) if (gs[i].id === gid) return i; return -1; }
function buscarCat(gs, cid) { var p = posicion(gs, cid); return p ? buscarGrupo(gs, p.gid).cats[p.idx] : null; }
// idx es la posición en el grupo destino SIN la categoría que se mueve
function moverCat(gs, cid, gid, idx) {
  var r = clonar(gs), p = posicion(r, cid);
  var cat = buscarGrupo(r, p.gid).cats.splice(p.idx, 1)[0];
  var d = buscarGrupo(r, gid); idx = Math.max(0, Math.min(idx, d.cats.length));
  d.cats.splice(idx, 0, cat);
  return r;
}
function moverGrupo(gs, gid, idx) {
  var r = clonar(gs), i = posGrupo(r, gid), g = r.splice(i, 1)[0];
  idx = Math.max(0, Math.min(idx, r.length)); r.splice(idx, 0, g); return r;
}
function ordinal(i, n, fem) {
  if (n === 1) return fem ? 'la única' : 'el único';
  if (i === n - 1 && n > 2) return fem ? 'la última' : 'el último';
  var o = (fem ? ORD_F : ORD_M)[i] || ((i + 1) + '.ª');
  return (fem ? 'la ' : 'el ') + o;
}
function lugarCat(gs, cid) {
  var p = posicion(gs, cid), g = buscarGrupo(gs, p.gid);
  return ordinal(p.idx, g.cats.length, true) + ' de ' + g.nombre;
}
function textoCat(antes, despues, cid) {
  var c = buscarCat(despues, cid), pa = posicion(antes, cid), pd = posicion(despues, cid), g = buscarGrupo(despues, pd.gid);
  if (pa.gid === pd.gid) return 'Moviste ' + c.nombre + ': ahora es ' + ordinal(pd.idx, g.cats.length, true) + ' de ' + g.nombre + '.';
  return 'Moviste ' + c.nombre + ' a ' + g.nombre + ': ahora es ' + ordinal(pd.idx, g.cats.length, true) + '.';
}
function textoGrupo(despues, gid) {
  var i = posGrupo(despues, gid);
  return 'Moviste el grupo ' + buscarGrupo(despues, gid).nombre + ': ahora es ' + ordinal(i, despues.length, false) + '.';
}
function cuantas(n) { return n === 1 ? '1 categoría' : n + ' categorías'; }
function resumenNombres(cats) {
  if (!cats.length) return 'Todavía no tiene categorías.';
  var ns = cats.map(function (c) { return c.nombre; });
  if (ns.length === 1) return ns[0];
  if (ns.length === 2) return ns[0] + ' y ' + ns[1];
  if (ns.length === 3) return ns[0] + ', ' + ns[1] + ' y ' + ns[2];
  return ns[0] + ', ' + ns[1] + ' y ' + (ns.length - 2) + ' más';
}
// lugares posibles para una categoría, en el orden de la pantalla (sin la categoría)
function lugares(gs, cid) {
  var r = [];
  gs.forEach(function (g) {
    var n = g.cats.filter(function (c) { return c.id !== cid; }).length;
    for (var i = 0; i <= n; i++) r.push({ gid: g.id, idx: i });
  });
  return r;
}
function indiceLugar(ls, d) { for (var i = 0; i < ls.length; i++) if (ls[i].gid === d.gid && ls[i].idx === d.idx) return i; return -1; }
function lugarSinCat(gs, cid) { var p = posicion(gs, cid); return { gid: p.gid, idx: p.idx }; }
function con(a, b) { var r = {}, k; for (k in a) r[k] = a[k]; for (k in b) r[k] = b[k]; return r; }
function sinMovimiento() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function ms(el, nombre, def) { try { var v = getComputedStyle(el).getPropertyValue(nombre).trim(); var n = parseFloat(v); return isNaN(n) ? def : (v.indexOf('ms') >= 0 ? n : n * 1000); } catch (e) { return def; } }
function curva(el, nombre, def) { try { var v = getComputedStyle(el).getPropertyValue(nombre).trim(); return v || def; } catch (e) { return def; } }

if (typeof module !== 'undefined') module.exports = { GRUPOS0: GRUPOS0, moverCat: moverCat, moverGrupo: moverGrupo, ordinal: ordinal, textoCat: textoCat, textoGrupo: textoGrupo, lugares: lugares, posicion: posicion, resumenNombres: resumenNombres, lugarCat: lugarCat };
