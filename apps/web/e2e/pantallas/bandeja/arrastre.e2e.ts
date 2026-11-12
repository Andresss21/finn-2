// CH-240 (entrega 4, E3-1 a E3-7, E6-5, E6-16): arrastrar un movimiento a una categoría en la Bandeja, con el asa de computadora,
// la pulsación larga del teléfono, el panel de destinos y el conflicto de las líneas. Cada prueba parte de una base sembrada con
// operaciones reales y del reloj del servidor fijo (DP-04); los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { formularios } from '../../../src/textos/formularios.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Locator, Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
const sms = (etiqueta: string, comercio: string, monto: number, recibido: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${DIA_20}T${recibido}`,
  fecha: DIA_20,
});
const OTRAS = ['Mascota', 'Transporte', 'Hogar', 'Ropa'];
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  ...['Supermercado', 'Restaurantes', 'Farmacia', ...OTRAS].flatMap((c): Op[] => [
    { op: 'OP-07', categoria: c },
  ]),
  { op: 'OP-21', monto: 500 },
  ...['Supermercado', 'Restaurantes', 'Farmacia', ...OTRAS].flatMap((c): Op[] => [
    { op: 'OP-14', categoria: c, monto: 100, periodo: 'P1' },
  ]),
];
// Una compra anterior en cada categoría: el panel tiene de dónde sacar la sugerida y las cinco frecuentes
const HISTORIAL: Op[] = [
  sms('anterior', 'La Pizza', 20, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Restaurantes', aprobado: `${DIA_20}T09:30` },
  ...['Supermercado', 'Farmacia', ...OTRAS].flatMap((c, i): Op[] => [
    sms(`h${i}`, `Tienda ${c}`, 11 + i, `10:0${i}`),
    { op: 'OP-37', etiqueta: `h${i}`, categoria: c, aprobado: `${DIA_20}T10:3${i}` },
  ]),
];

async function preparar(estadoInicial: Op[], ahora = `${DIA_20}T20:00:00`): Promise<void> {
  fijarRelojServidor(`${ahora}-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-78',
    titulo: 'Semilla de FT-78, arrastre de la entrega 4',
    refs: [],
    hoy: DIA_20,
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
}

async function abrirBandeja(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
  await esperarHidratacion(page);
}

const fila = (page: Page, texto: string | RegExp): Locator =>
  page.locator('[data-movimiento]').filter({ hasText: texto });
const asa = (f: Locator): Locator => f.locator('[data-asa]');

