// Metas y Programadas en la entrega 4 (TA-574; CH-240 E4-16 a E4-20). Cada prueba parte de una base sembrada con operaciones reales
// (DP-17) y con el reloj del servidor fijo (DP-04); las fechas y los montos los pone el motor (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-05';
const OPS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-07', categoria: 'Streaming' },
  { op: 'OP-18', categoria: 'Mascota', monto: 50 },
  { op: 'OP-21', monto: 1000 },
  {
    op: 'OP-42',
    etiqueta: 'netflix',
    cuenta: 'Visa Oro',
    comercio: 'Netflix',
    monto: 15.49,
    categoria: 'Streaming',
    primeraFecha: '2027-02-17',
  },
];

async function sembrarOps(ops: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  await sembrar(
    {
      id: 'SEM-MAS-E4',
      titulo: 'Semilla de TA-574',
      refs: [],
      hoy: HOY,
      estadoInicial: ops,
      pasos: [],
    },
    HOY,
  );
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** La primera ruta de detalle que enlaza una lista (`/metas/{id}`, `/programadas/{id}`), sin las de alta. */
async function primeraRuta(page: Page, raiz: string): Promise<string> {
  const href = await page
    .locator(`a[href^="${raiz}/"]:not([href$="/nueva"])`)
    .first()
    .getAttribute('href');
  if (href === null) throw new Error(`no hay enlaces de ${raiz}`);
  return href;
}

test.describe('PRU-E2E-META y PRU-E2E-PROG entrega 4', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-META-701 [CA-ET4-1] el tipo de la meta es un dato fijo con su motivo; eliminar la meta confirma dentro del flujo y vuelve a la lista', async ({
    page,
  }) => {
    await sembrarOps(OPS);
    await abrir(page, '/metas');
    await abrir(page, await primeraRuta(page, '/metas'));
    const tipo = page.locator('[data-dato-fijo="tipo"]');
    await expect(tipo).toContainText('Mensual');
    await expect(tipo).toContainText(
      'El tipo no se cambia. Para otro tipo, eliminá la meta y creá otra.',
    );
    await page.getByRole('button', { name: 'Eliminar meta', exact: true }).click();
    const pregunta = page.getByText(/^¿Eliminar la meta de/);
    await expect(pregunta).toBeVisible();
    await expect(pregunta).toBeFocused();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page).toHaveURL(/\/metas$/);
  });

  test('PRU-E2E-PROG-701 [CA-ET4-1] editar una programada muestra su tipo como dato fijo y la Fecha de fin nunca dice «undefined»', async ({
    page,
  }) => {
    await sembrarOps(OPS);
    await abrir(page, '/programadas');
    await abrir(page, await primeraRuta(page, '/programadas'));
    const tipo = page.locator('[data-dato-fijo="tipo"]');
    await expect(tipo).toContainText('Gasto');
    await expect(tipo).toContainText(
      'El tipo no se cambia. Para otro tipo, desactivala y creá otra.',
    );
    await expect(page.locator('body')).not.toContainText('undefined');
  });
});
