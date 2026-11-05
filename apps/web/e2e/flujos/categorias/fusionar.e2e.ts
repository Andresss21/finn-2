// FT-20 Fusionar categorías (06 FT-20; 05 §2.3; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de ESC-42 (01 §8, DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona. Los
// números los pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-04-05';
// ESC-42 paso 0 (Historial): Café con meta mensual de $50.00 y $50.00 en P1, Salidas con $100.00 en P1, y los débitos del 3 y el
// 4 de febrero. Listo para asignar queda en $820.00 y Salidas en $60.00.
const ESC42_PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Café' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-18', categoria: 'Café', monto: 50 },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Café', monto: 50, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Café', hoy: '2027-02-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Salidas', hoy: '2027-02-04' },
];
// Dos categorías sin asignaciones ni movimientos: la fusión no cambia ningún número.
const SIN_IMPACTO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Café' },
  { op: 'OP-07', categoria: 'Salidas' },
];

async function sembrarOps(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CATEG-FUSIONAR',
    titulo: 'Semilla de FT-20',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();

/** Desde el detalle de Café, «Fusionar con otra» y la elección de Salidas, hasta la previsualización. */
async function previsualizarCafeEnSalidas(page: Page): Promise<void> {
  await abrir(page, '/presupuesto');
  const id = await fila(page, 'Café').getAttribute('data-fila-categoria');
  await abrir(page, `/presupuesto/categorias/${id}`);
  await page.getByRole('button', { name: 'Más acciones' }).click();
  await page.getByRole('menuitem', { name: 'Fusionar con otra', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fusionar categorías', level: 1 })).toBeVisible();
  await page.getByLabel('Fusionar con').selectOption({ label: 'Salidas' });
  await page.getByRole('button', { name: 'Fusionar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisá el impacto' })).toBeVisible();
}

async function confirmar(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page).toHaveURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);
}

test.describe('PRU-E2E-CATEG', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CATEG-120 [CA-20.1, ESC-42, AV-13, AV-01] fusionar Café en Salidas muestra Δ Listo para asignar +$30.00, Δ Salidas −$30.00 y la meta que se descarta, y al confirmar Listo para asignar queda en $850.00 y Salidas en $30.00', async ({
    page,
  }) => {
    await sembrarOps(ESC42_PASO0);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 82000);
    await esperarMonto(fila(page, 'Salidas').locator('[data-centavos]').first(), 6000);

    await previsualizarCafeEnSalidas(page);
    await expect(page.getByText('Listo para asignar: +$30.00')).toBeVisible();
    await expect(page.getByText('Disponible de Salidas: −$30.00')).toBeVisible();
    await expect(page.getByText('Se descarta la meta de Café.')).toBeVisible();
    await expect(page.getByText('La fusión modifica períodos cerrados.')).toBeVisible();
    await confirmar(page);

    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 85000);
    await esperarMonto(fila(page, 'Salidas').locator('[data-centavos]').first(), 3000);
    await expect(fila(page, 'Café')).toHaveCount(0);
  });

  test('PRU-E2E-CATEG-121 [CA-20.2, ESC-42] con la fusión hecha, el período 1 muestra a Salidas con Asignado $150.00 y Gastado $120.00, y Café no existe', async ({
    page,
  }) => {
    await sembrarOps(ESC42_PASO0);
    await previsualizarCafeEnSalidas(page);
    await confirmar(page);

    await abrir(page, '/presupuesto?periodo=2027-01-21');
    await expect(fila(page, 'Café')).toHaveCount(0);
    // Disponible, Asignado y Gastado, en ese orden (05 §10.8)
    await esperarMonto(fila(page, 'Salidas').locator('[data-centavos]').nth(1), 15000);
    await esperarMonto(fila(page, 'Salidas').locator('[data-centavos]').nth(2), 12000);
  });

  test('PRU-E2E-CATEG-122 [CA-20.3] aunque la fusión no cambie ningún número igual pide confirmar y no fusiona hasta hacerlo', async ({
    page,
  }) => {
    await sembrarOps(SIN_IMPACTO);
    await previsualizarCafeEnSalidas(page);
    await expect(
      page.getByText('La fusión no cambia ningún número del período actual.'),
    ).toBeVisible();
    await abrir(page, '/presupuesto');
    await expect(fila(page, 'Café')).toHaveCount(1);

    await previsualizarCafeEnSalidas(page);
    await confirmar(page);
    await abrir(page, '/presupuesto');
    await expect(fila(page, 'Café')).toHaveCount(0);
  });
});
