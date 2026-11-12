// FT-57 Inversiones: aporte, retiro y ajuste (06 FT-57; 05 §2.4; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con
// las operaciones reales de un escenario de 01 §8 (DP-17), con el reloj del servidor fijo (DP-04), y recorre
// `/registrar/{aporte,retiro,ajuste}-inversion` como la persona. Los números los pone el motor: la prueba solo comprueba que las
// pantallas de otras fichas los dibujan (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { registrarInversion as t } from '../../../src/textos/registrar-inversion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-41 paso 1 (hoy 10 feb): Ahorro con $500.00, $200.00 asignados a «Aporte inversión» y una inversión que vale $0.00.
const ESC41_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Inversión', tipo: 'inversion' },
  { op: 'OP-07', categoria: 'Aporte inversión' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Aporte inversión', monto: 200 },
];
// ESC-40 paso 1 (hoy 10 feb): inversión de $3,000.00 y un préstamo desembolsado de $5,000.00 que deja Listo para asignar en $5,000.00.
const ESC40_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Inversión', tipo: 'inversion', saldo: 3000 },
  {
    op: 'OP-01',
    cuenta: 'Préstamo',
    tipo: 'prestamo',
    saldo: 0,
    prestamo: {
      contraparte: 'Banco',
      montoOriginal: 5000,
      cuota: 500,
      plazoCuotas: 12,
      cuotasPagadas: 0,
    },
  },
  { op: 'OP-26', prestamo: 'Préstamo', monto: 5000 },
];
// Una inversión de $2,000.00 y un Ahorro sin dinero (CA-57.3).
const INVERSION_DE_2000: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Inversión', tipo: 'inversion', saldo: 2000 },
];

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-INVERSION',
    titulo: 'Semilla de FT-57',
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

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const opcion = (page: Page, grupo: string, nombre: string) =>
  page.getByRole('radiogroup', { name: grupo, exact: true }).getByRole('radio', { name: nombre });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const disponible = (page: Page, categoria: string) =>
  page
    .locator('[data-fila-categoria]')
    .filter({ has: page.getByText(categoria, { exact: true }) })
    .locator('[data-centavos]')
    .first();
const saldoDe = (page: Page, tipo: 'efectivo' | 'inversion') =>
  page.locator(`[data-identidad="${tipo}"] [data-centavos]`).first();

/** Abre el flujo, elige la inversión «Inversión» y la cuenta «Ahorro», y escribe el monto. */
async function llenar(
  page: Page,
  ruta: string,
  cuenta: string | undefined,
  monto: string,
  etiquetaMonto: string = t.monto,
): Promise<void> {
  await abrir(page, ruta);
  await opcion(page, t.inversion, 'Inversión').click();
  if (cuenta !== undefined) await opcion(page, cuenta, 'Ahorro').click();
  await campo(page, etiquetaMonto).fill(monto);
}

