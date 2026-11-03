// FT-12 Asignación rápida (06 FT-12; 05 §2.3; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona.
// Los valores de las opciones los calcula el motor (`rapida`, 04 §6.14.4): la prueba solo comprueba que se dibujan y se envían (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const P1_HOY = '2027-02-10';
const P2_HOY = '2027-02-21';

// ESC-35 hasta el paso 2 (01 §8): Gas con meta de 200 "rellenar hasta", Fondo con meta de 200 "acumular"; en P1 se asignan 200 a
// cada una y se gastan 120 de Gas. Con hoy = 21 feb (A = P2), Gas pide 120 y Fondo 200.
const ESC35_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', hoy: '2027-01-21' },
  { op: 'OP-07', categoria: 'Gas', hoy: '2027-01-21' },
  { op: 'OP-07', categoria: 'Fondo', hoy: '2027-01-21' },
  { op: 'OP-18', categoria: 'Gas', monto: 200, modo: 'rellenar_hasta', hoy: '2027-01-21' },
  { op: 'OP-18', categoria: 'Fondo', monto: 200, modo: 'acumular', hoy: '2027-01-21' },
  { op: 'OP-21', monto: 1000, hoy: P1_HOY },
  { op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1', hoy: P1_HOY },
  { op: 'OP-14', categoria: 'Fondo', monto: 200, periodo: 'P1', hoy: P1_HOY },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 120, categoria: 'Gas', fecha: P1_HOY, hoy: P1_HOY },
];
// Super con $250.00 asignados en P1 y un ingreso de $1,000.00: en P2 quedan $750.00 por asignar.
const SUPER_250: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', hoy: '2027-01-21' },
  { op: 'OP-07', categoria: 'Super', hoy: '2027-01-21' },
  { op: 'OP-21', monto: 1000, hoy: P1_HOY },
  { op: 'OP-14', categoria: 'Super', monto: 250, periodo: 'P1', hoy: P1_HOY },
];
// Super con $600.00 asignados en P1 y Listo para asignar en $400.00 en P2: repetir los $600.00 lo deja en −$200.00 (AV-11).
const SUPER_600: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', hoy: '2027-01-21' },
  { op: 'OP-07', categoria: 'Super', hoy: '2027-01-21' },
  { op: 'OP-21', monto: 1000, hoy: P1_HOY },
  { op: 'OP-14', categoria: 'Super', monto: 600, periodo: 'P1', hoy: P1_HOY },
];
// Restaurantes con Asignado $120.00 y un gasto de $146.30 en el período activo: Disponible −$26.30 (A.7, CA-12.9).
const RESTAURANTES: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', hoy: '2027-01-21' },
  { op: 'OP-07', categoria: 'Restaurantes', hoy: '2027-01-21' },
  { op: 'OP-21', monto: 1000, hoy: P2_HOY },
  { op: 'OP-14', categoria: 'Restaurantes', monto: 120, hoy: P2_HOY },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 146.3,
    categoria: 'Restaurantes',
    fecha: P2_HOY,
    hoy: P2_HOY,
  },
];

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PRES-RAPIDA',
    titulo: 'Semilla de FT-12',
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

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
/** Los montos de una fila de categoría: Disponible, Asignado y Gastado, en ese orden (05 §10.8). */
const montoDeFila = (page: Page, nombre: string, n: 0 | 1 | 2) =>
  fila(page, nombre).locator('[data-centavos]').nth(n);

async function idDe(page: Page, nombre: string): Promise<string> {
  const id = await fila(page, nombre).getAttribute('data-fila-categoria');
  if (id === null) throw new Error(`no hay una fila de ${nombre}`);
  return id;
}

const opcion = (page: Page, nombre: string) =>
  page.locator('[data-asignacion-rapida]').getByRole('button', { name: new RegExp(nombre) });
const resumen = (page: Page, campo: 'asignado' | 'disponible') =>
  page.locator(`[data-resumen-asignar] [data-campo="${campo}"] [data-centavos]`);

