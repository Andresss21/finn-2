// Control de V7-09: (1) con un inventario sintético que cubre todo, la matriz pasa en modo puerta;
// (2) cada mutación hace fallar exactamente la regla esperada; (3) el modo incremental solo exige lo terminado.
import { verificar, fichas, objetivos, porFeature, afectadas, informe, resumenCambios, type Entradas } from './matriz.ts';
import { readFileSync } from 'node:fs';
const AREA: [number, number, string][] = [[1, 2, 'ACCESO'], [74, 74, 'ACCESO'], [4, 4, 'INICIO'], [8, 8, 'INICIO'], [9, 16, 'PRES'], [17, 17, 'META'], [18, 20, 'CATEG'],
  [21, 27, 'TX'], [28, 28, 'DEV'], [29, 33, 'TARJ'], [3, 3, 'BAND'], [34, 39, 'BAND'], [73, 73, 'BAND'], [78, 78, 'BAND'], [40, 42, 'PROG'], [43, 44, 'CONC'],
  [45, 49, 'COBRO'], [50, 59, 'CTA'], [60, 68, 'REP'], [6, 6, 'NOTIF'], [69, 71, 'NOTIF'], [72, 72, 'AJUS'], [75, 76, 'AJUS'], [5, 5, 'PWA'], [77, 77, 'PWA']];
export const areaDe = (ft: string) => { const n = Number(ft.slice(3)); return AREA.find(([a, b]) => n >= a && n <= b)?.[2]; };
const base = (): Entradas => ({ d01: readFileSync('docs/01-dominio.md', 'utf8'), d06: readFileSync('docs/06-features.md', 'utf8'), d04: readFileSync('docs/04-backend.md', 'utf8'),
  d05: readFileSync('docs/05-frontend.md', 'utf8'), inventario: [], manuales: '', previas: [], cuarentena: [], mapa: [], hoy: '2027-03-01', codigo: [], features: {}, puerta: true, resultadosManuales: '' });
