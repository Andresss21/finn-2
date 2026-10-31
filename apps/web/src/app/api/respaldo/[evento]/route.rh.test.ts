// `POST /api/respaldo/[evento]` por HTTP (TA-217; 04 §12.5, §16.3, §16.4; OPT-09), contra la base de prueba como
// `finn_app`. Las reglas de cada cuerpo son de PRU-INT-RESP-101: aquí, que el handler traduce el resultado.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { consultar, crearBasePrueba } from '../../../../../../../tools/pruebas/rh.ts';
import { POST } from './route.ts';

const SECRETO = 'r'.repeat(32);

describe('PRU-RH-RESP', () => {
  const base = crearBasePrueba();
  const sql = (texto: string) => consultar(base.urlAdmin, texto);
  const post = (evento: string, cuerpo: string | undefined, autorizacion?: string) =>
    POST(
      new Request(`http://finn.test/api/respaldo/${evento}`, {
        method: 'POST',
        headers: autorizacion === undefined ? {} : { authorization: autorizacion },
        ...(cuerpo === undefined ? {} : { body: cuerpo }),
      }),
      { params: Promise.resolve({ evento }) },
    );
  const respaldo = JSON.stringify({
    objeto: 'diarios/2027-02-05.dump.age',
    revision: '7',
    bytes: 9,
  });

  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('PRU-RH-RESP-101 RH-respaldo: sin RESPALDO_SECRET válido responde 401 y solo deja el aviso, también con el secreto vacío o corto', async () => {
    vi.stubEnv('RESPALDO_SECRET', SECRETO);
    for (const a of [undefined, SECRETO, 'Bearer otro', `Bearer ${SECRETO}x`])
      expect((await post('respaldo', respaldo, a)).status).toBe(401);
    vi.stubEnv('RESPALDO_SECRET', '');
    expect((await post('respaldo', respaldo, 'Bearer ')).status).toBe(401);
    vi.stubEnv('RESPALDO_SECRET', 'corto');
    expect((await post('respaldo', respaldo, 'Bearer corto')).status).toBe(401);
    expect(
      await sql('SELECT (ultimo_respaldo_en IS NULL)::text FROM finn.estado_respaldo'),
    ).toEqual(['true']);
    expect(
      await sql(`SELECT count(*) FROM finn.eventos_sistema WHERE mensaje = 'token_invalido'`),
    ).toEqual(['6']);
  });

  it('PRU-RH-RESP-101 RH-respaldo: con el secreto registra respaldo, restauración y deriva (200), y traduce 400 y 404', async () => {
    vi.stubEnv('RESPALDO_SECRET', SECRETO);
    const a = `Bearer ${SECRETO}`;
    expect((await post('respaldo', respaldo, a)).status).toBe(200);
    expect((await post('restauracion', undefined, a)).status).toBe(200);
    const deriva = JSON.stringify({ control: 'C5', filas: 2 });
    expect((await post('deriva', deriva, a)).status).toBe(200);
    expect(
      await sql(
        `SELECT mensaje FROM finn.eventos_sistema WHERE origen = 'respaldo' AND nivel <> 'aviso' ORDER BY ocurrido_en, id`,
      ),
    ).toEqual(['respaldo', 'restauracion', 'deriva']);
    expect(
      await sql(
        `SELECT (ultimo_respaldo_en IS NOT NULL AND ultima_restauracion_en IS NOT NULL)::text FROM finn.estado_respaldo`,
      ),
    ).toEqual(['true']);
    expect((await post('respaldo', '{roto', a)).status).toBe(400);
    expect((await post('borrar', '{}', a)).status).toBe(404);
  });
});
