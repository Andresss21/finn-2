// FT-17 Metas, `/metas/[metaId]` (06 FT-17; 05 §2.3, §4.7; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona. Los
// números los pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-38 rama 3b hasta el paso 4b: meta de $600.00 en Laptop para el 15 may 2027, con $400.00 asignados (hoy 21 may: vencida).
const ESC38_PASO4B: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Laptop' },
  { op: 'OP-18', categoria: 'Laptop', monto: 600, tipo: 'para_fecha', fecha: '2027-05-15' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Laptop', monto: 150, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Laptop', monto: 150, hoy: '2027-02-21' },
  { op: 'OP-14', categoria: 'Laptop', monto: 100, hoy: '2027-04-21' },
];
// ESC-35 hasta el paso 1 (hoy 10 feb): Gas con meta de $200.00 «rellenar hasta».
const GAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-18', categoria: 'Gas', monto: 200, modo: 'rellenar_hasta' },
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
const meta = (page: Page, categoria: string) =>
  page.locator('[data-meta]').filter({ has: page.getByRole('heading', { name: categoria }) });

test.describe('PRU-E2E-META flujo de una meta', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-META-140 [CA-17.4, ESC-38, AV-17] la meta vencida de ESC-38 se avisa en Inicio y en Metas; al extender la fecha al 15 de julio el pedido pasa a $100.00 y el aviso desaparece de los dos', async ({
    page,
  }) => {
    await sembrarOps(ESC38_PASO4B, '2027-01-25', '2027-05-21');
    await abrir(page, '/');
    await expect(page.getByRole('link', { name: /Laptop.*Meta vencida/ })).toBeVisible();
    await abrir(page, '/metas');
    await expect(page.locator('[data-aviso-meta]')).toContainText('La meta de Laptop venció');
    await page.getByRole('link', { name: 'Extender la fecha' }).click();
    await expect(
      page.getByRole('heading', { name: 'Editar meta de Laptop', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('Meta vencida')).toBeVisible();
    await page.getByRole('button', { name: 'Extender la fecha' }).click();
    await expect(page.getByLabel('Fecha objetivo', { exact: true })).toBeFocused();
    await page.getByLabel('Fecha objetivo', { exact: true }).fill('2027-07-15');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page).toHaveURL(/\/metas$/);
    await esperarContenido(page);
    await expect(page.locator('[data-aviso-meta]')).toHaveCount(0);
    await expect(meta(page, 'Laptop')).toHaveAttribute('data-vencida', 'no');
    await esperarMonto(meta(page, 'Laptop').locator('[data-pedido] [data-centavos]'), 10000);
    await abrir(page, '/');
    await expect(page.getByRole('link', { name: /Laptop.*Meta vencida/ })).toHaveCount(0);
  });

  test('PRU-E2E-META-141 [FT-17] eliminar una meta se confirma dentro del flujo y la deja fuera de la lista', async ({
    page,
  }) => {
    await sembrarOps(ESC38_PASO4B, '2027-01-25', '2027-02-21');
    await abrir(page, '/metas');
    await meta(page, 'Laptop').getByRole('link', { name: 'Editar', exact: true }).click();
    await page.getByRole('button', { name: 'Eliminar meta' }).click();
    await expect(page.getByText(/¿Eliminar la meta de Laptop\?/)).toBeVisible();
    await page.getByRole('button', { name: 'Sí, eliminar' }).click();
    await expect(page).toHaveURL(/\/metas$/);
    await esperarContenido(page);
    await expect(page.locator('[data-meta]')).toHaveCount(0);
    await expect(page.getByText('Todavía no tenés metas')).toBeVisible();
  });

  test('PRU-E2E-META-142 [FT-17] si otra pestaña cambió el monto, «Usar el valor actual» deja guardar lo escrito sin perder nada', async ({
    page,
    context,
  }) => {
    await sembrarOps(GAS, '2027-02-10');
    await abrir(page, '/metas');
    await meta(page, 'Gas').getByRole('link', { name: 'Editar', exact: true }).click();
    await esperarContenido(page);

    const otra = await context.newPage();
    await abrir(otra, '/metas');
    await meta(otra, 'Gas').getByRole('link', { name: 'Editar', exact: true }).click();
    await otra.getByLabel('Monto de la meta').fill('250');
    await otra.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(otra).toHaveURL(/\/metas$/);

    await page.getByLabel('Monto de la meta').fill('300');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.getByRole('button', { name: 'Usar el valor actual' }).click();
    await expect(page.getByLabel('Monto de la meta')).toHaveValue('300');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page).toHaveURL(/\/metas$/);
    await esperarContenido(page);
    await esperarMonto(meta(page, 'Gas').locator('[data-objetivo] [data-centavos]'), 30000);
  });
});
