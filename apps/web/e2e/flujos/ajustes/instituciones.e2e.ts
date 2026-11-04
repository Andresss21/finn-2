// FT-73 Instituciones, 3 de 3 (06 FT-73; 05 §2.11; 07 §17: un flujo es una E2E). Parte de una base sembrada con las operaciones reales
// de ESC-45 (DP-17), con el reloj del servidor fijo (DP-04), entra como la persona y recorre crear y renombrar una institución (OPT-07)
// contra el servidor real: el rechazo por nombre repetido, sin distinguir mayúsculas, sale de él.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesInstituciones as ti } from '../../../src/textos/ajustes-instituciones.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-18';
const BASE: Op[] = [{ op: 'OP-01', cuenta: 'Ahorro' }];

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
  await esperarHidratacion(page);
}

test.describe('PRU-E2E-AJUS', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-AJUS-125 [FT-73] RUTA-/ajustes/instituciones RUTA-/ajustes/instituciones/nueva RUTA-/ajustes/instituciones/[institucionId] crear una institución la agrega a la lista, renombrarla cambia su nombre y repetir un nombre, sin distinguir mayúsculas, se rechaza', async ({
    page,
  }) => {
    fijarRelojServidor(`${HOY}T20:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-BAND-73B',
      titulo: 'Semilla de FT-73, instituciones',
      refs: [],
      hoy: HOY,
      estadoInicial: BASE,
      pasos: [],
    };
    await sembrar(escenario, HOY);

    await abrir(page, '/ajustes/instituciones');
    const filas = page.locator('[data-institucion]');
    await expect(filas).toHaveCount(3);

    await page.getByRole('link', { name: ti.nueva, exact: true }).click();
    await esperarHidratacion(page);
    await page.getByLabel(ti.nombre, { exact: true }).fill('bac');
    await page.getByRole('button', { name: ti.guardar, exact: true }).click();
    await expect(page.getByText('Ya hay una institución con ese nombre.')).toBeVisible();

    await page.getByLabel(ti.nombre, { exact: true }).fill('Banco Nuevo');
    await page.getByRole('button', { name: ti.guardar, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/instituciones$/);
    await expect(filas).toHaveCount(4);

    await page.getByRole('link', { name: 'Banco Nuevo', exact: true }).click();
    await esperarHidratacion(page);
    await expect(page.getByLabel(ti.nombre, { exact: true })).toHaveValue('Banco Nuevo');
    await page.getByLabel(ti.nombre, { exact: true }).fill('Banco Renombrado');
    await page.getByRole('button', { name: ti.guardar, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/instituciones$/);
    await expect(filas.filter({ hasText: 'Banco Renombrado' })).toHaveCount(1);
    await expect(filas.filter({ hasText: 'Banco Nuevo' })).toHaveCount(0);
  });
});
