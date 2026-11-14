// División entre varias personas. Usa las máscaras de motor.js.
function pctTxt(h) { var s = (h / 100).toFixed(2).replace(/\.?0+$/, ''); return s; }
function repartoIgual(total, n) { var base = Math.floor(total / n); return { base: base, resto: total - base * n }; }
function pctIguales(personas) {
  var n = personas.length + 1, r = repartoIgual(10000, n), o = { Vos: pctTxt(r.base + r.resto) };
  personas.forEach(function (p) { o[p] = pctTxt(r.base); });
  return o;
}
function monIguales(personas, c) {
  var n = personas.length + 1, r = repartoIgual(c, n), o = { Vos: c ? sinSigno(r.base + r.resto) : '' };
  personas.forEach(function (p) { o[p] = c ? sinSigno(r.base) : ''; });
  return o;
}
var BASE2 = { monto: '1,236.40', fecha: '15/10/2026', comercio: 'AVIANCA', cuenta: 'Visa Oro', categoria: 'Viaje', nota: 'Boletos a Guatemala',
  dividir: true, personas: ['Carlos'], conocidas: ['Carlos', 'Ana'], nuevas: [], modo: 'iguales', pct: { Vos: '50', Carlos: '50' }, mon: { Vos: '618.20', Carlos: '618.20' },
  agregando: false, nuevoNombre: '', nuevoErr: '', aviso: '', abierto: null, tocado: {}, enviado: false, guardado: false, forzar: '' };
var VACIO2 = con(BASE2, { monto: '', comercio: '', categoria: '', nota: '', dividir: false, personas: [], pct: { Vos: '100' }, mon: { Vos: '' } });

