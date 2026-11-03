// FT-08 Inicio, primera parte (06 FT-08; 05 §2.3; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17), con el reloj del servidor fijo (DP-04), y abre `/` como la persona. Los
// números los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3). Los Primeros pasos son de `primer-uso`.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as t } from '../../../src/textos/inicio.ts';
import { listoParaAsignar } from '../../../src/textos/listo-para-asignar.ts';
import type { Page } from '@playwright/test';

// Las operaciones de 01 §8 hasta el paso que dice cada una (DP-17), como las que escribe `listo-para-asignar.e2e.ts`.
// ESC-01 hasta el paso 4.
const ESC01: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 300 },
  { op: 'OP-14', categoria: 'Pago T', monto: 300, periodo: 'P1' },
  {
    op: 'OP-01',
    cuenta: 'Préstamo',
    tipo: 'prestamo',
    saldo: 5000,
    prestamo: {
      contraparte: 'Banco',
      montoOriginal: 6000,
      cuota: 100,
      plazoCuotas: 60,
      cuotasPagadas: 10,
    },
  },
];
// ESC-05 hasta el paso 2: Super sobregirada con tarjeta.
const ESC05: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super', fecha: '2027-02-10' },
];
// ESC-15 hasta el paso 2: Salidas sobregirada con débito.
const ESC15: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas' },
];
// ESC-20 hasta el paso 2: Listo para asignar $675.00 y $25.00 en camino.
const ESC20: Op[] = [
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
// ESC-31 hasta el paso 1: el paso 0 es el historial (cada operación con su día) y el 1, la transacción olvidada.
const ESC31: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Super', monto: 200, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Salidas', hoy: '2027-02-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 200, categoria: 'Super', hoy: '2027-02-04' },
  { op: 'OP-14', categoria: 'Salidas', monto: 50, periodo: 'P2', hoy: '2027-02-21' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 50, categoria: 'Salidas', hoy: '2027-03-01' },
  { op: 'OP-14', categoria: 'Salidas', monto: 60, periodo: 'P3', hoy: '2027-03-21' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    categoria: 'Salidas',
    fecha: '2027-02-10',
    etiqueta: 'olvidado',
  },
];

/**
 * Lo que `posteriores()` registrará al producir AV-01 (BE-38): todavía ninguna operación lo hace (lo completa FT-27, pendiente de
 * punta a punta en `pendientes-e2e.json`), así que la semilla agrega la notificación con la cifra del paso 1 de ESC-31.
 */
const CAMBIO_RETROACTIVO = {
  aviso: 'AV-01',
  motivo: 'cambio_retroactivo',
  titulo: 'Cambiaste el pasado',
  cuerpo: 'Δ LPA −$30.00, Δ Salidas −$20.00',
} as const;

async function sembrarOps(
  ops: Op[],
  hoy: string,
  notificaciones: Parameters<typeof sembrar>[2] = [],
): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  await sembrar(
    { id: 'SEM-INICIO', titulo: 'Semilla de FT-08', refs: [], hoy, estadoInicial: ops, pasos: [] },
    hoy,
    notificaciones,
  );
}

async function abrir(page: Page, ruta = '/'): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const billete = (page: Page) => page.locator('[data-resumen-lpa="billete"]');
const sobregiro = (page: Page, categoria: string) =>
  page.locator('details[data-sobregiro]').filter({ hasText: categoria });

// Hallazgos de ritmo (06 3.5.4) a 10 días del período (21 ene) con 21 por delante: la proyección es el gasto × 21 / 10. Cada
// categoría tiene Asignado $50.00 y tres consumos; el Disponible proyectado es Disponible − proyección y el exceso, su opuesto.
// Gasto 30, 40, 50, 60 y 70 → proyección 63, 84, 105, 126 y 147 → exceso 43, 74, 105, 136 y 167 (solo los tres últimos entran).
const HOY_RITMO = '2027-01-30';
const GASTOS_RITMO: Record<string, number[]> = {
  Alfa: [10, 10, 10],
  Beta: [10, 10, 20],
  Gama: [10, 20, 20],
  Delta: [20, 20, 20],
  Epsilon: [20, 20, 30],
};
const OPS_RITMO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  ...Object.keys(GASTOS_RITMO).map((categoria): Op => ({ op: 'OP-07', categoria })),
  { op: 'OP-21', monto: 1000 },
  ...Object.keys(GASTOS_RITMO).map((categoria): Op => ({
    op: 'OP-14',
    categoria,
    monto: 50,
    periodo: 'P1',
  })),
  ...Object.entries(GASTOS_RITMO).flatMap(([categoria, montos]) =>
    montos.map((monto): Op => ({ op: 'OP-20', cuenta: 'Ahorro', monto, categoria })),
  ),
];

