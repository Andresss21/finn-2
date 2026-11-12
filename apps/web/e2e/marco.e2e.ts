// El marco portado del export de diseño (CH-109; 06-identidad-visual §3; export K1 y entrega 2): título de la pantalla en la
// barra del teléfono, pantalla hija con «Volver», flujo largo a pantalla completa, contenido de computadora alineado a la
// izquierda con el título de 2.5 rem, y la ruta que no existe en español. Corre en `movil` y `escritorio`: la forma cambia
// y el contenido no (N6).
import type { Page } from '@playwright/test';
import { entrarAal2 } from './ayudas/sesion.ts';
import { revisarAccesibilidad } from './ayudas/accesibilidad.ts';
import { esperarContenido } from './ayudas/esperas.ts';
import { expect, sembrar, test } from './configuracion/semilla.ts';
import { fijarRelojServidor } from '../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario } from '../../../packages/dominio/escenarios/tipos.ts';
import { estados, navegacion } from '../src/textos/index.ts';

const ANCHO_ESCRITORIO = 1024;
const HOY = '2027-02-10';

async function sembrarBase(): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-MARCO',
    titulo: 'Semilla del marco',
    refs: [],
    hoy: HOY,
    estadoInicial: [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-07', categoria: 'Super' },
    ],
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const enEscritorio = (page: Page): boolean => (page.viewportSize()?.width ?? 0) >= ANCHO_ESCRITORIO;
const titulo = (page: Page) => page.getByRole('heading', { level: 1 });
const barra = (page: Page) => page.locator('header[data-marco-barra]');
const estilo = (page: Page, selector: string, propiedad: string) =>
  page.locator(selector).evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), propiedad);

