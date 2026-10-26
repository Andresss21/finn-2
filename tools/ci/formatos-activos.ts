// Formatos bancarios que dejan la siembra y las migraciones (04 §8.5 QC-3, §14.1; TA-181).
// Mientras no haya base de CI con las migraciones aplicadas, se reproduce lo que esa base tendría:
// la siembra de 03 §9.5 (o la migración que la ejecuta, si ya está en el repositorio) y después,
// en orden de carpeta, cada sentencia de las migraciones que nombra `formatos_bancarios`. Solo se
// entienden dos formas; cualquier otra hace fallar la lectura (falla cerrada, nunca se ignora).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FormatoSms } from '../../packages/sms/src/interpretar.ts';
import type { FormatoFecha } from '../../packages/sms/src/normalizadores.ts';

export interface Migracion {
  nombre: string;
  sql: string;
}

const CADENA = String.raw`'(?:[^']|'')*'`;
const literal = (s: string): string => s.slice(1, -1).replaceAll("''", "'"); // SQL estándar
const cadenas = (s: string): string[] =>
  [...s.matchAll(new RegExp(CADENA, 'g'))].map((c) => literal(c[0]));

/** Filas `(v_institucion, nombre, tipo, patron, banderas, miles, decimal, ARRAY[fechas])`; activas por DEFAULT. */
function filas(valores: string): FormatoSms[] {
  const fila = new RegExp(
    String.raw`\(\s*\w+\s*,((?:\s*${CADENA}\s*,){6})\s*ARRAY\[([^\]]*)\]\s*\)`,
    'g',
  );
  return [...valores.matchAll(fila)].map((m) => {
    const [nombre = '', tipo, patron = '', banderas = '', miles, decimal] = cadenas(m[1] ?? '');
    return {
      id: nombre,
      institucionId: '',
      nombre,
      tipoMovimiento: tipo as FormatoSms['tipoMovimiento'],
      patron,
      banderas,
      montoSeparadorMiles: miles as FormatoSms['montoSeparadorMiles'],
      montoSeparadorDecimal: decimal as FormatoSms['montoSeparadorDecimal'],
      formatosFecha: cadenas(m[2] ?? '') as FormatoFecha[],
      activo: true, // `activo` DEFAULT true (03 §3.21)
    };
  });
}

/** El INSERT de 03 §10.4, bloque "9.5 Formatos bancarios". */
export function formatosDeLaSiembra(texto: string): FormatoSms[] {
  const inicio = texto.indexOf('INSERT INTO finn.formatos_bancarios');
  const fin = texto.indexOf('ON CONFLICT', inicio);
  if (inicio < 0 || fin < 0) throw new Error('no se encontró la siembra de formatos de 03 §9.5');
  return filas(texto.slice(inicio, fin));
}

/** Sentencias sin comentarios de línea; respeta los literales entre comillas simples. */
function sentencias(sql: string): string[] {
  const salida: string[] = [];
  let actual = '';
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i] ?? '';
    if (c === "'") {
      const fin = new RegExp(CADENA, 'y');
      fin.lastIndex = i;
      const m = fin.exec(sql);
      if (m === null) throw new Error('literal sin cerrar');
      actual += m[0];
      i += m[0].length - 1;
    } else if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      actual += '\n';
    } else if (c === ';') {
      salida.push(actual.trim());
      actual = '';
    } else actual += c;
  }
  if (actual.trim() !== '') salida.push(actual.trim());
  return salida;
}

const COLUMNAS: Record<string, keyof FormatoSms> = {
  tipo_movimiento: 'tipoMovimiento',
  patron: 'patron',
  banderas: 'banderas',
  monto_separador_miles: 'montoSeparadorMiles',
  monto_separador_decimal: 'montoSeparadorDecimal',
  formatos_fecha: 'formatosFecha',
  activo: 'activo',
};
const VALOR = String.raw`${CADENA}|true|false|ARRAY\[(?:\s*${CADENA}\s*,?)*\s*\]`;
const UPDATE = new RegExp(
  String.raw`^UPDATE\s+finn\.formatos_bancarios\s+SET\s+([\s\S]+?)\s+WHERE\s+nombre\s*(?:=\s*(${CADENA})|IN\s*\(((?:\s*${CADENA}\s*,?)+)\))$`,
  'i',
);

