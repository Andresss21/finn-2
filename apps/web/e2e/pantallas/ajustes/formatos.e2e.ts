// Formatos e Instituciones con el diseño de la entrega 4 (E5-10 a E5-14; CA-E5-12, 13, 15 y 17; 06 FT-73; CH-E5-4, CH-247). Cada prueba
// parte de una base sembrada (DP-17) con el reloj del servidor fijo (DP-04), entra como la persona y recorre la pantalla contra el servidor
// real: el SMS de PRICESMART (DATOS-EJEMPLO §7) llega por el webhook, la prueba del formato (OPT-06) y el rechazo de OPT-07 salen de él.
// Los formatos sembrados no pasan la política (03 §9.5): la prueba crea uno propio.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { generarTokenWebhook } from '../../ayudas/webhook.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesFormatos as t } from '../../../src/textos/ajustes-formatos.ts';
import { ajustesInstituciones as ti } from '../../../src/textos/ajustes-instituciones.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { APIRequestContext, Page } from '@playwright/test';

const HOY = '2026-10-15';
const SMS_PRICESMART =
  'BAC: Compra aprobada por USD 148.60 en PRICESMART con tarjeta VISA ***4821 el 15/10/2026 17:20';
const PATRON = String.raw`por USD (?<monto>[\d,.]+) en (?<comercio>\S+) con tarjeta (?:VISA|MASTERCARD) \*{3}(?<ultimos4>\d{4}) el (?<fecha>\d{2}/\d{2}/\d{4})`;

async function preparar(): Promise<void> {
  fijarRelojServidor(`${HOY}T17:21:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-AJUS-74',
    titulo: 'Semilla de E5-10 a E5-14',
    refs: [],
    hoy: HOY,
    estadoInicial: [
      { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', ultimos4: '4821', apertura: '2026-10-01' },
    ],
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
  await esperarHidratacion(page);
}

/** El SMS de PRICESMART, sin formato que lo reconozca: queda «sin reconocer» y es el que se elige para probar. */
async function recibirPricesmart(page: Page, request: APIRequestContext): Promise<void> {
  await abrir(page, '/ajustes/webhook');
  await generarTokenWebhook(page);
  const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
  const r = await request.post('/api/sms', {
    headers: { authorization: `Bearer ${token}` },
    data: { texto: SMS_PRICESMART, remitente: 'BAC' },
  });
  expect(r.status()).toBe(200);
}

async function llenar(page: Page): Promise<void> {
  await abrir(page, '/ajustes/formatos/nuevo');
  await page.getByLabel(t.campos.institucion, { exact: true }).selectOption({ label: 'BAC' });
  await page.getByLabel(t.campos.nombre, { exact: true }).fill('compra con tarjeta');
  await page.getByLabel(t.campos.patron, { exact: true }).fill(PATRON);
  await page.getByLabel('DD/MM/AAAA', { exact: true }).check();
}

test.describe('PRU-E2E-AJUS', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-AJUS-741 [CA-E5-12, CA-E5-13] RUTA-/ajustes/formatos/nuevo a 1440 px el formulario y «Probar con un SMS» van en dos columnas; probar con el SMS de PRICESMART muestra cada grupo con lo que capturó y cómo se lee', async ({
    page,
    request,
  }) => {
    await preparar();
    await page.setViewportSize({ width: 1440, height: 900 });
    await recibirPricesmart(page, request);
    await llenar(page);

    // «Probar con un SMS» es fija (sticky): se mide con la página arriba, no con el desplazamiento que dejó llenar el formulario
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    const formulario = await page.locator('form').boundingBox();
    const probar = await page.getByRole('region', { name: t.probar.titulo }).boundingBox();
    expect(formulario).not.toBeNull();
    expect(probar).not.toBeNull();
    if (formulario === null || probar === null) return;
    expect(probar.x).toBeGreaterThan(formulario.x + formulario.width - 1);
    expect(Math.abs(probar.y - formulario.y)).toBeLessThan(80);

    await page.getByRole('button', { name: t.probar.boton, exact: true }).click();
    const resultado = page.locator('[data-resultado-prueba]');
    await expect(resultado).toContainText(t.probar.coincide);
    const tabla = resultado.getByRole('table');
    for (const encabezado of [t.probar.grupo, t.probar.capturo, t.probar.seLee])
      await expect(tabla.getByRole('columnheader', { name: encabezado })).toBeVisible();
    for (const [grupo, capturo, seLee] of [
      ['ultimos4', '4821', '***4821'],
      ['monto', '148.60', '$148.60'],
      ['comercio', 'PRICESMART', 'PRICESMART'],
      ['fecha', '15/10/2026', '15/10/2026'],
    ] as const) {
      const fila = tabla
        .locator('tbody tr')
        .filter({ has: page.getByRole('rowheader', { name: grupo, exact: true }) });
      await expect(fila.getByRole('cell').first()).toHaveText(capturo);
      await expect(fila.getByRole('cell').last()).toHaveText(seLee);
    }
  });

  test('PRU-E2E-AJUS-742 [CA-E5-15, CA-E5-17] RUTA-/ajustes/formatos RUTA-/ajustes/instituciones/nueva guardar un formato deja el resultado en la lista con la frase de los SMS sin reconocer y «Verlos en la Bandeja», sin «Reprocesar todos»; una institución repetida muestra el texto de 04 §7.10 en el campo de la hoja', async ({
    page,
  }) => {
    await preparar();
    await llenar(page);
    await page.getByRole('button', { name: t.guardar, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/formatos\?guardado=/);
    const resultado = page.locator('[data-resultado-guardado]');
    await expect(resultado).toContainText(t.guardado.titulo('BAC', 'compra con tarjeta'));
    await expect(resultado).toContainText(t.guardado.sinNumero('BAC'));
    await expect(
      resultado.getByRole('link', { name: t.guardado.verlos, exact: true }),
    ).toHaveAttribute('href', '/bandeja');
    await expect(page.getByText(/Reprocesar todos/)).toHaveCount(0);

    await abrir(page, '/ajustes/instituciones');
    await expect(page.locator('[data-institucion]').filter({ hasText: 'BAC' })).toContainText(
      /formato/,
    );
    await page.getByRole('link', { name: ti.nueva, exact: true }).click();
    const hoja = page.getByRole('dialog', { name: ti.tituloNueva });
    await expect(hoja).toBeVisible();
    await hoja.getByLabel(ti.nombre, { exact: true }).fill('BAC');
    await hoja.getByRole('button', { name: ti.crear, exact: true }).click();
    await expect(hoja.getByText('Ya hay una institución llamada BAC.')).toBeVisible();
    await expect(hoja.getByLabel(ti.nombre, { exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
