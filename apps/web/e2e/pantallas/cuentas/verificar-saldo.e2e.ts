// FT-44 Verificar saldo (06 §2.9; 05 §2.7; 07 §17: una pantalla o un flujo es una E2E). Cada prueba parte de una base sembrada con
// operaciones reales (DP-17) y del reloj del servidor fijo (DP-04), y recorre `/cuentas/[cuentaId]/verificar-saldo` como la persona.
// La diferencia, el saldo de Finn y la propuesta de AV-21 los pone el servidor: la prueba solo comprueba que la pantalla los dibuja
// (PF-3). Los rechazos de OP-53 y el cambio posterior (CA-44.4, CA-44.6) los miden las pruebas de dominio PRU-DOM-CONC-103 y 104.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { registrarGasto as rg } from '../../../src/textos/registrar-gasto.ts';
import { registrarTipo as rt } from '../../../src/textos/registrar-tipo.ts';
import { verificarSaldo as t } from '../../../src/textos/verificar-saldo.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

/** La primera cuenta que el ejecutor crea después del grupo Gastos (ids secuenciales). */
const CUENTA = '00000000-0000-4000-8000-000000000002';
const HOY = '2027-10-20';

/** Ahorro con $1,250.00 al 15 de octubre: $1,000.00 de apertura, un ingreso de $300.00, un gasto de $50.00 y uno posterior de $20.00. */
const EFECTIVO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000 },
  { op: 'OP-07', categoria: 'Súper' },
  { op: 'OP-21', monto: 300, cuenta: 'Ahorro', fecha: '2027-10-05' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 50, categoria: 'Súper', fecha: '2027-10-10' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Súper', fecha: '2027-10-18' },
];
/** Una tarjeta con $300.00 de deuda en Finn y ninguna transacción. */
const TARJETA: Op[] = [{ op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', saldo: 300 }];

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-VERIFICAR-SALDO',
    titulo: 'Semilla de FT-44',
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

const verificar = `/cuentas/${CUENTA}/verificar-saldo`;
const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const marcas = (page: Page) => page.getByRole('checkbox');

/** Escribe el saldo del banco y pide la diferencia (paso 3 del flujo). */
async function pedirDiferencia(page: Page, etiqueta: string, saldo: string): Promise<void> {
  await campo(page, etiqueta).fill(saldo);
  await page.getByRole('button', { name: t.verDiferencia }).click();
}

test.describe('PRU-E2E-CONC', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CONC-144 [CA-44.1] en una cuenta de efectivo con $1,250.00 en Finn al 15 de octubre, escribo $1,250.00: la diferencia es $0.00, las candidatas vienen marcadas y al confirmar quedan conciliadas', async ({
    page,
  }) => {
    await preparar(EFECTIVO);
    await abrir(page, `${verificar}?fecha=2027-10-15`);
    await expect(page.getByText(t.candidatas(3))).toBeVisible();
    await pedirDiferencia(page, t.saldoBanco, '1250');
    await expect(page.getByText(t.saldoFinn('15/10/2027', '$1,250.00'))).toBeVisible();
    await expect(page.getByText(t.diferencia('$0.00'))).toBeVisible();
    await expect(page.getByText(t.coincide)).toBeVisible();
    await expect(marcas(page)).toHaveCount(3);
    await expect(marcas(page).first()).toBeChecked();
    await expect(marcas(page).last()).toBeChecked();
    await page.getByRole('button', { name: t.revisar }).click();
    await expect(page.getByRole('heading', { name: t.tituloRevisar })).toBeFocused();
    await expect(page.getByText(t.seMarcan(3))).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    // E2-13: sin diferencia que ajustar no hay pantalla de resultado propia: vuelve al detalle y lo dice bajo las acciones
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}\?resultado=verificado/);
    await expect(page.getByTestId('resultado')).toHaveText(t.verificado('15/10/2027', 3));
    // Quedaron conciliadas: ya no hay candidatas a esa fecha.
    await abrir(page, `${verificar}?fecha=2027-10-15`);
    await expect(page.getByText(t.candidatas(0))).toBeVisible();
  });

  test('PRU-E2E-CONC-145 [CA-44.2, AV-21] con $1,262.00 la diferencia es +$12.00, ninguna candidata viene marcada y al confirmar aparece la propuesta de un ingreso de $12.00', async ({
    page,
  }) => {
    await preparar(EFECTIVO);
    await abrir(page, `${verificar}?fecha=2027-10-15`);
    await pedirDiferencia(page, t.saldoBanco, '1262');
    await expect(page.getByText(t.diferencia('+$12.00'))).toBeVisible();
    await expect(page.getByText(t.noCoincide)).toBeVisible();
    await expect(marcas(page)).toHaveCount(3);
    await expect(marcas(page).first()).not.toBeChecked();
    await expect(marcas(page).last()).not.toBeChecked();
    await page.getByRole('button', { name: t.revisar }).click();
    await expect(page.getByText(t.seMarcan(0))).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('Ahorro', '15/10/2027'));
    await expect(page.getByText(t.ajusteIngreso('$12.00'))).toBeVisible();
    const enlace = page.getByRole('link', { name: t.crearAjuste });
    await expect(enlace).toHaveAttribute(
      'href',
      `/registrar/ingreso?cuenta=${CUENTA}&fecha=2027-10-15&total=12.00&comercio=Ajuste+de+conciliaci%C3%B3n`,
    );
    // Al tocarla, el ingreso abre con la fecha del estado, el monto y el comercio ya puestos
    await enlace.click();
    await esperarHidratacion(page);
    await expect(campo(page, rt.fecha)).toHaveValue('15/10/2027');
    await expect(campo(page, rt.total)).toHaveValue('12.00');
    await expect(page.getByLabel(rt.descripcion)).toHaveValue('Ajuste de conciliación');
  });

  test('PRU-E2E-CONC-146 [CA-44.3, AV-21] en una tarjeta con $300.00 de deuda en Finn, escribo $290.00 de deuda: la diferencia es +$10.00 y la propuesta es una entrada a la tarjeta', async ({
    page,
  }) => {
    await preparar(TARJETA);
    await abrir(page, verificar);
    await pedirDiferencia(page, t.deudaBanco, '290');
    await expect(page.getByText(t.saldoFinn('20/10/2027', '−$300.00'))).toBeVisible();
    await expect(page.getByText(t.diferencia('+$10.00'))).toBeVisible();
    await expect(marcas(page)).toHaveCount(1); // la deuda inicial es la única candidata y no viene marcada
    await expect(marcas(page).first()).not.toBeChecked();
    await page.getByRole('button', { name: t.revisar }).click();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await expect(page.getByText(t.ajusteEntrada('$10.00'))).toBeVisible();
    const enlace = page.getByRole('link', { name: t.crearAjuste });
    await expect(enlace).toHaveAttribute(
      'href',
      `/registrar/entrada-tarjeta?cuenta=${CUENTA}&fecha=2027-10-20&total=10.00&comercio=Ajuste+de+conciliaci%C3%B3n`,
    );
    // Al tocarla, la entrada a la tarjeta abre con la fecha, el monto y el comercio del ajuste
    await enlace.click();
    await esperarHidratacion(page);
    await expect(campo(page, rt.fecha)).toHaveValue('20/10/2027');
    await expect(campo(page, rt.total)).toHaveValue('10.00');
    await expect(page.locator('[data-comercio]')).toHaveText('Ajuste de conciliación');
  });

  test('PRU-E2E-CONC-460 [CA-44.2, AV-21] con $1,240.00 en vez de $1,250.00 la diferencia es −$10.00 y la propuesta abre /registrar/gasto con la cuenta, la fecha del estado, el monto y el comercio puestos', async ({
    page,
  }) => {
    await preparar(EFECTIVO);
    await abrir(page, `${verificar}?fecha=2027-10-15`);
    await pedirDiferencia(page, t.saldoBanco, '1240');
    await page.getByRole('button', { name: t.revisar }).click();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByText(t.ajusteGasto('$10.00'))).toBeVisible();
    await page.getByRole('link', { name: t.crearAjuste }).click();
    await esperarHidratacion(page);
    await expect(page).toHaveURL(
      new RegExp(`/registrar/gasto\\?cuenta=${CUENTA}&fecha=2027-10-15&total=10\\.00`),
    );
    await expect(campo(page, rt.fecha)).toHaveValue('15/10/2027');
    await expect(page.getByLabel(rg.total)).toHaveValue('10.00');
    await expect(page.getByLabel(rg.comercio)).toHaveValue('Ajuste de conciliación');
  });

  test('PRU-E2E-CONC-147 [CA-44.5] una verificación hecha aparece en el detalle de la cuenta como "Verificación de saldo"', async ({
    page,
  }) => {
    await preparar(EFECTIVO);
    await abrir(page, `${verificar}?fecha=2027-10-15`);
    await pedirDiferencia(page, t.saldoBanco, '1250');
    await page.getByRole('button', { name: t.revisar }).click();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await abrir(page, `/cuentas/${CUENTA}`);
    const conciliacion = page.locator('[data-conciliacion]');
    await expect(conciliacion).toHaveCount(1);
    await expect(conciliacion.getByRole('heading', { level: 3 })).toContainText(
      'Verificación de saldo',
    );
    await expect(conciliacion).not.toContainText('Estado de cuenta');
  });
});
