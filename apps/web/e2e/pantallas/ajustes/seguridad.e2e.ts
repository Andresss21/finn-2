// FT-74 Factores y sesiones (06 §2.2; 05 §9.6; 07 §17: una pantalla, una navegación o un flujo). El usuario de prueba termina con
// su factor de siempre; las pruebas que agregan un respaldo lo quitan. «Cerrar las otras sesiones» mata la sesión compartida de
// `inicio-sesion.setup.ts`: la última prueba deja en su archivo la sesión que sigue viva, como `inscribir.e2e.ts`.
import { expect, test } from '../../configuracion/semilla.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { clienteAal1, clienteAal2, listarFactores } from '../../ayudas/factores.ts';
import { entrarAal2, variable } from '../../ayudas/sesion.ts';
import { codigoDe } from '../../ayudas/totp.ts';
import {
  completarInscripcion,
  iniciarInscripcion,
  quitarFactor,
} from '../../../../../packages/aplicacion/src/autenticacion/supabase.ts';
import { autenticacion } from '../../../src/textos/autenticacion.ts';
import { seguridad as t } from '../../../src/textos/seguridad.ts';
import type { Page } from '@playwright/test';

const ARCHIVO_SESION = 'test-results/sesion.json'; // el de configuracion/inicio-sesion.setup.ts

/** El factor verificado del usuario de prueba. */
async function factorUnico(): Promise<string> {
  const verificados = (await listarFactores(await clienteAal1())).filter(
    (f) => f.estado === 'verified',
  );
  expect(verificados).toHaveLength(1);
  return verificados[0]?.id ?? '';
}

/** Agrega un respaldo verificado con las funciones de 04 §12.2; devuelve su id. */
async function agregarRespaldo(): Promise<string> {
  const cliente = await clienteAal2();
  const usuario = variable('FINN_USUARIO_ID');
  const inicio = await iniciarInscripcion(cliente.auth, usuario, { nombre: 'Respaldo' });
  if (!inicio.ok) throw new Error('no se pudo iniciar el respaldo de la prueba');
  const fin = await completarInscripcion(cliente.auth, usuario, {
    factorId: inicio.valor.factorId,
    codigo: codigoDe(inicio.valor.secreto),
  });
  if (!fin.ok) throw new Error('no se pudo completar el respaldo de la prueba');
  return inicio.valor.factorId;
}

async function abrirSeguridad(page: Page): Promise<void> {
  await page.goto('/ajustes/seguridad');
  await esperarHidratacion(page);
  await expect(page.getByRole('heading', { name: t.titulo, level: 1 })).toBeVisible();
}

