// FT-66 Tarjetas en el tiempo (06 FT-66; 05 §2.10; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17) con el reloj del servidor fijo (DP-04) y abre `/reportes/tarjetas` como la persona. Los números y las
// fechas los pone el motor: la prueba solo comprueba que la pantalla los dibuja y que el toque ejecuta la operación (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

const INICIO = '2027-01-25';
// Ciclo de 2027 (día 21): P1 21/01, P2 21/02, P3 21/03.
const HOY = '2027-03-25';

// Visa (corte 15, pago 5) abre con $500.00 de deuda. El corte del 15/02 trae $500.00; antes del 05/03 hay un pago de $300.00 y
// una devolución de $50.00. Hoy es 25/03 (P3 activo): el corte del 15/03 ya pasó, pero su fecha de pago (05/04) todavía no. Pago
// Visa tiene lo asignado en P1 y nada en P3, el período activo. Sin `?ventana=` el reporte mira los 6 últimos períodos cerrados.
const SEMILLA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', saldo: 500, diaCorte: 15, diaPago: 5 },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 3000 },
  { op: 'OP-14', categoria: 'Pago Visa', monto: 420, periodo: 'P1' },
  {
    op: 'OP-23',
    tarjeta: 'Visa',
    monto: 300,
    origen: 'Ahorro',
    fecha: '2027-02-20',
    hoy: '2027-02-20',
  },
  {
    op: 'OP-33',
    monto: 50,
    categoria: 'Super',
    cuenta: 'Visa',
    fecha: '2027-02-25',
    hoy: '2027-02-25',
  },
  // Un movimiento en P3 (el activo) para que existan P1 y P2 como períodos cerrados.
  { op: 'OP-21', monto: 10, hoy: '2027-03-22' },
];

// Visa con día de pago 31: febrero tiene 28 días y abril 30.
const SEMILLA_DIA_31: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', diaCorte: 15, diaPago: 31 },
  // Un ingreso en cada período, para que P1 a P4 existan como períodos cerrados y P5 sea el activo.
  { op: 'OP-21', monto: 10, hoy: '2027-02-22' },
  { op: 'OP-21', monto: 10, hoy: '2027-03-22' },
  { op: 'OP-21', monto: 10, hoy: '2027-04-22' },
  { op: 'OP-21', monto: 10, hoy: '2027-05-22' },
];

async function sembrarSemilla(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-TARJETAS',
    titulo: 'Semilla de FT-66',
    refs: [],
    hoy: INICIO,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, INICIO);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
const ciclo = (page: Page, corte: string) => page.locator(`[data-tarjeta] [data-fila="${corte}"]`);
const montoDePago = (page: Page, n: 0 | 1) =>
  page.locator('[data-fila-pago] [data-centavos]').nth(n);

test.describe('PRU-E2E-REP tarjetas en el tiempo', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-200 [CA-66.1] con un corte de $500.00, un pago de $300.00 y una devolución de $50.00 antes de la fecha de pago, «Pagado o acreditado a tiempo» es $350.00, el arrastre $150.00 y el hallazgo es el de ese corte', async ({
    page,
  }) => {
    await sembrarSemilla(SEMILLA, HOY);
    await abrir(page, '/reportes/tarjetas');
    const f = ciclo(page, '2027-02-15');
    await expect(f).toHaveCount(1);
    await esperarMonto(f.locator('[data-col="deudaEstado"] [data-centavos]'), 50000);
    await esperarMonto(f.locator('[data-col="pagadoATiempo"] [data-centavos]'), 35000);
    await esperarMonto(f.locator('[data-col="arrastre"] [data-centavos]'), 15000);
    await expect(page.locator('[data-hallazgo-tarjeta]')).toContainText(
      t.tarjetas.arrastro('Visa', '$150.00', '15/02/2027'),
    );
    await expect(page.getByText(t.tarjetas.pagaElTotal('Visa'))).toHaveCount(0);
  });

  test('PRU-E2E-REP-201 [CA-66.2] el ciclo con corte el 15/03 cuya fecha de pago (05/04) todavía no pasó no figura entre los ciclos evaluados, ni mirando el período actual', async ({
    page,
  }) => {
    await sembrarSemilla(SEMILLA, HOY);
    await abrir(page, '/reportes/tarjetas');
    await expect(ciclo(page, '2027-02-15')).toHaveCount(1);
    await expect(ciclo(page, '2027-03-15')).toHaveCount(0);
    await abrir(page, '/reportes/tarjetas?ventana=actual');
    await expect(page.locator('[data-tarjeta]')).toHaveCount(1);
    await expect(ciclo(page, '2027-03-15')).toHaveCount(0);
    await expect(page.locator('[data-sin-ciclos]')).toHaveText(t.tarjetas.sinCiclos('Visa'));
  });

  test('PRU-E2E-REP-202 [CA-66.3] con $80.00 por reservar, «Reservar $80.00» sube lo asignado a Pago Visa $80.00 y «Te falta reservar» queda en $0.00; «Deshacer» lo devuelve', async ({
    page,
  }) => {
    await sembrarSemilla(SEMILLA, HOY);
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDePago(page, 0), 8000);
    const antes = await montoDePago(page, 1).getAttribute('data-centavos');

    await abrir(page, '/reportes/tarjetas');
    const h = page.locator('[data-hallazgo-tarjeta]');
    await h.getByRole('button', { name: t.tarjetas.reservar('$80.00'), exact: true }).click();
    const salida = page.locator('[data-tarjetas-reservado]');
    await expect(salida).toContainText(t.tarjetas.reservado('$80.00', 'Visa'));
    await expect(salida.getByRole('button', { name: ti.deshacer, exact: true })).toBeVisible();

    await abrir(page, '/presupuesto');
    await esperarMonto(montoDePago(page, 0), 0);
    await esperarMonto(montoDePago(page, 1), Number(antes) + 8000);

    await abrir(page, '/reportes/tarjetas');
    await expect(
      page.locator('[data-hallazgo-tarjeta]').getByRole('link', { name: t.tarjetas.pagar('Visa') }),
    ).toBeVisible();
  });

  test('PRU-E2E-REP-203 [CA-66.4] con día de pago 31, el ciclo de febrero paga el 28/02/2027 y el de abril el 30/04/2027', async ({
    page,
  }) => {
    await sembrarSemilla(SEMILLA_DIA_31, '2027-05-25');
    await abrir(page, '/reportes/tarjetas');
    await expect(ciclo(page, '2027-02-15').locator('[data-col="fechaPago"]')).toHaveText(
      '28/02/2027',
    );
    await expect(ciclo(page, '2027-04-15').locator('[data-col="fechaPago"]')).toHaveText(
      '30/04/2027',
    );
    await expect(page.getByText(t.tarjetas.pagaElTotal('Visa'))).toBeVisible();
  });
});
