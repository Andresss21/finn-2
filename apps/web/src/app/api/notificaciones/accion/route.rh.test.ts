// Las acciones desde una notificación por HTTP (TA-217; 04 §11.5, §12.3; BE-54, CH-06): el handler se llama con un
// `Request` en el mismo proceso, contra la base de prueba como `finn_app`. Solo se reemplazan Supabase (la sesión),
// las cookies y `after()`. Los movimientos con coincidencia se siembran como en PRU-INT-BAND: la base no deja llegar a
// ese estado desde `pendiente` (03 §7.1).
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consultar,
  crearBasePrueba,
  escribirHechosDePrueba,
  HOY,
} from '../../../../../../../tools/pruebas/rh.ts';
import { POST } from './route.ts';

const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
// Los de `escribirHechosDePrueba`: el efectivo, una categoría y una programada
const [E1, C1, PG1] = [uuid(1), uuid(11), uuid(17)];
const A_RECHAZAR = uuid(2001);
const A_CONFIRMAR = uuid(2002);
const USUARIO = uuid(999);
const NOTIFICACION = uuid(901);
const AHORA_MS = 1_900_000_000_000;
const ORIGEN = 'http://finn.test';
const VALIDAS = { origin: ORIGEN, 'x-finn-accion': '1' };

interface Simulado {
  despues: (() => Promise<void>)[];
  aal: string | null;
  usuarioVigente: boolean;
  usuarioId: string;
}
const h = vi.hoisted((): Simulado => ({
  despues: [],
  // Las claims de la cookie y lo que responde `getUser()`: pueden no coincidir (una sesión revocada)
  aal: 'aal2',
  usuarioVigente: true,
  usuarioId: '00000000-0000-4000-8000-000000000999',
}));
vi.mock('next/server', () => ({ after: (t: () => Promise<void>) => h.despues.push(t) }));
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ getAll: () => [], set: () => undefined }),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getClaims: () =>
        Promise.resolve({
          data: h.aal === null ? null : { claims: { sub: h.usuarioId, aal: h.aal } },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: { user: h.usuarioVigente ? { id: h.usuarioId } : null },
          error: null,
        }),
    },
  }),
}));

// Cada uno con su monto: con el mismo, rechazar uno lo deja como posible duplicado del otro (OP-40)
const sembrar = (id: string, sms: string, minuto: number, monto: number): string =>
  `INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en)
     VALUES ('${sms}', 'sms propio ${minuto}', 'banco', timestamptz '2027-02-04T10:${minuto}:00Z');
   INSERT INTO finn.movimientos (id, sms_id, estado, cuenta_id, fecha, monto, comercio, tipo_propuesto, esperada_programada_id, esperada_fecha)
     VALUES ('${id}', '${sms}', 'con_coincidencia', '${E1}', date '${HOY}', ${monto}, 'Netflix', 'gasto', '${PG1}', date '${HOY}');
   INSERT INTO finn.movimiento_lineas (movimiento_id, orden, monto, categoria_id)
     VALUES ('${id}', 1, ${monto}, '${C1}');`;