test.describe('PRU-E2E-ACCESO', () => {
  test.describe.configure({ mode: 'serial' });

  test('PRU-E2E-ACCESO-113 [CA-74.1] con un solo factor verificado, Quitar lo explica con el enlace a agregar otro y quitarFactor responde factor_unico', async ({
    page,
    context,
    baseURL,
  }) => {
    const id = await factorUnico();
    await entrarAal2(context, baseURL ?? '');
    await abrirSeguridad(page);
    await page
      .locator(`[data-factor="${id}"]`)
      .getByRole('link', { name: /^Quitar/ })
      .click();
    await page.waitForURL(`**/ajustes/seguridad/factores/${id}/quitar`);
    await expect(page.getByText(autenticacion.factor_unico)).toBeVisible();
    await expect(page.getByRole('link', { name: t.agregar })).toHaveAttribute(
      'href',
      '/ajustes/seguridad/factores/nuevo',
    );
    await expect(page.getByRole('button', { name: t.quitar })).toHaveCount(0);
    const cliente = await clienteAal2();
    const resultado = await quitarFactor(cliente.auth, variable('FINN_USUARIO_ID'), {
      factorId: id,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('factor_unico');
    expect(await factorUnico()).toBe(id);
  });

  test('PRU-E2E-ACCESO-114 [CA-74.2] con dos factores, quitar uno deja el otro y la sesión sigue en AAL2', async ({
    page,
    context,
    baseURL,
  }) => {
    const id = await factorUnico();
    const respaldo = await agregarRespaldo();
    await entrarAal2(context, baseURL ?? '');
    await abrirSeguridad(page);
    await expect(page.locator('[data-factor]')).toHaveCount(2);
    await page
      .locator(`[data-factor="${respaldo}"]`)
      .getByRole('link', { name: /^Quitar/ })
      .click();
    await page.waitForURL(`**/ajustes/seguridad/factores/${respaldo}/quitar`);
    await page.getByRole('button', { name: t.quitar }).click();
    await page.waitForURL((u) => u.pathname === '/ajustes/seguridad');
    await expect(page.getByRole('heading', { name: t.titulo, level: 1 })).toBeVisible();
    await expect(page.locator('[data-factor]')).toHaveCount(1);
    await expect(page.locator(`[data-factor="${id}"]`)).toBeVisible();
    expect(await factorUnico()).toBe(id);
  });

  test('PRU-E2E-ACCESO-115 [CA-74.3] Cerrar las otras sesiones: la otra pide ingresar de nuevo y esta sigue', async ({
    browser,
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    const otraContexto = await browser.newContext({ baseURL: baseURL ?? '' });
    const otra = await otraContexto.newPage();
    await entrarAal2(otraContexto, baseURL ?? '');
    await abrirSeguridad(otra);

    await abrirSeguridad(page);
    await page.getByRole('button', { name: t.cerrarOtras }).click();
    await expect(page.getByText(t.otrasCerradas)).toBeVisible();

    // Esta sigue: una escritura (que verifica con `getUser()`) vuelve a funcionar
    await page.getByRole('button', { name: t.cerrarOtras }).click();
    await expect(page.getByText(t.otrasCerradas)).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: t.titulo, level: 1 })).toBeVisible();

    // La otra, al escribir, ya no tiene sesión: `NO_AUTORIZADO` la lleva a ingresar (05 §7.5)
    await otra.getByRole('button', { name: t.cerrarOtras }).click();
    await otra.waitForURL('**/ingresar**');
    await otraContexto.close();

    await page.context().storageState({ path: ARCHIVO_SESION }); // la sesión compartida del setup murió: queda esta
  });

  test('PRU-E2E-ACCESO-116 [CA-74.4] Salir pide ingresar al volver, borra los borradores de la pestaña y deja la suscripción push', async ({
    page,
    context,
    baseURL,
  }) => {
    // La suscripción push del dispositivo, simulada en el límite del navegador (como en notificaciones.e2e.ts): si Salir la quitara,
    // llamaría a `unsubscribe()` y haría una segunda Server Action (OPT-03).
    await page.addInitScript(() => {
      const suscripcion = {
        endpoint: 'https://push.example.test/seguridad',
        unsubscribe: () => {
          window.sessionStorage.setItem('sim-anuladas', '1');
          return Promise.resolve(true);
        },
      };
      const pushManager = { getSubscription: () => Promise.resolve(suscripcion) };
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve({ pushManager }),
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          register: () => Promise.reject(new Error('sin service worker')),
        },
      });
    });
    await entrarAal2(context, baseURL ?? '');
    await abrirSeguridad(page);
    await page.evaluate(() => {
      window.sessionStorage.setItem('finn:borrador:v1:/registrar/gasto:', '{"version":1}');
    });
    const acciones: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST' && r.headers()['next-action'] !== undefined) acciones.push(r.url());
    });
    await page.getByRole('button', { name: t.salir }).click();
    await page.waitForURL('**/ingresar**');
    const guardado = await page.evaluate(() => ({
      borrador: window.sessionStorage.getItem('finn:borrador:v1:/registrar/gasto:'),
      anuladas: window.sessionStorage.getItem('sim-anuladas'),
    }));
    expect(guardado).toEqual({ borrador: null, anuladas: null });
    expect(acciones).toHaveLength(1); // solo `salir()`
    await page.goto('/ajustes/seguridad');
    await page.waitForURL('**/ingresar**');
    expect(new URL(page.url()).searchParams.get('volver')).toBe('/ajustes/seguridad');
  });
});
