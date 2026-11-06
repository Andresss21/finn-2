// PRU-SW-NOTIF-002 (TA-429; 05 §8.6, FE-57; 04 §11.5; CA-70.3): «Confirmar» desde la notificación con la sesión vigente, contra el
// Route Handler real y una coincidencia sembrada con operaciones reales (DP-17). El evento `notificationclick` es sintético; la
// entrega real por el servicio de push queda en PRU-MAN-NOTIF-001. Lo mostrado se observa envolviendo `showNotification`: la
// notificación "Listo" puede cerrarse sola en el sistema, así que no se espera encontrarla en la lista (07 §7.1, sin tiempos fijos).
import { expect, test } from '@playwright/test';
import { sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../tools/pruebas/e2e/reloj.ts';
import { visitarControlada } from './ayudas-sw.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';

const DIA = '2027-02-20';
const NOTIFICACION = '4b0f6a56-0c3d-4a0e-9f7e-6a8d3f1c2b10';
// Una programada de Netflix del día 20 y el SMS de la tarjeta que coincide con ella: queda `con_coincidencia`
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
  // Una compra anterior en Netflix ya aprobada en Super: la coincidencia trae la categoría y la notificación puede confirmarla
  {
    op: 'OP-35',
    etiqueta: 'anterior',
    cuenta: 'T',
    monto: 9,
    comercio: 'Netflix',
    recibido: `${DIA}T09:00`,
    fecha: DIA,
  },
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Super', aprobado: `${DIA}T09:30` },
  {
    op: 'OP-42',
    etiqueta: 'Netflix',
    cuenta: 'T',
    comercio: 'Netflix',
    monto: 15.49,
    categoria: 'Super',
    primeraFecha: DIA,
  },
  {
    op: 'OP-35',
    etiqueta: 'sms',
    cuenta: 'T',
    monto: 15.49,
    comercio: 'Netflix',
    recibido: `${DIA}T19:00`,
    fecha: DIA,
  },
];

// Las notificaciones solo existen en el Chromium completo (V5-32), no en el `headless shell` por defecto.
test.use({
  channel: 'chromium',
  launchOptions: { args: ['--disable-features=NativeNotifications,SystemNotifications'] },
});

test.describe('PRU-SW-NOTIF', () => {
  test.use({ serviceWorkers: 'allow' });
  test.skip(({ browserName }) => browserName !== 'chromium', 'service worker: solo Chromium');

  test('PRU-SW-NOTIF-002 [CA-70.3] «Confirmar» con la sesión vigente ejecuta OP-40 y el service worker muestra «Listo»; repetir un rechazo sobre el movimiento ya aprobado abre /bandeja/[movimientoId]', async ({
    page,
    context,
    baseURL,
  }) => {
    fijarRelojServidor(`${DIA}T20:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-NOTIF-70',
      titulo: 'Semilla de FT-70, coincidencia',
      refs: [],
      hoy: DIA,
      estadoInicial: ESTADO,
      pasos: [],
    };
    await sembrar(escenario, DIA);
    await entrarAal2(context, baseURL ?? '');
    await context.grantPermissions(['notifications'], { origin: baseURL ?? '' });

    await page.goto('/bandeja');
    await esperarContenido(page);
    const href = await page.locator('[data-movimiento]').getByRole('link').getAttribute('href');
    const movimientoId = (href ?? '').split('/').pop() ?? '';
    expect(movimientoId).toMatch(/^[0-9a-f-]{36}$/);

    await visitarControlada(page, '/sin-conexion');
    const sw = context.serviceWorkers().find((w) => w.url().endsWith('/serwist/sw.js'));
    if (sw === undefined) throw new Error('no hay service worker');
    // Registra los títulos que muestra el service worker, aunque el sistema cierre la notificación enseguida
    await sw.evaluate(() => {
      const g = self as unknown as ServiceWorkerGlobalScope & {
        mostradasPorFinn: string[];
        accionesPorFinn: number[];
      };
      g.mostradasPorFinn = [];
      g.accionesPorFinn = [];
      const fetchOriginal = g.fetch.bind(g);
      g.fetch = async (entrada, init) => {
        const respuesta = await fetchOriginal(entrada, init);
        if (respuesta.url.includes('/api/notificaciones/accion'))
          g.accionesPorFinn.push(respuesta.status);
        return respuesta;
      };
      const original = g.registration.showNotification.bind(g.registration);
      g.registration.showNotification = (titulo, opciones) => {
        g.mostradasPorFinn.push(titulo);
        return original(titulo, opciones);
      };
    });
    const titulos = () =>
      sw.evaluate(() =>
        (self as unknown as { mostradasPorFinn: string[] }).mostradasPorFinn.slice(),
      );
    const respuestas = () =>
      sw.evaluate(() => (self as unknown as { accionesPorFinn: number[] }).accionesPorFinn.slice());
    const carga = JSON.stringify({
      notificacionId: NOTIFICACION,
      titulo: 'Movimiento nuevo',
      cuerpo: 'Compra en Netflix por $15.49. Revisala en la bandeja.',
      etiqueta: 'sms',
      destino: { pantalla: 'movimiento', movimientoId },
      acciones: ['confirmar', 'rechazar'],
    });
    // Con el mismo `tag` reemplaza, nunca duplica: si el sistema la cerró, se reenvía hasta que esté visible
    const tocar = async (decision: string): Promise<void> => {
      await expect
        .poll(
          async () => {
            const hay = await sw.evaluate(async () => {
              const g = self as unknown as ServiceWorkerGlobalScope;
              return (await g.registration.getNotifications({ tag: 'sms' })).length;
            });
            if (hay > 0) return true;
            await sw.evaluate((d) => {
              (self as unknown as ServiceWorkerGlobalScope).dispatchEvent(
                new PushEvent('push', { data: d }),
              );
            }, carga);
            return false;
          },
          { timeout: 20_000 },
        )
        .toBe(true);
      await sw.evaluate(async (accion) => {
        const g = self as unknown as ServiceWorkerGlobalScope;
        const [notificacion] = await g.registration.getNotifications({ tag: 'sms' });
        if (notificacion === undefined) throw new Error('no hay notificación');
        g.dispatchEvent(
          new NotificationEvent('notificationclick', {
            notification: notificacion,
            action: accion,
          }),
        );
      }, decision);
    };

    // Confirmar: 200 y «Listo»
    await tocar('confirmar');
    await expect.poll(respuestas).toEqual([200]);
    await expect.poll(titulos).toContain('Listo');

    // El movimiento quedó aprobado: ya no está por revisar
    await expect(async () => {
      await page.goto('/bandeja');
      await esperarContenido(page);
      await expect(page.locator('[data-movimiento]')).toHaveCount(0);
    }).toPass();

    // Un rechazo sobre lo ya aprobado no puede ejecutarse (el movimiento cambió): el service worker abre ese movimiento
    const navegacion = page.waitForRequest(
      (r) => r.isNavigationRequest() && new URL(r.url()).pathname === `/bandeja/${movimientoId}`,
    );
    await tocar('rechazar');
    await navegacion;
    expect((await respuestas()).at(-1)).toBe(422);
  });
});
