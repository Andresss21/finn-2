// FT-28 Devoluciones (06 FT-28; 05 §2.6; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones reales de
// un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y llega a la devolución como la persona: desde la lista de Actividad,
// al detalle y a «Registrar devolución» de «Más acciones». Los números los pone el motor (PF-3): la prueba comprueba que se dibujan en
// Presupuesto, en la categoría de pago y en la cuenta. La devolución sin compra original (CA-28.7) y el rechazo de una cuota (CA-28.8) los
// prueban la integración (PRU-ESC-30@int, PRU-INT-DEV-101); eliminar un evento (CA-28.9) es de TA-480 (CH-191).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { transaccion as t } from '../../../src/textos/transaccion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Locator, Page } from '@playwright/test';

/** Siembra las operaciones en `hoy` y deja el reloj del servidor en `servidor` (el día de la devolución). */
async function preparar(estadoInicial: Op[], hoy: string, servidor = hoy): Promise<void> {
  fijarRelojServidor(`${servidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-DEVOLVER',
    titulo: 'Semilla de FT-28, devolver',
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

/** Abre el detalle de la compra: la fila de Actividad que contiene todos los `textos`. */
async function irAlDetalle(page: Page, ...textos: string[]): Promise<void> {
  await abrir(page, '/actividad');
  let filas: Locator = page.locator('[data-fila-transaccion]');
  for (const texto of textos) filas = filas.filter({ hasText: texto });
  await filas.first().click();
  await expect(page.getByRole('link', { name: t.editar })).toBeVisible();
}

/** Del detalle a la pantalla de devolver, por «Más acciones». */
async function irADevolver(page: Page, ...textos: string[]): Promise<void> {
  await irAlDetalle(page, ...textos);
  await page.getByRole('button', { name: 'Más acciones' }).click();
  await page.getByRole('menuitem', { name: t.registrarDevolucion }).click();
  await expect(page.getByRole('heading', { level: 1, name: t.devolverTitulo })).toBeVisible();
  await esperarHidratacion(page);
}

const total = (page: Page) => page.getByRole('textbox', { name: t.montoDevuelto, exact: true });
const parte = (page: Page, nombre: string) =>
  page.getByRole('textbox', { name: t.montoDe(nombre), exact: true });
const registrar = (page: Page) => page.getByRole('button', { name: /^Registrar devolución/ });

/** Termina el flujo: vuelve al detalle de la compra, que ahora lista el evento «Devuelto». */
async function volvioAlDetalle(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: t.devolverTitulo })).toHaveCount(0);
  await expect(page.getByRole('link', { name: t.editar })).toBeVisible();
  await expect(page.getByRole('heading', { name: t.eventos })).toBeVisible();
  await expect(page.locator('main').getByText(t.devuelto, { exact: true }).first()).toBeVisible();
}

/** Devuelve `monto` de una compra de una sola parte. */
async function devolverTodo(page: Page, monto: string, ...textos: string[]): Promise<void> {
  await irADevolver(page, ...textos);
  await total(page).fill(monto);
  await registrar(page).click();
  await volvioAlDetalle(page);
}

const disponible = (page: Page, nombre: string) =>
  page
    .locator('[data-fila-categoria]')
    .filter({ hasText: nombre })
    .locator('[data-centavos]')
    .first();
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const faltaReservar = (page: Page) =>
  page.locator('[data-fila-pago]').first().locator('[data-centavos]').first();
/** Abre la categoría de pago de la tarjeta `nombre`, tocando su fila en Presupuesto. */
async function abrirPago(page: Page, nombre: string): Promise<void> {
  await abrir(page, '/presupuesto');
  const href = await page
    .locator('[data-fila-pago]')
    .filter({ hasText: nombre })
    .getAttribute('href');
  if (href === null) throw new Error(`no hay una fila de pago de «${nombre}» en Presupuesto`);
  await abrir(page, href);
}
const disponibleDePago = (page: Page) =>
  page.locator('[data-numeros="periodo"] [data-numero="disponible"] [data-centavos]');
/** Ids secuenciales del ejecutor: el grupo Gastos es el 1; Ahorro es la cuenta 2 y la tarjeta T la 3. */
const TARJETA = '/cuentas/00000000-0000-4000-8000-000000000003';
/** La cara de la tarjeta dice su deuda (o, sin ella, el saldo a favor). */
const deudaDeT = (page: Page) => page.locator('[data-identidad="tarjeta"] [data-centavos]').first();

// ESC-25 hasta el paso 1 (hoy 10 feb): Ropa con $100.00 asignados y una compra de $100.00 con débito el 5 feb
const ESC25: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Ropa' },
  { op: 'OP-21', monto: 300 },
  { op: 'OP-14', categoria: 'Ropa', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 100, categoria: 'Ropa', fecha: '2027-02-05' },
];
const BASE_T: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
];
// ESC-26 hasta el paso 1 (hoy 10 feb): compra de $100.00 con T el 5 feb y $60.00 asignados a Ropa
const ESC26: Op[] = [
  ...BASE_T,
  { op: 'OP-07', categoria: 'Ropa' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Ropa', monto: 60, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Ropa', fecha: '2027-02-05' },
];
// ESC-27 hasta el paso 1 (hoy 10 feb): A = $100.00 (cubierta) y B = $50.00 (no cubierta) con T
const ESC27: Op[] = [
  ...BASE_T,
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super', fecha: '2027-02-03' },
  { op: 'OP-20', cuenta: 'T', monto: 50, categoria: 'Super', fecha: '2027-02-04' },
];
// ESC-28, parte A, hasta el paso A1 (hoy 10 feb): la compra de $100.00 con T supera en $40.00 los $60.00 de Ropa
const ESC28_A1: Op[] = ESC26;
// ESC-28, parte B, hasta el paso B1 (hoy 16 feb): la compra de $100.00 con T ya está pagada
const ESC28_B1: Op[] = [
  ...BASE_T,
  { op: 'OP-07', categoria: 'Ropa' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Ropa', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Ropa', fecha: '2027-02-05' },
  { op: 'OP-23', tarjeta: 'T', monto: 100, fecha: '2027-02-15' },
];
// ESC-29 hasta el paso 2 (hoy 10 feb): $100.00 con débito, $60.00 a Super y $40.00 por cobrar a Ana, de los que ya cobró $15.00
const ESC29: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 100,
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Super', monto: 60 },
      { deudor: 'Ana', monto: 40 },
    ],
  },
  { op: 'OP-31', cobro: 'compartida', monto: 15 },
];

test.describe('PRU-E2E-TX devolver', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-490 [CA-28.1, ESC-25] RUTA-/actividad/[transaccionId]/devolver con el paso 1 de ESC-25, al devolver los $100.00 con débito el 1 de marzo Ropa queda en $100.00 en el período 2 y sigue en $0.00 en el 1', async ({
    page,
  }) => {
    await preparar(ESC25, '2027-02-10', '2027-03-01');
    await devolverTodo(page, '100', '$100.00');

    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), 10000);
    await abrir(page, '/presupuesto?periodo=2027-01-21');
    await esperarMonto(disponible(page, 'Ropa'), 0);
  });

  test('PRU-E2E-TX-420 [CA-28.1, ESC-25] RUTA-/registrar/[tipo] desde Registrar, «Devolución» lista la compra de $100.00 y lleva a devolverla; Ropa queda en $100.00', async ({
    page,
  }) => {
    await preparar(ESC25, '2027-02-10', '2027-03-01');
    await abrir(page, '/registrar');
    await page.getByRole('link', { name: /^Devolución/ }).click();
    await expect(page).toHaveURL(/\/registrar\/devolucion$/);
    await esperarHidratacion(page);
    const compra = page.locator('[data-compras] a').first();
    await esperarMonto(compra.locator('[data-centavos]'), 10000);
    await compra.click();
    // `/registrar/devolucion` también se titula «Registrar devolución» y tiene «Monto devuelto»: se espera la ruta nueva
    await expect(page).toHaveURL(/\/actividad\/[^/]+\/devolver\?/);
    await expect(page.getByRole('heading', { level: 2, name: t.repartoEntrePartes })).toBeVisible();
    await esperarHidratacion(page);
    await total(page).fill('100');
    await registrar(page).click();
    await volvioAlDetalle(page);

    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), 10000);
  });

  test('PRU-E2E-TX-491 [CA-28.2, ESC-26] con el paso 1 de ESC-26, al devolver $30.00 y luego $20.00 el sobregiro con tarjeta pasa de $40.00 a $10.00 y a $0.00 y la deuda de T de $100.00 a $70.00 y a $50.00', async ({
    page,
  }) => {
    await preparar(ESC26, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), -4000);
    await abrir(page, TARJETA);
    await esperarMonto(deudaDeT(page), 10000);

    await devolverTodo(page, '30', '$100.00');
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), -1000);
    await abrir(page, TARJETA);
    await esperarMonto(deudaDeT(page), 7000);

    await devolverTodo(page, '20', '$100.00');
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), 1000);
    await abrir(page, TARJETA);
    await esperarMonto(deudaDeT(page), 5000);
  });

  test('PRU-E2E-TX-492 [CA-28.3, ESC-27] con el paso 1 de ESC-27, al devolver toda la compra A la compra B queda cubierta: Super $50.00, Pago T $50.00 y «Te falta reservar» $0.00', async ({
    page,
  }) => {
    await preparar(ESC27, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Super'), -5000);

    await devolverTodo(page, '100', '$100.00');
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Super'), 5000);
    await esperarMonto(faltaReservar(page), 0);
    await abrirPago(page, 'T');
    await esperarMonto(disponibleDePago(page), 5000);
  });

  test('PRU-E2E-TX-493 [CA-28.4, ESC-28] con el paso 2 de ESC-28 Parte A, al devolver $70.00 el 1 de marzo Ropa queda en $30.00, Pago T en $30.00 y la deuda de T en $30.00', async ({
    page,
  }) => {
    await preparar(ESC28_A1, '2027-02-10', '2027-03-01');
    await devolverTodo(page, '70', '$100.00');

    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), 3000);
    await abrirPago(page, 'T');
    await esperarMonto(disponibleDePago(page), 3000);
    await abrir(page, TARJETA);
    await esperarMonto(deudaDeT(page), 3000);
  });

  test('PRU-E2E-TX-494 [CA-28.5, ESC-28, AV-06] con el paso 1 de ESC-28 Parte B, al devolver $100.00 el 1 de marzo aparece AV-06 con el texto del saldo a favor y Pago T queda en −$100.00', async ({
    page,
  }) => {
    await preparar(ESC28_B1, '2027-02-16', '2027-03-01');
    await devolverTodo(page, '100', 'Ropa', '$100.00');

    await abrirPago(page, 'T');
    await esperarMonto(disponibleDePago(page), -10000);
    const aviso = page.locator('[data-aviso="AV-06"]');
    await expect(aviso).toContainText('quedó como saldo a favor en tu tarjeta');
    await esperarMonto(aviso.locator('[data-centavos]'), 10000);
  });

  test('PRU-E2E-TX-495 [CA-28.6, ESC-29] con el paso 2 de ESC-29, aplicar $40.00 al por cobrar se rechaza con «En esa parte quedan $25.00 por devolver.»; con $25.00 al por cobrar y $25.00 a Super se acepta y Super queda en $65.00', async ({
    page,
  }) => {
    await preparar(ESC29, '2027-02-10');
    await irADevolver(page, '$100.00');
    await expect(page.getByText(t.quedanPorDevolver('$25.00'))).toBeVisible();
    await expect(page.getByText(t.quedanPorDevolver('$60.00'))).toBeVisible();

    await total(page).fill('50');
    await parte(page, 'Ana (por cobrar)').fill('40');
    await parte(page, 'Super').fill('10');
    await registrar(page).click();
    await expect(page.getByText('En esa parte quedan $25.00 por devolver.')).toBeVisible();
    await expect(page.getByText(t.corregiMonto('Ana (por cobrar)'))).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: t.devolverTitulo })).toBeVisible();

    await parte(page, 'Ana (por cobrar)').fill('25');
    await parte(page, 'Super').fill('25');
    await registrar(page).click();
    await volvioAlDetalle(page);
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Super'), 6500);
    await esperarMonto(lpa(page), 40000);
  });
});
