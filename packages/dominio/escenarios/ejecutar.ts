// Ejecución común de un escenario (07 §12.3; portado del prototipo de V7-08): resuelve la cadena "continúa", corre los
// pasos con un ejecutor (`motor` o `int`), corre las filas de contraste en una rama y compara cada fila con lo observado.
import { type Escenario, type Espera, type Observado, type Paso, usd } from './tipos';

export interface Ejecutor<S> {
  nombre: 'motor' | 'int';
  iniciar(e: Escenario, hoy: string): Promise<S>;
  bifurcar(s: S): Promise<S>;
  paso(s: S, p: Paso): Promise<Observado>;
  terminar(s: S): Promise<void>;
}
export interface Fila {
  escenario: string;
  paso: string;
  fallos: string[];
  omitidos: string[];
}

/**
 * Consultas de `espera.extra` que evalúa `int` con las operaciones y lecturas reales (regla 10). La llena la tarea de
 * `int`: mientras esté vacío, una consulta que `motor` no evalúa hace fallar el escenario en vez de omitirse.
 */
export const EVALUA_INT: ReadonlySet<string> = new Set<string>();

/** El escenario `id` precedido por los de su cadena "continúa", cada uno con el paso hasta el que se corre. */
export function cadena(
  id: string,
  todos: Map<string, Escenario>,
): { e: Escenario; hasta?: string }[] {
  const e = todos.get(id);
  if (!e) throw new Error(`no existe ${id}`);
  if (!e.continua) return [{ e }];
  const previo = cadena(e.continua.escenario, todos);
  const ultimo = previo[previo.length - 1] as { e: Escenario; hasta?: string };
  ultimo.hasta = e.continua.hastaPaso;
  return [...previo, { e }];
}

/**
 * Compara una fila con lo observado. Reglas 1 a 3, 7, 8, 9 y 10 de 07 §12.3. `otro` son las consultas que evalúa el otro
 * ejecutor: una `extra` que este no evalúa queda omitida solo si el otro sí la evalúa; si ninguno, es un fallo.
 */
export function comparar(
  esp: Espera,
  obs: Observado,
  otro: ReadonlySet<string> = EVALUA_INT,
): { fallos: string[]; omitidos: string[] } {
  const f: string[] = [];
  const o: string[] = [];
  const ig = (n: string, a: number | undefined, b: number) => {
    if (a !== undefined && usd(a) !== b) f.push(`${n}: se esperaba ${a}, se obtuvo ${b / 100}`);
  };
  // Regla 7: el rechazo con su código, y la instantánea completa igual a la anterior.
  if (esp.rechazo !== undefined) {
    if (obs.rechazo !== esp.rechazo)
      f.push(`rechazo: se esperaba ${esp.rechazo}, se obtuvo ${obs.rechazo ?? 'ninguno'}`);
    else if (obs.intacto === false) f.push('rechazo: la instantánea cambió');
  } else if (obs.rechazo !== undefined) f.push(`rechazo inesperado: ${obs.rechazo}`);
  // Regla 1: las columnas Ef, LPA, Disponibles, SobTA y Tarjeta se comparan siempre que la fila las trae.
  ig('Ef', esp.ef, obs.ef);
  ig('LPA', esp.lpa, obs.lpa);
  ig('SobTA', esp.sobta, obs.sobta);
  ig('fut', esp.fut, obs.fut);
  // Regla 2: las categorías listadas con su valor; las no listadas deben valer 0.
  if (esp.disp) {
    for (const [c, v] of Object.entries(obs.disp)) ig(`Disp(${c})`, esp.disp[c] ?? 0, v);
    for (const c of Object.keys(esp.disp))
      if (!(c in obs.disp)) f.push(`Disp(${c}): la categoría no existe`);
  }
  for (const [t, [d, s, re]] of Object.entries(esp.tarjetas ?? {})) {
    const x = obs.tarjetas[t];
    if (!x) {
      f.push(`tarjeta ${t}: no existe`);
      continue;
    }
    ig(`deuda(${t})`, d, x[0]);
    ig(`S(${t})`, s, x[1]);
    ig(`RE(${t})`, re, x[2]);
  }
  // Regla 8 (DP-14): los avisos listados son un mínimo.
  for (const a of esp.avisos ?? []) if (!obs.avisos.includes(a)) f.push(`aviso ${a} ausente`);
  // Reglas 9 y 10: columnas fuera de la instantánea; nada se omite en silencio.
  for (const [k, v] of Object.entries(esp.extra ?? {})) {
    const x = obs.extra[k];
    if (x !== undefined) ig(k, v, x);
    else if (otro.has(k.split(':')[0] as string)) o.push(`${k}: la evalúa el otro ejecutor`);
    else f.push(`${k}: ningún ejecutor la evalúa`);
  }
  // Regla 3: identidad de saldo (inv. 1) en cada fila, aunque la tabla no la escriba: LPA + ΣD + fut + SobTA = Ef.
  const sd = Object.values(obs.disp).reduce((a, b) => a + b, 0);
  if (obs.lpa + sd + obs.fut + obs.sobta !== obs.ef)
    f.push(`identidad: ${obs.lpa} + ${sd} + ${obs.fut} + ${obs.sobta} ≠ ${obs.ef}`);
  return { fallos: f, omitidos: o };
}

