var MAXIMO = 2147483647;
var INICIO = new Date(2026, 8, 21), HOY = new Date(2026, 9, 15);
function miles(e) { return e.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function mascaraMonto(v) {
  v = (v || '').replace(/[^0-9.]/g, '');
  var i = v.indexOf('.');
  var ent = i < 0 ? v : v.slice(0, i);
  var dec = i < 0 ? null : v.slice(i + 1).replace(/\./g, '').slice(0, 2);
  ent = ent.replace(/^0+(?=\d)/, '').slice(0, 9);
  if (i >= 0 && ent === '') ent = '0';
  ent = miles(ent);
  return dec === null ? ent : ent + '.' + dec;
}
function centavos(v) {
  v = (v || '').replace(/,/g, '');
  if (!v) return 0;
  var p = v.split('.');
  return parseInt(p[0] || '0', 10) * 100 + parseInt(((p[1] || '') + '00').slice(0, 2), 10);
}
function sinSigno(c) { var e = Math.floor(c / 100), d = c % 100; return miles(String(e)) + '.' + (d < 10 ? '0' : '') + d; }
function fmt(c) { return (c < 0 ? '−$' : '$') + sinSigno(Math.abs(c)); }
function mascaraFecha(v) {
  var d = (v || '').replace(/[^0-9]/g, '').slice(0, 8);
  if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
  if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2);
  return d;
}
function mascaraPct(v) {
  v = (v || '').replace(/[^0-9.]/g, '');
  var i = v.indexOf('.');
  var e = (i < 0 ? v : v.slice(0, i)).slice(0, 3).replace(/^0+(?=\d)/, '');
  var d = i < 0 ? null : v.slice(i + 1).replace(/\./g, '').slice(0, 2);
  return d === null ? e : (e || '0') + '.' + d;
}
function numero(v) { var n = parseFloat((v || '').replace(/,/g, '')); return isNaN(n) ? 0 : n; }
function redondo(n) { return Math.round(n * 100) / 100; }
function errorFecha(f, tocada, enviado) {
  if (!f) return enviado ? 'Escribí la fecha.' : '';
  if (f.length < 10) return (tocada || enviado) ? 'Completá la fecha como dd/mm/aaaa.' : '';
  var d = +f.slice(0, 2), m = +f.slice(3, 5), a = +f.slice(6);
  var x = new Date(a, m - 1, d);
  if (x.getFullYear() !== a || x.getMonth() !== m - 1 || x.getDate() !== d) return 'Esa fecha no existe. Escribila como dd/mm/aaaa.';
  if (x < INICIO || x > HOY) return 'Elegí una fecha del 21/09 al 15/10/2026: el período actual, hasta hoy.';
  return '';
}
var SUBCUENTA = { 'Visa Oro': 'Deuda $642.18', 'Mastercard Clásica': 'Tarjeta de crédito', 'Cuenta corriente': 'Débito', 'Cuenta de ahorro': 'Débito' };
var VACIO = { monto: '', fecha: '15/10/2026', comercio: '', cuenta: 'Visa Oro', categoria: '', nota: '', dividir: false, persona: '', modo: 'mitades', pctVos: '50', pctOtro: '50', monVos: '', monOtro: '', tocado: {}, enviado: false, guardado: false, paso: 1 };
var EJEMPLO = { monto: '1,236.40', fecha: '15/10/2026', comercio: 'AVIANCA', cuenta: 'Visa Oro', categoria: 'Viaje', nota: 'Boletos a Guatemala', dividir: true, persona: 'Carlos', modo: 'mitades', pctVos: '50', pctOtro: '50', monVos: '', monOtro: '', tocado: {}, enviado: false, guardado: false, paso: 1 };
function con(base, extra) { var r = {}; var k; for (k in base) r[k] = base[k]; for (k in extra) r[k] = extra[k]; return r; }

