// PRU-E2E-PWA-103 (TA-552, FE-29 y FE-30; 05 §3.1 a §3.3, §11.2; 06-identidad-visual §3): la navegación entre secciones. Usa el
// `Encabezado` de prueba de `(finn)/pruebas/navegacion` (Bandeja 3, Notificaciones 2) y `/` para la sección activa. Corre en
// `movil` y `escritorio`: la forma cambia (barra inferior y hoja «Más secciones» / barra lateral), el contenido no (N6).
import { entrarAal2 } from './ayudas/sesion.ts';
import { revisarAccesibilidad } from './ayudas/accesibilidad.ts';
import { esperarHidratacion } from './ayudas/esperas.ts';
import { expect, test } from './configuracion/semilla.ts';
import { SECCIONES, seccionDeRuta } from '../src/componentes/navegacion/secciones.ts';
import { navegacion } from '../src/textos/index.ts';

const ORIGEN = '/pruebas/navegacion';
const ANCHO_ESCRITORIO = 768;

test.describe('PRU-E2E-PWA', () => {
  test('PRU-E2E-PWA-103 la Bandeja y Notificaciones llevan su contador en el nombre, la sección activa marca aria-current por prefijo y las secundarias se alcanzan en dos interacciones en teléfono y a la vista en computadora', async ({
    page,
    context,
    baseURL,
  }) => {
    // seccionDeRuta: prefijo más largo, `/` solo exacto y Registrar sin sección (3.3).
    expect(seccionDeRuta('/')).toBe('inicio');
    expect(seccionDeRuta('/presupuesto/categoria/abc')).toBe('presupuesto');
    expect(seccionDeRuta('/reportes/tendencia')).toBe('reportes');
    expect(seccionDeRuta('/cuentas/abc')).toBe('cuentas');
    expect(seccionDeRuta('/registrar/gasto')).toBeNull();
    expect(seccionDeRuta('/presupuestos')).toBeNull();

    await entrarAal2(context, baseURL ?? '');
    await page.goto(ORIGEN);
    await esperarHidratacion(page);
    const enEscritorio = (page.viewportSize()?.width ?? 0) >= ANCHO_ESCRITORIO;
    const principales = SECCIONES.filter((s) => s.nivel === 'principal');
    const secundarias = SECCIONES.filter((s) => s.nivel === 'secundaria');

    // N6: una sola navegación a la vista según el tamaño; en computadora lleva también las secundarias.
    const nav = page
      .getByRole('navigation', { name: navegacion.principal })
      .locator('visible=true');
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole('link')).toHaveCount(
      principales.length + (enEscritorio ? secundarias.length : 0),
    );

    // N2, N7: el contador va dentro del nombre accesible.
    const bandeja = nav.getByRole('link', { name: navegacion.bandeja(3), exact: true });
    await expect(bandeja).toBeVisible();
    await expect(bandeja).toHaveAttribute('href', '/bandeja');
    await expect(
      page.getByRole('link', { name: navegacion.notificaciones(2), exact: true }).first(),
    ).toBeVisible();

    // El número se pinta con `::after`: sale en pantalla, no entra en el texto del enlace y sí en su nombre (3.3).
    const contador = bandeja.locator('[data-contador]');
    await expect(contador).toHaveText('');
    expect(await contador.evaluate((e) => getComputedStyle(e, '::after').content)).toBe('"3"');
    await expect(bandeja).toHaveAccessibleName(navegacion.bandeja(3));

    // N5: secundarias. En teléfono, botón y enlace; en computadora, ya a la vista.
    if (enEscritorio) {
      await expect(page.getByRole('button', { name: navegacion.secundarias })).toBeHidden();
      await expect(
        nav.getByRole('link', { name: navegacion.notificaciones(2), exact: true }),
      ).toBeVisible();
      for (const s of secundarias)
        await expect(nav.getByRole('link', { name: new RegExp(`^${s.etiqueta}`) })).toBeVisible();
      const filaNotif = nav.getByRole('link', { name: navegacion.notificaciones(2), exact: true });
      await expect(filaNotif.locator('[data-contador]')).toHaveText('');
      expect(
        await filaNotif
          .locator('[data-contador]')
          .evaluate((e) => getComputedStyle(e, '::after').content),
      ).toBe('"2"');
    } else {
      await page.getByRole('button', { name: navegacion.secundarias }).click();
      const hoja = page.getByRole('dialog', { name: navegacion.secundarias });
      await expect(hoja).toBeVisible();
      await expect(
        hoja.getByRole('link', { name: navegacion.notificaciones(2), exact: true }),
      ).toBeVisible();
      for (const s of secundarias)
        await expect(hoja.getByRole('link', { name: new RegExp(`^${s.etiqueta}`) })).toBeVisible();
      await revisarAccesibilidad(page);
      await hoja.getByRole('link', { name: navegacion.secciones.metas }).click();
      await expect(page).toHaveURL('/metas');
    }

    // Sección activa: en `/` es Inicio, y solo ella.
    await page.goto('/');
    await esperarHidratacion(page);
    const activas = nav.locator('[aria-current="page"]');
    await expect(activas).toHaveCount(1);
    await expect(activas).toHaveText(navegacion.secciones.inicio);

    // Accesibilidad con el marco completo, en los dos temas (11.10).
    for (const esquema of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: esquema });
      await page.goto(ORIGEN);
      await esperarHidratacion(page);
      await revisarAccesibilidad(page);
    }
  });
});
