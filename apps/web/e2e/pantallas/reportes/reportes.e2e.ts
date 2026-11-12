// FT-60 Reportes base, primera mitad (06 FT-60; 05 §2.10 y §7; 07 §17: una pantalla es una E2E): tendencia, ingresos y gastos,
// remanente y patrimonio. Cada prueba parte de una base sembrada con las operaciones reales de un escenario de 01 §8 (DP-17), con
// el reloj del servidor fijo en el período que dice el CA (DP-04), y abre `/reportes/[tipo]` como la persona. Los números los
// pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// Las operaciones de 01 §8 (el dominio solo se importa por sus tipos en `apps/web`). Los montos están en dólares.
// ESC-01 hasta el paso 4: Ahorro $1,000.00, Visa T con deuda de $300.00 y un préstamo de $5,000.00.
const ESC01_PASO4: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 300 },
  { op: 'OP-14', categoria: 'Pago T', monto: 300, periodo: 'P1' },
  {
    op: 'OP-01',
    cuenta: 'Préstamo',
    tipo: 'prestamo',
    saldo: 5000,
    prestamo: {
      contraparte: 'Banco',
      montoOriginal: 6000,
      cuota: 100,
      plazoCuotas: 60,
      cuotasPagadas: 10,
    },
  },
];
// ESC-14 hasta el paso 1 (hoy 15 feb): el ingreso de $1,000.00 y el cashback de $30.00 a la tarjeta T.
const ESC14_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-01', cuenta: 'U', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super' },
  { op: 'OP-27', modalidad: 'entrada', tarjeta: 'T', monto: 30 },
];
// ESC-20 hasta el paso 4 (hoy 10 feb): compra compartida de $50.00 con Ana; cobros de $10.00 y $20.00 (excedente de $5.00).
const ESC20_PASO4: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
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
  { op: 'OP-31', cobro: 'compartida', monto: 10 },
  { op: 'OP-31', cobro: 'compartida', monto: 20 },
];
// ESC-40 hasta el paso 2 (hoy 10 feb): el desembolso de $5,000.00 y el retiro de inversión de $1,000.00.
const ESC40_PASO2: Op[] = [
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
  { op: 'OP-25', modalidad: 'retiro', inversion: 'Inversión', monto: 1000 },
];
// Un ingreso en cada uno de los períodos P1 a P5 (hoy 25 may 2027, P5 activo): P1 $100.00, P2 $200.00, P3 $300.00, P4 $400.00 y P5 $500.00.
const CINCO_PERIODOS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-21', monto: 100, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-21', monto: 200, fecha: '2027-02-22', hoy: '2027-02-22' },
  { op: 'OP-21', monto: 300, fecha: '2027-03-22', hoy: '2027-03-22' },
  { op: 'OP-21', monto: 400, fecha: '2027-04-22', hoy: '2027-04-22' },
  { op: 'OP-21', monto: 500, fecha: '2027-05-22', hoy: '2027-05-22' },
];

