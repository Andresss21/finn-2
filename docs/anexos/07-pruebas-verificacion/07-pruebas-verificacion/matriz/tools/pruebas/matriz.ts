// Matriz de trazabilidad de la Fase 7 (prototipo de V7-09). Node 24 ejecuta este archivo sin compilar (type stripping):
// solo sintaxis borrable, sin enums ni dependencias.
//   node tools/pruebas/matriz.ts verificar [--json]      reglas M1–M12; sale con 1 si alguna falla (job `rapido`)
//   node tools/pruebas/matriz.ts ft FT-30                 pruebas, archivos y comandos de una feature
//   node tools/pruebas/matriz.ts afectadas <archivo>...   filtro -g de Playwright y -t de Vitest para los archivos cambiados
//   node tools/pruebas/matriz.ts informe                  cobertura por feature y estado de la puerta (P7-8)
// Entradas (rutas relativas a la raíz; cambiables con FINN_MATRIZ_*): docs/01-dominio.md, docs/06-features.md,
// docs/04-backend.md, docs/05-frontend.md, pruebas/inventario.json, pruebas/manuales.md, pruebas/verificaciones-previas.json,
// pruebas/cuarentena.json, pruebas/mapa-codigo.json.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

export interface Objetivo { id: string; tipo: 'CA' | 'ESC' | 'AV' | 'INV' | 'CB' | 'REC' | 'VER'; ft?: string; prioridad?: 'I' | 'M' | 'P';
  manual?: boolean; advertencia?: boolean; s61?: boolean; diferida?: boolean; fts?: string[] }
export interface Ficha { ft: string; prioridad: 'I' | 'M' | 'P'; diferida: boolean; esc: string[]; av: string[] }
export type EstadoFt = 'pendiente' | 'en_curso' | 'terminada';
export interface Prueba { id: string; nivel: string; area: string; refs: string[]; titulo: string; archivo: string }
export interface Manual { id: string; refs: string[]; pasos: boolean; resultado: boolean; disparador: boolean }
export interface Entradas { d01: string; d06: string; d04: string; d05: string; inventario: { titulo: string; archivo: string }[];
  manuales: string; previas: { id: string; destino?: string; motivo?: string }[]; cuarentena: { id: string; motivo: string; desde: string; vence: string }[];
  mapa: { patron: string; fts: string[] | 'marco' }[]; hoy: string; codigo: string[]; features: Record<string, EstadoFt>; puerta: boolean;
  resultadosManuales: string; resultados?: Record<string, 'pasada' | 'fallida' | 'omitida'> }

export const NIVELES = ['DOM', 'ESC', 'PROP', 'CTR', 'INT', 'ESQ', 'RH', 'CMP', 'E2E', 'REN', 'SEG', 'SW', 'RES', 'MAN'];
export const AREAS = ['ACCESO', 'INICIO', 'PRES', 'CATEG', 'META', 'TX', 'DEV', 'TARJ', 'BAND', 'PROG', 'CONC', 'COBRO', 'CTA', 'REP', 'NOTIF', 'AJUS', 'PWA', 'MOTOR', 'VAL', 'RELOJ', 'POOL', 'ESQ', 'RESP', 'OPER'];
// Dónde puede vivir cada nivel (§2.3): una prueba en el archivo equivocado es un error de la matriz
const ARCHIVO_DE: Record<string, RegExp> = {
  DOM: /\.test\.ts$/, PROP: /\.prop\.test\.ts$/, CTR: /\.ctr\.test\.ts$/, INT: /\.int\.test\.ts$/, ESQ: /(\.int\.test\.ts|tools\/db\/)/,
  RH: /\.rh\.test\.ts$/, CMP: /\.cmp\.test\.tsx$/, E2E: /\.e2e\.ts$/, SW: /\/sw\/.*\.e2e\.ts$/, REN: /(\.bench\.ts|\/rendimiento\/.*\.e2e\.ts)$/,
  RES: /tools\/respaldo\/test\//, SEG: /./, ESC: /escenarios\//,
};
const TITULO = /^(PRU-(?:ESC-\d{2}@(?:motor|int)|([A-Z0-9]+)-([A-Z]+)-(\d{3})))(?:\s+\[([^\]]*)\])?\s+(.+)$/;
// Referencias válidas dentro de los corchetes; las decisiones de 00 y 01 (P1, H3, C1, Q2a…) se aceptan como contexto
const REF = /^(CA-\d{2}\.\d{1,2}|ESC-\d{2}|AV-\d{2}|INV-\d{2}|CB-\d{2}|REC-4\.[1-6]|V-\d{2}|V5-\d{2}|V6-\d{2}|H-\d{2}|CF-\d{2}|FT-\d{2})$/;
const DECISION = /^([A-Z]{1,2}\d{1,2}[a-z]?|[A-Z]-\d{1,2}|supuesto \d+|ajuste \d|error \d+|inv\. \d+|fila \d+|R\d+)$/;

