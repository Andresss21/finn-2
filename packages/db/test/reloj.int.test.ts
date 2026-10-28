// Reloj de la base (TA-056, CT-02; 07 §4.3 barreras 3 y 4, §4.4; V7-02). Una copia de la plantilla sin marca
// ni reloj simulado hace de producción; la base de prueba de 07 §5.2 (paso 5) tiene los dos. Ninguna prueba
// lee el reloj de pared: cada comparación usa `now()` de la misma transacción.
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { c5, c6 } from '../../../tools/db/plantilla.ts';
import {
  consultar,
  crearBasePrueba,
  fijarReloj,
  instalarRelojSimulado,
  leerRegla15,
} from './ayudantes/base.ts';

/** Una conexión para `fn`, cerrada al terminar. */
async function con<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

/** `fn` dentro de una transacción que se deshace al terminar. */
const enTransaccion = <T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> =>
  con(url, async (c) => {
    await c.query('BEGIN');
    try {
      return await fn(c);
    } finally {
      await c.query('ROLLBACK');
    }
  });

const UN_ANO_MS = 365 * 86_400_000;
const r15 = (url: string): Promise<string[]> => consultar(url, leerRegla15());

describe('PRU-ESQ-RELOJ', () => {
  const plantilla = crearBasePrueba({ reloj: false });
  const prueba = crearBasePrueba();
  const sembrada = crearBasePrueba({ reloj: false });

  it('PRU-ESQ-RELOJ-003 [C5, C6, R15] MIG-12, CT-02, P7-12 (V7-02 P1, P4, P5, P10; partes 1 a 4, CH-24): R15 da 0 filas en la plantilla, detecta el reloj simulado y 3 violaciones sembradas', async () => {
    expect(await r15(plantilla.urlMigraciones)).toEqual([]);
    expect(
      (await c5(plantilla.urlMigraciones, consultar)).filter((l) => l.startsWith('R15')),
    ).toEqual([]);
    // La base de prueba: R15 ve los tres reemplazos y C6 difiere exactamente en ahora, instante y desfase
    expect((await r15(prueba.urlMigraciones)).sort()).toEqual([
      'R15 cuerpo de ahora(): SELECT now() + finn.desfase()',
      'R15 cuerpo de instante(): SELECT clock_timestamp() + finn.desfase()',
      'R15 existe finn.desfase()',
    ]);
    const objetos = (await c6(prueba.urlMigraciones, consultar)).map((l) => l.split('|')[1]);
    expect([...new Set(objetos)].sort()).toEqual(['ahora()', 'desfase()', 'instante()']);
    // Control negativo: una función nueva con now(), el cuerpo de finn.ahora() alterado y un DEFAULT con
    // CURRENT_TIMESTAMP (parte 3, V7-02 P10) en una columna que no es de las 9 que exceptúa P7-12 b)
    await con(sembrada.urlMigraciones, (c) =>
      c.query(`CREATE FUNCTION finn.x_mala() RETURNS timestamptz LANGUAGE sql SECURITY DEFINER
                 SET search_path = finn, pg_catalog AS 'SELECT now()';
               CREATE OR REPLACE FUNCTION finn.ahora() RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER
                 SET search_path = finn, pg_catalog AS $$ SELECT now() + interval '1 day' $$;
               ALTER TABLE finn.notificaciones ALTER COLUMN leida_en SET DEFAULT CURRENT_TIMESTAMP;`),
    );
    const violaciones = [
      'R15 DEFAULT con reloj directo: notificaciones.leida_en = CURRENT_TIMESTAMP',
      "R15 cuerpo de ahora(): SELECT now() + interval '1 day'",
      'R15 reloj directo en x_mala()',
    ];
    expect((await r15(sembrada.urlMigraciones)).sort()).toEqual(violaciones);
    // R15 corre dentro de C5: el gancho de la plantilla cortaría
    expect(
      (await c5(sembrada.urlMigraciones, consultar)).filter((l) => l.startsWith('R15')).sort(),
    ).toEqual(violaciones);
  }, 60_000);

  it('PRU-ESQ-RELOJ-004 [R15] CT-02 (V7-02 P2, P3): en la plantilla, un desfase de un año se ignora y reloj-simulado.sql se niega a correr', async () => {
    const leer = (url: string) =>
      enTransaccion(url, async (c) => {
        await fijarReloj(c, { desfaseMs: UN_ANO_MS });
        const { rows } = await c.query<{ ahora: string; instante: string }>(
          `SELECT extract(epoch FROM finn.ahora() - now())::bigint * 1000 AS ahora,
                  (finn.instante() >= now() + interval '364 days')::text AS instante`,
        );
        return rows[0];
      });
    // Producción: el ajuste no existe para finn.ahora() ni para finn.instante()
    expect(await leer(plantilla.url)).toEqual({ ahora: '0', instante: 'false' });
    // Control positivo: en la base de prueba el mismo desfase sí corre los dos relojes
    expect(await leer(prueba.url)).toEqual({ ahora: String(UN_ANO_MS), instante: 'true' });
    // Sin la marca de base, reloj-simulado.sql falla antes de reemplazar nada
    await expect(instalarRelojSimulado(plantilla)).rejects.toThrow(
      /no está marcada como base de prueba \(finn\.reloj_simulado\)/,
    );
    expect(await r15(plantilla.urlMigraciones)).toEqual([]);
  }, 60_000);

  it('PRU-ESQ-RELOJ-005 [R15] DB-08, CT-02 (V7-02 P9): finn.hoy() solo respeta finn.hoy con la marca, y finn_app no puede activarla', async () => {
    const hoy = (url: string, marcaDeSesion: boolean) =>
      enTransaccion(url, async (c) => {
        await fijarReloj(c, { hoy: '2020-02-29' });
        if (marcaDeSesion) await c.query("SELECT set_config('finn.reloj_simulado', 'on', true)");
        const { rows } = await c.query<{ simulado: boolean; real: boolean }>(
          `SELECT finn.hoy() = date '2020-02-29' AS simulado,
                  finn.hoy() = (now() AT TIME ZONE 'America/El_Salvador')::date AS real`,
        );
        return rows[0];
      });
    expect(await hoy(prueba.url, false)).toEqual({ simulado: true, real: false });
    expect(await hoy(plantilla.url, false)).toEqual({ simulado: false, real: true });
    // La marca puesta por la sesión no cuenta: hoy() lee pg_db_role_setting
    expect(await hoy(plantilla.url, true)).toEqual({ simulado: false, real: true });
    const error = await con(plantilla.url, (c) =>
      c.query(`ALTER DATABASE ${plantilla.nombre} SET finn.reloj_simulado = on`).then(
        () => 'ok',
        (e: unknown) => (e as { code?: string }).code,
      ),
    );
    expect(error).toBe('42501');
    expect(await hoy(plantilla.url, false)).toEqual({ simulado: false, real: true });
  }, 60_000);
});

