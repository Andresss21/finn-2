// `pnpm ci:politica-patrones` (04 §8.5 y §14.1, QC-3): `validarFormato` sobre cada formato bancario
// activo. Requisito solo de `desplegar`; falla mientras F-1..F-3 de 03 §9.5 sigan sin reescribir.
//
// Fuente de los formatos:
// - Si alguna migración de packages/db toca `formatos_bancarios`, la fuente es la base de CI con las
//   migraciones aplicadas (04 §14.1). Esa lectura todavía no existe: el script falla cerrado.
// - Si no (hoy: no hay siembra ni migraciones en el repositorio), la siembra aprobada de 03 §10.4
//   (bloque "9.5 Formatos bancarios"), tal como la va a ejecutar la migración de siembra.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validarFormato } from '../../packages/sms/src/validar-formato.ts';
import type { FormatoSms } from '../../packages/sms/src/interpretar.ts';
import type { FormatoFecha } from '../../packages/sms/src/normalizadores.ts';

const raiz = process.argv[2] ?? process.cwd();
const MIGRACIONES = join(raiz, 'packages/db/prisma/migrations');
const SIEMBRA_03 = join(raiz, 'docs/03-base-de-datos.md');

/** Migraciones que escriben formatos: si hay alguna, el texto de 03 deja de ser la fuente. */
function migracionesConFormatos(): string[] {
  if (!existsSync(MIGRACIONES)) return [];
  return readdirSync(MIGRACIONES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(MIGRACIONES, d.name, 'migration.sql'))
    .filter((f) => existsSync(f) && /formatos_bancarios/i.test(readFileSync(f, 'utf8')))
    .map((f) => f.slice(raiz.length + 1).replaceAll('\\', '/'));
}

const literal = (s: string): string => s.slice(1, -1).replaceAll("''", "'"); // SQL estándar

/** Filas del INSERT de 03 §10.4, bloque 9.5. Todas activas (`activo` DEFAULT true, 03 §3.21). */
function formatosDeLaSiembra(texto: string): FormatoSms[] {
  const inicio = texto.indexOf('INSERT INTO finn.formatos_bancarios');
  const fin = texto.indexOf('ON CONFLICT', inicio);
  if (inicio < 0 || fin < 0) throw new Error('no se encontró la siembra de formatos de 03 §9.5');
  const valores = texto.slice(inicio, fin);
  const cadena = String.raw`'(?:[^']|'')*'`;
  const fila = new RegExp(
    String.raw`\(\s*\w+\s*,((?:\s*${cadena}\s*,){6})\s*ARRAY\[([^\]]*)\]\s*\)`,
    'g',
  );
  return [...valores.matchAll(fila)].map((m) => {
    const [nombre, tipo, patron, banderas, miles, decimal] = [
      ...(m[1] ?? '').matchAll(new RegExp(cadena, 'g')),
    ].map((c) => literal(c[0]));
    const fechas = [...(m[2] ?? '').matchAll(new RegExp(cadena, 'g'))].map((c) => literal(c[0]));
    return {
      id: nombre ?? '',
      institucionId: '',
      nombre: nombre ?? '',
      tipoMovimiento: tipo as FormatoSms['tipoMovimiento'],
      patron: patron ?? '',
      banderas: banderas ?? '',
      montoSeparadorMiles: miles as FormatoSms['montoSeparadorMiles'],
      montoSeparadorDecimal: decimal as FormatoSms['montoSeparadorDecimal'],
      formatosFecha: fechas as FormatoFecha[],
      activo: true,
    };
  });
}

function main(): number {
  const migraciones = migracionesConFormatos();
  if (migraciones.length > 0) {
    console.error(
      `politica-patrones: ${migraciones.join(', ')} escribe formatos_bancarios; la fuente pasa a ser la ` +
        'base de CI con las migraciones aplicadas (04 §14.1), que este script todavía no lee. Falla cerrado.',
    );
    return 1;
  }
  const activos = formatosDeLaSiembra(readFileSync(SIEMBRA_03, 'utf8')).filter((f) => f.activo);
  console.log(`politica-patrones: ${activos.length} formatos activos de la siembra de 03 §9.5`);
  if (activos.length === 0) {
    console.error('politica-patrones: ningún formato activo leído; la fuente está mal');
    return 1;
  }
  let fallas = 0;
  for (const f of activos) {
    const v = validarFormato(f);
    if (v.valido) {
      console.log(`  pasa   ${f.nombre} (grado ${v.grado ?? 'seguro'})`);
      continue;
    }
    fallas++;
    const detalle =
      v.error === 'patron_lento'
        ? ` grado ${v.grado ?? 'sin terminar (unknown)'}${v.ataque === '' ? '' : `, ataque ${v.ataque}`}`
        : '';
    console.error(`  FALLA  ${f.nombre}: ${v.error}${detalle}`);
  }
  console.log(
    fallas === 0
      ? 'RESULTADO: PASA'
      : `RESULTADO: FALLA (${fallas} de ${activos.length}; BE-46, se corrige reescribiendo los patrones, QC-3)`,
  );
  return fallas === 0 ? 0 : 1;
}

process.exitCode = main();