/**
 * Corre el escenario `id` (con su cadena) y devuelve una fila por paso propio. Regla 4: los pasos de la base se comparan y,
 * si no coinciden, falla con el identificador de la base. Regla 5: una alternativa corre en una rama desde el estado anterior
 * al paso que reemplaza; sus filas siguientes (`rama`) continúan en esa rama y nunca tocan la línea principal.
 */
export async function correr<S>(
  id: string,
  todos: Map<string, Escenario>,
  ej: Ejecutor<S>,
): Promise<Fila[]> {
  const eslabones = cadena(id, todos);
  const raiz = (eslabones[0] as { e: Escenario }).e;
  const s: S = await ej.iniciar(raiz, raiz.hoy ?? '2027-02-10');
  const filas: Fila[] = [];
  const abiertos: S[] = [s];
  try {
    for (const { e, hasta } of eslabones) {
      const propio = e.id === id;
      const antes = new Map<string, S>();
      const ramas = new Map<string, S>();
      let alcanzado = hasta === undefined;
      for (const p of e.pasos) {
        const lateral = p.alternativaDe !== undefined || p.rama !== undefined;
        if (lateral && !propio) continue; // de la base solo cuenta la línea principal
        let destino = s;
        if (p.alternativaDe !== undefined) {
          const previo = antes.get(p.alternativaDe);
          if (!previo)
            throw new Error(`${e.id} ${p.n}: falta el estado previo al paso ${p.alternativaDe}`);
          destino = await ej.bifurcar(previo);
          abiertos.push(destino);
          ramas.set(p.n, destino);
        } else if (p.rama !== undefined) {
          const rama = ramas.get(p.rama);
          if (!rama) throw new Error(`${e.id} ${p.n}: no existe la rama ${p.rama}`);
          destino = rama;
        } else if (e.pasos.some((q) => q.alternativaDe === p.n)) {
          // solo se bifurca antes de una fila que tiene contraste (clonar una base cuesta)
          const copia = await ej.bifurcar(s);
          abiertos.push(copia);
          antes.set(p.n, copia);
        }
        const c = comparar(p.espera, await ej.paso(destino, p));
        if (propio) filas.push({ escenario: e.id, paso: p.n, ...c });
        else if (c.fallos.length)
          throw new Error(`la base ${e.id} paso ${p.n} no coincide: ${c.fallos.join('; ')}`);
        if (!propio && p.n === hasta) {
          alcanzado = true;
          break;
        }
      }
      if (!alcanzado) throw new Error(`la base ${e.id} no tiene el paso ${hasta}`);
    }
  } finally {
    for (const r of abiertos) await ej.terminar(r);
  }
  return filas;
}
