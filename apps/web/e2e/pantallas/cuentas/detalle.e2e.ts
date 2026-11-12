// TA-583 (CH-240, entrega 4) Detalle de cuenta: E4-13 (período anterior) y E2-13/E4-1 (verificar saldo empieza por el impacto y
// su resultado queda en el detalle). Se siembra con las operaciones reales (DP-17) y el reloj del servidor fijo (DP-04); los
// números los pone el motor (PF-3). Estas pruebas están escritas y sin correr: la E2E local no estaba disponible al escribirlas.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentaDetalle as td } from '../../../src/textos/cuenta-detalle.ts';
import { verificarSaldo as tv } from '../../../src/textos/verificar-saldo.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CTA-DETALLE-4',
    titulo: 'Semilla de TA-583',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrirDetalle(page: Page): Promise<void> {
  await page.goto('/cuentas');
  await esperarContenido(page);
  await page.locator('[data-grupo="Efectivo"] a').first().click();
  await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
  await esperarContenido(page);
}

const OPS: Op[] = [
  { op: 'OP-01', cuenta: 'Cuenta corriente', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-20', cuenta: 'Cuenta corriente', monto: 10, categoria: 'Super', fecha: '2027-02-10' },
  { op: 'OP-20', cuenta: 'Cuenta corriente', monto: 20, categoria: 'Super', fecha: '2027-03-05' },
];

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-721 verificar el saldo de Cuenta corriente con diferencia empieza por el impacto y el resultado queda bajo las acciones del detalle', async ({
    page,
  }) => {
    await sembrarOps(OPS, '2027-03-10');
    await abrirDetalle(page);
    const detalle = page.url();
    await page.getByRole('link', { name: td.acciones.verificarSaldo }).click();
    await esperarContenido(page);
    // Con un saldo distinto del de Finn, la diferencia (K4) se ve antes de confirmar nada
    await page.getByLabel(tv.saldoBanco, { exact: true }).fill('950');
    await page.getByRole('button', { name: tv.verDiferencia }).click();
    await expect(page.getByText(/^Diferencia:/)).toBeVisible();
    await page.getByRole('button', { name: tv.revisar }).click();
    await page.getByRole('button', { name: tv.confirmar }).click();
    // E2-13: sin pantalla de resultado propia, vuelve al detalle y el resultado queda bajo las acciones
    await expect(page).toHaveURL(detalle);
    await esperarContenido(page);
    await expect(page.getByText(/Verificación de saldo guardada/)).toBeVisible();
  });

  test('PRU-E2E-CTA-722 el período anterior muestra solo sus movimientos con «Cerrado · Movimientos de ese período» y el saldo de hoy arriba', async ({
    page,
  }) => {
    await sembrarOps(OPS, '2027-03-10');
    await abrirDetalle(page);
    const saldo = page.locator('main header [data-centavos]').first();
    const saldoHoy = await saldo.getAttribute('data-centavos');
    await expect(page.locator('[data-movimiento]')).toHaveCount(3);
    await page.getByRole('link', { name: 'Período anterior' }).click();
    await expect(page).toHaveURL(/\?periodo=2027-01-21$/);
    await esperarContenido(page);
    const seccion = page.locator('[data-movimientos]');
    await expect(
      seccion.getByRole('heading', { name: td.movimientos.tituloCerrado }),
    ).toBeVisible();
    // El selector va dentro de la sección de movimientos y «Ir al período actual» vuelve a hoy
    await expect(seccion.getByRole('link', { name: 'Ir al período actual' })).toBeVisible();
    await expect(page.locator('[data-movimiento]')).toHaveCount(2);
    await expect(saldo).toHaveAttribute('data-centavos', saldoHoy ?? '');
  });
});
