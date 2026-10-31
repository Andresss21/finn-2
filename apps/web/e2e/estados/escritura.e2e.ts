// Patrón de escritura (05 §4, FE-07 a FE-12, FE-16) sobre el flujo de prueba `/pruebas/eco` (solo con FINN_ENTORNO=pruebas).
// El servidor de prueba guarda en memoria y se comparte entre pruebas: cada una mide diferencias, no valores absolutos.
import type { Page } from '@playwright/test';
import { expect, test } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';

const ECO = '/pruebas/eco';

interface Servidor {
  readonly guardados: number;
  readonly llamadas: number;
  readonly ids: string[];
  readonly ultimo: string;
}

/** Lo que el servidor guardó y recibió, leído con una petición aparte (la página no se refresca tras un error). */
async function servidor(page: Page): Promise<Servidor> {
  const html = await (await page.request.get(ECO)).text();
  const dato = (etiqueta: string): string =>
    new RegExp(etiqueta + ': ([^<]*)<').exec(html)?.[1] ?? '';
  return {
    guardados: Number(dato('Guardados')),
    llamadas: Number(dato('Llamadas')),
    ids: dato('Ids recibidos').split(',').filter(Boolean),
    ultimo: dato('Último'),
  };
}

async function abrir(page: Page, ruta = ECO): Promise<void> {
  await page.goto(ruta);
  // Hidratada: antes, el envío sería el nativo del navegador.
  await page.waitForFunction(() => 'next' in window && 'router' in (window.next as object));
  await page.evaluate(() => {
    (window as unknown as { marca?: string }).marca = 'sin-recargar';
  });
}

const marca = (page: Page): Promise<string | undefined> =>
  page.evaluate(() => (window as unknown as { marca?: string }).marca);

test.describe('PRU-E2E-TX', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-001 [V5-03] una Server Action de escritura actualiza la página sin recargarla, envía lo que vio el usuario y confirma por defecto', async ({
    page,
  }) => {
    await abrir(page);
    const { guardados: antes, ultimo: visto } = await servidor(page);
    await page.getByLabel('Texto').fill('uno');
    await page.getByRole('button', { name: 'Guardar' }).click();
    // FE-07: sin avisos "antes", un solo viaje y el servidor ya guardó; FE-09: `esperado` es lo que vio al abrir
    await expect(page.getByText(`Guardado: uno (esperado: ${visto})`)).toBeVisible();
    await expect(page.getByText(`Guardados: ${antes + 1}`)).toBeVisible();
    expect(await marca(page)).toBe('sin-recargar');

    // FE-09: la página trae props nuevas (textoVisto = 'uno'), pero el formulario conserva la copia de cuando abrió.
    await page.getByLabel('Texto').fill('dos');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText(`Guardado: dos (esperado: ${visto})`)).toBeVisible();
    await expect(page.getByText(`Guardados: ${antes + 2}`)).toBeVisible();

    // FE-16: el contrato de Zod impide enviar un texto vacío; no hay llamada.
    const llamadas = (await servidor(page)).llamadas;
    await page.getByLabel('Texto').fill('');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Escribí un texto.')).toBeVisible();
    expect((await servidor(page)).llamadas).toBe(llamadas);

    // FE-07: en la lista cerrada se previsualiza primero y confirma con la misma entrada.
    await abrir(page, `${ECO}?previa=1`);
    const guardados = (await servidor(page)).guardados;
    await page.getByLabel('Texto').fill('tres');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Revisá el impacto antes de confirmar.')).toBeVisible();
    expect((await servidor(page)).guardados).toBe(guardados);
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText(`Guardados: ${guardados + 1}`)).toBeVisible();
  });

  test('PRU-E2E-TX-002 [V5-04] tres envíos en el mismo ciclo hacen una sola llamada', async ({
    page,
  }) => {
    await abrir(page);
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST' && new URL(r.url()).pathname === ECO) posts.push(r.url());
    });
    const llamadas = (await servidor(page)).llamadas;
    const guardados = (await servidor(page)).guardados;
    await page.getByLabel('Texto').fill('doble');
    await page.getByRole('button', { name: 'Guardar' }).evaluate((boton) => {
      // Un doble toque y un Enter repetido: el estado de React aún no se repintó.
      (boton as HTMLButtonElement).click();
      (boton as HTMLButtonElement).click();
      (boton as HTMLButtonElement).click();
    });
    await expect(page.getByText(`Guardados: ${guardados + 1}`)).toBeVisible();
    expect(posts).toHaveLength(1);
    expect((await servidor(page)).llamadas).toBe(llamadas + 1);
  });

  test('PRU-E2E-TX-003 [V5-05] el id se conserva y hay un solo reintento automático', async ({
    page,
  }) => {
    await abrir(page);
    // FE-11: la respuesta se pierde después de que el servidor aplicó la operación (red caída a mitad de camino).
    let perdidas = 0;
    await page.route(`**${ECO}`, async (ruta) => {
      if (ruta.request().method() !== 'POST') return ruta.fallback();
      if (perdidas++ === 0) {
        await ruta.fetch();
        return ruta.abort('failed');
      }
      return ruta.fallback();
    });
    const llamadas = (await servidor(page)).llamadas;
    const guardados = (await servidor(page)).guardados;
    await page.getByLabel('Texto').fill('incierto');
    await page.getByRole('button', { name: 'Guardar' }).click();
    // FE-10: reintento automático inmediato con la misma entrada: el servidor responde `yaAplicada`.
    await expect(page.getByText('Ya estaba guardado')).toBeVisible();
    await expect(page.getByText(`Guardados: ${guardados + 1}`)).toBeVisible();
    expect((await servidor(page)).llamadas).toBe(llamadas + 2);
    const enviados = (await servidor(page)).ids.slice(-2);
    expect(enviados[0]).toBe(enviados[1]);

    // FE-10: `OCUPADO` se reintenta una vez; después, solo manual y con el mismo id.
    await page.getByLabel('Texto').fill('ocupado');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible({
      timeout: 15_000,
    });
    expect((await servidor(page)).llamadas).toBe(llamadas + 4);
    await page.getByRole('button', { name: 'Intentar de nuevo' }).click();
    await expect.poll(async () => (await servidor(page)).llamadas).toBe(llamadas + 5);
    const ocupados = (await servidor(page)).ids.slice(-3);
    expect(new Set(ocupados).size).toBe(1);
    expect(ocupados[0]).not.toBe(enviados[0]);
  });
});