test.describe('PRU-E2E-INICIO', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-INICIO-130 [CA-08.1, ESC-15] RUTA-/ con el paso 2 de ESC-15 Salidas está en sobregiradas con "Sobregiro con débito o efectivo" y sin monto a la vista, y al tocar se ve $50.00 y que reducirá Listo para asignar en $50.00', async ({
    page,
  }) => {
    await sembrarOps(ESC15, '2027-02-10');
    await abrir(page);
    const fila = sobregiro(page, 'Salidas');
    await expect(fila).toBeVisible();
    await expect(fila.getByText('Sobregiro con débito o efectivo')).toBeVisible();
    await expect(fila.locator('summary [data-centavos]')).toHaveCount(0);
    await expect(fila.getByText(/\$50\.00/).first()).toBeHidden();

    await fila.locator('summary').click();
    await esperarMonto(fila.locator('[data-centavos]').first(), 5000);
    await expect(fila.getByText(t.reducira('$50.00'), { exact: true })).toBeVisible();
  });

  test('PRU-E2E-INICIO-131 [CA-08.2, error 11] las categorías sobregiradas de Inicio y sus montos son las del Presupuesto con Disponible negativo, con débito (ESC-15) y con tarjeta (ESC-05)', async ({
    page,
  }) => {
    for (const [ops, categoria, hoy] of [
      [ESC15, 'Salidas', '2027-02-10'],
      [ESC05, 'Super', '2027-02-15'],
    ] as const) {
      await sembrarOps(ops, hoy);
      await abrir(page);
      const fila = sobregiro(page, categoria);
      await fila.locator('summary').click();
      const enInicio = Number(
        await fila.locator('[data-centavos]').first().getAttribute('data-centavos'),
      );

      await abrir(page, '/presupuesto?filtro=sobregiradas');
      const enPresupuesto = page.locator('[data-fila-categoria]').filter({ hasText: categoria });
      await expect(enPresupuesto).toHaveCount(1);
      const disponible = Number(
        await enPresupuesto.locator('[data-centavos]').first().getAttribute('data-centavos'),
      );
      expect(disponible).toBeLessThan(0);
      expect(enInicio).toBe(-disponible);
    }
  });

  test('PRU-E2E-INICIO-132 [CA-08.3, ESC-20] con el paso 2 de ESC-20 Listo para asignar es $675.00 y "En camino" es $25.00', async ({
    page,
  }) => {
    await sembrarOps(ESC20, '2027-02-10');
    await abrir(page);
    await esperarMonto(billete(page).locator('[data-centavos]').first(), 67500);
    await expect(billete(page).locator('[data-en-camino]')).toContainText('$25.00');
  });

  test('PRU-E2E-INICIO-133 [CA-08.4, ESC-01] con el paso 4 de ESC-01 el patrimonio es −$4,300.00', async ({
    page,
  }) => {
    await sembrarOps(ESC01, '2027-02-05');
    await abrir(page);
    await esperarMonto(page.locator('[data-patrimonio] [data-centavos]'), -430000);
    await expect(page.locator('[data-patrimonio]')).toContainText('−$4,300.00');
  });

  test('PRU-E2E-INICIO-134 [CA-08.5, ESC-31] con el cambio retroactivo del paso 1 de ESC-31 Inicio muestra su resumen; "Marcar como leído" lo quita y no vuelve al recargar', async ({
    page,
  }) => {
    await sembrarOps(ESC31, '2027-04-05', [CAMBIO_RETROACTIVO]);
    await abrir(page);
    const cambio = page.locator('[data-cambio-retroactivo]');
    await expect(cambio).toHaveCount(1);
    await expect(cambio).toContainText('−$30.00');
    await expect(cambio).toContainText('−$20.00');

    await cambio.getByRole('button', { name: t.marcarLeido, exact: true }).click();
    await expect(cambio).toHaveCount(0);
    await page.reload();
    await esperarContenido(page);
    await expect(cambio).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-135 [CA-08.6] con 5 categorías con hallazgo de ritmo Inicio muestra solo los 3 de mayor impacto, con su texto, sus montos y su acción', async ({
    page,
  }) => {
    await sembrarOps(OPS_RITMO, HOY_RITMO);
    await abrir(page);
    const hallazgos = page.locator('[data-hallazgo]');
    await expect(hallazgos).toHaveCount(3);
    await expect(hallazgos.nth(0)).toContainText(
      t.hallazgo.ya('$20.00', 'Epsilon', '$167.00', '20/02'),
    );
    await expect(hallazgos.nth(1)).toContainText(
      t.hallazgo.ya('$10.00', 'Delta', '$136.00', '20/02'),
    );
    await expect(hallazgos.nth(2)).toContainText(t.hallazgo.camino('$105.00', 'Gama', '20/02'));
    await expect(
      hallazgos.nth(0).getByRole('link', { name: t.hallazgo.asignar('$167.00') }),
    ).toBeVisible();
    await expect(page.getByText('Alfa', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Beta', { exact: false })).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-136 RUTA-/presupuesto/listo-para-asignar desde el billete de Inicio se abre el detalle de Listo para asignar', async ({
    page,
  }) => {
    await sembrarOps(ESC15, '2027-02-10');
    await abrir(page);
    await page.getByRole('link', { name: t.verDetalle, exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto\/listo-para-asignar$/);
    await esperarContenido(page);
    await expect(
      page.getByRole('heading', { name: listoParaAsignar.titulo, level: 1 }),
    ).toBeVisible();
  });
});
