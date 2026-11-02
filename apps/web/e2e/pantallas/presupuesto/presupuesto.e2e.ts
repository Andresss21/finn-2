// FT-09 Presupuesto del período: filtros, períodos cerrados y futuros (06 FT-09; 05 §2.3 y §7; 07 §17: una pantalla, una
// navegación o un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones reales de un escenario de 01 §8
// (DP-17) y del reloj del servidor fijo (DP-04), y abre `/presupuesto` como la persona. Los números los pone el motor: la prueba
// solo comprueba que la pantalla los dibuja (PF-3). La identidad de CA-09.7 la prueba el dominio (PRU-DOM-PRES-106).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/presupuesto';
// Inicios de período del ciclo de 01 §8.0 (día 21, 2027).
const P1 = '2027-01-21';
const P2 = '2027-02-21';
const P3 = '2027-03-21';

// Las operaciones de 01 §8: ESC-49 paso 1, ESC-05 hasta el paso 2 (con su historial en P1) y ESC-44 hasta el paso 2.
const ESC49_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1500 },
  { op: 'OP-14', categoria: 'Super', monto: 400, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P2' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P3' },
];
const HISTORIAL_ESC05: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
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
];
const ESC44_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gimnasio' },
  { op: 'OP-21', monto: 700, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 70, periodo: 'P1', hoy: '2027-01-25' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 30,
    categoria: 'Gimnasio',
    fecha: '2027-02-02',
    hoy: '2027-02-02',
    etiqueta: 'gimnasio',
  },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 30, periodo: 'P3' },
  {
    op: 'OP-42',
    etiqueta: 'gimnasio',
    cuenta: 'Ahorro',
    comercio: 'Gimnasio',
    monto: 30,
    categoria: 'Gimnasio',
    primeraFecha: '2027-03-10',
  },
  {
    op: 'OP-09',
    categoria: 'Gimnasio',
    destino: 'LPA',
    devolverFuturas: true,
    desactivar: ['gimnasio'],
  },
  { op: 'OP-33', compra: 'gimnasio', monto: 25 },
];
// Tres categorías: una sobregirada con débito de $10.00, una con $0.00 y una meta que pide $50.00, y una con $20.00 sin meta.
const TRES_CLASES: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Sobregirada' },
  { op: 'OP-07', categoria: 'Sin fondos' },
  { op: 'OP-07', categoria: 'Cubierta' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Cubierta', monto: 20, periodo: 'P1' },
  { op: 'OP-18', categoria: 'Sin fondos', monto: 50, modo: 'acumular' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 10, categoria: 'Sobregirada' },
];

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PRES-LISTA',
    titulo: 'Semilla de FT-09',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta = RUTA): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ hasText: nombre });
/** El primer monto de una fila es su Disponible (05 §10.8). */
const disponible = (page: Page, nombre: string) =>
  fila(page, nombre).locator('[data-centavos]').first();

