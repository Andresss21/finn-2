// Envío de push, política, suscripciones y acción de la notificación (TA-196, CH-43; 04 §11; BE-53, BE-54) contra PostgreSQL como `finn_app` y un receptor HTTP local en lugar del
// servicio de push (07 §7.1). Las claves VAPID y las del navegador se generan aquí: nunca hay un literal.
import { createDecipheriv, createECDH, hkdfSync, randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import webpush from 'web-push';
import { escribirSms, escribirTecnico, guardarSms, guardarSuscripcion, Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY } from '../../db/test/ayudantes/hechos-prueba.ts';
import { ejecutarAccionDeNotificacion, type PeticionAccion } from '../src/push/accion.ts';
import {
  eliminarSuscripcionPush,
  notificar,
  registrarSuscripcionPush,
  type DepsEnvio,
} from '../src/push/enviar.ts';
import { MOTIVOS, esMotivo, type MotivoNotificacion } from '../src/push/motivos.ts';
import { peticionDe } from '../src/push/politica.ts';
import { procesar } from '../src/sms/procesar.ts';
import type { DepsMarco } from '../src/operaciones/marco.ts';

const HORA = 3_600;
const DIA = 24 * HORA;
const ID = '00000000-0000-4000-8000-000000000901';
const USUARIO = '00000000-0000-4000-8000-000000000999';
const RECONOCIDO =
  'VISA 1234: has realizado una compra por USD 12.30 en el comercio SUPER SELECTOS 2027/02/04';

type Recibido = {
  ruta: string;
  urgencia: string | undefined;
  ttl: number;
  topic: string | undefined;
  vapid: string | undefined;
  carga: Record<string, unknown>;
};

/** Un navegador de mentira: sus claves descifran lo que el receptor recibe (RFC 8291). */
const navegador = () => {
  const ecdh = createECDH('prime256v1');
  const publica = ecdh.generateKeys();
  const auth = randomBytes(16);
  const descifrar = (cuerpo: Buffer): Record<string, unknown> => {
    const salt = cuerpo.subarray(0, 16);
    const largoClave = cuerpo.readUInt8(20);
    const servidor = cuerpo.subarray(21, 21 + largoClave);
    const cifrado = cuerpo.subarray(21 + largoClave);
    const info = Buffer.concat([Buffer.from('WebPush: info\0'), publica, servidor]);
    const ikm = Buffer.from(hkdfSync('sha256', ecdh.computeSecret(servidor), auth, info, 32));
    const derivar = (rotulo: string, n: number) =>
      Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from(`Content-Encoding: ${rotulo}\0`), n));
    const d = createDecipheriv('aes-128-gcm', derivar('aes128gcm', 16), derivar('nonce', 12));
    d.setAuthTag(cifrado.subarray(-16));
    const claro = Buffer.concat([d.update(cifrado.subarray(0, -16)), d.final()]);
    return JSON.parse(claro.subarray(0, claro.lastIndexOf(2)).toString('utf8')) as Record<
      string,
      unknown
    >;
  };
  return {
    p256dh: publica.toString('base64url'),
    auth: auth.toString('base64url'),
    descifrar,
  };
};

