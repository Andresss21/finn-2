// Envío de push, política, suscripciones y acción de la notificación (TA-196, CH-43; 04 §11; BE-53, BE-54) contra PostgreSQL como `finn_app` y un receptor HTTP local en lugar del
// servicio de push (07 §7.1). Las claves VAPID y las del navegador se generan aquí: nunca hay un literal.
import { createDecipheriv, createECDH, hkdfSync, randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import webpush from 'web-push';
import {
  escribir,
  escribirSms,
  escribirTecnico,
  guardarSms,
  guardarSuscripcion,
  Memoria,
  type NuevoEvento,
} from '@finn/db';
import type { Instante } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
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
import {
  ejecutarDiaria,
  pasoAvisos,
  pasoCierre,
  pasoCuotaProxima,
  type PasoTarea,
} from '../src/tareas/diaria.ts';
import { OP01 } from '../src/operaciones/cuentas/index.ts';
import { confirmar, previsualizar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP42 } from '../src/operaciones/programadas/index.ts';
import { pasoRegistro } from '../src/tareas/registro-automatico.ts';

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
  const deps = (hoy: string = HOY, desfaseMs = 0): DepsMarco & DepsEnvio => ({
    memoria: new Memoria(),
    opciones: () => ({ reloj: { hoy, desfaseMs } }),
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
    await sql(
      `DELETE FROM finn.suscripciones_push; DELETE FROM finn.notificaciones; DELETE FROM finn.eventos_sistema; DELETE FROM finn.estado_respaldo;
       INSERT INTO finn.estado_respaldo (id, ultimo_respaldo_en, ultima_restauracion_en) VALUES (1, now(), now())`,
    );
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

  it('PRU-INT-NOTIF-101 11.6: 201 fija push_enviada_en; 404 y 410 eliminan la suscripción con push_error; 413 deja además un evento error; 500 y la red caída solo push_error, sin reintento', async () => {
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

  it('PRU-INT-NOTIF-103 [AV-23] 8.4 e: procesar un SMS registra AV-23 con push después del COMMIT, con comercio y monto y sin el texto del SMS; el autodescartado no notifica; el paso d también avisa; un fallo no toca el movimiento', async () => {
    const guardar = (texto: string) =>
      escribirSms((tx) => guardarSms(tx, { texto, remitente: 'BAC' }), {
        reloj: { hoy: HOY, desfaseMs: 0 },
      });
    const estado = async (smsId: string) =>
      (await sql(`SELECT estado FROM finn.movimientos WHERE sms_id = '${smsId}'`))[0];
    const intentos = (smsId: string) =>
      cuenta(`SELECT count(*) FROM finn.sms_procesamientos WHERE sms_id = '${smsId}'`);
    const notificaciones = () =>
      sql(`SELECT motivo || '|' || aviso || '|' || (push_enviada_en IS NOT NULL) || '|' ||
             (datos->'destino'->>'pantalla') FROM finn.notificaciones`);
    /** Lo registrado, sin el texto del SMS: ni en la notificación ni en los eventos. */
    const textoEnRegistros = () =>
      cuenta(`SELECT (SELECT count(*) FROM finn.notificaciones n WHERE n::text LIKE '%VISA 1234%')
                   + (SELECT count(*) FROM finn.eventos_sistema e WHERE e::text LIKE '%VISA 1234%')`);
    await suscribir('ok');

    // Con el movimiento ya visible desde otra conexión al llegar el push: el envío va después del COMMIT
    const texto = `${RECONOCIDO} 103`;
    const { id } = await guardar(texto);
    const d = deps();
    const alEnviar: unknown[] = [];
    const conCommit: typeof fetch = async (url, init) => {
      alEnviar.push(await estado(id));
      return (d.red as typeof fetch)(url, init);
    };
    expect(await procesar(id, { ...d, red: conCommit })).toBeUndefined();
    expect(alEnviar).toHaveLength(1);
    expect(alEnviar[0]).toBeDefined();
    expect(alEnviar[0]).toBe(await estado(id));
    expect(await notificaciones()).toEqual([
      expect.stringMatching(/^sms_\w+\|AV-23\|true\|movimiento$/),
    ]);
    const [r] = recibidos as [Recibido];
    expect(r.carga['cuerpo']).toContain('SUPER SELECTOS');
    expect(r.carga['cuerpo']).toContain('$12.30');
    expect(JSON.stringify(r.carga)).not.toContain('VISA 1234');
    expect(JSON.stringify(r.carga)).not.toContain('has realizado');
    expect(await textoEnRegistros()).toBe(0);

    // Mismo texto antes de 10 minutos: autodescartado (01 OP-35), sin notificación ni push
    recibidos.length = 0;
    const repetido = await guardar(texto);
    expect(await procesar(repetido.id, deps())).toBeUndefined();
    expect(await estado(repetido.id)).toBe('autodescartado');
    expect(await cuenta('SELECT count(*) FROM finn.notificaciones')).toBe(1);
    expect(recibidos).toEqual([]);

    // Paso d: el `error` avisa, sin el detalle ni el texto
    const malo = await guardar(`${RECONOCIDO} 103 paso d`);
    expect(await procesar(malo.id, deps(), 'detalle-del-cuerpo')).toBeUndefined();
    expect(await estado(malo.id)).toBe('error');
    expect(recibidos).toHaveLength(1);
    const [e] = recibidos as [Recibido];
    expect(e.carga['cuerpo']).toBe('Llegó un SMS que no pudimos leer. Revisalo en la bandeja.');
    expect(JSON.stringify(e.carga)).not.toContain('detalle-del-cuerpo');
    expect(JSON.stringify(e.carga)).not.toContain('VISA 1234');
    expect(await textoEnRegistros()).toBe(0);

    // El push falla (red caída): el movimiento queda, un solo intento, y `push_error` en la notificación
    await sql('DELETE FROM finn.suscripciones_push');
    await escribirTecnico((tx) =>
      guardarSuscripcion(tx, {
        endpoint: 'https://push.invalid/caido',
        claveP256dh: nav.p256dh,
        claveAuth: nav.auth,
      }),
    );
    const caido = await guardar(`${RECONOCIDO} 103 red`);
    expect(await procesar(caido.id, deps())).toBeUndefined();
    expect(await estado(caido.id)).not.toBe('error');
    expect(await intentos(caido.id)).toBe(1);
    expect(
      await cuenta(`SELECT count(*) FROM finn.notificaciones WHERE push_error = 'push_red'`),
    ).toBe(1);

    // Tampoco se pudo registrar la notificación: en c y en d, un evento y el movimiento intacto
    const eventos: NuevoEvento[] = [];
    const sinRegistro = (): DepsMarco & DepsEnvio => ({
      ...deps(),
      escribirTecnico: () => Promise.reject(new Error('sin registro')),
      registrar: (ev) => {
        eventos.push(ev);
        return Promise.resolve();
      },
    });
    const enC = await guardar(`${RECONOCIDO} 103 c`);
    expect(await procesar(enC.id, sinRegistro())).toBeUndefined();
    expect(await estado(enC.id)).not.toBe('error');
    const enD = await guardar(`${RECONOCIDO} 103 d`);
    expect(await procesar(enD.id, sinRegistro(), 'x')).toBeUndefined();
    expect(await estado(enD.id)).toBe('error');
    expect(await intentos(enD.id)).toBe(1);
    expect(eventos.map((ev) => ev.mensaje)).toEqual(['EFECTO AV-23 OP-35', 'EFECTO AV-23 OP-35']);
    expect(JSON.stringify(eventos)).not.toContain('VISA 1234');
  });

  it('PRU-INT-NOTIF-101 OPT-02 inserta o renueva por endpoint y solo acepta https; OPT-03 elimina y repetirla no falla', async () => {
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

  it('PRU-INT-NOTIF-101 BE-54: la acción exige Origin, X-Finn-Accion y AAL2 antes de tocar nada; ejecuta OP-40 y traduce 200, 401, 403 y 422', async () => {
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

  it('PRU-INT-NOTIF-102 BE-51, TAREA-pasos3y4 (paso 3): un solo push de cierre, del último período cerrado; los anteriores quedan en eventos_sistema y una segunda corrida no repite', async () => {
    await suscribir('ok');
    const cierres = () =>
      sql(
        `SELECT (datos->>'clave') || '|' || (aviso IS NULL) FROM finn.notificaciones WHERE motivo = 'cierre_periodo'`,
      );
    const sinPush = () =>
      sql(
        `SELECT datos->>'periodoInicio' FROM finn.eventos_sistema WHERE mensaje = 'cierre_sin_push' ORDER BY id`,
      );
    // Sin período cerrado no hay nada que avisar: el primero de los hechos sigue activo el 05/02
    expect((await pasoCierre.ejecutar(deps())).cantidad).toBe(0);
    expect(recibidos).toEqual([]);

    // El 05/05 ya cerraron varios períodos. La vigencia del día 15 rige desde el 21/04: el activo empezó ahí
    const hoy = '2027-05-05';
    expect((await pasoCierre.ejecutar(deps(hoy))).cantidad).toBe(1);
    expect(await cierres()).toEqual(['cierre:2027-03-21|true']);
    expect(recibidos).toHaveLength(1);
    const [r] = recibidos as [Recibido];
    expect(r.carga['cuerpo']).toMatch(/^Cerró el período del 21\/03 al 20\/04\./);
    expect(r.carga['destino']).toEqual({ pantalla: 'presupuesto', periodoInicio: '2027-03-21' });
    expect(r.topic).toBe('cierre');
    expect(r.urgencia).toBe('normal');
    expect(r.ttl).toBe(7 * DIA);
    const anteriores = await sinPush();
    expect(anteriores[0]).toBe('2027-02-21');
    expect(anteriores).not.toContain('2027-03-21');

    // Idempotente (10.3): la misma clave no vuelve a enviar ni a registrar
    expect((await pasoCierre.ejecutar(deps(hoy))).cantidad).toBe(0);
    expect(await cierres()).toHaveLength(1);
    expect(recibidos).toHaveLength(1);
    expect(await sinPush()).toEqual(anteriores);
  });

  it('PRU-INT-NOTIF-102 [CF-07, CF-24] TAREA-pasos3y4 (paso 4): pago_tarjeta_proximo y cuota_proxima una vez por clave; la cuota también con pasoCuotaProxima, el paso que agrega la puesta al día; quedan fuera las automáticas, las inactivas y las del tramo inactivo', async () => {
    await suscribir('ok');
    const [cuentaId] = await sql(`SELECT cuenta_id FROM finn.programadas WHERE tipo = 'gasto'`);
    const [prestamoId] = await sql('SELECT cuenta_id FROM finn.prestamos');
    const [categoriaId] = await sql(
      `SELECT id FROM finn.categorias WHERE clase = 'normal' LIMIT 1`,
    );
    const IDS = ['f01', 'f03', 'f05', 'f07'].map((n) => `00000000-0000-4000-8000-000000000${n}`);
    const cuota = (n: number, comercio: string, extra: Record<string, unknown>) => {
      const id = IDS[n] as string;
      return [
        {
          tipo: 'insertar' as const,
          tabla: 'programadas' as const,
          fila: {
            id,
            tipo: 'cuota_prestamo',
            cuentaId,
            cuentaDestinoId: prestamoId,
            comercio,
            monto: 12345,
            tolerancia: 0,
            frecuencia: 'mensual',
            frecuenciaDias: null,
            primeraFecha: FechaLocal.desdeTexto('2027-02-06'),
            fechaFin: null,
            registroAutomatico: false,
            activa: true,
            reactivadaDesde: null,
            ...extra,
          } as never,
        },
        {
          tipo: 'insertar' as const,
          tabla: 'programada_lineas' as const,
          fila: {
            id: id.replace('000f0', '000e0'),
            programadaId: id,
            orden: 1,
            monto: 12345,
            categoriaId,
          } as never,
        },
      ];
    };
    await escribir(
      (tx) =>
        tx.aplicarCambios([
          ...cuota(0, 'Banco Hipotecario', {}),
          ...cuota(1, 'Automatica', { registroAutomatico: true }),
          ...cuota(2, 'Inactiva', { activa: false }),
          ...cuota(3, 'Reactivada', { reactivadaDesde: FechaLocal.desdeTexto('2027-03-20') }),
        ]),
      { reloj: { hoy: HOY, desfaseMs: 0 } },
    );
    const de = (motivo: string) =>
      sql(
        `SELECT cuerpo || '|' || (datos->>'clave') || '|' || (aviso IS NULL) FROM finn.notificaciones WHERE motivo = '${motivo}'`,
      );

    // Faltan 3 días: el aviso sale una vez y la tarea no lo repite, sin las otras tres (06 §3.16)
    await pasoAvisos.ejecutar(deps('2027-02-03'));
    await pasoAvisos.ejecutar(deps('2027-02-03'));
    await pasoAvisos.ejecutar(deps('2027-02-05'));
    expect(await de('cuota_proxima')).toEqual([
      expect.stringMatching(
        /^Cuota de Banco Hipotecario por \$123\.45 el 06\/02\. Registrala cuando la pagues\.\|cuota:.+:2027-02-06\|true$/,
      ),
    ]);
    const aviso = recibidos.find((r) => r.carga['titulo'] === 'Cuota próxima') as Recibido;
    expect(aviso.topic).toBe('programadas');
    expect(aviso.urgencia).toBe('normal');
    expect(aviso.carga['destino']).toEqual({
      pantalla: 'programada',
      programadaId: IDS[0],
      fechaEsperada: '2027-02-06',
    });

    // Fuera de la ventana: la de marzo a 5 días todavía no; a 3 días, sí, y la puesta al día ya basta (`pasoCuotaProxima`)
    await pasoAvisos.ejecutar(deps('2027-03-01'));
    expect(await de('cuota_proxima')).toHaveLength(1);
    const puesta = await pasoCuotaProxima.ejecutar(deps('2027-03-03'));
    expect(puesta.cantidad).toBe(1);
    expect(await de('cuota_proxima')).toHaveLength(2);
    await pasoAvisos.ejecutar(deps('2027-03-03'));
    expect(await de('cuota_proxima')).toHaveLength(2);

    // La deuda del ciclo que cortó el 15/02 se paga el 05/03: una por tarjeta y fp, sin monto (FD-31)
    await pasoAvisos.ejecutar(deps('2027-03-04'));
    await pasoAvisos.ejecutar(deps('2027-03-05'));
    const tarjeta = await de('pago_tarjeta_proximo');
    expect(tarjeta).toHaveLength(1);
    expect(tarjeta[0]).toMatch(
      /^Visa: tu fecha de pago es el 05\/03\. Revisá cuánto pagar para no generar intereses\.\|pago_tarjeta:.+:2027-03-05\|true$/,
    );
    expect(tarjeta[0]).not.toContain('$');
    const push = recibidos.find((r) => r.carga['etiqueta'] === 'tarjetas') as Recibido;
    expect(push.carga['destino']).toMatchObject({ pantalla: 'cuenta' });
    expect(JSON.stringify(push.carga)).not.toContain('$');

    // Sin dejar programadas para los demás casos (el orden es aleatorio, 07 §7.1)
    await escribir(
      (tx) =>
        tx.aplicarCambios(
          IDS.flatMap((id) => [
            {
              tipo: 'eliminar' as const,
              tabla: 'programada_lineas' as const,
              id: id.replace('000f0', '000e0'),
            },
            { tipo: 'eliminar' as const, tabla: 'programadas' as const, id },
          ]) as never,
        ),
      { reloj: { hoy: HOY, desfaseMs: 0 } },
    );
  });

  it('PRU-INT-NOTIF-102 TAREA-pasos3y4 (avisos de sistema): respaldo de más de 36 h, restauración de más de 35 días, deriva informada y el disparador por egreso, una vez por clave; recientes no avisan; un nulo o la falta de fila miden el mismo plazo desde el primer hecho (CH-47)', async () => {
    const motivos = () =>
      sql(`SELECT motivo FROM finn.notificaciones WHERE motivo IN
        ('respaldo_atrasado', 'restauracion_atrasada', 'deriva_catalogo', 'carga_incremental') ORDER BY motivo`);
    const respaldo = (horas: number, dias: number) =>
      sql(`INSERT INTO finn.estado_respaldo (id, ultimo_respaldo_en, ultima_restauracion_en)
        VALUES (1, now() - interval '${horas} hours', now() - interval '${dias} days')
        ON CONFLICT (id) DO UPDATE SET ultimo_respaldo_en = EXCLUDED.ultimo_respaldo_en, ultima_restauracion_en = EXCLUDED.ultima_restauracion_en`);

    // [CH-47] Sin marca, cada plazo se mide desde el primer hecho. El desfase lleva el reloj simulado a `minutos` después
    // de la `fecha_apertura` más antigua, a medianoche local: si fuera la de UTC, los casos "dentro" ya avisarían.
    const tras = async (minutos: number) =>
      deps(
        HOY,
        Number(
          (
            await sql(`SELECT round(extract(epoch FROM (
              (SELECT min(fecha_apertura) FROM finn.cuentas)::timestamp AT TIME ZONE 'America/El_Salvador'
              + interval '${minutos} minutes' - now())) * 1000)`)
          )[0],
        ),
      );
    const H36 = 36 * 60;
    const D35 = 35 * 24 * 60;
    await sql(`DELETE FROM finn.estado_respaldo`);
    await pasoAvisos.ejecutar(await tras(H36 - 1));
    expect(await motivos()).toEqual([]);
    await pasoAvisos.ejecutar(await tras(H36 + 1));
    await pasoAvisos.ejecutar(await tras(H36 + 1));
    expect(await motivos()).toEqual(['respaldo_atrasado']);
    // La fila con las columnas nulas es lo mismo que no tener fila, y la clave no se repite
    await sql(`INSERT INTO finn.estado_respaldo (id) VALUES (1)`);
    await pasoAvisos.ejecutar(await tras(D35 - 1));
    expect(await motivos()).toEqual(['respaldo_atrasado']);
    const atrasados = ['respaldo_atrasado', 'restauracion_atrasada'];
    await pasoAvisos.ejecutar(await tras(D35 + 1));
    await pasoAvisos.ejecutar(await tras(D35 + 1));
    expect(await motivos()).toEqual(atrasados);
    expect(
      await sql(`SELECT datos->>'clave', cuerpo FROM finn.notificaciones
        WHERE motivo IN ('respaldo_atrasado', 'restauracion_atrasada') ORDER BY motivo`),
    ).toEqual([
      `respaldo:${HOY}|Todavía no hay ningún respaldo registrado. Revisá Diagnóstico.`,
      `restauracion:${HOY}|Todavía no hay ninguna prueba de restauración registrada. Revisá Diagnóstico.`,
    ]);
    // Cuenta el menor de los dos hechos: un carga_completa 100 horas anterior a la apertura adelanta el plazo
    await sql(`DELETE FROM finn.notificaciones;
      INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos, ocurrido_en)
      VALUES ('info', 'motor', 'carga_completa', '{"bytes": 1000, "ms": 80}',
        (SELECT min(fecha_apertura) FROM finn.cuentas)::timestamp AT TIME ZONE 'America/El_Salvador' - interval '100 hours')`);
    await pasoAvisos.ejecutar(await tras(H36 - 100 * 60 + 1));
    expect(await motivos()).toEqual(['respaldo_atrasado']);
    await sql(`DELETE FROM finn.eventos_sistema`);
    // Cada columna cuenta por su lado: con el respaldo al día en el reloj simulado, solo la restauración
    await sql(`DELETE FROM finn.notificaciones`);
    const tarde = await tras(D35 + 1);
    const desfase = tarde.opciones?.().reloj?.desfaseMs ?? 0;
    await sql(`UPDATE finn.estado_respaldo
      SET ultimo_respaldo_en = now() + ${desfase} * interval '1 millisecond', ultima_restauracion_en = NULL`);
    await pasoAvisos.ejecutar(tarde);
    expect(await motivos()).toEqual(['restauracion_atrasada']);
    await sql(`DELETE FROM finn.notificaciones`);

    await respaldo(35, 34);
    await pasoAvisos.ejecutar(deps());
    expect(await motivos()).toEqual([]);

    await respaldo(37, 36);
    await sql(`INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos)
      VALUES ('error', 'respaldo', 'deriva', '{"control": "C5", "filas": 1}'),
             ('info', 'motor', 'carga_completa', '{"bytes": 700000000, "ms": 80}')`);
    await suscribir('ok');
    await pasoAvisos.ejecutar(deps());
    expect(await motivos()).toEqual([
      'carga_incremental',
      'deriva_catalogo',
      'respaldo_atrasado',
      'restauracion_atrasada',
    ]);
    const sistema = recibidos.filter((r) => r.topic === 'sistema');
    expect(sistema).toHaveLength(4);
    for (const r of sistema) {
      expect(r.ttl).toBe(3 * DIA);
      expect(r.carga['destino']).toEqual({ pantalla: 'diagnostico' });
    }
    await pasoAvisos.ejecutar(deps());
    expect(await motivos()).toHaveLength(4);
    expect(recibidos.filter((r) => r.topic === 'sistema')).toHaveLength(4);
    expect(
      await cuenta(
        `SELECT count(*) FROM finn.eventos_sistema WHERE nivel = 'aviso' AND mensaje = 'carga_incremental'`,
      ),
    ).toBe(1);
  });

  it('PRU-INT-NOTIF-102 5.6: el disparador por latencia pide p95 de más de 500 ms en cada uno de los 7 días', async () => {
    const cargas = (ms: readonly number[]) =>
      sql(
        `DELETE FROM finn.eventos_sistema WHERE origen = 'motor';` +
          ms
            .map(
              (
                v,
                n,
              ) => `INSERT INTO finn.eventos_sistema (ocurrido_en, nivel, origen, mensaje, datos)
                VALUES (now() - interval '${n} days', 'info', 'motor', 'carga_completa', '{"bytes": 1000, "ms": ${v}}')`,
            )
            .join(';'),
      );
    const avisos = () =>
      cuenta(`SELECT count(*) FROM finn.notificaciones WHERE motivo = 'carga_incremental'`);
    await cargas([600, 600, 600, 600, 600, 600]); // solo 6 días
    await pasoAvisos.ejecutar(deps());
    expect(await avisos()).toBe(0);
    await cargas([600, 600, 600, 500, 600, 600, 600]); // un día en 500 no supera
    await pasoAvisos.ejecutar(deps());
    expect(await avisos()).toBe(0);
    await cargas([600, 600, 600, 600, 600, 600, 600]);
    await pasoAvisos.ejecutar(deps());
    expect(await avisos()).toBe(1);
  });

  it('PRU-INT-NOTIF-102 [AV-17] paso 4: la meta vencida avisa una vez por meta y fecha objetivo, sin monto', async () => {
    await suscribir('ok');
    const [grupoId] = await sql(
      `SELECT grupo_id FROM finn.categorias WHERE clase = 'normal' LIMIT 1`,
    );
    const categoriaId = '00000000-0000-4000-8000-000000000f10';
    const META = '00000000-0000-4000-8000-000000000f11';
    await escribir(
      (tx) =>
        tx.aplicarCambios([
          {
            tipo: 'insertar',
            tabla: 'categorias',
            fila: {
              id: categoriaId,
              grupoId,
              nombre: 'Viaje de prueba',
              orden: 99,
              clase: 'normal',
              tarjetaId: null,
              archivada: false,
            } as never,
          },
          {
            tipo: 'insertar',
            tabla: 'metas',
            fila: {
              id: META,
              categoriaId,
              tipo: 'para_fecha',
              modo: null,
              monto: 99999999,
              fechaObjetivo: FechaLocal.desdeTexto('2027-02-10'),
              fechaCreacion: FechaLocal.desdeTexto('2027-01-21'),
            } as never,
          },
        ]),
      { reloj: { hoy: HOY, desfaseMs: 0 } },
    );
    await pasoAvisos.ejecutar(deps());
    expect(recibidos).toEqual([]); // todavía no vence
    await pasoAvisos.ejecutar(deps('2027-02-11'));
    await pasoAvisos.ejecutar(deps('2027-02-12'));
    const filas = await sql(
      `SELECT aviso || '|' || (datos->>'clave') FROM finn.notificaciones WHERE datos->>'clave' LIKE '%${META}%'`,
    );
    expect(filas).toEqual([`AV-17|av17:${META}:2027-02-10`]);
    const r = recibidos.find(
      (x) =>
        (x.carga['destino'] as { categoriaId?: string } | undefined)?.categoriaId === categoriaId,
    ) as Recibido;
    expect(r.urgencia).toBe('low');
    expect(r.carga['destino']).toEqual({ pantalla: 'categoria', categoriaId });
    expect(r.carga['cuerpo']).not.toContain('$');
    await escribir(
      (tx) =>
        tx.aplicarCambios([
          { tipo: 'eliminar', tabla: 'metas', id: META },
          { tipo: 'eliminar', tabla: 'categorias', id: categoriaId },
        ] as never),
      { reloj: { hoy: HOY, desfaseMs: 0 } },
    );
  });

  it('PRU-INT-NOTIF-102 10.3: si un paso falla sale un push tarea_fallida, una vez por día; sin suscripciones la notificación queda registrada', async () => {
    const roto: PasoTarea = { n: 4, ejecutar: () => Promise.reject(new Error('x')) };
    const de = () =>
      sql(
        `SELECT coalesce(push_error, '-') || '|' || (push_enviada_en IS NOT NULL) FROM finn.notificaciones WHERE motivo = 'tarea_fallida'`,
      );
    await ejecutarDiaria(deps(), [roto]);
    expect(await de()).toEqual(['sin_suscripciones|false']);

    await sql('DELETE FROM finn.notificaciones');
    await suscribir('ok');
    await ejecutarDiaria(deps(), [roto]);
    await ejecutarDiaria(deps(), [roto]);
    expect(await de()).toEqual(['-|true']);
    expect(recibidos).toHaveLength(1);
    const [r] = recibidos as [Recibido];
    expect(r.carga['titulo']).toBe('La tarea diaria tuvo un error');
    expect(r.carga['cuerpo']).toBe('Revisá Diagnóstico.');
    expect(r.carga['destino']).toEqual({ pantalla: 'diagnostico' });
    expect(r.topic).toBe('sistema');
  });

  it('PRU-INT-NOTIF-102 [AV-23] paso 1 (CH-47): registro_automatico, registro_automatico_fallido y ocurrencia_en_periodo_cerrado envían su push después de registrar, una vez por clave', async () => {
    await suscribir('ok');
    const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    const E1 = uuid(1);
    const C1 = uuid(11);
    const LM = uuid(9300);
    const programada = (id: string, comercio: string, primeraFecha: string, x: object = {}) => ({
      accion: 'crear',
      id,
      tipo: 'gasto',
      cuentaId: E1,
      comercio,
      monto: '10.00',
      frecuencia: 'mensual',
      primeraFecha,
      registroAutomatico: true,
      lineas: [{ monto: '10.00', categoriaId: C1 }],
      ...x,
    });
    // Abierto el 15 dic: cuotas el 15 ene y el 15 feb; el 31 ene no coincide con ninguna, y el registro falla
    const alta = {
      id: LM,
      tipo: 'prestamo',
      nombre: 'Con modelo',
      saldo: '10000.00',
      fechaApertura: '2026-12-15',
      contraparte: 'Banco',
      montoOriginal: '10000.00',
      tasaNominalAnual: '12',
      tipoTasa: 'fija',
      seguroPrimerMes: '10.00',
      frecuencia: 'mensual',
      cuotaPactada: '500.00',
      plazoCuotas: 24,
      modeloCalculo: 'banco_agricola',
      cuotasPagadasAlCrear: 0,
    };
    const vista = await previsualizar(OP01, alta, {
      ...deps(),
      instante: () => `${HOY}T12:00:00.000Z` as Instante,
    });
    expect(
      await confirmar(
        OP01,
        { ...alta, huellaImpacto: vista.ok ? vista.valor.huellaImpacto : null },
        deps(),
      ),
    ).toMatchObject({ ok: true });
    const CERRADA = uuid(9302);
    const FALLA = uuid(9303);
    for (const p of [
      programada(uuid(9301), 'Gimnasio', '2027-01-22'),
      programada(CERRADA, 'Club', '2027-01-10'),
      programada(FALLA, 'Cuota', '2027-01-31', { tipo: 'cuota_prestamo', cuentaDestinoId: LM }),
    ])
      expect(await confirmar(OP42, p, deps())).toMatchObject({ ok: true });

    const tarea = { ...deps(), nuevoIdError: () => 'E-PRUEBA' };
    await pasoRegistro.ejecutar(tarea);
    await pasoRegistro.ejecutar(tarea);

    const de = (titulo: string) => recibidos.filter((r) => r.carga['titulo'] === titulo);
    const [hecho] = de('Se registró Gimnasio') as [Recibido];
    expect(de('Se registró Gimnasio')).toHaveLength(1);
    expect([hecho.urgencia, hecho.ttl, hecho.topic]).toEqual(['normal', DIA, 'programadas']);
    expect(hecho.carga['destino']).toMatchObject({ pantalla: 'transaccion' });

    const [cerrada] = de('Club quedó pendiente') as [Recibido];
    expect(de('Club quedó pendiente')).toHaveLength(1);
    expect([cerrada.urgencia, cerrada.ttl, cerrada.topic]).toEqual(['normal', 7 * DIA, undefined]);
    expect(cerrada.carga['destino']).toEqual({
      pantalla: 'programada',
      programadaId: CERRADA,
      fechaEsperada: '2027-01-10',
    });

    const [fallida] = de('No pudimos registrar Cuota') as [Recibido];
    expect(de('No pudimos registrar Cuota')).toHaveLength(1);
    expect([fallida.urgencia, fallida.ttl, fallida.topic]).toEqual([
      'normal',
      3 * DIA,
      'programadas',
    ]);
    expect(fallida.carga['destino']).toEqual({
      pantalla: 'programada',
      programadaId: FALLA,
      fechaEsperada: '2027-01-31',
    });
    // Cada notificación queda con su envío: el registro va primero, y el push la marca después
    expect(
      await cuenta(
        `SELECT count(*) FROM finn.notificaciones WHERE motivo IN ('registro_automatico', 'registro_automatico_fallido', 'ocurrencia_en_periodo_cerrado') AND push_enviada_en IS NULL`,
      ),
    ).toBe(0);
  });
});
