// Envío de push (04 §11.1, §11.6; ADR-12; BE-53) y OPT-02 / OPT-03 (04 §3.10). La notificación se registra primero (es la
// fuente de verdad) y el envío de red va siempre después del COMMIT, sin bloqueo ni transacción abierta. `web-push`
// cifra y firma con VAPID (`generateRequestDetails`); la petición la hace `fetch`, con plazo y sin reintentos. Las claves
// salen de la configuración y no llegan a ningún mensaje ni registro: `push_error` son códigos fijos.
import webpush from 'web-push';
import {
  ahoraDb,
  contarSmsRecientes,
  eliminarSuscripcion,
  escribirTecnico as escribirTecnicoDb,
  guardarSuscripcion,
  leer as leerDb,
  listarSuscripciones,
  registrarEvento,
  registrarPush,
  type NuevoEvento,
  type OpcionesTx,
} from '@finn/db';
import { leerConfiguracion } from '../config/index.ts';
import {
  destinoNotificacion,
  optEliminarSuscripcion,
  optSuscripcion,
} from '../contratos/notificaciones.ts';
import { errorDeValidacion, type ResultadoAccion } from '../errores/index.ts';
import type { DepsMarco } from '../operaciones/marco.ts';
import type { MotivoNotificacion } from './motivos.ts';
import { esMotivoSms, MAXIMO_CARGA_BYTES, peticionDe, type PeticionPush } from './politica.ts';
import { registrarNotificacion, type DatosNotificacion } from './registro.ts';

export interface ClavesVapid {
  readonly publica: string;
  readonly privada: string;
  readonly sujeto: string;
}

export interface DepsEnvio extends Pick<
  DepsMarco,
  'leer' | 'escribirTecnico' | 'opciones' | 'registrar'
> {
  /** Por omisión, de `leerConfiguracion()` (04 §14.2): se lee solo si hay a quién enviar. */
  readonly vapid?: () => ClavesVapid;
  /** Por omisión, `fetch`; las pruebas lo apuntan al receptor local (07 §7.1). */
  readonly red?: typeof fetch;
}

export interface AvisoPush extends DatosNotificacion {
  /** Fecha local que acota el TTL de CF-07 y CF-24. */
  readonly fechaLimite?: string;
}

const PLAZO_MS = 10_000;
const ELIMINAN_SUSCRIPCION = new Set([404, 410]);
type Suscripcion = Awaited<ReturnType<typeof listarSuscripciones>>[number];

const clavesDeConfiguracion = (): ClavesVapid => {
  const c = leerConfiguracion();
  return {
    publica: c.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privada: c.VAPID_PRIVATE_KEY,
    sujeto: c.VAPID_SUBJECT,
  };
};

/** El estado HTTP del servicio de push, o `'red'` si no hubo respuesta. */
async function entregar(
  s: Suscripcion,
  p: PeticionPush,
  claves: ClavesVapid,
  red: typeof fetch,
): Promise<number | 'red'> {
  try {
    const r = webpush.generateRequestDetails(
      { endpoint: s.endpoint, keys: { p256dh: s.claveP256dh, auth: s.claveAuth } },
      JSON.stringify(p.carga),
      {
        TTL: p.ttl,
        urgency: p.urgencia,
        ...(p.topic === undefined ? {} : { topic: p.topic }),
        vapidDetails: {
          subject: claves.sujeto,
          publicKey: claves.publica,
          privateKey: claves.privada,
        },
      },
    );
    const respuesta = await red(r.endpoint, {
      method: r.method,
      headers: r.headers,
      body: new Uint8Array(r.body),
      signal: AbortSignal.timeout(PLAZO_MS),
    });
    return respuesta.status;
  } catch {
    return 'red'; // sin el error: podría nombrar claves o el endpoint
  }
}

