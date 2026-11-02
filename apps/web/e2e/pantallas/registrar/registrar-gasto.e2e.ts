// FT-21 Registrar gasto con división y por cobrar, trozo 1 (06 §2.8; 05 §2.4; 07 §17: una pantalla o un flujo es una E2E). Cada prueba parte
// de una base sembrada con las operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre
// `/registrar/gasto` como la persona. Los números los pone el motor: la prueba abre el presupuesto y comprueba que los dibuja (PF-3).
// Los campos se buscan por su etiqueta del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { registrarGasto as t } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// Las operaciones de 01 §8 hasta el paso 1 de ESC-19, ESC-24 y ESC-20 (y, para CA-21.4, hasta el paso 2 de ESC-20, que crea a Ana).
const ESC19_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Mascota', monto: 20, periodo: 'P1' },
];
const ESC24_PASO1: Op[] = [
  ...ESC19_PASO1.slice(0, 4),
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Mascota', monto: 50, periodo: 'P1' },
];
const ESC20_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
];
const ESC20_PASO2: Op[] = [
  ...ESC20_PASO1,
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Super', monto: 25 },
      { deudor: 'Ana', monto: 25 },
    ],
  },
];

async function preparar(hoy: string, estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REG-GASTO',
    titulo: 'Semilla de FT-21',
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

/** Escribe una parte con categoría: su monto y la categoría elegida. */
async function parteConCategoria(
  page: Page,
  n: number,
  monto: string,
  categoria: string,
): Promise<void> {
  await campo(page, t.montoDeParte(String(n))).fill(monto);
  await opcion(page, t.categoriaDeParte(String(n)), categoria).click();
}

async function agregarParte(page: Page): Promise<void> {
  await page.getByRole('button', { name: t.agregarParte }).click();
}

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ hasText: nombre });
/** El primer monto de una fila de categoría es su Disponible (05 §10.8). */
const disponible = (page: Page, nombre: string) =>
  fila(page, nombre).locator('[data-centavos]').first();
/** La fila de pago de una tarjeta: su primer monto es «Te falta reservar» y el segundo, lo disponible para pagar (05 §10.8). */
const pagoTarjeta = (page: Page) =>
  page.locator('[data-fila-pago]').first().locator('[data-centavos]');
const listoParaAsignar = (page: Page) =>
  page.locator('[data-resumen-lpa]').locator('[data-centavos]').first();

