// FT-77 Apariencia (06 §FT-77; 05 §2.11, §10.6; 07 §17: una pantalla y lo que guarda el navegador). Recorre `/ajustes/apariencia`
// como la persona. El tema vive en `localStorage` del dispositivo (`finn-tema`): otro dispositivo es otro contexto de navegador.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesApariencia as t } from '../../../src/textos/ajustes-apariencia.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/ajustes/apariencia';

async function preparar(): Promise<void> {
  const hoy = '2027-02-05';
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND',
    titulo: 'Semilla de FT-77',
    refs: [],
    hoy,
    estadoInicial: [],
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page): Promise<void> {
  await page.goto(RUTA);
  await esperarHidratacion(page);
}

const tema = (page: Page) => page.locator('html');
const opcion = (page: Page, nombre: string) =>
  page.getByRole('radio', { name: new RegExp(`^${nombre}`) });

test.describe('PRU-E2E-PWA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
    await preparar();
  });

  test('PRU-E2E-PWA-106 [CA-77.1] sin elección, Finn sigue el tema del sistema y cambia con él', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await abrir(page);
    await expect(opcion(page, t.sistema)).toBeChecked();
    await expect(tema(page)).toHaveAttribute('data-theme', 'oscuro');

    await page.emulateMedia({ colorScheme: 'light' });
    await expect(tema(page)).toHaveAttribute('data-theme', 'claro');
    expect(await page.evaluate(() => window.localStorage.getItem('finn-tema'))).toBeNull();
  });

  test('PRU-E2E-PWA-107 [CA-77.2] elijo «Oscuro» con el sistema en claro; al recargar <html> tiene data-theme=«oscuro» desde antes de hidratar, sin destello del claro', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrir(page);
    await expect(tema(page)).toHaveAttribute('data-theme', 'claro');
    await opcion(page, t.oscuro).click();
    await expect(tema(page)).toHaveAttribute('data-theme', 'oscuro');

    // El script de next-themes corre antes del primer dibujo: al terminar de parsear, aún sin hidratar, ya es oscuro.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const w = window as unknown as Record<string, unknown>;
        w['__temaAlParsear'] = document.documentElement.getAttribute('data-theme');
        w['__hidratadoAlParsear'] = document.documentElement.dataset['hidratado'] ?? null;
      });
    });
    await page.reload();
    await esperarHidratacion(page);
    await expect(tema(page)).toHaveAttribute('data-theme', 'oscuro');
    await expect(opcion(page, t.oscuro)).toBeChecked();
    expect(
      await page.evaluate(() => (window as unknown as Record<string, unknown>)['__temaAlParsear']),
    ).toBe('oscuro');
    expect(
      await page.evaluate(
        () => (window as unknown as Record<string, unknown>)['__hidratadoAlParsear'],
      ),
    ).toBeNull();
  });

  test('PRU-E2E-PWA-108 [CA-77.3] el tema elegido en un dispositivo no pasa a otro, que sigue con el suyo', async ({
    page,
    browser,
    baseURL,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrir(page);
    await opcion(page, t.oscuro).click();
    await expect(tema(page)).toHaveAttribute('data-theme', 'oscuro');

    const otro = await browser.newContext({ baseURL: baseURL ?? '', colorScheme: 'light' });
    try {
      await entrarAal2(otro, baseURL ?? '');
      const pagina = await otro.newPage();
      await abrir(pagina);
      await expect(tema(pagina)).toHaveAttribute('data-theme', 'claro');
      await expect(opcion(pagina, t.sistema)).toBeChecked();
    } finally {
      await otro.close();
    }
  });
});
