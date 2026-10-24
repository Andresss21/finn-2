// Ejecución común de un escenario (prototipo de V7-08): resuelve la cadena "continúa", corre los pasos con un ejecutor
// (`motor` o `int`), corre las filas de contraste en una rama y compara cada fila con lo observado.
import { usd, type Escenario, type Espera, type Paso } from './tipos';
import type { Observado } from './motor';
export interface Ejecutor<S> { nombre: 'motor' | 'int'; iniciar(e: Escenario, hoy: string): Promise<S>; bifurcar(s: S): Promise<S>;
  paso(s: S, p: Paso): Promise<Observado>; terminar(s: S): Promise<void> }
// Avisos que se emiten antes o después de confirmar una operación (01 §5.0.7); los de estado salen de la lectura
const DE_OPERACION = new Set(['AV-01','AV-10','AV-11','AV-12','AV-13','AV-15','AV-16','AV-18','AV-19','AV-21','AV-22','AV-24']);
export interface Fila { escenario: string; paso: string; fallos: string[]; omitidos: string[] }
export function cadena(id: string, todos: Map<string, Escenario>): { e: Escenario; hasta?: string }[] {
  const e = todos.get(id); if (!e) throw new Error(`no existe ${id}`);
  if (!e.continua) return [{ e }];
  const previo = cadena(e.continua.escenario, todos);
  previo[previo.length - 1].hasta = e.continua.hastaPaso;
  return [...previo, { e }];
}
export function comparar(esp: Espera, obs: Observado, dentro: Set<string>): { fallos: string[]; omitidos: string[] } {
  const f: string[] = [], o: string[] = obs.omitidos.filter(x => x !== 'avisos-operacion' && x !== 'desglose');
  const ig = (n: string, a: number | undefined, b: number) => { if (a !== undefined && usd(a) !== b) f.push(`${n}: se esperaba ${a}, se obtuvo ${b / 100}`); };
  ig('Ef', esp.ef, obs.ef); ig('LPA', esp.lpa, obs.lpa); ig('SobTA', esp.sobta, obs.sobta);
  if (esp.fut !== undefined) ig('fut', esp.fut, obs.fut);
  if (esp.disp) for (const [c, v] of Object.entries(obs.disp)) ig(`Disp(${c})`, esp.disp[c] ?? 0, v);
  for (const c of Object.keys(esp.disp ?? {})) if (!(c in obs.disp)) f.push(`Disp(${c}): la categoría no existe`);
  for (const [t, [d, s, re]] of Object.entries(esp.tarjetas ?? {})) { const x = obs.tarjetas[t]; ig(`deuda(${t})`, d, x[0]); ig(`S(${t})`, s, x[1]); ig(`RE(${t})`, re, x[2]); }
  for (const a of esp.avisos ?? []) if (!obs.avisos.includes(a)) (DE_OPERACION.has(a) && obs.omitidos.includes('avisos-operacion') ? o : f).push(`aviso ${a} ausente`);
  if (esp.desglose) { if (!obs.desglose) o.push('desglose (de la operación)'); else for (const [k, v] of Object.entries(esp.desglose)) ig(`desglose.${k}`, v, obs.desglose[k]); }
  if (esp.rechazo) o.push('rechazo');
  // Identidad de saldo (inv. 1) en cada fila, aunque la tabla no la escriba: LPA + ΣD + fut + SobTA = Ef
  const sd = Object.values(obs.disp).reduce((a, b) => a + b, 0);
  if (obs.lpa + sd + obs.fut + obs.sobta !== obs.ef) f.push(`identidad: ${obs.lpa} + ${sd} + ${obs.fut} + ${obs.sobta} ≠ ${obs.ef}`);
  void dentro; return { fallos: f, omitidos: o };
}
export async function correr<S>(id: string, todos: Map<string, Escenario>, ej: Ejecutor<S>): Promise<Fila[]> {
  const eslabones = cadena(id, todos);
  const raiz = eslabones[0].e; const hoy0 = raiz.hoy ?? '2027-02-10';
  let s = await ej.iniciar(raiz, hoy0); const filas: Fila[] = []; const ramas: S[] = [];
  try {
    for (const { e, hasta } of eslabones) {
      const propio = e.id === id; let ultimo: S | null = null; let antes: S | null = null;
      for (const p of e.pasos) {
        if (p.alternativaDe) {                                  // fila de contraste: desde el estado anterior a la fila que reemplaza
          if (!antes) throw new Error(`${e.id} ${p.n}: falta el estado previo`);
          const r = await ej.bifurcar(antes); ramas.push(r); const obs = await ej.paso(r, p);
          if (propio) filas.push({ escenario: e.id, paso: p.n, ...comparar(p.espera, obs, new Set()) }); continue;
        }
        // solo se bifurca antes de una fila que tiene contraste (clonar una base cuesta ~90 ms)
        if (e.pasos.some(q => q.alternativaDe === p.n)) { antes = await ej.bifurcar(s); ramas.push(antes); }
        const obs = await ej.paso(s, p); ultimo = s;
        if (propio) filas.push({ escenario: e.id, paso: p.n, ...comparar(p.espera, obs, new Set()) });
        else { const c = comparar(p.espera, obs, new Set()); if (c.fallos.length) throw new Error(`la base ${e.id} paso ${p.n} no coincide: ${c.fallos.join('; ')}`); }
        if (!propio && p.n === hasta) break;
      }
      void ultimo;
    }
  } finally { for (const r of ramas) await ej.terminar(r); await ej.terminar(s); }
  return filas;
}
