// El webhook y el cron por HTTP (TA-216; 04 §8.1, §8.2, §10.1; N-01; BE-44, BE-61): cada handler se llama con un `Request`
// en el mismo proceso, contra la base de prueba como `finn_app`. Solo `after()` se reemplaza, porque necesita el contexto
// de una petición de Next: la prueba recoge lo que se le pasa y lo corre cuando quiere ver el antes y el después.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { rotarToken } from '@finn/aplicacion/sms/token';
import { consultar, crearBasePrueba } from '../../../../../../tools/pruebas/rh.ts';
import { GET } from '../tareas/diaria/route.ts';
import { POST } from './route.ts';

const h = vi.hoisted((): { despues: (() => Promise<void>)[]; forzado: unknown } => ({
  despues: [],
  // Si no es `null`, lo que devuelve `recibir` sin tocar la base (el 503 de N-01 punto 2)
  forzado: null,
}));
vi.mock('next/server', () => ({ after: (t: () => Promise<void>) => h.despues.push(t) }));
vi.mock('@finn/aplicacion/sms/recibir', async (original) => {
  const real = await original<typeof import('@finn/aplicacion/sms/recibir')>();
  return {
    ...real,
    recibir: (...a: Parameters<typeof real.recibir>) => h.forzado ?? real.recibir(...a),
  };
});

const URL_SMS = 'http://finn.test/api/sms';
const SECRETO = 'c'.repeat(32);
const AHORA_MS = 1_900_000_000_000;

