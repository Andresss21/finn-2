// FT-24 Actividad (06 FT-24; 05 §2.2, §2.6, §7.2; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17), con el reloj del servidor fijo (DP-04), y abre `/actividad` como la persona. Las operaciones de
// devolución llegan con FT-28: CA-24.3 queda en `pruebas/pendientes-e2e.json` hasta que esa ficha pruebe la acción del hallazgo de
// hormiga que lleva a esta URL. La búsqueda por texto y el cursor los prueba la consulta en INT; la espera de 300 ms, la CMP.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-03-05';

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-ACT-24',
    titulo: 'Semilla de FT-24',
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

const filas = (page: Page) => page.locator('[data-fila-transaccion]');
const idsDe = (page: Page) =>
  filas(page).evaluateAll((n) => n.map((x) => x.getAttribute('data-fila-transaccion')));

// El gasto de la acción del hallazgo de hormiga: Cafés, de hasta $10.00, en el período, sin devoluciones ni otros tipos.
const CAFES: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Cafés' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, fecha: '2027-02-22' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 4.5,
    categoria: 'Cafés',
    fecha: '2027-02-25',
    etiqueta: 'cafe1',
  },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 8, categoria: 'Cafés', fecha: '2027-03-02' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 10, categoria: 'Cafés', fecha: '2027-03-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 12, categoria: 'Cafés', fecha: '2027-03-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 5, categoria: 'Super', fecha: '2027-03-01' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 6, categoria: 'Cafés', fecha: '2027-02-10' },
  { op: 'OP-33', compra: 'cafe1', monto: 3, fecha: '2027-03-04' },
];

test.describe('PRU-E2E-TX actividad', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-400 [CA-24.3] la URL con categoría Cafés, tipo gasto, fechas del período y monto hasta $10.00 muestra solo los tres gastos de Cafés, sin la devolución, el ingreso ni los demás', async ({
    page,
  }) => {
    await preparar(CAFES);
    await abrir(page, '/actividad');
    const cafes = await page
      .getByLabel('Categoría')
      .locator('option', { hasText: 'Cafés' })
      .getAttribute('value');
    expect(cafes).not.toBeNull();
    await abrir(
      page,
      `/actividad?categoria=${cafes}&tipo=gasto&desde=2027-02-21&hasta=2027-03-20&monto-hasta=10.00`,
    );
    await expect(filas(page)).toHaveCount(3);
    const montos = page.locator('[data-fila-transaccion] [data-centavos]');
    await esperarMonto(montos.nth(0), -1000);
    await esperarMonto(montos.nth(1), -800);
    await esperarMonto(montos.nth(2), -450);
  });

  test('PRU-E2E-TX-401 [CA-24.4] con 120 ingresos, «Cargar más» dos veces recorre las 120 filas, 50 por vez, sin repetidas ni faltantes', async ({
    page,
  }) => {
    const ingresos: Op[] = Array.from({ length: 120 }, () => ({ op: 'OP-21', monto: 1 }));
    await preparar([{ op: 'OP-01', cuenta: 'Ahorro' }, ...ingresos]);
    await abrir(page, '/actividad?tipo=ingreso');
    const vistas: (string | null)[] = [];
    for (const esperadas of [50, 50, 20]) {
      await expect(filas(page)).toHaveCount(esperadas);
      vistas.push(...(await idsDe(page)));
      if (esperadas === 20) break;
      await page.getByRole('link', { name: 'Cargar más' }).click();
      await esperarContenido(page);
    }
    expect(vistas).toHaveLength(120);
    expect(new Set(vistas).size).toBe(120);
    await expect(page.getByRole('link', { name: 'Cargar más' })).toHaveCount(0);
  });

  test('PRU-E2E-TX-402 sin transacciones dice «Todavía no hay transacciones»; un filtro sin resultados dice «Sin resultados con estos filtros» y «Quitar filtros» vuelve a la lista', async ({
    page,
  }) => {
    await preparar([{ op: 'OP-01', cuenta: 'Ahorro' }]);
    await abrir(page, '/actividad');
    await expect(page.getByText('Todavía no hay transacciones')).toBeVisible();

    await preparar([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-21', monto: 100 },
    ]);
    await abrir(page, '/actividad?tipo=gasto');
    await expect(page.getByText('Sin resultados con estos filtros')).toBeVisible();
    await page.getByRole('link', { name: 'Quitar filtros' }).first().click();
    await esperarContenido(page);
    await expect(page).toHaveURL(/\/actividad$/);
    await expect(filas(page)).toHaveCount(1);
  });

  test('PRU-E2E-TX-403 escribir en «Buscar» pone el texto en la URL y, sin coincidencias, muestra el vacío con filtros', async ({
    page,
  }) => {
    await preparar([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-21', monto: 100 },
    ]);
    await abrir(page, '/actividad');
    await page.getByLabel('Buscar').pressSequentially('zzz');
    await expect(page).toHaveURL(/texto=zzz/);
    await expect(page.getByText('Sin resultados con estos filtros')).toBeVisible();
  });

  test('PRU-E2E-TX-460 [FT-24 Flujo 2] los días llevan su rótulo, el filtro de lista nativo aplica en la URL y la ficha del filtro lo quita', async ({
    page,
  }) => {
    await preparar(CAFES);
    await abrir(page, '/actividad?tipo=gasto');
    await expect(page.locator('[data-dia="2027-03-04"] h2')).toHaveText('Ayer · jueves 04/03');
    await expect(page.getByText('Filtros · 1')).toBeVisible();
    await page.getByLabel('Categoría').selectOption({ label: 'Cafés' });
    await page.getByRole('button', { name: 'Filtrar' }).click();
    await expect(page).toHaveURL(/categoria=/);
    await expect(page).toHaveURL(/tipo=gasto/);
    await page.getByRole('link', { name: 'Quitar filtro Gasto' }).click();
    await expect(page).not.toHaveURL(/tipo=/);
    await expect(page).toHaveURL(/categoria=/);
  });
});
