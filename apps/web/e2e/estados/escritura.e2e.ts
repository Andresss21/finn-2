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

  test('PRU-E2E-TX-004 [V5-07] router.refresh() conserva lo escrito y el borrador sobrevive a la recarga', async ({
    page,
  }) => {
    const clave = 'finn:borrador:v1:/pruebas/eco:';
    const guardado = (): Promise<string | null> =>
      page.evaluate((k) => window.sessionStorage.getItem(k), clave);
    await abrir(page);
    await page.getByLabel('Texto').fill('a medio escribir');
    // FE-14: se guarda 500 ms después del último cambio, en el sessionStorage de la pestaña
    await expect.poll(guardado).toContain('a medio escribir');
    const refresco = page.waitForResponse((r) => r.url().includes('_rsc'));
    await page.evaluate(() => {
      (window as unknown as { next: { router: { refresh: () => void } } }).next.router.refresh();
    });
    await refresco;
    await expect(page.getByLabel('Texto')).toHaveValue('a medio escribir');
    expect(await marca(page)).toBe('sin-recargar');

    // Recargar la página: el borrador se restaura y se avisa.
    await page.reload();
    await page.waitForFunction(() => 'next' in window && 'router' in (window.next as object));
    await expect(page.getByText('Recuperamos lo que estabas escribiendo')).toBeVisible();
    await expect(page.getByLabel('Texto')).toHaveValue('a medio escribir');

    // "Descartar borrador" lo borra y deja el formulario como estaba al abrir.
    await page.getByRole('button', { name: 'Descartar borrador' }).click();
    await expect(page.getByLabel('Texto')).toHaveValue('');
    await expect(page.getByText('Recuperamos lo que estabas escribiendo')).toBeHidden();
    expect(await guardado()).toBeNull();

    // Terminar con ok: true borra el borrador.
    const guardados = (await servidor(page)).guardados;
    await page.getByLabel('Texto').fill('terminado');
    await expect.poll(guardado).toContain('terminado');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText(`Guardados: ${guardados + 1}`)).toBeVisible();
    await expect.poll(guardado).toBeNull();
  });

  test('PRU-E2E-TX-005 [V5-08] la lectura interactiva descarta la respuesta vieja: "ab" lenta y "abc" son dos consultas y gana "abc"', async ({
    page,
  }) => {
    await abrir(page);
    let soltar = (): void => undefined;
    const retenida = new Promise<void>((listo) => {
      soltar = listo;
    });
    const cuerpos: string[] = [];
    await page.route(`**${ECO}`, async (ruta) => {
      if (ruta.request().method() !== 'POST') return ruta.fallback();
      const cuerpo = ruta.request().postData() ?? '';
      cuerpos.push(cuerpo);
      if (cuerpo.includes('"ab"')) await retenida; // la consulta "ab" tarda
      return ruta.fallback();
    });
    // Todo lo que muestra el párrafo de la lectura, en orden.
    await page.evaluate(() => {
      const w = window as unknown as { vistos: string[] };
      w.vistos = [];
      const parrafo = [...document.querySelectorAll('p')].find((p) =>
        p.textContent.startsWith('Lectura:'),
      );
      new MutationObserver(() => w.vistos.push(parrafo?.textContent ?? '')).observe(
        parrafo as Node,
        { childList: true, characterData: true, subtree: true },
      );
    });
    // FE-15: menos de 2 caracteres no consulta
    await page.getByLabel('Buscar').pressSequentially('a');
    await page.getByLabel('Buscar').pressSequentially('b');
    await expect.poll(() => cuerpos.length).toBe(1); // 300 ms después de la última pulsación
    await page.getByLabel('Buscar').pressSequentially('c'); // con "ab" todavía en vuelo
    soltar();
    await expect(page.getByText('Lectura: abc')).toBeVisible();
    expect(cuerpos).toHaveLength(2);
    expect(cuerpos[0]).toContain('"ab"');
    expect(cuerpos[1]).toContain('"abc"');
    const vistos = await page.evaluate(() => (window as unknown as { vistos: string[] }).vistos);
    expect(vistos).not.toContain('Lectura: ab');
  });
});

test.describe('PRU-E2E-PWA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-001 [V5-09] una pestaña con la versión anterior recibe "Hay una versión nueva", sin reintentar y con "Recargar"', async ({
    page,
  }) => {
    await abrir(page);
    // La pestaña vieja manda el id de una acción que la compilación nueva ya no tiene (409 de Next).
    await page.route(`**${ECO}`, async (ruta) => {
      if (ruta.request().method() !== 'POST') return ruta.fallback();
      return ruta.continue({
        headers: {
          ...ruta.request().headers(),
          'next-action': '400000000000000000000000000000000000000000',
        },
      });
    });
    await page.getByLabel('Texto').fill('desde la pestaña vieja');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(
      page.getByText('Hay una versión nueva de Finn. Recargá para continuar.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toBeHidden();
    await page.getByRole('button', { name: 'Recargar' }).click();
    await page.waitForFunction(
      () => (window as unknown as { marca?: string }).marca === undefined && 'next' in window,
    );
    await expect(page.getByLabel('Texto')).toBeVisible();
  });
});
