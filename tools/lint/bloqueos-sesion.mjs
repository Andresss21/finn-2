// PRU-ESQ-POOL-001 (07 §19.5, CT-06, P7-21): nada de estado de sesión en `@finn/db` ni en `@finn/aplicacion`.
// Detrás del pooler en modo transacción, un bloqueo asesor de sesión o un `SET` sin `LOCAL` queda en la
// conexión del servidor y lo hereda otro cliente (07 §5.3, POOL-03 y POOL-04). La marca `finn.bloqueo_xact`
// solo la pone `finn.tomar_bloqueo()`: ponerla a mano falsificaría `finn.tiene_bloqueo()`.
// Solo mira `packages/db/src` y `packages/aplicacion/src`; las migraciones quedan fuera por diseño.
// Uso: node tools/lint/bloqueos-sesion.mjs [raíz]
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CARPETAS = ['packages/db/src', 'packages/aplicacion/src'];

const REGLAS = [
  {
    regla: 'advisory-lock',
    patron: /\bpg_advisory_lock\s*\(/gi,
    mensaje: 'bloqueo asesor de sesión',
  },
  {
    regla: 'try-advisory-lock',
    patron: /\bpg_try_advisory_lock\s*\(/gi,
    mensaje: 'bloqueo asesor de sesión (try)',
  },
  {
    regla: 'marca-a-mano',
    patron: /\bset_config\s*\(\s*['"`]finn\.bloqueo_xact['"`]/gi,
    mensaje: 'la marca finn.bloqueo_xact solo la pone finn.tomar_bloqueo() (CT-06)',
  },
];
// `SET ` sin `LOCAL`. El `SET` de columnas de un UPDATE (también `ON CONFLICT … DO UPDATE SET`) no es
// un ajuste: se reconoce porque la sentencia, desde el `;`, la comilla invertida o la comilla doble
// anterior, contiene `UPDATE`.
const SET = /\bSET\s+(?!LOCAL\b)/g;
const INICIO = /[;`"][^;`"]*$/;

function* fuentes(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') yield* fuentes(ruta);
    } else if (e.isFile()) yield ruta;
  }
}

const linea = (texto, i) => texto.slice(0, i).split('\n').length;

export function revisarTexto(texto) {
  const hallazgos = [];
  for (const { regla, patron, mensaje } of REGLAS)
    for (const m of texto.matchAll(patron))
      hallazgos.push({ regla, linea: linea(texto, m.index), mensaje });
  for (const m of texto.matchAll(SET)) {
    const antes = texto.slice(0, m.index);
    const sentencia = antes.slice(antes.search(INICIO) + 1);
    if (!/\bUPDATE\b/i.test(sentencia))
      hallazgos.push({
        regla: 'set-sin-local',
        linea: linea(texto, m.index),
        mensaje: 'SET sin LOCAL: el ajuste sobrevive a la transacción',
      });
  }
  return hallazgos.sort((a, b) => a.linea - b.linea);
}

export function verificarBloqueos(raiz) {
  const fallos = [];
  for (const carpeta of CARPETAS) {
    const dir = join(raiz, carpeta);
    if (!existsSync(dir)) continue;
    for (const archivo of fuentes(dir)) {
      const rel = relative(raiz, archivo).replaceAll('\\', '/');
      for (const h of revisarTexto(readFileSync(archivo, 'utf8')))
        fallos.push({ archivo: rel, ...h });
    }
  }
  return fallos;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const fallos = verificarBloqueos(process.argv[2] ?? process.cwd());
  for (const f of fallos) console.error(`[${f.regla}] ${f.archivo}:${f.linea}: ${f.mensaje}`);
  if (fallos.length > 0) process.exit(1);
  console.log(`bloqueos-sesion: sin bloqueos de sesión en ${CARPETAS.join(' ni ')}`);
}
