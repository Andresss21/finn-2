// Une `vitest list --json` y `playwright test --list --reporter=json` en pruebas/inventario.json, sin ejecutar nada (§2.1).
import { readFileSync, writeFileSync } from 'node:fs';
const [vitest, playwright, salida, raiz = ''] = process.argv.slice(2);
const inv: { titulo: string; archivo: string }[] = [];
for (const t of JSON.parse(readFileSync(vitest, 'utf8'))) inv.push({ titulo: t.name, archivo: t.file.replace(raiz, '') });
const recorrer = (s: any, dir: string) => { for (const sp of s.specs ?? []) inv.push({ titulo: sp.title, archivo: dir + sp.file }); for (const h of s.suites ?? []) recorrer(h, dir); };
const pw = JSON.parse(readFileSync(playwright, 'utf8')); for (const s of pw.suites) recorrer(s, 'apps/web/e2e/');
writeFileSync(salida, JSON.stringify(inv, null, 1)); console.log(`${inv.length} pruebas en ${salida}`);