describe('PRU-INT-NOTIF', () => {
  const base = crearBasePrueba();
  const sql = (texto: string) => consultar(base.urlAdmin, texto);
  const cuenta = async (texto: string): Promise<number> => Number((await sql(texto))[0]);
  const claves = webpush.generateVAPIDKeys();
  const vapid = { publica: claves.publicKey, privada: claves.privateKey, sujeto: 'mailto:f@e.sv' };
  const nav = navegador();
  const recibidos: Recibido[] = [];
  let servidor: Server;
  let origen = '';

  /** Dependencias con el `hoy` de la base fijado (CT-01). */
  const deps = (): DepsMarco & DepsEnvio => ({
    memoria: new Memoria(),
    opciones: () => ({ reloj: { hoy: HOY, desfaseMs: 0 } }),
    vapid: () => vapid,
    // 03 exige https en `endpoint` (ck_suscripciones_endpoint): el dominio de prueba se apunta al receptor local
    red: (url, init) =>
      fetch(
        (url as string)
          .replace('https://push.invalid/caido', 'http://127.0.0.1:9/')
          .replace('https://push.invalid', origen),
        init,
      ),
    nuevoIdError: () => 'E-PRUEBA',
  });
  const suscribir = (ruta: string) =>
    escribirTecnico((tx) =>
      guardarSuscripcion(tx, {
        endpoint: `https://push.invalid/${ruta}`,
        claveP256dh: nav.p256dh,
        claveAuth: nav.auth,
      }),
    );

  beforeAll(async () => {
    process.env['DATABASE_URL'] = base.url;
    await escribirHechosDePrueba(base);
    servidor = createServer((req, res) => {
      const trozos: Buffer[] = [];
      req.on('data', (t: Buffer) => trozos.push(t));
      req.on('end', () => {
        const ruta = (req.url ?? '').slice(1);
        recibidos.push({
          ruta,
          urgencia: req.headers['urgency'] as string | undefined,
          ttl: Number(req.headers['ttl']),
          topic: req.headers['topic'] as string | undefined,
          vapid: req.headers['authorization'],
          carga: nav.descifrar(Buffer.concat(trozos)),
        });
        res.statusCode = /^\d{3}$/.test(ruta) ? Number(ruta) : 201;
        res.end();
      });
    });
    await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
    origen = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise((fin) => servidor.close(fin)));
  beforeEach(async () => {
    recibidos.length = 0;
    await sql('DELETE FROM finn.suscripciones_push; DELETE FROM finn.notificaciones');
  });

  it('PRU-INT-NOTIF-101 [CF-07, CF-24, AV-23, AV-17] política de 04 §11.2: urgencia, TTL, tema, etiqueta y acciones llegan al receptor por motivo; cambio_retroactivo no envía nada', async () => {
    await suscribir('ok');
    const esperado: Record<MotivoNotificacion, [string, number, string?, string[]?] | null> = {
      sms_nuevo: ['high', DIA, 'sms'],
      sms_coincidencia: ['high', DIA, 'sms', ['confirmar', 'rechazar']],
      sms_posible_duplicado: ['high', DIA, 'sms'],
      sms_no_reconocido: ['normal', DIA, 'sms'],
      sms_error: ['normal', DIA, 'sms'],
      registro_automatico: ['normal', DIA, 'programadas'],
      registro_automatico_fallido: ['normal', 3 * DIA, 'programadas'],
      ocurrencia_en_periodo_cerrado: ['normal', 7 * DIA],
      cierre_periodo: ['normal', 7 * DIA, 'cierre'],
      meta_vencida: ['low', 7 * DIA],
      // TTL hasta una fecha: -1 aquí; el valor exacto, con `ahoraMs` fijo, en la prueba de CF-07
      pago_tarjeta_proximo: ['normal', -1, 'tarjetas'],
      cuota_proxima: ['normal', -1, 'programadas'],
      respaldo_atrasado: ['normal', 3 * DIA, 'sistema'],
      restauracion_atrasada: ['normal', 3 * DIA, 'sistema'],
      deriva_catalogo: ['normal', 3 * DIA, 'sistema'],
      tarea_fallida: ['normal', 3 * DIA, 'sistema'],
      carga_incremental: ['normal', 3 * DIA, 'sistema'],
      cambio_retroactivo: null,
    };
    for (const m of Object.keys(MOTIVOS).filter(esMotivo)) {
      recibidos.length = 0;
      await sql('DELETE FROM finn.notificaciones'); // sin agrupar: cada motivo solo
      await notificar(deps(), m, {
        titulo: 'T',
        cuerpo: 'C',
        datos: { destino: { pantalla: 'diagnostico' } },
        fechaLimite: '2027-02-07',
      });
      const e = esperado[m];
      if (e === null) {
        expect(recibidos, m).toEqual([]);
        continue;
      }
      expect(recibidos, m).toHaveLength(1);
      const [r] = recibidos as [Recibido];
      expect(r.urgencia, m).toBe(e[0]);
      if (e[1] > 0) expect(r.ttl, m).toBe(e[1]);
      else expect(r.ttl, m).toBeGreaterThan(0);
      expect(r.topic, m).toBe(e[2]);
      expect(r.vapid, m).toMatch(/^vapid t=.+, k=/);
      expect(r.carga['etiqueta'], m).toBe(e[2]);
      expect(r.carga['acciones'], m).toEqual(e[3]);
      expect(r.carga['destino'], m).toEqual({ pantalla: 'diagnostico' });
      expect(typeof r.carga['notificacionId'], m).toBe('string');
    }
    // TTL hasta el final de la fecha en El Salvador (05:59:59 UTC del día siguiente)
    expect(
      peticionDe('pago_tarjeta_proximo', {
        notificacionId: ID,
        titulo: 'T',
        cuerpo: 'C',
        ahoraMs: Date.parse('2027-02-05T12:00:00Z'),
        fechaLimite: '2027-02-05',
      })?.ttl,
    ).toBe(17 * HORA + 59 * 60 + 59);
    // La clave privada nunca queda escrita
    expect(
      await cuenta(
        `SELECT count(*) FROM finn.eventos_sistema WHERE datos::text LIKE '%${vapid.privada}%'`,
      ),
    ).toBe(0);
  });

  it('PRU-INT-NOTIF-101 [AV-23] 11.6: 201 fija push_enviada_en; 404 y 410 eliminan la suscripción con push_error; 413 deja además un evento error; 500 y la red caída solo push_error, sin reintento', async () => {
    const enviar = (cuerpo = 'C') =>
      notificar(deps(), 'tarea_fallida', { titulo: 'T', cuerpo, datos: {} });
    const fila = async (id: string) =>
      (
        await sql(
          `SELECT coalesce(push_error, '-') || '|' || (push_enviada_en IS NOT NULL)
             FROM finn.notificaciones WHERE id = '${id}'`,
        )
      )[0];
    const suscripciones = () => cuenta('SELECT count(*) FROM finn.suscripciones_push');

    await suscribir('ok');
    expect(await fila(await enviar())).toBe('-|true');

    for (const ruta of ['404', '410']) {
      await sql('DELETE FROM finn.suscripciones_push');
      await suscribir(ruta);
      expect(await fila(await enviar())).toBe(`push_${ruta}|false`);
      expect(await suscripciones()).toBe(0);
    }

    await suscribir('413');
    expect(await fila(await enviar())).toBe('push_413|false');
    expect(await suscripciones()).toBe(1);
    expect(
      await cuenta(
        `SELECT count(*) FROM finn.eventos_sistema WHERE nivel = 'error' AND mensaje = 'push_demasiado_grande'`,
      ),
    ).toBe(1);

    await sql('DELETE FROM finn.suscripciones_push');
    await suscribir('500');
    recibidos.length = 0;
    expect(await fila(await enviar())).toBe('push_500|false');
    expect(recibidos).toHaveLength(1); // sin reintento
    expect(await suscripciones()).toBe(1);

    // Sin suscripciones no hay a quién enviar; `caido` va al puerto 9, que no escucha: error de red
    await sql('DELETE FROM finn.suscripciones_push');
    expect(await fila(await enviar())).toBe('sin_suscripciones|false');
    await escribirTecnico((tx) =>
      guardarSuscripcion(tx, {
        endpoint: 'https://push.invalid/caido',
        claveP256dh: nav.p256dh,
        claveAuth: nav.auth,
      }),
    );
    expect(await fila(await enviar())).toBe('push_red|false');

    // 11.4: una carga de más de 2 KB no sale
    await sql('DELETE FROM finn.suscripciones_push');
    await suscribir('ok');
    recibidos.length = 0;
    expect(await fila(await enviar('x'.repeat(2_100)))).toBe('push_413|false');
    expect(recibidos).toEqual([]);

    // Un 201 en un dispositivo y un 410 en otro: enviada, y la vencida se elimina
    await suscribir('410');
    expect(await fila(await enviar())).toBe('-|true');
    expect(await suscripciones()).toBe(1);
  });

  it('PRU-INT-NOTIF-101 [AV-23] 11.3: con más de 3 sms_* en 5 minutos el push es el agregado con destino bandeja, y el registro sigue siendo uno por SMS', async () => {
    await suscribir('ok');
    const sms = () =>
      notificar(deps(), 'sms_coincidencia', {
        titulo: 'Movimiento',
        cuerpo: 'Compra en SUPER por $1.00.',
        datos: { destino: { pantalla: 'movimiento', movimientoId: ID } },
      });
    for (let n = 0; n < 4; n++) await sms();
    expect(recibidos.map((r) => r.carga['cuerpo'])).toEqual([
      'Compra en SUPER por $1.00.',
      'Compra en SUPER por $1.00.',
      'Compra en SUPER por $1.00.',
      'Tenés 4 movimientos nuevos en la bandeja',
    ]);
    const ultimo = recibidos.at(-1) as Recibido;
    expect(ultimo.carga['destino']).toEqual({ pantalla: 'bandeja' });
    expect(ultimo.carga['acciones']).toBeUndefined();
    expect(ultimo.topic).toBe('sms');
    expect(await cuenta('SELECT count(*) FROM finn.notificaciones')).toBe(4);
  });

  it('PRU-INT-NOTIF-101 [AV-23] OPT-02 inserta o renueva por endpoint y solo acepta https; OPT-03 elimina y repetirla no falla', async () => {
    const entrada = {
      endpoint: 'https://push.example/s1',
      claves: { p256dh: nav.p256dh, auth: nav.auth },
      agente: 'Chrome',
    };
    const op = deps().opciones;
    expect(await registrarSuscripcionPush(entrada, op)).toMatchObject({ ok: true });
    await sql(`UPDATE finn.suscripciones_push SET renovada_en = now() - interval '3 days'`);
    expect(await registrarSuscripcionPush(entrada, op)).toMatchObject({ ok: true });
    expect(
      await cuenta(
        `SELECT count(*) FROM finn.suscripciones_push WHERE renovada_en > now() - interval '1 hour'`,
      ),
    ).toBe(1);
    expect(
      await registrarSuscripcionPush({ ...entrada, endpoint: 'http://push.example/s1' }, op),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
    const salir = { endpoint: entrada.endpoint };
    expect(await eliminarSuscripcionPush(salir, op)).toMatchObject({
      ok: true,
      valor: { eliminadas: 1 },
    });
    expect(await eliminarSuscripcionPush(salir, op)).toMatchObject({
      ok: true,
      valor: { eliminadas: 0 },
      yaAplicada: true,
    });
  });

  it('PRU-INT-NOTIF-101 [AV-23] BE-54: la acción exige Origin, X-Finn-Accion y AAL2 antes de tocar nada; ejecuta OP-40 y traduce 200, 401, 403 y 422', async () => {
    const sesion = (aal: string | null) => ({
      obtenerClaims: () => Promise.resolve(aal === null ? null : { sub: USUARIO, aal }),
      obtenerUsuario: () => Promise.resolve(aal === null ? null : { id: USUARIO }),
    });
    const { id: smsId } = await escribirSms(
      (tx) => guardarSms(tx, { texto: `${RECONOCIDO} accion`, remitente: 'BAC' }),
      { reloj: { hoy: HOY, desfaseMs: 0 } },
    );
    await procesar(smsId, deps());
    const movimientoId = (
      await sql(`SELECT id FROM finn.movimientos WHERE sms_id = '${smsId}'`)
    )[0] as string;
    const pet = (p: Partial<PeticionAccion> = {}): PeticionAccion => ({
      origen: 'https://finn.example',
      cabeceraAccion: '1',
      cuerpo: { notificacionId: ID, movimientoId, decision: 'rechazar' },
      ...p,
    });
    const d = (aal: string | null = 'aal2') => ({
      ...deps(),
      origenApp: 'https://finn.example',
      sesion: sesion(aal),
      usuarioPermitido: USUARIO,
    });
    const correr = async (p: Partial<PeticionAccion>, aal?: string | null) =>
      (await ejecutarAccionDeNotificacion(pet(p), d(aal))).estado;

    expect(await correr({ origen: 'https://otro.example' })).toBe(403);
    expect(await correr({ origen: null })).toBe(403);
    expect(await correr({ cabeceraAccion: null })).toBe(403);
    expect(await correr({}, null)).toBe(401);
    expect(await correr({}, 'aal1')).toBe(401);
    expect(await correr({ cuerpo: { notificacionId: ID, movimientoId, decision: 'x' } })).toBe(422);
    // Natural (4.6): repetirla responde igual
    expect(await correr({})).toBe(200);
    expect(await correr({})).toBe(200);
    expect(
      await correr({ cuerpo: { notificacionId: ID, movimientoId: ID, decision: 'rechazar' } }),
    ).toBe(422);
  });
});
