// Procesar SMS (TA-242 [CH-35]; 04 §8.2, §8.4, §8.6, §15.2; ADR-09, N-02; V-27) contra PostgreSQL como `finn_app`: los
// 12 cuerpos de V-27 dan su resultado; OP-35 en el marco con un formato reconocido; el paso d con el intento `error` y
// el movimiento en `error`; reprocesar no agrega intentos; el barrido toma hasta 5 SMS sin resultado y respeta el tope.
// Sin `sleep` ni reloj de pared (07 §7.1): cada SMS llega con su propio desfase de `finn.ahora()` (CT-02) y el tiempo
// transcurrido de la función lo inyecta la prueba.
import { beforeAll, describe, expect, it } from 'vitest';
import { escribirSms, guardarSms, leer, Memoria, smsSinResultado, type OpcionesTx } from '@finn/db';
import { txPrisma } from '../../db/src/transacciones.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY } from '../../db/test/ayudantes/hechos-prueba.ts';
import { uuidv5 } from '../src/ids.ts';
import { recibir, type DepsWebhook, type PeticionWebhook } from '../src/sms/recibir.ts';
import { barrer, procesar, TOPE_BARRIDO_MS } from '../src/sms/procesar.ts';
import { rotarToken } from '../src/sms/token.ts';
import { CUERPOS_V27, enc, JSON_CT, SMS } from './cuerpos-v27.ts';

const MIN = 60_000;
const reloj = (minutos: number): OpcionesTx => ({ reloj: { hoy: HOY, desfaseMs: minutos * MIN } });
const E1 = '00000000-0000-4000-8000-000000000001'; // Efectivo, BAC, últimos 4 = 1234
const RECONOCIDO =
  'VISA 1234: has realizado una compra por USD 12.30 en el comercio SUPER SELECTOS 2027/02/04';

