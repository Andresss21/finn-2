// FT-50 Crear cuenta con saldo inicial (06 §2.9; 05 §2.3; 07 §17: una pantalla, una navegación o un flujo). Cada prueba parte de una
// base sembrada con operaciones reales y del reloj del servidor fijo (DP-04), y recorre `/cuentas/nueva` como la persona. Los campos
// se buscan por su etiqueta del catálogo (FE-51). Los números del motor (LPA, patrimonio) los miden las pruebas de integración.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentasNueva as t } from '../../../src/textos/cuentas-nueva.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/cuentas/nueva';

/** Una base con el estado inicial dado y `hoy` el día de la prueba; el servidor fija el mismo instante. */
async function preparar(hoy: string, estadoInicial: Op[] = []): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CTA',
    titulo: 'Semilla de FT-50',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta = RUTA): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const crear = (page: Page) => page.getByRole('button', { name: t.guardar });

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-101 [CA-50.1, ESC-01, AV-07] creo un ahorro con $1,000.00 y una tarjeta con deuda de $300.00; la tarjeta avisa que la deuda queda como "te falta reservar"', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page);
    await campo(page, t.nombre).fill('Ahorro');
    await campo(page, t.saldo.efectivo).fill('1000');
    await crear(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();

    await abrir(page, `${RUTA}?tipo-cuenta=tarjeta`);
    await campo(page, t.nombre).fill('T');
    await campo(page, t.saldo.tarjeta).fill('300');
    await expect(page.getByRole('radio', { name: t.debo })).toBeChecked();
    await campo(page, t.limiteCredito).fill('1500');
    await campo(page, t.diaCorte).fill('15');
    await campo(page, t.diaPago).fill('5');
    await crear(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByText(t.avisos['AV-07'] ?? '')).toBeVisible();
  });

  test('PRU-E2E-CTA-102 [CA-50.2, ESC-02, AV-01] con hoy el 5 de marzo, un ahorro con apertura el 25 de enero muestra el impacto en Listo para asignar antes de confirmar', async ({
    page,
  }) => {
    await preparar('2027-03-05');
    await abrir(page);
    await campo(page, t.nombre).fill('Ahorro');
    await campo(page, t.apertura).fill('2027-01-25');
    await campo(page, t.saldo.efectivo).fill('500');
    await crear(page).click();

    const titulo = page.getByRole('heading', { name: t.revisar });
    await expect(titulo).toBeFocused();
    await expect(page.getByText(t.impactoLpa('+$500.00'))).toBeVisible();
    await expect(page.getByText(t.avisos['AV-01'] ?? '')).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
  });

  test('PRU-E2E-CTA-103 [CA-50.3, ESC-01] creo un préstamo en curso con capital pendiente de $5,000.00 y 10 cuotas pagadas', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page, `${RUTA}?tipo-cuenta=prestamo`);
    await campo(page, t.nombre).fill('Carro');
    await campo(page, t.contraparte).fill('Banco');
    await campo(page, t.montoOriginal).fill('8000');
    await campo(page, t.saldo.prestamo).fill('5000');
    await campo(page, t.cuotaPactada).fill('250');
    await campo(page, t.plazoCuotas).fill('36');
    await campo(page, t.cuotasPagadas).fill('10');
    await crear(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
  });

  test('PRU-E2E-CTA-104 [CA-50.4] el formulario avisa antes de enviar que "visa oro" ya se usa y el servidor la rechaza', async ({
    page,
  }) => {
    await preparar('2027-02-05', [{ op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta', saldo: 0 }]);
    await abrir(page, `${RUTA}?tipo-cuenta=tarjeta`);
    await campo(page, t.nombre).fill('visa oro');
    await expect(page.getByText(t.nombreEnUso('Visa Oro'))).toBeVisible();
    await campo(page, t.saldo.tarjeta).fill('0');
    await campo(page, t.limiteCredito).fill('1500');
    await campo(page, t.diaCorte).fill('15');
    await campo(page, t.diaPago).fill('5');
    await crear(page).click();
    await expect(page.getByText('Ya existe visa oro en Pagos de tarjeta.')).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listo })).toHaveCount(0);
  });

  test('PRU-E2E-CTA-105 [CA-50.5, CB-14] una segunda cuenta del BAC terminada en 4821 se rechaza y una de Banco Agrícola con 4821 se acepta', async ({
    page,
  }) => {
    await preparar('2027-02-05', [
      { op: 'OP-01', cuenta: 'Cuenta BAC', saldo: 100, ultimos4: '4821' },
    ]);
    await abrir(page);
    await campo(page, t.nombre).fill('Otra del BAC');
    await page.getByRole('radio', { name: 'BAC', exact: true }).click();
    await campo(page, t.ultimos4).fill('4821');
    await campo(page, t.saldo.efectivo).fill('10');
    await crear(page).click();
    await expect(page.getByText('Ya tenés una cuenta de BAC terminada en 4821.')).toBeVisible();

    await page.getByRole('radio', { name: 'Banco Agrícola' }).click();
    await crear(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
  });
});
