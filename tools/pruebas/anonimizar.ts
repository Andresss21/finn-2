// Anonimización de las muestras reales (07 §23, CH-03, TA-180). La corre el usuario, sin ningún agente
// activo, sobre la carpeta privada (TU-13, TU-14):
//   FINN_ULTIMOS4_REALES=… node tools/pruebas/anonimizar.ts C:/finn/_privado C:/finn/repo
// Entrada: nombres.txt (una persona por línea, variantes con "|"), sms/{bac,agricola,cuscatlan}.txt
// (un SMS por bloque, separados por una línea vacía) y csv/<formato de ADR-17>*.csv.
// Salida: packages/sms/pruebas/muestras/, packages/conciliacion/pruebas/muestras/ y
// pruebas/muestras-cobertura.json. Si alguna salida no pasa PRU-SEG-BAND-002, no escribe nada.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';

export interface Config {
  ultimos4: readonly string[]; // orden de FINN_ULTIMOS4_REALES: el i-ésimo pasa a 000i
  nombres: readonly (readonly string[])[]; // la i-ésima persona pasa a "PERSONA <letra i>"
}

const SMS_DIR = 'packages/sms/pruebas/muestras';
const CSV_DIR = 'packages/conciliacion/pruebas/muestras';
const COBERTURA = 'pruebas/muestras-cobertura.json';
const INSTITUCIONES: Record<string, string> = {
  bac: 'BAC',
  agricola: 'Banco Agrícola',
  cuscatlan: 'Cuscatlán',
}; // 03 §9.4
const FORMATOS: Record<string, string> = {
  bac_tarjeta: 'BAC',
  bac_debito: 'BAC',
  ba_tarjeta_portal: 'Banco Agrícola',
  ba_tarjeta_pdf_csv: 'Banco Agrícola',
  ba_debito: 'Banco Agrícola',
  cuscatlan_tarjeta: 'Cuscatlán',
}; // ADR-17, los ids de @finn/conciliacion
const TIPOS = ['rechazo', 'devolucion', 'avance', 'pago_tarjeta', 'deposito', 'compra'] as const;
const CLAVES: Record<(typeof TIPOS)[number], RegExp> = {
  rechazo: /rechaz|denegad|declinad/,
  devolucion: /devoluci|reverso|reembolso/,
  avance: /avance|retiro/,
  pago_tarjeta: /\bpago\b/,
  deposito: /deposito|abono|acredit|transferencia recibida/,
  compra: /compra|consumo/,
};