test.describe('PRU-E2E-TX flujo de inversiones', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-530 [CA-57.1, ESC-41] RUTA-/registrar/aporte-inversion con el paso 1 de ESC-41 aporto $200.00: el efectivo y Listo para asignar quedan en $300.00, la categoría en $0.00 y la inversión en $200.00', async ({
    page,
  }) => {
    await sembrarOps(ESC41_PASO1, '2027-02-10');
    await abrir(page, '/registrar/aporte-inversion');
    await page.keyboard.press('Tab'); // el primer Tab muestra «Saltar al contenido» (11.2): se mide ya visible
    await revisarTactil(page);
    await expect(campo(page, t.fecha)).toHaveValue('10/02/2027');
    await opcion(page, t.inversion, 'Inversión').click();
    await opcion(page, t.cuentaAporte, 'Ahorro').click();
    await opcion(page, t.categoria, 'Aporte inversión').click();
    await campo(page, t.monto).fill('200');
    await page.getByRole('button', { name: t.guardar.aporte }).click();
    await expect(page.getByRole('heading', { name: t.listo.aporte })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.aporteGuardado('$200.00', 'Ahorro', 'Inversión'),
    );
    // El paso 2: lo que las pantallas de otras fichas dibujan
    await abrir(page, '/');
    await esperarMonto(lpa(page), 30000);
    await abrir(page, '/cuentas');
    await esperarMonto(saldoDe(page, 'efectivo'), 30000);
    await esperarMonto(saldoDe(page, 'inversion'), 20000);
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Aporte inversión'), 0);
  });

  test('PRU-E2E-TX-531 [CA-57.2, ESC-40] RUTA-/registrar/retiro-inversion con el paso 1 de ESC-40 retiro $1,000.00: Listo para asignar es $6,000.00 como otras entradas y la inversión vale $2,000.00', async ({
    page,
  }) => {
    await sembrarOps(ESC40_PASO1, '2027-02-10');
    await abrir(page, '/');
    await esperarMonto(lpa(page), 500000);
    await llenar(page, '/registrar/retiro-inversion', t.cuentaRetiro, '1000');
    await page.getByRole('button', { name: t.guardar.retiro }).click();
    await expect(page.getByRole('heading', { name: t.listo.retiro })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.retiroGuardado('$1,000.00', 'Inversión', 'Ahorro'),
    );
    await abrir(page, '/');
    await esperarMonto(lpa(page), 600000);
    await abrir(page, '/cuentas');
    await esperarMonto(saldoDe(page, 'inversion'), 200000);
  });

  test('PRU-E2E-TX-532 [CA-57.3, ESC-40] con una inversión de $2,000.00, retirar $2,500.00 se rechaza con «La inversión vale $2,000.00.» y no se guarda nada', async ({
    page,
  }) => {
    await sembrarOps(INVERSION_DE_2000, '2027-02-10');
    await llenar(page, '/registrar/retiro-inversion', t.cuentaRetiro, '2500');
    await page.getByRole('button', { name: t.guardar.retiro }).click();
    await expect(page.getByText('La inversión vale $2,000.00.')).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listo.retiro })).toHaveCount(0);
    await abrir(page, '/cuentas');
    await esperarMonto(saldoDe(page, 'inversion'), 200000);
  });

  test('PRU-E2E-TX-533 [CA-57.4, ESC-41] RUTA-/registrar/ajuste-inversion un ajuste de +$75.60 sube el valor de la inversión a $75.60 y Listo para asignar y la categoría siguen igual', async ({
    page,
  }) => {
    await sembrarOps(ESC41_PASO1, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 30000);
    await esperarMonto(disponible(page, 'Aporte inversión'), 20000);
    // [CH-240 E3-21] Una sola hoja con el segmentado: «Ajuste de valor» elegido, y «Retiro» lleva al retiro con los mismos datos de la URL
    await abrir(page, '/registrar/ajuste-inversion');
    await expect(opcion(page, t.tipoEtiqueta, t.tipos.ajuste)).toBeChecked();
    await opcion(page, t.tipoEtiqueta, t.tipos.retiro).click();
    await expect(page).toHaveURL(/\/registrar\/retiro-inversion$/);
    await expect(page.getByRole('heading', { name: t.titulo.retiro })).toBeVisible();
    await llenar(page, '/registrar/ajuste-inversion', undefined, '75.60', t.montoAjuste);
    await page.getByRole('button', { name: t.guardar.ajuste }).click();
    await expect(page.getByRole('heading', { name: t.listo.ajuste })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(t.ajusteGuardado('$75.60', 'Inversión'));
    await abrir(page, '/cuentas');
    await esperarMonto(saldoDe(page, 'inversion'), 7560);
    await esperarMonto(saldoDe(page, 'efectivo'), 50000);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 30000);
    await esperarMonto(disponible(page, 'Aporte inversión'), 20000);
  });
});
