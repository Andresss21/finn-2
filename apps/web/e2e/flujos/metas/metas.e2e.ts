// FT-17 Metas (06 FT-17; 05 §2.3; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones reales
// de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona. Los números los
// pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3). AV-17 en Inicio es de FT-08
// (`pruebas/pendientes-e2e.json`): acá se prueba que desaparece de `/metas`.
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
const meta = (page: Page, categoria: string) =>
  page.locator('[data-meta]').filter({ has: page.getByRole('heading', { name: categoria }) });

test.describe('PRU-E2E-META flujos de metas', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-META-107 [CA-17.4, ESC-38, AV-17] extender la fecha de la meta vencida de ESC-38 al 15 de julio la deja en curso: el pedido pasa a $100.00 y AV-17 desaparece', async ({
    page,
  }) => {
    await sembrarOps(ESC38_PASO4B, '2027-01-25', '2027-05-21');
    await abrir(page, '/metas');
    await expect(meta(page, 'Laptop')).toHaveAttribute('data-vencida', 'si');
    await meta(page, 'Laptop').getByRole('link', { name: 'Extender la fecha' }).click();
    await expect(page.getByRole('heading', { name: 'Editar meta', level: 1 })).toBeVisible();
    await page.getByLabel('Fecha objetivo', { exact: true }).fill('2027-07-15');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page).toHaveURL(/\/metas$/);
    await esperarContenido(page);
    await expect(meta(page, 'Laptop')).toHaveAttribute('data-vencida', 'no');
    await expect(meta(page, 'Laptop')).not.toContainText('Meta vencida');
    await esperarMonto(meta(page, 'Laptop').locator('[data-pedido] [data-centavos]'), 10000);
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

  test('PRU-E2E-META-109 eliminar una meta se confirma dentro del flujo y la deja fuera de la lista', async ({
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
});
