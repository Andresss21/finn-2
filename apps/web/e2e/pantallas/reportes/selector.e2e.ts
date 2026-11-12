// Entrega 4 (CH-240, TA-586): el selector de reportes, el filtro de cuentas, los períodos y la barra inferior de `/reportes/[tipo]`
// (E5-1 a E5-3 y E5-8; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las operaciones reales (DP-17) y con
// el reloj del servidor fijo (DP-04). Los números los pone el motor: la prueba solo comprueba rutas, nombres y marcas.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// Dos cuentas de efectivo y un ingreso por período (hoy 25 may 2027): lo mínimo para que haya qué filtrar y a dónde navegar.
const DOS_CUENTAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Corriente' },
  { op: 'OP-21', monto: 100, fecha: '2027-03-22', hoy: '2027-03-22' },
  { op: 'OP-21', monto: 200, fecha: '2027-04-22', hoy: '2027-04-22' },
  { op: 'OP-21', monto: 300, fecha: '2027-05-22', hoy: '2027-05-22' },
];

async function sembrarDosCuentas(): Promise<void> {
  const hoy = '2027-05-25';
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-SEL',
    titulo: 'Semilla del selector de reportes',
    refs: [],
    hoy,
    estadoInicial: DOS_CUENTAS,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const TELEFONO = { width: 390, height: 844 };
const COMPUTADORA = { width: 1440, height: 900 };

test.describe('PRU-E2E-REP selector, filtros y períodos de reportes', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
    await sembrarDosCuentas();
  });

  test('PRU-E2E-REP-701 [CA-E5-1, CA-E5-2] /reportes llega a /reportes/tendencia; en 390 px elegir Ritmo en la hoja navega y «atrás» vuelve a Tendencia RUTA-/reportes RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await page.setViewportSize(TELEFONO);
    // `/reportes` redirige: se espera la URL final antes de medir el contenido
    await page.goto('/reportes');
    await expect(page).toHaveURL(/\/reportes\/tendencia$/);
    await esperarContenido(page);
    await page.getByRole('button', { name: /Elegir otro reporte/ }).click();
    const hoja = page.getByRole('dialog');
    await expect(hoja.getByRole('link')).toHaveCount(15);
    await expect(
      hoja.getByRole('link', { name: 'Tendencia de ingresos y gastos' }),
    ).toHaveAttribute('aria-current', 'page');
    await hoja.getByRole('link', { name: 'Ritmo de gasto' }).click();
    await expect(page).toHaveURL(/\/reportes\/ritmo$/);
    await esperarContenido(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(/\/reportes\/tendencia$/);
    await esperarContenido(page);
  });

  test('PRU-E2E-REP-702 [CA-E5-4, CA-E5-5] elegir dos cuentas pone ?cuentas= y el botón dice «2 cuentas»; «Quitar el filtro» lo quita; Ritmo no tiene filtro de cuentas ni Períodos; Hormiga navega por enlaces ?periodo= RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await page.setViewportSize(TELEFONO);
    await abrir(page, '/reportes/categorias');
    await page.getByRole('button', { name: /^Cuentas: Todas/ }).click();
    const hoja = page.getByRole('dialog');
    await hoja.getByLabel('Ahorro').check();
    await hoja.getByLabel('Corriente').check();
    await hoja.getByRole('link', { name: 'Ver 2 cuentas' }).click();
    await expect(page).toHaveURL(/\/reportes\/categorias\?cuentas=[^&]+,[^&]+$/);
    await esperarContenido(page);
    await expect(page.getByRole('button', { name: /^Cuentas: 2 cuentas/ })).toHaveText('2 cuentas');
    await page.getByRole('button', { name: /^Cuentas: 2 cuentas/ }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Quitar el filtro' }).click();
    await expect(page).toHaveURL(/\/reportes\/categorias$/);
    await esperarContenido(page);
    await abrir(page, '/reportes/ritmo');
    await expect(page.getByRole('button', { name: /^Cuentas:/ })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Períodos' })).toHaveCount(0);
    await abrir(page, '/reportes/hormiga');
    await expect(page.getByRole('button', { name: /^Cuentas:/ })).toHaveCount(0);
    const anterior = page.getByRole('link', { name: 'Período anterior' });
    await expect(anterior).toHaveAttribute('href', /\?periodo=\d{4}-\d{2}-\d{2}$/);
    await anterior.click();
    await expect(page).toHaveURL(/\/reportes\/hormiga\?periodo=/);
  });

  test('PRU-E2E-REP-703 [CA-E5-11] en 390 px la barra inferior no marca ningún ítem en Reportes; en 1440 la fila activa de la barra lateral es Reportes RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await page.setViewportSize(TELEFONO);
    await abrir(page, '/reportes/tendencia');
    await expect(page.locator('nav[data-marco-barra] a[aria-current]')).toHaveCount(0);
    await page.setViewportSize(COMPUTADORA);
    await abrir(page, '/reportes/tendencia');
    await expect(page.locator('aside').getByRole('link', { name: 'Reportes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('nav[data-selector-reportes] a')).toHaveCount(15);
    const ancho = (await page.locator('nav[data-selector-reportes]').boundingBox())?.width ?? 0;
    expect(Math.round(ancho)).toBe(232);
  });
});
