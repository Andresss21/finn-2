// FT-35, FT-37 y FT-38, Revisar movimiento: los estados con pantalla propia y el panel de computadora, portados del export de diseño (S4;
// CH-137; 07 §17: una pantalla o un flujo es una E2E). Mide lo que la persona ve: qué muestra cada estado, qué botones tiene el pie y
// qué tan grandes son. Los estados salen de operaciones reales de 01 §8 (DP-17) o del webhook real, y el reloj del servidor va fijo. Los
// números los pone el motor (PF-3); los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesWebhook } from '../../../src/textos/ajustes-webhook.ts';
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
// Ahorro con $500.00, la tarjeta T y Super con $50.00 en P1
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
];
// Una compra anterior en Super ya aprobada: los SMS siguientes de ese comercio traen la categoría sugerida y quedan listos
const HISTORIAL: Op[] = [
  sms('anterior', 'Super', 10, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Super', aprobado: `${DIA_20}T09:30` },
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

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-35E',
    titulo: 'Semilla de FT-35, estados de Revisar movimiento',
    refs: [],
    hoy: DIA_20,
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
}

const panel = (page: Page): Locator => page.locator('main[data-pagina-flujo]');
const filas = (page: Page): Locator => page.locator('[data-movimiento]');
const alto = async (l: Locator): Promise<number> => (await l.boundingBox())?.height ?? 0;
const esEscritorio = (page: Page): boolean => (page.viewportSize()?.width ?? 0) >= 1024;

/** Abre la revisión desde la fila de la lista que tenga ese texto. */
async function abrirDeLaLista(page: Page, texto: string | RegExp): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
  await filas(page).filter({ hasText: texto }).getByRole('link').first().click();
  await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
  await esperarHidratacion(page);
}

