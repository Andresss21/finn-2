// FT-68 Flujo de efectivo (06 FT-68; 05 §2.10; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17) con el reloj del servidor fijo (DP-04) y abre `/reportes/flujo-efectivo` como la persona. Los números
// los pone el motor: la prueba solo comprueba que la pantalla los dibuja y que el toque ejecuta la operación (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { registrarTipo as tr } from '../../../src/textos/registrar-tipo.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

const INICIO = '2027-01-25';
// Ciclo de 2027 (día 21): P1 21/01, P2 21/02, P3 21/03. Hoy cae en P2, el período activo.
const HOY = '2027-02-25';

// Ahorro recibe $1,000.00 en P1 (saldo inicial de P2), $300.00 de ingreso y un gasto de $100.00 con débito en P2.
const SEMILLA_FILAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-21', monto: 300, fecha: '2027-02-22', hoy: '2027-02-22' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 100,
    categoria: 'Super',
    fecha: '2027-02-23',
    hoy: '2027-02-23',
  },
];

// Dos cuentas de efectivo para la transferencia.
const SEMILLA_TRANSFERENCIA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 500 },
  { op: 'OP-01', cuenta: 'Débito', saldo: 0 },
];

// $400.00 con Visa en Super, con $250.00 asignados a Super (reservados para Visa al comprar): $150.00 quedan sin respaldo. Se
// pagan $250.00 de Visa desde Ahorro, así que las compras (400) superan a los pagos (250).
const SEMILLA_RESERVAR: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', saldo: 0 },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 3000, fecha: '2027-02-22', hoy: '2027-02-22' },
  { op: 'OP-14', categoria: 'Super', monto: 250, periodo: 'P2' },
  {
    op: 'OP-20',
    cuenta: 'Visa',
    monto: 400,
    categoria: 'Super',
    fecha: '2027-02-23',
    hoy: '2027-02-23',
  },
  {
    op: 'OP-23',
    tarjeta: 'Visa',
    monto: 250,
    origen: 'Ahorro',
    fecha: '2027-02-24',
    hoy: '2027-02-24',
  },
];

async function sembrarSemilla(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-FLUJO',
    titulo: 'Semilla de FT-68',
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
const monto = (page: Page, fila: string) =>
  page.locator(`[data-periodo] [data-fila="${fila}"] [data-col="monto"] [data-centavos]`);

test.describe('PRU-E2E-REP flujo de efectivo', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-230 [CA-68.1] con $1,000.00 de saldo inicial, $300.00 de ingresos y $100.00 de gasto con débito, el saldo final es $1,200.00', async ({
    page,
  }) => {
    await sembrarSemilla(SEMILLA_FILAS, HOY);
    await abrir(page, '/reportes/flujo-efectivo');
    await esperarMonto(monto(page, 'saldoInicial'), 100000);
    await esperarMonto(monto(page, 'ingresos'), 30000);
    await esperarMonto(monto(page, 'gastos_debito'), -10000);
    await esperarMonto(monto(page, 'saldoFinal'), 120000);
    await expect(page.locator('[data-explicacion]')).toHaveText(t.explicacionFlujo);
  });

  test('PRU-E2E-REP-231 [CA-68.2] una transferencia de $200.00 entre dos cuentas de efectivo no aparece sin filtro; filtrando solo la cuenta de origen aparece como −$200.00 en «Transferencias»', async ({
    page,
  }) => {
    await sembrarSemilla(SEMILLA_TRANSFERENCIA, '2027-02-05');
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
    await expect(monto(page, 'saldoFinal')).toHaveCount(1);
    await expect(page.locator('[data-fila="transferencias"]')).toHaveCount(0);
    await abrir(page, `/reportes/flujo-efectivo?cuentas=${id}`);
    await esperarMonto(monto(page, 'transferencias'), -20000);
    await expect(page.locator('[data-fila="transferencias"] [data-col="concepto"]')).toHaveText(
      t.flujo.filas.transferencias,
    );
  });

  test('PRU-E2E-REP-232 [CA-68.3] con $400.00 en compras con tarjeta, $250.00 pagados y $150.00 por reservar, el reporte termina con «Reservar $150.00 para Visa»; el toque reserva y «Deshacer» lo devuelve', async ({
    page,
  }) => {
    await sembrarSemilla(SEMILLA_RESERVAR, HOY);
    await abrir(page, '/reportes/flujo-efectivo');
    await esperarMonto(monto(page, 'pagos_tarjeta'), -25000);
    await expect(page.locator('[data-compras-tarjeta]')).toContainText(
      t.flujo.comprasConTarjetaDe('$400.00'),
    );
    const h = page.locator('[data-hallazgo-flujo]');
    await h.getByRole('button', { name: t.flujo.reservar('$150.00', 'Visa'), exact: true }).click();
    const salida = page.locator('[data-flujo-reservado]');
    await expect(salida).toContainText(t.flujo.reservado('$150.00', 'Visa'));
    await expect(salida.getByRole('button', { name: ti.deshacer, exact: true })).toBeVisible();

    await abrir(page, '/reportes/flujo-efectivo');
    await expect(page.locator('[data-hallazgo-flujo]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: t.flujo.verRemanente })).toBeVisible();
  });
});
