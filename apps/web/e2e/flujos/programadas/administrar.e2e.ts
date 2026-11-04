// FT-40 Administrar programadas, crear (06 FT-40; 05 §2 y §7; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones
// reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona. Los números los pone el
// motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Streaming' },
  { op: 'OP-21', monto: 1000 },
];
const NETFLIX: Op = {
  op: 'OP-42',
  etiqueta: 'netflix',
  cuenta: 'Visa Oro',
  comercio: 'Netflix',
  monto: 15.49,
  categoria: 'Streaming',
  primeraFecha: '2027-02-17',
};

/** Siembra las operaciones con `hoy` y deja el reloj del servidor en `hoyServidor` (por defecto, el mismo día). */
async function sembrarOps(ops: Op[], hoy: string, hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PROG',
    titulo: 'Semilla de FT-40',
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

const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const fila = (page: Page, comercio: string) =>
  page.locator('[data-programada]').filter({ has: page.getByText(comercio, { exact: true }) });

/** Llena el formulario de una programada de gasto mensual y la crea. */
async function crearNetflix(page: Page): Promise<void> {
  await abrir(page, '/programadas/nueva');
  await page.getByLabel('Cuenta', { exact: true }).selectOption({ label: 'Visa Oro' });
  await page.getByLabel('Comercio', { exact: true }).fill('Netflix');
  await page.getByLabel('Monto', { exact: true }).fill('15.49');
  await page.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Streaming' });
  await page.getByLabel('Primera fecha').fill('2027-02-17');
  await page.getByRole('button', { name: 'Crear programada' }).click();
  await expect(page).toHaveURL(/\/programadas$/);
  await esperarContenido(page);
}

test.describe('PRU-E2E-PROG administrar programadas', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PROG-101 RUTA-/programadas/nueva RUTA-/programadas [CA-40.1] crear la Netflix mensual de $15.49 el día 17 con Visa Oro a Streaming la deja en Programadas a 7 días y en los próximos pagos de Inicio, y una a 20 días solo en Programadas', async ({
    page,
  }) => {
    await sembrarOps(
      [...BASE, { ...NETFLIX, etiqueta: 'luz', comercio: 'Luz', primeraFecha: '2027-03-02' }],
      '2027-02-10',
    );
    await crearNetflix(page);
    await expect(fila(page, 'Netflix')).toHaveCount(1);
    await expect(page.locator('[data-seccion="proximos"] [data-proximo]')).toHaveCount(2);
    await abrir(page, '/');
    const proximos = page.locator('[data-seccion="proximos-pagos"]');
    await expect(proximos).toContainText('Netflix');
    await expect(proximos).not.toContainText('Luz');
  });

  test('PRU-E2E-PROG-104 RUTA-/programadas/nueva [CA-40.4] una cuota con registro automático hacia un préstamo sin modelo se rechaza con registro_automatico_sin_modelo', async ({
    page,
  }) => {
    await sembrarOps(
      [
        ...BASE,
        {
          op: 'OP-01',
          cuenta: 'Préstamo',
          tipo: 'prestamo',
          saldo: 5000,
          prestamo: {
            contraparte: 'Banco',
            montoOriginal: 6000,
            cuota: 210,
            plazoCuotas: 60,
            cuotasPagadas: 10,
          },
        },
        { op: 'OP-07', categoria: 'Cuotas' },
      ],
      '2027-02-10',
    );
    await abrir(page, '/programadas/nueva');
    await page.getByRole('radio', { name: 'Cuota' }).click();
    await page.getByLabel('Cuenta', { exact: true }).selectOption({ label: 'Ahorro' });
    await page.getByLabel('Cuenta de destino').selectOption({ label: 'Préstamo' });
    await page.getByLabel('Comercio', { exact: true }).fill('Cuota del préstamo');
    await page.getByLabel('Monto', { exact: true }).fill('210');
    await page.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Cuotas' });
    await page.getByLabel('Primera fecha').fill('2027-02-20');
    await page.getByRole('switch', { name: 'Registrar sola en su fecha' }).check();
    await page.getByRole('button', { name: 'Crear programada' }).click();
    await expect(
      page.getByText('Para registrar sola una cuota, el préstamo necesita un modelo de cálculo.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/programadas\/nueva/);
  });

  test('PRU-E2E-PROG-107RUTA-/programadas/nueva [CA-40.8] crear una programada no cambia Listo para asignar', async ({
    page,
  }) => {
    await sembrarOps(BASE, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);
    await crearNetflix(page);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);
  });
});
