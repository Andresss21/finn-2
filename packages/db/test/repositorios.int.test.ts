// Repositorios de las tablas [I] y [T] (TA-155; 03 §3.17, §3.18, §3.28; 04 §7.8, §15.3; BE-26): con los
// privilegios de finn_app (m_seguridad), solo inserción en las [I], y el registro de un error sin montos ni
// textos de SMS. Los instantes salen de `finn.ahora()` (CT-02); ninguna comparación usa el reloj de pared.
import { FechaLocal } from '@finn/dominio/valores';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearCliente, type Cliente } from '../src/cliente.ts';
import { sqlstateDe } from '../src/errores.ts';
import { transaccionesSobre, txPrisma } from '../src/transacciones.ts';
import {
  eventoPorIdError,
  eventosRecientes,
  guardarHashToken,
  guardarProcesamiento,
  guardarSms,
  guardarSuscripcion,
  leerEstadoRespaldo,
  leerHashToken,
  listarSuscripciones,
  marcarLeida,
  notificacionesRecientes,
  procesamientoVigente,
  proximoIntento,
  purgarEventos,
  purgarNotificaciones,
  registrarEvento,
  registrarPush,
  registrarRespaldo,
  registrarRestauracion,
  sanearDatos,
  sanearMensaje,
  crearNotificacion,
  eliminarSuscripcion,
} from '../src/repositorios/index.ts';
import { crearBasePrueba } from './ayudantes/base.ts';

const RELOJ = { hoy: '2027-03-10', desfaseMs: 200 * 86_400_000 }; // 200 días: lejos del reloj real
const UUID_TX = '37bd1c52-0a1e-4c7e-9a3b-5d1f2e8a9c10';

