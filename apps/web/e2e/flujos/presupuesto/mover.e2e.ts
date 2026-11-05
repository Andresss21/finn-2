// FT-11 Mover dinero entre categorías (06 FT-11; 05 §2.3; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con
// las operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona.
// Los números los pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-16 hasta el paso 1 (hoy 10 feb, P1 activo): Salidas con $100.00 y $150.00 gastados (−$50.00) y Super con $80.00.
const ESC16_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Super', monto: 80, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas' },
];
const ESC16_PASO2: Op[] = [
  ...ESC16_PASO1,
  { op: 'OP-15', origen: 'Super', destino: 'Salidas', monto: 50 },
];

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PRES-MOVER',
    titulo: 'Semilla de FT-11',
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

// Por el nombre exacto: "Gas" también está en "Gastado" de todas las filas.
const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
/** Los montos de una fila de categoría: Disponible, Asignado y Gastado, en ese orden (05 §10.8). */
const montoDeFila = (page: Page, nombre: string, n: 0 | 1 | 2) =>
  fila(page, nombre).locator('[data-centavos]').nth(n);

const elegir = async (page: Page, grupo: 'Sacar de' | 'Poner en', categoria: string) =>
  page.getByLabel(grupo).selectOption({ label: categoria });
const mover = (page: Page) => page.getByRole('button', { name: 'Mover', exact: true });

async function moverDinero(
  page: Page,
  origen: string,
  destino: string,
  monto: string,
): Promise<void> {
  await elegir(page, 'Sacar de', origen);
  await elegir(page, 'Poner en', destino);
  await page.getByLabel(/Monto a mover/).fill(monto);
  await mover(page).click();
}

test.describe('PRU-E2E-PRES', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-150 [CA-11.1, ESC-16] mover $50.00 de Super a Salidas las deja en $0.00 y $30.00, Listo para asignar sigue en $320.00 y al cerrar el período también', async ({
    page,
  }) => {
    await sembrarOps(ESC16_PASO1, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Salidas', 0), -5000);
    await esperarMonto(lpa(page), 32000);
    await page.getByRole('link', { name: 'Mover dinero' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await moverDinero(page, 'Super', 'Salidas', '50');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarMonto(montoDeFila(page, 'Salidas', 0), 0);
    await esperarMonto(montoDeFila(page, 'Super', 0), 3000);
    await esperarMonto(lpa(page), 32000);
    // Paso 3: el 21 de feb P1 está cerrado y Listo para asignar sigue igual
    fijarRelojServidor('2027-02-21T10:00:00-06:00');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 32000);
    await esperarMonto(montoDeFila(page, 'Super', 0), 3000);
  });

  test('PRU-E2E-PRES-250 [FT-11] la hoja de Mover dibuja origen y destino como selección con su Disponible y «Cancelar», que cierra sin mover nada', async ({
    page,
  }) => {
    await sembrarOps(ESC16_PASO1, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 32000);
    await page.getByRole('link', { name: 'Mover dinero' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await elegir(page, 'Sacar de', 'Super');
    await expect(page.getByRole('dialog')).toContainText('Disponible $80.00');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await esperarMonto(montoDeFila(page, 'Super', 0), 8000);
  });

  test('PRU-E2E-PRES-151 [CA-11.2, ESC-16, AV-02] mover $50.00 de Super con $30.00 se acepta, lo deja en −$20.00 y la fila muestra el sobregiro con débito', async ({
    page,
  }) => {
    await sembrarOps(ESC16_PASO2, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Super', 0), 3000);
    await abrir(page, '/presupuesto/mover');
    await moverDinero(page, 'Super', 'Salidas', '50');
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Super', 0), -2000);
    await expect(fila(page, 'Super')).toContainText('Sobregiro con débito o efectivo');
  });

  test('PRU-E2E-PRES-152 [CA-11.2, AV-03] mover $50.00 de Super con compras a tarjeta lo deja en −$150.00 y la fila muestra la deuda sin reservar', async ({
    page,
  }) => {
    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-07', categoria: 'Salidas' },
        { op: 'OP-21', monto: 1000, hoy: '2027-02-10' },
        { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1', hoy: '2027-02-10' },
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 400,
          categoria: 'Super',
          fecha: '2027-02-10',
          hoy: '2027-02-10',
        },
      ],
      '2027-02-15',
    );
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Super', 0), -10000);
    await abrir(page, '/presupuesto/mover');
    await moverDinero(page, 'Super', 'Salidas', '50');
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Super', 0), -15000);
    await expect(fila(page, 'Super')).toContainText('Deuda sin reservar');
  });

  test('PRU-E2E-PRES-153 [CA-11.3] elegir la misma categoría de origen y de destino se rechaza con destino_igual_origen y no mueve nada', async ({
    page,
  }) => {
    await sembrarOps(ESC16_PASO1, '2027-02-10');
    await abrir(page, '/presupuesto');
    await abrir(page, '/presupuesto/mover');
    await moverDinero(page, 'Super', 'Super', '10');
    await expect(page.getByText('Elegí otra categoría.')).toBeVisible();
    await expect(page).toHaveURL(/\/presupuesto\/mover/);
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Super', 0), 8000);
    await esperarMonto(montoDeFila(page, 'Salidas', 0), -5000);
  });

  test('PRU-E2E-PRES-154 [CA-11.4] con Listo para asignar negativo, mover entre dos categorías no pide confirmación y lo deja igual', async ({
    page,
  }) => {
    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-07', categoria: 'Salidas' },
        { op: 'OP-21', monto: 100 },
        { op: 'OP-14', categoria: 'Super', monto: 150, periodo: 'P1' },
      ],
      '2027-02-05',
    );
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), -5000);
    await abrir(page, '/presupuesto/mover');
    await moverDinero(page, 'Super', 'Salidas', '20');
    // Sin la pantalla de AV-11: va directo a Presupuesto
    await expect(page).toHaveURL(/\/presupuesto$/);
    await expect(page.getByText(/dejará Listo para asignar/)).toHaveCount(0);
    await esperarContenido(page);
    await esperarMonto(lpa(page), -5000);
    await esperarMonto(montoDeFila(page, 'Salidas', 0), 2000);
    await esperarMonto(montoDeFila(page, 'Super', 0), 13000);
  });
});
