// FT-15 Detalle de Listo para asignar (06 FT-15; 05 §2.3; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con
// las operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04); abre `/presupuesto/listo-para-asignar` como la persona. Los números los pone el motor: la
// prueba solo comprueba que la pantalla los dibuja (PF-3). La suma exacta de la descomposición (CA-15.1) la prueba el dominio
// (PRU-PROP-PRES-102).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/presupuesto/listo-para-asignar';

// Las operaciones de 01 §8: ESC-02 hasta el paso 2, ESC-15 hasta el paso 2, ESC-17 hasta el paso 2 (con el día de cada operación,
// porque el paso 3 es el cierre) y ESC-40 hasta el paso 1.
const ESC02: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 500, apertura: '2027-01-25' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 200, apertura: '2027-01-25' },
];
const ESC15: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas' },
];
const HOY17 = '2027-02-12';
const ESC17: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500, hoy: HOY17 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: HOY17 },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 60,
    categoria: 'Super',
    etiqueta: 'D60',
    fecha: '2027-02-10',
    registrado: '2027-02-10T10:00',
    hoy: HOY17,
  },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 70,
    categoria: 'Super',
    etiqueta: 'T70',
    fecha: '2027-02-10',
    registrado: '2027-02-10T12:00',
    hoy: HOY17,
  },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 20,
    categoria: 'Super',
    etiqueta: 'D20',
    fecha: '2027-02-10',
    hoy: HOY17,
  },
];
const ESC40: Op[] = [
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

async function sembrarOps(ops: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  await sembrar(
    {
      id: 'SEM-LPA-LISTA',
      titulo: 'Semilla de FT-15',
      refs: [],
      hoy,
      estadoInicial: ops,
      pasos: [],
    },
    hoy,
  );
}

async function abrir(page: Page, ruta = RUTA): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** El monto de una línea de la descomposición, por su etiqueta. */
const linea = (page: Page, etiqueta: string) =>
  page
    .locator('[data-seccion="descomposicion"] dl > div')
    .filter({ has: page.getByText(etiqueta, { exact: true }) })
    .locator('[data-centavos]');

test.describe('PRU-E2E-PRES', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-107 [CA-15.2, ESC-02] con el paso 3 de ESC-02 el historial muestra $500.00 como Listo para asignar al cierre de P1', async ({
    page,
  }) => {
    await sembrarOps(ESC02, '2027-03-05');
    await abrir(page);
    const filaP1 = page.locator('[data-tabla-equivalente] tbody tr').filter({ hasText: '21 ene' });
    await esperarMonto(filaP1.locator('[data-centavos]'), 50000);
    await expect(page.locator('[data-nota-historial="sin_adelantos"]')).toBeVisible();
  });

  test('PRU-E2E-PRES-108 [CA-15.3, ESC-17] con el paso 3 de ESC-17 "Reducciones por sobregiro con débito" es $20.00', async ({
    page,
  }) => {
    await sembrarOps(ESC17, '2027-02-21');
    await abrir(page);
    await esperarMonto(linea(page, 'Reducciones por sobregiro con débito'), 2000);
  });

  test('PRU-E2E-PRES-109 [CA-15.4, ESC-15] con el paso 2 de ESC-15 la reducción proyectada al cierre es $50.00 y lista Salidas', async ({
    page,
  }) => {
    await sembrarOps(ESC15, '2027-02-10');
    await abrir(page);
    await esperarMonto(page.locator('[data-reduccion-total] [data-centavos]'), 5000);
    await expect(page.locator('[data-seccion="reduccion"]')).toContainText('Salidas');
  });

  test('PRU-E2E-PRES-110 [CA-15.5, ESC-40] con el paso 1 de ESC-40 "Otras entradas" es $5,000.00 e "Ingresos" $0.00', async ({
    page,
  }) => {
    await sembrarOps(ESC40, '2027-02-10');
    await abrir(page);
    await esperarMonto(linea(page, 'Otras entradas'), 500000);
    await esperarMonto(linea(page, 'Ingresos'), 0);
  });

  test('PRU-E2E-PRES-111 un ?historial= fuera de 1 a 60 redirige a la ruta sin el parámetro y uno válido se conserva', async ({
    page,
  }) => {
    await sembrarOps(ESC02, '2027-03-05');
    await abrir(page, `${RUTA}?historial=61`);
    await expect(page).toHaveURL(new RegExp(`${RUTA}$`));
    await abrir(page, `${RUTA}?historial=1`);
    await expect(page).toHaveURL(/historial=1$/);
    await expect(page.locator('[data-seccion="historial"]')).toBeVisible();
  });
});
