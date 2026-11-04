// FT-26 Eliminar y cambiar el estado bancario (06 FT-26; 05 §2.6; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con
// las operaciones reales de un escenario de 01 §8 (DP-17), con el reloj del servidor fijo (DP-04), y llega a la acción como la persona:
// desde Actividad, al detalle y a «Más acciones». Los números los pone el motor (PF-3): la prueba comprueba que se dibujan.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as b } from '../../../src/textos/bandeja.ts';
import { impactoLineas as impacto } from '../../../src/textos/formularios.ts';
import { transaccion as t } from '../../../src/textos/transaccion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

async function preparar(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-ACT-26',
    titulo: 'Semilla de FT-26, eliminar y estado',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** Abre el detalle de la última fila de Actividad (la más antigua) que contiene `texto`. */
async function irAlDetalle(page: Page, texto: string): Promise<void> {
  await abrir(page, '/actividad');
  await page.locator('[data-fila-transaccion]').filter({ hasText: texto }).last().click();
  await expect(page.getByRole('link', { name: t.editar })).toBeVisible();
}

/** Desde el detalle, elige una acción de «Más acciones». */
async function masAcciones(page: Page, accion: string): Promise<void> {
  await page.getByRole('button', { name: 'Más acciones' }).click();
  await page.getByRole('menuitem', { name: accion }).click();
}

const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const disponible = (page: Page, nombre: string) =>
  page
    .locator('[data-fila-categoria]')
    .filter({ hasText: nombre })
    .locator('[data-centavos]')
    .first();

// ESC-31 hasta el paso 1 (hoy 5 abr): el historial y el débito olvidado de $50.00 en Salidas con fecha 10 feb
const ESC31_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
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
    hoy: '2027-04-05',
  },
];

const DIA_20 = '2027-02-20';
// Ahorro con $500.00, la tarjeta T y Super con $50.00 en P1
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
];

