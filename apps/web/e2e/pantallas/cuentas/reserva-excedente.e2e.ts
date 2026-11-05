// FT-31 Reserva excedente y saldo a favor (06 FT-31; 05 §2.1, §4.14; 07 §17: una pantalla es una E2E). Cada prueba parte de una base
// sembrada con las operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04). Los números los pone el
// motor: la pantalla solo los dibuja (PF-3). La propuesta de AV-08 vive en Inicio; la categoría de pago solo informa.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { inicio as t } from '../../../src/textos/inicio.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-13 hasta el paso 4 (hoy 21 feb): Pago T con $30.00 reservados de más; Listo para asignar $340.00.
const ESC13_PASO4: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: '2027-02-10' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super', hoy: '2027-02-10' },
  { op: 'OP-23', tarjeta: 'T', monto: 130, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 30, periodo: 'P2', hoy: '2027-02-21' },
  { op: 'OP-20', cuenta: 'T', monto: 30, categoria: 'Super', hoy: '2027-02-21' },
];
// ESC-28 rama B hasta el paso B4 (hoy 26 mar): el saldo a favor de la devolución se consumió con la compra de P3 y quedan $100.00
// reservados de más en Pago T; Listo para asignar $300.00.
const ESC28_B4: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Ropa' },
  { op: 'OP-21', monto: 500, hoy: '2027-02-16' },
  { op: 'OP-14', categoria: 'Ropa', monto: 100, periodo: 'P1', hoy: '2027-02-16' },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 100,
    categoria: 'Ropa',
    fecha: '2027-02-05',
    etiqueta: 'compra',
    hoy: '2027-02-16',
  },
  { op: 'OP-23', tarjeta: 'T', monto: 100, fecha: '2027-02-15', hoy: '2027-02-16' },
  { op: 'OP-33', compra: 'compra', monto: 100, hoy: '2027-03-01' },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 100,
    categoria: 'Ropa',
    fecha: '2027-03-25',
    hoy: '2027-03-26',
  },
];
// ESC-14 hasta el paso 4 (hoy 15 feb): un cashback de $400.00 deja a T con reserva excedente de $230.00.
const ESC14_PASO4: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-01', cuenta: 'U', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super' },
  { op: 'OP-27', modalidad: 'entrada', tarjeta: 'T', monto: 30 },
  { op: 'OP-27', modalidad: 'avance', tarjeta: 'T', monto: 200, cuenta: 'Ahorro' },
  { op: 'OP-27', modalidad: 'transferencia_deuda', tarjeta: 'T', monto: 100, destino: 'U' },
  { op: 'OP-27', modalidad: 'entrada', tarjeta: 'T', monto: 400 },
];

async function sembrarOps(ops: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-RESERVA-EXCEDENTE',
    titulo: 'Semilla de FT-31',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta = '/'): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const billete = (page: Page) =>
  page.locator('[data-resumen-lpa="billete"] [data-centavos]').first();
const propuesta = (page: Page) => page.locator('[data-reserva-excedente]');
const salida = (page: Page) => page.locator('[data-reserva-devuelta]');

test.describe('PRU-E2E-CTA reserva excedente', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-270 [CA-31.1, ESC-13, AV-08] RUTA-/ con el paso 4 de ESC-13 Inicio avisa de $30.00 reservados de más y, al tocar la propuesta, Listo para asignar pasa de $340.00 a $370.00 y el aviso desaparece', async ({
    page,
  }) => {
    await sembrarOps(ESC13_PASO4, '2027-02-21');
    await abrir(page);
    await esperarMonto(billete(page), 34000);
    await expect(propuesta(page)).toContainText('$30.00');
    await propuesta(page)
      .getByRole('button', { name: t.devolverReserva('$30.00') })
      .click();
    await esperarMonto(billete(page), 37000);
    await expect(propuesta(page)).toHaveCount(0);
  });

  test('PRU-E2E-CTA-271 [CA-31.2, ESC-13, AV-08] con la propuesta del paso 4 de ESC-13 ejecutada, «Deshacer» vuelve Listo para asignar a $340.00 y AV-08 reaparece', async ({
    page,
  }) => {
    await sembrarOps(ESC13_PASO4, '2027-02-21');
    await abrir(page);
    await esperarMonto(billete(page), 34000);
    await propuesta(page)
      .getByRole('button', { name: t.devolverReserva('$30.00') })
      .click();
    await esperarMonto(billete(page), 37000);
    await expect(salida(page)).toContainText(t.reservaDevuelta('T', '$30.00'));
    await salida(page).getByRole('button', { name: t.deshacer, exact: true }).click();
    await esperarMonto(billete(page), 34000);
    await expect(salida(page)).toHaveCount(0);
    await expect(propuesta(page)).toContainText('$30.00');
  });

  test('PRU-E2E-CTA-272 [CA-31.3, ESC-28, AV-08] con el paso B4 de ESC-28 la propuesta devuelve los $100.00 reservados de más y Listo para asignar vuelve a $400.00', async ({
    page,
  }) => {
    await sembrarOps(ESC28_B4, '2027-03-26');
    await abrir(page);
    await esperarMonto(billete(page), 30000);
    await expect(propuesta(page)).toContainText('$100.00');
    await propuesta(page)
      .getByRole('button', { name: t.devolverReserva('$100.00') })
      .click();
    await esperarMonto(billete(page), 40000);
    await expect(propuesta(page)).toHaveCount(0);
  });

  test('PRU-E2E-CTA-273 [CA-31.4, ESC-14, AV-08] con el paso 4 de ESC-14 la categoría Pago T avisa de $230.00 reservados de más', async ({
    page,
  }) => {
    await sembrarOps(ESC14_PASO4, '2027-02-15');
    await abrir(page, '/presupuesto');
    const href = await page
      .locator('[data-fila-pago]')
      .filter({ hasText: /\bT\b/ })
      .getAttribute('href');
    if (href === null) throw new Error('no hay una fila de pago de «T» en Presupuesto');
    await abrir(page, href);
    const aviso = page.locator('[data-aviso="AV-08"]');
    await expect(aviso).toContainText('reservado');
    await esperarMonto(aviso.locator('[data-centavos]'), 23000);
  });
});
