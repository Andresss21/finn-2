// PRU-SEG-RELOJ-001 (barrera 1) y PRU-SEG-RELOJ-002 (barrera 2), prototipo de V7-07 con la regla de P7-10.
// 001: arranca `next start` con cada combinación y el archivo de reloj presente; espera salida 1 o arranque.
// 002: llama a relojDePrueba() con cada combinación (vía /api/eco cuando arranca, y en proceso para las que no arrancan).
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const ARCH = '/tmp/claude-0/finn-reloj-seg.json';
writeFileSync(ARCH, JSON.stringify({ instante: '2027-02-20T12:00:00-06:00', fijadoEn: Date.now() }));
const base = { PATH: process.env.PATH, HOME: process.env.HOME, NEXT_TELEMETRY_DISABLED: '1' };
const casos = [
  // [nombre, env extra, esperado: 'no-arranca' | 'reloj-prueba' | 'reloj-real']
  ['control positivo: FINN_ENTORNO=pruebas, sin VERCEL_ENV', { FINN_ENTORNO: 'pruebas', FINN_RELOJ_ARCHIVO: ARCH }, 'reloj-prueba'],
  ['VERCEL_ENV=production', { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'production', FINN_RELOJ_ARCHIVO: ARCH }, 'no-arranca'],
  ['VERCEL_ENV=preview', { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'preview', FINN_RELOJ_ARCHIVO: ARCH }, 'no-arranca'],
  ['VERCEL_ENV=development', { FINN_ENTORNO: 'pruebas', VERCEL_ENV: 'development', FINN_RELOJ_ARCHIVO: ARCH }, 'no-arranca'],
  ['VERCEL_ENV vacía', { FINN_ENTORNO: 'pruebas', VERCEL_ENV: '', FINN_RELOJ_ARCHIVO: ARCH }, 'no-arranca'],
  ['sin FINN_ENTORNO', { FINN_RELOJ_ARCHIVO: ARCH }, 'no-arranca'],
  ['FINN_ENTORNO=produccion', { FINN_ENTORNO: 'produccion', FINN_RELOJ_ARCHIVO: ARCH }, 'no-arranca'],
  ['FINN_ENTORNO=Pruebas (mayúscula)', { FINN_ENTORNO: 'Pruebas', FINN_RELOJ_ARCHIVO: ARCH }, 'no-arranca'],
  ['solo FINN_HOY_SIMULADO, sin FINN_ENTORNO', { FINN_HOY_SIMULADO: '2027-02-20' }, 'no-arranca'],
  ['FINN_RELOJ_ARCHIVO vacía, VERCEL_ENV=preview', { VERCEL_ENV: 'preview', FINN_RELOJ_ARCHIVO: '' }, 'no-arranca'],
  ['control: VERCEL_ENV=preview sin variables de reloj', { VERCEL_ENV: 'preview' }, 'reloj-real'],
];
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function correr([nombre, extra, esperado], puerto) {
  const p = spawn('npx', ['next', 'start', '-p', String(puerto), '-H', '127.0.0.1'], { env: { ...base, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
  let salida = null, err = ''; p.on('exit', (c) => { salida = c; }); p.stderr.on('data', (d) => { err += d; });
  let obtenido = null;
  for (let i = 0; i < 60 && salida === null && !obtenido; i++) {
    await esperar(250);
    try { const r = await fetch(`http://127.0.0.1:${puerto}/`); const t = await r.text(); const m = t.match(/data-testid="entorno">(.*?)<\/p>/); obtenido = m ? m[1].replace(/<!-- -->/g, '') : 'sin-marca'; } catch {}
  }
  if (salida === null) p.kill('SIGTERM');
  const res = salida === 1 ? 'no-arranca' : obtenido?.endsWith('reloj-prueba') ? 'reloj-prueba' : obtenido?.endsWith('reloj-real') ? 'reloj-real' : `?(${salida},${obtenido})`;
  const motivo = salida === 1 ? (err.match(/finn: [^\n]*/) ?? [''])[0] : obtenido;
  return { nombre, esperado, res, ok: res === esperado, motivo };
}
let fallos = 0, puerto = 3201;
for (const c of casos) { const r = await correr(c, puerto++); if (!r.ok) fallos++; console.log(`${r.ok ? 'ok  ' : 'FALLA'} 001 ${r.nombre} → ${r.res} | ${r.motivo}`); }
// 002 en proceso: la función sola, sin la barrera 1 (simula un archivo que llega por otra vía)
const { relojDePrueba } = await import('../lib/reloj-prueba');
for (const [nombre, extra, esperado] of casos) {
  const r = relojDePrueba({ ...extra, FINN_RELOJ_ARCHIVO: ARCH });
  const res = r ? 'reloj-prueba' : 'null';
  const ok = esperado === 'reloj-prueba' ? res === 'reloj-prueba' : res === 'null';
  if (!ok) fallos++;
  console.log(`${ok ? 'ok  ' : 'FALLA'} 002 ${nombre} → ${res}`);
}
console.log(fallos ? `${fallos} FALLOS` : 'todas pasan'); process.exit(fallos ? 1 : 0);