test.describe('PRU-E2E-PRES', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-190 [CA-12.1, ESC-35] en el paso 2 de ESC-35, «Lo que falta para la meta» en Gas deja Asignado en $120.00 y la falta en $0.00, y la opción deja de ofrecerse', async ({
    page,
  }) => {
    await sembrarOps(ESC35_PASO2, P2_HOY);
    await abrir(page, '/presupuesto');
    const gas = await idDe(page, 'Gas');
    await abrir(page, `/presupuesto/asignar/${gas}`);
    await esperarMonto(opcion(page, 'Lo que falta para la meta').locator('[data-centavos]'), 12000);
    await opcion(page, 'Lo que falta para la meta').click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Gas', 1), 12000);
    // La falta quedó en $0.00: la pantalla de asignar ya no ofrece completar la meta
    await abrir(page, `/presupuesto/asignar/${gas}`);
    await esperarMonto(resumen(page, 'asignado'), 12000);
    await expect(
      page.getByText('Falta para la meta', { exact: true }).locator('xpath=..'),
    ).toContainText('$0.00');
    await expect(opcion(page, 'Lo que falta para la meta')).toHaveCount(0);
  });

  test('PRU-E2E-PRES-191 [CA-12.2] con Asignado $250.00 en el período anterior, «Lo mismo que el período pasado» deja Asignado en $250.00', async ({
    page,
  }) => {
    await sembrarOps(SUPER_250, P2_HOY);
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Super', 1), 0);
    await abrir(page, `/presupuesto/asignar/${await idDe(page, 'Super')}`);
    await esperarMonto(
      opcion(page, 'Lo mismo que el período pasado').locator('[data-centavos]'),
      25000,
    );
    await opcion(page, 'Lo mismo que el período pasado').click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Super', 1), 25000);
    await esperarMonto(lpa(page), 50000);
  });

  test('PRU-E2E-PRES-192 [CA-12.5, AV-11] si el valor rápido dejaría Listo para asignar en −$200.00 aparece AV-11 antes de confirmar, y al confirmar queda así', async ({
    page,
  }) => {
    await sembrarOps(SUPER_600, P2_HOY);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 40000);
    await abrir(page, `/presupuesto/asignar/${await idDe(page, 'Super')}`);
    await opcion(page, 'Lo mismo que el período pasado').click();
    await expect(page.getByText('dejará Listo para asignar en −$200.00')).toBeVisible();
    // Nada se escribió todavía
    await page.getByRole('button', { name: 'Volver a editar', exact: true }).click();
    await esperarMonto(resumen(page, 'asignado'), 0);
    await opcion(page, 'Lo mismo que el período pasado').click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(lpa(page), -20000);
    await esperarMonto(montoDeFila(page, 'Super', 1), 60000);
  });

  test('PRU-E2E-PRES-193 [CA-12.9] con Restaurantes en Asignado $120.00 y Disponible −$26.30, abrir asignar desde «Cubrir $26.30» trae «Cubrir el sobregiro» con $146.30 y al tocarla Asignado queda en $146.30', async ({
    page,
  }) => {
    await sembrarOps(RESTAURANTES, P2_HOY);
    await abrir(page, '/presupuesto');
    const id = await idDe(page, 'Restaurantes');
    await esperarMonto(montoDeFila(page, 'Restaurantes', 0), -2630);
    await abrir(page, `/presupuesto/categorias/${id}`);
    await page.getByRole('link', { name: /^Cubrir/ }).click();
    await expect(page).toHaveURL(new RegExp(`/presupuesto/asignar/${id}`));
    await esperarMonto(opcion(page, 'Cubrir el sobregiro').locator('[data-centavos]'), 14630);
    await opcion(page, 'Cubrir el sobregiro').click();
    // Vuelve al detalle de donde vino, ya con el Disponible en $0.00
    await expect(page).toHaveURL(new RegExp(`/presupuesto/categorias/${id}`));
    await esperarMonto(page.locator('main header [data-centavos]').first(), 0);
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Restaurantes', 1), 14630);
    await esperarMonto(montoDeFila(page, 'Restaurantes', 0), 0);
    // Con Disponible ≥ 0 la opción ya no se ofrece (CF-25)
    await abrir(page, `/presupuesto/asignar/${id}`);
    await expect(opcion(page, 'Lo mismo que el período pasado')).toBeVisible();
    await expect(opcion(page, 'Cubrir el sobregiro')).toHaveCount(0);
  });
});
