// Ejecutor `motor` de los escenarios (prototipo de V7-08): aplica cada operación a los hechos y llama a calcular().
// En la Fase 8 esto es `aplicar(hechos, op)` de @finn/dominio; aquí, sobre el núcleo de V7-03.
import { calcular, inicio, pago, type Hechos, type Instantanea } from '../dominio/nucleo';
import { PERIODOS, usd, type Escenario, type Op, type Paso } from './tipos';
export interface Estado { hechos: Hechos; refs: Map<string, string>; reloj: number; cortes: Record<string, number> }
export interface Observado { ef: number; lpa: number; disp: Record<string, number>; fut: number; sobta: number;
  tarjetas: Record<string, [number, number, number]>; avisos: string[]; desglose?: Record<string, number>; omitidos: string[] }
const instante = (s: string) => Date.parse(s + ':00-06:00');
export function sembrar(e: Escenario, hoy: string): Estado {
  const tarjetas = Object.fromEntries((e.cuentas?.tarjetas ?? []).map(t => [t.nombre, 0]));
  const cortes = Object.fromEntries((e.cuentas?.tarjetas ?? []).map(t => [t.nombre, t.diaCorte ?? 15]));
  return { hechos: { hoy, efectivo: Object.fromEntries((e.cuentas?.efectivo ?? ['Ahorro']).map(c => [c, 0])), tarjetas,
    categorias: e.categorias ?? [], ingresos: [], gastos: [], pagos: [], asig: [], devoluciones: [] }, refs: new Map(), reloj: 0, cortes };
}
const clonar = (s: Estado): Estado => ({ hechos: structuredClone(s.hechos), refs: new Map(s.refs), reloj: s.reloj, cortes: s.cortes });
// Hora de registro por defecto: hoy a las 12:00 más un minuto por operación, para que el orden de registro se conserve.
function registro(s: Estado, op: { registrado?: string }) { s.reloj++; return op.registrado ? instante(op.registrado) : instante(s.hechos.hoy + 'T12:00') + s.reloj * 60000; }
function desglose(h: Hechos, t: string, f: string, corte: number) {
  const [a, m, d] = f.split('-').map(Number);
  const c0 = d > corte ? `${a}-${String(m).padStart(2, '0')}-${String(corte).padStart(2, '0')}` : m > 1 ? `${a}-${String(m - 1).padStart(2, '0')}-${String(corte).padStart(2, '0')}` : `${a - 1}-12-${corte}`;
  const cargos = (hasta: (x: string) => boolean) => h.gastos.filter(g => g.cuenta === t && hasta(g.fecha)).reduce((s, g) => s + g.lineas.reduce((u, l) => u + l[1], 0), 0);
  const pagos = (hasta: (x: string) => boolean) => h.pagos.filter(p => p[1] === t && hasta(p[2])).reduce((s, p) => s + p[3], 0);
  const deudaAnterior = Math.max(0, h.tarjetas[t] + cargos(x => x <= c0) - pagos(x => x <= c0));
  const enCiclo = (x: string) => x > c0 && x <= f;
  return { deudaAnterior, cargosCiclo: cargos(enCiclo), yaPagado: pagos(enCiclo) };
}
export function aplicar(s: Estado, op: Op, avisos: string[], extra: Record<string, number>) {
  const h = s.hechos, A = inicio(h.hoy);
  const cerrado = (f: string) => inicio(f) < A;
  switch (op.op) {
    case 'ingreso': { const f = op.fecha ?? h.hoy; registro(s, op); h.ingresos.push(['Ahorro', f, usd(op.monto)]); if (cerrado(f)) avisos.push('AV-01'); break; }
    case 'asignar': { const p = op.periodo ? PERIODOS[op.periodo] : A; h.asig.push([op.categoria, p, usd(op.monto)]); break; }
    case 'compra': { const f = op.fecha ?? h.hoy; const id = 'g' + h.gastos.length; s.refs.set(op.ref, id);
      h.gastos.push({ id, cuenta: op.cuenta, fecha: f, clave: registro(s, op), lineas: op.lineas.map(([c, m]) => [c, usd(m)]) }); if (cerrado(f)) avisos.push('AV-01'); break; }
    case 'pagar': { const f = op.fecha ?? h.hoy; const antes = calcular(h);
      const reservado = Math.max(0, antes.celdas.get(pago(op.tarjeta) + '|' + inicio(f))?.disp ?? 0);
      if (usd(op.monto) > reservado) avisos.push('AV-10');                                   // OP-23, antes de confirmar
      Object.assign(extra, desglose(h, op.tarjeta, f, s.cortes[op.tarjeta]));
      registro(s, op); h.pagos.push(['Ahorro', op.tarjeta, f, usd(op.monto)]);
      const despues = desglose(h, op.tarjeta, f, s.cortes[op.tarjeta]);
      extra.paraNoGenerarIntereses = Math.max(0, despues.deudaAnterior - despues.yaPagado); break; }
    case 'cambiarCuenta': { const g = h.gastos.find(x => x.id === s.refs.get(op.ref))!; g.cuenta = op.cuenta; if (cerrado(g.fecha)) avisos.push('AV-01'); break; }
  }
}
// Avisos de estado derivados de la instantánea (01 §5.0.7): los que el núcleo puede evaluar.
function avisosDeEstado(i: Instantanea, h: Hechos): string[] {
  const r: string[] = [];
  for (const c of h.categorias) { const k = i.celdas.get(c + '|' + i.A)!; if (k.sobd > 0) r.push('AV-02'); if (k.sobt > 0) r.push('AV-03'); }
  for (const t of Object.keys(h.tarjetas)) { if (i.celdas.get(pago(t) + '|' + i.A)!.e > 0) r.push('AV-04'); if (i.S[t] > 0) r.push('AV-07'); if (i.RE[t] > 0) r.push('AV-08'); }
  if (i.lpa < 0) r.push('AV-20');
  return r;
}
export function observar(s: Estado, avisos: string[], extra: Record<string, number>): Observado {
  const i = calcular(s.hechos);
  const tarjetas: Observado['tarjetas'] = {}; for (const t of Object.keys(s.hechos.tarjetas)) tarjetas[t] = [i.deuda[t], i.S[t], i.RE[t]];
  return { ef: i.efectivo, lpa: i.lpa, disp: i.disp, fut: i.fut, sobta: i.sobta, tarjetas, avisos: [...new Set([...avisos, ...avisosDeEstado(i, s.hechos)])],
    desglose: Object.keys(extra).length ? extra : undefined, omitidos: [] };
}
export const ejecutorMotor = {
  nombre: 'motor' as const,
  async iniciar(e: Escenario, hoy: string) { return sembrar(e, hoy); },
  async bifurcar(s: Estado) { return clonar(s); },
  async paso(s: Estado, p: Paso) {
    if (p.hoy) s.hechos.hoy = p.hoy;
    const avisos: string[] = [], extra: Record<string, number> = {};
    for (const op of p.ops) aplicar(s, op, avisos, extra);
    return observar(s, avisos, extra);
  },
  async terminar() {},
};
