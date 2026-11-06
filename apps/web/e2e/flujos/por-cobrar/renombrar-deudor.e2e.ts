// FT-48 Renombrar deudor, `/por-cobrar/deudores/[deudorId]/renombrar` (06 FT-48; 05 §2, §4.7; 07 §17: un flujo es una E2E). Cada prueba
// parte de una base sembrada con las operaciones reales (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la
// persona. Los números los pone el motor: la prueba solo comprueba que el nombre cambia y que ninguno se mueve (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
];
const compra = (monto: number, deudor: string): Op => ({
  op: 'OP-20',
  cuenta: 'Ahorro',
  monto,
  etiqueta: `${deudor}-${monto}`,
  lineas: [
    { categoria: 'Super', monto: monto / 2 },
    { deudor, monto: monto / 2 },
  ],
});
// "Carlso" con dos partidas de $25.00 y $15.00 (debe $40.00).
const CARLSO: Op[] = [...BASE, compra(50, 'Carlso'), compra(30, 'Carlso')];
// "Carlos" y "Carlso", cada uno con una partida.
const DOS_DEUDORES: Op[] = [...BASE, compra(50, 'Carlos'), compra(30, 'Carlso')];

async function sembrarOps(estadoInicial: Op[]): Promise<void> {
  const hoy = '2027-02-10';
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-RENOMBRAR-DEUDOR',
    titulo: 'Semilla de FT-48',
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
const renombrar = (page: Page, nombre: string) =>
  page.getByRole('link', { name: `Renombrar a ${nombre}` }).click();

test.describe('PRU-E2E-COBRO flujo de renombrar un deudor', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-COBRO-141 [CA-48.1] "Carlso" con dos partidas pasa a "Carlos" y ninguna cifra cambia RUTA-/por-cobrar/deudores/[deudorId]/renombrar', async ({
    page,
  }) => {
    await sembrarOps(CARLSO);
    await abrir(page, '/por-cobrar');
    await esperarMonto(
      deudor(page, 'Carlso').locator('[data-deuda-abierta] [data-centavos]'),
      4000,
    );
    await esperarMonto(page.locator('[data-total-abierto] [data-centavos]'), 4000);
    await renombrar(page, 'Carlso');
    await expect(page.getByRole('heading', { name: 'Renombrar deudor', level: 1 })).toBeVisible();
    await page.getByLabel('Nombre').fill('Carlos');
    await page.getByRole('button', { name: 'Guardar nombre' }).click();

    await expect(page).toHaveURL(/\/por-cobrar$/);
    await esperarContenido(page);
    await expect(page.locator('[data-deudor]')).toHaveCount(1);
    await expect(deudor(page, 'Carlso')).toHaveCount(0);
    await expect(deudor(page, 'Carlos').locator('[data-partida]')).toHaveCount(2);
    await esperarMonto(
      deudor(page, 'Carlos').locator('[data-deuda-abierta] [data-centavos]'),
      4000,
    );
    await esperarMonto(page.locator('[data-total-abierto] [data-centavos]'), 4000);
  });

  test('PRU-E2E-COBRO-142 [CA-48.2] renombrar "Carlso" a "carlos" se rechaza con «Ya existe un deudor llamado carlos.» y no cambia nada', async ({
    page,
  }) => {
    await sembrarOps(DOS_DEUDORES);
    await abrir(page, '/por-cobrar');
    await renombrar(page, 'Carlso');
    await page.getByLabel('Nombre').fill('carlos');
    await page.getByRole('button', { name: 'Guardar nombre' }).click();
    await expect(page.getByText('Ya existe un deudor llamado carlos.')).toBeVisible();
    await expect(page).toHaveURL(/\/renombrar$/);

    await abrir(page, '/por-cobrar');
    await expect(page.locator('[data-deudor]')).toHaveCount(2);
    await expect(deudor(page, 'Carlso')).toHaveCount(1);
  });

  test('PRU-E2E-COBRO-143 [CA-48.3] si otra pestaña ya lo renombró, enviar responde conflicto y «Usar el valor actual» deja guardar lo escrito', async ({
    page,
    context,
  }) => {
    await sembrarOps(CARLSO);
    await abrir(page, '/por-cobrar');
    await renombrar(page, 'Carlso');
    await esperarContenido(page);

    const otra = await context.newPage();
    await abrir(otra, '/por-cobrar');
    await renombrar(otra, 'Carlso');
    await otra.getByLabel('Nombre').fill('Karlos');
    await otra.getByRole('button', { name: 'Guardar nombre' }).click();
    await expect(otra).toHaveURL(/\/por-cobrar$/);

    await page.getByLabel('Nombre').fill('Carlos');
    await page.getByRole('button', { name: 'Guardar nombre' }).click();
    await expect(page.getByRole('button', { name: 'Usar el valor actual' })).toBeVisible();
    await page.getByRole('button', { name: 'Usar el valor actual' }).click();
    await expect(page.getByLabel('Nombre')).toHaveValue('Carlos');
    await page.getByRole('button', { name: 'Guardar nombre' }).click();

    await expect(page).toHaveURL(/\/por-cobrar$/);
    await esperarContenido(page);
    await expect(deudor(page, 'Carlos').locator('[data-partida]')).toHaveCount(2);
    await expect(deudor(page, 'Karlos')).toHaveCount(0);
  });
});
