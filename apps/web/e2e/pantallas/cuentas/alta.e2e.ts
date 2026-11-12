// Entrega 4 (CH-240): altas de préstamo e inversión por secciones y edición de una tarjeta con sus condiciones. Como el resto de
// FT-50/FT-53: base sembrada con operaciones reales, reloj del servidor fijo (DP-04) y campos por su etiqueta del catálogo.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentasNueva as t } from '../../../src/textos/cuentas-nueva.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-05';

async function preparar(estadoInicial: Op[] = []): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CTA-ALTA',
    titulo: 'Semilla de las altas de B10',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });

test.describe('PRU-E2E-CTA altas', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-711 creo un préstamo por secciones y una inversión con sus campos y cada una aparece en Cuentas con sus datos', async ({
    page,
  }) => {
    await preparar();
    await abrir(page, '/cuentas/nueva?tipo-cuenta=prestamo');
    await expect(page.getByRole('heading', { name: 'El préstamo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cuotas' })).toBeVisible();
    await expect(page.getByText('Condiciones · opcional')).toBeVisible();
    await campo(page, t.nombre).fill('Carro');
    await campo(page, t.contraparte).fill('Banco');
    await campo(page, t.montoOriginal).fill('8000');
    await campo(page, t.saldo.prestamo).fill('5000');
    await campo(page, t.cuotaPactada).fill('250');
    await campo(page, t.plazoCuotas).fill('36');
    await campo(page, t.cuotasPagadas).fill('10');
    await page.getByRole('button', { name: t.guardar }).click();
    await expect(page).toHaveURL(/\/cuentas$/);
    await expect(page.locator('[data-identidad="prestamo"]').getByText('Carro')).toBeVisible();

    await abrir(page, '/cuentas/nueva?tipo-cuenta=inversion');
    await campo(page, t.nombre).fill('Fondo');
    await campo(page, t.saldo.inversion).fill('3000');
    await page.getByRole('button', { name: t.guardar }).click();
    await expect(page).toHaveURL(/\/cuentas$/);
    await expect(page.locator('[data-identidad="inversion"]').getByText('Fondo')).toBeVisible();
  });

  test('PRU-E2E-CTA-712 editar Visa Oro cambia el límite y el día de corte, y «Condiciones» abre su formulario sin redirigir', async ({
    page,
  }) => {
    await preparar([
      { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta', saldo: 18.75, limite: 2500 },
    ]);
    await abrir(page, '/cuentas');
    await page.getByRole('link', { name: 'Ver detalle de Visa Oro', exact: true }).click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
    const detalle = page.url();
    await abrir(page, `${detalle}/condiciones`);
    await expect(page).toHaveURL(/\/condiciones$/);
    await expect(campo(page, t.limiteCredito)).toBeVisible();
    await abrir(page, `${detalle}/editar`);
    await campo(page, t.limiteCredito).fill('3000');
    await campo(page, t.diaCorte).fill('20');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(detalle);
    await abrir(page, `${detalle}/editar`);
    await expect(campo(page, t.limiteCredito)).toHaveValue('3000.00');
    await expect(campo(page, t.diaCorte)).toHaveValue('20');
  });
});
