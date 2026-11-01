// PRU-SW-PWA-002 (TA-223; 05 §8.5, §8.8, FE-56): sin conexión la navegación de documento termina en `/sin-conexion` (con
// el servidor realmente detenido: `setOffline` no alcanza a los pedidos del service worker, V5-30) y los enlaces del
// marco no navegan, así que la pantalla que se veía queda intacta. Usa el `test` de Playwright a secas: el bloqueo de
// red de la semilla no deja ir al servidor intermedio, que vive en otro puerto de localhost.
import { expect, test } from '@playwright/test';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { navegacion } from '../../src/textos/navegacion.ts';
import { visitarControlada, levantarServidorIntermedio } from './ayudas-sw.ts';

test.describe('PRU-SW-PWA', () => {
  test.use({ serviceWorkers: 'allow' });
  test.skip(({ browserName }) => browserName !== 'chromium', 'service worker: solo Chromium');

  test('PRU-SW-PWA-002 [V5-30] sin conexión navegar muestra /sin-conexion con el servidor detenido y el clic en un enlace del marco no navega, deja la pantalla intacta y avisa [FE-56, RUTA-/sin-conexion]', async ({
    page,
    context,
    baseURL,
  }) => {
    // 1. Servidor detenido: el service worker responde `/sin-conexion` desde su precache.
    const intermedio = await levantarServidorIntermedio(baseURL ?? '');
    try {
      await visitarControlada(page, `${intermedio.origen}/sin-conexion`);
      await intermedio.cerrar();

      await page.goto(`${intermedio.origen}/actividad`);
      await expect(
        page.getByRole('heading', { level: 1, name: navegacion.sinConexionPagina.titulo }),
      ).toBeVisible();
      await expect(page.getByText(navegacion.sinConexionPagina.texto)).toBeVisible();
      // La URL de la barra sigue siendo la pedida (V5-30a) y no hay enlaces a otras pantallas.
      await expect(page).toHaveURL(`${intermedio.origen}/actividad`);
      await expect(page.getByRole('link')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
    } finally {
      await intermedio.cerrar().catch(() => undefined);
    }

    // 2. Con sesión y sin conexión, el enlace no navega (V5-30c).
    await entrarAal2(context, baseURL ?? '');
    await page.goto('/pruebas/navegacion');
    await esperarHidratacion(page);
    await context.setOffline(true);
    await page.getByRole('link', { name: 'Ir al destino de navegación' }).click();
    await expect(page).toHaveURL('/pruebas/navegacion');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Origen de navegación' }),
    ).toBeVisible();
    await expect(
      page.getByRole('status').filter({ hasText: navegacion.sinConexionNavegacion }),
    ).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByRole('status').filter({ hasText: navegacion.sinConexion })).toHaveCount(
      0,
    );
  });
});