test.describe('PRU-E2E-PRES', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-101 [CA-09.1, ESC-49] con el paso 1 de ESC-49 Super muestra $700.00 en el período siguiente, $1,000.00 en el otro y $400.00 en el activo', async ({
    page,
  }) => {
    await sembrarOps(ESC49_PASO1, '2027-02-10');
    await abrir(page, `${RUTA}?periodo=${P2}`);
    await expect(page.locator('[data-selector-periodo="futuro"]')).toBeVisible();
    await esperarMonto(disponible(page, 'Super'), 70000);
    await abrir(page, `${RUTA}?periodo=${P3}`);
    await esperarMonto(disponible(page, 'Super'), 100000);
    await abrir(page);
    await expect(page.locator('[data-selector-periodo="activo"]')).toBeVisible();
    await esperarMonto(disponible(page, 'Super'), 40000);
  });

  test('PRU-E2E-PRES-102 [CA-09.2, ESC-05] con P1 cerrado Super muestra −$100.00 y ninguna fila ofrece asignar, mover ni auto-asignar', async ({
    page,
  }) => {
    await sembrarOps(HISTORIAL_ESC05, '2027-02-21');
    await abrir(page, `${RUTA}?periodo=${P1}`);
    await expect(page.locator('[data-selector-periodo="cerrado"]')).toBeVisible();
    await esperarMonto(disponible(page, 'Super'), -10000);
    await expect(page.getByRole('link', { name: /^Asignar/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Mover dinero' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Auto-asignar' })).toHaveCount(0);
    // El período activo, en cambio, sí ofrece asignar
    await abrir(page);
    await expect(page.getByRole('link', { name: 'Asignar a Super' })).toBeVisible();
  });

  test('PRU-E2E-PRES-103 [CA-09.3] cada filtro deja solo la categoría sobregirada, la que no tiene fondos para su meta o la cubierta', async ({
    page,
  }) => {
    await sembrarOps(TRES_CLASES, '2027-02-10');
    await abrir(page);
    await esperarMonto(disponible(page, 'Sobregirada'), -1000);
    await esperarMonto(disponible(page, 'Sin fondos'), 0);
    await esperarMonto(disponible(page, 'Cubierta'), 2000);
    const casos = [
      ['Sobregiradas', 'sobregiradas', 'Sobregirada'],
      ['Sin fondos', 'sin-fondos', 'Sin fondos'],
      ['Cubiertas', 'cubiertas', 'Cubierta'],
    ] as const;
    for (const [etiqueta, valor, unica] of casos) {
      await page.getByRole('link', { name: etiqueta, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/presupuesto\\?filtro=${valor}$`));
      await expect(page.locator('[data-fila-categoria]')).toHaveCount(1);
      await expect(fila(page, unica)).toBeVisible();
    }
    // Quitar el filtro vuelve a mostrar todas y deja la URL limpia
    await page.getByRole('link', { name: 'Todas', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await expect(page.locator('[data-fila-categoria]')).toHaveCount(3);
  });

  test('PRU-E2E-PRES-104 [CA-09.4] desde el período activo, "Período anterior" y luego "atrás" vuelven al activo con la URL sin ?periodo=', async ({
    page,
  }) => {
    await sembrarOps(HISTORIAL_ESC05, '2027-02-21');
    await abrir(page);
    await expect(page).toHaveURL(/\/presupuesto$/);
    await page.getByRole('link', { name: 'Período anterior' }).click();
    await expect(page).toHaveURL(new RegExp(`/presupuesto\\?periodo=${P1}$`));
    await expect(page.locator('[data-selector-periodo="cerrado"]')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await expect(page.locator('[data-selector-periodo="activo"]')).toBeVisible();
  });

  test('PRU-E2E-PRES-105 [CA-09.5] un ?periodo= que no es el inicio de un período redirige a /presupuesto sin el parámetro', async ({
    page,
  }) => {
    await sembrarOps(HISTORIAL_ESC05, '2027-02-21');
    await page.goto(`${RUTA}?periodo=2027-02-22`);
    await esperarContenido(page);
    await expect(page).toHaveURL(/\/presupuesto$/);
    await expect(page.getByRole('heading', { name: 'Presupuesto', level: 1 })).toBeVisible();
  });

  test('PRU-E2E-PRES-106 [CA-09.6, ESC-44] una archivada con $25.00 aparece en "archivadas con dinero" con el enlace a sacar y no entre las categorías de su grupo', async ({
    page,
  }) => {
    await sembrarOps(ESC44_PASO2, '2027-03-05');
    await abrir(page);
    const seccion = page.locator('[data-seccion="archivadas-con-dinero"]');
    await expect(seccion).toContainText('Gimnasio');
    await esperarMonto(seccion.locator('[data-centavos]').first(), 2500);
    await expect(
      seccion.getByRole('link', { name: 'Sacar el dinero de Gimnasio' }),
    ).toHaveAttribute('href', /\/presupuesto\/categorias\/[0-9a-f-]+\/sacar$/);
    await expect(fila(page, 'Gimnasio')).toHaveCount(0);
  });
});