describe('PRU-INT-BAND', () => {
  const base = crearBasePrueba();
  let token = '';
  const deps = (minutos: number, extra: Partial<DepsWebhook> = {}): DepsWebhook => ({
    memoria: new Memoria(),
    opciones: () => reloj(minutos),
    formato: 'json',
    transcurridoMs: () => 0,
    pausar: () => Promise.resolve(),
    ...extra,
  });
  const peticion = (p: Partial<PeticionWebhook>): PeticionWebhook => ({
    autorizacion: `Bearer ${token}`,
    contentType: JSON_CT,
    remitente: null,
    cuerpo: enc(JSON.stringify({ texto: 'hola', remitente: 'BAC' })),
    ...p,
  });
  /** `recibir()` y su `despues` (lo que haría `after()` de Next). */
  const llega = async (p: Partial<PeticionWebhook>, d: DepsWebhook): Promise<string> => {
    const r = await recibir(peticion(p), d);
    if (r.estado !== 200) throw new Error(`respuesta ${r.estado}`);
    await r.despues();
    return r.cuerpo.id;
  };
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
  const pendientes = (min: number) => leer((t) => smsSinResultado(t, 10), reloj(min));

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    token = (await rotarToken({ opciones: () => reloj(0) })).token;
  });

  it('PRU-INT-BAND-105 [V-27, N-02] OP-35, BE-45, BE-62: los 12 cuerpos de V-27 dan su resultado; un SMS reconocido con su intento 1 y su movimiento; el paso d deja el intento y el movimiento en error; reprocesar no agrega intentos; el barrido toma 5 de 6 sin resultado y no barre pasado el tope', async () => {
    // V-27: cada cuerpo → su resultado (BE-60: el inválido va directo al paso d con `cuerpo_invalido: <detalle>`).
    // Cada uno 11 minutos después del anterior: ninguno se autodescarta por el de antes (H12)
    for (const [
      k,
      [nombre, formato, cuerpo, contentType, remitente, detalle],
    ] of CUERPOS_V27.entries()) {
      const id = await llega({ cuerpo, contentType, remitente }, deps(11 * k, { formato }));
      const e = await estadoDe(id);
      const esperado =
        detalle === null
          ? { resultado: 'no_reconocido', errorDetalle: null } // el texto de prueba no es de ningún formato
          : { resultado: 'error', errorDetalle: `cuerpo_invalido: ${detalle}` };
      expect({
        nombre,
        intentos: e.intentos.map((i) => ({
          intento: i.intento,
          resultado: i.resultado,
          errorDetalle: i.errorDetalle,
        })),
        estado: e.movimiento?.estado,
      }).toEqual({ nombre, intentos: [{ intento: 1, ...esperado }], estado: esperado.resultado });
      // El movimiento tiene el id que le daría OP-35 (BE-31): UUIDv5 del SMS
      expect({ nombre, id: e.movimiento?.id }).toEqual({ nombre, id: uuidv5('1', id) });
      if (detalle === null) expect(e.sms).toMatchObject({ texto: SMS, remitente: 'BAC' });
    }
    // 15.2: un evento `cuerpo_invalido` por cada inválido, con el detalle y sin el cuerpo
    const invalidos = await eventos('cuerpo_invalido');
    expect(invalidos).toHaveLength(10);
    expect(invalidos.every((e) => e.nivel === 'aviso' && e.origen === 'webhook')).toBe(true);
    expect(JSON.stringify(invalidos.map((e) => e.datos))).not.toContain('SUPER');

    // OP-35 con un formato reconocido: el intento 1 copia la interpretación y el movimiento tiene el mismo estado
    const reconocidoId = await llega(
      { cuerpo: enc(JSON.stringify({ texto: RECONOCIDO, remitente: 'BAC' })) },
      deps(200),
    );
    const reconocido = await estadoDe(reconocidoId);
    const [primero] = reconocido.intentos;
    expect(reconocido.intentos).toHaveLength(1);
    expect(primero).toMatchObject({
      intento: 1,
      cuentaId: E1,
      ultimos4: '1234',
      monto: 1230,
      comercio: 'SUPER SELECTOS',
      errorDetalle: null,
    });
    expect(primero?.formatoId).not.toBeNull();
    expect(primero?.formatosCoincidentes).toEqual([primero?.formatoId]);
    expect(reconocido.movimiento).toMatchObject({
      id: uuidv5('1', reconocidoId),
      estado: primero?.resultado,
      cuentaId: E1,
      monto: 1230,
    });

    // N-02: procesarlo otra vez, válido o inválido, no agrega ni cambia intentos (ya tiene resultado, BE-62)…
    expect(await procesar(reconocidoId, deps(201))).toBeUndefined();
    expect(await procesar(reconocidoId, deps(201), 'esquema')).toBeUndefined();
    expect(await estadoDe(reconocidoId)).toEqual(reconocido);
    // …y lo omite bajo el bloqueo, sin llegar al respaldo de los UNIQUE (ningún error de OP-35 registrado)
    const errores = await leer(
      (t) => txPrisma(t).eventoSistema.count({ where: { mensaje: { endsWith: 'OP-35' } } }),
      reloj(0),
    );
    expect(errores).toBe(0);

    // Paso d (N-02): si c falla, otro `escribir()` registra el intento `error` y el movimiento en `error`
    const fallaId = await llega(
      { cuerpo: enc(JSON.stringify({ texto: 'falla en c', remitente: 'BAC' })) },
      deps(250, {
        aplicar: () => {
          throw new Error('fallo del dominio');
        },
      }),
    );
    const falla = await estadoDe(fallaId);
    expect(falla.intentos).toMatchObject([{ intento: 1, resultado: 'error' }]);
    expect(falla.intentos[0]?.errorDetalle).toMatch(/^INTERNO /);
    expect(falla.movimiento).toMatchObject({ id: uuidv5('1', fallaId), estado: 'error' });

    // BE-62: seis SMS guardados sin procesar; la petición de 3 minutos después procesa el suyo y 5 de ellos
    for (const n of [1, 2, 3, 4, 5, 6])
      await escribirSms(
        (tx) => guardarSms(tx, { texto: `sin resultado ${n}`, remitente: 'BAC' }),
        reloj(300),
      );
    expect(await pendientes(301)).toEqual([]); // margen de 2 minutos: compite con un `after()` en curso
    const seis = await pendientes(303);
    expect(seis).toHaveLength(6);
    // Pasado el tope de 20 s no barre; el suyo sí se procesó
    const tarde = await llega({}, deps(303, { transcurridoMs: () => TOPE_BARRIDO_MS + 1 }));
    expect((await estadoDe(tarde)).intentos).toHaveLength(1);
    expect(await pendientes(306)).toEqual(seis);
    // En el tope todavía barre: los 5 más antiguos, en orden de llegada, cada uno con su intento 1 y su movimiento
    await llega({}, deps(306, { transcurridoMs: () => TOPE_BARRIDO_MS }));
    expect(await pendientes(309)).toEqual([seis[5]]);
    for (const id of seis.slice(0, 5)) {
      const e = await estadoDe(id);
      expect({ intentos: e.intentos.map((i) => i.intento), estado: e.movimiento?.estado }).toEqual({
        intentos: [1],
        estado: 'no_reconocido',
      });
    }

    // 03 §5.1, nota: si el paso d tampoco obtiene el bloqueo, el SMS queda sin resultado y deja `procesar_fallido`
    const sinBloqueo = (): Promise<never> => Promise.reject(new Error('lock_timeout'));
    const huerfanos = await barrer(
      deps(309, { escribir: sinBloqueo }),
      () => 0,
      async () => {},
    );
    expect(huerfanos).toBe(1);
    expect(await pendientes(309)).toEqual([seis[5]]);
    const sinResultado = await llega({}, deps(400, { escribir: sinBloqueo }));
    expect((await estadoDe(sinResultado)).intentos).toEqual([]);
    const fallidos = await eventos('procesar_fallido');
    expect(fallidos.map((e) => [e.nivel, (e.datos as { smsId?: string } | null)?.smsId])).toEqual(
      expect.arrayContaining([['error', sinResultado]]),
    );
  });
});
