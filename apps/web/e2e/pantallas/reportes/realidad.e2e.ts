// FT-63 Presupuesto contra la realidad y comparación con el promedio (06 FT-63; 05 §2.10; 07 §17: una pantalla es una E2E). Cada
// prueba parte de una base sembrada con las operaciones reales (DP-17) con el reloj del servidor fijo (DP-04) y abre
// `/reportes/realidad` como la persona. Los números los pone el motor: la prueba solo comprueba que la pantalla los dibuja y que
// el toque ejecuta la operación (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

const HOY_A7 = '2026-10-15';
// Ciclo de 2027 (día 21): P2 21/02, P3 21/03, P4 21/04 son los 3 períodos de comparación y P5 (21/05) el activo, hoy 30/05.
const INICIO = '2027-01-25';
const HOY = '2027-05-30';

/** Lo asignado ($150.00) y lo gastado de una categoría por período, en orden cronológico: el reloj de la semilla no vuelve atrás. */
const CICLOS: readonly {
  readonly inicio: string;
  readonly gasto: string;
  readonly montos: Record<string, number>;
}[] = [
  { inicio: '2027-02-21', gasto: '2027-03-05', montos: { Supermercado: 180, Cable: 180 } },
  {
    inicio: '2027-03-21',
    gasto: '2027-04-05',
    montos: { Supermercado: 175, Cable: 175, Corta: 140 },
  },
  {
    inicio: '2027-04-21',
    gasto: '2027-05-05',
    montos: { Supermercado: 185, Cable: 185, Corta: 140 },
  },
];

// Supermercado y Cable gastan $180.00, $175.00 y $185.00 contra $150.00 (Cable con meta mensual de $150.00); Fondo tiene $50.00 y
// no gasta; Corta tiene solo 2 períodos de comparación (P3 y P4).
const SEMILLA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-07', categoria: 'Cable' },
  { op: 'OP-07', categoria: 'Fondo' },
  { op: 'OP-07', categoria: 'Corta' },
  { op: 'OP-21', monto: 3000 },
  { op: 'OP-18', categoria: 'Cable', monto: 150, tipo: 'mensual' },
  ...CICLOS.flatMap(({ inicio, gasto, montos }): Op[] => [
    ...Object.keys({ ...montos, Fondo: 0 }).map((categoria): Op => ({
      op: 'OP-14',
      categoria,
      monto: categoria === 'Fondo' ? 50 : 150,
      hoy: inicio,
    })),
    ...Object.entries(montos).map(([categoria, monto]): Op => ({
      op: 'OP-20',
      cuenta: 'Ahorro',
      monto,
      categoria,
      fecha: gasto,
      hoy: gasto,
    })),
  ]),
  ...['Supermercado', 'Cable', 'Fondo'].map((categoria): Op => ({
    op: 'OP-14',
    categoria,
    monto: categoria === 'Fondo' ? 50 : 150,
    hoy: '2027-05-21',
  })),
];

async function sembrarSemilla(): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-REALIDAD',
    titulo: 'Semilla de FT-63',
    refs: [],
    hoy: INICIO,
    estadoInicial: SEMILLA,
    pasos: [],
  };
  await sembrar(escenario, INICIO);
}

