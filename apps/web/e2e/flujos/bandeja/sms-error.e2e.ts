// FT-38 SMS no reconocidos y con error (06 §2.5; 04 OP-36, OP-49, OP-50; 07 §17: una pantalla o un flujo es una E2E). Los dos estados
// salen del servidor real, como en PRU-E2E-BAND-110: el token de FT-03 y `POST /api/sms`. Un SMS que no coincide con ningún formato
// queda no reconocido; un cuerpo que el webhook no puede leer (`Content-Type` que no es el de ningún formato) se guarda crudo y queda
// con error (BE-60). Los textos salen del catálogo (FE-51). El resto de la ficha lo prueban el dominio, la integración y las CMP.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { formatearFechaTexto } from '../../../src/formato/index.ts';
import { transaccion } from '../../../src/textos/transaccion.ts';
import { ajustesWebhook } from '../../../src/textos/ajustes-webhook.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { APIRequestContext, Page } from '@playwright/test';

const HOY = '2027-02-18';
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', ultimos4: '4821' },
  { op: 'OP-07', categoria: 'Supermercado' },
];
const COMPRA =
  'VISA 4821: has realizado una compra por USD 15.49 en el comercio Netflix 2027/02/18';

async function preparar(page: Page): Promise<string> {
  fijarRelojServidor(`${HOY}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-38',
    titulo: 'Semilla de FT-38, SMS no reconocidos y con error',
    refs: [],
    hoy: HOY,
    estadoInicial: BASE,
    pasos: [],
  };
  await sembrar(escenario, HOY);
  await page.goto('/ajustes/webhook');
  await esperarHidratacion(page);
  await page.getByRole('button', { name: ajustesWebhook.generar, exact: true }).click();
  const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  return token;
}

/** Un SMS que Finn no reconoce: llega bien formado (la variante por omisión del entorno de prueba). */
async function enviarNoReconocido(
  request: APIRequestContext,
  token: string,
  texto: string,
): Promise<void> {
  const r = await request.post('/api/sms', {
    headers: { authorization: `Bearer ${token}` },
    data: { texto, remitente: 'BAC' },
  });
  expect(r.status()).toBe(200);
}

/** Un cuerpo ilegible con token válido: se guarda crudo y el intento queda en `error` (BE-60, `content_type`). */
async function enviarConError(
  request: APIRequestContext,
  token: string,
  texto: string,
): Promise<void> {
  const r = await request.post('/api/sms', {
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/octet-stream' },
    data: texto,
  });
  expect(r.status()).toBe(200);
}

const filas = (page: Page) => page.locator('[data-movimiento]');

/** El procesamiento corre después de responder (BE-44): se vuelve a abrir hasta que aparece la fila con su estado. */
async function abrirBandeja(page: Page, vista: string, cuantas = 1): Promise<void> {
  await expect(async () => {
    await page.goto('/bandeja');
    await esperarContenido(page);
    await expect(page.locator(`[data-vista="${vista}"]`)).toHaveCount(cuantas);
  }).toPass();
}

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-160 [CA-38.1] un no reconocido se completa a mano (cuenta, fecha, monto, tipo gasto y una línea) y al aprobar crea la transacción con origen SMS y la fecha que escribí', async ({
    page,
    request,
  }) => {
    const token = await preparar(page);
    const texto = 'Compra rara que Finn no entiende';
    await enviarNoReconocido(request, token, texto);
    await abrirBandeja(page, 'noReconocido');
    await filas(page).getByRole('link', { name: cuentas.bandeja.registrarAMano }).click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    const panel = page.locator('main[data-pagina-flujo]');
    await expect(panel.getByText(texto, { exact: true })).toBeVisible();
    // CH-137: un no reconocido se ve primero con sus salidas; «Registrar a mano» muestra los campos
    await esperarHidratacion(page);
    await panel.getByRole('button', { name: cuentas.bandeja.registrarAMano }).click();

    await page
      .getByRole('radiogroup', { name: t.revisar.tipo })
      .getByText(t.revisar.tipos.gasto)
      .click();
    await elegirOpcion(page, g.cuenta, 'Ahorro');
    await page.getByLabel(g.fecha, { exact: true }).fill('2027-02-10');
    await page.getByRole('textbox', { name: t.revisar.monto, exact: true }).fill('12.50');
    await page.getByRole('textbox', { name: g.montoDeParte('1') }).fill('12.50');
    await elegirOpcion(page, g.categoriaDeParte('1'), 'Supermercado');
    await page.getByRole('button', { name: t.revisar.aprobar }).click();

    await expect(page.getByTestId('resultado')).toContainText('$12.50');
    await page.getByRole('link', { name: t.verTransaccion }).click();
    await esperarContenido(page);
    const datos = page.locator('dl');
    await expect(datos).toContainText(formatearFechaTexto('2027-02-10'));
    await expect(datos).toContainText(transaccion.origenes.sms);
    await expect(page.getByRole('region', { name: transaccion.mensajeOriginal })).toContainText(
      texto,
    );
  });

  test('PRU-E2E-BAND-161 [CA-38.2] «Intentar de nuevo» sobre un SMS con error vuelve a procesar su texto original: la fila deja de estar con error y queda por revisar', async ({
    page,
    request,
  }) => {
    const token = await preparar(page);
    await enviarConError(request, token, COMPRA);
    await abrirBandeja(page, 'error');
    await expect(page.getByText(t.desglose.errores(1))).toBeVisible();
    await expect(filas(page).getByText(COMPRA, { exact: true })).toBeVisible();

    await page
      .getByRole('button', {
        name: cuentas.bandeja.accionDe(
          cuentas.bandeja.intentarDeNuevo,
          cuentas.bandeja.sinComercio,
        ),
      })
      .click();
    await expect(page.getByText(t.reprocesado)).toBeVisible();
    await expect(page.locator('[data-vista="error"]')).toHaveCount(0);
    await expect(filas(page)).toHaveCount(1);
    await expect(filas(page)).toContainText('Netflix');
    await expect(filas(page)).toContainText('15.49');
  });

  test('PRU-E2E-BAND-162 la revisión de un SMS con error muestra su detalle saneado con la referencia, y «Descartar» sobre un con error y sobre un no reconocido los deja en «Descartados» con «Restaurar»', async ({
    page,
    request,
  }) => {
    const token = await preparar(page);
    await enviarConError(request, token, 'cuerpo ilegible del banco');
    await enviarNoReconocido(request, token, 'Mensaje que nadie reconoce');
    await abrirBandeja(page, 'noReconocido');
    await abrirBandeja(page, 'error');

    await page
      .locator('[data-vista="error"]')
      .getByRole('link', { name: cuentas.bandeja.revisar })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    await expect(page.getByTestId('referencia')).toHaveText('cuerpo_invalido: content_type');
    await page.getByRole('button', { name: cuentas.bandeja.descartar, exact: true }).click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.descartaste(cuentas.bandeja.sinComercio),
    );

    await abrirBandeja(page, 'noReconocido');
    await filas(page).getByRole('link', { name: cuentas.bandeja.registrarAMano }).click();
    await page.getByRole('button', { name: cuentas.bandeja.descartar, exact: true }).click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.descartaste(cuentas.bandeja.sinComercio),
    );
    await page.goto('/bandeja?vista=descartados');
    await esperarContenido(page);
    await expect(page.getByRole('button', { name: t.restaurar })).toHaveCount(2);
  });
});