test.describe('PRU-E2E-TX', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-376 [CA-21.1, ESC-19] registro una compra con T de $150.00 con $110.00 en Super y $40.00 en Mascota y el presupuesto queda con Super −$10.00, Mascota −$20.00, Pago T $120.00 y $30.00 por reservar', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await page.keyboard.press('Tab'); // el primer Tab muestra «Saltar al contenido» (11.2): se mide ya visible
    await revisarTactil(page);
    await expect(campo(page, t.fecha)).toHaveValue('2027-02-10');
    await opcion(page, t.cuenta, 'T').click();
    await campo(page, t.total).fill('150');
    await parteConCategoria(page, 1, '110', 'Super');
    await expect(page.getByTestId('falta-repartir')).toHaveText(t.faltaRepartir('$40.00'));
    await agregarParte(page);
    await parteConCategoria(page, 2, '40', 'Mascota');
    await expect(page.getByTestId('falta-repartir')).toHaveText(t.todoRepartido);
    await page.getByRole('button', { name: t.guardar }).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.guardado(t.sinComercio, '$150.00', 'T', '2'),
    );
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), -1000);
    await esperarMonto(disponible(page, 'Mascota'), -2000);
    await esperarMonto(pagoTarjeta(page).nth(0), 3000);
    await esperarMonto(pagoTarjeta(page).nth(1), 12000);
  });

  test('PRU-E2E-TX-377 [CA-21.2, ESC-24] registro una compra con T de $200.00 con $90.00 en Super, $30.00 en Mascota y $80.00 por cobrar a Ana y el presupuesto queda con Super $10.00, Mascota $20.00, Pago T $120.00 y $80.00 por reservar', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC24_PASO1);
    await abrir(page, '/registrar/gasto');
    await opcion(page, t.cuenta, 'T').click();
    await campo(page, t.total).fill('200');
    await parteConCategoria(page, 1, '90', 'Super');
    await agregarParte(page);
    await parteConCategoria(page, 2, '30', 'Mascota');
    await agregarParte(page);
    await campo(page, t.montoDeParte('3')).fill('80');
    await opcion(page, t.destinoDeParte('3'), t.destinoPorCobrar).click();
    // sin deudores todavía, la persona se escribe: la parte por cobrar abre con «Otra persona»
    await expect(opcion(page, t.deudorDeParte('3'), t.otraPersona)).toBeChecked();
    await campo(page, t.deudorNuevoDeParte('3')).fill('Ana');
    await page.getByRole('button', { name: t.guardar }).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.guardado(t.sinComercio, '$200.00', 'T', '3'),
    );
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), 1000);
    await esperarMonto(disponible(page, 'Mascota'), 2000);
    await esperarMonto(pagoTarjeta(page).nth(0), 8000);
    await esperarMonto(pagoTarjeta(page).nth(1), 12000);
  });

  test('PRU-E2E-TX-378 [CA-21.3, ESC-20] registro una compra con débito de $50.00 con $25.00 en Super y $25.00 por cobrar a Ana y Listo para asignar baja a $675.00 con $25.00 en camino', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC20_PASO1);
    await abrir(page, '/registrar/gasto');
    await opcion(page, t.cuenta, 'Ahorro').click();
    await campo(page, t.total).fill('50');
    await parteConCategoria(page, 1, '25', 'Super');
    await agregarParte(page);
    await campo(page, t.montoDeParte('2')).fill('25');
    await opcion(page, t.destinoDeParte('2'), t.destinoPorCobrar).click();
    await campo(page, t.deudorNuevoDeParte('2')).fill('Ana');
    await page.getByRole('button', { name: t.guardar }).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(listoParaAsignar(page), 67500);
    await expect(page.locator('[data-en-camino]').first()).toContainText('$25.00');
  });

  test('PRU-E2E-TX-379 [CA-21.4] con un deudor "Ana" ya creado, escribir "ana" como otra persona deja la parte a nombre de Ana y el resultado lo dice', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC20_PASO2);
    await abrir(page, '/registrar/gasto');
    await campo(page, t.total).fill('40');
    await opcion(page, t.cuenta, 'Ahorro').click();
    await parteConCategoria(page, 1, '20', 'Super');
    await agregarParte(page);
    await campo(page, t.montoDeParte('2')).fill('20');
    await opcion(page, t.destinoDeParte('2'), t.destinoPorCobrar).click();
    await expect(opcion(page, t.deudorDeParte('2'), 'Ana')).toBeVisible();
    await opcion(page, t.deudorDeParte('2'), t.otraPersona).click();
    await campo(page, t.deudorNuevoDeParte('2')).fill('ana');
    await page.getByRole('button', { name: t.guardar }).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('deudor-existente')).toHaveText(t.deudorExistente('Ana'));
  });

  test('PRU-E2E-TX-380 [CA-21.5] con partes que suman $149.00 y un total de $150.00, enviar muestra "Las partes suman $149.00 y el total es $150.00." junto al campo de las partes y no guarda', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await opcion(page, t.cuenta, 'T').click();
    await campo(page, t.total).fill('150');
    await parteConCategoria(page, 1, '110', 'Super');
    await agregarParte(page);
    await parteConCategoria(page, 2, '39', 'Mascota');
    await expect(page.getByTestId('falta-repartir')).toHaveText(t.faltaRepartir('$1.00'));
    await page.getByRole('button', { name: t.guardar }).click();
    await expect(
      page
        .locator('[data-campo-lineas]')
        .getByText('Las partes suman $149.00 y el total es $150.00.'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listo })).toHaveCount(0);
    // el servidor no guardó nada: Super y Mascota siguen como en el paso 1
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), 10000);
    await esperarMonto(disponible(page, 'Mascota'), 2000);
  });

  test('PRU-E2E-TX-381 [CA-21.6] una parte sin categoría ni deudor se rechaza con "Cada parte necesita una categoría o un por cobrar." y no se crea nada', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await opcion(page, t.cuenta, 'T').click();
    await campo(page, t.total).fill('50');
    await campo(page, t.montoDeParte('1')).fill('50');
    await page.getByRole('button', { name: t.guardar }).click();
    await expect(page.getByText(t.lineaSinDestino)).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listo })).toHaveCount(0);
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), 10000);
    await expect(page.locator('[data-fila-pago]').first()).toBeVisible();
    await esperarMonto(pagoTarjeta(page).nth(1), 0);
  });

  test('PRU-E2E-TX-382 desde Registrar elijo un gasto y se abre la página completa del gasto, y un ingreso se abre sobre Registrar y se cierra volviendo a ella', async ({
    page,
  }) => {
    await preparar('2027-02-10', [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'Débito' },
    ]);
    await abrir(page, '/registrar');
    await expect(page.getByRole('heading', { name: t.titulo, level: 1 })).toBeVisible();
    await page.getByRole('link', { name: t.tipoIngreso }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(/\/registrar\/ingreso$/);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/registrar$/);
    await page.getByRole('link', { name: t.tipoGasto }).click();
    await expect(page).toHaveURL(/\/registrar\/gasto$/);
    await expect(page.getByRole('heading', { name: t.tituloGasto, level: 1 })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(campo(page, t.total)).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/registrar$/);
    await expect(page.getByRole('heading', { name: t.titulo, level: 1 })).toBeVisible();
  });

  test('PRU-E2E-TX-383 sin cuentas, Registrar y el gasto explican que primero hay que crear una y enlazan a crearla', async ({
    page,
  }) => {
    await preparar('2027-02-10', []);
    await abrir(page, '/registrar');
    await expect(page.getByRole('heading', { name: t.sinCuentasTitulo })).toBeVisible();
    await expect(page.getByRole('link', { name: t.crearCuenta })).toHaveAttribute(
      'href',
      '/cuentas/nueva',
    );
    await abrir(page, '/registrar/gasto');
    await expect(page.getByRole('heading', { name: t.sinCuentasTitulo })).toBeVisible();
    await expect(page.getByRole('link', { name: t.crearCuenta })).toHaveAttribute(
      'href',
      '/cuentas/nueva',
    );
  });
});
