// FT-35 Revisar movimiento portado del export de diseño (S4; CH-136; 07 §17: una pantalla o un flujo es una E2E). Mide lo que la
// persona ve: el encabezado, la cuenta, Fecha y Monto, el tipo, las líneas y el pie fijo. Los números los pone el motor (PF-3);
// los textos salen del catálogo (FE-51). La base se siembra con operaciones reales de 01 §8 (DP-17) y el reloj del servidor fijo.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { seleccion } from '../../ayudas/seleccion-nativa.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesWebhook } from '../../../src/textos/ajustes-webhook.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Casa' },
  { op: 'OP-21', monto: 500 },
  {
    op: 'OP-35',
    etiqueta: 'sms',
    cuenta: 'T',
    monto: 30,
    comercio: 'Super',
    recibido: `${DIA_20}T19:00`,
    fecha: DIA_20,
  },
];
const escenario = (estadoInicial: Op[]): Escenario => ({
  id: 'SEM-BAND-35D',
  titulo: 'Semilla de FT-35, Revisar movimiento del diseño',
  refs: [],
  hoy: DIA_20,
  estadoInicial,
  pasos: [],
});

async function abrirElMovimiento(page: Page): Promise<void> {
  fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
  await sembrar(escenario(ESTADO), DIA_20);
  await page.goto('/bandeja');
  await esperarContenido(page);
  await page.locator('[data-movimiento]').getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
  await esperarHidratacion(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-190 [FT-35] el encabezado dice el estado, el comercio, el monto con signo de salida y la cuenta con la fecha, y el texto del SMS queda a la vista', async ({
    page,
  }) => {
    await abrirElMovimiento(page);
    const encabezado = page.locator('[data-encabezado-movimiento]');
    await expect(encabezado).toContainText(cuentas.bandeja.estados.falta);
    await expect(encabezado).toContainText('Super');
    await expect(encabezado.locator('[data-centavos]')).toContainText('−$30.00');
    await expect(encabezado).toContainText('T · 20/02/2027');
    await expect(page.getByRole('region', { name: t.revisar.sms })).toBeVisible();
  });

  test('PRU-E2E-BAND-191 [FT-35] la cuenta es una selección de 52 px con la deuda de la tarjeta, Fecha y Monto van en dos columnas con «$», sin «Se entiende como» ni «Fecha elegida», y el tipo es un selector segmentado', async ({
    page,
  }) => {
    await abrirElMovimiento(page);
    const cuenta = seleccion(page, g.cuenta);
    await expect(cuenta.locator('xpath=..')).toContainText(g.deudaDeCuenta('$0.00'));
    expect((await cuenta.locator('xpath=..').boundingBox())?.height).toBe(52);
    const fecha = await campo(page, g.fecha).boundingBox();
    const monto = await campo(page, t.revisar.monto).boundingBox();
    expect(Math.abs((fecha?.y ?? 0) - (monto?.y ?? 99))).toBeLessThan(2);
    expect(monto?.x ?? 0).toBeGreaterThan((fecha?.x ?? 0) + (fecha?.width ?? 0) - 1);
    await expect(campo(page, t.revisar.monto).locator('xpath=..')).toContainText('$');
    await expect(page.getByText('Se entiende como')).toHaveCount(0);
    await expect(page.getByText('Fecha elegida')).toHaveCount(0);
    const tipo = page.getByRole('radiogroup', { name: t.revisar.tipo });
    await expect(tipo.getByRole('radio')).toHaveCount(4);
    await expect(tipo.getByRole('radio', { name: t.revisar.tipos.gasto })).toBeChecked();
    expect((await tipo.getByRole('radio').first().boundingBox())?.height).toBeGreaterThanOrEqual(
      44,
    );
  });

  test('PRU-E2E-BAND-192 [FT-35] el pie fijo dice «Aprobar $X» con el monto escrito y trae «Descartar» debajo, los dos de al menos 44 px, y no hay botones sueltos al final del formulario', async ({
    page,
  }) => {
    await abrirElMovimiento(page);
    const aprobar = page.getByRole('button', { name: /^Aprobar/ });
    await expect(aprobar).toHaveText(t.revisar.aprobarMonto('$30.00'));
    await campo(page, t.revisar.monto).fill('20');
    await expect(aprobar).toHaveText(t.revisar.aprobarMonto('$20.00'));
    const descartar = page.getByRole('button', { name: cuentas.bandeja.descartar, exact: true });
    const a = await aprobar.boundingBox();
    const d = await descartar.boundingBox();
    expect(a?.height).toBeGreaterThanOrEqual(44);
    expect(d?.height).toBeGreaterThanOrEqual(44);
    expect((d?.y ?? 0) > (a?.y ?? 99)).toBe(true);
    if ((page.viewportSize()?.width ?? 0) < 768)
      expect((d?.y ?? 0) + (d?.height ?? 0)).toBeGreaterThan(
        (page.viewportSize()?.height ?? 0) - 40,
      );
    await expect(page.locator('form').getByRole('button', { name: /^Aprobar/ })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-193 [FT-35] sin ninguna cuenta la pantalla deja a la vista el texto del SMS y explica que primero hay que crear una cuenta', async ({
    page,
    request,
  }) => {
    fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
    await sembrar(escenario([]), DIA_20);
    await page.goto('/ajustes/webhook');
    await esperarHidratacion(page);
    await page.getByRole('button', { name: ajustesWebhook.generar, exact: true }).click();
    const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
    const texto = 'Mensaje sin formato de MacroDroid';
    const respuesta = await request.post('/api/sms', {
      headers: { authorization: `Bearer ${token}` },
      data: { texto, remitente: 'BAC' },
    });
    expect(respuesta.status()).toBe(200);
    await expect(async () => {
      await page.goto('/bandeja');
      await esperarContenido(page);
      await expect(page.locator('[data-movimiento]')).toHaveCount(1);
    }).toPass();
    await page
      .locator('[data-movimiento]')
      .getByRole('link', { name: cuentas.bandeja.registrarAMano })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    const panel = page.locator('main[data-pagina-flujo]');
    await expect(panel.getByText(texto, { exact: true })).toBeVisible();
    // CH-137: el no reconocido se ve primero con sus salidas; «Registrar a mano» lleva a los campos y, sin cuentas, a la guía
    await esperarHidratacion(page);
    await panel.getByRole('button', { name: cuentas.bandeja.registrarAMano }).click();
    await expect(page.getByText(g.sinCuentasTitulo)).toBeVisible();
    await expect(page.getByRole('link', { name: g.crearCuenta })).toHaveAttribute(
      'href',
      '/cuentas/nueva',
    );
    await expect(page.locator('select')).toHaveCount(0);
  });
});