test.describe('PRU-E2E-PWA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-180 [] en teléfono el título va en la barra (sin el logotipo), la pantalla hija lleva «Volver» y el flujo largo va sin barras; en computadora el contenido se alinea a la izquierda con padding 32 48 48 y el título mide 2.5 rem', async ({
    page,
  }) => {
    await sembrarBase();
    await abrir(page, '/presupuesto');
    await expect(titulo(page)).toHaveText(navegacion.secciones.presupuesto);
    await expect(barra(page)).not.toContainText(navegacion.marca);

    if (enEscritorio(page)) {
      expect(await estilo(page, '#contenido > main', 'padding')).toBe('32px 48px 48px');
      expect(await estilo(page, '#contenido > main', 'margin-left')).toBe('0px');
      expect(await estilo(page, '#contenido h1', 'font-size')).toBe('40px');
    } else {
      // El h1 de la pantalla se dibuja dentro de la barra fija de 60 px, a la izquierda de Registrar.
      const caja = await titulo(page).boundingBox();
      const registrar = await barra(page)
        .getByRole('link', { name: navegacion.registrar })
        .boundingBox();
      expect(caja === null || registrar === null).toBe(false);
      expect((caja?.y ?? 99) + (caja?.height ?? 99)).toBeLessThanOrEqual(60);
      expect((caja?.x ?? 0) + (caja?.width ?? 0)).toBeLessThanOrEqual(registrar?.x ?? 0);
      expect(await estilo(page, '#contenido h1', 'font-size')).toBe('32px');
      // Zona segura de la barra inferior (6 4 22).
      expect(await estilo(page, 'nav[data-marco-barra]', 'padding-bottom')).toBe('22px');
    }

    // Pantalla hija: en teléfono, «Volver a Presupuesto» de 44 px en la barra y el título de 1.625 rem.
    const id = await page
      .locator('[data-fila-categoria]')
      .first()
      .getAttribute('data-fila-categoria');
    await abrir(page, `/presupuesto/categorias/${id ?? ''}`);
    await expect(titulo(page)).toHaveText('Super');
    const volver = barra(page).getByRole('link', { name: 'Volver a Presupuesto', exact: true });
    if (enEscritorio(page)) await expect(volver).toBeHidden();
    else {
      await expect(volver).toBeVisible();
      expect(await volver.boundingBox()).toMatchObject({ width: 44, height: 44 });
      expect(await estilo(page, '#contenido h1', 'font-size')).toBe('26px');
      await expect(barra(page).getByRole('link', { name: navegacion.registrar })).toHaveCount(0);
    }

    // Flujo largo: en teléfono, pantalla completa con «Cerrar» y sin la barra superior ni la inferior.
    await abrir(page, '/registrar/gasto');
    const nav = page.getByRole('navigation', { name: navegacion.principal });
    await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
    if (enEscritorio(page)) await expect(nav).toBeVisible();
    else {
      await expect(nav).toBeHidden();
      await expect(barra(page)).toBeHidden();
    }
    await revisarAccesibilidad(page);
  });

  test('PRU-E2E-PWA-181 [] una ruta que no existe muestra «Esto ya no existe.» en español con el glifo de búsqueda y el enlace a Inicio, y la campana abre su panel sobre la pantalla (la ruta interceptada /notificaciones)', async ({
    page,
  }) => {
    await page.goto('/una-ruta-que-no-existe');
    await expect(page.getByRole('heading', { name: estados.noExisteTitulo })).toBeVisible();
    await expect(page.getByText('This page could not be found')).toHaveCount(0);
    await expect(page.locator('[data-glifo="search"]')).toBeVisible();
    await expect(
      page.getByRole('link', { name: estados.irA(navegacion.secciones.inicio) }),
    ).toHaveAttribute('href', '/');
    await revisarAccesibilidad(page);

    await sembrarBase();
    await abrir(page, '/presupuesto');
    const campana = barra(page).getByRole('link', { name: /^Notificaciones/ });
    await campana.click();
    await expect(
      page.getByRole('dialog', { name: navegacion.secciones.notificaciones }),
    ).toBeVisible();
    await expect(page).toHaveURL('/notificaciones');
  });

  test('PRU-E2E-PWA-300 [] en 1440 × 900 el contenido mide como máximo 1144 px y un flujo y la lista de Ajustes, 720; con 860 px de contenedor las dos columnas de Inicio pasan a una', async ({
    page,
  }) => {
    await sembrarBase();
    await page.setViewportSize({ width: 1440, height: 900 });
    const ancho = async (ruta: string): Promise<number> => {
      await abrir(page, ruta);
      return (await page.locator('#contenido > main').boundingBox())?.width ?? 0;
    };
    expect(await ancho('/presupuesto')).toBeLessThanOrEqual(1144);
    expect(await ancho('/cuentas/nueva')).toBeLessThanOrEqual(720);
    expect(await ancho('/ajustes')).toBeLessThanOrEqual(720);
    expect(await ancho('/ajustes')).toBeGreaterThan(600);

    // Inicio: dos columnas a 1440; con 860 px de contenedor (ventana − 248 de la barra lateral) una sola.
    const columnas = async (): Promise<number> =>
      page
        .locator('#contenido > main')
        .evaluate((m) => getComputedStyle(m).gridTemplateColumns.split(' ').length);
    await abrir(page, '/');
    expect(await columnas()).toBe(2);
    await page.setViewportSize({ width: 860 + 248, height: 900 });
    expect(await columnas()).toBe(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test('PRU-E2E-PWA-301 [] en 390 × 844, Programadas, Reglas y Ajustes llevan la campana y no Registrar ni ☰; Presupuesto conserva los tres y el título no lleva puntos suspensivos', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'movil', 'mide la barra del teléfono');
    await sembrarBase();
    await page.setViewportSize({ width: 390, height: 844 });
    const campana = barra(page).getByRole('link', { name: /^Notificaciones/ });
    const registrar = barra(page).getByRole('link', { name: navegacion.registrar });
    const menu = barra(page).getByRole('button', { name: navegacion.secundarias });
    const sinPuntos = async (): Promise<boolean> =>
      titulo(page).evaluate((h) => h.scrollWidth <= h.clientWidth);
    for (const ruta of ['/programadas', '/reglas', '/ajustes']) {
      await abrir(page, ruta);
      await expect(campana).toBeVisible();
      await expect(registrar).toHaveCount(0);
      await expect(menu).toHaveCount(0);
      expect(await sinPuntos()).toBe(true);
    }
    await abrir(page, '/presupuesto');
    await expect(campana).toBeVisible();
    await expect(menu).toBeVisible();
    await expect(registrar).toBeVisible();
    // [CH-241, E6-20] Registrar conserva su texto; es el título el que se achica.
    await expect(registrar).toContainText(navegacion.registrar);
    expect(await sinPuntos()).toBe(true);
  });

  test('PRU-E2E-PWA-302 [] a 390 px los valores del detalle de categoría no se parten y el título de una fila de Actividad va en una línea con puntos suspensivos', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'movil', 'mide el teléfono');
    fijarRelojServidor(`${HOY}T10:00:00-06:00`);
    await sembrar(
      {
        id: 'SEM-MARCO-302',
        titulo: 'Semilla de filas del marco',
        refs: [],
        hoy: HOY,
        estadoInicial: [
          { op: 'OP-01', cuenta: 'Ahorro' },
          { op: 'OP-07', categoria: 'Ropa' },
          { op: 'OP-21', monto: 300 },
          { op: 'OP-14', categoria: 'Ropa', monto: 100, periodo: 'P1' },
          { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Ropa', fecha: '2027-02-05' },
        ],
        pasos: [],
      },
      HOY,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    const id = await (async (): Promise<string> => {
      await abrir(page, '/presupuesto');
      return (
        (await page.locator('[data-fila-categoria]').first().getAttribute('data-fila-categoria')) ??
        ''
      );
    })();
    await abrir(page, `/presupuesto/categorias/${id}`);
    // Cada valor de la rejilla cabe en una línea: su alto no pasa de 1.6 veces su tamaño de letra.
    const valores = await page.locator('[data-numeros] dd, [data-centavos]').evaluateAll((els) =>
      els.map((e) => {
        const estilo = getComputedStyle(e);
        return {
          alto: e.getBoundingClientRect().height,
          letra: Number.parseInt(estilo.fontSize, 10),
        };
      }),
    );
    expect(valores.length).toBeGreaterThan(0);
    for (const v of valores) expect(v.alto).toBeLessThanOrEqual(v.letra * 1.6);

    await abrir(page, '/actividad');
    const fila = page.locator('[data-fila-transaccion]').first();
    const lineas = await fila.locator('span.truncate').evaluateAll((els) =>
      els.map((e) => {
        const estilo = getComputedStyle(e);
        return {
          nowrap: estilo.whiteSpace,
          elipsis: estilo.textOverflow,
          alto: e.getBoundingClientRect().height,
          interlinea: Number.parseInt(estilo.lineHeight, 10),
        };
      }),
    );
    expect(lineas.length).toBeGreaterThanOrEqual(2);
    for (const l of lineas) {
      expect(l).toMatchObject({ nowrap: 'nowrap', elipsis: 'ellipsis' });
      expect(l.alto).toBeLessThanOrEqual(l.interlinea * 1.1);
    }
  });

  test('PRU-E2E-PWA-182 [V5-17] NO_ENCONTRADO de una consulta muestra «Esto ya no existe.» con el glifo de búsqueda, no el de positivo', async ({
    page,
  }) => {
    await page.goto('/pruebas/estados/no-encontrado');
    await expect(page.getByRole('heading', { name: estados.noExisteTitulo })).toBeVisible();
    await expect(page.locator('[data-glifo="search"]')).toBeVisible();
    await expect(page.locator('[data-glifo="positivo"]')).toHaveCount(0);
  });

  test('PRU-E2E-PWA-183 [] el detalle de una categoría publica «Más acciones» en la barra (tres puntos después de la campana en teléfono, con rótulo junto a ella en computadora) con Eliminar al final en peligro; las pantallas principales no lo tienen', async ({
    page,
  }) => {
    await sembrarBase();
    await abrir(page, '/presupuesto');
    await expect(barra(page).getByRole('button', { name: navegacion.masAcciones })).toHaveCount(0);
    const id = await page
      .locator('[data-fila-categoria]')
      .first()
      .getAttribute('data-fila-categoria');
    await abrir(page, `/presupuesto/categorias/${id}`);

    const boton = barra(page).getByRole('button', { name: navegacion.masAcciones });
    await expect(boton).toHaveAttribute('aria-expanded', 'false');
    const campana = await barra(page)
      .getByRole('link', { name: /^Notificaciones/ })
      .boundingBox();
    const cajaBoton = await boton.boundingBox();
    expect(campana === null || cajaBoton === null).toBe(false);
    if (enEscritorio(page)) expect(cajaBoton?.x ?? 0).toBeLessThan(campana?.x ?? 0);
    else expect(cajaBoton?.x ?? 0).toBeGreaterThan(campana?.x ?? 0);

    await boton.click();
    const items = page.getByRole('menu', { name: navegacion.masAcciones }).getByRole('menuitem');
    await expect(items).toHaveCount(6);
    await expect(items.first()).toContainText('Editar nombre y grupo');
    await expect(items.last()).toContainText('Eliminar');
    await expect(items.last()).toHaveClass(/text-peligro/);
    await revisarAccesibilidad(page);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(boton).toBeFocused();
  });

  // TA-562 (CH-240, CH-241; D-1, D-2, E4-26, E5-11, E6-19, E6-20).
  test('PRU-E2E-PWA-711 [CA-E4-4, CA-E4-5] a 1440 px un flujo de una columna mide ≤ 720 px, y Registrar gasto ocupa 1096 px en dos columnas iguales', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'escritorio', 'mide la computadora');
    await sembrarBase();
    await page.setViewportSize({ width: 1440, height: 900 });
    const principal = page.locator('#contenido > main');
    await abrir(page, '/cuentas/nueva');
    expect((await principal.boundingBox())?.width ?? 0).toBeLessThanOrEqual(720);
    await abrir(page, '/registrar/gasto');
    // El ancho del contenido: 1440 − 248 de la barra lateral − 2 × 48 de relleno.
    expect(Math.round(((await principal.boundingBox())?.width ?? 0) - 96)).toBe(1096);
    const columnas = await page
      .locator('#contenido form div.grid')
      .first()
      .evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(' '));
    expect(columnas).toHaveLength(2);
    expect(columnas[0]).toBe(columnas[1]);
  });

  test('PRU-E2E-PWA-712 [CA-E4-6, CA-E6-13] a 900 y a 768 px hay barra superior e inferior sin barra lateral, el contenido mide ≤ 640 px con 24 px de relleno, Registrar gasto va en una columna y la hoja se centra a 640', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'escritorio', 'mide la tableta');
    await sembrarBase();
    for (const ancho of [900, 768]) {
      await page.setViewportSize({ width: ancho, height: 1024 });
      await abrir(page, '/presupuesto');
      await expect(page.locator('aside')).toBeHidden();
      await expect(barra(page)).toBeVisible();
      await expect(page.locator('nav[data-marco-barra]')).toBeVisible();
      const main = page.locator('#contenido > main');
      expect((await main.boundingBox())?.width ?? 0).toBeLessThanOrEqual(640);
      expect(await estilo(page, '#contenido > main', 'padding-left')).toBe('24px');

      await abrir(page, '/registrar/gasto');
      const columnas = await page
        .locator('#contenido form div.grid')
        .first()
        .evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
      expect(columnas).toBe(1);

      await abrir(page, '/presupuesto');
      await page.getByRole('button', { name: navegacion.secundarias }).click();
      const caja = await page.getByRole('dialog').boundingBox();
      expect(caja?.width ?? 0).toBeLessThanOrEqual(640);
      expect(Math.abs((caja?.x ?? 0) + (caja?.width ?? 0) / 2 - ancho / 2)).toBeLessThanOrEqual(1);
    }
  });

  test('PRU-E2E-PWA-713 [CA-E4-7] a 1024 px aparece la barra lateral y Registrar gasto va en una columna; a 1280, en dos', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'escritorio', 'mide la computadora');
    await sembrarBase();
    const columnas = async (): Promise<number> =>
      page
        .locator('#contenido form div.grid')
        .first()
        .evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
    await page.setViewportSize({ width: 1024, height: 800 });
    await abrir(page, '/registrar/gasto');
    await expect(page.locator('aside')).toBeVisible();
    expect(await columnas()).toBe(1);
    await page.setViewportSize({ width: 1280, height: 800 });
    expect(await columnas()).toBe(2);
  });

  test('PRU-E2E-PWA-714 [CA-E6-19] las filas de la barra lateral miden 44 px con el símbolo de la marca; Programadas y Reportes marcan su fila; a 390 px el título «Presupuesto» no lleva puntos suspensivos y «Registrar» conserva su texto', async ({
    page,
  }) => {
    await sembrarBase();
    if (enEscritorio(page)) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await abrir(page, '/programadas');
      const lateral = page.locator('aside');
      await expect(lateral.locator('[style*="mask"]')).toHaveCount(1);
      for (const fila of await lateral.locator('nav a').all())
        expect((await fila.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      await expect(
        lateral.getByRole('link', { name: navegacion.secciones.programadas }),
      ).toHaveAttribute('aria-current', 'page');
      await abrir(page, '/reportes/tendencia');
      await expect(
        lateral.getByRole('link', { name: navegacion.secciones.reportes }),
      ).toHaveAttribute('aria-current', 'page');
    } else {
      await page.setViewportSize({ width: 390, height: 844 });
      await abrir(page, '/presupuesto');
      await expect
        .poll(() => titulo(page).evaluate((h) => h.scrollWidth <= h.clientWidth))
        .toBe(true);
      await expect(barra(page).getByRole('link', { name: navegacion.registrar })).toContainText(
        navegacion.registrar,
      );
      await abrir(page, '/reportes/tendencia');
      await expect(page.locator('nav[data-marco-barra] [aria-current="page"]')).toHaveCount(0);
    }
  });
});
