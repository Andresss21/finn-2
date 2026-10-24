// tools/plan/anexos.ts — V8-05: cada archivo que el plan manda "portar desde anexos" existe en la carpeta de los anexos.
// TypeScript sin dependencias; Node 24 lo ejecuta sin compilar (eliminación de tipos).
// Uso:
//   node tools/plan/anexos.ts --plan docs/08-tareas.md --anexos <carpeta> [--entrada] [--negativo]
// [F8] Con --entrada (antes de TA-002, sobre C:/finn/_entrada) comprueba además la lista de TU-04 y que finn-entrega.zip
// traiga 52 íconos en iconos/ y 7 glifos en iconos/estados/.
// La carpeta puede tener los zips sin abrir (también zips dentro de zips, como finn-marca.zip dentro de finn-entrega.zip)
// o su contenido ya extraído (docs/anexos/ en el repositorio). No escribe nada: solo lee y lista.
// Lee las tablas "Archivos de los zips que cita …" del plan: columna 1 = archivos (entre comillas invertidas),
// columna 2 = zip, columna 3 = tareas. Un nombre que termina en "/" es una carpeta y debe tener al menos un archivo.
// Sale con 1 si falta un archivo citado (o, con --negativo, si el control no detecta un archivo quitado).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { inflateRawSync } from 'node:zlib';

type Cita = { archivo: string; zip: string; tareas: string; carpeta: boolean; aviso: boolean; tabla: string };