/** El token del webhook y un SMS crudo que Finn no lee: queda con error (BE-60). */
async function conSmsDelWebhook(
  page: Page,
  enviar: (token: string) => Promise<void>,
  vista: string,
): Promise<void> {
  await preparar([]);
  await page.goto('/ajustes/webhook');
  await esperarHidratacion(page);
  await page.getByRole('button', { name: ajustesWebhook.generar, exact: true }).click();
  const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
  await enviar(token);
  await expect(async () => {
    await page.goto('/bandeja');
    await esperarContenido(page);
    await expect(page.locator(`[data-vista="${vista}"]`)).toHaveCount(1);
  }).toPass();
}

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-200 [CA-37.3] un posible duplicado muestra el gasto igual en una tarjeta que enlaza a él, sin campos, con «Es otro gasto» como botón principal y «Es duplicado» tonal de al menos 44 px; «Es otro gasto» lo deja listo para aprobar', async ({
    page,
  }) => {
    await preparar([sms('a', 'Cafe Luna', 3.5, '10:15'), sms('b', 'Cafe Sol', 3.5, '10:17')]);
    await abrirDeLaLista(page, 'Cafe Sol');
    const p = panel(page);
    await expect(p.locator('[data-encabezado-movimiento]')).toContainText(
      cuentas.bandeja.estados.duplicado,
    );
    await expect(p).toContainText(t.revisar.igualDetalle);
    const tarjeta = p.getByRole('link', { name: /Cafe Luna/ });
    await expect(tarjeta).toHaveAttribute('href', /^\/bandeja\/[0-9a-f-]{36}$/);
    await expect(tarjeta).toContainText('−$3.50');
    expect(await alto(tarjeta)).toBeGreaterThanOrEqual(44);
    await expect(p.locator('select, input, [role=radiogroup]')).toHaveCount(0);
    await expect(p.getByRole('button', { name: cuentas.bandeja.descartar })).toHaveCount(0);
    const otro = p.getByRole('button', { name: cuentas.bandeja.esOtroGasto });
    const duplicado = p.getByRole('button', { name: t.esDuplicado });
    expect(await alto(otro)).toBeGreaterThanOrEqual(44);
    expect(await alto(duplicado)).toBeGreaterThanOrEqual(44);
    // El principal es el de relleno de acción; el tonal no lo es
    const fondo = (b: Locator) => b.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(await fondo(otro)).not.toBe(await fondo(duplicado));

    await otro.click();
    await expect(p.getByRole('button', { name: /^Aprobar/ })).toBeVisible();
    await expect(p.getByLabel(g.fecha, { exact: true })).toBeVisible();
  });

  test('PRU-E2E-BAND-201 [FT-38] un SMS no reconocido muestra el texto y el aviso sin campos, con «Registrar a mano» principal y «Descartar» tonales de al menos 44 px; «Registrar a mano» muestra los campos', async ({
    page,
    request,
  }) => {
    const texto = 'Compra rara que Finn no entiende';
    await conSmsDelWebhook(
      page,
      async (token) => {
        const r = await request.post('/api/sms', {
          headers: { authorization: `Bearer ${token}` },
          data: { texto, remitente: 'BAC' },
        });
        expect(r.status()).toBe(200);
      },
      'noReconocido',
    );
    await filas(page).getByRole('link', { name: cuentas.bandeja.registrarAMano }).click();
    const p = panel(page);
    await expect(p.getByText(texto, { exact: true })).toBeVisible();
    await expect(p).toContainText(t.revisar.noReconocido);
    await expect(p.locator('select, input, [role=radiogroup]')).toHaveCount(0);
    const aMano = p.getByRole('button', { name: cuentas.bandeja.registrarAMano });
    const descartar = p.getByRole('button', { name: cuentas.bandeja.descartar, exact: true });
    expect(await alto(aMano)).toBeGreaterThanOrEqual(44);
    expect(await alto(descartar)).toBeGreaterThanOrEqual(44);
    await expect(p.getByRole('button', { name: /^Aprobar/ })).toHaveCount(0);

    await esperarHidratacion(page);
    await aMano.click();
    await expect(p.getByRole('radiogroup', { name: t.revisar.tipo })).toBeVisible();
    await expect(p.getByRole('button', { name: /^Aprobar/ })).toBeVisible();
  });

  test('PRU-E2E-BAND-202 [CA-38.2] un SMS con error muestra su aviso, la referencia y la nota de Diagnóstico, con «Intentar de nuevo» principal; al reintentar, los campos parten de lo que se leyó', async ({
    page,
    request,
  }) => {
    const compra =
      'VISA 1234: has realizado una compra por USD 15.49 en el comercio Netflix 2027/02/20';
    await conSmsDelWebhook(
      page,
      async (token) => {
        const r = await request.post('/api/sms', {
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/octet-stream',
          },
          data: compra,
        });
        expect(r.status()).toBe(200);
      },
      'error',
    );
    await filas(page).getByRole('link', { name: cuentas.bandeja.revisar }).click();
    const p = panel(page);
    await expect(p.locator('[data-encabezado-movimiento]')).toContainText(
      cuentas.bandeja.estados.error,
    );
    await expect(p).toContainText(t.revisar.falloTitulo);
    await expect(p.getByTestId('referencia')).not.toBeEmpty();
    await expect(p).toContainText(t.revisar.referenciaNota);
    await expect(p.locator('select, input, [role=radiogroup]')).toHaveCount(0);
    const reintentar = p.getByRole('button', { name: cuentas.bandeja.intentarDeNuevo });
    expect(await alto(reintentar)).toBeGreaterThanOrEqual(44);
    await expect(
      p.getByRole('button', { name: cuentas.bandeja.descartar, exact: true }),
    ).toBeVisible();

    await esperarHidratacion(page);
    await reintentar.click();
    await expect(p.getByLabel(t.revisar.monto, { exact: true })).toHaveValue('15.49');
  });

  test('PRU-E2E-BAND-203 [FT-35] una coincidencia muestra la tabla Programada / Fecha esperada / Monto esperado y su pie trae «Confirmar» principal y «No es este pago» tonal de al menos 44 px, sin «Aprobar» ni «Descartar»', async ({
    page,
  }) => {
    await preparar([NETFLIX, sms('sms', 'Netflix', 15.49, '19:00')]);
    await abrirDeLaLista(page, 'Netflix');
    const p = panel(page);
    const tabla = p.locator('dl');
    await expect(tabla).toContainText(t.revisar.programada);
    await expect(tabla).toContainText('Netflix');
    await expect(tabla).toContainText(t.revisar.fechaEsperada);
    await expect(tabla).toContainText(t.revisar.montoEsperado);
    await expect(tabla).toContainText('$15.49');
    await expect(p).toContainText(t.revisar.coincidenciaNota);
    const confirmar = p.getByRole('button', { name: t.revisar.confirmarCoincidencia });
    const noEs = p.getByRole('button', { name: t.noEsEstePago });
    expect(await alto(confirmar)).toBeGreaterThanOrEqual(44);
    expect(await alto(noEs)).toBeGreaterThanOrEqual(44);
    await expect(p.getByRole('button', { name: /^Aprobar/ })).toHaveCount(0);
    await expect(p.getByRole('button', { name: cuentas.bandeja.descartar })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-204 [FT-35] un movimiento que ya se aprobó se abre con su estado, el SMS y sus datos en solo lectura, sin «Restaurar» y con «Volver a la Bandeja»', async ({
    page,
  }) => {
    await preparar([...HISTORIAL, sms('a', 'Super', 30, '10:15')]);
    await abrirDeLaLista(page, 'Super');
    const url = page.url();
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(page.getByTestId('resultado')).toContainText('$30.00');

    await page.goto(url);
    await esperarContenido(page);
    const p = panel(page);
    await expect(p.locator('[data-encabezado-movimiento]')).toContainText(t.aprobadoSinDatos);
    await expect(p).toContainText(t.revisar.aprobadoYa);
    await expect(p.getByRole('region', { name: t.revisar.soloLectura })).toContainText('$30.00');
    await expect(p.getByRole('region', { name: t.revisar.sms })).toBeVisible();
    await expect(p.getByRole('button', { name: t.restaurar })).toHaveCount(0);
    const volver = p.getByRole('link', { name: t.revisar.volver });
    await expect(volver).toHaveAttribute('href', '/bandeja');
    expect(await alto(volver)).toBeGreaterThanOrEqual(44);
  });

  test('PRU-E2E-BAND-205 [FT-37] un movimiento que ya se descartó se abre con su estado y «Restaurar» en el pie; «Restaurar» dice que se restauró', async ({
    page,
  }) => {
    await preparar([sms('a', 'Cafe Luna', 3.5, '10:15')]);
    await abrirDeLaLista(page, 'Cafe Luna');
    const url = page.url();
    await panel(page).getByRole('button', { name: cuentas.bandeja.descartar, exact: true }).click();
    await expect(page.getByTestId('resultado')).toContainText(t.descartaste('Cafe Luna $3.50'));

    await page.goto(url);
    await esperarContenido(page);
    await esperarHidratacion(page);
    const p = panel(page);
    await expect(p.locator('[data-encabezado-movimiento]')).toContainText(t.descartados.descartado);
    await expect(p).toContainText(t.revisar.descartadoYa);
    const restaurar = p.getByRole('button', { name: t.restaurar });
    expect(await alto(restaurar)).toBeGreaterThanOrEqual(44);
    await restaurar.click();
    await expect(p.getByTestId('resultado')).toContainText(t.restauraste('Cafe Luna $3.50'));
  });

  test('PRU-E2E-BAND-206 [CA-35.1] después de aprobar, el pie ofrece «Siguiente movimiento» con el que seguía en la lista', async ({
    page,
  }) => {
    await preparar([...HISTORIAL, sms('a', 'Super', 30, '10:15'), sms('b', 'Super', 20, '10:30')]);
    await page.goto('/bandeja');
    await esperarContenido(page);
    const primero = await filas(page).first().getByRole('link').getAttribute('href');
    const segundo = await filas(page).nth(1).getByRole('link').getAttribute('href');
    await page.goto(primero ?? '');
    await esperarHidratacion(page);
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    const siguiente = panel(page).getByRole('link', { name: t.revisar.siguiente });
    await expect(siguiente).toHaveAttribute('href', segundo ?? '');
    expect(await alto(siguiente)).toBeGreaterThanOrEqual(44);
    await siguiente.click();
    await expect(page).toHaveURL(segundo ?? '');
    await expect(panel(page).getByLabel(t.revisar.monto, { exact: true })).toBeVisible();
  });

  test('PRU-E2E-BAND-207 [FT-35] en computadora la lista queda a la izquierda con el movimiento marcado y el panel dice «1 de 2» con flechas de 44 px; en teléfono no hay lista ni flechas', async ({
    page,
  }) => {
    await preparar([...HISTORIAL, sms('a', 'Super', 30, '10:15'), sms('b', 'Super', 20, '10:30')]);
    await page.goto('/bandeja');
    await esperarContenido(page);
    const segundo = await filas(page).nth(1).getByRole('link').getAttribute('href');
    await filas(page).first().getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    const navegacion = page.locator('[data-panel-navegacion]');
    if (!esEscritorio(page)) {
      await expect(navegacion).toBeHidden();
      await expect(page.locator('[data-lista-lateral]')).toBeHidden();
      return;
    }
    await expect(page.locator('[data-lista-lateral]').locator('[data-movimiento]')).toHaveCount(2);
    await expect(
      page.locator('[data-lista-lateral] [aria-current=true] [data-movimiento]'),
    ).toHaveCount(1);
    await expect(navegacion).toContainText(t.revisar.panel.posicion(1, 2));
    const anterior = navegacion.getByRole('button', { name: t.revisar.panel.anterior });
    await expect(anterior).toBeDisabled();
    const siguiente = navegacion.getByRole('link', { name: t.revisar.panel.siguiente });
    await expect(siguiente).toHaveAttribute('href', segundo ?? '');
    const caja = await siguiente.boundingBox();
    expect(Math.min(caja?.width ?? 0, caja?.height ?? 0)).toBeGreaterThanOrEqual(44);
    await siguiente.click();
    await expect(navegacion).toContainText(t.revisar.panel.posicion(2, 2));
  });

  test('PRU-E2E-BAND-208 [FT-37] después de descartar, el panel ofrece «Siguiente movimiento» con el que seguía en la lista', async ({
    page,
  }) => {
    await preparar([...HISTORIAL, sms('a', 'Super', 30, '10:15'), sms('b', 'Super', 20, '10:30')]);
    await page.goto('/bandeja');
    await esperarContenido(page);
    const primero = await filas(page).first().getByRole('link').getAttribute('href');
    const segundo = await filas(page).nth(1).getByRole('link').getAttribute('href');
    await page.goto(primero ?? '');
    await esperarHidratacion(page);
    await panel(page).getByRole('button', { name: cuentas.bandeja.descartar }).click();
    const siguiente = panel(page).getByRole('link', { name: t.revisar.siguiente });
    await expect(siguiente).toHaveAttribute('href', segundo ?? '');
    expect(await alto(siguiente)).toBeGreaterThanOrEqual(44);
  });

  test('PRU-E2E-BAND-450 [FT-35] en 1440 × 900 la fila elegida lleva el fondo hundido y la marca de 3 px en acción, y el panel de Revisar queda fijo al desplazar la lista', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const muchos = Array.from({ length: 12 }, (_, i) =>
      sms(`m${String(i)}`, `Comercio ${String(i)}`, 10 + i, `10:${String(10 + i)}`),
    );
    await preparar([...HISTORIAL, ...muchos]);
    await page.goto('/bandeja');
    await esperarContenido(page);
    const primero = await filas(page).first().getByRole('link').first().getAttribute('href');
    await page.goto(primero ?? '');
    await esperarContenido(page);
    const elegida = page.locator('[data-lista-lateral] [data-fila-elegida]');
    await expect(elegida).toHaveCount(1);
    const marca = await elegida.evaluate((el) => {
      const antes = getComputedStyle(el, '::before');
      const probe = document.createElement('span');
      probe.style.color = 'var(--accion)';
      document.body.append(probe);
      const accion = getComputedStyle(probe).color;
      probe.remove();
      return { ancho: antes.width, color: antes.backgroundColor, accion };
    });
    expect(marca.ancho).toBe('3px');
    expect(marca.color).toBe(marca.accion);
    const arriba = (await panel(page).boundingBox())?.y ?? 0;
    await page.mouse.wheel(0, 700);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    const despues = (await panel(page).boundingBox())?.y ?? -1;
    expect(despues).toBeGreaterThanOrEqual(0);
    expect(despues).toBeLessThanOrEqual(Math.max(arriba, 32));
    await expect(panel(page)).toBeInViewport();
  });
});
