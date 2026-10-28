// tools/db/c4-explicar.mjs — informe de C4 cuando sale con 2 (07 §32.1, P7-12; TA-052).
// Si el diff cambia el DEFAULT de alguna de las 9 columnas de CT-02 (03, enmiendas: CT-02), agrega la
// línea "P7-12: aplicar el respaldo b)"; si no, devuelve el diff tal cual, sin interpretarlo.
// Uso: `explicar(diff)` desde c4.mjs, o `node tools/db/c4-explicar.mjs < diff.sql`.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Las 9 columnas de CT-02, por tabla (03, enmiendas posteriores: CT-02 y CT-06). */
export const COLUMNAS_CT02 = {
  sms_recibidos: ['recibido_en'],
  sms_procesamientos: ['procesado_en'],
  cambios_posteriores: ['registrado_en'],
  eliminaciones: ['eliminada_en'],
  suscripciones_push: ['creada_en', 'renovada_en'],
  notificaciones: ['creada_en'],
  eventos_sistema: ['ocurrido_en'],
  token_webhook: ['creado_en'],
};

export const LINEA_P7_12 = 'P7-12: aplicar el respaldo b)';

/** Las columnas de CT-02 cuyo DEFAULT cambia en el diff, como `tabla.columna`. */
export function columnasConDefault(diff) {
  const halladas = new Set();
  // Una sentencia `ALTER TABLE "finn"."t" …;` puede traer varias `ALTER COLUMN "c" SET DEFAULT …`
  for (const [, tabla = '', cuerpo = ''] of diff.matchAll(
    /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:"?\w+"?\.)?"?(\w+)"?([^;]*)/gi,
  )) {
    const columnas = COLUMNAS_CT02[tabla] ?? [];
    for (const [, columna = ''] of cuerpo.matchAll(/ALTER\s+COLUMN\s+"?(\w+)"?\s+SET\s+DEFAULT/gi))
      if (columnas.includes(columna)) halladas.add(`${tabla}.${columna}`);
  }
  return [...halladas].sort();
}

/** El informe: el diff y, si toca una columna de CT-02, la línea de P7-12 con las columnas. */
export function explicar(diff) {
  const columnas = columnasConDefault(diff);
  const texto = diff.endsWith('\n') ? diff : `${diff}\n`;
  return columnas.length ? `${texto}${LINEA_P7_12} (${columnas.join(', ')})\n` : texto;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href)
  process.stdout.write(explicar(readFileSync(0, 'utf8')));
