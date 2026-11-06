// FT-62 Ritmo de gasto y proyección del cierre (06 FT-62; 05 §2.10; 07 §17: una pantalla es una E2E). Cada prueba parte de una base
// sembrada con las operaciones reales de A.7 (SEM-A7 más el paso 3 de 4.2, DP-17) con el reloj del servidor fijo en el 15/10/2026
// (DP-04), y abre `/reportes/ritmo` como la persona. Los números los pone el motor: la prueba solo comprueba que la pantalla los
// dibuja (PF-3). CA-08.6 (pendiente de punta a punta de FT-08) se cierra acá: Inicio y el reporte muestran los mismos montos.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Locator, Page } from '@playwright/test';

const HOY_A7 = '2026-10-15';

// Cinco categorías con hallazgo de ritmo (hoy 30 ene): cada una con Asignado $50.00 y tres consumos.
// Gasto 30, 40, 50, 60 y 70 → exceso 43, 74, 105, 136 y 167: Inicio muestra solo los tres de mayor impacto.
const HOY_CINCO = '2027-01-30';
const GASTOS_CINCO: Record<string, number[]> = {
  Alfa: [10, 10, 10],
  Beta: [10, 10, 20],
  Gama: [10, 20, 20],
  Delta: [20, 20, 20],
  Epsilon: [20, 20, 30],
};
const OPS_CINCO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  ...Object.keys(GASTOS_CINCO).map((categoria): Op => ({ op: 'OP-07', categoria })),
  { op: 'OP-21', monto: 1000 },
  ...Object.keys(GASTOS_CINCO).map((categoria): Op => ({
    op: 'OP-14',
    categoria,
    monto: 50,
    periodo: 'P1',
  })),
  ...Object.entries(GASTOS_CINCO).flatMap(([categoria, montos]) =>
    montos.map((monto): Op => ({ op: 'OP-20', cuenta: 'Ahorro', monto, categoria })),
  ),
];

