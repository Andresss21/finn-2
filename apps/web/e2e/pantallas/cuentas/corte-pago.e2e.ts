// FT-33 Corte, pago y monto para no generar intereses, con recordatorio (06 FT-33; 05 §2.7; 07 §17: una pantalla o una navegación es una E2E).
// Cada prueba parte de una base sembrada con las operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo
// (DP-04). Los números los pone el motor: la pantalla solo los dibuja (PF-3). El push y la tarea diaria (CA-33.3 y CA-33.5) son de
// integración (PRU-INT-NOTIF-103); el uso del límite del DTO (CA-33.6) es de PRU-INT-CTA-104.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-08 hasta el paso 2 (T con día de corte 15; hoy 19 feb): deuda anterior $200.00, cargos del ciclo $100.00, pagados $150.00.
const ESC08_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', diaCorte: 15 },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 500, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 200, categoria: 'Super', fecha: '2027-02-03' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super', fecha: '2027-02-18' },
  { op: 'OP-23', tarjeta: 'T', monto: 150 },
];
/** Ids secuenciales del ejecutor: el grupo Gastos es el 1, y luego van las cuentas en orden (Ahorro 2, T 3). */
const TARJETA = '00000000-0000-4000-8000-000000000003';

type Notificaciones = Parameters<typeof sembrar>[2];

async function preparar(
  hoy: string,
  estadoInicial: Op[],
  notificaciones: Notificaciones = [],
): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CORTE-PAGO',
    titulo: 'Semilla de FT-33',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy, notificaciones);
}

const campana = (page: Page, nombre: string) =>
  page.locator('[data-marco-barra]').getByRole('link', { name: nombre, exact: true });

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-280 [CA-33.1] una tarjeta con día de corte 31 y hoy 10 de febrero de 2027 muestra en Cuentas el próximo corte el 28/02/2027', async ({
    page,
  }) => {
    await preparar('2027-02-10', [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', diaCorte: 31 },
    ]);
    await page.goto('/cuentas');
    await esperarHidratacion(page);
    const corte = page.locator('[data-detalle-tarjeta] dt', { hasText: /^Corte$/ });
    await expect(corte.locator('xpath=following-sibling::dd')).toHaveText('28/02/2027');
  });

  test('PRU-E2E-CTA-281 [CA-33.2, ESC-08] con el paso 2 de ESC-08 el detalle de la tarjeta dice «Para no generar intereses» $50.00', async ({
    page,
  }) => {
    await preparar('2027-02-19', ESC08_PASO2);
    await page.goto(`/cuentas/${TARJETA}`);
    await esperarContenido(page);
    const fila = page
      .locator('[data-bloque="tarjeta"] dt', { hasText: 'Para no generar intereses' })
      .locator('xpath=..');
    await esperarMonto(fila.locator('[data-centavos]'), 5000);
  });

  test('PRU-E2E-CTA-282 [CA-33.4] al tocar la notificación pago_tarjeta_proximo se abre el detalle de la tarjeta, queda leída y la campana baja a cero', async ({
    page,
  }) => {
    await preparar('2027-02-19', ESC08_PASO2, [
      {
        aviso: null,
        motivo: 'pago_tarjeta_proximo',
        titulo: 'Pago de tarjeta',
        cuerpo: 'T: tu fecha de pago es el 22/02. Revisá cuánto pagar para no generar intereses.',
        destino: { pantalla: 'cuenta', cuentaId: TARJETA },
      },
    ]);
    await page.goto('/notificaciones');
    await esperarContenido(page);
    await expect(campana(page, 'Notificaciones, 1 sin leer')).toBeVisible();
    await page.getByRole('link', { name: /Pago de tarjeta/ }).click();
    await expect(page).toHaveURL(new RegExp(`/cuentas/${TARJETA}$`));
    await expect(campana(page, 'Notificaciones')).toBeVisible();
    await expect(campana(page, 'Notificaciones, 1 sin leer')).toHaveCount(0);
  });
});
