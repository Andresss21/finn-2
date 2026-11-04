// FT-45 Por cobrar y dinero en camino (06 FT-45; 05 §2; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17), con el reloj del servidor fijo (DP-04), y abre `/por-cobrar` como la persona.
// Los números los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-20 hasta el paso 2 (hoy 10 feb): compra de $50.00 con débito, $25.00 por cobrar a Ana.
const ESC20_PASO2: Op[] = [
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
];
// ESC-20 paso 3: Ana paga $10.00 y debe $15.00. Paso 4: paga $20.00 más y la partida se cierra.
const ESC20_PASO3: Op[] = [...ESC20_PASO2, { op: 'OP-31', cobro: 'compartida', monto: 10 }];
const ESC20_PASO4: Op[] = [...ESC20_PASO3, { op: 'OP-31', cobro: 'compartida', monto: 20 }];
// ESC-22 paso 1 (hoy 10 feb): compra de $80.00 con la tarjeta T, $40.00 por cobrar a Ana.
const ESC22_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 80,
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Super', monto: 40 },
      { deudor: 'Ana', monto: 40 },
    ],
  },
];
// CA-45.4: las dos compras juntas, la de débito (ESC-20 paso 2) y la de tarjeta (ESC-22 paso 1).
const DEBITO_Y_TARJETA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    etiqueta: 'debito',
    lineas: [
      { categoria: 'Super', monto: 25 },
      { deudor: 'Ana', monto: 25 },
    ],
  },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 80,
    etiqueta: 'tarjeta',
    lineas: [
      { categoria: 'Super', monto: 40 },
      { deudor: 'Ana', monto: 40 },
    ],
  },
];

async function sembrarOps(estadoInicial: Op[]): Promise<void> {
  const hoy = '2027-02-10';
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-COBRO-LISTA',
    titulo: 'Semilla de FT-45',
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

const deudor = (page: Page, nombre: string) =>
  page.locator('[data-deudor]').filter({ has: page.getByRole('heading', { name: nombre }) });
const enCamino = (page: Page) => page.locator('[data-en-camino] [data-centavos]');

test.describe('PRU-E2E-COBRO pantalla de por cobrar', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-COBRO-101 [CA-45.1, ESC-20] con el paso 2 de ESC-20 Ana debe $25.00 con débito y estado abierto, y "En camino" es $25.00 RUTA-/por-cobrar', async ({
    page,
  }) => {
    await sembrarOps(ESC20_PASO2);
    await abrir(page, '/por-cobrar');
    await expect(page.locator('[data-deudor]')).toHaveCount(1);
    await esperarMonto(deudor(page, 'Ana').locator('[data-deuda-abierta] [data-centavos]'), 2500);
    const partida = deudor(page, 'Ana').locator('[data-partida]');
    await expect(partida).toHaveCount(1);
    await expect(partida).toHaveAttribute('data-partida-estado', 'abierto');
    await expect(partida.locator('[data-medio]')).toHaveAttribute('data-medio', 'debito');
    await esperarMonto(partida.locator('[data-abierto] [data-centavos]'), 2500);
    await esperarMonto(enCamino(page), 2500);
  });

  test('PRU-E2E-COBRO-102 [CA-45.2, ESC-22] con el paso 1 de ESC-22 Ana debe $40.00 con tarjeta, pero "En camino" es $0.00', async ({
    page,
  }) => {
    await sembrarOps(ESC22_PASO1);
    await abrir(page, '/por-cobrar');
    await esperarMonto(deudor(page, 'Ana').locator('[data-deuda-abierta] [data-centavos]'), 4000);
    await expect(deudor(page, 'Ana').locator('[data-medio]')).toHaveAttribute(
      'data-medio',
      'tarjeta',
    );
    await esperarMonto(enCamino(page), 0);
  });

  test('PRU-E2E-COBRO-103 [CA-45.3, ESC-20] con el paso 3 de ESC-20 el saldo abierto de Ana es $15.00 y el estado parcial', async ({
    page,
  }) => {
    await sembrarOps(ESC20_PASO3);
    await abrir(page, '/por-cobrar');
    await esperarMonto(deudor(page, 'Ana').locator('[data-deuda-abierta] [data-centavos]'), 1500);
    const partida = deudor(page, 'Ana').locator('[data-partida]');
    await expect(partida).toHaveAttribute('data-partida-estado', 'parcial');
    await esperarMonto(partida.locator('[data-abierto] [data-centavos]'), 1500);
    await esperarMonto(enCamino(page), 1500);
  });

  test('PRU-E2E-COBRO-104 [CA-45.4, ESC-20, ESC-22] con $25.00 por cobrar con débito y $40.00 con tarjeta la posición neta de Cuentas incluye $65.00 en activos por cobrar', async ({
    page,
  }) => {
    await sembrarOps(DEBITO_Y_TARJETA);
    await abrir(page, '/cuentas');
    const porCobrar = page
      .locator('[data-fila-posicion="Activos"] span')
      .filter({ hasText: /^Por cobrar/ })
      .locator('[data-centavos]');
    await esperarMonto(porCobrar, 6500);
  });

  test('PRU-E2E-COBRO-105 [CA-45.5, ESC-20] un por cobrar cerrado no aparece en /por-cobrar y con ?cerrados=1 sí, como cerrado y sin cobrar ni condonar', async ({
    page,
  }) => {
    await sembrarOps(ESC20_PASO4);
    await abrir(page, '/por-cobrar');
    await expect(page.locator('[data-deudor]')).toHaveCount(0);
    await expect(page.getByText('Nadie te debe nada')).toBeVisible();

    await abrir(page, '/por-cobrar?cerrados=1');
    const partida = deudor(page, 'Ana').locator('[data-partida]');
    await expect(partida).toHaveCount(1);
    await expect(partida).toHaveAttribute('data-partida-estado', 'cerrado');
    await esperarMonto(partida.locator('[data-abierto] [data-centavos]'), 0);
    await expect(partida.getByRole('link')).toHaveCount(0);
  });
});
