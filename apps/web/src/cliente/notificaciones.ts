'use client';
// Notificaciones del dispositivo (05 §8.6, FE-57, CP-5). El permiso solo se pide tras un gesto (`activar`); la suscripción
// se renueva sin preguntar una vez por pestaña (`renovar`). Nada de esto guarda datos del servidor: lo único local es la
// tarjeta descartada (`localStorage`) y la marca de «ya renovada» de la pestaña (`sessionStorage`).
import { useEffect, useState } from 'react';
import { endpointCorto } from '../formularios/endpoint-corto';
import { almacen } from './almacen';
import { instalada, esIos } from './instalacion';

export type EstadoPermiso =
  'cargando' | 'sin_decidir' | 'concedido' | 'denegado' | 'no_disponible' | 'ios_sin_instalar';

const CLAVE_DESCARTADA = 'finn-notificaciones-descartada';
const CLAVE_RENOVADA = 'finn-push-renovada';

export type RegistrarSuscripcion = (cruda: unknown) => Promise<{ readonly ok: boolean }>;

function leerPermiso(): EstadoPermiso {
  if (esIos() && !instalada()) return 'ios_sin_instalar';
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator))
    return 'no_disponible';
  const p = Notification.permission;
  return p === 'granted' ? 'concedido' : p === 'denied' ? 'denegado' : 'sin_decidir';
}

/** El permiso del navegador; en el servidor y en la hidratación es `cargando`. */
export function usePermiso(): [EstadoPermiso, () => void] {
  const [permiso, setPermiso] = useState<EstadoPermiso>('cargando');
  useEffect(() => {
    setPermiso(leerPermiso());
    // E5-16: «esta pantalla se actualiza sola» cuando se cambia el permiso en los ajustes del navegador.
    let estado: PermissionStatus | undefined;
    const alCambiar = (): void => {
      setPermiso(leerPermiso());
    };
    let vivo = true;
    const permisos = navigator.permissions as Permissions | undefined; // no existe en todos los navegadores
    void permisos?.query({ name: 'notifications' }).then(
      (s) => {
        if (!vivo) return;
        estado = s;
        s.addEventListener('change', alCambiar);
      },
      () => undefined,
    );
    return () => {
      vivo = false;
      estado?.removeEventListener('change', alCambiar);
    };
  }, []);
  return [
    permiso,
    () => {
      setPermiso(leerPermiso());
    },
  ];
}

/** `endpointCorto` de la suscripción de este dispositivo (04 §6.11, CH-73); `null` si no hay. */
export async function endpointCortoDeEsteDispositivo(): Promise<string | null> {
  if (!('serviceWorker' in navigator)) return null;
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  return sub === null ? null : endpointCorto(sub.endpoint);
}

/** La clave pública VAPID (Next la escribe en el paquete al compilar: solo vale con el acceso `process.env.NEXT_PUBLIC_…`). */
function claveVapid(): Uint8Array<ArrayBuffer> {
  const texto =
    typeof process === 'undefined' ? '' : (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '');
  const base64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

/** OPT-02 con la suscripción del dispositivo (la crea si no hay). `false` si algo falló. */
async function suscribirYRegistrar(registrar: RegistrarSuscripcion): Promise<boolean> {
  try {
    const registro = await navigator.serviceWorker.ready;
    const sub =
      (await registro.pushManager.getSubscription()) ??
      (await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveVapid(),
      }));
    const { endpoint, keys } = sub.toJSON();
    const r = await registrar({
      endpoint,
      claves: { p256dh: keys?.['p256dh'], auth: keys?.['auth'] },
      agente: navigator.userAgent.slice(0, 500),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Tras un toque: pide el permiso y, si lo conceden, suscribe y registra (OPT-02). */
export async function activar(registrar: RegistrarSuscripcion): Promise<boolean> {
  if ((await Notification.requestPermission()) !== 'granted') return false;
  return suscribirYRegistrar(registrar);
}

/** Con el permiso concedido: renueva `renovada_en` (OPT-02) una sola vez por pestaña, sin preguntar nada. */
export async function renovar(registrar: RegistrarSuscripcion): Promise<void> {
  if (leerPermiso() !== 'concedido' || almacen.leer(CLAVE_RENOVADA) !== null) return;
  almacen.escribir(CLAVE_RENOVADA, '1');
  if (!(await suscribirYRegistrar(registrar))) almacen.borrar(CLAVE_RENOVADA);
}

/** Anula la suscripción local de este dispositivo (al quitarlo de la lista). */
export async function anularLocal(): Promise<void> {
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  await sub?.unsubscribe();
}

export const tarjetaDescartada = (): boolean => almacen.leerLocal(CLAVE_DESCARTADA) !== null;
export const descartarTarjeta = (): void => {
  almacen.escribirLocal(CLAVE_DESCARTADA, '1');
};
