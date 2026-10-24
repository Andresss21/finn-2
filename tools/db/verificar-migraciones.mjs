// tools/db/verificar-migraciones.mjs — C1, lint de migraciones (03 §11.2, §11.4, §11.5, §11.6).
// Portado de docs/anexos/finn-fase3-base-de-datos/tools/db/verificar-migraciones.mjs.
// Uso: node tools/db/verificar-migraciones.mjs <dir-migraciones> [catalogo-esperado.txt] [migraciones nuevas…]
// Sin catálogo explícito se usa <dir>/../catalogo-esperado.txt si existe. Sin instantánea no hay
// objetos protegidos y toda escritura en finn.<tabla> cuenta como escritura de hechos.
import fs from 'node:fs';
import path from 'node:path';

const [dir, ...resto] = process.argv.slice(2);
if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(
    `✗ falta el directorio de migraciones (uso: verificar-migraciones.mjs <dir> [catálogo] [nuevas…])`,
  );
  process.exit(2);
}
const esArchivo = (f) => fs.existsSync(f) && fs.statSync(f).isFile();
const porDefecto = path.join(dir, '..', 'catalogo-esperado.txt');
const catalogo =
  resto[0] && esArchivo(resto[0]) ? resto.shift() : esArchivo(porDefecto) ? porDefecto : null;
const nuevas = resto;
const errores = [];

// Nombres protegidos: todo objeto manual de la instantánea (CHECK, índices de expresión,
// triggers, funciones, secuencias). Tablas de hechos: clase M o H (exigen el bloqueo).
const protegidos = new Set();
let hechos = null;
if (catalogo) {
  const lineas = fs.readFileSync(catalogo, 'utf8').split(/\r?\n/);
  for (const l of lineas) {
    const [tipo, a = '', b = '', c = ''] = l.split('|');
    if (tipo === 'check') protegidos.add(b);
    if (tipo === 'indice') protegidos.add(a.match(/INDEX (\S+) ON/)?.[1]);
    if (tipo === 'trigger') protegidos.add(c.match(/TRIGGER (\S+) /)?.[1]);
    if (tipo === 'funcion') protegidos.add(a.split('(')[0]);
    if (tipo === 'secuencia') protegidos.add(a);
  }
  protegidos.delete(undefined);
  protegidos.delete('');
  hechos = lineas
    .filter((l) => /^tabla\|/.test(l) && /finn:clase=[MH]$/.test(l))
    .map((l) => l.split('|')[1]);
}

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sinComentarios = (s) => s.replace(/--[^\n]*/g, '');
const tablaEscrita =
  hechos === null ? '\\w+' : hechos.length ? `(${hechos.map(escapar).join('|')})` : '(?!)';
const escribeHechos = new RegExp(
  `\\b(INSERT\\s+INTO|UPDATE|DELETE\\s+FROM)\\s+"?finn"?\\."?${tablaEscrita}\\b`,
  'i',
);
const prohibidas = [
  [/\bROW LEVEL SECURITY\b/i, 'cambia RLS'],
  [/\bPOLICY\b/i, 'crea o borra políticas'],
  [/\b(GRANT|REVOKE)\b/i, 'cambia privilegios'],
  [/\bOWNER TO\b/i, 'cambia dueños'],
  [/\bTRIGGER\b/i, 'toca triggers'],
  [/\bFUNCTION\b|\$\$/i, 'toca funciones'],
  [/\bSEQUENCE\b/i, 'toca secuencias'],
  [/nextval\(/i, 'usa DEFAULT nextval (R12)'],
  [/\bCOMMENT ON\b/i, 'cambia comentarios de clase'],
];
const destructivo =
  /\bDROP\s+(TABLE|COLUMN|TYPE|INDEX|CONSTRAINT)\b|\bALTER\s+TYPE\b|\bSET\s+NOT\s+NULL\b|\bALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE\b/i;

const carpetas = fs
  .readdirSync(dir)
  .filter((d) => fs.statSync(path.join(dir, d)).isDirectory())
  .filter((d) => !nuevas.length || nuevas.includes(d))
  .sort();
for (const d of carpetas) {
  const err = (msg) => errores.push(`${d}: ${msg}`);
  const m = d.match(/^\d{14}_(g|m)_[a-z0-9_]+$/);
  if (!m) {
    err('nombre inválido (AAAAMMDDhhmmss_g_nombre o _m_nombre)');
    continue;
  }
  const archivo = path.join(dir, d, 'migration.sql');
  if (!esArchivo(archivo)) {
    err('no tiene migration.sql');
    continue;
  }
  const sql = fs.readFileSync(archivo, 'utf8');
  const cuerpo = sinComentarios(sql);

  if (m[1] === 'g') {
    // Migraciones generadas por Prisma: nunca tocan objetos manuales.
    for (const nombre of protegidos) {
      if (new RegExp(`["\\s.]${escapar(nombre)}["\\s;(]`).test(cuerpo))
        err(`toca el objeto manual protegido «${nombre}»`);
    }
    for (const [re, msg] of prohibidas) if (re.test(cuerpo)) err(msg);
    // Contracción: solo con marca explícita y revisada (11.4).
    if (destructivo.test(cuerpo) && !/^-- finn:contraer .+/m.test(sql))
      err('contiene cambios destructivos sin la marca «-- finn:contraer <motivo>» (11.4)');
  } else {
    if (!/^-- finn:manual\b/m.test(sql))
      err('una migración manual empieza con la marca «-- finn:manual»');
    // Escrituras de datos en tablas de hechos: exigen el bloqueo (ADR-06).
    if (escribeHechos.test(cuerpo) && !/finn\.tomar_bloqueo\(\)/.test(cuerpo))
      err('escribe en tablas de hechos sin finn.tomar_bloqueo()');
  }
}
if (errores.length) {
  console.error(errores.map((e) => '✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ ${carpetas.length} migraciones revisadas, sin problemas`);
