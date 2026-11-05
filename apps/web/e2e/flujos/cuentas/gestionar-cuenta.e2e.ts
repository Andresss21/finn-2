// FT-53 Editar, ordenar, archivar, desarchivar y eliminar cuentas (06 FT-53; 05 §2.7; 07 §17: un flujo es una E2E). Cada prueba parte
// de una base sembrada con las operaciones reales (DP-17) y del reloj del servidor fijo (DP-04), entra por Cuentas como la
// persona y recorre el flujo. Los números los pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentasGestion } from '../../../src/textos/cuentas-gestion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Locator, Page } from '@playwright/test';

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CTA-GESTION',
    titulo: 'Semilla de FT-53',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** Entra por Cuentas, abre el detalle de la cuenta que dice `enlace` y toca «Editar». */
async function abrirEditar(page: Page, enlace: (p: Page) => Locator): Promise<void> {
  await abrir(page, '/cuentas');
  await enlace(page).click();
  await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
  await esperarContenido(page);
  await page.getByRole('button', { name: 'Más acciones' }).click();
  await page.getByRole('menuitem', { name: 'Editar', exact: true }).click();
  await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}\/editar$/);
  await esperarContenido(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const guardar = (page: Page) =>
  page.getByRole('button', { name: cuentasGestion.editar.guardar, exact: true });

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-170 [CA-53.5] renombro la tarjeta "Visa Oro" a "Visa Platino" y Presupuesto muestra su categoría de pago con el nombre nuevo', async ({
    page,
  }) => {
    await sembrarOps(
      [{ op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta', saldo: 0 }],
      '2027-02-05',
    );
    await abrirEditar(page, (p) =>
      p.getByRole('link', { name: 'Ver detalle de Visa Oro', exact: true }),
    );
    await campo(page, cuentasGestion.comunes.nombre).fill('Visa Platino');
    await guardar(page).click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);

    await abrir(page, '/presupuesto');
    await expect(page.getByText('Visa Platino', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Visa Oro', { exact: true })).toHaveCount(0);
  });

  test('PRU-E2E-CTA-171 [CA-53.6] con movimientos desde el 10 de febrero, cambiar la apertura al 15 de febrero se rechaza y la cuenta no cambia', async ({
    page,
  }) => {
    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-01' },
        { op: 'OP-07', categoria: 'Super' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 10,
          categoria: 'Super',
          fecha: '2027-02-10',
          hoy: '2027-02-10',
        },
      ],
      '2027-03-05',
    );
    await abrirEditar(page, (p) => p.locator('[data-grupo="Efectivo"] a').first());
    await campo(page, cuentasGestion.comunes.apertura).fill('2027-02-15');
    await guardar(page).click();
    await expect(
      page.getByText(/Hay movimientos desde el .*; la apertura no puede ser posterior\./),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/editar$/);
  });

  test('PRU-E2E-CTA-172 [FT-53] subo "Billetera" sobre "Ahorro", guardo el orden y Cuentas las muestra en el orden nuevo', async ({
    page,
  }) => {
    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro', saldo: 100 },
        { op: 'OP-01', cuenta: 'Billetera', saldo: 50 },
      ],
      '2027-02-05',
    );
    await abrir(page, '/cuentas/ordenar');
    await page.getByRole('button', { name: cuentasGestion.ordenar.subir('Billetera') }).click();
    await page.getByRole('button', { name: cuentasGestion.ordenar.guardar }).click();
    await expect(page).toHaveURL(/\/cuentas$/);
    await esperarContenido(page);
    await expect(page.locator('[data-grupo="Efectivo"] a').first()).toContainText('Billetera');
  });
});
