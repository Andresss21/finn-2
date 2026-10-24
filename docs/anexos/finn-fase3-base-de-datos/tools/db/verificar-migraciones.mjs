// tools/db/verificar-migraciones.mjs — lint de migraciones (11.5).
// Uso: node tools/db/verificar-migraciones.mjs <dir-migraciones> <catalogo-esperado.txt> [lista de migraciones nuevas]
import fs from 'node:fs';
import path from 'node:path';

const [dir, catalogo, ...nuevas] = process.argv.slice(2);
const errores = [];

// Nombres protegidos: todo objeto manual de la instantánea (CHECK, índices de expresión,
// triggers, funciones, secuencias).
const protegidos = new Set();
for (const l of fs.readFileSync(catalogo, 'utf8').split('\n')) {
  const [tipo, a, b, c] = l.split('|');
  if (tipo === 'check') protegidos.add(b);
  if (tipo === 'indice') protegidos.add(a.match(/INDEX (\S+) ON/)[1]);
  if (tipo === 'trigger') protegidos.add(c.match(/TRIGGER (\S+) /)[1]);
  if (tipo === 'funcion') protegidos.add(a.split('(')[0]);
  if (tipo === 'secuencia') protegidos.add(a);
}
// Tablas de hechos: clase M o H (exigen el bloqueo en migraciones de datos).
const hechos = fs.readFileSync(catalogo, 'utf8').split('\n')
  .filter((l) => /^tabla\|/.test(l) && /finn:clase=[MH]$/.test(l)).map((l) => l.split('|')[1]);

const sinComentarios = (s) => s.replace(/--[^\n]*/g, '');
const carpetas = fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory()).sort();
for (const d of carpetas) {
  if (nuevas.length && !nuevas.includes(d)) continue;
  const m = d.match(/^\d{14}_(g|m)_[a-z0-9_]+$/);
  if (!m) { errores.push(`${d}: nombre inválido (AAAAMMDDhhmmss_g_nombre o _m_nombre)`); continue; }
  const sql = fs.readFileSync(path.join(dir, d, 'migration.sql'), 'utf8');
  const cuerpo = sinComentarios(sql);
  const err = (msg) => errores.push(`${d}: ${msg}`);

  if (m[1] === 'g') {
    // Migraciones generadas por Prisma: nunca tocan objetos manuales.
    for (const nombre of protegidos) {
      if (new RegExp(`["\\s.]${nombre}["\\s;(]`).test(cuerpo)) err(`toca el objeto manual protegido «${nombre}»`);
    }
    const prohibidas = [
      [/\bROW LEVEL SECURITY\b/i, 'cambia RLS'], [/\bPOLICY\b/i, 'crea o borra políticas'],
      [/\b(GRANT|REVOKE)\b/i, 'cambia privilegios'], [/\bOWNER TO\b/i, 'cambia dueños'],
      [/\bTRIGGER\b/i, 'toca triggers'], [/\bFUNCTION\b|\$\$/i, 'toca funciones'],
      [/\bSEQUENCE\b/i, 'toca secuencias'], [/nextval\(/i, 'usa DEFAULT nextval (R12)'],
      [/\bCOMMENT ON\b/i, 'cambia comentarios de clase'],
    ];
    for (const [re, msg] of prohibidas) if (re.test(cuerpo)) err(msg);
    // Contracción: solo con marca explícita y revisada (11.4).
    const destructivo = /\bDROP\s+(TABLE|COLUMN|TYPE|INDEX|CONSTRAINT)\b|\bALTER\s+TYPE\b|\bSET\s+NOT\s+NULL\b|\bALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE\b/i;
    if (destructivo.test(cuerpo) && !/^-- finn:contraer .+/m.test(sql)) err('contiene cambios destructivos sin la marca «-- finn:contraer <motivo>» (11.4)');
  } else {
    if (!/^-- finn:manual\b/m.test(sql)) err('una migración manual empieza con la marca «-- finn:manual»');
    // Escrituras de datos en tablas de hechos: exigen el bloqueo (ADR-06).
    const escribe = hechos.some((t) => new RegExp(`\\b(INSERT\\s+INTO|UPDATE|DELETE\\s+FROM)\\s+finn\\.${t}\\b`, 'i').test(cuerpo));
    if (escribe && !/finn\.tomar_bloqueo\(\)/.test(cuerpo)) err('escribe en tablas de hechos sin finn.tomar_bloqueo()');
  }
}
if (errores.length) { console.error(errores.map((e) => '✗ ' + e).join('\n')); process.exit(1); }
console.log(`✓ ${carpetas.length} migraciones revisadas, sin problemas`);