describe('PRU-RH-BAND y PRU-SEG-BAND', () => {
  const base = crearBasePrueba();
  let token = '';

  const post = (cuerpo: BodyInit | null, cabeceras: Record<string, string>, autorizacion = token) =>
    POST(
      new Request(URL_SMS, {
        method: 'POST',
        body: cuerpo,
        headers: { authorization: `Bearer ${autorizacion}`, ...cabeceras },
      }),
    );
  const json = (cuerpo: unknown) =>
    post(JSON.stringify(cuerpo), { 'content-type': 'application/json' });
  // `id` y `mensaje` son de la prueba o de la base, nunca de afuera
  const filas = async (desde: string): Promise<Record<string, unknown>[]> =>
    (await consultar(base.urlAdmin, `SELECT row_to_json(f)::text FROM (${desde}) f`)).map(
      (t) => JSON.parse(t) as Record<string, unknown>,
    );
  const sms = async (id: string) =>
    (await filas(`SELECT texto, remitente FROM finn.sms_recibidos WHERE id = '${id}'`))[0] ?? {};
  const contarSms = async () => (await filas('SELECT id FROM finn.sms_recibidos')).length;
  const procesamientos = (smsId: string) =>
    filas(`SELECT resultado, error_detalle FROM finn.sms_procesamientos WHERE sms_id = '${smsId}'`);
  const eventos = (mensaje: string) =>
    filas(
      `SELECT datos FROM finn.eventos_sistema WHERE mensaje = '${mensaje}' ORDER BY ocurrido_en, id`,
    );
  const idDe = async (r: Response): Promise<string> => {
    expect(r.status).toBe(200);
    const c = (await r.json()) as { recibido: boolean; id: string };
    expect(c.recibido).toBe(true);
    return c.id;
  };
  const correrDespues = async () => {
    for (const t of h.despues.splice(0)) await t();
  };

  beforeAll(async () => {
    process.env['DATABASE_URL'] = base.url;
    token = (await rotarToken()).token;
  });
  beforeEach(() => {
    h.despues.length = 0;
    h.forzado = null;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('PRU-SEG-BAND-001 [N-01] RH-sms: sin token, con token viejo y con otra longitud, 401 sin guardar nada', async () => {
    const viejo = token;
    token = (await rotarToken()).token;
    const antes = await contarSms();
    const cuerpo = JSON.stringify({ texto: 'hola', remitente: 'BAC' });
    const ct = { 'content-type': 'application/json' };
    const respuestas = [
      await POST(new Request(URL_SMS, { method: 'POST', body: cuerpo, headers: ct })),
      await post(cuerpo, ct, viejo),
      await post(cuerpo, ct, 'r'.repeat(10)),
      await post(cuerpo, ct, 'r'.repeat(200)),
    ];
    expect(respuestas.map((r) => r.status)).toEqual([401, 401, 401, 401]);
    expect(await contarSms()).toBe(antes);
    expect(h.despues).toHaveLength(0);
    // 8.2 paso 2: un evento por intento, sin datos de la petición
    const avisos = await eventos('token_invalido');
    expect(avisos.length).toBeGreaterThanOrEqual(4);
    expect(avisos.every((e) => e.datos === null)).toBe(true);
    // El token vigente sí entra: los 401 no eran por otra cosa
    expect(await idDe(await json({ texto: 'hola', remitente: 'BAC' }))).toEqual(expect.any(String));
  });

  it('PRU-RH-BAND-101 [N-01] RH-sms: variante JSON: 200 con el id una vez guardado y procesa en after(), no antes', async () => {
    const id = await idDe(await json({ texto: 'con "comillas"\ny salto', remitente: 'BAC', x: 1 }));
    expect(await sms(id)).toMatchObject({ texto: 'con "comillas"\ny salto', remitente: 'BAC' });
    // BE-44: respondió y todavía no hay resultado; lo deja `after()`
    expect(h.despues).toHaveLength(1);
    expect(await procesamientos(id)).toEqual([]);
    await correrDespues();
    expect(await procesamientos(id)).toMatchObject([{ resultado: 'no_reconocido' }]);
  });

  it('PRU-RH-BAND-101 [N-01] RH-sms: variante texto: el cuerpo sin modificar y el remitente de X-Finn-Remitente', async () => {
    vi.stubEnv('FINN_WEBHOOK_FORMATO', 'texto');
    const texto = 'por texto, con "comillas"\ny salto'; // otro texto: el mismo se autodescartaría (H12)
    const id = await idDe(
      await post(texto, {
        'content-type': 'text/plain; charset=utf-8',
        'x-finn-remitente': 'BAC',
      }),
    );
    expect(await sms(id)).toMatchObject({ texto, remitente: 'BAC' });
    await correrDespues();
    expect(await procesamientos(id)).toMatchObject([{ resultado: 'no_reconocido' }]);
  });

  it('PRU-RH-BAND-101 [N-01] RH-sms: la otra variante y un cuerpo roto se guardan y responden 200, en error (BE-60, BE-61)', async () => {
    const casos: readonly [string, string, string][] = [
      ['json', 'text/plain', 'content_type'],
      ['texto', 'application/json', 'content_type'],
      ['json', 'application/json', 'json_invalido'],
    ];
    for (const [formato, contentType, detalle] of casos) {
      vi.stubEnv('FINN_WEBHOOK_FORMATO', formato);
      const id = await idDe(await post('{"texto": roto', { 'content-type': contentType }));
      expect(await sms(id)).toMatchObject({ texto: '{"texto": roto', remitente: 'desconocido' });
      await correrDespues();
      expect(await procesamientos(id)).toMatchObject([
        { resultado: 'error', error_detalle: `cuerpo_invalido: ${detalle}` },
      ]);
    }
  });

  it('PRU-RH-BAND-101 [N-01] RH-sms: 503 con Retry-After si no se pudo guardar, y sin after()', async () => {
    h.forzado = Promise.resolve({ estado: 503, reintentarEn: 30 });
    const r = await json({ texto: 'hola', remitente: 'BAC' });
    expect(r.status).toBe(503);
    expect(r.headers.get('retry-after')).toBe('30');
    expect(h.despues).toHaveLength(0);
  });

  it('PRU-RH-BAND-101 RH-sms: 413 sin guardar por Content-Length y por el flujo, antes de autenticar (BE-59)', async () => {
    const antes = await contarSms();
    const limite = 16 * 1024;
    const ct = { 'content-type': 'text/plain' };
    const conLongitud = new Request(URL_SMS, {
      method: 'POST',
      body: 'x',
      headers: { ...ct, 'content-length': String(limite + 1) },
    });
    expect((await POST(conLongitud)).status).toBe(413);
    let cancelado = false;
    const flujo = new ReadableStream<Uint8Array>({
      pull(c) {
        c.enqueue(new Uint8Array(limite));
      },
      cancel() {
        cancelado = true;
      },
    });
    const r = await POST(
      new Request(URL_SMS, {
        method: 'POST',
        body: flujo,
        headers: ct,
        duplex: 'half',
      } as RequestInit),
    );
    expect(r.status).toBe(413);
    expect(cancelado).toBe(true);
    expect(await contarSms()).toBe(antes);
    // Justo en el límite no es un 413: se guarda, recortado a los 2.000 caracteres de BE-60
    const justo = await idDe(await post('x'.repeat(limite), ct));
    expect((await sms(justo))['texto']).toHaveLength(2000);
  });

  const cron = (autorizacion?: string) =>
    GET(
      new Request('http://finn.test/api/tareas/diaria', {
        headers: autorizacion === undefined ? {} : { authorization: autorizacion },
      }),
    );

  it('PRU-RH-BAND-101 RH-tareas-diaria: exige CRON_SECRET: 401 sin ejecutar nada, también si el secreto falta o es corto', async () => {
    vi.stubEnv('CRON_SECRET', SECRETO);
    const antes = (await eventos('diaria')).length;
    for (const a of [undefined, SECRETO, 'Bearer otro', `Bearer ${SECRETO}x`])
      expect((await cron(a)).status).toBe(401);
    vi.stubEnv('CRON_SECRET', '');
    expect((await cron('Bearer ')).status).toBe(401);
    vi.stubEnv('CRON_SECRET', 'corto');
    expect((await cron('Bearer corto')).status).toBe(401);
    expect((await eventos('diaria')).length).toBe(antes);
  });

  it('PRU-RH-BAND-101 RH-tareas-diaria: con el secreto corre todos los pasos con el reloj de prueba y deja su evento (10.1, CT-01)', async () => {
    vi.stubEnv('CRON_SECRET', SECRETO);
    vi.stubEnv('FINN_ENTORNO', 'pruebas');
    vi.stubEnv('VERCEL_ENV', undefined);
    const archivo = join(mkdtempSync(join(tmpdir(), 'finn-rh-')), 'reloj.json');
    const instante = '2031-03-15T18:00:00.000Z';
    writeFileSync(archivo, JSON.stringify({ instante, fijadoEn: AHORA_MS }));
    vi.stubEnv('FINN_RELOJ_ARCHIVO', archivo);
    vi.spyOn(Date, 'now').mockReturnValue(AHORA_MS);
    const r = await cron(`Bearer ${SECRETO}`);
    expect(r.status).toBe(200);
    const c = (await r.json()) as { hoy: string; pasos: { paso: number }[] };
    expect(c.hoy).toBe('2031-03-15');
    expect(c.pasos.map((p) => p.paso)).toEqual([1, 2, 3, 4, 5, 6]); // el paso 7 es el evento de fin
    const fin = await eventos('diaria');
    expect(fin.at(-1)?.datos).toMatchObject({ hoy: '2031-03-15' });
  });

  it('PRU-RH-BAND-101 RH-tareas-diaria: vercel.json trae el cron diario y los plazos de 04 §10.5', () => {
    const v = JSON.parse(
      readFileSync(new URL('../../../../vercel.json', import.meta.url), 'utf8'),
    ) as unknown;
    expect(v).toEqual({
      regions: ['iad1'],
      crons: [{ path: '/api/tareas/diaria', schedule: '5 6 * * *' }],
      functions: {
        'src/app/api/tareas/diaria/route.ts': { maxDuration: 300 },
        'src/app/api/sms/route.ts': { maxDuration: 30 },
      },
    });
  });
});