// ---------------------------------------------------------------- objetivos
export function fichas(d06: string): Ficha[] {
  const cuerpo = d06.split('## 2. Fichas por feature')[1].split('## 4. Recorridos')[0];
  return cuerpo.split(/^#### /m).slice(1).flatMap(b => { const m = b.match(/^(FT-\d{2}) .*\[(I|M|P)\](.*)/); if (!m) return [];
    const blk = (n: string) => [...new Set((b.split(`**${n}.**`)[1] ?? '').split(/\*\*[A-Z][a-z]+\.\*\*|\n\n\*\*/)[0].match(n === 'Escenarios' ? /ESC-\d{2}/g : /AV-\d{2}/g) ?? [])];
    return [{ ft: m[1], prioridad: m[2] as Ficha['prioridad'], diferida: /diferida/.test(m[3]), esc: blk('Escenarios'), av: blk('Avisos') }]; });
}
export function objetivos(e: Entradas): Objetivo[] {
  const r: Objetivo[] = [];
  // CA de 06 §2: por ficha, con su prioridad del encabezado y sus marcas (manual), ⚠ y S6-1
  const fichas = e.d06.split('## 2. Fichas por feature')[1].split('## 4. Recorridos')[0];
  for (const bloque of fichas.split(/^#### /m).slice(1)) {
    const m = bloque.match(/^(FT-\d{2}) .*\[(I|M|P)\](.*)/); if (!m) continue;
    for (const c of bloque.matchAll(/^- \*\*(CA-\d{2}\.\d{1,2})([^*]*)\*\*/gm))
      r.push({ id: c[1], tipo: 'CA', ft: m[1], prioridad: m[2] as 'I' | 'M' | 'P', manual: /\(manual\)/.test(c[2]), advertencia: /⚠/.test(c[2]), s61: /S6-1/.test(c[2]), diferida: /diferida/.test(m[3]) });
  }
  // ESC, AV e invariantes de 01
  for (const x of e.d01.matchAll(/^#### (ESC-\d{2}) /gm)) r.push({ id: x[1], tipo: 'ESC' });
  for (const x of e.d01.matchAll(/^\| (AV-\d{2}) \|/gm)) r.push({ id: x[1], tipo: 'AV' });
  const inv = e.d01.split('## 6. Invariantes')[1].split(/^## 7\./m)[0];
  for (const x of inv.matchAll(/^(\d{1,2})\. /gm)) r.push({ id: 'INV-' + x[1].padStart(2, '0'), tipo: 'INV' });
  // Casos borde de 01 §9 (P7-16)
  const cb = e.d01.split('## 9. Casos borde')[1]?.split(/^## 10\./m)[0] ?? '';
  for (const x of cb.matchAll(/^\| (CB-\d{2}) \|/gm)) r.push({ id: x[1], tipo: 'CB' });
  // Recorridos de 06 §4 (4.7 no es un recorrido) con las fichas que citan
  const rec = e.d06.split('## 4. Recorridos')[1].split(/^## 5\./m)[0];
  for (const b of rec.split(/^### /m).slice(1)) { const m = b.match(/^4\.([1-6]) /); if (m) r.push({ id: 'REC-4.' + m[1], tipo: 'REC', fts: [...new Set(b.match(/FT-\d{2}/g) ?? [])] }); }
  // Verificaciones de fases anteriores: V-nn (04), V5-nn (05), V6-nn (06), H-nn (04 §17) y la prueba de catálogo de CF-16
  const ver = new Set<string>([...e.d04.matchAll(/\b(V-\d{2}|H-\d{2})\b/g)].map(x => x[1]));
  for (const x of e.d05.matchAll(/\b(V5-\d{2})\b/g)) ver.add(x[1]);
  for (const x of e.d06.matchAll(/\b(V6-\d{2})\b/g)) ver.add(x[1]);
  ver.add('CF-16');
  for (const v of [...ver].sort()) r.push({ id: v, tipo: 'VER' });
  return r;
}

// ---------------------------------------------------------------- inventario de pruebas y manuales
export function pruebas(e: Entradas): { lista: Prueba[]; errores: string[] } {
  const lista: Prueba[] = [], errores: string[] = [];
  for (const { titulo: t0, archivo } of e.inventario) {
    const titulo = t0.split(' > ').pop()!;                       // Vitest une los describe con " > "
    if (!titulo.startsWith('PRU-')) { if (/\.(test|e2e)\.tsx?$|\.bench\.ts$/.test(archivo)) errores.push(`M8 prueba sin identificador: "${titulo}" (${archivo})`); continue; }
    const m = titulo.match(TITULO); if (!m) { errores.push(`M8 título mal formado: "${titulo}"`); continue; }
    const esc = m[1].startsWith('PRU-ESC-'); const nivel = esc ? 'ESC' : m[2], area = esc ? 'MOTOR' : m[3];
    if (!NIVELES.includes(nivel)) errores.push(`M8 nivel desconocido ${nivel} en ${m[1]}`);
    if (!esc && !AREAS.includes(area)) errores.push(`M8 área desconocida ${area} en ${m[1]}`);
    if (ARCHIVO_DE[nivel] && !ARCHIVO_DE[nivel].test(archivo)) errores.push(`M8 ${m[1]} es ${nivel} y está en ${archivo}`);
    const refs = (m[5] ?? '').split(',').map(s => s.trim()).filter(Boolean);
    for (const x of refs) if (!REF.test(x) && !DECISION.test(x)) errores.push(`M7 referencia con formato desconocido "${x}" en ${m[1]}`);
    lista.push({ id: m[1], nivel, area, refs: refs.filter(x => REF.test(x)), titulo, archivo });
  }
  const vistos = new Map<string, string>();
  for (const p of lista) { const k = p.id; if (vistos.has(k) && vistos.get(k) !== p.archivo) errores.push(`M8 identificador repetido ${k} en ${vistos.get(k)} y ${p.archivo}`); vistos.set(k, p.archivo); }
  return { lista, errores };
}
export function manuales(texto: string): Manual[] {
  return texto.split(/^### /m).slice(1).map(b => {
    const m = b.match(/^(PRU-MAN-[A-Z]+-\d{3})\s+\[([^\]]*)\]/);
    const campo = (n: string) => new RegExp(`\\*\\*${n}:\\*\\*\\s*\\S`).test(b);
    return { id: m?.[1] ?? '(sin id)', refs: (m?.[2] ?? '').split(',').map(s => s.trim()).filter(Boolean), pasos: /\*\*Pasos:\*\*\s*\n\s*1\. \S/.test(b), resultado: campo('Resultado esperado'), disparador: campo('Disparador') };
  });
}

// Resultados de los manuales (P7-18): solo los registra el usuario, en pruebas/manuales/resultados.md, una fila por ejecución:
// | PRU-MAN-BAND-001 | 2027-03-02 | Android, MacroDroid 5.x | pasa | Andrés | <commit o versión desplegada> | nota |
export interface ResultadoManual { id: string; fecha: string; dispositivo: string; resultado: 'pasa' | 'falla'; quien: string; version: string }
export function resultadosManuales(texto: string): { filas: ResultadoManual[]; errores: string[] } {
  const filas: ResultadoManual[] = [], errores: string[] = [];
  for (const l of texto.split('\n')) { const c = l.split('|').map(x => x.trim()); if (!/^PRU-MAN-/.test(c[1] ?? '')) continue;
    const [, id, fecha, dispositivo, resultado, quien, version] = c;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !dispositivo || !['pasa', 'falla'].includes(resultado) || !quien || !version) { errores.push(`M16 fila de resultado incompleta: ${l.trim()}`); continue; }
    filas.push({ id, fecha, dispositivo, resultado: resultado as 'pasa' | 'falla', quien, version }); }
  return { filas, errores };
}
/** Último resultado de cada manual (por fecha; a igual fecha, la fila posterior). */
export const ultimoResultado = (filas: ResultadoManual[]) => { const m = new Map<string, ResultadoManual>(); for (const f of filas) { const a = m.get(f.id); if (!a || f.fecha >= a.fecha) m.set(f.id, f); } return m; };

// ---------------------------------------------------------------- reglas
export interface Resultado { errores: string[]; avisos: string[]; cubre: Map<string, string[]>; obj: Objetivo[]; activas: Prueba[]; man: Manual[];
  manualesPendientes: Map<string, string[]>; cuarentena: Set<string>; lista: Prueba[] }
const globARegex = (g: string) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '\u0001').replace(/\*\*/g, '\u0002').replace(/\*/g, '[^/]*')
  .replace(/\u0001/g, '(.*/)?').replace(/\u0002/g, '.*') + '$');
export function verificar(e: Entradas): Resultado {
  const obj = objetivos(e); const { lista, errores } = pruebas(e); const avisos: string[] = [];
  const ids = new Set(obj.map(o => o.id));
  // M9 cuarentena: no cuenta como cobertura; una entrada vencida hace fallar `rapido`
  const enCuarentena = new Set<string>();
  for (const q of e.cuarentena) { enCuarentena.add(q.id); if (q.vence < e.hoy) errores.push(`M9 cuarentena vencida: ${q.id} (venció el ${q.vence}; ${q.motivo})`);
    if (!lista.some(p => p.id === q.id)) errores.push(`M9 la cuarentena cita una prueba que no existe: ${q.id}`); }
  const activas = lista.filter(p => !enCuarentena.has(p.id));
  const man = manuales(e.manuales);
  for (const m of man) {
    if (!m.pasos || !m.resultado || !m.disparador) errores.push(`M10 ${m.id} sin procedimiento completo (Disparador, Pasos numerados y Resultado esperado)`);
    for (const x of m.refs) if (REF.test(x) && !ids.has(x)) errores.push(`M7 ${m.id} cita ${x}, que no existe`);
  }
  const cubre = new Map<string, string[]>();
  const anotar = (ref: string, quien: string) => { if (!cubre.has(ref)) cubre.set(ref, []); cubre.get(ref)!.push(quien); };
  for (const p of activas) for (const x of p.refs) anotar(x, p.id);
  for (const m of man) if (m.pasos && m.resultado && m.disparador) for (const x of m.refs) anotar(x, m.id);
  // M7 toda referencia existe
  for (const p of lista) for (const x of p.refs) if (!ids.has(x) && !/^FT-\d{2}$/.test(x)) errores.push(`M7 ${p.id} cita ${x}, que no existe en los documentos`);
  const de = (id: string) => cubre.get(id) ?? [];
  // Qué se exige (DP-15): en cada PR, la cobertura de las fichas terminadas; con --puerta, la de todas las [I] y [M].
  // Las [P] y las diferidas se exigen cuando su ficha pasa a terminada.
  const fs = fichas(e.d06); const estado = (ft: string): EstadoFt => e.features[ft] ?? 'pendiente';
  const exigida = (ft: string) => { const f = fs.find(x => x.ft === ft)!; return estado(ft) === 'terminada' || (e.puerta && f.prioridad !== 'P' && !f.diferida); };
  for (const [ft, st] of Object.entries(e.features)) { const f = fs.find(x => x.ft === ft);
    if (!f) errores.push(`M13 pruebas/features.json cita ${ft}, que no tiene ficha`);
    else if (f.diferida && st !== 'pendiente') errores.push(`M13 ${ft} está diferida en 06; no puede estar ${st} sin el CT que la active`); }
  const algunaTerminada = e.puerta || Object.values(e.features).includes('terminada');
  const falta = (exigir: boolean, msg: string) => (exigir ? errores : avisos).push(msg);
  for (const o of obj) {
    const q = de(o.id), auto = q.filter(x => !x.startsWith('PRU-MAN-')), manu = q.filter(x => x.startsWith('PRU-MAN-'));
    if (o.tipo === 'CA') {
      const ex = exigida(o.ft!);
      if (!q.length && (ex || estado(o.ft!) === 'en_curso')) falta(ex, `M1 ${o.id} (${o.ft} [${o.prioridad}]) sin prueba activa ni procedimiento manual`);
      if (o.manual && !manu.length && ex) errores.push(`M1 ${o.id} está marcado (manual) en 06 y no tiene PRU-MAN`);
      if (o.s61 && !manu.length && ex) errores.push(`M11 ${o.id} ⚠ (S6-1): falta la PRU-MAN que lo rehace con las muestras reales`);
      if (o.advertencia && !o.s61 && !manu.length && ex) avisos.push(`M11 ${o.id} ⚠: validar contra el dato real (sin PRU-MAN)`);
      if (q.length && estado(o.ft!) === 'pendiente' && !o.diferida) avisos.push(`M13 ${o.id} tiene pruebas y ${o.ft} sigue pendiente en pruebas/features.json`);
    }
    // ESC y AV: exigidos cuando alguna ficha que los cita está exigida
    const citan = (t: 'esc' | 'av') => fs.filter(f => f[t].includes(o.id)).some(f => exigida(f.ft));
    if (o.tipo === 'ESC' && citan('esc')) for (const ej of ['motor', 'int']) if (!activas.some(p => p.id === `PRU-${o.id}@${ej}`)) errores.push(`M2 ${o.id} sin PRU-${o.id}@${ej}`);
    if (o.tipo === 'AV' && citan('av') && !auto.length) errores.push(`M3 ${o.id} sin prueba automática`);
    // Invariantes: desde la primera ficha terminada (el motor ya existe)
    if (o.tipo === 'INV' && algunaTerminada && !auto.some(x => /^PRU-(PROP|DOM|INT|ESQ)-/.test(x))) errores.push(`M4 ${o.id} sin prueba PROP, DOM, INT o ESQ`);
    // Casos borde (P7-16): como los invariantes, desde la primera ficha terminada; cualquier prueba automática
    if (o.tipo === 'CB' && algunaTerminada && !auto.length) errores.push(`M14 ${o.id} sin prueba automática`);
    // Recorridos: cuando todas sus fichas están exigidas
    if (o.tipo === 'REC' && o.fts!.every(exigida) && !auto.some(x => x.startsWith('PRU-E2E-'))) errores.push(`M5 ${o.id} sin prueba E2E`);
    if (o.tipo === 'VER') {
      const v = e.previas.find(x => x.id === o.id);
      if (!v) errores.push(`M6 ${o.id} no está en pruebas/verificaciones-previas.json`);
      else if (v.destino && !activas.some(p => p.id === v.destino)) falta(e.puerta, `M6 ${o.id} → ${v.destino}, que todavía no existe o está en cuarentena`);
      else if (!v.destino && !(v.motivo && v.motivo.length >= 20)) errores.push(`M6 ${o.id} sin prueba permanente y sin motivo`);
    }
  }
  for (const v of e.previas) if (!ids.has(v.id)) errores.push(`M6 verificaciones-previas.json cita ${v.id}, que no existe`);
  // M15 (P7-18): una ficha terminada tiene todas las pruebas automáticas de sus CA en verde y ninguna en cuarentena.
  // El verde se mira solo cuando hay resultados de la corrida (--resultados, en el job `cierre` del PR y en `main`).
  for (const f of fs) { if (estado(f.ft) !== 'terminada') continue;
    const cas = new Set(obj.filter(o => o.tipo === 'CA' && o.ft === f.ft).map(o => o.id));
    for (const p of lista) if (p.refs.some(x => cas.has(x))) {
      if (enCuarentena.has(p.id)) errores.push(`M15 ${f.ft} está terminada y ${p.id} está en cuarentena`);
      else if (e.resultados && e.resultados[p.id] !== 'pasada') errores.push(`M15 ${f.ft} está terminada y ${p.id} no pasó en esta corrida (${e.resultados[p.id] ?? 'sin resultado'})`);
    } }
  // M16 (P7-18): manuales pendientes. Un CA cubierto por PRU-MAN necesita un resultado "pasa" registrado por el usuario;
  // sin él, su ficha queda con "manual pendiente": aviso en modo incremental, falta en modo puerta.
  const rm = resultadosManuales(e.resultadosManuales); errores.push(...rm.errores); const ult = ultimoResultado(rm.filas);
  for (const x of ult.keys()) if (!man.some(m => m.id === x)) errores.push(`M16 resultados.md registra ${x}, que no está en manuales.md`);
  const manualesPendientes = new Map<string, string[]>();
  for (const f of fs) { if (estado(f.ft) !== 'terminada' && !(e.puerta && f.prioridad !== 'P' && !f.diferida)) continue;
    const cas = new Set(obj.filter(o => o.tipo === 'CA' && o.ft === f.ft).map(o => o.id));
    const pend = man.filter(m => m.refs.some(x => cas.has(x)) && ult.get(m.id)?.resultado !== 'pasa').map(m => `${m.id} (${ult.get(m.id)?.resultado === 'falla' ? 'falló el ' + ult.get(m.id)!.fecha : 'sin resultado'})`);
    if (pend.length) { manualesPendientes.set(f.ft, pend); falta(e.puerta, `M16 ${f.ft} con manual pendiente: ${pend.join(', ')}`); } }
  // M12 cada archivo de código de la app pertenece a alguna feature o al marco (para "suites afectadas")
  for (const f of e.codigo) if (!e.mapa.some(m => globARegex(m.patron).test(f))) errores.push(`M12 ${f} no está en pruebas/mapa-codigo.json`);
  return { errores, avisos, cubre, obj, activas, man, manualesPendientes, cuarentena: enCuarentena, lista };
}

// ---------------------------------------------------------------- consultas para la Fase 8
const COMANDO: Record<string, string> = { DOM: 'pnpm test:unidad -t', PROP: 'pnpm test:unidad -t', ESC: 'pnpm test:escenarios -t', CTR: 'pnpm test:contratos -t',
  INT: 'pnpm test:integracion -t', ESQ: 'pnpm test:integracion -t', RH: 'pnpm test:integracion -t', CMP: 'pnpm test:componentes -t',
  E2E: 'pnpm test:e2e -- -g', SW: 'pnpm test:e2e -- -g', REN: 'pnpm bench -t', SEG: 'pnpm test -t', RES: 'pnpm test:respaldo -t' };
export function porFeature(r: Resultado, ft: string) {
  const cas = r.obj.filter(o => o.tipo === 'CA' && o.ft === ft).map(o => o.id);
  const recs = r.obj.filter(o => o.tipo === 'REC' && o.fts!.includes(ft)).map(o => o.id);
  const refs = new Set([...cas, ...recs, ft]);
  const ps = r.activas.filter(p => p.refs.some(x => refs.has(x)));
  const man = r.man.filter(m => m.refs.some(x => refs.has(x)));
  const comandos = [...new Set(ps.map(p => p.nivel))].map(n => `${COMANDO[n] ?? 'pnpm test -t'} "${ps.filter(p => p.nivel === n).map(p => p.id.replace(/@/, '\\@')).join('|')}"`);
  return { cas, recs, pruebas: ps, manuales: man, comandos, sinCubrir: cas.filter(c => !(r.cubre.get(c)?.length)) };
}
export function afectadas(r: Resultado, e: Entradas, cambiados: string[]) {
  const fts = new Set<string>(); let todo = false;
  for (const f of cambiados) for (const m of e.mapa) if (globARegex(m.patron).test(f)) { if (m.fts === 'marco') todo = true; else m.fts.forEach(x => fts.add(x)); }
  const ps = new Map<string, Prueba>();
  for (const ft of fts) for (const p of porFeature(r, ft).pruebas) ps.set(p.id, p);
  for (const p of r.activas) if (cambiados.some(c => p.archivo.endsWith(c))) ps.set(p.id, p);   // los archivos de prueba que cambiaron
  const e2e = [...ps.values()].filter(p => ['E2E', 'SW'].includes(p.nivel)).map(p => p.id);
  return { todo, fts: [...fts].sort(), grepE2E: todo ? null : e2e.length ? e2e.join('|') : '^$', total: ps.size };
}
export function informe(r: Resultado) {
  const fts = [...new Set(r.obj.filter(o => o.tipo === 'CA').map(o => o.ft!))].sort();
  const filas = fts.map(ft => { const cas = r.obj.filter(o => o.tipo === 'CA' && o.ft === ft); const ok = cas.filter(c => r.cubre.get(c.id)?.length).length;
    const estado = cas[0].diferida ? 'diferida' : r.manualesPendientes.has(ft) ? 'manual pendiente' : ok === cas.length ? 'cubierta' : 'falta';
    return { ft, prioridad: cas[0].prioridad, cas: cas.length, cubiertos: ok, estado, manualesPendientes: r.manualesPendientes.get(ft) ?? [] }; });
  const puerta = r.obj.filter(o => o.tipo === 'CA' && o.prioridad !== 'P' && !o.diferida && !(r.cubre.get(o.id)?.length)).map(o => o.id);
  const conManual = filas.filter(f => f.prioridad !== 'P' && f.estado === 'manual pendiente').map(f => f.ft);
  return { filas, puertaAbierta: puerta.length === 0 && conManual.length === 0, faltanParaLaPuerta: puerta, fichasConManualPendiente: conManual,
    diferidas: filas.filter(f => f.estado === 'diferida').map(f => f.ft) };
}
/** Resumen para `pnpm pr:mergear` (P7-18): fichas que cambian de estado y manuales que quedan pendientes. */
export function resumenCambios(antes: Record<string, EstadoFt>, r: Resultado, despues: Record<string, EstadoFt>) {
  const cambios = [...new Set([...Object.keys(antes), ...Object.keys(despues)])].sort()
    .filter(ft => (antes[ft] ?? 'pendiente') !== (despues[ft] ?? 'pendiente')).map(ft => `${ft}: ${antes[ft] ?? 'pendiente'} → ${despues[ft] ?? 'pendiente'}`);
  return { cambios, manualesPendientes: [...r.manualesPendientes].map(([ft, m]) => `${ft}: ${m.join(', ')}`) };
}

// ---------------------------------------------------------------- CLI
const leer = (p: string, d = '') => (existsSync(p) ? readFileSync(p, 'utf8') : d);
export function cargarEntradas(raiz = '.'): Entradas {
  const env = (k: string, d: string) => process.env['FINN_MATRIZ_' + k] ?? `${raiz}/${d}`;
  const j = (p: string) => JSON.parse(leer(p, '[]'));
  return { d01: leer(env('D01', 'docs/01-dominio.md')), d06: leer(env('D06', 'docs/06-features.md')), d04: leer(env('D04', 'docs/04-backend.md')), d05: leer(env('D05', 'docs/05-frontend.md')),
    inventario: j(env('INVENTARIO', 'pruebas/inventario.json')), manuales: leer(env('MANUALES', 'pruebas/manuales.md')), previas: j(env('PREVIAS', 'pruebas/verificaciones-previas.json')),
    cuarentena: j(env('CUARENTENA', 'pruebas/cuarentena.json')), mapa: j(env('MAPA', 'pruebas/mapa-codigo.json')),
    hoy: process.env.FINN_MATRIZ_HOY ?? new Date().toISOString().slice(0, 10), codigo: j(env('CODIGO', 'pruebas/codigo.json')),
    features: JSON.parse(leer(env('FEATURES', 'pruebas/features.json'), '{}')), puerta: process.argv.includes('--puerta'),
    resultadosManuales: leer(env('RESULTADOS_MANUALES', 'pruebas/manuales/resultados.md')), resultados: resultadosCorrida() };
}
// Resultados de la corrida (M15): `--resultados <dir>` con los informes JSON de Vitest (`--reporter=json`) y de Playwright.
function resultadosCorrida(): Entradas['resultados'] {
  const i = process.argv.indexOf('--resultados'); if (i < 0) return undefined;
  const out: Record<string, 'pasada' | 'fallida' | 'omitida'> = {};
  const id = (t: string) => t.split(' > ').pop()!.split(' ')[0];
  for (const f of readdirSync(process.argv[i + 1])) { const j = JSON.parse(readFileSync(`${process.argv[i + 1]}/${f}`, 'utf8'));
    for (const t of j.testResults ?? []) for (const a of t.assertionResults ?? []) out[id(a.fullName ?? a.title)] = a.status === 'passed' ? 'pasada' : a.status === 'failed' ? 'fallida' : 'omitida';
    const rec = (s: any) => { for (const sp of s.specs ?? []) out[id(sp.title)] = sp.ok && sp.tests.every((t: any) => t.status === 'expected' || t.status === 'flaky') ? 'pasada' : 'fallida'; for (const h of s.suites ?? []) rec(h); };
    for (const s of j.suites ?? []) rec(s); }
  return out;
}
if (import.meta.main) {
  const [cmd, ...args] = process.argv.slice(2); const e = cargarEntradas(); const r = verificar(e);
  if (cmd === 'verificar') {
    const n = (t: string) => r.obj.filter(o => o.tipo === t).length;
    const fs = fichas(e.d06); const cnt = (p: string) => r.obj.filter(o => o.tipo === 'CA' && o.prioridad === p && !o.diferida).length;
    console.log(`fichas: ${fs.length} (${fs.filter(f => f.prioridad === 'I').length} [I], ${fs.filter(f => f.prioridad === 'M').length} [M], ${fs.filter(f => f.prioridad === 'P').length} [P], ${fs.filter(f => f.diferida).length} diferida); CA [I] ${cnt('I')}, [M] ${cnt('M')}, [P] ${cnt('P')}, diferidos ${r.obj.filter(o => o.diferida).length}; modo ${e.puerta ? 'puerta' : 'incremental'}`);
    console.log(`objetivos: ${n('CA')} CA, ${n('ESC')} ESC, ${n('AV')} AV, ${n('INV')} invariantes, ${n('CB')} casos borde, ${n('REC')} recorridos, ${n('VER')} verificaciones previas`);
    console.log(`pruebas activas: ${r.activas.length}; manuales: ${r.man.length}`);
    for (const a of r.avisos) console.log('aviso  ' + a);
    for (const x of r.errores) console.log('error  ' + x);
    console.log(r.errores.length ? `FALLA: ${r.errores.length} errores` : 'PASA');
    process.exit(r.errores.length ? 1 : 0);
  }
  if (cmd === 'ft') { const x = porFeature(r, args[0]); console.log(JSON.stringify({ ...x, pruebas: x.pruebas.map(p => `${p.id} (${p.nivel}) ${p.archivo}`), manuales: x.manuales.map(m => m.id) }, null, 2)); }
  if (cmd === 'afectadas') console.log(JSON.stringify(afectadas(r, e, args), null, 2));
  if (cmd === 'informe') { const i = informe(r); console.log(JSON.stringify({ ...i, filas: i.filas.length, faltanParaLaPuerta: i.faltanParaLaPuerta.length }, null, 2)); }
  if (cmd === 'resumen') { console.log(JSON.stringify(resumenCambios(JSON.parse(readFileSync(args[0], 'utf8')), r, e.features), null, 2)); }
}