/** `col = valor, …` de un UPDATE, con los valores ya convertidos. */
function asignaciones(set: string): Partial<FormatoSms> {
  const una = new RegExp(String.raw`\s*(\w+)\s*=\s*(${VALOR})\s*(,|$)`, 'iy');
  const cambios: Record<string, unknown> = {};
  let fin = false;
  while (!fin) {
    const m = una.exec(set);
    const campo = COLUMNAS[(m?.[1] ?? '').toLowerCase()];
    if (m === null || campo === undefined) throw new Error(`asignación no reconocida en «${set}»`);
    const v = m[2] ?? '';
    cambios[campo] = /^ARRAY/i.test(v)
      ? cadenas(v)
      : /^(true|false)$/i.test(v)
        ? /^true$/i.test(v)
        : literal(v);
    fin = m[3] === '';
  }
  return cambios;
}

/** Aplica, en orden, las sentencias de cada migración que nombran `formatos_bancarios`. */
export function aplicarMigraciones(
  base: readonly FormatoSms[],
  migraciones: readonly Migracion[],
): FormatoSms[] {
  let formatos = base.map((f) => ({ ...f }));
  for (const { nombre, sql } of migraciones)
    for (const s of sentencias(sql).filter((x) => /formatos_bancarios/i.test(x))) {
      const falla = (motivo: string): never => {
        throw new Error(`${nombre}: ${motivo}: «${s.slice(0, 120)}»`);
      };
      if (/^INSERT\s+INTO\s+finn\.formatos_bancarios\b/i.test(s)) {
        const nuevas = filas(s);
        if (nuevas.length === 0) falla('INSERT sin filas reconocibles');
        // ON CONFLICT (institucion_id, nombre) DO NOTHING: un nombre existente no cambia.
        formatos = [
          ...formatos,
          ...nuevas.filter((n) => !formatos.some((f) => f.nombre === n.nombre)),
        ];
        continue;
      }
      const m =
        UPDATE.exec(s) ?? falla('sentencia sobre formatos_bancarios que esta lectura no entiende');
      const nombres = m[2] !== undefined ? [literal(m[2])] : cadenas(m[3] ?? '');
      const cambios = asignaciones(m[1] ?? '');
      for (const n of nombres)
        if (!formatos.some((f) => f.nombre === n)) falla(`no hay formato «${n}»`);
      formatos = formatos.map((f) => (nombres.includes(f.nombre) ? { ...f, ...cambios } : f));
    }
  return formatos;
}

/** Siembra + migraciones del repositorio, y de dónde salió cada parte (para el registro de CI). */
export function leerFormatos(raiz: string): { formatos: FormatoSms[]; fuentes: string[] } {
  const dir = join(raiz, 'packages/db/prisma/migrations');
  const migraciones: Migracion[] = (
    existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []
  )
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'migration.sql')))
    .map((d) => d.name)
    .sort()
    .map((nombre) => ({ nombre, sql: readFileSync(join(dir, nombre, 'migration.sql'), 'utf8') }))
    .filter((m) => /formatos_bancarios/i.test(m.sql));
  // Si la migración de siembra (TA-051) todavía no está, su INSERT es el aprobado de 03 §10.4.
  const sembrada = migraciones.some((m) =>
    sentencias(m.sql).some((s) => /^INSERT\s+INTO\s+finn\.formatos_bancarios\b/i.test(s)),
  );
  const base = sembrada
    ? []
    : formatosDeLaSiembra(readFileSync(join(raiz, 'docs/03-base-de-datos.md'), 'utf8'));
  return {
    formatos: aplicarMigraciones(base, migraciones),
    fuentes: [...(sembrada ? [] : ['siembra de 03 §10.4']), ...migraciones.map((m) => m.nombre)],
  };
}
