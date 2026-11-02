// FT-06 (CMP, sin servidor ni base): la tarjeta de Inicio, `SuscripcionPush` y el panel de `/ajustes/notificaciones`. El navegador
// se simula en sus límites (`Notification`, `navigator.serviceWorker`, el agente de usuario); las Server Actions llegan por props.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { SuscripcionPush } from '../../../../componentes/marco/suscripcion-push';
import { TarjetaActivarNotificaciones } from '../../../../componentes/marco/tarjeta-notificaciones';
import { endpointCorto } from '../../../../formularios/endpoint-corto';
import { notificaciones as t } from '../../../../textos/notificaciones';
import { PanelNotificaciones, type DispositivoPush } from './panel';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ENDPOINT = 'https://push.example.test/send/abcdefghijklmnopqrstuvwxyz0123456789';
const AGENTE_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const montados: { raiz: Root; nodo: HTMLElement }[] = [];

const suscripcion = (endpoint = ENDPOINT) => ({
  endpoint,
  toJSON: () => ({ endpoint, keys: { p256dh: 'clave-p256dh', auth: 'clave-auth' } }),
  unsubscribe: vi.fn(() => Promise.resolve(true)),
});

/** `Notification` y el service worker del navegador, con el permiso inicial pedido y una suscripción opcional. */
function simularNavegador(
  permiso: NotificationPermission,
  existente?: ReturnType<typeof suscripcion>,
) {
  const estado = { permiso, sub: existente ?? null };
  const nueva = suscripcion();
  const pushManager = {
    getSubscription: vi.fn(() => Promise.resolve(estado.sub)),
    subscribe: vi.fn(() => {
      estado.sub = nueva;
      return Promise.resolve(nueva);
    }),
  };
  const pedir = vi.fn(() => {
    estado.permiso = 'granted';
    return Promise.resolve<NotificationPermission>('granted');
  });
  vi.stubGlobal('Notification', {
    requestPermission: pedir,
    get permission() {
      return estado.permiso;
    },
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: Promise.resolve({ pushManager }) },
  });
  return { pedir, pushManager, nueva };
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'serviceWorker');
  Reflect.deleteProperty(navigator, 'userAgent');
});

