// Entrega 4 (CH-240, TA-587): tamaño de los gráficos, cifras del servidor, vacíos de 06 y Flujo de efectivo filtrado a una cuenta
// (E5-5 a E5-7; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las operaciones reales (DP-17) con el
// reloj del servidor fijo (DP-04). Los números los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { registrarTipo as tr } from '../../../src/textos/registrar-tipo.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

const INGRESOS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-21', monto: 100, fecha: '2027-03-22', hoy: '2027-03-22' },
  { op: 'OP-21', monto: 200, fecha: '2027-04-22', hoy: '2027-04-22' },
  { op: 'OP-21', monto: 300, fecha: '2027-05-22', hoy: '2027-05-22' },
];
// Dos cuentas de efectivo para la transferencia (hoy 5 feb).
const DOS_CUENTAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 500 },
  { op: 'OP-01', cuenta: 'Débito', saldo: 0 },
];

async function sembrarOps(ops: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-E4',
    titulo: 'Semilla de la entrega 4 de reportes',
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

test.describe('PRU-E2E-REP cifras, gráficos y flujo de la entrega 4', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-711 [CA-E5-7, CA-E5-8, CA-E5-10] a 1440 px los gráficos no pasan de 560 px (sus textos no crecen); Ritmo trae su cifra del servidor, la misma del renglón de la proyección; un reporte sin datos muestra el texto de 06 RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await sembrarOps(INGRESOS, '2027-05-25');
    await abrir(page, '/reportes/tendencia?ventana=ultimos-3');
    for (const caja of await page
      .locator('[data-reporte] svg[role="img"]')
      .evaluateAll((es) => es.map((e) => e.getBoundingClientRect().width)))
      expect(caja).toBeLessThanOrEqual(560);

    const { escenarioA7 } =
      await import('../../../../../packages/aplicacion/test/escenarios/a7.ts');
    const a7 = escenarioA7();
    fijarRelojServidor('2026-10-15T10:00:00-06:00');
    await sembrar(a7, a7.hoy ?? '2026-10-15');
    await abrir(page, '/reportes/ritmo');
    const cifra = page.locator('[data-cifra-reporte] [data-centavos]');
    const renglon = page.locator('[data-reduccion-lpa] [data-centavos]');
    await expect(cifra).toHaveCount(1);
    expect(await cifra.getAttribute('data-centavos')).toBe(
      await renglon.getAttribute('data-centavos'),
    );

    await sembrarOps([{ op: 'OP-01', cuenta: 'Ahorro' }], '2027-02-10');
    await abrir(page, '/reportes/hormiga');
    await expect(page.getByText(t.hormiga.sinGrupos)).toBeVisible();
    await abrir(page, '/reportes/realidad');
    await expect(
      page.getByText(t.realidad.sinHistoria).or(page.getByText(t.sinMovimientos)),
    ).toBeVisible();
  });

  test('PRU-E2E-REP-712 [CA-E5-9] Flujo de efectivo filtrado a la cuenta que transfirió muestra «Transferencias a otras cuentas» y cierra en el saldo final del servidor RUTA-/reportes/[tipo]', async ({
    page,
  }) => {
    await sembrarOps(DOS_CUENTAS, '2027-02-05');
    const radio = (grupo: string, nombre: string) =>
      page.getByRole('radiogroup', { name: grupo }).getByRole('radio', { name: nombre });
    await page.goto('/registrar/transferencia');
    await esperarHidratacion(page);
    const id = (await radio(tr.origen, 'Ahorro').getAttribute('value')) ?? '';
    await page.goto(`/registrar/transferencia?cuenta=${id}`);
    await esperarHidratacion(page);
    await radio(tr.destino, 'Débito').click();
    await page.getByLabel(tr.total, { exact: true }).fill('200');
    await page.getByRole('button', { name: tr.guardarTransferencia }).click();
    await expect(page.getByRole('heading', { name: tr.listoTransferencia })).toBeVisible();

    await abrir(page, '/reportes/flujo-efectivo');
    await page.getByRole('button', { name: /^Cuentas:/ }).click();
    const hoja = page.getByRole('dialog');
    await expect(hoja.getByText(t.filtroCuentas.soloEfectivo)).toBeVisible();
    await hoja.getByLabel('Ahorro').check();
    await hoja.getByRole('link', { name: 'Ver 1 cuenta' }).click();
    await esperarContenido(page);
    const fila = page.locator('[data-fila="transferencias"]');
    await expect(fila.locator('[data-col="concepto"]')).toHaveText(
      'Transferencias a otras cuentas',
    );
    await esperarMonto(fila.locator('[data-col="monto"] [data-centavos]'), -20000);
    await esperarMonto(
      page.locator('[data-periodo] [data-fila="saldoFinal"] [data-col="monto"] [data-centavos]'),
      30000,
    );
  });
});