test.describe('PRU-E2E-BAND arrastre de la entrega 4', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-701 [CA-E3-1] con teclado en 1440 px: Espacio toma la fila, Escape cancela y devuelve el foco al asa, y tomar, pasar sobre Farmacia y soltar deja el resultado en el lugar sin «Deshacer»', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'El asa con teclado es de computadora');
    await page.setViewportSize({ width: 1440, height: 900 });
    await preparar([...HISTORIAL, sms('nuevo', 'FARMACIA SAN NICOLAS', 12, '15:00')]);
    await abrirBandeja(page);
    const f = fila(page, 'FARMACIA SAN NICOLAS');
    const el = asa(f);
    await expect(el).toHaveCount(1);
    // El asa mide 44 × 44, está al final de la cabecera y su lugar existe en todas las filas
    const caja = await el.boundingBox();
    expect(caja?.width).toBeGreaterThanOrEqual(44);
    expect(caja?.height).toBeGreaterThanOrEqual(44);
    const region = page.locator('[role="status"][aria-live="assertive"]');
    const panel = page.locator('[data-panel-destinos]');

    // Con el foco del teclado la instrucción se ve en un globo debajo del asa
    await el.focus();
    await expect(f.locator('[data-instruccion-asa]')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(panel).toBeVisible();
    await expect(region).toHaveText(t.arrastre.tomaste('FARMACIA SAN NICOLAS'));
    // Escape cancela: no se envía nada, el panel se va y el foco vuelve al asa
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(el).toBeFocused();
    await expect(page.getByTestId('resultado')).toHaveCount(0);

    await page.keyboard.press('Space');
    await expect(panel).toBeVisible();
    const nombres = await page
      .locator('[data-panel-destinos] [data-destino]:visible')
      .allTextContents();
    const pasos = nombres.findIndex((n) => n.includes('Farmacia')) + 1;
    expect(pasos).toBeGreaterThan(0);
    for (let i = 0; i < pasos; i += 1) await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-destino][data-sobre]')).toContainText('Farmacia');
    await expect(region).toHaveText(t.arrastre.sobre('Farmacia'));
    await page.keyboard.press('Space');
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('FARMACIA SAN NICOLAS', '$12.00', 'T', 'Farmacia'),
    );
    await expect(page.getByRole('link', { name: t.verTransaccion })).toBeVisible();
    await expect(page.getByRole('button', { name: /Deshacer/ })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-702 [CA-E3-1] en 390 px la pulsación larga abre el panel con los siete destinos sin desplazar y la barra inferior inert; «Aprobar» y «Revisar» de un toque siguen igual', async ({
    page,
    hasTouch,
  }) => {
    test.skip(!hasTouch, 'La pulsación larga necesita una pantalla táctil');
    await page.setViewportSize({ width: 390, height: 844 });
    await preparar([
      ...HISTORIAL,
      sms('pizza', 'La Pizza', 18, '15:00'),
      sms('libre', 'Selectos', 35, '15:05'),
    ]);
    await abrirBandeja(page);
    const f = fila(page, 'La Pizza');
    // Sin asa visible: ni el icono ni el globo se ven; el área es la fila
    await expect(f.locator('[data-asa] svg')).toBeHidden();
    const el = asa(f);
    const caja = await el.boundingBox();
    if (caja === null) throw new Error('el área del asa no tiene caja');
    const x = caja.x + caja.width / 2;
    const y = caja.y + caja.height / 2;
    const antes = await page.evaluate(() => window.scrollY);
    const cdp = await page.context().newCDPSession(page);
    const toque = (type: 'touchStart' | 'touchEnd'): Promise<unknown> =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      });
    await toque('touchStart');
    const panel = page.locator('[data-panel-destinos]');
    await expect(panel).toBeVisible();
    // Los siete destinos entran sin desplazar: la sugerida, cinco frecuentes y «Otra categoría…»
    const destinos = panel.locator('[data-destino]');
    await expect(destinos).toHaveCount(7);
    for (const caja7 of await destinos.evaluateAll((es) =>
      es.map(
        (e) =>
          e.getBoundingClientRect().toJSON() as { top: number; bottom: number; height: number },
      ),
    )) {
      expect(caja7.top).toBeGreaterThanOrEqual(0);
      expect(caja7.bottom).toBeLessThanOrEqual(844);
      expect(caja7.height).toBeGreaterThanOrEqual(48);
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(antes);
    await expect(page.locator('[data-marco-barra]')).toHaveAttribute('inert', '');
    await toque('touchEnd');
    await expect(panel).toHaveCount(0);
    await expect(page.locator('[data-marco-barra]')).not.toHaveAttribute('inert', '');

    // «Aprobar» y «Revisar» de un toque siguen igual
    await expect(
      fila(page, 'Selectos').getByRole('link', { name: /Revisar|Elegir/ }),
    ).toBeVisible();
    await f.getByRole('button', { name: /^Aprobar/ }).click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('La Pizza', '$18.00', 'T', 'Restaurantes'),
    );
  });

  test('PRU-E2E-BAND-703 [CA-E6-7] con la línea cambiada en otra pestaña, soltar abre el flujo con el valor visto, el actual y «Usar el valor actual», con Farmacia puesta', async ({
    page,
    context,
    isMobile,
  }) => {
    test.skip(isMobile, 'El arrastre con el ratón es de computadora');
    await page.setViewportSize({ width: 1440, height: 900 });
    // Fecha en un período cerrado: guardar el cambio de la otra pestaña se detiene en la confirmación de AV-01
    await preparar([sms('cerrado', 'Selectos', 30, '19:00')], '2027-02-21T08:00:00');
    await abrirBandeja(page);
    const f = fila(page, 'Selectos');
    await expect(asa(f)).toHaveCount(1);

    const otra = await context.newPage();
    await otra.setViewportSize({ width: 1440, height: 900 });
    await otra.goto('/bandeja');
    await esperarContenido(otra);
    await fila(otra, 'Selectos').getByRole('link').first().click();
    await expect(otra.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    await elegirOpcion(otra, g.categoriaDeParte('1'), 'Supermercado');
    await otra.getByRole('button', { name: t.revisar.aprobar }).click();
    await expect(otra.getByRole('heading', { name: t.revisar.revisarImpacto })).toBeVisible();
    await otra.close();

    // La primera pestaña sigue con las líneas que vio: soltar sobre Farmacia abre el flujo con el conflicto
    const caja = await asa(f).boundingBox();
    if (caja === null) throw new Error('el asa no tiene caja');
    const x = caja.x + caja.width / 2;
    const y = caja.y + caja.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 12, y + 12, { steps: 4 });
    const destino = page
      .locator('[data-panel-destinos] [data-destino]')
      .filter({ hasText: 'Farmacia' })
      .first();
    await expect(destino).toBeVisible();
    const d = await destino.boundingBox();
    if (d === null) throw new Error('el destino no tiene caja');
    await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2, { steps: 8 });
    await page.mouse.up();

    await page.waitForURL(
      /\/bandeja\/[0-9a-f-]{36}\?traspaso=1&categoria=[0-9a-f-]{36}&conflicto=1/,
    );
    await expect(page.getByText(t.revisar.conflictoArrastre.titulo)).toBeVisible();
    await expect(
      page.getByText(
        t.revisar.conflictoArrastre.cambio(
          t.revisar.conflictoArrastre.sinCategoria,
          'Supermercado',
        ),
      ),
    ).toBeVisible();
    await expect(page.getByText(t.revisar.conflictoArrastre.elegido('Farmacia'))).toBeVisible();
    await expect(
      page.getByLabel(g.categoriaDeParte('1'), { exact: true }).locator('option:checked'),
    ).toHaveText('Farmacia');
    await page.getByRole('button', { name: formularios.usarValorActual }).click();
    await expect(page.getByRole('heading', { name: t.revisar.revisarImpacto })).toBeVisible();
  });
});
