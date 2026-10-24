import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Lee infra/versiones.env (única fuente de versiones, 07 §5.1) como objeto. */
export function leerVersiones(raiz) {
  const texto = readFileSync(join(raiz, 'infra', 'versiones.env'), 'utf8');
  const out = {};
  for (const linea of texto.split(/\r?\n/)) {
    const m = /^([A-Z_]+)=(.*)$/.exec(linea.trim());
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}
