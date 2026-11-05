// FT-06 Activar notificaciones en el dispositivo (06 §2.1; 05 §8.6, FE-57; 07 §17: `E2E`, con el navegador simulado en sus
// límites: `Notification` y el `pushManager` del service worker, que CI no puede alcanzar). OPT-02 y OPT-03 son las Server
// Actions reales contra la base de la E2E. Cada prueba usa un agente de usuario propio: es el nombre de su fila en la lista.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { notificaciones as t } from '../../../src/textos/notificaciones.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page, Request } from '@playwright/test';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

async function preparar(): Promise<void> {
  fijarRelojServidor('2027-02-05T10:00:00-06:00');
  const escenario: Escenario = {
    id: 'SEM-BAND',
    titulo: 'Semilla de FT-06',
    refs: [],
    hoy: '2027-02-05',
    estadoInicial: [],
    pasos: [],
  };
  await sembrar(escenario, '2027-02-05');
}

/** `Notification` y el service worker simulados; su estado vive en `sessionStorage` para sobrevivir a las recargas de la pestaña. */
async function simular(
  page: Page,
  permiso: NotificationPermission,
  endpoint: string,
): Promise<void> {
  await page.addInitScript(
    ([permisoInicial, punto]) => {
      const guardar = (k: string, v: string): void => {
        window.sessionStorage.setItem(`sim-${k}`, v);
      };
      const leer = (k: string): string | null => window.sessionStorage.getItem(`sim-${k}`);
      if (leer('permiso') === null) guardar('permiso', permisoInicial ?? 'default');
      const contar = (k: string): void => {
        guardar(k, String(Number(leer(k) ?? 0) + 1));
      };
      const suscripcion = () => ({
        endpoint: punto,
        toJSON: () => ({ endpoint: punto, keys: { p256dh: 'clave-p256dh', auth: 'clave-auth' } }),
        unsubscribe: () => {
          window.sessionStorage.removeItem('sim-sub');
          contar('anuladas');
          return Promise.resolve(true);
        },
      });
      const pushManager = {
        getSubscription: () => Promise.resolve(leer('sub') === null ? null : suscripcion()),
        subscribe: () => {
          guardar('sub', '1');
          return Promise.resolve(suscripcion());
        },
      };
      const Simulada = {
        get permission(): string {
          return leer('permiso') ?? 'default';
        },
        requestPermission: (): Promise<string> => {
          contar('pedidos');
          guardar('permiso', 'granted');
          return Promise.resolve('granted');
        },
      };
      // [CH-104, CH-184] Solo observa: ni las cabeceras de OPT-02 ni el fin que ve Playwright dicen que la app ya leyó el
      // resultado. El servidor cierra la respuesta en milisegundos (PRU-E2E-NOTIF-116), pero Chrome da el pedido por
      // `net::ERR_ABORTED` después de recibir todos los bytes, y `response.finished()` solo se cumple con `requestfinished`.
      // Una copia de la respuesta cuenta `opt02-resultados` cuando llega la fila del resultado; la app recibe los mismos
      // bytes en la misma tarea.
      const fetchReal = window.fetch.bind(window);
      window.fetch = (entrada, init) => {
        const respuesta = fetchReal(entrada, init);
        if (typeof init?.body === 'string' && init.body.includes('clave-p256dh'))
          void respuesta.then(
            async (r) => {
              const lector = r.clone().body?.getReader();
              const decodificar = new TextDecoder();
              let texto = '';
              for (;;) {
                const trozo = await lector?.read();
                if (trozo === undefined || trozo.done) return;
                texto += decodificar.decode(trozo.value, { stream: true });
                if (texto.includes('"ok":')) {
                  contar('opt02-resultados');
                  await lector?.cancel();
                  return;
                }
              }
            },
            () => undefined,
          );
        return respuesta;
      };
      Object.assign(window, { Notification: Simulada });
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve({ pushManager }),
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          register: () => Promise.reject(new Error('sin service worker')),
        },
      });
    },
    [permiso, endpoint],
  );
}

const contador = (page: Page, clave: string): Promise<number> =>
  page.evaluate((k) => Number(window.sessionStorage.getItem(`sim-${k}`) ?? 0), clave);

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

/**
 * [CH-184] Repite con la sesión del contexto el pedido de una Server Action que hizo la página y lee la respuesta entera:
 * `timeout` es el tope de toda la respuesta, cuerpo incluido. Desde el navegador no se puede medir: Chrome da el pedido de
 * OPT-02 por `net::ERR_ABORTED` después de recibir todos los bytes, y `response.finished()` nunca se cumple.
 */
async function repetirEntera(
  page: Page,
  pedido: Request,
): Promise<{ estado: number; revalidada: string | undefined; cuerpo: string }> {
  const fuera = new Set(['cookie', 'content-length', 'host', 'connection', 'accept-encoding']);
  const cabeceras = Object.fromEntries(
    Object.entries(await pedido.allHeaders()).filter(([k]) => !fuera.has(k) && !k.startsWith(':')),
  );
  const r = await page.request.post(pedido.url(), {
    headers: cabeceras,
    data: pedido.postData() ?? '',
    timeout: 10_000,
  });
  return {
    estado: r.status(),
    revalidada: r.headers()['x-action-revalidated'],
    cuerpo: await r.text(),
  };
}

const fila = (page: Page, agente: string) => page.getByRole('listitem').filter({ hasText: agente });

