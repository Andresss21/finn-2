// FT-51 Cuentas y posición neta (06 §2.9; 05 §2.7; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y abre `/cuentas` como la persona.
// Los números los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3). La comparación con el patrimonio de
// Inicio (CA-51.3) es de integración (PRU-INT-CTA-104), porque Inicio todavía es la página provisional.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/cuentas';

// Las operaciones de 01 §8 (el dominio solo se importa por sus tipos en `apps/web`): ESC-01 hasta el paso 4, y ESC-40 con su
// estado inicial (paso 0) y los pasos 1 y 2. Los montos están en dólares, como en el escenario.
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
const ESC40_PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Inversión', tipo: 'inversion', saldo: 3000 },
];
const ESC40_PASO2: Op[] = [
  ...ESC40_PASO0,
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

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CTA-LISTA',
    titulo: 'Semilla de FT-51',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta = RUTA): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

const fila = (page: Page, nombre: 'Activos' | 'Deudas') =>
  page.locator(`[data-fila-posicion="${nombre}"]`);
const neto = (page: Page) => page.locator('[data-posicion-neta] [data-centavos]').first();
const barra = (page: Page, nombre: 'Activos' | 'Deudas') =>
  fila(page, nombre).locator('[data-barra-bp]');

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-106 [CA-51.1, ESC-01] con el paso 4 de ESC-01 la posición neta es −$4,300.00: activos $1,000.00 y deudas $5,300.00', async ({
    page,
  }) => {
    await sembrarOps(ESC01_PASO4, '2027-02-05');
    await abrir(page);
    await expect(page.getByRole('heading', { name: 'Cuentas', level: 1 })).toBeVisible();
    await esperarMonto(neto(page), -430000);
    await esperarMonto(fila(page, 'Activos').locator('[data-centavos]').first(), 100000);
    await esperarMonto(fila(page, 'Deudas').locator('[data-centavos]').first(), 530000);
  });

  test('PRU-E2E-CTA-107 [CA-51.2, ESC-40] con el paso 2 de ESC-40 el patrimonio es $3,000.00, igual que en el paso 0', async ({
    page,
  }) => {
    await sembrarOps(ESC40_PASO0, '2027-02-10');
    await abrir(page);
    await esperarMonto(neto(page), 300000);

    await sembrarOps(ESC40_PASO2, '2027-02-10');
    await abrir(page);
    await esperarMonto(neto(page), 300000);
    await esperarMonto(fila(page, 'Activos').locator('[data-centavos]').first(), 800000);
    await esperarMonto(fila(page, 'Deudas').locator('[data-centavos]').first(), 500000);
  });

  test('PRU-E2E-CTA-108 [CA-51.6, ESC-01] con el paso 4 de ESC-01 las barras dibujan 1,887 y 10,000 puntos básicos, sin pasar de 100 %', async ({
    page,
  }) => {
    await sembrarOps(ESC01_PASO4, '2027-02-05');
    await abrir(page);
    await expect(barra(page, 'Activos')).toHaveAttribute('data-barra-bp', '1887');
    await expect(barra(page, 'Deudas')).toHaveAttribute('data-barra-bp', '10000');
    await expect(page.getByRole('heading', { name: 'Cuentas', level: 1 })).toBeVisible();
    // El ancho dibujado es el de los puntos básicos del DTO sobre el de su riel
    const proporcion = async (n: 'Activos' | 'Deudas') => {
      const b = await barra(page, n).boundingBox();
      const riel = await barra(page, n).locator('..').boundingBox();
      return (b?.width ?? 0) / (riel?.width ?? 1);
    };
    expect(await proporcion('Activos')).toBeCloseTo(0.1887, 2);
    expect(await proporcion('Deudas')).toBeCloseTo(1, 2);
  });

  test('PRU-E2E-CTA-109 [CA-51.7] con activos y deudas en $0.00 las dos barras son 0, y con activos iguales a deudas, 10,000', async ({
    page,
  }) => {
    await sembrarOps([{ op: 'OP-01', cuenta: 'Ahorro', saldo: 0 }], '2027-02-05');
    await abrir(page);
    await esperarMonto(neto(page), 0);
    await expect(barra(page, 'Activos')).toHaveAttribute('data-barra-bp', '0');
    await expect(barra(page, 'Deudas')).toHaveAttribute('data-barra-bp', '0');

    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro', saldo: 300 },
        { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 300 },
      ],
      '2027-02-05',
    );
    await abrir(page);
    await esperarMonto(neto(page), 0);
    await expect(barra(page, 'Activos')).toHaveAttribute('data-barra-bp', '10000');
    await expect(barra(page, 'Deudas')).toHaveAttribute('data-barra-bp', '10000');
  });

  test('PRU-E2E-CTA-110 [CA-51.8, AV-07] una tarjeta con te falta reservar $18.75 y límite $2,500.00 dibuja la parte sin reservar de la barra en 75 puntos básicos', async ({
    page,
  }) => {
    await sembrarOps(
      [{ op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta', saldo: 18.75, limite: 2500 }],
      '2027-02-05',
    );
    await abrir(page);
    const detalle = page.locator('[data-detalle-tarjeta]');
    await expect(detalle).toContainText('Te falta reservar');
    await esperarMonto(detalle.locator('[data-centavos]').first(), 1875);
    const sinReservar = page.locator('[data-segmento="sin-reservar"]');
    await expect(sinReservar).toBeVisible();
    const proporcion = await sinReservar.evaluate(
      (e) =>
        e.getBoundingClientRect().width / (e.parentElement?.getBoundingClientRect().width ?? 1),
    );
    expect(proporcion).toBeCloseTo(0.0075, 3);
  });

  test('PRU-E2E-CTA-111 sin ninguna cuenta dice "Agregá tu primera cuenta" y el enlace lleva a crearla', async ({
    page,
  }) => {
    await sembrarOps([], '2027-02-05');
    await abrir(page);
    await expect(page.getByRole('heading', { name: 'Agregá tu primera cuenta' })).toBeVisible();
    await page.getByRole('link', { name: 'Crear una cuenta' }).click();
    await expect(page).toHaveURL(/\/cuentas\/nueva$/);
  });

  test('PRU-E2E-CTA-112 las cuentas se agrupan por tipo y el interruptor de archivadas cambia la URL', async ({
    page,
  }) => {
    await sembrarOps(ESC01_PASO4, '2027-02-05');
    await abrir(page);
    for (const grupo of ['Tarjetas', 'Efectivo', 'Préstamos'])
      await expect(page.locator(`[data-grupo="${grupo}"]`)).toBeVisible();
    await expect(page.locator('[data-grupo="Inversiones"]')).toHaveCount(0);
    await page.getByRole('link', { name: 'Mostrar archivadas' }).click();
    await expect(page).toHaveURL(/\/cuentas\?archivadas=1$/);
    await expect(page.getByRole('link', { name: 'Ocultar archivadas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nueva cuenta' })).toBeVisible();
  });
});