/** Siembra las operaciones con `hoy` y deja el reloj del servidor en ese día. */
async function sembrarOps(ops: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-RITMO',
    titulo: 'Semilla de FT-62',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
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
const fila = (page: Page, categoria: string) =>
  page
    .locator('[data-reporte] [data-fila]')
    .filter({ has: page.getByText(categoria, { exact: false }) });
const hallazgo = (page: Page, categoria: string) =>
  page.locator('[data-hallazgo]').filter({ hasText: categoria });
/** La frase del hallazgo, sin el rótulo del ícono ni la acción. */
const frase = async (h: Locator): Promise<string> =>
  /(Ya te pasaste|Vas camino)[^\n]*?\d{2}\/\d{2}\./.exec(await h.innerText())?.[0] ?? '';

test.describe('PRU-E2E-REP ritmo de gasto y proyección del cierre', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-160 [CA-62.1, REC-4.2] con A.7 el reporte de ritmo proyecta Restaurantes −$55.56 y Gasolina −$38.50, y son los dos únicos hallazgos', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    await esperarMonto(
      fila(page, 'Restaurantes').locator('[data-col="alCierre"] [data-centavos]'),
      -5556,
    );
    await esperarMonto(
      fila(page, 'Gasolina').locator('[data-col="alCierre"] [data-centavos]'),
      -3850,
    );
    await expect(page.locator('[data-hallazgo]')).toHaveCount(2);
    await expect(hallazgo(page, 'Restaurantes')).toHaveCount(1);
    await expect(hallazgo(page, 'Gasolina')).toHaveCount(1);
  });

  test('PRU-E2E-REP-161 [CA-62.2] con A.7 la proyección del cierre dice 2 categorías sobregiradas, Listo para asignar bajaría $50.44, te faltaría reservar $43.62 para Visa Oro y te sobrarían $1,546.64', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    const cierre = page.locator('[data-proyeccion-cierre]');
    await expect(cierre).toContainText(t.ritmo.cierre('20/10'));
    await expect(cierre.locator('[data-sobregiradas]')).toContainText(t.ritmo.sobregiradas(2));
    await esperarMonto(cierre.locator('[data-reduccion-lpa] [data-centavos]'), 5044);
    await expect(cierre.locator('[data-reduccion-lpa]')).toContainText(t.ritmo.reduccion);
    const falta = cierre.locator('[data-falta-reservar]');
    await expect(falta).toHaveCount(1);
    await expect(falta).toContainText(t.ritmo.paraTarjeta('Visa Oro'));
    await esperarMonto(falta.locator('[data-centavos]'), 4362);
    await esperarMonto(cierre.locator('[data-sobrante] [data-centavos]'), 154664);
  });

  test('PRU-E2E-REP-162 [CA-62.3] el hallazgo de Restaurantes dice "Ya te pasaste $26.30…" con "Asignar $55.56"; al tocarla Asignado sube $55.56 y aparece "Deshacer", que lo devuelve', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    const h = hallazgo(page, 'Restaurantes');
    await expect(h).toContainText(ti.hallazgo.ya('$26.30', 'Restaurantes', '$55.56', '20/10'));
    const id = (await h.getAttribute('data-hallazgo'))?.replace('categoria:', '') ?? '';
    await h.getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true }).click();
    const salida = page.locator('[data-ritmo-asignado]');
    await expect(salida).toContainText(t.ritmo.asignado('$55.56', 'Restaurantes'));
    await expect(salida.getByRole('button', { name: ti.deshacer, exact: true })).toBeVisible();

    await abrir(page, `/presupuesto/asignar/${id}`);
    await esperarMonto(
      page.locator('[data-resumen-asignar] [data-campo="asignado"] [data-centavos]'),
      17556,
    );

    await abrir(page, '/reportes/ritmo');
    await expect(hallazgo(page, 'Restaurantes')).toHaveCount(0);
  });

  test('PRU-E2E-REP-163 [CA-62.3] "Deshacer" de la propuesta de Restaurantes vuelve Asignado a $120.00 y el hallazgo reaparece', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    const h = hallazgo(page, 'Restaurantes');
    const id = (await h.getAttribute('data-hallazgo'))?.replace('categoria:', '') ?? '';
    await h.getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true }).click();
    const salida = page.locator('[data-ritmo-asignado]');
    await salida.getByRole('button', { name: ti.deshacer, exact: true }).click();
    await expect(salida).toHaveCount(0);
    await expect(hallazgo(page, 'Restaurantes')).toHaveCount(1);
    await abrir(page, `/presupuesto/asignar/${id}`);
    await esperarMonto(
      page.locator('[data-resumen-asignar] [data-campo="asignado"] [data-centavos]'),
      12000,
    );
  });

  test('PRU-E2E-REP-164 [CA-62.4] con Netflix y su programada pendiente, su disponible proyectado es $0.00 y no tiene hallazgo', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    await esperarMonto(fila(page, 'Netflix').locator('[data-col="alCierre"] [data-centavos]'), 0);
    await expect(hallazgo(page, 'Netflix')).toHaveCount(0);
  });

  test('PRU-E2E-REP-165 [CA-62.5] con Luz y agua y un solo consumo no se proyecta y la fila lo dice', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    const luz = fila(page, 'Luz y agua');
    await expect(luz.locator('[data-sin-proyeccion]')).toHaveText(t.ritmo.sinProyeccion);
    await expect(fila(page, 'Restaurantes').locator('[data-sin-proyeccion]')).toHaveCount(0);
    await expect(hallazgo(page, 'Luz y agua')).toHaveCount(0);
  });

  test('PRU-E2E-REP-166 [CA-62.6, error 11] el exceso de Restaurantes es el mismo número en el reporte y en Inicio', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/ritmo');
    const enReporte = await frase(hallazgo(page, 'Restaurantes'));
    await abrir(page, '/');
    const enInicio = await frase(hallazgo(page, 'Restaurantes'));
    expect(enReporte).toContain('$55.56');
    expect(enInicio).toBe(enReporte);
  });

  test('PRU-E2E-REP-167 [CA-08.6] con 5 categorías con hallazgo de ritmo el reporte las lista y Inicio muestra solo las 3 de mayor impacto, con los mismos textos y montos', async ({
    page,
  }) => {
    await sembrarOps(OPS_CINCO, HOY_CINCO);
    await abrir(page, '/reportes/ritmo');
    const enReporte = page.locator('[data-hallazgo]');
    await expect(enReporte).toHaveCount(5);
    const textos: string[] = [];
    for (let i = 0; i < 3; i++) textos.push(await frase(enReporte.nth(i)));
    expect(textos[0]).toBe(ti.hallazgo.ya('$20.00', 'Epsilon', '$167.00', '20/02'));

    await abrir(page, '/');
    const enInicio = page.locator('[data-hallazgo]');
    await expect(enInicio).toHaveCount(3);
    for (let i = 0; i < 3; i++) expect(await frase(enInicio.nth(i))).toBe(textos[i]);
  });
});
