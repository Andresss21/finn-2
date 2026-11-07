// FT-64 Gastos hormiga (06 FT-64; 05 §2.10; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17) con el reloj del servidor fijo (DP-04) y abre `/reportes/hormiga` como la persona. Los números y la
// deduplicación los pone el motor: la prueba comprueba que la pantalla los dibuja y que «Ver las compras» abre Actividad con
// exactamente esas compras (CA-24.3). La siembra no registra comercio en un gasto (OP-20): las compras quedan sin comercio.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

// Período del 21/02 al 20/03 de 2027 (día 21), hoy 05/03.
const HOY = '2027-03-05';
const CAFES = 'Cafés y antojos';

const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: CAFES },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, fecha: '2027-02-22' },
];

/** `n` compras de $5.34 en Cafés (12 suman $64.08), una de $12.00 en Cafés y una de $25.00 en Super: ninguna de esas dos es pequeña. */
const compras = (n: number): Op[] => [
  ...Array.from({ length: n }, (_, i): Op => ({
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 5.34,
    categoria: CAFES,
    fecha: `2027-02-${String(22 + (i % 7)).padStart(2, '0')}`,
  })),
  { op: 'OP-20', cuenta: 'Ahorro', monto: 12, categoria: CAFES, fecha: '2027-03-01' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 25, categoria: 'Super', fecha: '2027-03-01' },
];

/** Un pago programado de $9.99 con su ocurrencia emparejada y una devolución de $3.00 en Cafés (CA-64.5). */
const EXTRAS: Op[] = [
  {
    op: 'OP-42',
    etiqueta: 'plan',
    cuenta: 'Ahorro',
    comercio: 'Plan Café',
    monto: 9.99,
    categoria: CAFES,
    primeraFecha: '2027-03-02',
  },
  { op: 'OP-43', modo: 'toque', programada: 'plan', fecha: '2027-03-02' },
  { op: 'OP-33', monto: 3, categoria: CAFES, cuenta: 'Ahorro', fecha: '2027-03-04' },
];

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-HORMIGA',
    titulo: 'Semilla de FT-64',
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

const hallazgos = (page: Page) => page.locator('[data-hallazgo-hormiga]');
const filas = (page: Page) => page.locator('[data-fila-transaccion]');

test.describe('PRU-E2E-REP gastos hormiga', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-190 [CA-64.1] 12 compras de menos de $10.00 en Cafés y antojos por $64.08 dan un solo hallazgo «12 compras pequeñas en Cafés y antojos este período: $64.08.»', async ({
    page,
  }) => {
    await preparar([...BASE, ...compras(12)]);
    await abrir(page, '/reportes/hormiga');
    await expect(hallazgos(page)).toHaveCount(1);
    await expect(hallazgos(page)).toContainText(t.hormiga.porCategoria(12, CAFES, '$64.08'));
  });

  test('PRU-E2E-REP-191 [CA-64.2] «Ver las compras» abre Actividad con exactamente esas 12 compras', async ({
    page,
  }) => {
    await preparar([...BASE, ...compras(12)]);
    await abrir(page, '/reportes/hormiga');
    await hallazgos(page).getByRole('link', { name: t.hormiga.verCompras, exact: true }).click();
    await esperarContenido(page);
    await expect(page).toHaveURL(/\/actividad\?/);
    await expect(page).toHaveURL(/tipo=gasto/);
    await expect(page).toHaveURL(/desde=2027-02-21/);
    await expect(page).toHaveURL(/hasta=2027-03-20/);
    await expect(page).toHaveURL(/monto-hasta=10\.00/);
    await expect(filas(page)).toHaveCount(12);
    await expect(filas(page).filter({ hasText: 'Programada' })).toHaveCount(0);
  });

  test('PRU-E2E-REP-192 [CA-64.3] con 4 compras pequeñas en la categoría no hay hallazgo y las 4 quedan en la tabla de grupos', async ({
    page,
  }) => {
    await preparar([...BASE, ...compras(4)]);
    await abrir(page, '/reportes/hormiga');
    await expect(hallazgos(page)).toHaveCount(0);
    await expect(page.locator('[data-sin-grupos]')).toHaveCount(0);
    await expect(page.locator('[data-fila^="categoria:"] [data-col="compras"]')).toHaveText('4');
  });

  test('PRU-E2E-REP-193 [CA-64.4] el grupo de categoría y el de comercio comparten las mismas 12 compras: queda un solo hallazgo, el de categoría (a igual total)', async ({
    page,
  }) => {
    await preparar([...BASE, ...compras(12)]);
    await abrir(page, '/reportes/hormiga');
    await expect(hallazgos(page)).toHaveCount(1);
    await expect(hallazgos(page)).toHaveAttribute('data-hallazgo-hormiga', /^categoria:/);
    await expect(page.locator('[data-fila^="comercio:"]')).toHaveCount(1);
    await expect(page.locator('[data-fila^="categoria:"]')).toHaveCount(1);
  });

  test('PRU-E2E-REP-194 [CA-64.5] con un pago programado de $9.99 y una devolución de $3.00, «Ver las compras» muestra las 12 compras y el pago programado (con su marca), sin la devolución; el hallazgo sigue en 12 compras y $64.08', async ({
    page,
  }) => {
    await preparar([...BASE, ...compras(12), ...EXTRAS]);
    await abrir(page, '/reportes/hormiga');
    await expect(hallazgos(page)).toHaveCount(1);
    await expect(hallazgos(page)).toContainText(t.hormiga.porCategoria(12, CAFES, '$64.08'));
    await hallazgos(page).getByRole('link', { name: t.hormiga.verCompras, exact: true }).click();
    await esperarContenido(page);
    await expect(filas(page)).toHaveCount(13);
    await expect(filas(page).filter({ hasText: 'Programada' })).toHaveCount(1);
  });

  test('PRU-E2E-REP-195 [FT-64] sin compras pequeñas repetidas dice «No encontramos compras pequeñas repetidas en este período.»', async ({
    page,
  }) => {
    await preparar(BASE);
    await abrir(page, '/reportes/hormiga');
    await expect(page.locator('[data-sin-grupos]')).toHaveText(t.hormiga.sinGrupos);
  });
});
