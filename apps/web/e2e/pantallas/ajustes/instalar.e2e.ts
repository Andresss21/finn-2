// FT-05 Instalar como app (06 §2.2; 05 §8.7, FE-58; 07 §17: `E2E` para la instalación, con el iPhone emulado por su agente de
// usuario y `display-mode`, sin iPhone real). El navegador de la E2E no ofrece la instalación por sí solo, así que cada
// prueba emite `beforeinstallprompt` como lo hace Chrome en Android. Los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { instalacion as t } from '../../../src/textos/instalacion.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

async function preparar(): Promise<void> {
  fijarRelojServidor('2027-02-05T10:00:00-06:00');
  const escenario: Escenario = {
    id: 'SEM-BAND',
    titulo: 'Semilla de FT-05',
    refs: [],
    hoy: '2027-02-05',
    estadoInicial: [],
    pasos: [],
  };
  await sembrar(escenario, '2027-02-05');
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

/** Emite `beforeinstallprompt` con un `prompt()` que cuenta sus llamadas; devuelve si la app lo canceló (`preventDefault`). */
async function ofrecerInstalacion(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const w = window as unknown as { __prompts: number };
    w.__prompts = 0;
    const evento = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(evento, {
      prompt: () => {
        w.__prompts += 1;
        return Promise.resolve();
      },
    });
    window.dispatchEvent(evento);
    return evento.defaultPrevented;
  });
}

const prompts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __prompts: number }).__prompts);
const accion = (page: Page) => page.getByRole('button', { name: t.accion, exact: true });

test.describe('PRU-E2E-PWA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
    await preparar();
  });

  test('PRU-E2E-PWA-110 [CA-05.1] con la instalación disponible /ajustes ofrece "Instalar Finn en este dispositivo" y al tocarlo abre el diálogo del navegador', async ({
    page,
  }) => {
    await abrir(page, '/ajustes');
    await expect(accion(page)).toHaveCount(0);
    await ofrecerInstalacion(page);
    await expect(accion(page)).toBeVisible();
    expect(await prompts(page)).toBe(0);

    await accion(page).click();
    await expect.poll(() => prompts(page)).toBe(1);
    await expect(accion(page)).toHaveCount(0);
  });

  test.describe('ya instalada', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        const original = window.matchMedia.bind(window);
        window.matchMedia = (consulta: string) => {
          const lista = original(consulta);
          if (consulta.includes('display-mode: standalone'))
            Object.defineProperty(lista, 'matches', { value: true });
          return lista;
        };
      });
    });

    test('PRU-E2E-PWA-111 [CA-05.1] en modo standalone no se ofrece la instalación', async ({
      page,
    }) => {
      await abrir(page, '/ajustes');
      await ofrecerInstalacion(page);
      await expect(accion(page)).toHaveCount(0);
      await expect(page.getByRole('heading', { name: t.titulo })).toHaveCount(0);
    });
  });

  test.describe('Safari en iPhone', () => {
    test.use({ userAgent: IPHONE });

    test('PRU-E2E-PWA-112 [CA-05.2] sin instalar /ajustes muestra las instrucciones "Compartir" y "Agregar a inicio"', async ({
      page,
    }) => {
      await abrir(page, '/ajustes');
      await expect(page.getByRole('heading', { name: t.iosTitulo })).toBeVisible();
      for (const paso of t.iosPasos) await expect(page.getByText(paso)).toBeVisible();
      await expect(accion(page)).toHaveCount(0);
    });
  });

  test('PRU-E2E-PWA-113 [CA-05.6] al abrir la app no aparece ningún aviso de instalación y la app cancela la barra del navegador', async ({
    page,
  }) => {
    await abrir(page, '/');
    expect(await ofrecerInstalacion(page)).toBe(true);
    await expect(page.getByText(/instalar finn/i)).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    expect(await prompts(page)).toBe(0);
  });
});
