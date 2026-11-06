// LCP y CLS (05 §13.4, FE-48; 07 §6.6): corre solo en el job `ren` del nocturno (FINN_REN=1). Superar un presupuesto no falla la
// prueba: la medida va a test-results/ren/web.json y tools/pruebas/volumen/registrar.ts abre el aviso y fija FINN_REN_ROJO. Lo que
// aquí falla es no poder medir: sin la sesión AAL2 de `configuracion` o sin alguna de las seis rutas de 05 §13.4. El INP y V5-11
// están en inp.e2e.ts.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, expect, test } from '@playwright/test';
import { mediana, rutasDeFinn } from '../../../../tools/pruebas/rendimiento/clasificar.ts';
import { NOCTURNO, P, SESION, leer, registrar, sembrarBase, soloNocturno } from './medidas.ts';

const LHCI = '.lighthouseci';

const existeRuta = (ruta: string): boolean =>
  rutasDeFinn(leer('.next/app-path-routes-manifest.json') as Record<string, string>).some(
    (r) => r.ruta === ruta || (ruta === '/reportes/tendencia' && r.ruta === '/reportes/[tipo]'),
  );

test.describe('PRU-REN-PWA tiempos', () => {
  test.describe.configure({ timeout: 1_800_000 }); // Lighthouse: 3 corridas de 6 rutas

  test('PRU-REN-PWA-003 [V5-26] LCP y CLS: mediana de 3 de Lighthouse CI por ruta, contra 05 §13.1', async () => {
    test.skip(soloNocturno, NOCTURNO);
    expect(existsSync(SESION), 'la sesión AAL2 del proyecto configuracion').toBe(true);
    const urls = (leer('../../lighthouserc.json') as { ci: { collect: { url: string[] } } }).ci
      .collect.url;
    expect(urls.filter((u) => !existeRuta(new URL(u).pathname))).toEqual([]);
    await sembrarBase(); // las seis rutas con contenido, no la base vacía que dejó la prueba anterior
    rmSync(LHCI, { recursive: true, force: true });
    const r = spawnSync(
      'pnpm',
      [
        'exec',
        'lhci',
        'collect',
        '--config=../../lighthouserc.json',
        `--chromePath=${chromium.executablePath()}`,
      ],
      { stdio: 'inherit', shell: process.platform === 'win32' },
    );
    expect(r.status, 'lhci collect').toBe(0);
    const porRuta = new Map<string, { lcp: number[]; cls: number[]; tbt: number[] }>();
    for (const f of readdirSync(LHCI).filter((x) => /^lhr-.*\.json$/.test(x))) {
      const l = leer(join(LHCI, f)) as {
        finalUrl?: string;
        finalDisplayedUrl?: string;
        audits: Record<string, { numericValue: number }>;
      };
      const url = l.finalDisplayedUrl ?? l.finalUrl ?? '';
      // Con sesión ninguna ruta termina en /ingresar: si pasa, se midió la pantalla de ingreso y no la ruta (05 §13.4)
      expect(new URL(url).pathname, url).not.toMatch(/^\/ingresar/);
      const m = porRuta.get(url) ?? { lcp: [], cls: [], tbt: [] };
      m.lcp.push(l.audits['largest-contentful-paint']?.numericValue ?? Infinity);
      m.cls.push(l.audits['cumulative-layout-shift']?.numericValue ?? Infinity);
      m.tbt.push(l.audits['total-blocking-time']?.numericValue ?? 0);
      porRuta.set(url, m);
    }
    expect(porRuta.size, 'una medida por ruta').toBe(urls.length);
    const peor = (k: 'lcp' | 'cls' | 'tbt'): number =>
      Math.max(...[...porRuta.values()].map((m) => mediana(m[k])));
    registrar([
      {
        id: 'PRU-REN-PWA-003',
        nombre: 'LCP de la ruta más lenta, mediana de 3',
        medianaMs: peor('lcp'),
        presupuestoMs: P.lcpMs,
      },
      {
        id: 'PRU-REN-PWA-003',
        nombre: 'CLS de la ruta peor, mediana de 3',
        medianaMs: peor('cls'),
        presupuestoMs: P.cls,
        unidad: '',
      },
      {
        id: 'PRU-REN-PWA-003',
        nombre: 'TBT de la ruta peor, mediana de 3 (informativo, 05 §13.4)',
        medianaMs: peor('tbt'),
        presupuestoMs: null,
      },
    ]);
  });
});
