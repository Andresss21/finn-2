// Presupuestos de tiempo (05 §13.4, FE-48; 07 §6.6): corren solo en el job `ren` del nocturno (FINN_REN=1). Superar un
// presupuesto no falla la prueba: la medida va a test-results/ren/web.json y tools/pruebas/volumen/registrar.ts abre el
// aviso y fija FINN_REN_ROJO. Lo que aquí falla es no poder medir.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, expect, test, type Page } from '@playwright/test';
import {
  mediana,
  rutasDeFinn,
  type Presupuestos,
} from '../../../../tools/pruebas/rendimiento/clasificar.ts';

const leer = (f: string): unknown => JSON.parse(readFileSync(f, 'utf8'));
const P = leer('presupuestos.json') as Presupuestos;
const SESION = 'test-results/sesion.json'; // ARCHIVO_SESION de configuracion/inicio-sesion.setup.ts
const WEB_JSON = '../../test-results/ren/web.json';
const LHCI = '.lighthouseci';
const soloNocturno = process.env['FINN_REN'] !== '1';
const NOCTURNO = 'Presupuesto de tiempo: corre en el job `ren` del nocturno (07 §6.6)';

const existeRuta = (ruta: string): boolean =>
  rutasDeFinn(leer('.next/app-path-routes-manifest.json') as Record<string, string>).some(
    (r) => r.ruta === ruta,
  );

/** CPU ×4 y `PerformanceObserver` de tipo `event` (05 §13.4, método de V5-27a). */
async function prepararInp(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    const w = window as unknown as { duraciones: number[] };
    w.duraciones = [];
    new PerformanceObserver((l) => {
      w.duraciones.push(...l.getEntries().map((e) => e.duration));
    }).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit);
  });
}

const inpMedido = (page: Page): Promise<number> =>
  page.evaluate(() => Math.max(0, ...(window as unknown as { duraciones: number[] }).duraciones));

interface MedidaWeb {
  id: string;
  nombre: string;
  medianaMs: number;
  presupuestoMs: number | null;
  unidad?: string;
}

function registrar(medidas: MedidaWeb[]): void {
  mkdirSync('../../test-results/ren', { recursive: true });
  const antes = existsSync(WEB_JSON) ? (leer(WEB_JSON) as MedidaWeb[]) : [];
  writeFileSync(WEB_JSON, JSON.stringify([...antes, ...medidas], null, 2) + '\n');
}

test.describe('PRU-REN-PWA tiempos', () => {
  test.describe.configure({ timeout: 1_800_000 }); // Lighthouse: 3 corridas de 6 rutas
  test('PRU-REN-PWA-101 el método de INP de 05 §13.4 detecta una interacción lenta', async ({
    page,
  }) => {
    await page.setContent(
      `<button onclick="const f = performance.now() + 300; while (performance.now() < f);">lenta</button>`,
    );
    await prepararInp(page);
    await page.getByRole('button', { name: 'lenta' }).click();
    await expect
      .poll(() => inpMedido(page), { message: 'el manejador bloquea 300 ms' })
      .toBeGreaterThan(P.inpMs);
  });

  test('PRU-REN-PWA-003 [V5-26] LCP y CLS: mediana de 3 de Lighthouse CI por ruta, contra 05 §13.1', () => {
    test.skip(soloNocturno, NOCTURNO);
    test.skip(
      !existsSync(SESION),
      'Sin sesión AAL2 no hay rutas que medir: falta /ingresar (DT-23)',
    );
    const urls = (leer('../../lighthouserc.json') as { ci: { collect: { url: string[] } } }).ci
      .collect.url;
    const faltan = urls.filter((u) => !existeRuta(new URL(u).pathname));
    const reportes = faltan.filter(
      (u) => !(u.endsWith('/tendencia') && existeRuta('/reportes/[tipo]')),
    );
    test.skip(reportes.length > 0, `Faltan pantallas: ${reportes.join(', ')}`);
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

  // Las dos que siguen necesitan pantallas de tareas posteriores. Cuando existan, fallan en el nocturno hasta que se
  // escriban sus escenarios: no se quedan omitidas sin que nadie lo note.
  test('PRU-REN-PWA-004 [V5-27] INP: la interacción más lenta de cada escenario, mediana de 3, contra 05 §13.1', () => {
    test.skip(soloNocturno, NOCTURNO);
    test.skip(!existeRuta('/registrar/gasto'), 'Falta la pantalla de Registrar y sus escenarios');
    throw new Error('Existe /registrar/gasto: escribir aquí los escenarios de 05 §13.4');
  });

  test('PRU-REN-TX-001 [V5-11] una escritura lanzada con una lectura en vuelo espera su turno dentro del presupuesto', () => {
    test.skip(soloNocturno, NOCTURNO);
    test.skip(!existeRuta('/registrar/gasto'), 'Falta una pantalla que registre una transacción');
    throw new Error('Existe /registrar/gasto: escribir aquí la medida de V5-11');
  });
});
