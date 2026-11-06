// FT-55 Condiciones y tabla de amortización (06 FT-55; 05 §2.7; 07 §17: un flujo es una E2E). Cada prueba parte de una base
// sembrada con operaciones reales (DP-17) —el préstamo de ESC-39 abierto el 15 de enero de 2027— y del reloj del servidor fijo
// (DP-04), carga las condiciones del ejemplo de 01 A.2 en `/cuentas/[cuentaId]/condiciones` como la persona y verifica el
// resultado en las pantallas de la ficha. Los números los pone el motor: la prueba solo comprueba que se dibujan (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentasCondiciones as t } from '../../../src/textos/cuentas-condiciones.ts';
import { cuentasCuota } from '../../../src/textos/cuentas-cuota.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

/** El préstamo del estado inicial de ESC-39: la primera cuenta que el ejecutor crea después del grupo Gastos. */
const PRESTAMO = '00000000-0000-4000-8000-000000000003';
const HOY = '2027-02-16';
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  {
    op: 'OP-01',
    cuenta: 'Préstamo',
    tipo: 'prestamo',
    saldo: 10000,
    apertura: '2027-01-15',
    prestamo: {
      contraparte: 'Banco',
      montoOriginal: 10000,
      cuota: 350,
      plazoCuotas: 36,
      cuotasPagadas: 0,
    },
  },
  { op: 'OP-07', categoria: 'Cuota préstamo' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Cuota préstamo', monto: 350, periodo: 'P1' },
];

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CONDICIONES',
    titulo: 'Semilla de FT-55',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const n = t.comunes;

/** Las condiciones del ejemplo de A.2: 12 %, seguro de $5.00 y el modelo de Banco Agrícola (el resto ya está en el préstamo). */
async function cargarCondiciones(page: Page): Promise<void> {
  await abrir(page, `/cuentas/${PRESTAMO}/condiciones`);
  await expect(campo(page, n.montoOriginal)).toHaveValue('10000.00');
  await campo(page, n.tasaAnual).fill('12');
  await campo(page, t.seguroPrimerMes).fill('5');
  await page
    .getByRole('radiogroup', { name: n.modelo })
    .getByRole('radio', { name: 'Banco Agrícola' })
    .click();
  await page.getByRole('button', { name: t.guardar, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/cuentas/${PRESTAMO}$`));
  await esperarContenido(page);
}

const filaDeTabla = (page: Page, numero: number) =>
  page.locator('[data-bloque="prestamo"] tbody tr').nth(numero - 1);
const capitalPendiente = (page: Page) =>
  page
    .locator('[data-bloque="prestamo"] dl > div', { hasText: 'Capital pendiente' })
    .locator('[data-centavos]');

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-300 [CA-55.1] con las condiciones del ejemplo de A.2 la tabla de amortización muestra la cuota 1 con interés $101.92, seguro $5.00, capital $243.08 y saldo $9,756.92, y la 2 con $89.82, $4.88, $255.30 y $9,501.62', async ({
    page,
  }) => {
    await preparar(BASE);
    await abrir(page, `/cuentas/${PRESTAMO}`);
    await expect(
      page.getByText('Este préstamo no tiene un modelo de cálculo', { exact: false }),
    ).toBeVisible();
    await cargarCondiciones(page);
    // capital, interés, seguro, saldo y pagado de cada fila, en el orden de la tabla
    const montos = async (numero: number) =>
      filaDeTabla(page, numero)
        .locator('[data-centavos]')
        .evaluateAll((es) => es.map((e) => Number(e.getAttribute('data-centavos'))));
    await expect.poll(() => montos(1)).toEqual([24308, 10192, 500, 975692, 0]);
    await expect.poll(() => montos(2)).toEqual([25530, 8982, 488, 950162, 0]);
  });

  test('PRU-E2E-CTA-301 [CA-55.3] cambiar las condiciones no cambia ningún número del presupuesto y el capital pendiente sigue en $10,000.00', async ({
    page,
  }) => {
    await preparar(BASE);
    await abrir(page, '/presupuesto');
    const antes = await page.locator('main').innerText();
    await abrir(page, `/cuentas/${PRESTAMO}`);
    await esperarMonto(capitalPendiente(page), 1000000);

    await cargarCondiciones(page);
    await esperarMonto(capitalPendiente(page), 1000000);
    await abrir(page, '/presupuesto');
    expect(await page.locator('main').innerText()).toBe(antes);
  });

  test('PRU-E2E-CTA-302 [CA-55.4] con pagos de $200.00 y $146.50 en la cuota 1, la tabla la muestra como pagada', async ({
    page,
  }) => {
    await preparar([
      ...BASE,
      {
        op: 'OP-24',
        prestamo: 'Préstamo',
        categoria: 'Cuota préstamo',
        capital: 100,
        interes: 90,
        seguro: 10,
      },
      {
        op: 'OP-24',
        prestamo: 'Préstamo',
        categoria: 'Cuota préstamo',
        capital: 46.5,
        interes: 100,
        seguro: 0,
      },
    ]);
    await cargarCondiciones(page);
    await expect(filaDeTabla(page, 1)).toContainText('Pagada');
    await esperarMonto(filaDeTabla(page, 1).locator('[data-centavos]').last(), 34650);
    await expect(filaDeTabla(page, 2)).not.toContainText('Pagada');
  });

  test('PRU-E2E-CTA-303 [CA-54.5] con el préstamo del Anexo A con modelo y la fecha del 15 de febrero de 2027, el flujo de pagar la cuota propone interés $101.92, seguro $5.00 y capital $243.08', async ({
    page,
  }) => {
    await preparar(BASE);
    await cargarCondiciones(page);
    await abrir(page, `/cuentas/${PRESTAMO}/cuota?modalidad=cuota&fecha=2027-02-15`);
    await expect(page.getByText(cuentasCuota.propuestaCuota('1'))).toBeVisible();
    await expect(campo(page, cuentasCuota.interes)).toHaveValue('101.92');
    await expect(campo(page, cuentasCuota.seguro)).toHaveValue('5.00');
    await expect(campo(page, cuentasCuota.capital)).toHaveValue('243.08');
  });

  test('PRU-E2E-CTA-304 [RUTA-/cuentas/[cuentaId]/condiciones] una cuenta que no es préstamo vuelve a su detalle', async ({
    page,
  }) => {
    await preparar(BASE);
    // Ahorro es la cuenta anterior al préstamo en la secuencia de ids
    await page.goto('/cuentas/00000000-0000-4000-8000-000000000002/condiciones');
    await expect(page).toHaveURL(/\/cuentas\/00000000-0000-4000-8000-000000000002$/);
  });
});