function calcular(s, opcion, escritorio) {
  var f = {}, t = s.tocado || {}, env = !!s.enviado;
  var c = centavos(s.monto);
  f.monto = s.monto; f.montoTxt = fmt(c); f.montoSin = sinSigno(c);
  f.montoCh = Math.max(4, (s.monto || '').length + 1) + 'ch';
  f.montoErr = c > MAXIMO ? 'El máximo es $21,474,836.47.' : ((c === 0 && (t.monto || env)) ? 'Escribí un monto mayor que $0.00.' : '');
  f.fecha = s.fecha; f.fechaErr = errorFecha(s.fecha, t.fecha, env);
  f.comercio = s.comercio; f.comercioCh = Math.max(6, (s.comercio || '').length + 1) + 'ch';
  f.cuenta = s.cuenta; f.cuentaSub = SUBCUENTA[s.cuenta] || ''; f.nota = s.nota;
  f.categoria = s.categoria; f.categoriaVer = s.categoria || 'Elegí una categoría';
  f.categoriaErr = (!s.categoria && (t.categoria || env)) ? (s.dividir ? 'Elegí la categoría de tu parte.' : 'Elegí una categoría.') : '';
  f.dividir = !!s.dividir; f.noDividir = !s.dividir; f.dividirAria = s.dividir ? 'true' : 'false';
  f.dividirTxt = s.dividir ? 'Lo divido con alguien' : 'Lo pagué solo yo';
  f.perillaX = s.dividir ? '24px' : '4px'; f.switchBg = s.dividir ? 'var(--accion)' : 'var(--borde-control)';
  f.persona = s.persona; f.personaVer = s.persona || 'otra persona'; f.personaNombre = s.persona || 'La otra persona';
  f.personaErr = (s.dividir && !s.persona && (env || t.persona)) ? 'Elegí con quién lo dividís.' : '';
  f.modo = s.modo; f.modoMitades = s.modo === 'mitades'; f.modoPct = s.modo === 'porcentaje'; f.modoMontos = s.modo === 'montos';
  var vos = c, otro = 0, pv = 100, po = 0, err = '';
  if (s.dividir) {
    if (s.modo === 'mitades') { otro = Math.floor(c / 2); vos = c - otro; pv = 50; po = 50; }
    else if (s.modo === 'porcentaje') {
      pv = numero(s.pctVos); po = numero(s.pctOtro);
      vos = Math.round(c * pv / 100); otro = Math.round(c * po / 100);
      var suma = redondo(pv + po);
      if (pv > 100 || po > 100) err = 'Cada parte va de 0 a 100 %.';
      else if (suma > 100) err = 'Suman ' + suma + ' %. Sobran ' + redondo(suma - 100) + ' %.';
      else if (suma < 100 && (t.pct || env)) err = 'Suman ' + suma + ' %. Falta repartir ' + redondo(100 - suma) + ' % (' + fmt(c - vos - otro) + ').';
      if (suma === 100) { otro = Math.round(c * po / 100); vos = c - otro; }
    } else {
      vos = centavos(s.monVos); otro = centavos(s.monOtro);
      pv = c ? redondo(vos * 100 / c) : 0; po = c ? redondo(otro * 100 / c) : 0;
      if (vos + otro > c) err = 'Las partes pasan el total por ' + fmt(vos + otro - c) + '.';
      else if (vos + otro !== c && (t.montos || env)) err = 'Las partes suman ' + fmt(vos + otro) + ' y el total es ' + fmt(c) + '.';
    }
  }
  f.divisionErr = err;
  f.vos = vos; f.otro = otro;
  f.vosMonto = fmt(vos); f.otroMonto = fmt(otro);
  f.pctVos = s.pctVos; f.pctOtro = s.pctOtro; f.monVos = s.monVos; f.monOtro = s.monOtro;
  f.vosPctTxt = redondo(pv) + ' %'; f.otroPctTxt = redondo(po) + ' %';
  f.sliderVal = String(Math.round(pv));
  var bv = c ? Math.max(0, Math.min(100, vos * 100 / c)) : 50, bo = c ? Math.max(0, Math.min(100, otro * 100 / c)) : 50;
  f.barraVos = bv + '%'; f.barraOtro = bo + '%';
  f.falta = fmt(Math.max(0, c - vos - otro)); f.repartidoOk = !err;
  f.repartido = err ? 'Falta repartir ' + f.falta : 'Repartido ' + fmt(vos + otro) + ' de ' + fmt(c);
  var lista = [['Total', f.montoErr, 'monto'], ['Fecha', f.fechaErr, 'fecha'], ['Categoría', f.categoriaErr, 'categoria'], ['Con quién', f.personaErr, 'persona'], ['División', f.divisionErr, 'division']];
  f.errores = [];
  for (var i = 0; i < lista.length; i++) if (lista[i][1]) f.errores.push({ etq: lista[i][0], msg: lista[i][1], ancla: '#' + opcion + '-' + lista[i][2] });
  var n = f.errores.length;
  f.errCount = String(n); f.hayErrores = n > 0;
  var completo = c > 0 && s.fecha && s.fecha.length === 10 && !f.fechaErr && !!s.categoria && (!s.dividir || !!s.persona) && !err;
  f.guardarOk = !!completo; f.guardarNo = !completo;
  f.guardar = 'Guardar ' + fmt(c);
  f.motivo = n ? ('Corregí ' + n + (n === 1 ? ' campo' : ' campos') + ' para guardar.') : (c === 0 ? 'Escribí el monto para guardar.' : (!s.categoria ? 'Elegí una categoría para guardar.' : (s.dividir && !s.persona ? 'Elegí con quién lo dividís.' : (err ? 'Terminá de repartir el total.' : ''))));
  var claves = ['monto', 'fecha', 'categoria', 'persona', 'division'];
  for (var j = 0; j < claves.length; j++) {
    var e = f[claves[j] + 'Err'];
    f[claves[j] + 'C'] = e ? 'var(--problema-borde)' : (opcion === 'D' ? 'var(--accion)' : 'var(--borde-control)');
    f[claves[j] + 'Etq'] = e ? 'var(--problema-texto)' : 'var(--texto-secundario)';
    f[claves[j] + 'W'] = e ? '2px' : '1px';
    f[claves[j] + 'Bg'] = e ? 'var(--problema-fondo)' : 'transparent';
    f[claves[j] + 'Tok'] = e ? 'var(--problema-fondo)' : 'var(--accion-tonal)';
    f[claves[j] + 'Inv'] = e ? 'true' : 'false';
  }
  var modos = [['Mit', f.modoMitades], ['Pct', f.modoPct], ['Mon', f.modoMontos]];
  for (var m = 0; m < modos.length; m++) {
    var on = modos[m][1];
    f['seg' + modos[m][0] + 'Bg'] = on ? 'var(--superficie)' : 'transparent';
    f['seg' + modos[m][0] + 'Sh'] = on ? '0 0 0 1px var(--borde-control), 0 1px 2px rgba(0,0,0,.08)' : 'none';
    f['seg' + modos[m][0] + 'W'] = on ? '700' : '500';
    f['seg' + modos[m][0] + 'Ar'] = on ? 'true' : 'false';
  }
  var gente = ['Carlos', 'Ana'];
  f.gente = gente.map(function (p) { var on = s.persona === p; return { nombre: p, inicial: p[0], aria: on ? 'true' : 'false', borde: on ? '2px solid var(--accion)' : '1px solid var(--borde-sutil)', fondo: on ? 'var(--accion-tonal)' : 'transparent', peso: on ? '700' : '500', avBg: on ? 'var(--accion)' : 'var(--superficie-hundida)', avTx: on ? 'var(--texto-sobre-accion)' : 'var(--texto)' }; });
  f.presets = ['25', '50', '75'].map(function (p) { var on = s.modo !== 'montos' && String(Math.round(pv)) === p && !(s.modo === 'porcentaje' && redondo(pv + po) !== 100); return { txt: p + ' %', val: p, aria: on ? 'true' : 'false', borde: on ? '2px solid var(--accion)' : '1px solid var(--borde-sutil)', fondo: on ? 'var(--accion-tonal)' : 'transparent', peso: on ? '700' : '500' }; });
  f.esEscritorio = !!escritorio; f.esTelefono = !escritorio;
  f.paso = s.paso || 1;
  f.p1 = escritorio || f.paso === 1; f.p2 = escritorio || f.paso === 2; f.p3 = escritorio || f.paso === 3;
  var pasos = [['1', 'Monto'], ['2', 'Detalle'], ['3', 'Dividir']];
  f.pasos = pasos.map(function (p, k) { var on = f.paso === k + 1, hecho = f.paso > k + 1; return { num: p[0], txt: p[1], aria: on ? 'step' : 'false', bg: on ? 'var(--accion)' : (hecho ? 'var(--accion-tonal)' : 'var(--superficie-hundida)'), tx: on ? 'var(--texto-sobre-accion)' : (hecho ? 'var(--accion)' : 'var(--texto-secundario)'), peso: on ? '700' : '500' }; });
  f.siguiente1 = c > 0 ? 'Siguiente' : 'Escribí el monto';
  f.soloAria = s.dividir ? 'false' : 'true'; f.soloBorde = s.dividir ? '1px solid var(--borde-sutil)' : '2px solid var(--accion)'; f.soloFondo = s.dividir ? 'var(--superficie)' : 'var(--accion-tonal)';
  f.conBorde = s.dividir ? '2px solid var(--accion)' : '1px solid var(--borde-sutil)'; f.conFondo = s.dividir ? 'var(--accion-tonal)' : 'var(--superficie)';
  f.teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'].map(function (k) { return { txt: k, etq: k === '⌫' ? 'Borrar' : k }; });
  f.guardado = !!s.guardado; f.noGuardado = !s.guardado;
  f.resultado = 'Guardado: ' + (s.comercio || 'Gasto') + ' · ' + fmt(c) + ' · ' + s.cuenta + (s.dividir && s.persona ? ' · ' + s.persona + ' te debe ' + fmt(otro) : '');
  return f;
}