/** A.7 después del paso 3 de 4.2 con el reloj del servidor en el 15/10/2026 (las E2E no importan valores del dominio). */
async function sembrarA7(): Promise<void> {
  const { escenarioA7 } = await import('../../../../../packages/aplicacion/test/escenarios/a7.ts');
  const escenario = escenarioA7();
  fijarRelojServidor(`${HOY_A7}T10:00:00-06:00`);
  await sembrar(escenario, escenario.hoy ?? HOY_A7);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
const hallazgo = (page: Page, categoria: string) =>
  page.locator('[data-hallazgo-realidad]').filter({ hasText: categoria });
const fila = (page: Page, categoria: string) =>
  page
    .locator('[data-reporte] [data-fila]')
    .filter({ has: page.getByText(categoria, { exact: false }) });

test.describe('PRU-E2E-REP presupuesto contra la realidad', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-180 [CA-63.1] con $150.00 asignados y $180.00, $175.00 y $185.00 gastados, sugiere ajustar a $180.00; al tocar «Ajustar a $180.00» Asignado queda en $180.00 y aparece «Deshacer»', async ({
    page,
  }) => {
    await sembrarSemilla();
    await abrir(page, '/reportes/realidad');
    const h = hallazgo(page, 'Supermercado');
    await expect(h).toContainText(
      t.realidad.pasas('$180.00', 'Supermercado', '$150.00', '$180.00'),
    );
    const id = (await h.getAttribute('data-hallazgo-realidad'))?.replace('categoria:', '') ?? '';
    await h.getByRole('button', { name: t.realidad.ajustar('$180.00'), exact: true }).click();
    const salida = page.locator('[data-realidad-ajustado]');
    await expect(salida).toContainText(t.realidad.ajustado('$180.00', 'Supermercado'));
    await expect(salida.getByRole('button', { name: ti.deshacer, exact: true })).toBeVisible();

    await abrir(page, `/presupuesto/asignar/${id}`);
    await esperarMonto(
      page.locator('[data-resumen-asignar] [data-campo="asignado"] [data-centavos]'),
      18000,
    );

    await abrir(page, '/reportes/realidad');
    await expect(hallazgo(page, 'Supermercado')).toHaveCount(0);
    await expect(page.locator('[data-realidad-ajustado]')).toHaveCount(0);
  });

  test('PRU-E2E-REP-181 [CA-63.1] «Deshacer» del ajuste de Supermercado vuelve Asignado a $150.00 y el hallazgo reaparece', async ({
    page,
  }) => {
    await sembrarSemilla();
    await abrir(page, '/reportes/realidad');
    const h = hallazgo(page, 'Supermercado');
    const id = (await h.getAttribute('data-hallazgo-realidad'))?.replace('categoria:', '') ?? '';
    await h.getByRole('button', { name: t.realidad.ajustar('$180.00'), exact: true }).click();
    const salida = page.locator('[data-realidad-ajustado]');
    await salida.getByRole('button', { name: ti.deshacer, exact: true }).click();
    await expect(salida).toHaveCount(0);
    await expect(hallazgo(page, 'Supermercado')).toHaveCount(1);
    await abrir(page, `/presupuesto/asignar/${id}`);
    await esperarMonto(
      page.locator('[data-resumen-asignar] [data-campo="asignado"] [data-centavos]'),
      15000,
    );
  });

  test('PRU-E2E-REP-182 [CA-63.2] con una meta mensual la acción es «Ajustar la meta a $180.00»: cambia el monto de la meta a $180.00 y no lo asignado', async ({
    page,
  }) => {
    await sembrarSemilla();
    await abrir(page, '/reportes/realidad');
    const h = hallazgo(page, 'Cable');
    const id = (await h.getAttribute('data-hallazgo-realidad'))?.replace('categoria:', '') ?? '';
    await expect(h.getByRole('button', { name: t.realidad.ajustar('$180.00') })).toHaveCount(0);
    await h.getByRole('button', { name: t.realidad.ajustarMeta('$180.00'), exact: true }).click();
    await expect(page.locator('[data-realidad-ajustado]')).toContainText(
      t.realidad.metaAjustada('$180.00', 'Cable'),
    );

    await abrir(page, '/metas');
    await esperarMonto(
      page
        .locator('[data-meta]')
        .filter({ has: page.getByRole('heading', { name: 'Cable' }) })
        .locator('[data-pedido] [data-centavos]'),
      18000,
    );
    await abrir(page, `/presupuesto/asignar/${id}`);
    await esperarMonto(
      page.locator('[data-resumen-asignar] [data-campo="asignado"] [data-centavos]'),
      15000,
    );
  });

  test('PRU-E2E-REP-183 [CA-63.3] con A.7 Restaurantes va camino a $175.56 frente a un promedio de $111.95 (+56.82 %)', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/realidad');
    const h = page.locator('[data-hallazgo-promedio]').filter({ hasText: 'Restaurantes' });
    await expect(h).toHaveCount(1);
    const texto = (await h.innerText()).replace(/\s+/g, ' ');
    expect(texto).toMatch(
      /En Restaurantes vas camino a \$175\.56 este período, 56\.82 ?% más que tu promedio de \$111\.95\./,
    );
    await expect(h.getByRole('link', { name: t.realidad.revisar('Restaurantes') })).toBeVisible();
    const f = fila(page, 'Restaurantes');
    await esperarMonto(f.locator('[data-col="promedioGastado"] [data-centavos]'), 11195);
    await esperarMonto(f.locator('[data-col="gastoComparado"] [data-centavos]'), 17556);
    expect((await f.locator('[data-col="variacion"]').innerText()).replace(/\s+/g, '')).toBe(
      '+56.82%',
    );
  });

  test('PRU-E2E-REP-184 [CA-63.4] un fondo con $50.00 asignados y gasto $0.00 en los 3 períodos no sugiere bajarlo', async ({
    page,
  }) => {
    await sembrarSemilla();
    await abrir(page, '/reportes/realidad');
    await expect(hallazgo(page, 'Fondo')).toHaveCount(0);
    await esperarMonto(
      fila(page, 'Fondo').locator('[data-col="promedioGastado"] [data-centavos]'),
      0,
    );
    await expect(page.getByRole('button', { name: /Ajustar a \$0\.00/ })).toHaveCount(0);
  });

  test('PRU-E2E-REP-185 [CA-63.5] una categoría con 2 períodos de comparación no tiene hallazgo y la fila dice «Hace falta historia de 3 períodos para comparar.»', async ({
    page,
  }) => {
    await sembrarSemilla();
    await abrir(page, '/reportes/realidad');
    await expect(hallazgo(page, 'Corta')).toHaveCount(0);
    await expect(page.locator('[data-hallazgo-promedio]').filter({ hasText: 'Corta' })).toHaveCount(
      0,
    );
    const f = fila(page, 'Corta');
    await expect(f.locator('[data-sin-historia]')).toHaveText(t.realidad.sinHistoria);
    await expect(fila(page, 'Supermercado').locator('[data-sin-historia]')).toHaveCount(0);
  });
});
