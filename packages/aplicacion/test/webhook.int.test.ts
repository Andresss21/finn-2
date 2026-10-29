// Recibir SMS (TA-177; 04 §8.1, §8.2, §8.4, §8.6; ADR-09, N-01, N-02; V-27) contra PostgreSQL como `finn_app`: los
// 12 cuerpos de V-27 se guardan contra las CHECK de 03 §3.17 y dan su resultado; 401, 413 y 503 sin guardar nada; el
// guardado no espera el bloqueo global; los intentos no se sobrescriben; el barrido toma hasta 5 SMS sin resultado.
// Sin `sleep` (07 §7.1): cada SMS llega con su propio desfase del reloj de la base (`finn.ahora()`, CT-02).
import { beforeAll, describe, expect, it } from 'vitest';
import {
  escribir,
  escribirSms,
  guardarSms,
  leer,
  Memoria,
  smsSinResultado,
  sqlstateDe,
  type OpcionesTx,
} from '@finn/db';
import { txPrisma, txPrismaSinBloqueo } from '../../db/src/transacciones.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY } from '../../db/test/ayudantes/hechos-prueba.ts';
import { recibir, type DepsWebhook, type PeticionWebhook } from '../src/sms/recibir.ts';
import { procesar } from '../src/sms/procesar.ts';
import { rotarToken } from '../src/sms/token.ts';
import { CUERPOS_V27, enc, JSON_CT, SMS } from './cuerpos-v27.ts';

const MIN = 60_000;
const reloj = (minutos: number): OpcionesTx => ({ reloj: { hoy: HOY, desfaseMs: minutos * MIN } });
const E1 = '00000000-0000-4000-8000-000000000001'; // Efectivo, BAC, últimos 4 = 1234
const RECONOCIDO =
  'VISA 1234: has realizado una compra por USD 12.30 en el comercio SUPER SELECTOS 2027/02/04';

/** Una puerta que la prueba abre cuando quiere (sin esperas de tiempo). */
function puerta(): { esperar: Promise<void>; abrir: () => void } {
  let abrir = (): void => undefined;
  const esperar = new Promise<void>((r) => (abrir = r));
  return { esperar, abrir };
}