function completo(): Entradas {
  const e = base(); const obj = objetivos(e); const n: Record<string, number> = {};
  const id = (nivel: string, area: string) => { const k = nivel + area; n[k] = (n[k] ?? 0) + 1; return `PRU-${nivel}-${area}-${String(n[k]).padStart(3, '0')}`; };
  const archivo: Record<string, (a: string) => string> = { INT: a => `packages/aplicacion/test/${a.toLowerCase()}.int.test.ts`, E2E: a => `apps/web/e2e/${a.toLowerCase()}.e2e.ts`,
    CMP: a => `apps/web/src/componentes/${a.toLowerCase()}.cmp.test.tsx`, RH: a => `apps/web/src/app/api/${a.toLowerCase()}.rh.test.ts`, DOM: a => `packages/dominio/src/${a.toLowerCase()}.test.ts`,
    PROP: a => `packages/dominio/src/${a.toLowerCase()}.prop.test.ts` };
  const niveles = ['INT', 'E2E', 'CMP', 'RH', 'DOM'];
  obj.filter(o => o.tipo === 'CA').forEach((o, k) => { const nv = niveles[k % 5], a = areaDe(o.ft!)!; e.inventario.push({ titulo: `PRU-${nv} > ${id(nv, a)} [${o.id}] sintético`, archivo: archivo[nv](a) }); });
  for (const o of obj.filter(o => o.tipo === 'ESC')) for (const ej of ['motor', 'int']) e.inventario.push({ titulo: `PRU-ESC-${o.id.slice(4)}@${ej} [${o.id}] sintético`, archivo: `packages/dominio/escenarios/${o.id.toLowerCase()}.ts` });
  for (const o of obj.filter(o => o.tipo === 'AV')) e.inventario.push({ titulo: `${id('DOM', 'MOTOR')} [${o.id}] sintético`, archivo: archivo.DOM('motor') });
  for (const o of obj.filter(o => o.tipo === 'INV')) e.inventario.push({ titulo: `${id('PROP', 'MOTOR')} [${o.id}] sintético`, archivo: archivo.PROP('motor') });
  for (const o of obj.filter(o => o.tipo === 'CB')) e.inventario.push({ titulo: `${id('DOM', 'MOTOR')} [${o.id}] sintético`, archivo: archivo.DOM('motor') });
  for (const o of obj.filter(o => o.tipo === 'REC')) e.inventario.push({ titulo: `${id('E2E', 'INICIO')} [${o.id}] sintético`, archivo: 'apps/web/e2e/recorridos.e2e.ts' });
  obj.filter(o => o.tipo === 'VER').forEach((o, k) => { if (k % 8 === 0) e.previas.push({ id: o.id, motivo: 'solo existe en el proyecto real; queda en la prueba de humo' });
    else { const t = id('INT', 'ESQ'); e.inventario.push({ titulo: `${t} [${o.id}] sintético`, archivo: archivo.INT('esq') }); e.previas.push({ id: o.id, destino: t }); } });
  const man = obj.filter(o => o.tipo === 'CA' && (o.manual || o.advertencia));
  const mid = (o: any, k: number) => `PRU-MAN-${areaDe(o.ft!)}-${String(k + 1).padStart(3, '0')}`;
  e.manuales = man.map((o, k) => `### ${mid(o, k)} [${o.id}] procedimiento\n\n**Disparador:** antes de terminar ${o.ft}.\n\n**Pasos:**\n1. Hacer.\n\n**Resultado esperado:** lo del CA.\n`).join('\n');
  e.resultadosManuales = '| Manual | Fecha | Dispositivo | Resultado | Quién | Versión | Nota |\n|---|---|---|---|---|---|---|\n' +
    man.map((o, k) => `| ${mid(o, k)} | 2027-02-20 | Android | pasa | Andrés | abc1234 | |`).join('\n');
  e.resultados = Object.fromEntries(e.inventario.map(p => [p.titulo.split(' > ').pop()!.split(' ')[0], 'pasada' as const]));
  for (const f of fichas(e.d06)) e.features[f.ft] = f.diferida ? 'pendiente' : 'terminada';
  e.mapa = [{ patron: 'apps/web/src/app/(finn)/layout.tsx', fts: 'marco' }, { patron: 'apps/web/src/app/(finn)/tarjetas/**', fts: ['FT-29', 'FT-30', 'FT-31'] },
    { patron: 'packages/aplicacion/src/operaciones/pagar-tarjeta.ts', fts: ['FT-30'] }];
  e.codigo = ['apps/web/src/app/(finn)/layout.tsx', 'apps/web/src/app/(finn)/tarjetas/[id]/page.tsx', 'packages/aplicacion/src/operaciones/pagar-tarjeta.ts'];
  return e;
}
const quitar = (e: Entradas, ref: string) => { e.inventario = e.inventario.filter(p => !p.titulo.includes(`[${ref}]`)); return e; };
const primero = (e: Entradas, ref: string) => e.inventario.find(p => p.titulo.includes(`[${ref}]`))!;
const mut: [string, string, (e: Entradas) => void][] = [
  ['quitar la prueba de CA-30.4', 'M1', e => { quitar(e, 'CA-30.4'); }],
  ['quitar la PRU-MAN de CA-02.5 (manual)', 'M1', e => { e.manuales = e.manuales.replace(/### PRU-MAN-\w+-\d+ \[CA-02\.5\][\s\S]*?(?=### |$)/, ''); }],
  ['quitar PRU-ESC-17@int', 'M2', e => { e.inventario = e.inventario.filter(p => !p.titulo.startsWith('PRU-ESC-17@int')); }],
  ['quitar la prueba de AV-24', 'M3', e => { quitar(e, 'AV-24'); }],
  ['quitar la prueba de INV-28', 'M4', e => { quitar(e, 'INV-28'); }],
  ['quitar la E2E de REC-4.6', 'M5', e => { quitar(e, 'REC-4.6'); }],
  ['quitar V5-12 de verificaciones-previas.json', 'M6', e => { e.previas = e.previas.filter(v => v.id !== 'V5-12'); }],
  ['referencia con errata CA-30.40', 'M7', e => { const p = primero(e, 'CA-30.4'); p.titulo = p.titulo.replace('[CA-30.4]', '[CA-30.4, CA-30.40]'); }],
  ['identificador repetido en otro archivo', 'M8', e => { const p = primero(e, 'CA-30.4'); e.inventario.push({ ...p, archivo: 'packages/aplicacion/test/otra.int.test.ts' }); }],
  ['prueba INT en un archivo .e2e.ts', 'M8', e => { const p = e.inventario.find(x => x.titulo.includes('PRU-INT-'))!; p.archivo = 'apps/web/e2e/x.e2e.ts'; }],
  ['cuarentena vencida', 'M9', e => { const p = primero(e, 'CA-30.4'); e.cuarentena.push({ id: p.titulo.split(' > ').pop()!.split(' ')[0], motivo: 'inestable', desde: '2027-02-01', vence: '2027-02-15' }); }],
  ['PRU-MAN sin pasos', 'M10', e => { e.manuales = e.manuales.replace(/\*\*Pasos:\*\*\n1\. Hacer\./, '**Pasos:**\n'); }],
  ['quitar la PRU-MAN de CA-34.14 ⚠ (S6-1)', 'M11', e => { e.manuales = e.manuales.replace(/### PRU-MAN-\w+-\d+ \[CA-34\.14\][\s\S]*?(?=### |$)/, ''); }],
  ['archivo de código sin feature', 'M12', e => { e.codigo.push('apps/web/src/app/(finn)/nueva/page.tsx'); }],
  ['FT-49 (diferida) marcada terminada', 'M13', e => { e.features['FT-49'] = 'terminada'; }],
  ['quitar la prueba de CB-21', 'M14', e => { quitar(e, 'CB-21'); }],
  ['FT-30 terminada con una prueba en cuarentena (vigente)', 'M15', e => { const p = primero(e, 'CA-30.4'); e.inventario.push({ titulo: 'PRU-INT-TARJ-900 [CA-30.4] otra', archivo: 'packages/aplicacion/test/tarj.int.test.ts' });
    e.cuarentena.push({ id: p.titulo.split(' > ').pop()!.split(' ')[0], motivo: 'inestable', desde: '2027-02-25', vence: '2027-03-11' }); }],
  ['FT-30 terminada con una prueba fallida en la corrida', 'M15', e => { const p = primero(e, 'CA-30.4'); e.resultados![p.titulo.split(' > ').pop()!.split(' ')[0]] = 'fallida'; }],
  ['FT-02 sin resultado del manual de CA-02.5', 'M16', e => { e.resultadosManuales = e.resultadosManuales.split('\n').filter(l => !l.includes('PRU-MAN-ACCESO-001')).join('\n'); }],
  ['manual que falló después de pasar', 'M16', e => { e.resultadosManuales += '\n| PRU-MAN-ACCESO-001 | 2027-02-28 | Android | falla | Andrés | def5678 | |'; }],
  ['fila de resultado sin dispositivo', 'M16', e => { e.resultadosManuales += '\n| PRU-MAN-ACCESO-001 | 2027-02-28 |  | pasa | Andrés | def5678 | |'; }],
];
const r0 = verificar(completo());
console.log(`completo, modo puerta: ${r0.errores.length ? 'FALLA ' + r0.errores.slice(0, 3).join(' | ') : 'PASA'}; avisos ${r0.avisos.length}; pruebas ${r0.activas.length}; manuales ${r0.man.length}`);
let ok = 0;
for (const [d, regla, f] of mut) { const e = completo(); f(e); const r = verificar(e); const reglas = [...new Set(r.errores.map(x => x.split(' ')[0]))];
  const bien = reglas.includes(regla); if (bien) ok++; console.log(`${bien ? 'detecta' : 'NO DETECTA'} ${regla}: ${d} → ${r.errores.length} error(es): ${r.errores.slice(0, 2).join(' | ')}`); }
console.log(`mutaciones detectadas: ${ok} de ${mut.length}`);
// Modo incremental: solo FT-30 terminada y sin sus pruebas → solo los CA de FT-30
{ const e = completo(); e.puerta = false; for (const k of Object.keys(e.features)) e.features[k] = 'pendiente'; e.features['FT-30'] = 'terminada';
  e.inventario = e.inventario.filter(p => !/\[CA-30\./.test(p.titulo)); const r = verificar(e);
  const m1 = r.errores.filter(x => x.startsWith('M1 ')); console.log(`incremental (FT-30 terminada sin sus pruebas): ${m1.length} M1, todos de FT-30: ${m1.every(x => x.includes('FT-30'))}; otros errores: ${r.errores.length - m1.length}`); }
{ const e = completo(); e.puerta = false; const r = verificar(e); const x = porFeature(r, 'FT-30'); console.log(`pruebas:ft FT-30 → ${x.cas.length} CA, ${x.recs.join(', ')}, ${x.pruebas.length} pruebas, comandos:`); x.comandos.forEach(c => console.log('   ' + c.slice(0, 110) + (c.length > 110 ? '…' : '')));
  const a = afectadas(r, e, ['packages/aplicacion/src/operaciones/pagar-tarjeta.ts']); console.log(`afectadas(pagar-tarjeta.ts) → fts ${a.fts}, E2E ${a.grepE2E?.split('|').length}, total ${a.total}`);
  const b = afectadas(r, e, ['apps/web/src/app/(finn)/layout.tsx']); console.log(`afectadas(layout.tsx) → todo: ${b.todo}`);
  const i = informe(r); console.log(`informe: ${i.filas.length} fichas; puerta abierta: ${i.puertaAbierta}; diferidas: ${i.diferidas}; FT-49: ${i.filas.find(f => f.ft === 'FT-49')!.estado}`); }
// Modo incremental, manual pendiente: es aviso, no error; en modo puerta, la ficha no cumple y la puerta queda cerrada
{ const e = completo(); e.resultadosManuales = ''; e.puerta = false; const r = verificar(e); const i = informe(r);
  console.log(`incremental sin resultados manuales: errores ${r.errores.length}, avisos M16 ${r.avisos.filter(a => a.startsWith('M16')).length}; fichas con manual pendiente: ${i.fichasConManualPendiente.join(', ')}; puerta abierta: ${i.puertaAbierta}`);
  const antes = { ...e.features, 'FT-30': 'en_curso' as const, 'FT-02': 'en_curso' as const };
  console.log('resumen de pr:mergear:', JSON.stringify(resumenCambios(antes, r, e.features))); }
