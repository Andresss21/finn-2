// FT-35 Revisar y aprobar, edición completa (06 §2.5; 05 §2.5; 07 §17: una pantalla o un flujo es una E2E). Cada prueba parte de
// una base sembrada con operaciones reales de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04). Los números los pone el motor:
// la prueba abre el presupuesto y comprueba que los dibuja (PF-3). Los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
// Dos categorías con $50.00 cada una en P1, la tarjeta T y un SMS de $30.00 de «Super» a las 7 pm
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Casa' },
  { op: 'OP-21', monto: 500 },
  // Una compra anterior por cobrar a Ana: ya existe como persona
  { op: 'OP-20', cuenta: 'T', monto: 5, lineas: [{ deudor: 'Ana', monto: 5 }] },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Casa', monto: 50, periodo: 'P1' },
  {
    op: 'OP-35',
    etiqueta: 'sms',
    cuenta: 'T',
    monto: 30,
    comercio: 'Super',
    recibido: `${DIA_20}T19:00`,
    fecha: DIA_20,
  },
];

async function abrirElMovimiento(page: Page): Promise<void> {
  fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-35C',
    titulo: 'Semilla de FT-35, edición completa',
    refs: [],
    hoy: DIA_20,
    estadoInicial: ESTADO,
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
  await page.goto('/bandeja');
  await esperarContenido(page);
  await page.locator('[data-movimiento]').getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
}

const categoriaDeParte = (page: Page, n: string, nombre: string) =>
  page
    .getByRole('radiogroup', { name: g.categoriaDeParte(n) })
    .getByRole('radio', { name: nombre });

async function disponible(page: Page, categoria: string, centavos: number): Promise<void> {
  await page.goto('/presupuesto');
  await esperarContenido(page);
  await esperarMonto(
    page
      .locator('[data-fila-categoria]')
      .filter({ hasText: categoria })
      .locator('[data-centavos]')
      .first(),
    centavos,
  );
}

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-132 el flujo trae el movimiento completo y al aprobar guarda lo que se cambió: el comercio y el monto salen en el resultado y en el presupuesto', async ({
    page,
  }) => {
    await abrirElMovimiento(page);
    await expect(page.getByRole('textbox', { name: t.revisar.monto, exact: true })).toHaveValue(
      '30.00',
    );
    await expect(page.getByRole('textbox', { name: g.comercio })).toHaveValue('Super');

    await page.getByRole('textbox', { name: g.comercio }).fill('Tienda');
    await page.getByRole('textbox', { name: t.revisar.monto, exact: true }).fill('20');
    await page.getByRole('textbox', { name: g.montoDeParte('1') }).fill('20');
    await categoriaDeParte(page, '1', 'Super').click();
    await page.getByRole('button', { name: t.revisar.aprobar }).click();

    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('Tienda', '$20.00', 'T', 'Super'),
    );
    await disponible(page, 'Super', 3000);
  });

  test('PRU-E2E-BAND-133 dividir en dos partes reparte el gasto entre dos categorías y el resultado dice «Dividido en 2 partes»', async ({
    page,
  }) => {
    await abrirElMovimiento(page);

    await page.getByRole('textbox', { name: g.montoDeParte('1') }).fill('20');
    await categoriaDeParte(page, '1', 'Super').click();
    await page.getByRole('button', { name: g.agregarParte }).click();
    await page.getByRole('textbox', { name: g.montoDeParte('2') }).fill('10');
    await categoriaDeParte(page, '2', 'Casa').click();
    await expect(page.getByText(g.todoRepartido)).toBeVisible();
    await page.getByRole('button', { name: t.revisar.aprobar }).click();

    await expect(page.getByTestId('resultado')).toContainText(t.dividido(2));
    await disponible(page, 'Super', 3000);
    await disponible(page, 'Casa', 4000);
  });

  test('PRU-E2E-BAND-134 una parte que no suma el total se rechaza con suma_lineas_distinta, no se crea la transacción y la Bandeja sigue con el movimiento', async ({
    page,
  }) => {
    await abrirElMovimiento(page);

    await page.getByRole('textbox', { name: g.montoDeParte('1') }).fill('20');
    await categoriaDeParte(page, '1', 'Super').click();
    await expect(page.getByText(g.faltaRepartir('$10.00'))).toBeVisible();
    await page.getByRole('button', { name: t.revisar.aprobar }).click();

    await expect(page.getByTestId('resultado')).toHaveCount(0);
    await page.goto('/bandeja');
    await esperarContenido(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(1);
  });

  test('PRU-E2E-BAND-135 una parte por cobrar a una persona que ya existe deja la deuda a su nombre', async ({
    page,
  }) => {
    await abrirElMovimiento(page);

    await page
      .getByRole('radiogroup', { name: g.destinoDeParte('1') })
      .getByRole('radio', { name: g.destinoPorCobrar })
      .click();
    await page
      .getByRole('radiogroup', { name: g.deudorDeParte('1') })
      .getByRole('radio', { name: 'Ana' })
      .click();
    await page.getByRole('button', { name: t.revisar.aprobar }).click();

    await expect(page.getByTestId('resultado')).toContainText(t.porCobrarA('Ana'));
  });
});