// ---------------------------------------------------------------- el control (PRU-SEG-BAND-002)
export function leerUltimos4(valor: string): string[] {
  const lista = [
    ...new Set(
      valor
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  const malos = lista.filter((s) => !/^\d{4}$/.test(s));
  if (malos.length > 0)
    throw new Error(`FINN_ULTIMOS4_REALES: no son 4 dígitos: ${malos.join(', ')}`);
  if (lista.length > 10) throw new Error('FINN_ULTIMOS4_REALES: más de 10 (07 §23: 0000 a 0009)');
  return lista;
}

/** Lo que haría fallar el control: 13 o más dígitos seguidos o unos últimos 4 reales sueltos. */
export function revisar(texto: string, ultimos4: readonly string[]): string[] {
  const hallazgos: string[] = [];
  texto.split(/\r?\n/).forEach((linea, i) => {
    for (const [s] of linea.matchAll(/\d{13,}/g))
      hallazgos.push(`línea ${i + 1}: secuencia de ${s.length} dígitos`);
    for (const [s] of linea.matchAll(/(?<!\d)\d{4}(?!\d)/g))
      if (ultimos4.includes(s)) hallazgos.push(`línea ${i + 1}: últimos 4 reales ${s}`);
  });
  return hallazgos;
}

export function archivosDeMuestras(raiz: string): string[] {
  return [SMS_DIR, CSV_DIR]
    .map((d) => join(raiz, d))
    .filter((d) => existsSync(d))
    .flatMap((d) =>
      readdirSync(d, { recursive: true, withFileTypes: true })
        .filter((f) => f.isFile())
        .map((f) => join(f.parentPath, f.name)),
    )
    .sort();
}

// ---------------------------------------------------------------- los reemplazos de 07 §23
const escapar = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ceros = (s: string): string => s.replace(/\d/g, '0');
const esFecha = (s: string): boolean =>
  /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$|^\d{1,2}[/-]\d{1,2}[/-](\d{2}|\d{4})$/.test(s) ||
  /^20\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/.test(s); // AAAAMMDD de los SMS del BAC
const esMonto = (s: string): boolean =>
  /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+\.\d{1,2}$|^\d{1,3}(\.\d{3})*,\d{2}$/.test(s);
const esHora = (s: string): boolean => /^\d{1,2}:\d{2}(:\d{2})?$/.test(s);
// Un número con sus separadores; la coma solo como separador de miles, no como la del CSV.
const NUMERO = /\d+(?:(?:[./:-]|(?<=(?<!\d)\d{1,3}(?:,\d{3})*),(?=\d{3}(?!\d)))\d+)*/g;

export function anonimizarTexto(texto: string, c: Config): { texto: string; avisos: string[] } {
  const avisos: string[] = [];
  let t = texto;
  const variantes = c.nombres
    .flatMap((vs, i) => vs.map((v) => ({ v, p: `PERSONA ${String.fromCharCode(65 + i)}` })))
    .sort((a, b) => b.v.length - a.v.length);
  for (const { v, p } of variantes)
    t = t.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapar(v)}(?![\\p{L}\\p{N}])`, 'giu'), p);
  // Tarjeta completa con espacios: los primeros grupos a ceros; el último, como últimos 4.
  t = t.replace(
    /(?<![\d.,])\d{4}(?: \d{4}){2,3}(?!\d)/g,
    (s) => ceros(s.slice(0, -4)) + s.slice(-4),
  );
  // Cuentas y referencias a ceros de la misma longitud; montos, fechas y horas se conservan.
  t = t.replace(NUMERO, (s) => {
    if (esFecha(s) || esMonto(s) || esHora(s)) return s;
    if (s.replace(/\D/g, '').length >= 8) return ceros(s);
    return s.replace(/\d{5,}/g, ceros);
  });
  // Últimos 4 enmascarados (****1234): si no están en la lista, no se adivinan.
  for (const [s] of t.matchAll(/(?<=(?:[*•#]{2,}|[xX]{4,})[- ]?)\d{4}(?!\d)/g))
    if (!c.ultimos4.includes(s))
      throw new Error(`últimos 4 enmascarados ${s} que no están en FINN_ULTIMOS4_REALES`);
  t = t.replace(/(?<!\d)\d{4}(?!\d)/g, (s, i: number, todo: string) => {
    const k = c.ultimos4.indexOf(s);
    if (k < 0) return s;
    if (
      /[./:,-]\d/.test(todo.slice(i + 4, i + 6)) ||
      /\d[./:,-]/.test(todo.slice(Math.max(0, i - 2), i))
    )
      avisos.push(`unos últimos 4 reales dentro de un monto o una fecha pasaron a 000${k}`);
    return `000${k}`;
  });
  return { texto: t, avisos };
}

export function clasificarSms(bloque: string): { tipo: string; texto: string } {
  const m = /^tipo:\s*(\S+)\s*\r?\n/.exec(bloque);
  if (m) {
    const tipo = m[1] ?? '';
    if (!(TIPOS as readonly string[]).includes(tipo))
      throw new Error(`tipo desconocido "${tipo}" (${TIPOS.join(', ')})`);
    return { tipo, texto: bloque.slice(m[0].length) };
  }
  const plano = bloque.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return { tipo: TIPOS.find((x) => CLAVES[x].test(plano)) ?? 'sin_clasificar', texto: bloque };
}

// ---------------------------------------------------------------- codificación (04 §9.3)
const CP1252 = new TextDecoder('windows-1252').decode(
  Uint8Array.from({ length: 256 }, (_, i) => i),
);

function decodificar(bytes: Uint8Array): { texto: string; utf8: boolean } {
  try {
    return {
      texto: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes),
      utf8: true,
    };
  } catch {
    return { texto: new TextDecoder('windows-1252').decode(bytes), utf8: false };
  }
}

function codificar(texto: string, utf8: boolean): Uint8Array {
  if (utf8) return new TextEncoder().encode(texto);
  // Windows-1252 es de un byte por carácter: cada unidad UTF-16 es un byte.
  return Uint8Array.from({ length: texto.length }, (_, i) => {
    const b = CP1252.indexOf(texto.charAt(i));
    if (b < 0) throw new Error(`"${texto.charAt(i)}" no existe en Windows-1252`);
    return b;
  });
}

// ---------------------------------------------------------------- la corrida
interface Cobertura {
  sms: { institucion: string; archivo: string; tipos: Record<string, number> }[];
  csv: { formato: string; institucion: string; archivos: string[] }[];
}

const listar = (d: string): string[] => (existsSync(d) ? readdirSync(d).sort() : []);

export async function ejecutar(
  entrada: string,
  repo: string,
  ultimos4Env: string | undefined,
): Promise<{ escritos: string[]; avisos: string[] }> {
  if ((ultimos4Env ?? '').trim() === '') throw new Error('falta FINN_ULTIMOS4_REALES (TU-12)');
  const ultimos4 = leerUltimos4(ultimos4Env ?? '');
  const rutaNombres = join(entrada, 'nombres.txt');
  if (!existsSync(rutaNombres)) throw new Error(`falta ${rutaNombres} (puede estar vacío)`);
  const nombres = readFileSync(rutaNombres, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '' && !l.startsWith('#'))
    .map((l) =>
      l
        .split('|')
        .map((v) => v.trim())
        .filter(Boolean),
    );
  const config: Config = { ultimos4, nombres };
  const salidas = new Map<string, Uint8Array>(); // ruta relativa al repositorio → contenido
  const avisos: string[] = [];
  const cob: Cobertura = { sms: [], csv: [] };

  for (const archivo of listar(join(entrada, 'sms'))) {
    const clave = archivo.replace(/\.txt$/, '');
    const institucion = INSTITUCIONES[clave];
    if (institucion === undefined || !archivo.endsWith('.txt'))
      throw new Error(`sms/${archivo}: se espera ${Object.keys(INSTITUCIONES).join('|')}.txt`);
    const tipos: Record<string, number> = {};
    const bloques = decodificar(readFileSync(join(entrada, 'sms', archivo)))
      .texto.split(/\r?\n[ \t]*\r?\n/)
      .map((b) => b.trim())
      .filter(Boolean)
      .map((b, i) => {
        const { tipo, texto } = clasificarSms(b);
        if (tipo === 'sin_clasificar') avisos.push(`sms/${archivo} bloque ${i + 1}: sin tipo`);
        tipos[tipo] = (tipos[tipo] ?? 0) + 1;
        const r = anonimizarTexto(texto, config);
        avisos.push(...r.avisos.map((a) => `sms/${archivo} bloque ${i + 1}: ${a}`));
        return r.texto;
      });
    const destino = `${SMS_DIR}/${clave}.txt`;
    salidas.set(destino, new TextEncoder().encode(bloques.join('\n\n') + '\n'));
    cob.sms.push({ institucion, archivo: destino, tipos });
  }

  const ids = Object.keys(FORMATOS).join('|');
  for (const archivo of listar(join(entrada, 'csv'))) {
    const formato = new RegExp(`^(${ids})(?![a-z_])`).exec(archivo)?.[1];
    if (formato === undefined || !archivo.toLowerCase().endsWith('.csv'))
      throw new Error(
        `csv/${archivo}: el nombre empieza con el formato (${ids}) y termina en .csv`,
      );
    let fila = cob.csv.find((x) => x.formato === formato);
    if (fila === undefined) {
      fila = { formato, institucion: FORMATOS[formato] ?? '', archivos: [] };
      cob.csv.push(fila);
    }
    const destino = `${CSV_DIR}/${formato}-${String(fila.archivos.length + 1).padStart(2, '0')}.csv`;
    const { texto, utf8 } = decodificar(readFileSync(join(entrada, 'csv', archivo)));
    const r = anonimizarTexto(texto, config);
    avisos.push(...r.avisos.map((a) => `csv/${archivo}: ${a}`));
    salidas.set(destino, codificar(r.texto, utf8));
    fila.archivos.push(destino);
  }

  // El control antes de escribir: todo o nada.
  const hallazgos = [...salidas].flatMap(([ruta, bytes]) =>
    revisar(decodificar(bytes).texto, ultimos4).map((h) => `${ruta}: ${h}`),
  );
  if (hallazgos.length > 0)
    throw new Error(
      `no se escribió nada; la salida no pasaría PRU-SEG-BAND-002:\n${hallazgos.join('\n')}`,
    );

  // Cobertura acumulada: TU-14 corre después con solo Banco Agrícola y conserva lo del BAC.
  const rutaCob = join(repo, COBERTURA);
  const previa = existsSync(rutaCob)
    ? (JSON.parse(readFileSync(rutaCob, 'utf8')) as Cobertura)
    : { sms: [], csv: [] };
  const orden = Object.values(INSTITUCIONES);
  const cobertura: Cobertura = {
    sms: [
      ...previa.sms.filter((x) => !cob.sms.some((n) => n.institucion === x.institucion)),
      ...cob.sms,
    ].sort((a, b) => orden.indexOf(a.institucion) - orden.indexOf(b.institucion)),
    csv: [
      ...previa.csv.filter((x) => !cob.csv.some((n) => n.formato === x.formato)),
      ...cob.csv,
    ].sort((a, b) => a.formato.localeCompare(b.formato)),
  };
  const json = JSON.stringify(cobertura);
  const opciones = { ...(await resolveConfig(rutaCob)), parser: 'json' };
  salidas.set(COBERTURA, new TextEncoder().encode(await format(json, opciones)));
  // Las muestras anteriores de un formato que llega de nuevo se reemplazan, no se suman.
  for (const { formato } of cob.csv)
    for (const viejo of listar(join(repo, CSV_DIR)))
      if (viejo.startsWith(`${formato}-`)) rmSync(join(repo, CSV_DIR, viejo));
  for (const [ruta, bytes] of salidas) {
    mkdirSync(join(repo, ruta, '..'), { recursive: true });
    writeFileSync(join(repo, ruta), bytes);
  }
  return { escritos: [...salidas.keys()], avisos };
}

// ---------------------------------------------------------------- CLI
if (import.meta.main) {
  const [entrada, repo] = process.argv.slice(2);
  if (entrada === undefined || repo === undefined) {
    console.error('uso: node tools/pruebas/anonimizar.ts <carpeta privada> <repositorio>');
    process.exit(2);
  }
  try {
    const r = await ejecutar(entrada, repo, process.env['FINN_ULTIMOS4_REALES']);
    for (const a of r.avisos) console.warn(`aviso: ${a}`);
    for (const e of r.escritos) console.log(`escrito: ${e}`);
    console.log('Revisá a mano el resultado y `git grep -nE "[0-9]{13,19}"` (TU-13, paso 4).');
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
