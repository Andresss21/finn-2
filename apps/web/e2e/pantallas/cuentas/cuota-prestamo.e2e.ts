// FT-54 Pagar cuota o abonar a capital (06 §2.7; 05 §2.7; 07 §17: una pantalla o un flujo). Cada prueba parte de una base sembrada
// con operaciones reales (el estado inicial de ESC-39) y del reloj del servidor fijo (DP-04), y recorre
// `/cuentas/[cuentaId]/cuota` como la persona. Los campos se buscan por su etiqueta del catálogo (FE-51). Los números del motor
// (capital pendiente, costo financiero, te falta reservar) los miden las pruebas de integración de OP-24.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentasCuota as t } from '../../../src/textos/cuentas-cuota.ts';
import { estados } from '../../../src/textos/estados.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

/** El préstamo del estado inicial de ESC-39: la primera cuenta que el ejecutor crea después del grupo Gastos (ids secuenciales). */
const PRESTAMO = '00000000-0000-4000-8000-000000000003';
const ESC39: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  {
    op: 'OP-01',
    cuenta: 'Préstamo',
    tipo: 'prestamo',
    saldo: 10000,
    prestamo: {
      contraparte: 'Banco',
      montoOriginal: 10000,
      cuota: 350,
      plazoCuotas: 36,
      cuotasPagadas: 0,
    },
  },
  { op: 'OP-07', categoria: 'Cuota préstamo' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Cuota préstamo', monto: 350, periodo: 'P1' },
];

/** Una base con el estado inicial dado y `hoy` el día de la prueba; el servidor fija el mismo instante. */
async function preparar(hoy: string, estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CUOTA',
    titulo: 'Semilla de FT-54',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

const cuota = `/cuentas/${PRESTAMO}/cuota?modalidad=cuota`;
const abono = `/cuentas/${PRESTAMO}/cuota?modalidad=abono`;
const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const opcion = (page: Page, grupo: string, nombre: string) =>
  page.getByRole('radiogroup', { name: grupo }).getByRole('radio', { name: nombre });

async function llenarCuota(page: Page, desglose: [string, string, string]): Promise<void> {
  await opcion(page, t.origen, 'Ahorro').click();
  await opcion(page, t.categoria, 'Cuota préstamo').click();
  await campo(page, t.capital).fill(desglose[0]);
  await campo(page, t.interes).fill(desglose[1]);
  await campo(page, t.seguro).fill(desglose[2]);
}

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-154 [CA-54.1, ESC-39] pago una cuota de $350.00 con capital $250.00, interés $90.00 y seguro $10.00: el capital pendiente baja a $9,750.00 y la categoría queda en $0.00', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC39);
    await abrir(page, cuota);
    await page.keyboard.press('Tab'); // el primer Tab muestra «Saltar al contenido» (11.2): se mide ya visible
    await revisarTactil(page);
    await expect(page.getByText(t.capitalPendiente('$10,000.00'))).toBeVisible();
    await expect(page.getByText(t.sinModelo)).toBeVisible();
    await expect(campo(page, t.total)).toHaveValue('350.00'); // sin propuesta: la cuota pactada
    await expect(page.getByText('Disponible $350.00')).toBeVisible();
    await llenarCuota(page, ['250', '90', '10']);
    await page.getByRole('button', { name: t.guardarCuota }).click();
    await expect(page.getByRole('heading', { name: t.listoCuota })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(t.cuotaGuardada('$350.00', 'Préstamo'));
    // Paso 2 de ESC-39: al abrir de nuevo, el capital pendiente es el nuevo y la categoría no tiene Disponible
    await abrir(page, abono);
    await expect(page.getByText(t.capitalPendiente('$9,750.00'))).toBeVisible();
    await expect(page.getByText('Disponible $0.00')).toBeVisible();
  });

  test('PRU-E2E-CTA-155 [CA-54.2] un desglose que suma $349.00 para un total de $350.00 se rechaza con "Capital, interés y seguro suman $349.00; el pago es de $350.00."', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC39);
    await abrir(page, cuota);
    await llenarCuota(page, ['250', '90', '9']);
    await page.getByRole('button', { name: t.guardarCuota }).click();
    await expect(
      page.getByText('Capital, interés y seguro suman $349.00; el pago es de $350.00.').first(),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listoCuota })).toHaveCount(0);
  });

  test('PRU-E2E-CTA-156 [CA-54.3] un abono con capital de $10,500.00 sobre $10,000.00 pendientes se rechaza con el capital que supera lo que se debe', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC39);
    await abrir(page, abono);
    await expect(page.getByText(t.abonoNota('$0.00'))).toBeVisible();
    await opcion(page, t.origen, 'Ahorro').click();
    await opcion(page, t.categoria, 'Cuota préstamo').click();
    await campo(page, t.total).fill('10500');
    await page.getByRole('button', { name: t.guardarAbono }).click();
    await expect(
      page
        .getByText('El capital ($10,500.00) supera lo que debés del préstamo ($10,000.00).')
        .first(),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listoAbono })).toHaveCount(0);
  });

  test('PRU-E2E-CTA-157 [CA-54.4, CB-07] pago la cuota con la Visa y la categoría no alcanza: la parte no cubierta queda como "Te falta reservar" de esa tarjeta', async ({
    page,
  }) => {
    await preparar('2027-02-10', [
      ...ESC39.slice(0, 3),
      { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta' },
    ]);
    await abrir(page, cuota);
    await opcion(page, t.origen, 'Visa').click();
    await opcion(page, t.categoria, 'Cuota préstamo').click();
    await campo(page, t.capital).fill('250');
    await campo(page, t.interes).fill('90');
    await campo(page, t.seguro).fill('10');
    await page.getByRole('button', { name: t.guardarCuota }).click();
    await expect(page.getByRole('heading', { name: t.listoCuota })).toBeVisible();
    await expect(page.getByText(t.avisos['AV-07'] ?? '')).toBeVisible();
  });

  test('PRU-E2E-CTA-158 [AV-01] con hoy el 5 de marzo, una cuota del 5 de febrero muestra el impacto antes de confirmar y se guarda al confirmar', async ({
    page,
  }) => {
    await preparar('2027-03-05', ESC39.slice(0, 4)); // P1 ya está cerrado: sin la asignación del paso 1
    await abrir(page, `${cuota}&fecha=2027-02-05`);
    await expect(campo(page, t.fecha)).toHaveValue('2027-02-05');
    await llenarCuota(page, ['250', '90', '10']);
    await page.getByRole('button', { name: t.guardarCuota }).click();
    await expect(page.getByRole('heading', { name: t.revisar })).toBeFocused();
    await expect(page.getByText(t.avisos['AV-01'] ?? '')).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.listoCuota })).toBeVisible();
  });

  test('PRU-E2E-CTA-159 un préstamo que no existe da "no encontrada" y sin categorías el flujo lo explica y enlaza a crearlas', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC39.slice(0, 2));
    await abrir(page, '/cuentas/00000000-0000-4000-8000-0000000000ff/cuota');
    await expect(page.getByRole('heading', { name: estados.noExisteTitulo })).toBeVisible();
    await abrir(page, cuota);
    await expect(page.getByRole('heading', { name: t.sinCategoriasTitulo })).toBeVisible();
    await expect(page.getByRole('link', { name: t.crearCategoria })).toHaveAttribute(
      'href',
      '/presupuesto/estructura',
    );
  });
});
