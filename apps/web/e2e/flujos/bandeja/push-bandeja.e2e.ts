// FT-70 Push de la bandeja con acciones (06 FT-70; 04 §11; 07 §17: un flujo es una E2E). Completa CA-34.4 (pendiente de punta a
// punta, DT-27): el SMS llega por `POST /api/sms` con el token de FT-03, como lo haría MacroDroid, y la persona mira el centro de
// notificaciones (FT-69): un SMS idéntico a los 9 minutos queda autodescartado y no deja notificación (sin notificación no hay
// push, 04 §11.1); a los 10 minutos se evalúa normalmente. El reloj del servidor se mueve entre los dos SMS (DP-04). El envío real
// del push lo prueban PRU-INT-NOTIF-105 (INT) y PRU-MAN-NOTIF-001 (MAN).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { generarTokenWebhook } from '../../ayudas/webhook.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { APIRequestContext, Page } from '@playwright/test';

const HOY = '2027-02-18';
const TEXTO = 'Mensaje de prueba "idéntico" de MacroDroid';

/** El instante del servidor: las 10:00 del día 18 más los minutos dados. */
const reloj = (minutos: number, segundos = 0): void => {
  const dos = (n: number): string => String(n).padStart(2, '0');
  fijarRelojServidor(`${HOY}T10:${dos(minutos)}:${dos(segundos)}-06:00`);
};

async function prepararToken(page: Page): Promise<string> {
  reloj(0);
  const escenario: Escenario = {
    id: 'SEM-NOTIF-70',
    titulo: 'Semilla de FT-70',
    refs: [],
    hoy: HOY,
    estadoInicial: [],
    pasos: [],
  };
  await sembrar(escenario, HOY);
  await page.goto('/ajustes/webhook');
  await esperarHidratacion(page);
  await generarTokenWebhook(page);
  const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  return token;
}

async function recibirSms(request: APIRequestContext, token: string): Promise<void> {
  const respuesta = await request.post('/api/sms', {
    headers: { authorization: `Bearer ${token}` },
    data: { texto: TEXTO, remitente: 'BAC' },
  });
  expect(respuesta.status()).toBe(200);
}

/** El procesamiento corre después de responder (BE-44): se vuelve a abrir la pantalla hasta que muestra el resultado. */
async function esperarFilas(page: Page, ruta: string, filas: number): Promise<void> {
  await expect(async () => {
    await page.goto(ruta);
    await esperarContenido(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(filas);
  }).toPass();
}

async function notificaciones(page: Page): Promise<number> {
  await page.goto('/notificaciones');
  await esperarContenido(page);
  return page.locator('[data-notificacion]').count();
}

test.describe('PRU-E2E-NOTIF', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-NOTIF-120 [CA-34.4] un SMS idéntico a otro recibido 9 minutos antes queda autodescartado: la Bandeja tiene una sola fila, el centro una sola notificación y el repetido figura entre los descartados', async ({
    page,
    request,
  }) => {
    const token = await prepararToken(page);
    await recibirSms(request, token);
    await esperarFilas(page, '/bandeja', 1);
    expect(await notificaciones(page)).toBe(1);

    reloj(9);
    await recibirSms(request, token);
    await esperarFilas(page, '/bandeja?vista=descartados', 1);
    await expect(page.locator('[data-movimiento]')).toContainText(t.descartados.autodescartado);

    await esperarFilas(page, '/bandeja', 1);
    expect(await notificaciones(page)).toBe(1);
  });

  test('PRU-E2E-NOTIF-121 [CA-34.4] a los 10 minutos el mismo SMS se evalúa normalmente: la Bandeja tiene dos filas y el centro dos notificaciones', async ({
    page,
    request,
  }) => {
    const token = await prepararToken(page);
    await recibirSms(request, token);
    await esperarFilas(page, '/bandeja', 1);

    // El reloj avanza con el tiempo real entre los dos SMS: 30 s de margen para que la diferencia no baje de los 10 minutos
    reloj(10, 30);
    await recibirSms(request, token);
    await esperarFilas(page, '/bandeja', 2);
    expect(await notificaciones(page)).toBe(2);
  });
});
