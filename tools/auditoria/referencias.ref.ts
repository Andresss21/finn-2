// Mide los HTML de referencia del diseño (docs/diseno) con el mismo medidor que la app.
// Salida: docs/auditoria-diseno/medidas-ref/<carpeta>__<archivo>.json
import { mkdirSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test as base, SALIDA } from './lib.ts';
import { medir } from './medir.ts';

// Las referencias se abren como archivo: sin el bloqueo de red de la E2E
const test = base.extend<{ redBloqueada: undefined }>({
  redBloqueada: [
    async ({}, usar) => {
      await usar(undefined);
    },
    { auto: true },
  ],
});

const DISENO = join(SALIDA, '..', 'diseno');
const RAICES = ['02-referencias/entrega-2/pantallas', '02-referencias/entrega-1/pantallas', 'entrega-3/pantallas'];
const DESTINO = join(SALIDA, 'medidas-ref');
mkdirSync(DESTINO, { recursive: true });

function* htmls(dir: string): Generator<string> {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* htmls(p);
    else if (n.endsWith('.html')) yield p;
  }
}

for (const raiz of RAICES) {
  const dir = join(DISENO, raiz);
  if (!existsSync(dir)) continue;
  test(`referencias ${raiz}`, async ({ browser }) => {
    test.setTimeout(1_800_000);
    for (const archivo of htmls(dir)) {
      const computadora = archivo.includes('computadora');
      const contexto = await browser.newContext({
        viewport: computadora ? { width: 1440, height: 900 } : { width: 390, height: 844 },
        deviceScaleFactor: 1,
        colorScheme: archivo.includes('oscuro') ? 'dark' : 'light',
        reducedMotion: 'reduce',
      });
      const page = await contexto.newPage();
      await page.goto(pathToFileURL(archivo).href);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const m = await page.evaluate(medir);
      const rel = relative(DISENO, archivo).split(sep).join('/');
      writeFileSync(
        join(DESTINO, rel.replace(/\.html$/, '').replaceAll('/', '~') + '.json'),
        JSON.stringify({ ref: rel, ...m }),
      );
      await contexto.close();
    }
  });
}