/** Envía a cada dispositivo y deja `push_enviada_en` o `push_error` (11.6). */
async function enviarARegistrada(
  id: string,
  motivo: MotivoNotificacion,
  aviso: AvisoPush,
  d: DepsEnvio,
): Promise<void> {
  const opciones = d.opciones?.();
  const escribir = d.escribirTecnico ?? escribirTecnicoDb;
  const { suscripciones, ahora, smsRecientes } = await (d.leer ?? leerDb)(
    async (tx) => ({
      suscripciones: await listarSuscripciones(tx),
      ahora: await ahoraDb(tx),
      smsRecientes: esMotivoSms(motivo) ? await contarSmsRecientes(tx) : 0,
    }),
    opciones,
  );
  const destino = destinoNotificacion.safeParse(aviso.datos?.['destino']);
  const peticion = peticionDe(motivo, {
    notificacionId: id,
    titulo: aviso.titulo,
    cuerpo: aviso.cuerpo,
    ahoraMs: ahora.getTime(),
    smsRecientes,
    ...(destino.success ? { destino: destino.data } : {}),
    ...(aviso.fechaLimite === undefined ? {} : { fechaLimite: aviso.fechaLimite }),
  });
  if (peticion === null) return;

  const estados: (number | 'red')[] = [];
  const grande = Buffer.byteLength(JSON.stringify(peticion.carga)) > MAXIMO_CARGA_BYTES;
  if (grande) estados.push(413);
  else if (suscripciones.length > 0) {
    const claves = (d.vapid ?? clavesDeConfiguracion)();
    for (const s of suscripciones) {
      const estado = await entregar(s, peticion, claves, d.red ?? fetch);
      estados.push(estado);
      if (typeof estado === 'number' && ELIMINAN_SUSCRIPCION.has(estado))
        await escribir((tx) => eliminarSuscripcion(tx, s.endpoint), opciones);
    }
  }
  const enviada = estados.includes(201);
  const fallo = estados.find((e) => e !== 201);
  const error = fallo === undefined ? 'sin_suscripciones' : `push_${fallo}`;
  await escribir(async (tx) => {
    await registrarPush(tx, id, enviada ? 'enviada' : { error });
    // 11.6: un 413 es un error de programación
    if (estados.includes(413))
      await registrarEvento(tx, {
        nivel: 'error',
        origen: 'app',
        mensaje: 'push_demasiado_grande',
        datos: { motivo },
      });
  }, opciones);
}

/**
 * Registra la notificación en su transacción [T] y, después del COMMIT, envía el push del motivo. Solo lanza si el
 * registro falla: un fallo del envío queda en un evento `error`, y la notificación sigue en el centro (11.6).
 */
export async function notificar(
  d: DepsEnvio,
  motivo: MotivoNotificacion,
  aviso: AvisoPush,
): Promise<string> {
  const escribir = d.escribirTecnico ?? escribirTecnicoDb;
  const { id, conPush } = await escribir(
    (tx) => registrarNotificacion(tx, motivo, aviso),
    d.opciones?.(),
  );
  if (!conPush) return id;
  try {
    await enviarARegistrada(id, motivo, aviso, d);
  } catch {
    const evento: NuevoEvento = {
      nivel: 'error',
      origen: 'app',
      mensaje: 'push_fallido',
      datos: { motivo },
    };
    const guardar = d.registrar
      ? d.registrar(evento)
      : escribir(async (tx) => {
          await registrarEvento(tx, evento);
        }, d.opciones?.());
    await guardar.catch(() => undefined);
  }
  return id;
}

/** OPT-02: inserta, o renueva `renovada_en` si el `endpoint` ya existe. */
export async function registrarSuscripcionPush(
  cruda: unknown,
  opciones?: () => OpcionesTx,
): Promise<ResultadoAccion<null>> {
  const e = optSuscripcion.safeParse(cruda);
  if (!e.success) return { ok: false, error: errorDeValidacion(e.error.issues) };
  await escribirTecnicoDb(
    (tx) =>
      guardarSuscripcion(tx, {
        endpoint: e.data.endpoint,
        claveP256dh: e.data.claves.p256dh,
        claveAuth: e.data.claves.auth,
        agente: e.data.agente ?? null,
      }),
    opciones?.(),
  );
  return { ok: true, valor: null, yaAplicada: false, avisos: [] };
}

/** OPT-03: natural (04 §4.6), repetirla elimina 0. */
export async function eliminarSuscripcionPush(
  cruda: unknown,
  opciones?: () => OpcionesTx,
): Promise<ResultadoAccion<{ readonly eliminadas: number }>> {
  const e = optEliminarSuscripcion.safeParse(cruda);
  if (!e.success) return { ok: false, error: errorDeValidacion(e.error.issues) };
  const eliminadas = await escribirTecnicoDb(
    (tx) => eliminarSuscripcion(tx, e.data.endpoint),
    opciones?.(),
  );
  return { ok: true, valor: { eliminadas }, yaAplicada: eliminadas === 0, avisos: [] };
}
