// PRU-E2E-PWA-791 (TA-597; CA-E6-18, E6-18 del diseño): con el estado de A.7, a 390 y a 1440 px, ningún enlace ni botón visible de las
// pantallas principales y de sus flujos mide menos de 44 px de alto (se mide la caja del elemento) y la barra fija de un flujo va a
// 20 px de los bordes en el teléfono. Los enlaces dentro de un párrafo quedan fuera (WCAG 2.5.8, igual que `revisarTactil`).
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { alinearRelojes } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Page } from '@playwright/test';

const HOY = '2026-10-15';
const MINIMO_PX = 44;
const MARGEN_PX = 20;

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** Los enlaces y botones visibles que miden menos de 44 px de alto. El «Saltar al contenido» solo se ve con foco: no entra. */
async function chicos(page: Page): Promise<string[]> {
  return page.locator('a, button, [role="button"]').evaluateAll(
    (nodos, minimo) =>
      nodos.flatMap((n) => {
        const { width, height } = n.getBoundingClientRect();
        if (width <= 1 || height <= 1) return [];
        if (n.getAttribute('href') === '#contenido') return [];
        if (n.closest('[aria-hidden="true"], [inert], p') !== null) return [];
        return height < minimo
          ? [`${n.tagName} «${n.textContent.trim().slice(0, 40)}» alto ${height}`]
          : [];
      }),
    MINIMO_PX,
  );
}

const TAMANOS = [
  { ancho: 390, alto: 844 },
  { ancho: 1440, alto: 900 },
] as const;

test.describe('PRU-E2E-PWA tocables de B10', () => {
  test.describe.configure({ timeout: 420_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-791 [CA-E6-18] a 390 y a 1440 px ningún enlace ni botón visible de las pantallas principales y sus flujos mide menos de 44 px de alto, y la barra fija de un flujo va a 20 px de los bordes', async ({
    page,
  }) => {
    await alinearRelojes(page, `${HOY}T12:41:00-06:00`);
    const { escenarioA7 } = await import('../../../../packages/aplicacion/test/escenarios/a7.ts');
    await sembrar(escenarioA7(), HOY);

    await abrir(page, '/presupuesto');
    const restaurantes =
      (await page
        .locator('[data-fila-categoria]')
        .filter({ has: page.getByText('Restaurantes', { exact: true }) })
        .getAttribute('data-fila-categoria')) ?? '';
    await abrir(page, '/cuentas');
    const corriente = (
      (await page
        .locator('a[href^="/cuentas/"]')
        .filter({ hasText: 'Cuenta corriente' })
        .first()
        .getAttribute('href')) ?? ''
    ).split('?')[0];
    const rutas = [
      // pantallas principales
      '/',
      '/presupuesto',
      '/presupuesto/listo-para-asignar',
      `/presupuesto/categorias/${restaurantes}`,
      '/cuentas',
      `${corriente}`,
      '/actividad',
      '/bandeja',
      '/reportes/tendencia',
      '/reportes/gasto-semanal',
      '/ajustes',
      '/metas',
      '/programadas',
      '/por-cobrar',
      '/reglas',
      '/notificaciones',
      // flujos
      '/registrar/gasto',
      '/presupuesto/auto-asignar',
      `/presupuesto/categorias/${restaurantes}/archivar`,
      `/presupuesto/categorias/${restaurantes}/fusionar`,
      '/ajustes/ciclo',
      `${corriente}/verificar-saldo`,
      `${corriente}/eliminar`,
      '/cuentas/nueva',
    ];
    const fallas: string[] = [];
    for (const { ancho, alto } of TAMANOS) {
      await page.setViewportSize({ width: ancho, height: alto });
      for (const ruta of rutas) {
        await abrir(page, ruta);
        for (const f of await chicos(page)) fallas.push(`${ancho} px ${ruta}: ${f}`);
      }
    }
    expect(fallas).toEqual([]);

    // La barra fija de los flujos: el botón principal va a 20 px de los dos bordes de un teléfono de 390 px
    await page.setViewportSize({ width: 390, height: 844 });
    for (const ruta of [
      '/registrar/gasto',
      `/presupuesto/categorias/${restaurantes}/archivar`,
      `/presupuesto/categorias/${restaurantes}/fusionar`,
    ]) {
      await abrir(page, ruta);
      const barra = page.locator('[data-pagina-flujo] > div.sticky.bottom-0');
      const cajas = await barra
        .first()
        .locator('button')
        .evaluateAll((l) =>
          l.map((b) => {
            const r = b.getBoundingClientRect();
            return { izquierda: r.left, derecha: window.innerWidth - r.right };
          }),
        );
      expect(cajas.length, `${ruta}: la barra fija no tiene botones`).toBeGreaterThan(0);
      expect(Math.min(...cajas.map((c) => c.izquierda)), `${ruta} izquierda`).toBeCloseTo(
        MARGEN_PX,
        0,
      );
      expect(Math.min(...cajas.map((c) => c.derecha)), `${ruta} derecha`).toBeCloseTo(MARGEN_PX, 0);
    }
  });
});
