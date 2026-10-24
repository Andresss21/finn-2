// tools/plan/verificar.ts — verificación del plan de la Fase 8 (V8-01, V8-03).
// TypeScript sin dependencias; Node 24 lo ejecuta sin compilar (eliminación de tipos).
// Uso:
//   node tools/plan/verificar.ts --plan docs/08-tareas.md --objetivos plan/objetivos.txt --docs docs [--parte B] [--negativo]
// Sale con 1 si encuentra errores (o, con --negativo, si alguna mutación no se detecta).
//
// Reglas:
//   E1 tarea u orden duplicados · E2 dependencia inexistente · E3 TU inexistente · E4 ciclo · E5 dependencia posterior
//   E6 tamaño (DT-01) y excepciones aprobadas (DT-15) · E7 hito alcanzable · E8 objetivo sin dueño, con varios o desconocido
//   E9 PRU inexistente en 07 o nueva mal formada (DT-17) · E10 campos inválidos · E11 catálogo incompleto frente a los documentos
//   [C] E7-pruebas y E7-fichas: un hito con `pruebas:` o `fichas:` no se alcanza sin la tarea dueña de cada prueba exigida
//   (las listadas, más los ESC @motor e @int y los CB de sus fichas) y de cada CA de sus fichas (DT-25).
//   [D] Un hito con `hitos:` incluye lo que requieren esos hitos y va después de ellos (E7-hitos).
//   [D] E12 pendientes de punta a punta (DT-27): cada `pendiente: CA>FT` tiene su E2E (`e2e:`) en la última tarea de FT,
//   que depende de la dueña del CA; un hito con `sin_pendientes: si` no se alcanza sin esas E2E, salvo las de fichas [P].
//   [F8] E13 operaciones de los escenarios (P8-20): la dueña de cada operación que un ESC necesita (OP-nn@dom para @motor,
//   OP-nn para @int) va antes que la tarea del escenario y está entre sus dependencias.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

type Tarea = {
  id: string; orden: number; bloque: string; hito: string; depende: string[]; tu: string[];
  revision: string; paralelo: string; tamano: Record<string, number>; cubre: string[]; pru: string[];
  compartido: string[]; excepcion: string; fichas: string[]; pendiente: string[]; e2e: string[];
};
type Hito = { id: string; despues: string; requiere: string[]; tu: string[]; fichas: string[]; pruebas: string[]; hitos: string[]; sinPendientes: boolean };
type Plan = { tareas: Tarea[]; hitos: Hito[]; hitosSinBloque: string[]; tus: string[]; chTexto: string };
type Objetivo = { id: string; parte: string; fuente: string };
type Hallazgo = { codigo: string; detalle: string };
type Docs = {
  prusDefinidos: Set<string>; manuales: Set<string>; niveles: Set<string>; areas: Set<string>;
  derivados: { id: string; fuente: string }[];
  fichas: Map<string, { ca: string[]; esc: string[]; cb: string[]; pri: string }>;
  escOps: Map<string, { ops: string[]; texto: string }>;
};

const LIMITES: Record<string, number> = { prod: 400, archivos: 12, ca: 10, migraciones: 1, total: 1200 };
const REVISION = new Set(['obligatoria', 'normal']);
// Excepciones de tamaño aprobadas en el plan (DT-15). Cambiar esta tabla es una tarea de revisión obligatoria.
const EXCEPCIONES: Record<string, { tareas: string[]; medida: string; maximo: number }> = {
  'DT-15': { tareas: ['TA-051'], medida: 'migraciones', maximo: 8 },
};
// Identificadores de 07 que son ejemplos de formato o nombres retirados (07 §13.4, DP-35): no son objetivos.
const PRU_NO_OBJETIVO = new Set(['PRU-CMP-TARJ-002', 'PRU-CMP-TARJ-003', 'PRU-DOM-TARJ-003', 'PRU-E2E-INICIO-008', 'PRU-E2E-PRES-012',
  'PRU-E2E-TARJ-002', 'PRU-E2E-TARJ-003', 'PRU-INT-TARJ-003', 'PRU-INT-TARJ-004', 'PRU-RH-TARJ-003', 'PRU-SEG-MAN-001', 'PRU-MAN-SEG-001']);

function argumento(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function lista(valor: string | undefined): string[] {
  if (!valor) return [];
  const v = valor.trim();
  if (v === '' || v === '—' || v === '-') return [];
  return v.split(',').map((s) => s.trim()).filter((s) => s !== '');
}

function bloques(texto: string, tipo: string): { titulo: string; cuerpo: string }[] {
  const salida: { titulo: string; cuerpo: string }[] = [];
  const re = new RegExp('^#{3,4} ([A-Z]{2}-\\d+)[^\\n]*\\n([\\s\\S]*?)(?=^#{2,4} |(?![\\s\\S]))', 'gm');
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const b = new RegExp('```' + tipo + '\\n([\\s\\S]*?)```').exec(m[2] as string);
    if (b) salida.push({ titulo: m[1] as string, cuerpo: b[1] as string });
  }
  return salida;
}