test.describe('PRU-E2E-NOTIF', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
    await preparar();
  });

  test.describe('permiso sin decidir', () => {
    const AGENTE = 'FinnE2E-NOTIF-101';
    test.use({ userAgent: AGENTE });

    test('PRU-E2E-NOTIF-101 [CA-06.1, CA-06.2, CA-06.6] Inicio no pide el permiso; al activar desde la tarjeta aparece el dispositivo en Ajustes y "Quitar" lo borra y anula la suscripción local', async ({
      page,
    }) => {
      await simular(page, 'default', 'https://push.example.test/send/e2e-notif-101-0123456789');
      await abrir(page, '/');
      const activar = page.getByRole('button', { name: t.activar, exact: true });
      await expect(page.getByRole('heading', { name: t.tarjetaTitulo })).toBeVisible();
      expect(await contador(page, 'pedidos')).toBe(0);

      await activar.click();
      await expect(page.getByRole('heading', { name: t.tarjetaTitulo })).toHaveCount(0);
      expect(await contador(page, 'pedidos')).toBe(1);

      await abrir(page, '/ajustes/notificaciones');
      await expect(page.getByText(t.activadasAqui)).toBeVisible();
      await expect(fila(page, AGENTE)).toContainText(t.esteDispositivo);

      await fila(page, AGENTE)
        .getByRole('button', { name: t.quitarEtiqueta(AGENTE) })
        .click();
      await expect(fila(page, AGENTE)).toHaveCount(0);
      await expect.poll(() => contador(page, 'anuladas')).toBe(1);
    });
  });

  test.describe('permiso concedido', () => {
    test.use({ userAgent: 'FinnE2E-NOTIF-102' });

    test('PRU-E2E-NOTIF-102 [CA-06.3] con el permiso concedido la app renueva la suscripción sin preguntar, una sola vez por pestaña', async ({
      page,
    }) => {
      await simular(page, 'granted', 'https://push.example.test/send/e2e-notif-102-0123456789');
      // OPT-02 es la única Server Action que lleva las claves de la suscripción
      const esOpt02 = (r: Request): boolean =>
        r.method() === 'POST' && r.postData()?.includes('clave-p256dh') === true;
      const acciones: string[] = [];
      page.on('request', (r) => {
        if (esOpt02(r)) acciones.push(r.url());
      });
      await abrir(page, '/');
      // [CH-104] Recargar antes de que la app lea el resultado aborta el pedido, `renovar` lo toma como fallo y borra la
      // marca, y la recarga renueva otra vez (falló con 3 pedidos, dos `net::ERR_ABORTED`, y el servidor respondió ok las
      // tres veces). Esperar las cabeceras no alcanza: se recarga cuando el resultado ya llegó a la página.
      await expect.poll(() => contador(page, 'opt02-resultados')).toBe(1);
      await page.reload();
      await esperarHidratacion(page);
      await abrir(page, '/ajustes');
      expect(acciones).toHaveLength(1);
      expect(await contador(page, 'pedidos')).toBe(0);
    });
  });

  test.describe('respuesta de la acción', () => {
    test.use({ userAgent: 'FinnE2E-NOTIF-116' });

    test('PRU-E2E-NOTIF-116 [CA-06.3, V5-03] la respuesta de OPT-02 y la de una escritura con accion() terminan con el resultado y el árbol revalidado', async ({
      page,
    }) => {
      await simular(page, 'granted', 'https://push.example.test/send/e2e-notif-116-0123456789');
      const opt02 = page.waitForRequest(
        (r) => r.method() === 'POST' && r.postData()?.includes('clave-p256dh') === true,
      );
      await abrir(page, '/');
      const renovacion = await repetirEntera(page, await opt02);
      expect(renovacion.estado).toBe(200);
      expect(renovacion.revalidada).toBe('1');
      expect(renovacion.cuerpo).toContain('"ok":true');

      await abrir(page, '/pruebas/eco');
      await page.getByLabel('Texto').fill('ch-184');
      const eco = page.waitForRequest(
        (r) => r.method() === 'POST' && r.postData()?.includes('ch-184') === true,
      );
      await page.getByRole('button', { name: 'Guardar' }).click();
      const escritura = await repetirEntera(page, await eco);
      expect(escritura.estado).toBe(200);
      expect(escritura.revalidada).toBe('1');
      expect(escritura.cuerpo).toContain('"ok":true');
    });
  });

  test.describe('permiso denegado', () => {
    test('PRU-E2E-NOTIF-103 [CA-06.4] con el permiso denegado /ajustes/notificaciones explica cómo habilitarlo en el navegador', async ({
      page,
    }) => {
      await simular(page, 'denied', 'https://push.example.test/send/e2e-notif-103-0123456789');
      await abrir(page, '/ajustes/notificaciones');
      await expect(page.getByText(t.denegadoTitulo)).toBeVisible();
      for (const paso of t.denegadoPasos) await expect(page.getByText(paso)).toBeVisible();
      await expect(page.getByRole('button', { name: t.activar, exact: true })).toHaveCount(0);
    });
  });

  test.describe('Safari en iPhone', () => {
    test.use({ userAgent: IPHONE });

    test('PRU-E2E-NOTIF-104 [CA-06.5] en un iPhone sin instalar /ajustes/notificaciones explica que hay que instalar Finn antes', async ({
      page,
    }) => {
      await abrir(page, '/ajustes/notificaciones');
      await expect(page.getByText(t.iosTitulo)).toBeVisible();
      await expect(page.getByText(t.iosAyuda)).toBeVisible();
      await expect(page.getByRole('button', { name: t.activar, exact: true })).toHaveCount(0);
    });
  });
});
