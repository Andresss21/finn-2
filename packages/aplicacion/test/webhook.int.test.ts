// Recibir SMS (TA-177 [CH-35]; 04 §8.1, §8.2; ADR-09, N-01; V-27) contra PostgreSQL como `finn_app`: los 12 cuerpos de
// V-27 se guardan contra las CHECK de 03 §3.17; 401, 413 y 503 sin guardar nada; el guardado no espera el bloqueo
// global; la rotación del token (OPT-01) rige de inmediato. Procesar y barrer es de TA-242 (PRU-INT-BAND-105).
// Sin `sleep` (07 §7.1): el escritor que tiene el bloqueo avisa que está dentro y espera a que la prueba lo suelte.
import { beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { escribir, escribirSms, leer, Memoria, sqlstateDe } from '@finn/db';
import { txPrisma, txPrismaSinBloqueo } from '../../db/src/transacciones.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { leerCuerpo } from '../src/contratos/webhook.ts';
import { recibir, type DepsWebhook, type PeticionWebhook } from '../src/sms/recibir.ts';
import { rotarToken } from '../src/sms/token.ts';
import { CUERPOS_V27, cumpleCheck, enc, JSON_CT } from './cuerpos-v27.ts';

/** Una puerta que la prueba abre cuando quiere (sin esperas de tiempo). */
function puerta(): { esperar: Promise<void>; abrir: () => void } {
  let abrir = (): void => undefined;
  const esperar = new Promise<void>((r) => (abrir = r));
  return { esperar, abrir };
}

describe('PRU-INT-BAND', () => {
  const base = crearBasePrueba();
  let token = '';
  const deps = (extra: Partial<DepsWebhook> = {}): DepsWebhook => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
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
  const contar = () => leer((t) => txPrisma(t).smsRecibido.count(), RELOJ);
  const eventos = (mensaje: string) =>
    leer((t) => txPrisma(t).eventoSistema.findMany({ where: { mensaje } }), RELOJ);

  beforeAll(async () => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    token = (await rotarToken({ opciones: () => RELOJ })).token;
  });

  it('PRU-INT-BAND-001 [V-27, N-01] BE-44, BE-59, BE-60, BE-61, OPT-01: los 12 cuerpos se guardan contra las CHECK de 03 §3.17 y responden 200; 401, 413 y 503 sin guardar; guardar no espera el bloqueo global', async () => {
    // OPT-01: en la base solo el SHA-256 en hexadecimal; el token en claro es base64url de 32 bytes
    const hash = () =>
      leer((t) => txPrisma(t).tokenWebhook.findUniqueOrThrow({ where: { id: 1 } }), RELOJ);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((await hash()).hashSha256).toBe(createHash('sha256').update(token).digest('hex'));

    // N-01 punto 1: token inválido, ausente o de otra forma → 401 sin guardar; un evento sin datos de la petición
    for (const autorizacion of [`Bearer ${token}x`, null, token, `Bearer  ${token}`])
      expect(await recibir(peticion({ autorizacion }), deps())).toEqual({ estado: 401 });
    expect(await contar()).toBe(0);
    const avisos = await eventos('token_invalido');
    expect(avisos).toHaveLength(4);
    expect(
      avisos.every((e) => e.nivel === 'aviso' && e.origen === 'webhook' && e.datos === null),
    ).toBe(true);
    // BE-59: más de 16 KiB → 413 sin guardar
    const grande = peticion({ cuerpo: new Uint8Array(16 * 1024 + 1) });
    expect(await recibir(grande, deps())).toEqual({ estado: 413 });
    // N-01 punto 2: si no se puede guardar, 503 con Retry-After y un evento de error
    const sinBase = deps({ escribirSms: () => Promise.reject(new Error('ECONNREFUSED')) });
    expect(await recibir(peticion({}), sinBase)).toEqual({ estado: 503, reintentarEn: 30 });
    expect(await contar()).toBe(0);
    expect(await eventos('guardar_fallido')).toMatchObject([{ nivel: 'error', origen: 'webhook' }]);

    // V-27: cada cuerpo con token válido → 200 con su id, y la fila guardada es la del contrato (BE-60, BE-61)
    for (const [nombre, formato, cuerpo, contentType, remitente] of CUERPOS_V27) {
      const r = await recibir(peticion({ cuerpo, contentType, remitente }), deps({ formato }));
      if (r.estado !== 200) throw new Error(`${nombre}: ${r.estado}`);
      expect(r.cuerpo).toEqual({ recibido: true, id: expect.any(String) as string });
      await r.despues();
      const fila = await leer(
        (t) => txPrisma(t).smsRecibido.findUniqueOrThrow({ where: { id: r.cuerpo.id } }),
        RELOJ,
      );
      const esperado = leerCuerpo(cuerpo, contentType, remitente, formato);
      expect({ nombre, texto: fila.texto, remitente: fila.remitente }).toEqual({
        nombre,
        texto: esperado.texto,
        remitente: esperado.remitente,
      });
      expect({ nombre, cumple: cumpleCheck(fila) }).toEqual({ nombre, cumple: true });
    }
    expect(await contar()).toBe(12);

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
        RELOJ,
      ).catch((x: unknown) => x);
      expect(sqlstateDe(e)?.sqlstate).toBe(sqlstate);
    }
    expect(await contar()).toBe(12);

    // 03 §5.1: el guardado no toma el bloqueo; responde 200 mientras otra escritura lo tiene
    const dentro = puerta();
    const soltar = puerta();
    let otraTermino = false;
    const otra = escribir(async () => {
      dentro.abrir();
      await soltar.esperar;
    }, RELOJ).then(() => (otraTermino = true));
    await dentro.esperar;
    const conBloqueo = await recibir(peticion({}), deps());
    expect({ estado: conBloqueo.estado, otraTermino }).toEqual({ estado: 200, otraTermino: false });
    soltar.abrir();
    await otra;
    expect(await contar()).toBe(13);

    // OPT-01: rotar invalida el anterior al instante (el hash se lee en cada petición)
    const anterior = token;
    token = (await rotarToken({ opciones: () => RELOJ })).token;
    expect(token).not.toBe(anterior);
    expect(await recibir(peticion({ autorizacion: `Bearer ${anterior}` }), deps())).toEqual({
      estado: 401,
    });
    expect((await recibir(peticion({}), deps())).estado).toBe(200);
  });
});
