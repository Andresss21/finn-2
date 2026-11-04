// FT-72 Cambiar el ciclo (06 FT-72; 05 §2.11; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de ESC-45 (DP-17), con el reloj del servidor fijo (DP-04), entra a `/ajustes/ciclo` como la persona y recorre
// el flujo. Las fechas y los montos los pone el motor: la prueba solo comprueba que el flujo los dibuja (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesCiclo as t } from '../../../src/textos/ajustes-ciclo.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/ajustes/ciclo';
// ESC-45, estado inicial (hoy 10 nov 2027, período 21 oct – 20 nov): $1,000.00 de ingreso, $100.00 de Super en el período del 21 nov.
const ESC45: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', apertura: '2027-10-21' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Semanal' },
  { op: 'OP-07', categoria: 'Mensual' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 100, desde: '2027-11-21' },
];
const METAS_ESC45: Op[] = [
  { op: 'OP-18', categoria: 'Semanal', monto: 50, tipo: 'semanal' },
  { op: 'OP-18', categoria: 'Mensual', monto: 200 },
];

async function sembrarOps(ops: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CICLO',
    titulo: 'Semilla de FT-72',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta = RUTA): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
  await esperarHidratacion(page);
}

const dia = (page: Page) => page.getByLabel(t.nuevoDia, { exact: true });
const verCambio = (page: Page) => page.getByRole('button', { name: t.verCambio, exact: true });
const confirmar = (page: Page) => page.getByRole('button', { name: t.confirmar, exact: true });
const futura = (page: Page) => page.locator('[data-ciclo-futura]');
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const disponibleSuper = (page: Page) =>
  page
    .locator('[data-fila-categoria]')
    .filter({ hasText: 'Super' })
    .locator('[data-centavos]')
    .first();

/** Elige el día y pide la previsualización de AV-12. */
async function pedirCambio(page: Page, valor: string): Promise<void> {
  await dia(page).selectOption(valor);
  await verCambio(page).click();
}

test.describe('PRU-E2E-AJUS', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-AJUS-110 [CA-72.1, RUTA-/ajustes/ciclo] con el estado de ESC-45, cambiar el día a 1 dice que rige desde el 21/12/2027 con un período de transición del 21/12 al 31/12 (11 días) y, al confirmar, Listo para asignar y los Disponibles no cambian', async ({
    page,
  }) => {
    await sembrarOps(ESC45, '2027-11-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 90000);
    const antes = await disponibleSuper(page).getAttribute('data-centavos');

    await abrir(page);
    await expect(page.locator('[data-ciclo-vigente]')).toHaveText('21');
    await pedirCambio(page, '1');
    const aviso = page.getByRole('region', { name: t.revisar });
    await expect(aviso).toContainText('Rige desde el 21/12/2027.');
    await expect(aviso).toContainText('El período del 21/12 al 31/12 (11 días) será de transición');
    await confirmar(page).click();
    await expect(page.getByTestId('resultado')).toContainText(t.listo(1, '21/12/2027'));

    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 90000);
    await expect(disponibleSuper(page)).toHaveAttribute('data-centavos', antes ?? '');
  });

  test('PRU-E2E-AJUS-111 [CA-72.2] con el período del 21/12 al 20/01 también asignado, cambiar el día a 1 dice que rige desde el 21/01/2028', async ({
    page,
  }) => {
    await sembrarOps(
      [...ESC45, { op: 'OP-14', categoria: 'Super', monto: 100, desde: '2027-12-21' }],
      '2027-11-10',
    );
    await abrir(page);
    await pedirCambio(page, '1');
    const aviso = page.getByRole('region', { name: t.revisar });
    await expect(aviso).toContainText('Rige desde el 21/01/2028.');
    await expect(aviso).toContainText('El período del 21/01 al 31/01 (11 días) será de transición');
  });

  test('PRU-E2E-AJUS-112 [CA-72.3] con el período de transición de 11 días, la meta semanal de $50.00 pide $78.57 y la mensual de $200.00 pide $200.00', async ({
    page,
  }) => {
    await sembrarOps([...ESC45, ...METAS_ESC45], '2027-11-10');
    await abrir(page);
    await pedirCambio(page, '1');
    await confirmar(page).click();
    await expect(page.getByTestId('resultado')).toBeVisible();

    fijarRelojServidor('2027-12-25T10:00:00-06:00');
    await abrir(page, '/metas');
    const pedido = (categoria: string) =>
      page
        .locator('[data-meta]')
        .filter({ has: page.getByRole('heading', { name: categoria }) })
        .locator('[data-pedido] [data-centavos]');
    await esperarMonto(pedido('Semanal'), 7857);
    await esperarMonto(pedido('Mensual'), 20000);
  });

  test('PRU-E2E-AJUS-113 [CA-72.4] con el día vigente 21, elegir 21 se rechaza con "El ciclo ya empieza el día 21." y no pide confirmar', async ({
    page,
  }) => {
    await sembrarOps(ESC45, '2027-11-10');
    await abrir(page);
    await pedirCambio(page, '21');
    await expect(page.getByText('El ciclo ya empieza el día 21.')).toBeVisible();
    await expect(page.getByRole('region', { name: t.revisar })).toHaveCount(0);
    await expect(futura(page)).toHaveText(t.sinFutura);
  });

  test('PRU-E2E-AJUS-114 [CA-72.5] con el impacto en dinero nulo, cambiar el ciclo igual pide confirmar y no guarda nada hasta confirmar', async ({
    page,
  }) => {
    await sembrarOps([{ op: 'OP-01', cuenta: 'Ahorro' }], '2027-02-05');
    await abrir(page);
    await pedirCambio(page, '5');
    await expect(page.getByRole('region', { name: t.revisar })).toContainText(t.dineroNoCambia);

    await abrir(page);
    await expect(futura(page)).toHaveText(t.sinFutura);

    await pedirCambio(page, '5');
    await confirmar(page).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await abrir(page);
    await expect(futura(page)).toContainText('Día 5, desde el');
  });

  test('PRU-E2E-AJUS-115 [CA-72.6] con el día 31, el período de febrero empieza el último día del mes (28/02/2027)', async ({
    page,
  }) => {
    await sembrarOps([{ op: 'OP-01', cuenta: 'Ahorro', apertura: '2026-12-21' }], '2027-01-10');
    await abrir(page);
    await pedirCambio(page, '31');
    await confirmar(page).click();
    await expect(page.getByTestId('resultado')).toBeVisible();

    // Con el reloj en el último día de febrero el período activo empieza ese día; el día anterior sigue el de enero
    const selector = page.locator('[data-selector-periodo]');
    fijarRelojServidor('2027-02-27T10:00:00-06:00');
    await abrir(page, '/presupuesto');
    await expect(selector).toContainText('31 ene – 27 feb 2027');
    fijarRelojServidor('2027-02-28T10:00:00-06:00');
    await abrir(page, '/presupuesto');
    await expect(selector).toContainText('28 feb – 30 mar 2027');
  });
});
