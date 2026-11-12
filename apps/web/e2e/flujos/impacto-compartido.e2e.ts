// PRU-E2E-PWA-751 (TA-566; E4-1, E6-5; 05 §4.4, FE-07): el paso compartido «Revisá el impacto» reemplaza el formulario cuando el
// servidor responde REQUIERE_CONFIRMACION (AV-01, período cerrado), muestra el aviso con su texto del catálogo y, al confirmar, el
// movimiento se guarda una sola vez. La semilla es ESC-31 hasta el paso 0, como PRU-E2E-TX-430; los números los pone el motor.
import type { Page } from '@playwright/test';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { expect, sembrar, test } from '../configuracion/semilla.ts';
import { fijarRelojServidor } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';
import { registrarGasto as t } from '../../src/textos/registrar-gasto.ts';

const ESC31_PASO0: Op[] = [
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
];

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });

async function elegir(page: Page, etiqueta: string, nombre: string): Promise<void> {
  const control = campo(page, etiqueta);
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  await control.selectOption({ label: nombre });
}

test.describe('PRU-E2E-PWA', () => {
  test.describe.configure({ timeout: 120_000 });

  test('PRU-E2E-PWA-751 [CA-E4-21b] un gasto en un período cerrado muestra el paso «Revisá el impacto» con el aviso del período cerrado (sin código) y confirmarlo guarda una sola vez', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    fijarRelojServidor('2027-04-05T10:00:00-06:00');
    const escenario: Escenario = {
      id: 'SEM-PWA-IMPACTO',
      titulo: 'Semilla del paso de impacto',
      refs: [],
      hoy: '2027-04-05',
      estadoInicial: ESC31_PASO0,
      pasos: [],
    };
    await sembrar(escenario, '2027-04-05');
    await page.goto('/registrar/gasto');
    await esperarHidratacion(page);
    await elegir(page, t.cuenta, 'Ahorro');
    await campo(page, t.fecha).fill('2027-02-10');
    await campo(page, t.total).fill('50');
    await campo(page, t.montoDeParte('1')).fill('50');
    await elegir(page, t.categoriaDeParte('1'), 'Salidas');
    await page.getByRole('button', { name: /^Guardar/ }).click();

    // El paso reemplaza el formulario en el mismo flujo.
    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Guardar/ })).toHaveCount(0);
    await expect(page.getByText(t.avisoPeriodoCerrado)).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/AV-\d+/);

    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();

    // Una sola vez: tras el resultado ya no queda nada por confirmar.
    await expect(page.getByRole('button', { name: t.confirmar })).toHaveCount(0);
  });
});
