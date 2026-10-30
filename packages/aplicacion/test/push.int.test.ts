// Envío de push, política, suscripciones, acción de la notificación y pasos 3 y 4 de la tarea diaria (TA-196; 04 §10.2,
// §11; 06 §3.8, §3.16; BE-51, BE-53, BE-54) contra PostgreSQL como `finn_app` y un receptor HTTP local en lugar del
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
} from '@finn/db';
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
import { ejecutarDiaria, pasoAvisos, pasoCierre, type DepsTarea } from '../src/tareas/diaria.ts';
import { ponerAlDia } from '../src/tareas/puesta-al-dia.ts';

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

  /** Dependencias con el `hoy` de la base fijado (CT-01); `minutos` adelanta `finn.ahora()`. */
  const deps = (hoy = HOY, minutos = 0): DepsTarea & DepsEnvio => ({
    memoria: new Memoria(),
    opciones: () => ({ reloj: { hoy, desfaseMs: minutos * 60_000 } }),
    vapid: () => vapid,
    // 03 exige https en `endpoint` (ck_suscripciones_endpoint): el dominio de prueba se apunta al receptor local
    red: (url, init) =>
      fetch(
        String(url)
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
    await sql(`DELETE FROM finn.eventos_sistema WHERE mensaje = 'cierre_sin_push'`);
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

  it('PRU-INT-NOTIF-101 [CF-16] BE-51: un solo push de cierre, del último período cerrado; los anteriores quedan en eventos_sistema y una segunda corrida no repite', async () => {
    await suscribir('ok');
    const cierres = () =>
      sql(
        `SELECT datos->>'clave' FROM finn.notificaciones WHERE motivo = 'cierre_periodo' ORDER BY creada_en`,
      );
    // El 05/05 ya cerraron varios períodos desde los hechos de enero
    const hoy = '2027-05-05';
    const primera = await pasoCierre.ejecutar(deps(hoy));
    expect(primera.cantidad).toBe(1);
    const [clave] = await cierres();
    // La vigencia del día 15 rige desde el 21/04: el período abierto el 05/05 empezó ahí
    expect(clave).toBe('cierre:2027-03-21');
    const [r] = recibidos as [Recibido];
    expect(r.carga['cuerpo']).toMatch(/^Cerró el período del 21\/03 al 20\/04\./);
    expect(r.carga['destino']).toMatchObject({
      pantalla: 'presupuesto',
      periodoInicio: (clave as string).slice('cierre:'.length),
    });
    const anteriores = await sql(
      `SELECT datos->>'periodoInicio' FROM finn.eventos_sistema WHERE mensaje = 'cierre_sin_push' ORDER BY id`,
    );
    expect(anteriores.length).toBeGreaterThan(0);
    expect(anteriores).not.toContain(clave);

    // Idempotente: la misma clave no vuelve a enviar ni a registrar
    expect((await pasoCierre.ejecutar(deps(hoy))).cantidad).toBe(0);
    expect(await cierres()).toHaveLength(1);
    expect(recibidos).toHaveLength(1);
    expect(
      await cuenta(`SELECT count(*) FROM finn.eventos_sistema WHERE mensaje = 'cierre_sin_push'`),
    ).toBe(anteriores.length);
  });

  it('PRU-INT-NOTIF-101 [CF-07, CF-24] pago_tarjeta_proximo y cuota_proxima una vez por clave; la cuota también en la puesta al día, sin monto de deuda en la tarjeta', async () => {
    await suscribir('ok');
    const [cuentaId] = await sql(`SELECT cuenta_id FROM finn.programadas WHERE tipo = 'gasto'`);
    const [prestamoId] = await sql('SELECT cuenta_id FROM finn.prestamos');
    const [categoriaId] = await sql(
      `SELECT id FROM finn.categorias WHERE clase = 'normal' LIMIT 1`,
    );
    await escribir((tx) =>
      tx.aplicarCambios([
        {
          tipo: 'insertar',
          tabla: 'programadas',
          fila: {
            id: '00000000-0000-4000-8000-000000000f01',
            tipo: 'cuota_prestamo',
            cuentaId,
            cuentaDestinoId: prestamoId,
            comercio: 'Banco Hipotecario',
            monto: 12345,
            tolerancia: 0,
            frecuencia: 'mensual',
            frecuenciaDias: null,
            primeraFecha: FechaLocal.desdeTexto('2027-02-06'),
            fechaFin: null,
            registroAutomatico: false,
            activa: true,
            reactivadaDesde: null,
          } as never,
        },
        {
          tipo: 'insertar',
          tabla: 'programada_lineas',
          fila: {
            id: '00000000-0000-4000-8000-000000000f02',
            programadaId: '00000000-0000-4000-8000-000000000f01',
            orden: 1,
            monto: 12345,
            categoriaId,
          } as never,
        },
      ]),
    );
    const de = (motivo: string) =>
      sql(
        `SELECT cuerpo || '|' || (datos->>'clave') || '|' || (aviso IS NULL) FROM finn.notificaciones WHERE motivo = '${motivo}'`,
      );

    // La puesta al día ya avisa la cuota, y la tarea diaria del mismo día no la repite
    const puesta = await ponerAlDia(deps('2027-02-04'));
    expect(puesta.pasos.map((p) => p.paso)).toEqual([2, 4]);
    expect(await de('cuota_proxima')).toEqual([
      expect.stringMatching(
        /^Cuota de Banco Hipotecario por \$123\.45 el 06\/02\. Registrala cuando la pagues\.\|cuota:.+:2027-02-06\|true$/,
      ),
    ]);

    await pasoAvisos.ejecutar(deps('2027-02-04'));
    await pasoAvisos.ejecutar(deps('2027-02-05'));
    expect(await de('cuota_proxima')).toHaveLength(1);

    // TTL hasta el final de la fecha de pago en El Salvador (05:59:59 UTC del día siguiente)
    expect(
      peticionDe('pago_tarjeta_proximo', {
        notificacionId: ID,
        titulo: 'T',
        cuerpo: 'C',
        ahoraMs: Date.parse('2027-02-05T12:00:00Z'),
        fechaLimite: '2027-02-05',
      })?.ttl,
    ).toBe(17 * HORA + 59 * 60 + 59);

    // Fuera de la ventana: la cuota de marzo aún no se avisa
    await pasoAvisos.ejecutar(deps('2027-03-01'));
    expect(await de('cuota_proxima')).toHaveLength(1);
    await pasoAvisos.ejecutar(deps('2027-03-03'));
    expect(await de('cuota_proxima')).toHaveLength(2);

    // La deuda del ciclo que cortó el 15/02 se paga el 05/03: una por tarjeta y fecha de pago, sin monto (FD-31)
    await pasoAvisos.ejecutar(deps('2027-03-04'));
    const tarjeta = await de('pago_tarjeta_proximo');
    expect(tarjeta).toHaveLength(1);
    expect(tarjeta[0]).toMatch(
      /^Visa: tu fecha de pago es el 05\/03\. Revisá cuánto pagar para no generar intereses\.\|pago_tarjeta:.+:2027-03-05\|true$/,
    );
    expect(tarjeta[0]).not.toContain('$');
    const push = recibidos.find((r) => r.carga['etiqueta'] === 'tarjetas') as Recibido;
    expect(push.carga['destino']).toMatchObject({ pantalla: 'cuenta' });
  });

  it('PRU-INT-NOTIF-101 [AV-17] paso 4: respaldo de más de 36 h, restauración de más de 35 días, deriva informada y los disparadores de la carga incremental, una vez por clave', async () => {
    await sql(`INSERT INTO finn.estado_respaldo (id, ultimo_respaldo_en, ultima_restauracion_en)
      VALUES (1, now() - interval '37 hours', now() - interval '36 days')
      ON CONFLICT (id) DO UPDATE SET ultimo_respaldo_en = EXCLUDED.ultimo_respaldo_en, ultima_restauracion_en = EXCLUDED.ultima_restauracion_en`);
    await sql(`INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos)
      VALUES ('error', 'respaldo', 'deriva', '{"control": "C5", "filas": 1}'),
             ('info', 'motor', 'carga_completa', '{"bytes": 700000000, "ms": 80}')`);
    const motivos = () =>
      sql(`SELECT motivo FROM finn.notificaciones WHERE motivo IN
        ('respaldo_atrasado', 'restauracion_atrasada', 'deriva_catalogo', 'carga_incremental') ORDER BY motivo`);
    await pasoAvisos.ejecutar(deps());
    expect(await motivos()).toEqual([
      'carga_incremental',
      'deriva_catalogo',
      'respaldo_atrasado',
      'restauracion_atrasada',
    ]);
    await pasoAvisos.ejecutar(deps());
    expect(await motivos()).toHaveLength(4);
    expect(
      await cuenta(
        `SELECT count(*) FROM finn.eventos_sistema WHERE nivel = 'aviso' AND mensaje = 'carga_incremental'`,
      ),
    ).toBe(1);
    await sql(`DELETE FROM finn.estado_respaldo; DELETE FROM finn.eventos_sistema
      WHERE origen IN ('respaldo', 'motor')`);
  });

  it('PRU-INT-NOTIF-101 [AV-23] 8.4 e: procesar un SMS registra AV-23 con push después del COMMIT, con comercio y monto, sin el texto del SMS; el autodescartado no notifica', async () => {
    await suscribir('ok');
    const guardar = () =>
      escribirSms((tx) => guardarSms(tx, { texto: RECONOCIDO, remitente: 'BAC' }), {
        reloj: { hoy: HOY, desfaseMs: 0 },
      });
    const { id } = await guardar();
    expect(await procesar(id, deps())).toBeUndefined();
    const filas = await sql(
      `SELECT motivo || '|' || aviso || '|' || (push_enviada_en IS NOT NULL) || '|' || (datos->'destino'->>'pantalla') FROM finn.notificaciones`,
    );
    expect(filas).toEqual([expect.stringMatching(/^sms_\w+\|AV-23\|true\|movimiento$/)]);
    const [r] = recibidos as [Recibido];
    expect(r.carga['cuerpo']).toContain('SUPER SELECTOS');
    expect(r.carga['cuerpo']).toContain('$12.30');
    expect(JSON.stringify(r.carga)).not.toContain('VISA 1234');

    // Mismo texto antes de 10 minutos: autodescartado (01 OP-35), sin notificación
    const otro = await guardar();
    expect(await procesar(otro.id, deps())).toBeUndefined();
    expect(await cuenta('SELECT count(*) FROM finn.notificaciones')).toBe(1);
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

  it('PRU-INT-NOTIF-101 [CF-07] 10.2: la tarea diaria corre los pasos 2 a 6 en orden, y sin suscripciones la notificación queda registrada', async () => {
    const r = await ejecutarDiaria(deps('2027-05-05'));
    expect(r.pasos.map((p) => [p.paso, p.resultado])).toEqual([
      [2, 'ok'],
      [3, 'ok'],
      [4, 'ok'],
      [5, 'ok'],
      [6, 'ok'],
    ]);
    expect(
      await cuenta(
        `SELECT count(*) FROM finn.notificaciones WHERE push_error = 'sin_suscripciones'`,
      ),
    ).toBeGreaterThan(0);
  });
});