function argumento(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// ── Lectura del plan ───────────────────────────────────────────────────────
export function leerCitas(plan: string): Cita[] {
  const citas: Cita[] = [];
  const re = /^#{3,4} ([\d.]+ )?Archivos de los zips que cita[^\n]*\n([\s\S]*?)(?=^#{2,4} |(?![\s\S]))/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plan)) !== null) {
    const tabla = (m[0].split('\n')[0] as string).replace(/^#+ /, '');
    for (const linea of (m[2] as string).split('\n')) {
      if (!linea.startsWith('| ') || linea.startsWith('| Archivo') || linea.startsWith('|---')) continue;
      const celdas = linea.slice(1, -1).split(' | ').map((c) => c.trim());
      if (celdas.length < 3) continue;
      const [archivos, zip, tareas] = celdas as [string, string, string];
      const aviso = /o equivalente|prototipo de/i.test(archivos);
      for (const n of archivos.matchAll(/`([^`]+)`/g)) {
        const archivo = n[1] as string;
        if (!/[./]/.test(archivo)) continue; // nombres que no son archivos (por ejemplo, `m_reloj`)
        citas.push({ archivo, zip, tareas, carpeta: archivo.endsWith('/'), aviso, tabla });
      }
    }
  }
  return citas;
}

// ── Índice de la carpeta de anexos (con zips anidados) ──────────────────────
function entradasZip(buf: Buffer): { nombre: string; datos: () => Buffer }[] {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('zip sin directorio central');
  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const salida: { nombre: string; datos: () => Buffer }[] = [];
  for (let k = 0; k < total; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('directorio central dañado');
    const metodo = buf.readUInt16LE(p + 10);
    const comprimido = buf.readUInt32LE(p + 20);
    const largoNombre = buf.readUInt16LE(p + 28); const largoExtra = buf.readUInt16LE(p + 30); const largoComentario = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nombre = buf.toString('utf8', p + 46, p + 46 + largoNombre);
    salida.push({
      nombre,
      datos: () => {
        const inicio = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        const crudo = buf.subarray(inicio, inicio + comprimido);
        if (metodo === 0) return Buffer.from(crudo);
        if (metodo === 8) return inflateRawSync(crudo);
        throw new Error(`método de compresión ${metodo} no soportado en ${nombre}`);
      },
    });
    p += 46 + largoNombre + largoExtra + largoComentario;
  }
  return salida;
}

export function indexar(carpeta: string): Set<string> {
  const rutas = new Set<string>();
  const agregarZip = (prefijo: string, buf: Buffer, profundidad: number): void => {
    for (const e of entradasZip(buf)) {
      const ruta = `${prefijo}/${e.nombre}`;
      rutas.add(ruta);
      if (e.nombre.toLowerCase().endsWith('.zip') && profundidad < 3) agregarZip(ruta.replace(/\.zip$/i, ''), e.datos(), profundidad + 1);
    }
  };
  const recorrer = (dir: string): void => {
    for (const n of readdirSync(dir)) {
      const ruta = join(dir, n);
      if (statSync(ruta).isDirectory()) { recorrer(ruta); continue; }
      const rel = relative(carpeta, ruta).split(sep).join('/');
      rutas.add(rel);
      if (n.toLowerCase().endsWith('.zip')) agregarZip(rel.replace(/\.zip$/i, ''), readFileSync(ruta), 1);
    }
  };
  recorrer(carpeta);
  return rutas;
}

export function buscar(cita: Cita, rutas: Set<string>): string[] {
  const objetivo = cita.archivo.replace(/^\.?\//, '');
  const hallados: string[] = [];
  for (const r of rutas) {
    const conBarra = '/' + r;
    if (cita.carpeta) { if (conBarra.includes('/' + objetivo) && !r.endsWith('/')) hallados.push(r); }
    else if (conBarra.endsWith('/' + objetivo)) hallados.push(r);
  }
  return hallados;
}

export function comprobar(citas: Cita[], rutas: Set<string>): { faltan: Cita[]; avisos: Cita[]; presentes: number } {
  const faltan: Cita[] = []; const avisos: Cita[] = []; let presentes = 0;
  for (const c of citas) {
    if (buscar(c, rutas).length > 0) { presentes++; continue; }
    if (c.aviso) avisos.push(c); else faltan.push(c);
  }
  return { faltan, avisos, presentes };
}

// [F8] Lista de TU-04 y conteo de íconos
export const ENTRADA_MD = ['00-decisiones.md', '01-dominio.md', '02-tecnologias.md', '03-base-de-datos.md', '04-backend.md', '05-frontend.md',
  '06-features.md', '07-pruebas.md', '08-tareas.md', '05-anexo-encargo-claude-design.md', '06-identidad-visual.md',
  'Finn 2.0 — Características, Funciones y Mejoras.md', '04-backend-verificacion.md', '05-frontend-verificacion.md'];
export function comprobarEntrada(rutas: Set<string>): string[] {
  const faltan: string[] = [];
  const nivel1 = [...rutas].filter((r) => !r.includes('/'));
  for (const n of ENTRADA_MD) if (!nivel1.some((r) => r.normalize('NFC') === n.normalize('NFC'))) faltan.push(n);
  for (let f = 3; f <= 8; f++) if (!nivel1.some((r) => new RegExp(`^0${f}-.*\\.zip$`, 'i').test(r))) faltan.push(`zip de la Fase ${f} (0${f}-*.zip)`);
  if (!nivel1.includes('finn-entrega.zip')) faltan.push('finn-entrega.zip');
  const iconos = [...rutas].filter((r) => r.startsWith('finn-entrega/') && /\/iconos\/[^/]+\.svg$/i.test(r)).length;
  const glifos = [...rutas].filter((r) => r.startsWith('finn-entrega/') && /\/iconos\/estados\/[^/]+\.svg$/i.test(r)).length;
  if (iconos !== 52) faltan.push(`52 íconos en iconos/ de finn-entrega.zip (hay ${iconos})`);
  if (glifos !== 7) faltan.push(`7 glifos en iconos/estados/ de finn-entrega.zip (hay ${glifos})`);
  return faltan;
}

function principal(): void {
  const plan = readFileSync(argumento('--plan') ?? 'docs/08-tareas.md', 'utf8');
  const carpeta = argumento('--anexos') ?? 'docs/anexos';
  const citas = leerCitas(plan);
  const rutas = indexar(carpeta);
  const r = comprobar(citas, rutas);
  console.log(`Plan: ${citas.length} archivos citados en ${new Set(citas.map((c) => c.tabla)).size} tablas; anexos: ${rutas.size} archivos indexados en ${carpeta}.`);
  console.log(`Presentes: ${r.presentes}; faltan: ${r.faltan.length}; a revisar a mano: ${r.avisos.length}.`);
  for (const c of r.faltan) console.log(`FALTA ${c.archivo} (zip: ${c.zip}; tareas: ${c.tareas}; ${c.tabla})`);
  for (const c of r.avisos) console.log(`REVISAR ${c.archivo} (la cita dice "o equivalente" o "prototipo"; zip: ${c.zip}; tareas: ${c.tareas})`);
  let fallo = r.faltan.length > 0;
  if (process.argv.includes('--entrada')) {
    const fe = comprobarEntrada(rutas);
    console.log(`Lista de TU-04: ${fe.length === 0 ? 'completa, con 52 íconos y 7 glifos' : `faltan ${fe.length}`}.`);
    for (const x of fe) console.log(`FALTA (TU-04) ${x}`);
    if (fe.length > 0) fallo = true;
  }
  if (process.argv.includes('--negativo')) {
    const presente = citas.find((c) => !c.aviso && buscar(c, rutas).length > 0);
    if (!presente) { console.log('Control negativo: no hay ningún archivo presente para quitar.'); fallo = true; }
    else {
      const sin = new Set([...rutas].filter((x) => !buscar(presente, new Set([x])).length));
      const ok = comprobar(citas, sin).faltan.some((c) => c.archivo === presente.archivo);
      console.log(`Control negativo: quitar ${presente.archivo} del índice ${ok ? 'se detecta' : 'NO SE DETECTA'}.`);
      if (!ok) fallo = true;
    }
  }
  console.log(fallo ? 'RESULTADO: FALLA' : 'RESULTADO: PASA');
  process.exit(fallo ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('anexos.ts')) principal();
