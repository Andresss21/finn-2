// Prototipo de @finn/sms (§8.3): puro, sin Date ni reloj.
export type FormatoFecha = 'AAAA/MM/DD' | 'AAAAMMDD' | 'AAAA-MM-DD' | 'DD/MM/AAAA';
export interface Formato {
  id: string; nombre: string; tipoMovimiento: 'compra' | 'deposito' | 'pago_tarjeta' | 'devolucion';
  patron: string; banderas: string; montoSeparadorMiles: ',' | '.' | ''; montoSeparadorDecimal: '.' | ',';
  formatosFecha: FormatoFecha[]; activo: boolean;
}
export interface Campos { ultimos4: string; monto: number; comercio: string | null; fecha: string | null }
export type Interpretacion =
  | { resultado: 'reconocido'; formatoId: string; tipoMovimiento: Formato['tipoMovimiento']; campos: Campos; coincidentes: string[] }
  | { resultado: 'no_reconocido'; coincidentes: string[]; motivo: 'ninguno' | 'varios' };

const diasDelMes = (a: number, m: number) => [31, (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
const pad = (n: number, w: number) => String(n).padStart(w, '0');
export function normalizarFecha(texto: string, formatos: FormatoFecha[]): string | null {
  const ex: Record<FormatoFecha, RegExp> = {
    'AAAA/MM/DD': /^(\d{4})\/(\d{2})\/(\d{2})$/, 'AAAAMMDD': /^(\d{4})(\d{2})(\d{2})$/,
    'AAAA-MM-DD': /^(\d{4})-(\d{2})-(\d{2})$/, 'DD/MM/AAAA': /^(\d{2})\/(\d{2})\/(\d{4})$/,
  };
  for (const f of formatos) {
    const m = ex[f].exec(texto); if (!m) continue;
    const [a, me, d] = f === 'DD/MM/AAAA' ? [+m[3], +m[2], +m[1]] : [+m[1], +m[2], +m[3]];
    if (a < 2000 || a > 2099 || me < 1 || me > 12 || d < 1 || d > diasDelMes(a, me)) continue;
    return `${pad(a, 4)}-${pad(me, 2)}-${pad(d, 2)}`;
  }
  return null;
}
export function normalizarMonto(texto: string, miles: string, decimal: string): number | null {
  let t = texto.trim();
  if (miles) t = t.split(miles).join('');
  if (decimal !== '.') t = t.split(decimal).join('.');
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t);
  if (!m) return null;
  const entero = m[1].replace(/^0+(?=\d)/, '');
  if (entero.length > 8) return null;                         // > $21,474,836.47 no cabe en integer (13.3)
  const centavos = Number(entero) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return centavos > 0 && centavos <= 2147483647 ? centavos : null;
}
export const normalizarComercio = (t: string | undefined) => {
  if (t === undefined) return null; const s = t.trim().replace(/\s+/g, ' '); return s === '' ? null : s;
};
function aplicar(texto: string, f: Formato): Campos | null {
  const m = new RegExp(f.patron, f.banderas).exec(texto);
  if (!m || !m.groups) return null;
  const g = m.groups;
  if (!/^\d{4}$/.test(g.ultimos4 ?? '')) return null;
  const monto = normalizarMonto(g.monto ?? '', f.montoSeparadorMiles, f.montoSeparadorDecimal);
  if (monto === null) return null;
  let fecha: string | null = null;
  if (g.fecha !== undefined) { fecha = normalizarFecha(g.fecha, f.formatosFecha); if (fecha === null) return null; }
  return { ultimos4: g.ultimos4, monto, comercio: normalizarComercio(g.comercio), fecha };
}
export function interpretar(texto: string, formatos: Formato[]): Interpretacion {
  const ok = formatos.filter(f => f.activo).map(f => ({ f, c: aplicar(texto, f) })).filter(x => x.c !== null);
  const ids = ok.map(x => x.f.id);
  if (ok.length === 1) return { resultado: 'reconocido', formatoId: ok[0].f.id, tipoMovimiento: ok[0].f.tipoMovimiento, campos: ok[0].c!, coincidentes: ids };
  return { resultado: 'no_reconocido', coincidentes: ids, motivo: ok.length === 0 ? 'ninguno' : 'varios' };
}