describe('PRU-INT-BAND', () => {
  const base = crearBasePrueba();
  let token = '';
  const deps = (minutos: number, extra: Partial<DepsWebhook> = {}): DepsWebhook => ({
    memoria: new Memoria(),
    opciones: () => reloj(minutos),
    formato: 'json',
    transcurridoMs: () => 0,
    ...extra,
  });
  const peticion = (p: Partial<PeticionWebhook>): PeticionWebhook => ({
    autorizacion: `Bearer ${token}`,
    contentType: JSON_CT,
    remitente: null,
    cuerpo: enc(JSON.stringify({ texto: 'hola', remitente: 'BAC' })),
    ...p,
  });
  const contar = () => leer((t) => txPrisma(t).smsRecibido.count(), reloj(0));
  const eventos = (mensaje: string) =>
    leer((t) => txPrisma(t).eventoSistema.findMany({ where: { mensaje } }), reloj(0));
  const estadoDe = (smsId: string) =>
    leer(async (t) => {
      const p = txPrisma(t);
      return {
        sms: await p.smsRecibido.findUniqueOrThrow({ where: { id: smsId } }),
        intentos: await p.smsProcesamiento.findMany({
          where: { smsId },
          orderBy: { intento: 'asc' },
        }),
        movimiento: await p.movimiento.findUnique({ where: { smsId } }),
      };
    }, reloj(0));

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    token = (await rotarToken({ opciones: () => reloj(0) })).token;
  });

  it('PRU-INT-BAND-001 [V-27, N-01, N-02] BE-44, BE-45, BE-59, BE-60, BE-61, BE-62, OP-35, OPT-01: los 12 cuerpos se guardan contra las CHECK de 03 §3.17 y dan su resultado; 401, 413 y 503 sin guardar; guardar no espera el bloqueo; intentos sin sobrescribir y barrido de 5', async () => {
    // OPT-01: en la base solo el SHA-256; el token en claro es base64url de 32 bytes
    const guardado = await leer(
      (t) => txPrisma(t).tokenWebhook.findUniqueOrThrow({ where: { id: 1 } }),
      reloj(0),
    );
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(guardado.hashSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(guardado.hashSha256).not.toContain(token);

    // N-01 punto 1: token inválido, ausente o de otra forma → 401 sin guardar; un evento sin datos de la petición
    for (const autorizacion of [`Bearer ${token}x`, null, token, `Bearer  ${token}`])
      expect(await recibir(peticion({ autorizacion }), deps(0))).toEqual({ estado: 401 });
    expect(await contar()).toBe(0);
    const avisos = await eventos('token_invalido');
    expect(avisos).toHaveLength(4);
    expect(
      avisos.every((e) => e.nivel === 'aviso' && e.origen === 'webhook' && e.datos === null),
    ).toBe(true);
    // BE-59: más de 16 KiB → 413 sin guardar
    expect(await recibir(peticion({ cuerpo: new Uint8Array(16 * 1024 + 1) }), deps(0))).toEqual({
      estado: 413,
    });
    // N-01 punto 2: si no se puede guardar, 503 con Retry-After y un evento de error
    const sinBase: DepsWebhook = deps(0, {
      escribirSms: () => Promise.reject(new Error('ECONNREFUSED')),
    });
    expect(await recibir(peticion({}), sinBase)).toEqual({ estado: 503, reintentarEn: 30 });
    expect(await contar()).toBe(0);
    expect(await eventos('guardar_fallido')).toMatchObject([{ nivel: 'error', origen: 'webhook' }]);

    // V-27: cada cuerpo con token válido → 200, la fila pasa las CHECK y el resultado es el esperado (BE-60, BE-61).
    // Cada uno 11 minutos después del anterior: ninguno se autodescarta por el de antes (H12)
    for (const [
      k,
      [nombre, formato, cuerpo, contentType, remitente, detalle],
    ] of CUERPOS_V27.entries()) {
      const r = await recibir(
        peticion({ cuerpo, contentType, remitente }),
        deps(11 * k, { formato }),
      );
      if (r.estado !== 200) throw new Error(`${nombre}: ${r.estado}`);
      await r.despues();
      const e = await estadoDe(r.cuerpo.id);
      const esperado =
        detalle === null
          ? { resultado: 'no_reconocido', errorDetalle: null } // el texto íntegro llega a la bandeja (8.1.1)
          : { resultado: 'error', errorDetalle: `cuerpo_invalido: ${detalle}` };
      expect({
        nombre,
        ...e.intentos.map((i) => ({ resultado: i.resultado, errorDetalle: i.errorDetalle }))[0],
      }).toEqual({ nombre, ...esperado });
      expect({ nombre, n: e.intentos.length, estado: e.movimiento?.estado }).toEqual({
        nombre,
        n: 1,
        estado: esperado.resultado,
      });
      if (detalle === null) expect(e.sms).toMatchObject({ texto: SMS, remitente: 'BAC' });
      else expect(e.sms.remitente).toBe('desconocido');
    }
    expect(await contar()).toBe(12);
    const invalidos = await eventos('cuerpo_invalido');
    expect(invalidos).toHaveLength(10);
    expect(JSON.stringify(invalidos.map((e) => e.datos))).not.toContain('SUPER'); // sin el cuerpo (15.2)

    // Controles de V-27: sin la limpieza, la base rechaza el NUL, 2.001 caracteres y el texto vacío
    for (const [texto, sqlstate] of [
      ['a\u0000b', '22021'],
      ['x'.repeat(2001), '23514'],
      ['', '23514'],
    ] as const) {
      const e = await escribirSms(
        (tx) =>
          txPrismaSinBloqueo(tx)
            .$executeRaw`INSERT INTO finn.sms_recibidos (texto, remitente) VALUES (${texto}, 'x')`,
        reloj(0),
      ).catch((x: unknown) => x);
      expect(sqlstateDe(e)?.sqlstate).toBe(sqlstate);
    }
    expect(await contar()).toBe(12);

    // 03 §5.1: el guardado no toma el bloqueo; termina (200) mientras otra escritura lo tiene
    const dentro = puerta();
    const soltar = puerta();
    const otra = escribir(async () => {
      dentro.abrir();
      await soltar.esperar;
    }, reloj(200));
    await dentro.esperar;
    const conBloqueo = await recibir(
      peticion({ cuerpo: enc(JSON.stringify({ texto: RECONOCIDO, remitente: 'BAC' })) }),
      deps(200),
    );
    expect(conBloqueo.estado).toBe(200);
    soltar.abrir();
    await otra;
    if (conBloqueo.estado !== 200) return;
    await conBloqueo.despues();
    // OP-35 con un formato reconocido: el intento 1 copia la interpretación y el movimiento tiene el mismo estado
    const reconocido = await estadoDe(conBloqueo.cuerpo.id);
    const [primero] = reconocido.intentos;
    expect(reconocido.intentos).toHaveLength(1);
    expect(primero).toMatchObject({
      intento: 1,
      cuentaId: E1,
      ultimos4: '1234',
      monto: 1230,
      comercio: 'SUPER SELECTOS',
    });
    expect(primero?.formatoId).not.toBeNull();
    expect(primero?.formatosCoincidentes).toEqual([primero?.formatoId]);
    expect(reconocido.movimiento).toMatchObject({
      estado: primero?.resultado,
      cuentaId: E1,
      monto: 1230,
    });

    // N-02: procesarlo otra vez no agrega ni cambia intentos (ya tiene resultado, BE-62)
    await procesar(conBloqueo.cuerpo.id, deps(201));
    await procesar(conBloqueo.cuerpo.id, deps(201), 'esquema');
    expect(await estadoDe(conBloqueo.cuerpo.id)).toEqual(reconocido);
    // …y lo omite bajo el bloqueo, sin llegar al respaldo de los UNIQUE (ningún error de OP-35 registrado)
    const errores = await leer(
      (t) => txPrisma(t).eventoSistema.count({ where: { mensaje: { endsWith: 'OP-35' } } }),
      reloj(0),
    );
    expect(errores).toBe(0);

    // BE-62: seis SMS guardados sin procesar; la petición de 3 minutos después procesa el suyo y 5 de ellos
    for (const n of [1, 2, 3, 4, 5, 6])
      await escribirSms(
        (tx) => guardarSms(tx, { texto: `sin resultado ${n}`, remitente: 'BAC' }),
        reloj(300),
      );
    const pendientes = (min: number) => leer((t) => smsSinResultado(t, 10), reloj(min));
    expect(await pendientes(301)).toEqual([]); // margen de 2 minutos: compite con un `after()` en curso
    expect(await pendientes(303)).toHaveLength(6);
    const sinTiempo = await recibir(peticion({}), deps(303, { transcurridoMs: () => 20_001 }));
    if (sinTiempo.estado === 200) await sinTiempo.despues();
    expect(await pendientes(306)).toHaveLength(6); // pasado el tope de 20 s no barre; el suyo sí se procesó
    const ultimo = (await pendientes(306)).at(-1);
    const barre = await recibir(peticion({}), deps(306));
    if (barre.estado === 200) await barre.despues();
    expect(await pendientes(309)).toEqual([ultimo]);
  });
});
