// PRU-SW-NOTIF-001 (TA-440; 05 §8.6, FE-57; V5-32): push y toque con eventos sintéticos dentro del service worker. La entrega real
// por el servicio de push no es alcanzable desde CI (RF-12): queda en PRU-MAN-NOTIF-001. Sin sesión, la acción de la notificación
// recibe 401 del Route Handler real y abre `/bandeja` (04 §11.5); el resto se mira en las notificaciones y en los pedidos de
// navegación de la página, nunca con un tiempo fijo (07 §7.1).
import { expect, test } from '@playwright/test';
import { visitarControlada } from './ayudas-sw.ts';

const ID = '4b0f6a56-0c3d-4a0e-9f7e-6a8d3f1c2b10';
const MOVIMIENTO = '9c2d1e7a-5b44-4f6c-8a31-0d7e5b9a6c42';

// Las notificaciones solo existen en el Chromium completo (V5-32), no en el `headless shell` por defecto.
test.use({
  channel: 'chromium',
  launchOptions: { args: ['--disable-features=NativeNotifications,SystemNotifications'] },
});

test.describe('PRU-SW-NOTIF', () => {
  test.use({ serviceWorkers: 'allow' });
  test.skip(({ browserName }) => browserName !== 'chromium', 'service worker: solo Chromium');

  test('PRU-SW-NOTIF-001 [V5-32] el push muestra título, cuerpo, tag, acciones y datos de la carga, una carga ilegible muestra el texto genérico, el toque navega la ventana abierta y «Confirmar» sin sesión abre la bandeja [FE-57]', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(['notifications'], { origin: baseURL ?? '' });
    await visitarControlada(page, '/sin-conexion');
    const sw = context.serviceWorkers().find((w) => w.url().endsWith('/serwist/sw.js'));
    if (sw === undefined) throw new Error('no hay service worker');

    const enviar = (datos: string | null) =>
      sw.evaluate((d) => {
        const evento = new PushEvent('push', d === null ? {} : { data: d });
        (self as unknown as ServiceWorkerGlobalScope).dispatchEvent(evento);
      }, datos);
    const mostradas = () =>
      sw.evaluate(async () => {
        const lista = await (
          self as unknown as ServiceWorkerGlobalScope
        ).registration.getNotifications();
        return lista.map((n) => ({
          title: n.title,
          body: n.body,
          tag: n.tag,
          data: n.data as unknown,
          actions: (n as unknown as { actions: { action: string; title: string }[] }).actions,
        }));
      });

    const tocar = (tag: string, accion: string) =>
      sw.evaluate(
        async ({ etiqueta, decision }) => {
          const g = self as unknown as ServiceWorkerGlobalScope;
          const [notificacion] = await g.registration.getNotifications({ tag: etiqueta });
          if (notificacion === undefined) throw new Error('no hay notificación');
          g.dispatchEvent(
            new NotificationEvent('notificationclick', {
              notification: notificacion,
              action: decision,
            }),
          );
        },
        { etiqueta: tag, decision: accion },
      );

    // En Windows el centro de notificaciones del sistema a veces cierra la notificación apenas se muestra: si no aparece, se
    // reenvía el push (con el mismo `tag` reemplaza, nunca duplica). La condición es la notificación visible, no un tiempo.
    const mostrar = (datos: string, tag: string) =>
      expect
        .poll(
          async () => {
            if ((await mostradas()).some((x) => x.tag === tag)) return true;
            await enviar(datos);
            return false;
          },
          { timeout: 20_000 },
        )
        .toBe(true);
    const sms = JSON.stringify({
      notificacionId: ID,
      titulo: 'SMS por revisar',
      cuerpo: 'Tenés un SMS para confirmar.',
      etiqueta: 'sms',
      destino: { pantalla: 'movimiento', movimientoId: MOVIMIENTO },
      acciones: ['confirmar', 'rechazar'],
    });
    await mostrar(sms, 'sms');
    expect((await mostradas()).find((x) => x.tag === 'sms')).toMatchObject({
      title: 'SMS por revisar',
      body: 'Tenés un SMS para confirmar.',
      tag: 'sms',
      data: { notificacionId: ID, destino: { pantalla: 'movimiento', movimientoId: MOVIMIENTO } },
      actions: [
        { action: 'confirmar', title: 'Confirmar' },
        { action: 'rechazar', title: 'Rechazar' },
      ],
    });

    // Una carga que no se puede leer igual muestra una notificación (Chrome exige `userVisibleOnly`).
    await mostrar('esto no es json', '');
    expect((await mostradas()).find((x) => x.tag === '')).toMatchObject({
      title: 'Finn',
      body: 'Tenés una notificación nueva.',
    });

    // El toque navega la ventana abierta a la ruta del destino con la marca de leída.
    const navegacion = page.waitForRequest(
      (r) =>
        r.isNavigationRequest() && r.url().includes(`/bandeja/${MOVIMIENTO}?notificacion=${ID}`),
    );
    await mostrar(sms, 'sms');
    await tocar('sms', '');
    await navegacion;

    // «Confirmar» sin sesión: el Route Handler real responde 401 y el service worker abre la bandeja (04 §11.5).
    await mostrar(
      JSON.stringify({
        notificacionId: ID,
        titulo: 'SMS por revisar',
        cuerpo: 'Tenés un SMS para confirmar.',
        etiqueta: 'cierre',
        destino: { pantalla: 'movimiento', movimientoId: MOVIMIENTO },
        acciones: ['confirmar'],
      }),
      'cierre',
    );
    const bandeja = page.waitForRequest(
      (r) => r.isNavigationRequest() && new URL(r.url()).pathname === '/bandeja',
    );
    await tocar('cierre', 'confirmar');
    await bandeja;
  });
});