function campos(cuerpo: string): Record<string, string> {
  const r: Record<string, string> = {};
  for (const linea of cuerpo.split('\n')) {
    const i = linea.indexOf(':');
    if (i > 0) r[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return r;
}

export function leerPlan(texto: string): Plan {
  const tareas: Tarea[] = bloques(texto, 'tarea').map(({ titulo, cuerpo }) => {
    const c = campos(cuerpo);
    const tamano: Record<string, number> = {};
    for (const par of (c['tamano'] ?? '').split(/\s+/)) {
      const [k, v] = par.split('=');
      if (k && v !== undefined) tamano[k] = Number(v);
    }
    return {
      id: titulo, orden: Number(c['orden']), bloque: c['bloque'] ?? '', hito: c['hito'] ?? '',
      depende: lista(c['depende']), tu: lista(c['tu']), revision: c['revision'] ?? '',
      paralelo: c['paralelo'] ?? '', tamano, cubre: lista(c['cubre']), pru: lista(c['pru']),
      compartido: lista(c['compartido']).map((s) => s.split(' ')[0] as string), excepcion: c['excepcion'] ?? '',
      fichas: lista(c['fichas']), pendiente: lista(c['pendiente']), e2e: lista(c['e2e']),
    };
  });
  const hitos: Hito[] = bloques(texto, 'hito').map(({ titulo, cuerpo }) => {
    const c = campos(cuerpo);
    return { id: titulo, despues: c['despues'] ?? '', requiere: lista(c['requiere']), tu: lista(c['tu']), fichas: lista(c['fichas']), pruebas: lista(c['pruebas']), hitos: lista(c['hitos']), sinPendientes: (c['sin_pendientes'] ?? '') === 'si' };
  });
  const todosHitos = [...texto.matchAll(/^### (HT-\d+)/gm)].map((m) => m[1] as string);
  const conBloque = new Set(hitos.map((h) => h.id));
  const tus = [...texto.matchAll(/^### (TU-\d+)/gm)].map((m) => m[1] as string);
  const ch = /## 7\. Cambios propuestos[\s\S]*?(?=\n## \d)/.exec(texto);
  return { tareas, hitos, hitosSinBloque: todosHitos.filter((h) => !conBloque.has(h)), tus, chTexto: ch ? ch[0] : '' };
}

export function leerObjetivos(texto: string): Objetivo[] {
  return texto.split('\n').filter((l) => /^[A-Z]/.test(l)).map((l) => {
    const [id, parte, ...resto] = l.split(' | ').map((s) => s.trim());
    return { id: id as string, parte: parte as string, fuente: resto.join(' | ') };
  });
}

function seccion(texto: string, desde: string, hasta: string): string {
  const i = texto.indexOf(desde);
  if (i < 0) throw new Error(`No encuentro "${desde}"`);
  const j = texto.indexOf(hasta, i + desde.length);
  return texto.slice(i, j < 0 ? undefined : j);
}

// Lee los documentos aprobados y deriva los objetivos que el catálogo debe contener (E11) y los PRU definidos (E9).
export function leerDocs(dir: string): Docs {
  const d01 = readFileSync(join(dir, '01-dominio.md'), 'utf8');
  const d04 = readFileSync(join(dir, '04-backend.md'), 'utf8');
  const d06 = readFileSync(join(dir, '06-features.md'), 'utf8');
  const d07 = readFileSync(join(dir, '07-pruebas.md'), 'utf8');
  const d05 = readFileSync(join(dir, '05-frontend.md'), 'utf8');
  const prusDefinidos = new Set([...d07.matchAll(/PRU-[A-Z0-9]+-[A-Z0-9]+-\d{3}/g)].map((m) => m[0]));
  const manuales = new Set([...d07.matchAll(/^\| (PRU-MAN-[A-Z]+-\d{3})\b/gm)].map((m) => m[1] as string));
  const niveles = new Set([...seccion(d07, '### 1.1 Niveles', '### 1.2').matchAll(/^\| [^|]+ \| `([A-Z0-9]+)` \|/gm)].map((m) => m[1] as string));
  const areas = new Set([...seccion(d07, '### 2.2 Áreas', '### 2.3').matchAll(/^\| `([A-Z]+)` \|/gm)].map((m) => m[1] as string));
  const derivados: { id: string; fuente: string }[] = [];
  const agregar = (id: string, fuente: string): void => { derivados.push({ id, fuente }); };
  for (const m of d04.matchAll(/^#### (OP-\d+)/gm)) { agregar(m[1] as string, '04 §3'); agregar(`${m[1]}@dom`, '04 §2.4'); }
  for (const m of d04.matchAll(/^\| (OPT-\d+) \|/gm)) agregar(m[1] as string, '04 §3.10');
  for (const m of d01.matchAll(/^#### (ESC-\d+)/gm)) { agregar(`${m[1]}@motor`, '01 §8'); agregar(`${m[1]}@int`, '01 §8'); }
  for (const m of seccion(d01, '## 6. Invariantes', '## 7.').matchAll(/^(\d+)\. /gm)) agregar(`INV-${String(m[1]).padStart(2, '0')}`, '01 §6');
  for (const m of d01.matchAll(/^\| (CB-\d+) \|/gm)) agregar(m[1] as string, '01 §9');
  for (const m of d01.matchAll(/^\| (AV-\d+) \|/gm)) agregar(m[1] as string, '01 §5.0.7');
  for (const m of seccion(d06, '## 2. Fichas', '## 4. Recorridos').matchAll(/^- \*\*(CA-\d+\.\d+)\b/gm)) agregar(m[1] as string, '06 §2');
  const t63 = seccion(d06, '### 6.3 Consultas', '### 6.4');
  for (const m of t63.matchAll(/^\| `(\w+)\(\)` \|/gm)) agregar(`Q-${m[1]}`, '06 §6.3');
  for (const m of t63.matchAll(/^\| `reporte\('(\w+)'\)` \|/gm)) agregar(`REP-${m[1]}`, '06 §6.3');
  for (const m of t63.matchAll(/^\| `formulario\('(\w+)'\)` \|/gm)) agregar(`FORM-${m[1]}`, '06 §6.3');
  for (const m of seccion(d06, '### 6.4 Rutas', '### 6.5').matchAll(/^\| `(\/[^`]*)` \|/gm)) agregar(`RUTA-${m[1]}`, '06 §6.4');
  for (const p of prusDefinidos) if (!PRU_NO_OBJETIVO.has(p)) agregar(p, '07');
  // [C] Registro FE de 05; FE-22 es la lista L1 a L19 de la Parte A
  for (const m of d05.matchAll(/^\| (FE-\d+)[^|]*\| [^|]+\| [^|]+\|/gm)) if (m[1] !== 'FE-22') agregar(m[1] as string, '05 §0.10');
  // [C] Por ficha: sus CA, sus ESC (06 §6.5) y los CB que cita su texto
  const fichas = new Map<string, { ca: string[]; esc: string[]; cb: string[]; pri: string }>();
  const pri = new Map([...d06.matchAll(/^\| (FT-\d+)[^|]*\|[^|]*\| (I|M|P|—) \|/gm)].map((x) => [x[1] as string, x[2] as string]));
  for (const m of d06.matchAll(/^#### (FT-\d+) [\s\S]*?(?=^#### FT-|^## |^### \d|(?![\s\S]))/gm)) {
    const txt = m[0];
    fichas.set(m[1] as string, { ca: [...txt.matchAll(/^- \*\*(CA-\d+\.\d+)/gm)].map((x) => x[1] as string), esc: [], cb: [...new Set([...txt.matchAll(/CB-\d+/g)].map((x) => x[0]))], pri: pri.get(m[1] as string) ?? '' });
  }
  for (const linea of seccion(d06, '### 6.5 Escenarios', '### 6.6').split('\n')) {
    const celdas = linea.replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
    for (let i = 0; i + 1 < celdas.length; i += 2) {
      if (!/^ESC-\d+$/.test(celdas[i] as string)) continue;
      for (const f of (celdas[i + 1] as string).match(/FT-\d+/g) ?? []) fichas.get(f)?.esc.push(celdas[i] as string);
    }
  }
  const unicos = new Map(derivados.map((d) => [d.id, d]));
  const dirEsc = argumento('--escenarios');
  const escOps = dirEsc ? opsDeArchivos(dirEsc) : opsDeEscenarios(d01);
  return { prusDefinidos, manuales, niveles, areas, derivados: [...unicos.values()], fichas, escOps };
}

// ── [F8] E13: operaciones que necesita cada escenario (P8-20) ───────────────
// Sin archivos de datos (antes de TA-130), las deriva del texto de 01 §8: el encabezado del escenario (historial, estado
// inicial, "continúa"), el paso 0 y la columna Operación de cada paso. Con `--escenarios <dir>` (en el repositorio, desde
// TA-130) las lee de los archivos `esc-nn.ts`: cada `op: 'OP-nn'` de `estadoInicial` y de `pasos`.
const OPS_ESC: [RegExp, string][] = [
  [/\bcrear (ahorro|t\b|u\b|cuenta|tarjeta|la tarjeta|el préstamo|préstamo)|\bcon deuda\b|saldo inicial|\bapertura\b|préstamo en curso/, 'OP-01'],
  [/archivar (la )?cuenta|cuenta archivada/, 'OP-04'],
  [/eliminar (la )?(cuenta|tarjeta|[tu]\b)/, 'OP-06'],
  [/crear (el )?(grupo|categoría)|categoría nueva|nueva categoría/, 'OP-07'],
  [/\brenombrar (?!deudor)|mover de grupo/, 'OP-08'],
  [/\barchivar (?!(la )?cuenta)|\barchivad[ao] (?!.*cuenta)/, 'OP-09'],
  [/desarchivar/, 'OP-10'],
  [/\bsacar\b/, 'OP-11'],
  [/fusion/, 'OP-12'],
  [/eliminar (la )?(categoría|grupo)/, 'OP-13'],
  [/(?<!auto-)\basign(ar|ado|ación|a)\b(?! rápida)|desasignar/, 'OP-14'],
  [/\bmover \d|mover (dinero|de|desde)|\bmueve\b/, 'OP-15'],
  [/asignación rápida/, 'OP-16'],
  [/auto-asignar/, 'OP-17'],
  [/\bmetas?\b/, 'OP-18'],
  [/cambi(o|ar) (de|el) ciclo|nuevo ciclo|día de inicio/, 'OP-19'],
  [/\bcompra\b|\bgasto\b|\bdébito\b|intereses|comisión/, 'OP-20'],
  [/\bingreso\b/, 'OP-21'],
  [/transferencia (?!de deuda)/, 'OP-22'],
  [/\bpag(o|a|ar)( de| a| con)? [tu]\b|\bpagar [\d,]+|pagar (la )?tarjeta|pago de [\d,]+ (a|en) [tu]\b|pago excedente/, 'OP-23'],
  [/\bcuota\b|abon(o|ar) a capital/, 'OP-24'],
  [/inversión|\baport(e|ar)\b/, 'OP-25'],
  [/desembolso/, 'OP-26'],
  [/cashback|\bavance\b|transferencia de deuda/, 'OP-27'],
  [/\beditar (la |el )?(compra|transacción|gasto|ingreso|fecha|monto|línea|[a-d]\b)|cambiar (la |el )?(fecha|categoría|monto|cuenta) de/, 'OP-28'],
  [/eliminar (la |el )?(compra|transacción|gasto|ingreso)/, 'OP-29'],
  [/estado bancario/, 'OP-30'],
  [/\bcobr(o|a|ar)\b|deposita/, 'OP-31'],
  [/condon/, 'OP-32'],
  [/devoluci|devolver (?!la reserva)|devuelve/, 'OP-33'],
  [/eliminar (el |un )?(evento|cobro)/, 'OP-34'],
  [/renombrar deudor/, 'OP-52'],
  [/\bsms\b/, 'OP-35'],
  [/aprobar todos/, 'OP-38'],
  [/\baproba?r?\b|\bapruebo\b|\baprueba\b|aprobad[ao]/, 'OP-37'],
  [/descartar|restaurar/, 'OP-39'],
  [/coincidencia|posible duplicado/, 'OP-40'],
  [/\bregla\b/, 'OP-41'],
  [/programada/, 'OP-42'],
  [/ocurrencia|registro automático/, 'OP-43'],
  [/\bomitir\b/, 'OP-44'],
  [/concilia/, 'OP-45,OP-46,OP-47'],
  [/verificar (el )?saldo|verificación de saldo/, 'OP-53'],
  [/condiciones del préstamo|modelo de (préstamo|banco)|interés [\d,]+, seguro/, 'OP-48'],
  [/t en finn: |todas en super/, 'OP-20'],
];

export function opsDeEscenarios(d01: string): Map<string, { ops: string[]; texto: string }> {
  const r = new Map<string, { ops: string[]; texto: string }>();
  const seccion8 = d01.slice(d01.indexOf('## 8. Escenarios'));
  for (const m of seccion8.matchAll(/^#### (ESC-\d+)[^\n]*\n([\s\S]*?)(?=^#### ESC-|^### |^## |(?![\s\S]))/gm)) {
    const partes: string[] = [];
    let col = 2;
    for (const linea of (m[2] as string).split('\n')) {
      if (!linea.startsWith('|')) { partes.push(linea); continue; }
      const c = linea.split('|').map((x) => x.trim());
      if (c[1] === '#') { const i = c.indexOf('Operación'); col = i > 0 ? i : 2; continue; }
      if (/^\d+[a-z′']?$/.test(c[1] ?? '')) partes.push(c[col] ?? '');
    }
    const texto = partes.join(' \n ').toLowerCase();
    // 01 §8.0: las cuentas (Ahorro, T, U) y las categorías de los escenarios existen siempre: OP-01 y OP-07 en todos.
    const ops = ['OP-01', 'OP-07', ...OPS_ESC.filter(([re]) => re.test(texto)).flatMap(([, op]) => op.split(','))];
    r.set(m[1] as string, { ops: [...new Set(ops)], texto });
  }
  for (const [id, v] of r) {
    const c = /contin[úu]a (?:el |de |desde )?(ESC-\d+)/i.exec(v.texto);
    if (c) for (const op of r.get((c[1] as string).toUpperCase())?.ops ?? []) if (!v.ops.includes(op)) v.ops.push(op);
    r.set(id, v);
  }
  return r;
}

export function opsDeArchivos(dir: string): Map<string, { ops: string[]; texto: string }> {
  const r = new Map<string, { ops: string[]; texto: string }>();
  for (const n of readdirSync(dir)) {
    const m = /^esc-(\d+)\.ts$/.exec(n);
    if (!m) continue;
    const texto = readFileSync(join(dir, n), 'utf8');
    r.set(`ESC-${m[1]}`, { ops: [...new Set([...texto.matchAll(/op:\s*'(OP-\d+)'/g)].map((x) => x[1] as string))], texto: '' });
  }
  return r;
}

export function verificar(plan: Plan, objetivos: Objetivo[], docs: Docs, parte: string): Hallazgo[] {
  const h: Hallazgo[] = [];
  const porId = new Map<string, Tarea>();
  const ordenes = new Map<number, string>();
  for (const t of plan.tareas) {
    if (porId.has(t.id)) h.push({ codigo: 'E1-duplicada', detalle: t.id });
    porId.set(t.id, t);
    if (!Number.isInteger(t.orden)) h.push({ codigo: 'E1-orden', detalle: `${t.id} sin orden válido` });
    else if (ordenes.has(t.orden)) h.push({ codigo: 'E1-orden', detalle: `${t.id} y ${ordenes.get(t.orden)} con orden ${t.orden}` });
    else ordenes.set(t.orden, t.id);
    if (!REVISION.has(t.revision)) h.push({ codigo: 'E10-revision', detalle: `${t.id}: ${t.revision}` });
    if (!/^(no|libre|con TA-\d{3}(, ?TA-\d{3})*)$/.test(t.paralelo)) h.push({ codigo: 'E10-paralelo', detalle: `${t.id}: ${t.paralelo}` });
  }
  const tus = new Set(plan.tus);
  for (const t of plan.tareas) {
    for (const d of t.depende) {
      const dep = porId.get(d);
      if (!dep) { h.push({ codigo: 'E2-dependencia-inexistente', detalle: `${t.id} → ${d}` }); continue; }
      if (!(dep.orden < t.orden)) h.push({ codigo: 'E5-dependencia-posterior', detalle: `${t.id} (orden ${t.orden}) depende de ${d} (orden ${dep.orden})` });
    }
    for (const u of t.tu) if (!tus.has(u)) h.push({ codigo: 'E3-tu-inexistente', detalle: `${t.id} → ${u}` });
    // E6: tamaño, con las excepciones aprobadas
    let exc: { medida: string; maximo: number } | undefined;
    if (t.excepcion !== '') {
      const m = /^(DT-\d+) (\w+)=(\d+)$/.exec(t.excepcion);
      const aprobada = m ? EXCEPCIONES[m[1] as string] : undefined;
      if (!m || !aprobada || !aprobada.tareas.includes(t.id) || aprobada.medida !== m[2] || Number(m[3]) > aprobada.maximo) {
        h.push({ codigo: 'E6-excepcion', detalle: `${t.id}: "${t.excepcion}" no es una excepción aprobada para esta tarea` });
      } else exc = { medida: aprobada.medida, maximo: aprobada.maximo };
    }
    for (const [k, lim] of Object.entries(LIMITES)) {
      const v = t.tamano[k];
      const tope = exc && exc.medida === k ? exc.maximo : lim;
      if (v === undefined || Number.isNaN(v)) h.push({ codigo: 'E6-tamano-falta', detalle: `${t.id}: ${k}` });
      else if (v > tope) h.push({ codigo: 'E6-tamano', detalle: `${t.id}: ${k}=${v} > ${tope}` });
    }
    const cas = t.cubre.filter((c) => /^CA-\d+\.\d+$/.test(c)).length;
    if (cas > (t.tamano['ca'] ?? 0)) h.push({ codigo: 'E6-ca-declarados', detalle: `${t.id}: cubre ${cas} CA y declara ${t.tamano['ca']}` });
  }
  // E4: ciclos
  const estado = new Map<string, number>();
  const visitar = (id: string, camino: string[]): void => {
    const e = estado.get(id);
    if (e === 1) { h.push({ codigo: 'E4-ciclo', detalle: [...camino, id].join(' → ') }); return; }
    if (e === 2) return;
    estado.set(id, 1);
    for (const d of porId.get(id)?.depende ?? []) if (porId.has(d)) visitar(d, [...camino, id]);
    estado.set(id, 2);
  };
  for (const t of plan.tareas) visitar(t.id, []);
  // Dueños de cada objetivo (E7-pruebas y E8). Los PRU se poseen con el campo `pru`; el resto, con `cubre`.
  const duenos = new Map<string, string[]>();
  for (const t of plan.tareas) for (const c of [...t.cubre, ...t.pru]) duenos.set(c, [...(duenos.get(c) ?? []), t.id]);
  // E7: hitos alcanzables. Todo lo que el hito requiere, y sus dependencias transitivas, va antes de `despues`;
  // las TU del hito incluyen las de sus tareas etiquetadas.
  for (const hi of plan.hitos) {
    const ultima = porId.get(hi.despues);
    if (!ultima) { h.push({ codigo: 'E7-hito', detalle: `${hi.id}: despues ${hi.despues} no existe` }); continue; }
    if (!hi.requiere.includes(hi.despues)) h.push({ codigo: 'E7-hito', detalle: `${hi.id}: requiere no incluye ${hi.despues}` });
    // [C] Pruebas exigidas por el hito (DT-25): las listadas y, por cada ficha, sus ESC en los dos ejecutores y sus CB.
    const exigidas = new Set<string>(hi.pruebas);
    for (const f of hi.fichas) {
      const fi = docs.fichas.get(f);
      if (!fi) { h.push({ codigo: 'E7-fichas', detalle: `${hi.id}: ${f} no es una ficha de 06` }); continue; }
      for (const e of fi.esc) { exigidas.add(`${e}@motor`); exigidas.add(`${e}@int`); }
      for (const c of fi.cb) exigidas.add(c);
    }
    const duenasDePruebas = new Set<string>();
    for (const o of exigidas) for (const d of duenos.get(o) ?? []) duenasDePruebas.add(d);
    const pendientes = [...hi.requiere];
    const encadenados: string[] = [];
    const porExpandir = [...hi.hitos];
    while (porExpandir.length) { const x = porExpandir.shift() as string; if (encadenados.includes(x)) continue; encadenados.push(x); porExpandir.push(...(plan.hitos.find((y) => y.id === x)?.hitos ?? [])); }
    for (const otro of encadenados) {
      const ho = plan.hitos.find((x) => x.id === otro);
      if (!ho) { h.push({ codigo: 'E7-hitos', detalle: `${hi.id}: ${otro} no tiene bloque` }); continue; }
      pendientes.push(...ho.requiere);
      const uo = porId.get(ho.despues);
      if (uo && !(uo.orden < ultima.orden)) h.push({ codigo: 'E7-hitos', detalle: `${hi.id} (después de ${hi.despues}) no va después de ${otro} (${ho.despues})` });
    }
    const vistos = new Set<string>();
    while (pendientes.length > 0) {
      const id = pendientes.pop() as string;
      if (vistos.has(id)) continue;
      vistos.add(id);
      const t = porId.get(id);
      if (!t) { h.push({ codigo: 'E7-hito', detalle: `${hi.id}: requiere ${id}, que no existe` }); continue; }
      if (t.orden > ultima.orden) h.push({ codigo: 'E7-hito', detalle: `${hi.id}: ${id} (orden ${t.orden}) va después de ${hi.despues} (orden ${ultima.orden})` });
      pendientes.push(...t.depende);
    }
    for (const o of exigidas) {
      const d = duenos.get(o) ?? [];
      if (d.length === 0) h.push({ codigo: 'E7-pruebas', detalle: `${hi.id}: ${o} no tiene tarea dueña` });
      else if (!d.some((x) => vistos.has(x))) h.push({ codigo: 'E7-pruebas', detalle: `${hi.id}: exige ${o} y su dueña ${d.join(', ')} no está en requiere ni en sus dependencias` });
    }
    for (const f of hi.fichas) for (const ca of docs.fichas.get(f)?.ca ?? []) {
      const d = duenos.get(ca) ?? [];
      if (!d.some((x) => vistos.has(x))) h.push({ codigo: 'E7-fichas', detalle: `${hi.id}: ${ca} de ${f} sin su tarea en requiere (${d.join(', ') || 'sin dueña'})` });
    }
    if (hi.sinPendientes) for (const t of plan.tareas) for (const p of t.pendiente) {
      const [ca, ft] = p.split('>') as [string, string];
      if (docs.fichas.get(ft)?.pri === 'P') continue;
      const cierra = plan.tareas.filter((x) => x.e2e.includes(ca));
      if (!cierra.some((x) => vistos.has(x.id))) h.push({ codigo: 'E12-pendiente-en-hito', detalle: `${hi.id}: ${ca} sigue pendiente de punta a punta (${ft}); su E2E no está en requiere` });
    }
    for (const t of plan.tareas) if (t.hito === hi.id && !hi.requiere.includes(t.id)) h.push({ codigo: 'E7-hito', detalle: `${t.id} dice ${hi.id} y el hito no la requiere` });
    // Una tarea de otro hito solo puede estar en requiere si es dueña de una prueba exigida (DT-25).
    for (const id of hi.requiere) { const t = porId.get(id); if (t && t.hito !== hi.id && !duenasDePruebas.has(id)) h.push({ codigo: 'E7-hito', detalle: `${hi.id} requiere ${id}, que dice hito ${t.hito}` }); }
    for (const u of hi.tu) if (!tus.has(u)) h.push({ codigo: 'E7-hito', detalle: `${hi.id}: ${u} no existe` });
    for (const t of plan.tareas) if (t.hito === hi.id) for (const u of t.tu) if (!hi.tu.includes(u)) h.push({ codigo: 'E7-hito-tu', detalle: `${hi.id}: ${t.id} necesita ${u} y el hito no la lista` });
  }
  // E12: pendientes de punta a punta (DT-27)
  const cierre = (id: string): Set<string> => { const v = new Set<string>(); const p = [id]; while (p.length) { const x = p.pop() as string; if (v.has(x)) continue; v.add(x); p.push(...(porId.get(x)?.depende ?? [])); } return v; };
  const pendientesDe = new Map<string, string>();
  for (const t of plan.tareas) for (const p of t.pendiente) {
    const [ca, ft] = p.split('>') as [string, string];
    if (!t.cubre.includes(ca)) h.push({ codigo: 'E12-pendiente', detalle: `${t.id}: ${ca} no está en su cubre` });
    if (!docs.fichas.has(ft)) { h.push({ codigo: 'E12-pendiente', detalle: `${t.id}: ${ft} no es una ficha` }); continue; }
    pendientesDe.set(ca, ft);
    const deFicha = plan.tareas.filter((x) => x.fichas.includes(ft));
    if (deFicha.length === 0) { h.push({ codigo: 'E12-sin-e2e', detalle: `${ca}: ${ft} no tiene tareas en el plan` }); continue; }
    const ultimaF = deFicha.reduce((a, b) => (b.orden > a.orden ? b : a));
    if (!ultimaF.e2e.includes(ca)) h.push({ codigo: 'E12-sin-e2e', detalle: `${ca} (pendiente en ${t.id}) no tiene su E2E en ${ultimaF.id}, la última tarea de ${ft}` });
    else if (!cierre(ultimaF.id).has(t.id)) h.push({ codigo: 'E12-sin-e2e', detalle: `${ultimaF.id} completa ${ca} sin depender de ${t.id}` });
  }
  for (const t of plan.tareas) for (const ca of t.e2e) if (!t.fichas.includes(pendientesDe.get(ca) ?? '')) h.push({ codigo: 'E12-e2e-huerfana', detalle: `${t.id}: e2e ${ca} sin un pendiente hacia sus fichas` });
  // E13: operaciones de los escenarios (P8-20)
  const duenoUnico = (o: string): Tarea | undefined => { const d = duenos.get(o); return d && d.length === 1 ? porId.get(d[0] as string) : undefined; };
  for (const [esc, { ops }] of docs.escOps) {
    for (const [sufijo, sufOp] of [['@motor', '@dom'], ['@int', '']] as const) {
      const te = duenoUnico(esc + sufijo);
      if (!te) continue;
      const alcance = cierre(te.id);
      for (const op of ops) {
        const to = duenoUnico(op + sufOp);
        if (!to) continue;
        if (to.orden > te.orden) h.push({ codigo: 'E13-escenario-orden', detalle: `${esc}${sufijo} (${te.id}, orden ${te.orden}) necesita ${op}${sufOp}, cuya dueña ${to.id} va después (orden ${to.orden})` });
        else if (!alcance.has(to.id)) h.push({ codigo: 'E13-escenario-dependencia', detalle: `${esc}${sufijo} (${te.id}) necesita ${op}${sufOp} y no depende de ${to.id}` });
      }
    }
  }
  // E8: cobertura de objetivos de la parte (dueño único).
  const delAlcance = objetivos.filter((o) => parte === 'todas' || o.parte <= parte);
  const conocidos = new Set(objetivos.map((o) => o.id));
  for (const o of delAlcance) {
    const d = duenos.get(o.id) ?? [];
    if (d.length === 0) h.push({ codigo: 'E8-sin-tarea', detalle: `${o.id} (${o.fuente})` });
    if (d.length > 1) h.push({ codigo: 'E8-varios-duenos', detalle: `${o.id}: ${d.join(', ')}` });
  }
  for (const t of plan.tareas) for (const c of t.cubre) if (!conocidos.has(c)) h.push({ codigo: 'E8-objetivo-desconocido', detalle: `${c} en ${t.id}` });
  for (const t of plan.tareas) for (const c of t.compartido) if (!conocidos.has(c)) h.push({ codigo: 'E8-compartido', detalle: `${t.id}: ${c}` });
  // E9: identificadores PRU (existentes en 07, citados por un CH, o nuevos según DT-17)
  for (const t of plan.tareas) for (const p of t.pru) {
    if (p.startsWith('PRU-MAN-')) {
      if (!docs.manuales.has(p) && !plan.chTexto.includes(p)) h.push({ codigo: 'E9-pru-inexistente', detalle: `${t.id}: ${p}` });
      continue;
    }
    if (docs.prusDefinidos.has(p) || plan.chTexto.includes(p)) continue;
    const m = /^PRU-([A-Z0-9]+)-([A-Z]+)-(\d{3})$/.exec(p);
    if (!m) { h.push({ codigo: 'E9-pru-mal-formado', detalle: `${t.id}: ${p}` }); continue; }
    if (Number(m[3]) < 101) h.push({ codigo: 'E9-pru-inexistente', detalle: `${t.id}: ${p} no está en 07 y una prueba nueva empieza en 101 (DT-17)` });
    if (!docs.niveles.has(m[1] as string)) h.push({ codigo: 'E9-pru-nivel', detalle: `${t.id}: ${p} (nivel ${m[1]} no está en 07 §1.1)` });
    if (!docs.areas.has(m[2] as string)) h.push({ codigo: 'E9-pru-area', detalle: `${t.id}: ${p} (área ${m[2]} no está en 07 §2.2)` });
  }
  // E11: el catálogo contiene todo lo que derivan los documentos
  for (const d of docs.derivados) if (!conocidos.has(d.id)) h.push({ codigo: 'E11-catalogo-incompleto', detalle: `${d.id} (${d.fuente}) no está en el catálogo` });
  return h;
}

// ── Control negativo ────────────────────────────────────────────────────────
function clonar<T>(p: T): T { return JSON.parse(JSON.stringify(p)) as T; }
type Mutacion = { nombre: string; espera: string; aplicar: (p: Plan, o: Objetivo[], d: Docs) => void };
const tarea = (p: Plan, id: string): Tarea => p.tareas.find((t) => t.id === id) as Tarea;
const MUTACIONES: Mutacion[] = [
  { nombre: 'quitar el dueño de un objetivo', espera: 'E8-sin-tarea', aplicar: (p) => { const t = tarea(p, 'TA-114'); t.cubre = t.cubre.filter((c) => c !== 'OP-03@dom'); } },
  { nombre: 'ciclo entre dos tareas', espera: 'E4-ciclo', aplicar: (p) => { tarea(p, 'TA-100').depende.push('TA-103'); } },
  { nombre: 'dependencia de una tarea posterior', espera: 'E5-dependencia-posterior', aplicar: (p) => { tarea(p, 'TA-150').depende.push('TA-199'); } },
  { nombre: 'tarea demasiado grande', espera: 'E6-tamano', aplicar: (p) => { tarea(p, 'TA-153').tamano['prod'] = 401; } },
  { nombre: 'hito que requiere una tarea posterior', espera: 'E7-hito', aplicar: (p) => { const hi = p.hitos.find((x) => x.id === 'HT-1') as Hito; hi.despues = 'TA-055'; } },
  { nombre: 'tarea duplicada', espera: 'E1-duplicada', aplicar: (p) => { p.tareas.push(clonar(tarea(p, 'TA-001'))); } },
  { nombre: 'dependencia inexistente', espera: 'E2-dependencia-inexistente', aplicar: (p) => { tarea(p, 'TA-002').depende.push('TA-999'); } },
  { nombre: 'PRU que no existe en 07', espera: 'E9-pru-inexistente', aplicar: (p) => { tarea(p, 'TA-009').pru.push('PRU-SEG-OPER-099'); } },
  { nombre: 'objetivo con dos dueños', espera: 'E8-varios-duenos', aplicar: (p) => { tarea(p, 'TA-001').cubre.push('L20'); } },
  { nombre: 'TU inexistente', espera: 'E3-tu-inexistente', aplicar: (p) => { tarea(p, 'TA-001').tu.push('TU-77'); } },
  { nombre: 'excepción de tamaño en otra tarea', espera: 'E6-excepcion', aplicar: (p) => { const t = tarea(p, 'TA-053'); t.excepcion = 'DT-15 migraciones=8'; t.tamano['migraciones'] = 2; } },
  { nombre: 'PRU nueva con un área que 07 no tiene', espera: 'E9-pru-area', aplicar: (p) => { tarea(p, 'TA-100').pru.push('PRU-DOM-DINERO-101'); } },
  { nombre: 'catálogo sin un CA de 06', espera: 'E11-catalogo-incompleto', aplicar: (_p, o) => { const i = o.findIndex((x) => x.id === 'CA-30.4'); o.splice(i, 1); } },
  { nombre: 'PRU de 07 de la parte sin dueño', espera: 'E8-sin-tarea', aplicar: (p) => { const t = tarea(p, 'TA-151'); t.pru = t.pru.filter((x) => x !== 'PRU-INT-VAL-003'); } },
  { nombre: 'TU de una tarea etiquetada que el hito no lista', espera: 'E7-hito-tu', aplicar: (p) => { tarea(p, 'TA-055').tu.push('TU-13'); } },
  // [C] Condición de HT-6 (DT-25) y Parte C
  { nombre: 'HT-6 sin un lote de ESC@int que tocan sus fichas', espera: 'E7-pruebas', aplicar: (p) => { const hi = p.hitos.find((x) => x.id === 'HT-6') as Hito; hi.requiere = hi.requiere.filter((x) => x !== 'TA-191'); } },
  { nombre: 'HT-6 sin el diferencial contra el oráculo', espera: 'E7-pruebas', aplicar: (p) => { const hi = p.hitos.find((x) => x.id === 'HT-6') as Hito; hi.requiere = hi.requiere.filter((x) => x !== 'TA-112'); } },
  { nombre: 'HT-6 sin la tarea de un trozo de una ficha', espera: 'E7-fichas', aplicar: (p) => { const hi = p.hitos.find((x) => x.id === 'HT-6') as Hito; hi.requiere = hi.requiere.filter((x) => x !== 'TA-301'); } },
  { nombre: 'HT-6 que requiere una tarea de otro hito sin ser dueña de una prueba exigida', espera: 'E7-hito', aplicar: (p) => { (p.hitos.find((x) => x.id === 'HT-6') as Hito).requiere.push('TA-302'); } },
  { nombre: 'ficha de HT-6 cuyo CA queda sin dueño', espera: 'E8-sin-tarea', aplicar: (p) => { const t = tarea(p, 'TA-289'); t.cubre = t.cubre.filter((c) => c !== 'CA-10.1'); } },
  // [D] Pendientes de punta a punta (DT-27) y hitos encadenados
  { nombre: 'pendiente sin su E2E en la ficha que lo completa', espera: 'E12-sin-e2e', aplicar: (p) => { for (const t of p.tareas) t.e2e = t.e2e.filter((c) => c !== 'CA-08.8'); } },
  { nombre: 'HT-8 sin la tarea que cierra un pendiente', espera: 'E12-pendiente-en-hito', aplicar: (p) => { const hi = p.hitos.find((x) => x.id === 'HT-8') as Hito; const t = p.tareas.find((x) => x.e2e.includes('CA-08.8')) as Tarea; hi.requiere = hi.requiere.filter((x) => x !== t.id); for (const o of p.tareas) o.depende = o.depende.filter((d) => d !== t.id); } },
  { nombre: 'TA-139 a la segunda ola sin cambiar las dependencias del escenario (el error de P8-20)', espera: 'E13-escenario-orden', aplicar: (p) => { tarea(p, 'TA-139').orden = 640; tarea(p, 'TA-134').depende = tarea(p, 'TA-134').depende.filter((d) => d !== 'TA-139'); for (const t of p.tareas) if (t.depende.includes('TA-139') && t.orden < 640) t.depende = t.depende.filter((d) => d !== 'TA-139'); } },
  { nombre: 'HT-9 que no va después de HT-8', espera: 'E7-hitos', aplicar: (p) => { const hi = p.hitos.find((x) => x.id === 'HT-9') as Hito; const h8 = p.hitos.find((x) => x.id === 'HT-8') as Hito; const t = tarea(p, hi.despues); t.orden = (tarea(p, h8.despues).orden) - 0.5; } },
];

function principal(): void {
  const plan = leerPlan(readFileSync(argumento('--plan') ?? 'docs/08-tareas.md', 'utf8'));
  const objetivos = leerObjetivos(readFileSync(argumento('--objetivos') ?? 'plan/objetivos.txt', 'utf8'));
  const docs = leerDocs(argumento('--docs') ?? 'docs');
  const parte = argumento('--parte') ?? 'todas';
  if (process.argv.includes('--escenarios-ops')) { for (const [e, v] of docs.escOps) console.log(`${e}: ${v.ops.join(', ')}`); process.exit(0); }
  const base = verificar(plan, objetivos, docs, parte);
  const alcance = objetivos.filter((o) => parte === 'todas' || o.parte <= parte);
  const cuenta = (re: RegExp): number => alcance.filter((o) => re.test(o.id)).length;
  console.log(`Plan: ${plan.tareas.length} tareas, ${plan.hitos.length} hitos con bloque, ${plan.tus.length} TU; alcance: parte ${parte}; ${alcance.length} objetivos de ${objetivos.length} en el catálogo.`);
  console.log(`Documentos: ${docs.derivados.length} objetivos derivados (CA ${docs.derivados.filter((d) => d.id.startsWith('CA-')).length}, OP ${docs.derivados.filter((d) => /^OP-\d+$/.test(d.id)).length}, OPT ${docs.derivados.filter((d) => d.id.startsWith('OPT-')).length}, ESC ${docs.derivados.filter((d) => d.id.endsWith('@motor')).length}, INV ${docs.derivados.filter((d) => d.id.startsWith('INV-')).length}, CB ${docs.derivados.filter((d) => d.id.startsWith('CB-')).length}, AV ${docs.derivados.filter((d) => d.id.startsWith('AV-')).length}, consultas ${docs.derivados.filter((d) => d.id.startsWith('Q-')).length}, reportes ${docs.derivados.filter((d) => d.id.startsWith('REP-')).length}, formularios ${docs.derivados.filter((d) => d.id.startsWith('FORM-')).length}, rutas ${docs.derivados.filter((d) => d.id.startsWith('RUTA-')).length}, PRU ${docs.derivados.filter((d) => d.id.startsWith('PRU-')).length}); niveles ${docs.niveles.size}, áreas ${docs.areas.size}.`);
  console.log(`En el alcance: PRU ${cuenta(/^PRU-/)}, OP ${cuenta(/^OP-\d+$/)}, ESC ${cuenta(/@(motor|int)$/)}, INV ${cuenta(/^INV-/)}, CB ${cuenta(/^CB-/)}, AV ${cuenta(/^AV-/)}, migraciones ${cuenta(/^MIG-/)}, CA ${cuenta(/^CA-/)}.`);
  const prus = plan.tareas.flatMap((t) => t.pru);
  const de07 = prus.filter((p) => (p.startsWith('PRU-MAN-') ? docs.manuales.has(p) : docs.prusDefinidos.has(p)));
  const porCh = prus.filter((p) => !de07.includes(p) && plan.chTexto.includes(p));
  console.log(`PRU en el plan (V8-03): ${prus.length}; ${de07.length} definidos en 07, ${porCh.length} por un CH (${porCh.join(', ') || '—'}), ${prus.length - de07.length - porCh.length} nuevos (DT-17).`);
  if (plan.hitosSinBloque.length > 0) console.log(`Aviso: hitos sin bloque (se completan en partes siguientes): ${plan.hitosSinBloque.join(', ')}`);
  for (const x of base) console.log(`ERROR ${x.codigo}: ${x.detalle}`);
  let fallo = base.length > 0;
  if (process.argv.includes('--negativo')) {
    if (base.length > 0) { console.log('Control negativo omitido: el plan base tiene errores.'); process.exit(1); }
    let detectadas = 0;
    for (const m of MUTACIONES) {
      const p = clonar(plan); const o = clonar(objetivos); const d = docs;
      m.aplicar(p, o, d);
      const r = verificar(p, o, d, parte);
      const ok = r.some((x) => x.codigo === m.espera);
      if (ok) detectadas++;
      console.log(`${ok ? 'detectada' : 'NO DETECTADA'}: ${m.nombre} → ${ok ? m.espera : r.map((x) => x.codigo).join(', ') || 'sin hallazgos'}`);
    }
    console.log(`Control negativo: ${detectadas} de ${MUTACIONES.length} mutaciones detectadas.`);
    if (detectadas !== MUTACIONES.length) fallo = true;
  }
  console.log(fallo ? 'RESULTADO: FALLA' : 'RESULTADO: PASA');
  process.exit(fallo ? 1 : 0);
}

principal();