describe('PRU-SEG-NOTIF', () => {
  const base = crearBasePrueba();
  const columna = async (c: string, id: string) =>
    (await consultar(base.urlAdmin, `SELECT ${c} FROM finn.movimientos WHERE id = '${id}'`))[0];
  const correrDespues = async () => {
    for (const t of h.despues.splice(0)) await t();
  };
  const accion = (
    cabeceras: Record<string, string> = VALIDAS,
    cuerpo: unknown = {
      notificacionId: NOTIFICACION,
      movimientoId: A_RECHAZAR,
      decision: 'rechazar',
    },
  ) =>
    POST(
      new Request(`${ORIGEN}/api/notificaciones/accion`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...cabeceras },
        body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
      }),
    );

  beforeAll(async () => {
    process.env['DATABASE_URL'] = base.url;
    await escribirHechosDePrueba(base);
    await consultar(
      base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       ${sembrar(A_RECHAZAR, uuid(2101), 21, 1111)}
       ${sembrar(A_CONFIRMAR, uuid(2102), 22, 2222)}
       COMMIT;`,
    );
  });
  beforeEach(() => {
    vi.stubEnv('FINN_USUARIO_ID', USUARIO);
    vi.stubEnv('FINN_ENTORNO', 'pruebas');
    vi.stubEnv('VERCEL_ENV', undefined);
    const archivo = join(mkdtempSync(join(tmpdir(), 'finn-rh-')), 'reloj.json');
    writeFileSync(
      archivo,
      JSON.stringify({ instante: `${HOY}T18:00:00.000Z`, fijadoEn: AHORA_MS }),
    );
    vi.stubEnv('FINN_RELOJ_ARCHIVO', archivo);
    vi.spyOn(Date, 'now').mockReturnValue(AHORA_MS);
    h.aal = 'aal2';
    h.usuarioVigente = true;
    h.despues.length = 0;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('PRU-SEG-NOTIF-001 RH-notificaciones-accion: sin Origin de la app, sin X-Finn-Accion o sin AAL2 se rechaza sin tocar el movimiento', async () => {
    expect((await accion({ 'x-finn-accion': '1' })).status).toBe(403);
    expect((await accion({ origin: 'https://otro.example', 'x-finn-accion': '1' })).status).toBe(
      403,
    );
    expect((await accion({ origin: ORIGEN })).status).toBe(403);
    expect((await accion({ origin: ORIGEN, 'x-finn-accion': '0' })).status).toBe(403);

    h.aal = null;
    expect((await accion()).status).toBe(401);
    h.aal = 'aal1';
    expect((await accion()).status).toBe(401);
    // AAL2 en la cookie, pero `getUser()` ya no la reconoce: las claims solas no alcanzan (12.3)
    h.aal = 'aal2';
    h.usuarioVigente = false;
    expect((await accion()).status).toBe(401);

    expect(h.despues).toHaveLength(0);
    expect(await columna('estado', A_RECHAZAR)).toBe('con_coincidencia');
  });

  it('PRU-SEG-NOTIF-001 RH-notificaciones-accion: con los tres requisitos, rechazar ejecuta OP-40 y quita la propuesta; repetirla responde 200 igual', async () => {
    expect((await accion()).status).toBe(200);
    await correrDespues();
    expect(await columna('estado', A_RECHAZAR)).toBe('pendiente');
    expect(await columna('esperada_programada_id', A_RECHAZAR)).toBe('');
    expect((await accion()).status).toBe(200);
    await correrDespues();
    expect(await columna('estado', A_RECHAZAR)).toBe('pendiente');
  });

  it('PRU-SEG-NOTIF-001 RH-notificaciones-accion: con los tres requisitos, confirmar aprueba el movimiento; repetirla no crea otra transacción', async () => {
    const cuerpo = {
      notificacionId: NOTIFICACION,
      movimientoId: A_CONFIRMAR,
      decision: 'confirmar',
    };
    expect((await accion(VALIDAS, cuerpo)).status).toBe(200);
    await correrDespues();
    expect(await columna('estado', A_CONFIRMAR)).toBe('aprobado');
    const transaccion = await columna('transaccion_id', A_CONFIRMAR);
    expect(transaccion).not.toBe('');
    expect((await accion(VALIDAS, cuerpo)).status).toBe(200);
    await correrDespues();
    expect(await columna('transaccion_id', A_CONFIRMAR)).toBe(transaccion);
  });

  it('PRU-SEG-NOTIF-001 RH-notificaciones-accion: un cuerpo roto o un movimiento inexistente responden 422 (11.5)', async () => {
    expect((await accion(VALIDAS, '{roto')).status).toBe(422);
    expect(
      (
        await accion(VALIDAS, {
          notificacionId: NOTIFICACION,
          movimientoId: NOTIFICACION,
          decision: 'rechazar',
        })
      ).status,
    ).toBe(422);
  });
});