async function montar(ui: ReactNode): Promise<HTMLElement> {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(async () => {
    raiz.render(ui);
    await Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}
const boton = (nodo: HTMLElement, texto: string | RegExp): HTMLButtonElement | undefined =>
  [...nodo.querySelectorAll('button')].find((b) =>
    typeof texto === 'string'
      ? b.textContent === texto
      : texto.test(b.getAttribute('aria-label') ?? ''),
  );
const tocar = async (b: HTMLButtonElement | undefined): Promise<void> => {
  await act(async () => {
    b?.click();
    await new Promise((r) => setTimeout(r, 0));
  });
};
const ok = () => Promise.resolve({ ok: true });

describe('PRU-CMP-NOTIF', () => {
  it('PRU-CMP-NOTIF-101 [CA-06.1] con el permiso sin decidir la tarjeta se ve, no pide el permiso y se descarta', async () => {
    const { pedir } = simularNavegador('default');
    const nodo = await montar(<TarjetaActivarNotificaciones registrar={ok} />);
    expect(nodo.querySelector('h2')?.textContent).toBe(t.tarjetaTitulo);
    expect(pedir).not.toHaveBeenCalled();

    await tocar(boton(nodo, t.descartar));
    expect(nodo.querySelector('h2')).toBeNull();
    expect(pedir).not.toHaveBeenCalled();

    const otra = await montar(<TarjetaActivarNotificaciones registrar={ok} />);
    expect(otra.querySelector('h2')).toBeNull();
  });

  it('PRU-CMP-NOTIF-102 [CA-06.2] al aceptar se registra el endpoint del navegador con sus claves y la tarjeta desaparece', async () => {
    const registrar = vi.fn(() => Promise.resolve({ ok: true }));
    const { pedir, nueva } = simularNavegador('default');
    const nodo = await montar(<TarjetaActivarNotificaciones registrar={registrar} />);

    await tocar(boton(nodo, t.activar));
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar).toHaveBeenCalledWith({
      endpoint: nueva.endpoint,
      claves: { p256dh: 'clave-p256dh', auth: 'clave-auth' },
      agente: navigator.userAgent.slice(0, 500),
    });
    expect(nodo.querySelector('h2')).toBeNull();
  });

  it('PRU-CMP-NOTIF-103 [CA-06.3] con el permiso concedido renueva la suscripción una sola vez por pestaña', async () => {
    const registrar = vi.fn(() => Promise.resolve({ ok: true }));
    const { pushManager } = simularNavegador('granted', suscripcion());
    await montar(<SuscripcionPush registrar={registrar} />);
    await montar(<SuscripcionPush registrar={registrar} />);
    expect(registrar).toHaveBeenCalledTimes(1);
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('PRU-CMP-NOTIF-104 [CA-06.3] sin permiso concedido no renueva ni pregunta nada', async () => {
    const registrar = vi.fn(() => Promise.resolve({ ok: true }));
    const { pedir } = simularNavegador('default');
    await montar(<SuscripcionPush registrar={registrar} />);
    expect(registrar).not.toHaveBeenCalled();
    expect(pedir).not.toHaveBeenCalled();
  });

  it('PRU-CMP-NOTIF-105 [CA-06.4] con el permiso denegado el panel explica cómo habilitarlo en el navegador', async () => {
    simularNavegador('denied');
    const nodo = await montar(<PanelNotificaciones dispositivos={[]} registrar={ok} quitar={ok} />);
    expect(nodo.textContent).toContain(t.denegadoTitulo);
    for (const paso of t.denegadoPasos) expect(nodo.textContent).toContain(paso);
    expect(boton(nodo, t.activar)).toBeUndefined();
    expect((await axe.run(nodo)).violations).toEqual([]);
  });

  it('PRU-CMP-NOTIF-106 [CA-06.5] en un iPhone sin instalar el panel explica que hay que instalar Finn antes de activar', async () => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: AGENTE_IOS });
    const nodo = await montar(<PanelNotificaciones dispositivos={[]} registrar={ok} quitar={ok} />);
    expect(nodo.textContent).toContain(t.iosTitulo);
    expect(nodo.textContent).toContain(t.iosAyuda);
    expect(boton(nodo, t.activar)).toBeUndefined();
  });

  it('PRU-CMP-NOTIF-107 [CA-06.6] «Quitar» envía el id de la fila y, si era este dispositivo, anula la suscripción local', async () => {
    const quitar = vi.fn(() => Promise.resolve({ ok: true }));
    const propia = suscripcion();
    simularNavegador('granted', propia);
    const dispositivos: DispositivoPush[] = [
      {
        id: 'id-este',
        endpointCorto: endpointCorto(ENDPOINT),
        agente: 'Pixel',
        renovadaEn: '2027-02-05T16:00:00.000Z',
      },
      {
        id: 'id-otro',
        endpointCorto: 'otro.example.test…12345678',
        renovadaEn: '2027-02-04T16:00:00.000Z',
      },
    ];
    const nodo = await montar(
      <PanelNotificaciones dispositivos={dispositivos} registrar={ok} quitar={quitar} />,
    );
    expect(nodo.textContent).toContain(t.esteDispositivo);
    expect((await axe.run(nodo)).violations).toEqual([]);

    await tocar(boton(nodo, /Quitar Dispositivo sin nombre/));
    expect(quitar).toHaveBeenLastCalledWith({ id: 'id-otro' });
    expect(propia.unsubscribe).not.toHaveBeenCalled();

    await tocar(boton(nodo, /Quitar Pixel/));
    expect(quitar).toHaveBeenLastCalledWith({ id: 'id-este' });
    expect(propia.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
