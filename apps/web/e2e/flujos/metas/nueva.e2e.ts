// FT-17 Metas (06 FT-17; 05 §2.3; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones reales
// de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona. Los números los
// pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const SIN_METAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Viaje' },
  { op: 'OP-07', categoria: 'Gas' },
];

async function sembrarOps(ops: Op[], hoy: string, hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-META',
    titulo: 'Semilla de FT-17',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
test.describe('PRU-E2E-META flujo de nueva meta', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-META-108 [CA-17.5] crear una meta para una fecha anterior a hoy se rechaza con el mensaje de fecha_objetivo_pasada y con una fecha de hoy en adelante se crea', async ({
    page,
  }) => {
    await sembrarOps(SIN_METAS, '2027-02-10');
    await abrir(page, '/metas');
    await page.getByRole('link', { name: 'Crear una meta' }).click();
    await esperarContenido(page);
    await page.getByRole('radio', { name: 'Para una fecha' }).click();
    await page.getByLabel('Monto de la meta').fill('600');
    await page.getByLabel('Fecha objetivo', { exact: true }).fill('2027-01-01');
    await page.getByRole('button', { name: 'Crear meta' }).click();
    await expect(page.getByText('La fecha objetivo no puede ser anterior a hoy.')).toBeVisible();
    await expect(page).toHaveURL(/\/metas\/nueva/);

    await page.getByLabel('Fecha objetivo', { exact: true }).fill('2027-05-15');
    await page.getByRole('button', { name: 'Crear meta' }).click();
    await expect(page).toHaveURL(/\/metas$/);
    await esperarContenido(page);
    await expect(page.locator('[data-meta]')).toHaveCount(1);
    await expect(page.locator('[data-meta]').first()).toContainText('Para una fecha');
  });
});
