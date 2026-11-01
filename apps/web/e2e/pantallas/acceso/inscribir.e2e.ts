// FT-02 Inscribir el primer factor TOTP (06 §2.2; 05 §9.5; 07 §17: una pantalla, una navegación o un flujo). El usuario de prueba
// se deja sin factores y la primera prueba lo vuelve a dejar con uno; el orden de este archivo importa (modo serial).
import { expect, test } from '../../configuracion/semilla.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import {
  asegurarFactor,
  clienteAal1,
  clienteAal2,
  dejarSinFactores,
  listarFactores,
} from '../../ayudas/factores.ts';
import { entrarAal2, variable } from '../../ayudas/sesion.ts';
import { codigoDe, guardarSecreto } from '../../ayudas/totp.ts';
import { iniciarInscripcion } from '../../../../../packages/aplicacion/src/autenticacion/supabase.ts';
import { eventosQueNombran } from '../../../../../tools/pruebas/e2e/pila.ts';
import { ingreso as t } from '../../../src/textos/ingreso.ts';
import type { Page } from '@playwright/test';

const ARCHIVO_SESION = 'test-results/sesion.json'; // el de configuracion/inicio-sesion.setup.ts

const secretoDe = async (page: Page): Promise<string> => {
  const texto = await page.getByTestId('secreto').innerText();
  return texto.replace(/\s/g, '');
};