describe('PRU-INT-ESQ', () => {
  const base = crearBasePrueba();
  let db: Cliente;
  let t: ReturnType<typeof transaccionesSobre>;
  beforeAll(() => {
    db = crearCliente(base.url);
    t = transaccionesSobre(db);
  });
  afterAll(async () => {
    await db.$disconnect();
  });

  const escribir = <T>(f: Parameters<typeof t.escribir<T>>[0]) => t.escribir(f, { reloj: RELOJ });
  const leer = <T>(f: Parameters<typeof t.leer<T>>[0]) => t.leer(f, { reloj: RELOJ });
  const ahora = (): Promise<Date> =>
    escribir(async (tx) => {
      const [f] = await txPrisma(tx).$queryRaw<
        { a: Date }[]
      >`SELECT date_trunc('milliseconds', finn.ahora()) AS a`;
      return f?.a ?? new Date(0);
    });
  /** El instante cae entre dos lecturas de `finn.ahora()`: el reloj simulado avanza entre transacciones. */
  const entre = (x: Date | null | undefined, antes: Date, despues: Date): void => {
    expect(x).toBeInstanceOf(Date);
    expect(x?.getTime()).toBeGreaterThanOrEqual(antes.getTime());
    expect(x?.getTime()).toBeLessThanOrEqual(despues.getTime());
  };
  /** SQLSTATE de un fallo de la base, o `undefined` si no falló. */
  const sqlstateDeFallo = (p: Promise<unknown>): Promise<string | undefined> =>
    p.then(
      () => undefined,
      (e: unknown) => sqlstateDe(e)?.sqlstate,
    );

  it('PRU-INT-ESQ-106 BE-26, DB-repositorios: con los privilegios de finn_app, sms_recibidos y sms_procesamientos solo se insertan y se leen, con recibido_en y procesado_en del reloj de la base', async () => {
    const [{ u } = { u: '' }] = await db.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    expect(u).toBe('finn_app');
    const reloj = await ahora();
    const sms = await escribir((tx) =>
      guardarSms(tx, { texto: 'Compra ESQ-106', remitente: '2222' }),
    );
    entre(sms.recibidoEn, reloj, await ahora());
    const intento = await leer((tx) => proximoIntento(tx, sms.id));
    expect(intento).toBe(1);
    await escribir((tx) =>
      guardarProcesamiento(tx, {
        smsId: sms.id,
        intento: 1,
        resultado: 'no_reconocido',
        ultimos4: '1234',
        monto: 2550,
        fecha: FechaLocal.desdeTexto('2027-03-09'),
      }),
    );
    await escribir((tx) =>
      guardarProcesamiento(tx, {
        smsId: sms.id,
        intento: 2,
        resultado: 'error',
        errorDetalle: 'FN003',
      }),
    );
    const vigente = await leer((tx) => procesamientoVigente(tx, sms.id));
    expect(vigente).toMatchObject({ intento: 2, resultado: 'error', errorDetalle: 'FN003' });
    entre(vigente?.procesadoEn, reloj, await ahora());
    // [I]: sin UPDATE ni DELETE para finn_app (42501) y el intento repetido choca con UNIQUE (23505)
    expect(
      await sqlstateDeFallo(db.$executeRaw`UPDATE finn.sms_recibidos SET remitente = 'x'`),
    ).toBe('42501');
    expect(await sqlstateDeFallo(db.$executeRaw`DELETE FROM finn.sms_procesamientos`)).toBe(
      '42501',
    );
    expect(
      await sqlstateDeFallo(
        escribir((tx) =>
          guardarProcesamiento(tx, {
            smsId: sms.id,
            intento: 2,
            resultado: 'error',
            errorDetalle: 'x',
          }),
        ),
      ),
    ).toBe('23505');
    // CHECK de 03 §3.17: el texto no puede ser vacío
    expect(
      await sqlstateDeFallo(escribir((tx) => guardarSms(tx, { texto: '', remitente: '2222' }))),
    ).toBe('23514');
  });

  it('PRU-INT-ESQ-106 notificaciones: crea con creada_en del reloj, marca lectura y push, y purga por retención', async () => {
    const reloj = await ahora();
    const n = await escribir((tx) =>
      crearNotificacion(tx, {
        aviso: 'AV-05',
        motivo: 'sms_nuevo',
        titulo: 'Compra detectada',
        cuerpo: 'Revisá la bandeja',
        datos: { smsId: UUID_TX },
      }),
    );
    entre(n.creadaEn, reloj, await ahora());
    await escribir((tx) => marcarLeida(tx, n.id));
    await escribir((tx) => registrarPush(tx, n.id, { error: 'HTTP 410' }));
    let f = (await leer((tx) => notificacionesRecientes(tx))).find((x) => x.id === n.id);
    expect(f).toMatchObject({
      pushError: 'HTTP 410',
      pushEnviadaEn: null,
      datos: { smsId: UUID_TX },
    });
    entre(f?.leidaEn, reloj, await ahora());
    await escribir((tx) => registrarPush(tx, n.id, 'enviada'));
    f = (await leer((tx) => notificacionesRecientes(tx))).find((x) => x.id === n.id);
    expect(f).toMatchObject({ pushError: null });
    entre(f?.pushEnviadaEn, reloj, await ahora());
    expect(
      await sqlstateDeFallo(
        escribir((tx) =>
          crearNotificacion(tx, { aviso: 'sms', motivo: 'm', titulo: 't', cuerpo: 'c' }),
        ),
      ),
    ).toBe('23514');
    const limite = await ahora();
    const borradas = await escribir((tx) => purgarNotificaciones(tx, limite));
    expect(borradas).toBeGreaterThanOrEqual(1);
    expect((await leer((tx) => notificacionesRecientes(tx))).some((x) => x.id === n.id)).toBe(
      false,
    );
  });

  it('PRU-INT-ESQ-106 estado_respaldo, token_webhook y suscripciones_push: filas únicas, renovación por endpoint y CHECK del hash', async () => {
    const reloj = await ahora();
    expect(await leer((tx) => leerEstadoRespaldo(tx))).toMatchObject({
      id: 1,
      ultimoRespaldoEn: null,
    });
    await escribir((tx) => registrarRespaldo(tx, 'respaldo/2027-03-10.dump'));
    await escribir((tx) => registrarRestauracion(tx));
    const e = await leer((tx) => leerEstadoRespaldo(tx));
    expect(e).toMatchObject({ id: 1, ultimoRespaldoObjeto: 'respaldo/2027-03-10.dump' });
    entre(e?.ultimoRespaldoEn, reloj, await ahora());
    entre(e?.ultimaRestauracionEn, reloj, await ahora());

    expect(await leer((tx) => leerHashToken(tx))).toBeNull();
    const hash = 'a'.repeat(64);
    await escribir((tx) => guardarHashToken(tx, hash));
    await escribir((tx) => guardarHashToken(tx, 'b'.repeat(64)));
    expect(await leer((tx) => leerHashToken(tx))).toBe('b'.repeat(64));
    expect(await sqlstateDeFallo(escribir((tx) => guardarHashToken(tx, 'token-en-claro')))).toBe(
      '23514',
    );

    const s = { endpoint: 'https://push.example/esq-106', claveP256dh: 'k', claveAuth: 'a' };
    await escribir((tx) => guardarSuscripcion(tx, s));
    await escribir((tx) => guardarSuscripcion(tx, { ...s, agente: 'Pixel' }));
    const lista = await leer((tx) => listarSuscripciones(tx));
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ agente: 'Pixel' });
    entre(lista[0]?.creadaEn, reloj, await ahora());
    expect(
      await sqlstateDeFallo(
        escribir((tx) => guardarSuscripcion(tx, { ...s, endpoint: 'http://x' })),
      ),
    ).toBe('23514');
    expect(await escribir((tx) => eliminarSuscripcion(tx, s.endpoint))).toBe(1);
  });

  it('PRU-INT-ESQ-106 04 §7.8, §15.3: sanearMensaje conserva UUID y nombres de restricciones y cambia números y textos entre comillas por #', () => {
    expect(
      sanearMensaje(
        `finn: transacción ${UUID_TX}: la suma de las líneas (100) no es igual al total (300) (inv. 6)`,
      ),
    ).toBe(
      `finn: transacción ${UUID_TX}: la suma de las líneas (#) no es igual al total (#) (inv. #)`,
    );
    expect(
      sanearMensaje(
        'new row violates check constraint "ck_sms_remitente" for "Tienda La Paz" 12.50 en 2027-03-10',
      ),
    ).toBe('new row violates check constraint "ck_sms_remitente" for # # en #-#-#');
    expect(
      sanearDatos({ idError: 'E-7K2QPX', monto: 5, anidado: { Comercio: 'x', ok: 1 } }),
    ).toEqual({
      idError: 'E-7K2QPX',
      anidado: { ok: 1 },
    });
  });

  it('PRU-INT-ESQ-106 BE-26: el registro de un error de la base no guarda montos, textos de SMS ni el mensaje original, y se encuentra por idError', async () => {
    const reloj = await ahora();
    const textoSms = 'Compra aprobada por $1,234.56 en TIENDA SECRETA tarjeta 9876';
    // Un error real: el CHECK de monto > 0 con el SMS dentro del mensaje original, como en una violación con datos
    const falla = await escribir(async (tx) => {
      const sms = await guardarSms(tx, { texto: textoSms, remitente: '2222' });
      await guardarProcesamiento(tx, {
        smsId: sms.id,
        intento: 1,
        resultado: 'error',
        errorDetalle: 'x',
        monto: -5,
      });
    }).catch((e: unknown) => e);
    const info = sqlstateDe(falla);
    expect(info?.sqlstate).toBe('23514');
    const original = `finn: "${textoSms}" monto 123456 viola ${info?.restriccion ?? 'ck_procesamientos_monto'}`;
    const id = await escribir((tx) =>
      registrarEvento(tx, {
        nivel: 'error',
        origen: 'app',
        mensaje: 'INTERNO FN003 OP-20',
        datos: {
          idError: 'E-7K2QPX',
          operacion: 'OP-20',
          sqlstate: info?.sqlstate ?? '',
          mensajeSaneado: original,
          monto: 123456,
          comercio: 'TIENDA SECRETA',
          texto: textoSms,
          detalle: { sms: textoSms, paso: 2 },
        },
      }),
    );
    const fila = (await leer((tx) => eventoPorIdError(tx, 'E-7K2QPX'))) ?? null;
    expect(fila?.id).toBe(id);
    entre(fila?.ocurridoEn, reloj, await ahora());
    expect(fila?.datos).toMatchObject({
      idError: 'E-7K2QPX',
      sqlstate: '23514',
      detalle: { paso: 2 },
    });
    const [{ guardado } = { guardado: '' }] = await db.$queryRaw<
      { guardado: string }[]
    >`SELECT (nivel, origen, mensaje, datos)::text AS guardado FROM finn.eventos_sistema WHERE id = ${id}`;
    for (const secreto of ['TIENDA SECRETA', '1,234.56', '9876', '123456', textoSms])
      expect(guardado).not.toContain(secreto);
    expect((fila?.datos as { mensajeSaneado: string }).mensajeSaneado).toMatch(
      /^finn: # monto # viola /,
    );
    expect((await leer((tx) => eventosRecientes(tx))).map((x) => x.id)).toContain(id);
    // El origen fuera del catálogo y el nivel inválido los rechaza la base
    expect(
      await sqlstateDeFallo(
        escribir((tx) =>
          registrarEvento(tx, { nivel: 'info', origen: 'otro' as never, mensaje: 'm' }),
        ),
      ),
    ).toBe('23514');
    // Retención: la auditoría de formatos (EN-1) no se purga
    await escribir((tx) =>
      registrarEvento(tx, { nivel: 'info', origen: 'app', mensaje: 'auditoria_formato crear' }),
    );
    const limite = await ahora();
    await escribir((tx) => purgarEventos(tx, limite));
    const quedan = await db.eventoSistema.findMany({ select: { mensaje: true } });
    expect(quedan.map((q) => q.mensaje)).toEqual(['auditoria_formato crear']);
  });
});