/** Siembra las operaciones con `hoy` y deja el reloj del servidor en `hoyServidor` (por defecto, el mismo día). */
async function sembrarOps(ops: Op[], hoy: string, hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP',
    titulo: 'Semilla de FT-60',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
const fila = (page: Page, periodo: string) =>
  page.locator('[data-reporte]').locator(`[data-fila="${periodo}"]`);
const cifra = (page: Page, periodo: string, columna: string) =>
  fila(page, periodo).locator(`[data-col="${columna}"] [data-centavos]`);

test.describe('PRU-E2E-REP reportes por período', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-130 [CA-60.1, ESC-20] con el paso 4 de ESC-20 los ingresos de ingresos-gastos son $1,005.00, con $5.00 de excedente, y las restituciones de $25.00 aparecen aparte, no como ingreso', async ({
    page,
  }) => {
    await sembrarOps(ESC20_PASO4, '2027-02-10');
    await abrir(page, '/reportes/ingresos-gastos');
    await esperarMonto(cifra(page, '2027-01-21', 'ingresos'), 100500);
    await esperarMonto(cifra(page, '2027-01-21', 'restituciones'), 2500);
    await esperarMonto(cifra(page, '2027-01-21', 'otrasEntradas'), 0);
  });

  test('PRU-E2E-REP-131 [CA-60.2, ESC-40] con el paso 2 de ESC-40 ingresos-gastos muestra otras entradas de $6,000.00 e ingresos de $0.00', async ({
    page,
  }) => {
    await sembrarOps(ESC40_PASO2, '2027-02-10');
    await abrir(page, '/reportes/ingresos-gastos');
    await esperarMonto(cifra(page, '2027-01-21', 'otrasEntradas'), 600000);
    await esperarMonto(cifra(page, '2027-01-21', 'ingresos'), 0);
  });

  test('PRU-E2E-REP-132 [CA-60.3, ESC-14] con el paso 1 de ESC-14 la tendencia cuenta el cashback de $30.00 como ingreso: ingresos de $1,030.00', async ({
    page,
  }) => {
    await sembrarOps(ESC14_PASO1, '2027-02-15');
    await abrir(page, '/reportes/tendencia');
    await esperarMonto(cifra(page, '2027-01-21', 'ingresos'), 103000);
    await esperarMonto(cifra(page, '2027-01-21', 'otrasEntradas'), 0);
  });

  test('PRU-E2E-REP-133 [CA-60.4] con ?ventana=ultimos-3 y el período activo a la mitad, la tendencia muestra los 3 períodos cerrados más recientes y no el activo RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await sembrarOps(CINCO_PERIODOS, '2027-05-25');
    await abrir(page, '/reportes/tendencia?ventana=ultimos-3');
    await expect(page.locator('[data-reporte] [data-fila]')).toHaveCount(3);
    await esperarMonto(cifra(page, '2027-02-21', 'ingresos'), 20000);
    await esperarMonto(cifra(page, '2027-03-21', 'ingresos'), 30000);
    await esperarMonto(cifra(page, '2027-04-21', 'ingresos'), 40000);
    await expect(fila(page, '2027-05-21')).toHaveCount(0);
    await expect(page.getByRole('link', { name: '3 períodos' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  test('PRU-E2E-REP-134 [CA-60.8, ESC-01] con el paso 4 de ESC-01 al cierre del período, patrimonio muestra la serie de ese período con neto de −$4,300.00, igual que la posición neta de Cuentas', async ({
    page,
  }) => {
    await sembrarOps(ESC01_PASO4, '2027-02-05', '2027-02-25');
    await abrir(page, '/reportes/patrimonio?ventana=ultimos-1');
    await expect(page.locator('[data-reporte] [data-fila]')).toHaveCount(1);
    await esperarMonto(cifra(page, '2027-01-21', 'neto'), -430000);
    await abrir(page, '/cuentas');
    await esperarMonto(page.locator('[data-posicion-neta] [data-centavos]').first(), -430000);
  });

  test('PRU-E2E-REP-135 /reportes lleva a Tendencia, un tipo desconocido es 404 y Remanente trae su título y su explicación y la ventana vacía dice que no hay movimientos RUTA-/reportes RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await sembrarOps([{ op: 'OP-01', cuenta: 'Ahorro' }], '2027-02-10');
    await abrir(page, '/reportes');
    await expect(page).toHaveURL(/\/reportes\/tendencia$/);
    await expect(page.getByText('No hay movimientos en estos períodos')).toBeVisible();
    await abrir(page, '/reportes/remanente');
    await expect(
      page.getByRole('heading', { name: 'Lo que te quedó del período', level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Ingresos del período menos lo que gastaste, incluidas las compras con tarjeta',
      ),
    ).toBeVisible();
    await abrir(page, '/reportes/flujo-de-caja');
    await expect(page.getByText('Esto ya no existe.')).toBeVisible();
  });

  test('PRU-E2E-REP-150 [FT-60] la plantilla en computadora pone los períodos a la izquierda y el reporte a la derecha, en teléfono todo en una columna, y los períodos miden al menos 44 px', async ({
    page,
  }) => {
    await sembrarOps(CINCO_PERIODOS, '2027-05-25');
    const reporte = page.locator('[data-reporte]');
    const enlaces = page.locator('nav[aria-label="Períodos"] a');
    await page.setViewportSize({ width: 1280, height: 900 });
    await abrir(page, '/reportes/tendencia?ventana=ultimos-3');
    const izquierda = await page.locator('[data-reporte-filtros]').boundingBox();
    const derecha = await reporte.locator('[data-vista-grafico]').first().boundingBox();
    expect(izquierda).not.toBeNull();
    expect(derecha).not.toBeNull();
    expect(derecha?.x ?? 0).toBeGreaterThan((izquierda?.x ?? 0) + (izquierda?.width ?? 0));
    expect(Math.abs((derecha?.y ?? 0) - (izquierda?.y ?? 0))).toBeLessThan(80);
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(page, '/reportes/tendencia?ventana=ultimos-3');
    const arriba = await page.locator('[data-reporte-filtros]').boundingBox();
    const abajo = await reporte.locator('[data-vista-grafico]').first().boundingBox();
    expect(abajo?.y ?? 0).toBeGreaterThan((arriba?.y ?? 0) + (arriba?.height ?? 0) - 1);
    for (const alto of await enlaces.evaluateAll((es) =>
      es.map((e) => e.getBoundingClientRect().height),
    ))
      expect(alto).toBeGreaterThanOrEqual(44);
  });

  test('PRU-E2E-REP-151 [FT-60] sin movimientos en el período actual, «Ver 3 períodos» abre la ventana de 3 períodos con su opción marcada y el gráfico RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await sembrarOps([{ op: 'OP-01', cuenta: 'Ahorro' }], '2027-02-10');
    await abrir(page, '/reportes/tendencia');
    await expect(page.getByText('No hay movimientos en estos períodos')).toBeVisible();
    await page.getByRole('link', { name: 'Ver 3 períodos' }).click();
    await expect(page).toHaveURL(/ventana=ultimos-3$/);
    await expect(page.getByRole('link', { name: '3 períodos' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(page.getByRole('link', { name: 'Ver 3 períodos' })).toHaveCount(0);
  });
});
