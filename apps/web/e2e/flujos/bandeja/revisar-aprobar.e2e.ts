// FT-35 Revisar y aprobar, trozo 1 (06 §2.5; 05 §2.5, §4.15; 07 §17: una pantalla o un flujo es una E2E). Cada prueba parte de una base
// sembrada con operaciones reales de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre `/bandeja` y
// `/bandeja/[movimientoId]` como la persona. Los números los pone el motor: la prueba abre el presupuesto y comprueba que los
// dibuja (PF-3). Los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
const sms = (etiqueta: string, monto: number, recibido: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio: 'Super',
  recibido: `${DIA_20}T${recibido}`,
  fecha: DIA_20,
});
// El estado inicial y el paso 1 de ESC-46: Ahorro, la tarjeta T, Super, $500.00 de ingreso, $50.00 en Super en P1 y el SMS de las 7 pm
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
];
const ESC46_PASO1: Op[] = [...BASE, sms('sms', 30, '19:00')];
// Una compra anterior en Super ya aprobada: el SMS siguiente del mismo comercio trae la categoría sugerida
const CON_HISTORIAL: Op[] = [
  ...BASE,
  sms('anterior', 30, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Super', aprobado: `${DIA_20}T09:30` },
  sms('sms', 12, '15:00'),
];

/** Siembra el estado del día 20 y deja el reloj del servidor en `ahora` (hora de El Salvador). */
async function preparar(estadoInicial: Op[], ahora: string): Promise<void> {
  fijarRelojServidor(`${ahora}-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-35',
    titulo: 'Semilla de FT-35',
    refs: [],
    hoy: DIA_20,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
}

async function abrirBandeja(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
}

const fila = (page: Page) => page.locator('[data-movimiento]');
const filaDePresupuesto = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ hasText: nombre });

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-120 [CA-35.1] un toque en «Aprobar» reemplaza la fila por «Aprobado: Super · $12.00 · T · Super» y «Ver transacción» abre la transacción creada', async ({
    page,
  }) => {
    await preparar(CON_HISTORIAL, `${DIA_20}T20:00:00`);
    await abrirBandeja(page);
    await expect(fila(page)).toHaveAttribute('data-vista', 'listo');

    await page
      .getByRole('button', { name: cuentas.bandeja.accionDe(cuentas.bandeja.aprobar, 'Super') })
      .click();

    await expect(page.getByTestId('resultado')).toHaveText(
      `${t.aprobado('Super', '$12.00', 'T', 'Super')}${t.verTransaccion}`,
    );
    await expect(page.getByRole('link', { name: t.verTransaccion })).toHaveAttribute(
      'href',
      /^\/actividad\/[0-9a-f-]{36}$/,
    );
    // El movimiento ya no está por revisar: queda solo el resultado en su lugar
    await expect(page.getByRole('button', { name: /^Aprobar/ })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-121 [CA-35.2, ESC-46] el SMS del día 20 aprobado el 21 abre la confirmación del período cerrado (AV-01); al confirmar, Super queda en $20.00 y Pago T en $30.00', async ({
    page,
  }) => {
    await preparar(ESC46_PASO1, '2027-02-21T08:00:00');
    await abrirBandeja(page);
    await fila(page).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    await expect(page.getByText(/Super/).first()).toBeVisible();

    await page
      .getByRole('radiogroup', { name: g.categoriaDeParte('1') })
      .getByRole('radio', { name: 'Super' })
      .click();
    await page.getByRole('button', { name: t.revisar.aprobar }).click();

    await expect(page.getByRole('heading', { name: t.revisar.revisarImpacto })).toBeVisible();
    await expect(page.getByText(g.avisoPeriodoCerrado)).toBeVisible();
    await page.getByRole('button', { name: g.confirmar }).click();

    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('Super', '$30.00', 'T', 'Super'),
    );
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(filaDePresupuesto(page, 'Super').locator('[data-centavos]').first(), 2000);
    await esperarMonto(
      page.locator('[data-fila-pago]').first().locator('[data-centavos]').nth(1),
      3000,
    );
  });

  test('PRU-E2E-BAND-122 [CA-35.3, INV-08] aprobar sin elegir categoría muestra el rechazo linea_sin_destino y el movimiento sigue por revisar', async ({
    page,
  }) => {
    await preparar(ESC46_PASO1, `${DIA_20}T20:00:00`);
    await abrirBandeja(page);
    await fila(page).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();

    await page.getByRole('button', { name: t.revisar.aprobar }).click();

    await expect(
      page.getByText('Cada parte necesita una categoría o un por cobrar.'),
    ).toBeVisible();
    await abrirBandeja(page);
    await expect(fila(page)).toHaveCount(1);
    await expect(fila(page)).toHaveAttribute('data-vista', 'falta');
  });
});