test.describe('PRU-E2E-TX eliminar y cambiar el estado bancario', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-450 [CA-26.1, ESC-33, AV-01] RUTA-/actividad/[transaccionId]/eliminar al eliminar el débito olvidado de $50.00 veo AV-01 con Listo para asignar +$30.00 y Salidas +$20.00 y, al confirmar, el estado vuelve al del paso 0: Listo para asignar $590.00 y Salidas $80.00', async ({
    page,
  }) => {
    await preparar(ESC31_PASO1, '2027-04-05');
    await irAlDetalle(page, '$50.00');
    await masAcciones(page, t.eliminar);
    await expect(page.getByRole('heading', { level: 1, name: t.eliminarTitulo })).toBeVisible();

    await page.getByRole('button', { name: t.verCambios }).click();
    await expect(page.getByText(t.avisosEliminar['AV-01'] ?? '')).toBeVisible();
    await expect(page.getByText(impacto.listoParaAsignar('+$30.00'))).toBeVisible();
    await expect(page.getByText(impacto.disponible('Salidas', '+$20.00'))).toBeVisible();
    await page.getByRole('button', { name: t.eliminar }).click();
    await expect(page).toHaveURL(/\/actividad$/);

    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 59000);
    await esperarMonto(disponible(page, 'Salidas'), 8000);
  });

  test('PRU-E2E-TX-451 [CA-26.2] RUTA-/actividad/[transaccionId]/eliminar al eliminar la transacción aprobada desde un SMS, su movimiento aparece en los descartados de la Bandeja y se puede restaurar', async ({
    page,
  }) => {
    await preparar(
      [
        ...BASE,
        {
          op: 'OP-35',
          etiqueta: 'sms',
          cuenta: 'T',
          monto: 30,
          comercio: 'Super',
          recibido: `${DIA_20}T19:00`,
          fecha: DIA_20,
        },
        { op: 'OP-37', etiqueta: 'sms', categoria: 'Super', aprobado: `${DIA_20}T19:30` },
      ],
      DIA_20,
    );
    await irAlDetalle(page, '$30.00');
    await masAcciones(page, t.eliminar);
    await page.getByRole('button', { name: t.verCambios }).click();
    await page.getByRole('button', { name: t.eliminar }).click();
    await expect(page).toHaveURL(/\/actividad$/);

    await abrir(page, '/bandeja?vista=descartados');
    await expect(page.locator('[data-movimiento]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Restaurar/ })).toBeVisible();
    await page.getByRole('button', { name: /Restaurar/ }).click();
    await expect(page.getByTestId('resultado')).toContainText(b.restauraste('Super $30.00'));
  });

  test('PRU-E2E-TX-452 [CA-26.3] RUTA-/actividad/[transaccionId]/eliminar al eliminar la transacción que registró una ocurrencia programada, la ocurrencia vuelve a pendiente', async ({
    page,
  }) => {
    await preparar(
      [
        ...BASE,
        {
          op: 'OP-42',
          etiqueta: 'Netflix',
          cuenta: 'Ahorro',
          comercio: 'Netflix',
          monto: 15.49,
          categoria: 'Super',
          primeraFecha: DIA_20,
        },
        { op: 'OP-43', modo: 'toque', programada: 'Netflix', fecha: DIA_20 },
      ],
      DIA_20,
    );
    await abrir(page, '/programadas');
    const antes = await page.locator('[data-seccion="proximos"] [data-proximo]').count();

    await irAlDetalle(page, '$15.49');
    await masAcciones(page, t.eliminar);
    await page.getByRole('button', { name: t.verCambios }).click();
    await page.getByRole('button', { name: t.eliminar }).click();
    await expect(page).toHaveURL(/\/actividad$/);

    await abrir(page, '/programadas');
    await expect(page.locator('[data-seccion="proximos"] [data-proximo]')).toHaveCount(antes + 1);
  });

  test('PRU-E2E-TX-453 [CA-26.4] RUTA-/actividad/[transaccionId]/eliminar una compra con un cobro no se elimina: explica transaccion_con_eventos y no ofrece eliminar', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 50,
          lineas: [
            { categoria: 'Super', monto: 20 },
            { deudor: 'Ana', monto: 30 },
          ],
          etiqueta: 'cobro',
        },
        { op: 'OP-31', cobro: 'cobro', monto: 15 },
      ],
      '2027-02-12',
    );
    await irAlDetalle(page, '$50.00');
    await masAcciones(page, t.eliminar);

    await expect(page.getByRole('heading', { name: t.noSePuedeEliminar })).toBeVisible();
    await expect(page.getByText(/Eliminalos primero/)).toBeVisible();
    await expect(page.locator('[data-eventos]')).toContainText('$15.00');
    await expect(page.getByRole('button', { name: t.verCambios })).toHaveCount(0);
    await expect(page.getByRole('link', { name: t.verTransaccion })).toBeVisible();
  });

  test('PRU-E2E-TX-454 [CA-26.5] RUTA-/actividad/[transaccionId]/estado al marcar confirmada la pendiente de $40.00 el saldo confirmado de la cuenta pasa de $60.00 a $100.00 y el saldo sigue en $100.00', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-21', monto: 60, etiqueta: 'base' },
        { op: 'OP-30', etiqueta: 'base', estado: 'confirmada' },
        { op: 'OP-21', monto: 40, etiqueta: 'pendiente' },
        { op: 'OP-30', etiqueta: 'pendiente', estado: 'pendiente' },
      ],
      '2027-02-12',
    );
    const tarjeta = (page: Page) =>
      page.locator('a[href^="/cuentas/"]').filter({ hasText: 'Ahorro' });
    const saldo = tarjeta(page).locator('[data-centavos]').first();
    const confirmado = tarjeta(page)
      .locator('p', { hasText: 'Confirmado' })
      .locator('[data-centavos]')
      .first();
    await abrir(page, '/cuentas');
    await esperarMonto(saldo, 10000);
    await esperarMonto(confirmado, 6000);

    await irAlDetalle(page, '$40.00');
    await masAcciones(page, t.marcarConfirmada);
    await expect(page.getByRole('heading', { level: 1, name: t.estadoTitulo })).toBeVisible();
    await page.getByRole('radio', { name: /Confirmada/ }).click();
    await page.getByRole('button', { name: t.guardarEstado }).click();
    await expect(page.getByRole('heading', { level: 1, name: t.estadoTitulo })).toHaveCount(0);

    await abrir(page, '/cuentas');
    await esperarMonto(saldo, 10000);
    await esperarMonto(confirmado, 10000);
  });

  test('PRU-E2E-TX-455 [CA-26.6, AV-16] RUTA-/actividad/[transaccionId]/eliminar al eliminar una transacción conciliada veo AV-16 antes de confirmar', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 100, fecha: '2027-02-01', hoy: '2027-02-01' },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: '2027-02-01' },
        {
          op: 'OP-20',
          cuenta: 'T',
          monto: 40,
          categoria: 'Super',
          etiqueta: 'A',
          fecha: '2027-02-03',
          hoy: '2027-02-03',
        },
        {
          op: 'OP-47',
          cuenta: 'T',
          fecha: '2027-02-15',
          saldo: -40,
          movimientos: [{ indice: 1, fecha: '2027-02-03', monto: -40 }],
          coincidencias: [{ etiqueta: 'A', indice: 1 }],
        },
      ],
      '2027-02-16',
    );
    await irAlDetalle(page, '$40.00');
    await masAcciones(page, t.eliminar);
    await page.getByRole('button', { name: t.verCambios }).click();
    await expect(page.getByText(t.avisosEliminar['AV-16'] ?? '')).toBeVisible();
    await page.getByRole('button', { name: t.eliminar }).click();
    await expect(page).toHaveURL(/\/actividad$/);
  });

  test('PRU-E2E-TX-456 [] «Marcar como pendiente» de una confirmada guarda el cambio y el detalle dice Pendiente', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-21', monto: 70, etiqueta: 'ingreso' },
        { op: 'OP-30', etiqueta: 'ingreso', estado: 'confirmada' },
      ],
      '2027-02-12',
    );
    await irAlDetalle(page, '$70.00');
    await masAcciones(page, t.marcarPendiente);
    await page.getByRole('radio', { name: /^Pendiente/ }).click();
    await page.getByRole('button', { name: t.guardarEstado }).click();
    await expect(page.getByRole('heading', { level: 1, name: t.estadoTitulo })).toHaveCount(0);
    await expect(page.locator('dd', { hasText: /^Pendiente$/ })).toBeVisible();
  });
});