function calcular2(s, escritorio) {
  var f = {}, t = s.tocado || {}, env = !!s.enviado;
  var c = centavos(s.monto);
  f.monto = s.monto; f.montoTxt = fmt(c);
  f.montoErr = c > MAXIMO ? 'El máximo es $21,474,836.47.' : ((c === 0 && (t.monto || env)) ? 'Escribí un monto mayor que $0.00.' : '');
  f.fecha = s.fecha; f.fechaErr = errorFecha(s.fecha, t.fecha, env);
  f.comercio = s.comercio; f.nota = s.nota; f.cuenta = s.cuenta; f.cuentaSub = SUBCUENTA[s.cuenta] || '';
  f.categoria = s.categoria; f.categoriaVer = s.categoria || 'Elegí una categoría';
  f.categoriaErr = (!s.categoria && (t.categoria || env)) ? (s.dividir ? 'Elegí la categoría de tu parte.' : 'Elegí una categoría.') : '';
  f.dividir = !!s.dividir; f.dividirAria = s.dividir ? 'true' : 'false';
  f.soloAria = s.dividir ? 'false' : 'true'; f.soloBorde = s.dividir ? '1px solid var(--borde-sutil)' : '2px solid var(--accion)'; f.soloFondo = s.dividir ? 'var(--superficie)' : 'var(--accion-tonal)';
  f.conBorde = s.dividir ? '2px solid var(--accion)' : '1px solid var(--borde-sutil)'; f.conFondo = s.dividir ? 'var(--accion-tonal)' : 'var(--superficie)';
  var personas = s.dividir ? s.personas : [];
  f.personaErr = (s.dividir && !s.personas.length && (env || t.persona)) ? 'Elegí con quién lo dividís.' : '';
  f.modo = s.modo; f.modoIguales = s.modo === 'iguales'; f.modoPct = s.modo === 'porcentaje'; f.modoMontos = s.modo === 'montos';
  var nombres = ['Vos'].concat(personas), montos = {}, err = '';
  if (!s.dividir || !personas.length) { montos.Vos = c; }
  else if (s.modo === 'iguales') {
    var r = repartoIgual(c, nombres.length);
    nombres.forEach(function (n) { montos[n] = r.base; }); montos.Vos = r.base + r.resto;
  } else if (s.modo === 'porcentaje') {
    var suma = 0, alguno = false, otros = 0;
    nombres.forEach(function (n) { var p = numero(s.pct[n]); suma += p; if (p > 100) alguno = true; });
    suma = redondo(suma);
    nombres.forEach(function (n) { if (n !== 'Vos') { montos[n] = Math.round(c * numero(s.pct[n]) / 100); otros += montos[n]; } });
    montos.Vos = suma === 100 ? c - otros : Math.round(c * numero(s.pct.Vos) / 100);
    if (alguno) err = 'Cada parte va de 0 a 100 %.';
    else if (suma > 100) err = 'Suman ' + suma + ' %. Sobran ' + redondo(suma - 100) + ' %.';
    else if (suma < 100 && (t.pct || env)) { var rep = 0; nombres.forEach(function (n) { rep += montos[n]; }); err = 'Suman ' + suma + ' %. Falta repartir ' + redondo(100 - suma) + ' % (' + fmt(c - rep) + ').'; }
  } else {
    var tot = 0;
    nombres.forEach(function (n) { montos[n] = centavos(s.mon[n]); tot += montos[n]; });
    if (tot > c) err = 'Las partes pasan el total por ' + fmt(tot - c) + '.';
    else if (tot !== c && (t.montos || env)) err = 'Las partes suman ' + fmt(tot) + ' y el total es ' + fmt(c) + '.';
  }
  f.divisionErr = err;
  var repartido = 0; nombres.forEach(function (n) { repartido += montos[n] || 0; });
  f.repartidoOk = !err && repartido === c;
  f.estado = err ? err : (repartido === c ? 'Repartido ' + fmt(repartido) + ' de ' + fmt(c) : 'Falta repartir ' + fmt(c - repartido));
  f.estadoOk = !err && repartido === c; f.estadoNo = !f.estadoOk;
  f.estadoColor = f.estadoOk ? 'var(--positivo-texto)' : 'var(--problema-texto)';
  f.estadoFondo = f.estadoOk ? 'var(--positivo-fondo)' : 'var(--problema-fondo)';
  f.partes = nombres.map(function (n) {
    var vos = n === 'Vos', nueva = (s.nuevas || []).indexOf(n) >= 0;
    var pc = c ? redondo((montos[n] || 0) * 100 / c) : 0;
    return { nombre: n, esVos: vos, esOtro: !vos, inicial: n[0], id: n.replace(/[^A-Za-z]/g, ''),
      sub: vos ? 'Tu parte · ' + f.categoriaVer : (nueva ? 'Persona nueva · queda en Por cobrar' : 'Te debe · queda en Por cobrar'),
      montoTxt: fmt(montos[n] || 0), pctTxt: pc + ' %', avBg: vos ? 'var(--accion-tonal)' : 'var(--deuda-fondo)', avTx: vos ? 'var(--accion)' : 'var(--deuda-texto)',
      montoColor: vos ? 'var(--texto)' : 'var(--deuda-texto)', pct: s.pct[n] || '', mon: s.mon[n] || '', etqQuitar: 'Quitar a ' + n };
  });
  f.unaPersona = personas.length === 1; f.variasPersonas = personas.length > 1; f.hayPersonas = personas.length > 0;
  f.cuantos = String(nombres.length);
  f.igualesTxt = personas.length > 1 ? 'Partes iguales' : 'Mitades';
  f.gente = (s.conocidas || []).map(function (p) {
    var on = s.personas.indexOf(p) >= 0, nueva = (s.nuevas || []).indexOf(p) >= 0;
    return { nombre: p, inicial: p[0], on: on, aria: on ? 'true' : 'false', borde: on ? '2px solid var(--accion)' : '1px solid var(--borde-sutil)', fondo: on ? 'var(--accion-tonal)' : 'transparent', peso: on ? '700' : '500', avBg: on ? 'var(--accion)' : 'var(--superficie-hundida)', avTx: on ? 'var(--texto-sobre-accion)' : 'var(--texto)', nueva: nueva };
  });
  f.agregando = !!s.agregando; f.noAgregando = !s.agregando; f.nuevoNombre = s.nuevoNombre; f.nuevoErr = s.nuevoErr || ''; f.aviso = s.aviso || '';
  f.nuevoMal = f.nuevoErr ? 'mal' : '';
  var lista = [['Total', f.montoErr], ['Fecha', f.fechaErr], ['Categoría', f.categoriaErr], ['Con quién', f.personaErr], ['División', f.divisionErr]];
  var n = 0; lista.forEach(function (x) { if (x[1]) n++; });
  var completo = c > 0 && s.fecha && s.fecha.length === 10 && !f.fechaErr && !!s.categoria && (!s.dividir || personas.length > 0) && f.repartidoOk;
  f.guardarOk = !!completo; f.guardarNo = !completo; f.guardar = 'Guardar ' + fmt(c);
  f.motivo = n ? ('Corregí ' + n + (n === 1 ? ' campo' : ' campos') + ' para guardar.') : (c === 0 ? 'Escribí el monto para guardar.' : (!s.categoria ? 'Elegí una categoría para guardar.' : (s.dividir && !personas.length ? 'Elegí con quién lo dividís.' : (!f.repartidoOk ? 'Terminá de repartir el total.' : ''))));
  ['monto', 'fecha', 'categoria', 'persona', 'division'].forEach(function (k) {
    var e = f[k + 'Err'];
    f[k + 'Mal'] = e ? 'mal' : ''; f[k + 'Inv'] = e ? 'true' : 'false'; f[k + 'Etq'] = e ? 'var(--problema-texto)' : 'var(--texto)';
  });
  var modos = [['Igu', f.modoIguales], ['Pct', f.modoPct], ['Mon', f.modoMontos]];
  modos.forEach(function (m) {
    var on = m[1];
    f['seg' + m[0] + 'Bg'] = on ? 'var(--superficie)' : 'transparent';
    f['seg' + m[0] + 'Sh'] = on ? '0 0 0 1px var(--borde-control), 0 1px 2px rgba(0,0,0,.08)' : 'none';
    f['seg' + m[0] + 'W'] = on ? '700' : '500'; f['seg' + m[0] + 'Ar'] = on ? 'true' : 'false';
  });
  f.cuentaVer = s.cuenta; f.cuentaColor = 'var(--texto)';
  f.categoriaColor = s.categoria ? 'var(--texto)' : 'var(--texto-terciario)';
  f.cuentaAbierta = s.abierto === 'cuenta'; f.categoriaAbierta = s.abierto === 'categoria';
  f.cuentaExp = f.cuentaAbierta ? 'true' : 'false'; f.categoriaExp = f.categoriaAbierta ? 'true' : 'false';
  f.comercioForzado = s.forzar === 'comercio' ? 'forzada' : '';
  f.esEscritorio = !!escritorio; f.esTelefono = !escritorio;
  f.guardado = !!s.guardado; f.noGuardado = !s.guardado;
  var deben = personas.map(function (p) { return p + ' te debe ' + fmt(montos[p] || 0); }).join(' · ');
  f.resultado = 'Guardado: ' + (s.comercio || 'Gasto') + ' · ' + fmt(c) + ' · ' + s.cuenta + (deben ? ' · ' + deben : '');
  return f;
}
