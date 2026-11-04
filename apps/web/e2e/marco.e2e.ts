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

const ANCHO_ESCRITORIO = 768;
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
});
