// FT-13 Auto-asignar (06 FT-13; 05 §2.3; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones
// reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona. Lo que se
// asigna lo calcula el motor: la prueba solo comprueba que el flujo lo dibuja y lo envía (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-05';

// ESC-03 hasta el paso 5 (01 §8): ingreso de $1,000.00, Super $600.00 y Gas $200.00 en P1 y Salidas $300.00 en P2. Mascota tiene su
// meta de $50.00 como estado previo y Listo para asignar queda en −$100.00 (el paso 4 se rechaza y no deja nada).
const ESC03_PASO5: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-18', categoria: 'Mascota', monto: 50 },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 600, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Salidas', monto: 300, periodo: 'P2' },
  { op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1' },
];
// Listo para asignar $100.00 y tres categorías con meta mensual de $60.00, $50.00 y $30.00, en ese orden.
const TRES_METAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Alfa' },
  { op: 'OP-07', categoria: 'Beta' },
  { op: 'OP-07', categoria: 'Gama' },
  { op: 'OP-18', categoria: 'Alfa', monto: 60 },
  { op: 'OP-18', categoria: 'Beta', monto: 50 },
  { op: 'OP-18', categoria: 'Gama', monto: 30 },
  { op: 'OP-21', monto: 100 },
];
// Sin ninguna meta: no hay nada que auto-asignar.
const SIN_METAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
];

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PRES-AUTO',
    titulo: 'Semilla de FT-13',
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
const confirmar = (page: Page) => page.getByRole('button', { name: /^Asignar \$/ });
/** La fila de una categoría en la tarjeta de la confirmación (CH-180): nombre, «falta para la meta» y «+$…». */
const filaDeImpacto = (page: Page, nombre: string) =>
  page
    .locator('[aria-labelledby="confirmacion-titulo"] li')
    .filter({ has: page.getByText(nombre, { exact: true }) });