/** Visible no basta: una imagen rota también lo es, con su texto alternativo. La que decodificó tiene ancho natural. */
async function esperarQrDecodificado(page: Page): Promise<void> {
  await expect
    .poll(() => page.getByAltText(t.altQr).evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
}

/** Ingresa con la contraseña y espera la pantalla de inscripción con su QR ya mostrado. */
async function llegarAInscribir(page: Page, volver?: string): Promise<void> {
  await page.context().clearCookies();
  await page.goto(
    volver === undefined ? '/ingresar' : `/ingresar?volver=${encodeURIComponent(volver)}`,
  );
  await esperarHidratacion(page);
  await page.getByLabel(t.email).fill(variable('E2E_EMAIL'));
  await page.getByLabel(t.contrasena, { exact: true }).fill(variable('E2E_CLAVE'));
  await page.getByRole('button', { name: t.ingresar }).click();
  await page.waitForURL('**/ingresar/inscribir**');
  await expect(page.getByAltText(t.altQr)).toBeVisible();
  await esperarQrDecodificado(page);
}

test.describe('PRU-E2E-ACCESO', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await dejarSinFactores();
  });
  test.afterAll(async () => {
    await asegurarFactor();
  });

  test('PRU-E2E-ACCESO-106 [CA-02.1] abrir /ingresar/inscribir dos veces deja un solo factor sin verificar, el último', async ({
    page,
  }) => {
    await llegarAInscribir(page);
    const primero = await secretoDe(page);
    await page.reload();
    await expect(page.getByAltText(t.altQr)).toBeVisible();
    await esperarQrDecodificado(page);
    const segundo = await secretoDe(page);
    expect(segundo).not.toBe(primero);
    const factores = await listarFactores(await clienteAal1());
    expect(factores).toHaveLength(1);
    expect(factores[0]?.estado).toBe('unverified');
  });

  test('PRU-E2E-ACCESO-107 [CA-02.2] el secreto no aparece en sessionStorage, localStorage, la caché del service worker ni eventos_sistema', async ({
    page,
  }) => {
    await llegarAInscribir(page);
    const secreto = await secretoDe(page);
    const enNavegador = await page.evaluate(async (buscado) => {
      const volcar = (almacen: Storage): string =>
        Array.from({ length: almacen.length }, (_, i) => {
          const clave = almacen.key(i) ?? '';
          return clave + (almacen.getItem(clave) ?? '');
        }).join('');
      const almacenes = [volcar(sessionStorage), volcar(localStorage)];
      let cache = '';
      for (const nombre of await caches.keys()) {
        const c = await caches.open(nombre);
        for (const peticion of await c.keys()) {
          const respuesta = await c.match(peticion);
          cache += peticion.url + (respuesta === undefined ? '' : await respuesta.clone().text());
        }
      }
      return [...almacenes, cache].map((texto) => texto.includes(buscado));
    }, secreto);
    expect(enNavegador).toEqual([false, false, false]);
    expect(eventosQueNombran(secreto)).toBe(0);
  });

  test('PRU-E2E-ACCESO-112 [] en tema oscuro el QR decodifica y sus módulos oscuros quedan sobre un fondo claro con margen', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await llegarAInscribir(page);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(13, 16, 19)'); // --fondo oscuro
    const qr = page.getByAltText(t.altQr);
    await expect(qr).toHaveCSS('background-color', 'rgb(241, 242, 238)'); // --marca-icono-figura, igual en los dos temas
    await expect(qr).toHaveCSS('padding-top', '12px'); // --espacio-3
    // Se pinta como en la pantalla: el fondo del elemento y encima el SVG, que puede no traer fondo propio.
    const pixeles = await qr.evaluate((img: HTMLImageElement) => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 200;
      lienzo.height = 200;
      const ctx = lienzo.getContext('2d');
      if (ctx === null) throw new Error('sin contexto 2d');
      ctx.fillStyle = getComputedStyle(img).backgroundColor;
      ctx.fillRect(0, 0, 200, 200);
      ctx.drawImage(img, 0, 0, 200, 200);
      const { data } = ctx.getImageData(0, 0, 200, 200);
      let oscuros = 0;
      let claros = 0;
      for (let i = 0; i < data.length; i += 4) {
        const suma = (data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0);
        if (suma < 150) oscuros += 1;
        if (suma > 600) claros += 1;
      }
      return { oscuros, claros };
    });
    expect(pixeles.oscuros).toBeGreaterThan(0);
    expect(pixeles.claros).toBeGreaterThan(0);
  });

  test('PRU-E2E-ACCESO-108 [CA-02.3] con un código correcto la sesión es AAL2, recomienda un respaldo y al seguir llego a volver', async ({
    page,
  }) => {
    await llegarAInscribir(page, '/pruebas/origen');
    const secreto = await secretoDe(page);
    await page.getByLabel(t.codigo).fill(codigoDe(secreto));
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.tituloListo })).toBeVisible();
    await expect(page.getByText(t.recomendarRespaldo)).toBeVisible();
    await expect(page.getByRole('link', { name: t.agregarRespaldo })).toHaveAttribute(
      'href',
      '/ajustes/seguridad/factores/nuevo',
    );
    guardarSecreto(secreto); // el factor del usuario de prueba ahora es este
    await page.context().storageState({ path: ARCHIVO_SESION });
    await page.getByRole('link', { name: t.seguir }).click();
    await page.waitForURL((u) => u.pathname === '/pruebas/origen');
  });

  test('PRU-E2E-ACCESO-109 [CA-02.4] con un factor verificado y sesión AAL1, /ingresar/inscribir lleva a /ingresar/verificar', async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto('/ingresar');
    await esperarHidratacion(page);
    await page.getByLabel(t.email).fill(variable('E2E_EMAIL'));
    await page.getByLabel(t.contrasena, { exact: true }).fill(variable('E2E_CLAVE'));
    await page.getByRole('button', { name: t.ingresar }).click();
    await page.waitForURL('**/ingresar/verificar**');
    await page.goto('/ingresar/inscribir');
    await page.waitForURL('**/ingresar/verificar**');
    await expect(page.getByLabel(t.codigo)).toBeVisible();
  });

  test('PRU-E2E-ACCESO-110 [CA-02.4] iniciarInscripcion() con AAL1 y un factor verificado responde inscripcion_no_permitida', async () => {
    const cliente = await clienteAal1();
    const resultado = await iniciarInscripcion(cliente.auth, variable('FINN_USUARIO_ID'), {});
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('inscripcion_no_permitida');
  });

  test('PRU-E2E-ACCESO-111 [CA-02.3] con AAL2, /ajustes/seguridad/factores/nuevo inscribe un factor de respaldo', async ({
    page,
    context,
    baseURL,
  }) => {
    const antes = await listarFactores(await clienteAal1());
    await entrarAal2(context, baseURL ?? '');
    await page.goto('/ajustes/seguridad/factores/nuevo');
    await expect(page.getByRole('heading', { name: t.tituloRespaldo })).toBeVisible();
    await expect(page.getByAltText(t.altQr)).toBeVisible();
    await esperarQrDecodificado(page);
    const secreto = await secretoDe(page);
    await page.getByLabel(t.codigo).fill(codigoDe(secreto));
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.tituloRespaldoListo })).toBeVisible();
    const cliente = await clienteAal2();
    const factores = await listarFactores(cliente);
    expect(factores.filter((f) => f.estado === 'verified')).toHaveLength(2);
    // Las demás pruebas usan un solo factor: se quita el de respaldo (el de 108 sigue siendo el del usuario)
    for (const { id } of factores)
      if (!antes.some((f) => f.id === id)) await cliente.auth.mfa.unenroll({ factorId: id });
  });
});
