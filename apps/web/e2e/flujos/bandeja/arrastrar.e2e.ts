// FT-78 Arrastrar un movimiento a una categoría, trozo 1 (06 §2.5; 05 §4.15; FD-30; 07 §17: una pantalla o un flujo es una E2E).
// Cada prueba parte de una base sembrada con operaciones reales de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y arrastra
// como la persona: con el ratón, con una pulsación larga o con el teclado. Los números los pone el motor (PF-3); los textos
// salen del catálogo (FE-51). Las pruebas del ratón y del teclado corren en los proyectos de escritorio y de teléfono; la
// pulsación larga necesita una pantalla táctil.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { generarTokenWebhook } from '../../ayudas/webhook.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
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
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-07', categoria: 'Restaurantes' },
  { op: 'OP-07', categoria: 'Farmacia' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Supermercado', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Restaurantes', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Farmacia', monto: 100, periodo: 'P1' },
];
// Una compra anterior en Restaurantes ya aprobada: el SMS siguiente del mismo comercio trae esa categoría sugerida
const HISTORIAL: Op[] = [
  sms('anterior', 'La Pizza', 20, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Restaurantes', aprobado: `${DIA_20}T09:30` },
  sms('botica', 'Botica', 9, '09:10'),
  { op: 'OP-37', etiqueta: 'botica', categoria: 'Farmacia', aprobado: `${DIA_20}T09:40` },
];

async function preparar(estadoInicial: Op[], ahora = `${DIA_20}T20:00:00`): Promise<void> {
  fijarRelojServidor(`${ahora}-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-78',
    titulo: 'Semilla de FT-78, arrastrar a una categoría',
    refs: [],
    hoy: DIA_20,
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
}

/** Abre `/bandeja` y espera a que la librería de arrastre haya llegado: el asa aparece después de hidratar (V6-08). */
async function abrirBandeja(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
  await esperarHidratacion(page);
}

const fila = (page: Page, texto: string | RegExp): Locator =>
  page.locator('[data-movimiento]').filter({ hasText: texto });
const asa = (f: Locator): Locator => f.locator('[data-asa]');
const destino = (page: Page, categoria: string): Locator =>
  page.locator('[data-panel-destinos] [data-destino]').filter({ hasText: categoria }).first();

/** Arrastra con el ratón: el asa se mueve más de 6 px y se suelta sobre el destino. */
async function arrastrarAl(page: Page, origen: Locator, categoria: string): Promise<void> {
  await expect(origen).toBeVisible();
  const caja = await origen.boundingBox();
  if (caja === null) throw new Error('el asa no tiene caja');
  const x = caja.x + caja.width / 2;
  const y = caja.y + caja.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 12, y + 12, { steps: 4 });
  const sobre = destino(page, categoria);
  await expect(sobre).toBeVisible();
  const d = await sobre.boundingBox();
  if (d === null) throw new Error('el destino no tiene caja');
  await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2, { steps: 8 });
  await page.mouse.up();
}

/** Empieza un arrastre con el ratón y lo deja en curso, sobre el panel de destinos, sin soltar. */
async function empezarArrastre(page: Page, origen: Locator): Promise<{ x: number; y: number }> {
  await expect(origen).toBeVisible();
  const caja = await origen.boundingBox();
  if (caja === null) throw new Error('el asa no tiene caja');
  const x = caja.x + caja.width / 2;
  const y = caja.y + caja.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 12, y + 12, { steps: 4 });
  await expect(page.locator('[data-panel-destinos]')).toBeVisible();
  return { x, y };
}

/** Las llamadas de escritura (Server Actions) que sale de la página. */
function contarEscrituras(page: Page): string[] {
  const llamadas: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.headers()['next-action'] !== undefined)
      llamadas.push(r.postData() ?? '');
  });
  return llamadas;
}

// Más categorías, cada una con un gasto aprobado antes, para que el panel tenga de dónde sacar las frecuentes
const OTRAS = ['Mascota', 'Transporte', 'Hogar', 'Ropa'];
const MAS_CATEGORIAS: Op[] = OTRAS.flatMap((c): Op[] => [
  { op: 'OP-07', categoria: c },
  { op: 'OP-14', categoria: c, monto: 50, periodo: 'P1' },
]);
const HISTORIAL_AMPLIO: Op[] = [
  ...HISTORIAL,
  ...['Supermercado', ...OTRAS].flatMap((c, i): Op[] => [
    sms(`h${i}`, `Tienda ${c}`, 11 + i, `10:0${i}`),
    { op: 'OP-37', etiqueta: `h${i}`, categoria: c, aprobado: `${DIA_20}T10:3${i}` },
  ]),
];

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-001 [V6-08, CA-78.13] con la librería de arrastre sin cargar, la fila no tiene asa y los botones funcionan; con ella cargada, el asa aparece sin quitar «Aprobar»', async ({
    page,
  }) => {
    await preparar([...HISTORIAL, sms('pizza', 'La Pizza', 18, '15:00')]);
    // El trozo con la librería se reconoce por el texto de su región en vivo; sin él no hay asa (Estados, FT-78)
    let bloquear = true;
    await page.route('**/_next/static/chunks/**', async (ruta) => {
      const respuesta = await ruta.fetch();
      const cuerpo = await respuesta.text();
      if (bloquear && cuerpo.includes('DndDescribedBy')) await ruta.abort();
      else await ruta.fulfill({ response: respuesta, body: cuerpo });
    });
    await abrirBandeja(page);
    const f = fila(page, 'La Pizza');
    await expect(f).toBeVisible();
    await expect(asa(f)).toHaveCount(0);
    await expect(f.getByRole('button', { name: /^Aprobar/ })).toBeVisible();

    bloquear = false;
    await abrirBandeja(page);
    await expect(asa(f)).toHaveCount(1);
    await expect(f.getByRole('button', { name: /^Aprobar/ })).toBeVisible();
    await f.getByRole('button', { name: /^Aprobar/ }).click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('La Pizza', '$18.00', 'T', 'Restaurantes'),
    );
  });

  test('PRU-E2E-BAND-220 [CA-78.1] un gasto pendiente de $35.00 sin líneas, arrastrado con el ratón y soltado sobre Supermercado, se aprueba en una sola operación y la fila dice «Aprobado: … · Supermercado» con «Ver transacción» y sin «Deshacer»', async ({
    page,
  }) => {
    await preparar([sms('nuevo', 'Selectos', 35, '15:00')]);
    await abrirBandeja(page);
    const f = fila(page, 'Selectos');
    await expect(asa(f)).toHaveAccessibleName(t.arrastre.asa('Selectos $35.00'));

    const llamadas: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST' && r.headers()['next-action'] !== undefined)
        llamadas.push(r.postData() ?? '');
    });
    await arrastrarAl(page, asa(f), 'Supermercado');

    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('Selectos', '$35.00', 'T', 'Supermercado'),
    );
    await expect(page.getByRole('link', { name: t.verTransaccion })).toBeVisible();
    await expect(page.getByRole('button', { name: /Deshacer/ })).toHaveCount(0);
    // Una sola llamada de escritura, con la variante { categoriaId }
    const escrituras = llamadas.filter((c) => c.includes('categoriaId'));
    expect(escrituras).toHaveLength(1);
    expect(llamadas.filter((c) => c.includes('movimientoId'))).toHaveLength(1);
  });

  test('PRU-E2E-BAND-221 [CA-78.2] un gasto con una línea sugerida a Restaurantes, soltado sobre Farmacia, queda con una sola línea a Farmacia: Restaurantes no recibe nada y Farmacia gasta el monto', async ({
    page,
  }) => {
    await preparar([...HISTORIAL, sms('pizza', 'La Pizza', 18, '15:00')]);
    await abrirBandeja(page);
    const f = fila(page, 'La Pizza');
    await expect(f).toContainText('→ Restaurantes');

    await arrastrarAl(page, asa(f), 'Farmacia');
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('La Pizza', '$18.00', 'T', 'Farmacia'),
    );
    // La transacción tiene una sola línea, a Farmacia: lo muestra su detalle
    await page.getByRole('link', { name: t.verTransaccion }).click();
    await esperarContenido(page);
    await expect(page.locator('main')).toContainText('Farmacia');
    await expect(page.locator('main')).not.toContainText('Dividido');
  });

  test('PRU-E2E-BAND-222 [CA-78.4] un movimiento con coincidencia o un posible duplicado no tiene asa de arrastre; el que se puede arrastrar sí', async ({
    page,
  }) => {
    await preparar([
      {
        op: 'OP-42',
        etiqueta: 'Netflix',
        cuenta: 'T',
        comercio: 'Netflix',
        monto: 15.49,
        categoria: 'Farmacia',
        primeraFecha: DIA_20,
      },
      sms('netflix', 'Netflix', 15.49, '10:00'),
      sms('a', 'Cafe Luna', 3.5, '10:15'),
      sms('b', 'Cafe Sol', 3.5, '10:17'),
      sms('libre', 'Selectos', 35, '15:00'),
    ]);
    await abrirBandeja(page);
    await expect(page.locator('[data-vista="coincidencia"]')).toHaveCount(1);
    await expect(page.locator('[data-vista="duplicado"]')).toHaveCount(1);
    await expect(asa(page.locator('[data-vista="coincidencia"]'))).toHaveCount(0);
    await expect(asa(page.locator('[data-vista="duplicado"]'))).toHaveCount(0);
    await expect(asa(fila(page, 'Selectos'))).toHaveCount(1);
  });

  test('PRU-E2E-BAND-223 [CA-78.5, AV-01] un gasto con fecha en un período cerrado, soltado sobre Supermercado, abre la revisión con la confirmación de AV-01 y, al confirmar, se aprueba en Supermercado con el mismo movimiento', async ({
    page,
  }) => {
    await preparar([sms('cerrado', 'Selectos', 30, '19:00')], '2027-02-21T08:00:00');
    await abrirBandeja(page);
    await arrastrarAl(page, asa(fila(page, 'Selectos')), 'Supermercado');

    await page.waitForURL(/\/bandeja\/[0-9a-f-]{36}\?traspaso=1&categoria=[0-9a-f-]{36}/);
    await expect(page.getByRole('heading', { name: t.revisar.revisarImpacto })).toBeVisible();
    await expect(page.getByText(g.avisoPeriodoCerrado)).toBeVisible();
    // «Volver a editar» deja la categoría soltada en la línea
    await page.getByRole('button', { name: g.volverAEditar }).click();
    await expect(page.getByLabel(g.categoriaDeParte('1'), { exact: true })).toHaveValue(/.+/);
    await expect(
      page.getByLabel(g.categoriaDeParte('1'), { exact: true }).locator('option:checked'),
    ).toHaveText('Supermercado');
    await page.getByRole('button', { name: t.revisar.aprobar }).click();
    await expect(page.getByRole('heading', { name: t.revisar.revisarImpacto })).toBeVisible();
    await page.getByRole('button', { name: g.confirmar }).click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('Selectos', '$30.00', 'T', 'Supermercado'),
    );
  });

  test('PRU-E2E-BAND-224 [CA-78.6] un gasto sin cuenta soltado sobre una categoría abre el flujo con la categoría puesta y el mensaje «Elegí la cuenta de este movimiento.»', async ({
    page,
    request,
  }) => {
    // Un SMS de una tarjeta que Finn no conoce llega por el webhook real y queda sin cuenta (OP-35, paso 4)
    await preparar([]);
    await page.goto('/ajustes/webhook');
    await esperarHidratacion(page);
    await generarTokenWebhook(page);
    const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
    const respuesta = await request.post('/api/sms', {
      headers: { authorization: `Bearer ${token}` },
      data: {
        texto: `VISA 9999: has realizado una compra por USD 35.00 en el comercio Selectos ${DIA_20.replaceAll('-', '/')}`,
        remitente: 'BAC',
      },
    });
    expect(respuesta.status()).toBe(200);
    await expect(async () => {
      await abrirBandeja(page);
      await expect(fila(page, 'Selectos')).toHaveCount(1);
    }).toPass();
    await arrastrarAl(page, asa(fila(page, 'Selectos')), 'Supermercado');

    await page.waitForURL(/\/bandeja\/[0-9a-f-]{36}\?traspaso=1&categoria=/);
    await expect(page.getByText('Elegí la cuenta de este movimiento.')).toBeVisible();
    await expect(
      page.getByLabel(g.categoriaDeParte('1'), { exact: true }).locator('option:checked'),
    ).toHaveText('Supermercado');
    // Con la cuenta elegida, «Aprobar» guarda la categoría y aprueba por el camino normal de FT-35
    await elegirOpcion(page, g.cuenta, 'T');
    await page.getByRole('button', { name: /^Aprobar/ }).click();
    await expect(page.getByTestId('resultado')).toContainText('Supermercado');
  });

  test('PRU-E2E-BAND-225 [CA-78.7] en el teléfono, deslizar la fila 60 px en menos de 350 ms no empieza ningún arrastre; una pulsación de 350 ms o más sobre el asa muestra el panel de destinos', async ({
    page,
    hasTouch,
  }) => {
    test.skip(!hasTouch, 'La pulsación larga necesita una pantalla táctil');
    await preparar([sms('nuevo', 'Selectos', 35, '15:00')]);
    await abrirBandeja(page);
    const el = asa(fila(page, 'Selectos'));
    await expect(el).toBeVisible();
    const caja = await el.boundingBox();
    if (caja === null) throw new Error('el asa no tiene caja');
    const x = caja.x + caja.width / 2;
    const y = caja.y + caja.height / 2;
    const cdp = await page.context().newCDPSession(page);
    const toque = (type: 'touchStart' | 'touchMove' | 'touchEnd', py: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y: py }],
      });

    // Un deslizamiento de 60 px antes de los 350 ms: desplaza la lista y no arrastra
    await toque('touchStart', y);
    await toque('touchMove', y - 30);
    await toque('touchMove', y - 60);
    await toque('touchEnd', y - 60);
    await expect(page.locator('[data-panel-destinos]')).toHaveCount(0);

    // Una pulsación que se sostiene: aparece el panel
    await toque('touchStart', y);
    await expect(page.locator('[data-panel-destinos]')).toBeVisible();
    await toque('touchEnd', y);
  });

  test('PRU-E2E-BAND-226 [CA-78.8] con el teclado: Espacio sobre el asa, las flechas hasta Supermercado y Espacio aprueban el movimiento, y los anuncios se leen en la región de estado', async ({
    page,
  }) => {
    await preparar([sms('nuevo', 'Selectos', 35, '15:00')]);
    await abrirBandeja(page);
    const el = asa(fila(page, 'Selectos'));
    await expect(el).toBeVisible();
    await el.focus();
    const region = page.locator('[role="status"][aria-live="assertive"]');

    await page.keyboard.press('Space');
    await expect(page.locator('[data-panel-destinos]')).toBeVisible();
    await expect(region).toHaveText(t.arrastre.tomaste('Selectos'));
    // El panel lista, en el orden de la pantalla, las categorías normales; se baja hasta Supermercado
    const nombres = await page
      .locator('[data-panel-destinos] [data-destino]:visible')
      .allTextContents();
    const pasos = nombres.indexOf('Supermercado') + 1;
    expect(pasos).toBeGreaterThan(0);
    for (let i = 0; i < pasos; i += 1) await page.keyboard.press('ArrowDown');
    await expect(region).toHaveText(t.arrastre.sobre('Supermercado'));
    await page.keyboard.press('Space');
    await expect(region).toHaveText(t.arrastre.soltaste('Selectos', 'Supermercado'));

    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('Selectos', '$35.00', 'T', 'Supermercado'),
    );
    await expect(page.getByRole('button', { name: cuentas.bandeja.aprobar })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-227 [CA-78.9] con un arrastre en curso, Escape o soltar fuera del panel no envía ninguna operación y la fila queda como estaba', async ({
    page,
  }) => {
    await preparar([sms('nuevo', 'Selectos', 35, '15:00')]);
    await abrirBandeja(page);
    const f = fila(page, 'Selectos');
    const llamadas = contarEscrituras(page);
    const panel = page.locator('[data-panel-destinos]');

    // Escape cancela y el panel se va
    await empezarArrastre(page, asa(f));
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await page.mouse.up();

    // Soltar fuera del panel (la esquina superior izquierda) también cancela
    await empezarArrastre(page, asa(f));
    await page.mouse.move(2, 2, { steps: 6 });
    await page.mouse.up();
    await expect(panel).toHaveCount(0);

    expect(llamadas).toHaveLength(0);
    await expect(page.getByTestId('resultado')).toHaveCount(0);
    await expect(f).toBeVisible();
    await expect(asa(f)).toHaveCount(1);
    // Sin categoría la fila no trae «Aprobar»: su enlace a la revisión sigue ahí (WCAG 2.5.7)
    await expect(f.getByRole('link')).toBeVisible();
  });

  test('PRU-E2E-BAND-228 [CA-78.10] el panel de destinos muestra primero «Sugerida: Restaurantes», después hasta 5 frecuentes distintas de la sugerida y al final «Otra categoría…»', async ({
    page,
  }) => {
    await preparar([...MAS_CATEGORIAS, ...HISTORIAL_AMPLIO, sms('pizza', 'La Pizza', 18, '15:00')]);
    await abrirBandeja(page);
    await empezarArrastre(page, asa(fila(page, 'La Pizza')));

    const textos = await page.locator('[data-panel-destinos] > ul > li').allTextContents();
    expect(textos[0]).toBe(t.arrastre.sugerida('Restaurantes'));
    expect(textos.at(-1)).toBe(t.arrastre.otra);
    const frecuentes = textos.slice(1, -1);
    expect(frecuentes).toHaveLength(5);
    expect(new Set(frecuentes).size).toBe(5);
    expect(frecuentes).not.toContain('Restaurantes');
    await page.keyboard.press('Escape');
    await page.mouse.up();
  });

  test('PRU-E2E-BAND-229 [CA-78.11] soltar sobre «Otra categoría…» termina el arrastre sin aprobar y abre el selector; elegir Mascota aprueba el movimiento en Mascota sin volver a arrastrar', async ({
    page,
  }) => {
    await preparar([...MAS_CATEGORIAS, sms('nuevo', 'Selectos', 35, '15:00')]);
    await abrirBandeja(page);
    const llamadas = contarEscrituras(page);

    await arrastrarAl(page, asa(fila(page, 'Selectos')), t.arrastre.otra);
    await expect(page.locator('[data-panel-destinos]')).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: t.arrastre.selector.titulo })).toBeVisible();
    expect(llamadas).toHaveLength(0);
    await expect(page.getByTestId('resultado')).toHaveCount(0);

    await elegirOpcion(page, t.arrastre.selector.etiqueta, 'Mascota');
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('Selectos', '$35.00', 'T', 'Mascota'),
    );
    expect(llamadas.filter((c) => c.includes('categoriaId'))).toHaveLength(1);
  });

  test('PRU-E2E-BAND-230 [CA-78.14] con dos pestañas, si una edita las líneas del movimiento y la otra lo suelta sobre una categoría, la segunda responde conflicto_desactualizado y la fila lo dice', async ({
    page,
    context,
  }) => {
    // Fecha en un período cerrado: aprobar con cambios guarda la edición y se detiene en la confirmación de AV-01
    await preparar([sms('cerrado', 'Selectos', 30, '19:00')], '2027-02-21T08:00:00');
    await abrirBandeja(page);
    const f = fila(page, 'Selectos');
    await expect(asa(f)).toHaveCount(1);

    const otra = await context.newPage();
    await otra.goto('/bandeja');
    await esperarContenido(otra);
    await fila(otra, 'Selectos').getByRole('link').click();
    await expect(otra.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    await elegirOpcion(otra, g.categoriaDeParte('1'), 'Farmacia');
    await otra.getByRole('button', { name: t.revisar.aprobar }).click();
    await expect(otra.getByRole('heading', { name: t.revisar.revisarImpacto })).toBeVisible();
    await otra.close();

    // La primera pestaña sigue con las líneas que vio: soltar lo rechaza y la fila lo dice, sin traspaso
    await arrastrarAl(page, asa(f), 'Supermercado');
    await expect(page.getByText(/cambió mientras lo editabas/)).toBeVisible();
    await expect(page).toHaveURL(/\/bandeja$/);
    await expect(page.getByTestId('resultado')).toHaveCount(0);
  });
});
