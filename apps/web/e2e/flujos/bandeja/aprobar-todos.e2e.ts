// FT-36 Aprobar todos (06 §2.5; 04 OP-38; 05 §4.14; 07 §17: una pantalla o un flujo es una E2E). Cada prueba parte de una base
// sembrada con operaciones reales de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04). Los textos salen del catálogo (FE-51).
// CA-36.3 (pago de tarjeta) lo prueba una CMP: un pago pendiente exige un formato de SMS propio que esta base no tiene.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesWebhook } from '../../../src/textos/ajustes-webhook.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
const sms = (
  etiqueta: string,
  comercio: string,
  monto: number,
  recibido: string,
  fecha = DIA_20,
): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${fecha}T${recibido}`,
  fecha,
});
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Cafe' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Cafe', monto: 100, periodo: 'P1' },
];
// Compras anteriores ya aprobadas: los SMS siguientes de esos comercios traen su categoría sugerida y quedan listos
const historial: Op[] = [
  sms('anteriorS', 'Super', 30, '09:00'),
  { op: 'OP-37', etiqueta: 'anteriorS', categoria: 'Super', aprobado: `${DIA_20}T09:30` },
  sms('anteriorC', 'Cafe Luna', 2, '09:40'),
  { op: 'OP-37', etiqueta: 'anteriorC', categoria: 'Cafe', aprobado: `${DIA_20}T09:50` },
];
const NETFLIX: Op = {
  op: 'OP-42',
  etiqueta: 'Netflix',
  cuenta: 'T',
  comercio: 'Netflix',
  monto: 15.49,
  categoria: 'Super',
  primeraFecha: DIA_20,
};

/** Siembra el día 20 de febrero (cada operación con otra fecha lleva su `hoy`) y deja al servidor en `relojServidor`. */
async function preparar(estadoInicial: Op[], relojServidor = DIA_20) {
  fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-36',
    titulo: 'Semilla de FT-36, aprobar todos',
    refs: [],
    hoy: DIA_20,
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
  fijarRelojServidor(`${relojServidor}T20:00:00-06:00`);
}

async function abrirBandeja(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
}

const aprobarTodos = (page: Page, n: number) =>
  page.getByRole('button', { name: t.aprobarTodos.boton(n), exact: true });
const av19 = (page: Page) => page.getByTestId('av-19');

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-180 [CA-36.1] cuatro pendientes listos, uno con coincidencia, uno posible duplicado y uno no reconocido: «Aprobar todos (4)» aprueba los cuatro y los otros tres quedan como estaban', async ({
    page,
    request,
  }) => {
    await preparar([
      ...historial,
      NETFLIX,
      sms('a', 'Super', 12, '15:00'),
      sms('b', 'Super', 13, '15:30'),
      sms('c', 'Super', 14, '16:00'),
      sms('d1', 'Cafe Luna', 3.5, '17:15'),
      sms('d2', 'Cafe Sol', 3.5, '17:17'),
      sms('netflix', 'Netflix', 15.49, '19:00'),
    ]);
    // El no reconocido llega por el webhook real, con el token de Ajustes
    await page.goto('/ajustes/webhook');
    await esperarHidratacion(page);
    await page.getByRole('button', { name: ajustesWebhook.generar, exact: true }).click();
    const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
    const respuesta = await request.post('/api/sms', {
      headers: { authorization: `Bearer ${token}` },
      data: { texto: 'Compra rara que Finn no entiende', remitente: 'BAC' },
    });
    expect(respuesta.status()).toBe(200);

    await expect(async () => {
      await abrirBandeja(page);
      await expect(page.locator('[data-vista="noReconocido"]')).toHaveCount(1);
    }).toPass();
    await expect(page.locator('[data-movimiento]')).toHaveCount(7);
    await expect(aprobarTodos(page, 4)).toBeVisible();

    await aprobarTodos(page, 4).click();

    await expect(page.getByTestId('resultado')).toContainText(t.aprobarTodos.aprobaste(4));
    await expect(av19(page)).toHaveCount(0);
    await expect(page.locator('[data-movimiento]')).toHaveCount(3);
    await expect(page.locator('[data-vista="coincidencia"]')).toHaveCount(1);
    await expect(page.locator('[data-vista="duplicado"]')).toHaveCount(1);
    await expect(page.locator('[data-vista="noReconocido"]')).toHaveCount(1);
    // Sin elegibles el botón no aparece
    await expect(page.getByRole('button', { name: /^Aprobar todos/ })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-181 [CA-36.2] un pendiente con fecha en un período cerrado no se aprueba y AV-19 dice «Requiere revisión individual (afecta un período cerrado).»', async ({
    page,
  }) => {
    // La compra vieja es del 20 de febrero y la nueva del 9 de marzo; el servidor está en el 10 de marzo, y febrero ya está cerrado
    await preparar(
      [
        ...historial,
        sms('vieja', 'Super', 21, '15:00'),
        { ...sms('nueva', 'Super', 12, '15:00', '2027-03-09'), hoy: '2027-03-09' },
      ],
      '2027-03-10',
    );
    await abrirBandeja(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(2);
    await expect(aprobarTodos(page, 1)).toBeVisible();

    await aprobarTodos(page, 1).click();

    await expect(page.getByTestId('resultado')).toContainText(t.aprobarTodos.aprobaste(1));
    await expect(av19(page)).toContainText('Super $21.00');
    await expect(av19(page)).toContainText(
      'Requiere revisión individual (afecta un período cerrado).',
    );
    await expect(page.locator('[data-movimiento]')).toHaveCount(1); // la vieja sigue pendiente
  });

  test('PRU-E2E-BAND-182 [CA-36.4] uno de los elegibles se aprueba en otra pestaña entre la lista y el toque: los demás se aprueban y ese aparece en AV-19 con su motivo', async ({
    page,
    context,
  }) => {
    await preparar([
      ...historial,
      sms('a', 'Super', 12, '15:00'),
      sms('b', 'Super', 13, '15:30'),
      sms('c', 'Super', 14, '16:00'),
    ]);
    await abrirBandeja(page);
    await expect(aprobarTodos(page, 3)).toBeVisible();

    const otra = await context.newPage();
    await abrirBandeja(otra);
    await otra
      .locator('[data-movimiento]')
      .filter({ hasText: '$13.00' })
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(otra.getByTestId('resultado')).toBeVisible();
    await otra.close();

    await aprobarTodos(page, 3).click();

    await expect(page.getByTestId('resultado').first()).toContainText(t.aprobarTodos.aprobaste(2));
    await expect(av19(page)).toContainText('Super $13.00');
    await expect(av19(page)).toContainText('ya está');
    await expect(av19(page).getByRole('listitem')).toHaveCount(1);
  });
});