test.describe('PRU-E2E-PRES', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-200 [CA-13.1, ESC-03, AV-18] con Listo para asignar en −$100.00 la previsualización dice que no asignará nada y que Mascota queda sin cubrir por $50.00, y ninguna asignación cambia', async ({
    page,
  }) => {
    await sembrarOps(ESC03_PASO5, HOY);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), -10000);
    await abrir(page, '/presupuesto/auto-asignar');
    await expect(page.getByText('Finn no asignará nada')).toBeVisible();
    await expect(page.getByText('Mascota queda con $50.00 sin cubrir.')).toBeVisible();
    await expect(confirmar(page)).toHaveCount(0);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), -10000);
    await esperarMonto(montoDeFila(page, 'Super', 0), 60000);
    await esperarMonto(montoDeFila(page, 'Gas', 0), 20000);
    await esperarMonto(montoDeFila(page, 'Mascota', 0), 0);
  });

  test('PRU-E2E-PRES-201 [CA-13.2, AV-18] con Listo para asignar en $100.00 y faltas de $60.00, $50.00 y $30.00 reciben $60.00, $40.00 y $0.00, Listo para asignar queda en $0.00 y el aviso lista $10.00 y $30.00', async ({
    page,
  }) => {
    await sembrarOps(TRES_METAS, HOY);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 10000);
    await page.getByRole('link', { name: 'Auto-asignar' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Esto asignaría Finn')).toBeVisible();
    await expect(filaDeImpacto(page, 'Alfa')).toContainText('+$60.00');
    await expect(filaDeImpacto(page, 'Beta')).toContainText('+$40.00');
    await expect(page.getByText('Beta queda con $10.00 sin cubrir.')).toBeVisible();
    await expect(page.getByText('Gama queda con $30.00 sin cubrir.')).toBeVisible();
    await confirmar(page).click();
    // Después (AV-18): el aviso queda a la vista hasta que se lo lee
    await expect(page.getByText('Asignación hecha')).toBeVisible();
    await expect(page.getByText('Beta quedó sin cubrir por $10.00.')).toBeVisible();
    await expect(page.getByText('Gama quedó sin cubrir por $30.00.')).toBeVisible();
    await page.getByRole('button', { name: 'Listo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await esperarContenido(page);
    await esperarMonto(lpa(page), 0);
    await esperarMonto(montoDeFila(page, 'Alfa', 0), 6000);
    await esperarMonto(montoDeFila(page, 'Beta', 0), 4000);
    await esperarMonto(montoDeFila(page, 'Gama', 0), 0);
  });

  test('PRU-E2E-PRES-202 [CA-13.3] si otra pestaña cambió algo después de la previsualización, confirmar responde conflicto_desactualizado sin asignar nada y volver a calcular previsualiza con el estado actual', async ({
    page,
    context,
  }) => {
    await sembrarOps(TRES_METAS, HOY);
    await abrir(page, '/presupuesto');
    const alfa = await fila(page, 'Alfa').getAttribute('data-fila-categoria');
    await abrir(page, '/presupuesto/auto-asignar');
    await expect(filaDeImpacto(page, 'Alfa')).toContainText('+$60.00');
    // La otra pestaña asigna $10.00 a Alfa mientras esta sigue con la previsualización de antes
    const otra = await context.newPage();
    await abrir(otra, `/presupuesto/asignar/${alfa}`);
    await otra.getByLabel(/Nuevo valor de Asignado/).fill('10');
    await otra.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(otra).toHaveURL(/\/presupuesto$/);
    await otra.close();
    await confirmar(page).click();
    await expect(page.getByText(/Este valor cambió mientras lo editabas/)).toBeVisible();
    await expect(confirmar(page)).toHaveCount(0);
    // No asignó nada: Alfa sigue con los $10.00 de la otra pestaña
    await page.getByRole('button', { name: 'Volver a calcular' }).click();
    await expect(filaDeImpacto(page, 'Alfa')).toContainText('+$50.00');
    await expect(filaDeImpacto(page, 'Beta')).toContainText('+$40.00');
    await confirmar(page).click();
    await page.getByRole('button', { name: 'Listo', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(lpa(page), 0);
    await esperarMonto(montoDeFila(page, 'Alfa', 0), 6000);
    await esperarMonto(montoDeFila(page, 'Beta', 0), 4000);
  });

  test('PRU-E2E-PRES-742 [CA-E6-16] auto-asignar muestra la tarjeta K4 con «Beta queda con … sin cubrir» antes de confirmar y «Asignar $X» confirma una sola vez', async ({
    page,
  }) => {
    await sembrarOps(TRES_METAS, HOY);
    await abrir(page, '/presupuesto/auto-asignar');
    await expect(page.getByText('Beta queda con $10.00 sin cubrir.')).toBeVisible();
    await expect(confirmar(page)).toHaveText('Asignar $100.00');
    await confirmar(page).dblclick();
    await expect(page.getByText('Asignación hecha')).toBeVisible();
    await page.getByRole('button', { name: 'Listo', exact: true }).click();
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 0);
    await esperarMonto(montoDeFila(page, 'Alfa', 0), 6000);
    await esperarMonto(montoDeFila(page, 'Beta', 0), 4000);
  });

  test('PRU-E2E-PRES-203 sin metas con falta el flujo dice que todas están cubiertas y no ofrece confirmar', async ({
    page,
  }) => {
    await sembrarOps(SIN_METAS, HOY);
    await abrir(page, '/presupuesto/auto-asignar');
    await expect(page.getByText('Todas tus metas de este período están cubiertas.')).toBeVisible();
    await expect(confirmar(page)).toHaveCount(0);
  });
  test('PRU-E2E-PRES-280 [FT-13] la hoja de Auto-asignar dibuja el período, la introducción, una fila por categoría con «+$…» y «Cancelar» y «Asignar» de 44 px o más; «Cancelar» cierra sin asignar nada', async ({
    page,
  }) => {
    await sembrarOps(TRES_METAS, HOY);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 10000);
    await page.getByRole('link', { name: 'Auto-asignar' }).click();
    const hoja = page.getByRole('dialog');
    await expect(hoja).toBeVisible();
    await expect(hoja.getByText(/^Período \d{2}\/\d{2} – \d{2}\/\d{2}\/\d{4}$/)).toBeVisible();
    await expect(
      hoja.getByText('hasta donde alcance Listo para asignar ($100.00).', { exact: false }),
    ).toBeVisible();
    await expect(filaDeImpacto(page, 'Alfa')).toContainText('falta para la meta');
    await expect(filaDeImpacto(page, 'Alfa')).toContainText('+$60.00');
    await expect(filaDeImpacto(page, 'Beta')).toContainText('+$40.00');
    await expect(hoja.getByText('→')).toHaveCount(0);
    const cancelar = hoja.getByRole('button', { name: 'Cancelar', exact: true });
    for (const b of [cancelar, confirmar(page)]) {
      const caja = await b.boundingBox();
      expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await cancelar.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await esperarContenido(page);
    await esperarMonto(lpa(page), 10000);
    await esperarMonto(montoDeFila(page, 'Alfa', 0), 0);
  });
});
