// L21 (07 §32.1, respaldo b) de P7-12; CT-02, TA-157): ninguna inserción en las tablas de las 9 columnas de
// instantes técnicos sin la columna. Esas columnas conservan `DEFAULT now()`, que no ve el reloj simulado; la
// aplicación las escribe con `finn.ahora()` (`ahoraDb()` y `conAhora()` de packages/db/src/ahora.ts).
// Mira el código de producción de `packages/db/src` (sin el cliente generado) y `packages/aplicacion/src`:
// - prisma:   `.<modelo>.create|createMany|createManyAndReturn|upsert(…)` cuyo argumento no pasa por
//             `conAhora(` ni nombra cada columna del modelo;
// - sql:      `INSERT INTO [finn.]<tabla>` sin lista de columnas o con una lista que no tiene cada columna;
// - dinamico: `[…].create…(…)` sin `conAhora(`: con el modelo en una variable, L21 no puede ver la tabla.
// Las migraciones quedan fuera: la de la base es `tg_registrar_eliminacion` (m_eliminaciones_ahora).
// Uso: node tools/lint/l21.mjs [raíz]
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CARPETAS = ['packages/db/src', 'packages/aplicacion/src'];

// Las 9 columnas de CT-02 (03 §3.17–§3.28): tabla, modelo de Prisma, columnas en SQL y en Prisma
export const TABLAS = [
  ['sms_recibidos', 'smsRecibido', ['recibido_en'], ['recibidoEn']],
  ['sms_procesamientos', 'smsProcesamiento', ['procesado_en'], ['procesadoEn']],
  ['cambios_posteriores', 'cambioPosterior', ['registrado_en'], ['registradoEn']],
  ['eliminaciones', 'eliminacion', ['eliminada_en'], ['eliminadaEn']],
  [
    'suscripciones_push',
    'suscripcionPush',
    ['creada_en', 'renovada_en'],
    ['creadaEn', 'renovadaEn'],
  ],
  ['notificaciones', 'notificacion', ['creada_en'], ['creadaEn']],
  ['eventos_sistema', 'eventoSistema', ['ocurrido_en'], ['ocurridoEn']],
  ['token_webhook', 'tokenWebhook', ['creado_en'], ['creadoEn']],
];

const INSERCION = 'create|createMany|createManyAndReturn|upsert';
const PRISMA = new RegExp(
  String.raw`\.\s*(${TABLAS.map((t) => t[1]).join('|')})\s*\.\s*(?:${INSERCION})\s*\(`,
  'g',
);
const DINAMICO = new RegExp(String.raw`\]\s*\.\s*(?:${INSERCION})\s*\(`, 'g');
const SQL = new RegExp(
  String.raw`\bINSERT\s+INTO\s+(?:"?finn"?\s*\.\s*)?"?(${TABLAS.map((t) => t[0]).join('|')})\b"?\s*(\()?`,
  'gi',
);

/** El texto entre el `(` en `abre` y su `)`, contando paréntesis. */
function hastaCierre(texto, abre) {
  let nivel = 0;
  for (let i = abre; i < texto.length; i++) {
    if (texto[i] === '(') nivel++;
    else if (texto[i] === ')' && --nivel === 0) return texto.slice(abre + 1, i);
  }
  return texto.slice(abre + 1);
}

const nombra = (texto, columnas) => columnas.every((c) => new RegExp(`\\b${c}\\b`).test(texto));
const linea = (texto, i) => texto.slice(0, i).split('\n').length;

export function revisarTexto(texto) {
  const hallazgos = [];
  for (const m of texto.matchAll(PRISMA)) {
    const [, , , campos = []] = TABLAS.find((t) => t[1] === m[1]) ?? [];
    const arg = hastaCierre(texto, m.index + m[0].length - 1);
    if (!arg.includes('conAhora(') && !nombra(arg, campos))
      hallazgos.push({
        regla: 'prisma',
        linea: linea(texto, m.index),
        mensaje: `${m[1]} sin ${campos.join(' ni ')}: usá conAhora(…, ahoraDb(tx))`,
      });
  }
  for (const m of texto.matchAll(DINAMICO))
    if (!hastaCierre(texto, m.index + m[0].length - 1).includes('conAhora('))
      hallazgos.push({
        regla: 'dinamico',
        linea: linea(texto, m.index),
        mensaje: 'inserción con el modelo en una variable sin conAhora(): L21 no ve la tabla',
      });
  for (const m of texto.matchAll(SQL)) {
    const [, , columnas = []] = TABLAS.find((t) => t[0] === m[1].toLowerCase()) ?? [];
    const lista = m[2] ? hastaCierre(texto, m.index + m[0].length - 1) : '';
    if (!nombra(lista.toLowerCase(), columnas))
      hallazgos.push({
        regla: 'sql',
        linea: linea(texto, m.index),
        mensaje: `INSERT INTO ${m[1]} sin ${columnas.join(' ni ')} = finn.ahora()`,
      });
  }
  return hallazgos.sort((a, b) => a.linea - b.linea);
}

function* fuentes(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== 'generado') yield* fuentes(ruta);
    } else if (e.isFile() && /\.[cm]?[jt]s$/.test(e.name) && !/\.test\.[cm]?[jt]s$/.test(e.name))
      yield ruta;
  }
}

export function verificarL21(raiz) {
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
  const fallos = verificarL21(process.argv[2] ?? process.cwd());
  for (const f of fallos) console.error(`[${f.regla}] ${f.archivo}:${f.linea}: ${f.mensaje}`);
  if (fallos.length > 0) process.exit(1);
  console.log(`L21: toda inserción con sus instantes técnicos en ${CARPETAS.join(' y ')}`);
}
