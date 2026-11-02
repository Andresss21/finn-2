// Recepción y procesamiento de SMS (FT-34, 1 de 2: CA-34.4 a CA-34.7; 04 §8.4; 01 §4.17; inv. 16): cada SMS llega a su
// hora local con el procesamiento real de OP-35 contra PostgreSQL como `finn_app`. El estado (cuentas, categoría) lo
// siembran las operaciones reales con el ejecutor `int` de los escenarios (DP-17): ninguna fila se escribe a mano, y la
// hora de recepción es la de `finn.ahora()` con un desfase calculado, sin reloj de pared ni `sleep` (07 §7.1).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guardarSms } from '@finn/db';
import { txPrisma } from '../../db/src/transacciones.ts';
import { consultar } from '../../db/test/ayudantes/base.ts';
import esc46 from '../../dominio/escenarios/datos/esc-46.ts';
import type { Escenario, Op } from '../../dominio/escenarios/tipos.ts';
import { procesar } from '../src/sms/procesar.ts';
import { ejecutorInt, type Estado } from './escenarios/int.ts';

const ESCENARIO = (id: string, ops: Op[]): Escenario => ({
  id,
  titulo: 'Semilla de FT-34',
  refs: [],
  hoy: '2027-02-20',
  estadoInicial: ops,
  pasos: [],
});

/** 'AAAA-MM-DDThh:mm' local (UTC−6, sin horario de verano) a milisegundos UTC. */
function instanteMs(local: string): number {
  const [dia = '', hm = ''] = local.split('T');
  const [h = 0, m = 0] = hm.split(':').map(Number);
  const [a = 0, mes = 1, d = 1] = dia.split('-').map(Number);
  return Date.UTC(a, mes - 1, d, h + 6, m);
}

const compra = (comercio: string, monto: string, resto = '') =>
  `VISA 1234: has realizado una compra por USD ${monto} en el comercio ${comercio} 2027/02/04${resto}`;

interface Fila {
  readonly id: string;
  readonly estado: string;
  readonly fecha: string | null;
  readonly monto: number | null;
  readonly recibido: string;
  readonly duplicado_movimiento_id: string | null;
}

describe('PRU-INT-BAND (FT-34: recepción y procesamiento)', () => {
  let s: Estado;

  const sql = async <T>(texto: string): Promise<T[]> =>
    (await consultar(s.base.urlAdmin, `SELECT row_to_json(f)::text FROM (${texto}) f`)).map(
      (t) => JSON.parse(t) as T,
    );
  /** El movimiento de un SMS, con la hora local de su recepción. */
  const movimiento = async (smsId: string): Promise<Fila> => {
    const [f] = await sql<Fila>(
      `SELECT m.id, m.estado, m.fecha::text AS fecha, m.monto, m.duplicado_movimiento_id,
              to_char(r.recibido_en AT TIME ZONE 'America/El_Salvador', 'YYYY-MM-DD"T"HH24:MI') AS recibido
         FROM finn.movimientos m JOIN finn.sms_recibidos r ON r.id = m.sms_id WHERE r.id = '${smsId}'`,
    );
    if (f === undefined) throw new Error(`el SMS ${smsId} no tiene movimiento`);
    return f;
  };
  const notificaciones = async (): Promise<number> =>
    (await sql<{ n: number }>('SELECT count(*)::int AS n FROM finn.notificaciones'))[0]?.n ?? 0;

  /** El SMS llega a `local` (hora de El Salvador): se guarda con ese instante y se procesa (04 §8.4). */
  async function llega(texto: string, local: string): Promise<string> {
    const hoy = local.slice(0, 10);
    const ahora = await s.tx.leer(
      async (t) => {
        const [r] = await txPrisma(t).$queryRaw<
          { ms: bigint }[]
        >`SELECT (extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms`;
        return Number(r?.ms);
      },
      { reloj: { hoy, desfaseMs: 0 } },
    );
    const opciones = () => ({ reloj: { hoy, desfaseMs: instanteMs(local) - ahora } });
    const sms = await s.tx.escribirSms(
      (tx) => guardarSms(tx, { texto, remitente: 'BAC' }),
      opciones(),
    );
    const fallo = await procesar(sms.id, {
      memoria: s.memoria,
      escribir: s.tx.escribir,
      leer: s.tx.leer,
      escribirTecnico: s.tx.escribirTecnico,
      opciones,
    });
    if (fallo !== undefined) throw new Error('el procesamiento no debió fallar');
    return sms.id;
  }

  beforeAll(async () => {
    // ESC-46: Ahorro, la tarjeta T con institución y últimos 4 (1234), la categoría Super y el SMS del paso 1
    s = await ejecutorInt.iniciar(
      ESCENARIO('SEM-BAND-34', [...esc46.estadoInicial, ...(esc46.pasos[0]?.ops ?? [])] as Op[]),
      '2027-02-20',
    );
  }, 120_000);
  afterAll(async () => {
    await s.cliente.$disconnect();
  });

  it('PRU-INT-BAND-106 [CA-34.6] el SMS de ESC-46 del 20 a las 19:00 con fecha 20/02 deja el movimiento con fecha 2027-02-20 y, aprobado el 21, la transacción queda en P1', async () => {
    const [m] = await sql<Fila>(
      `SELECT m.id, m.estado, m.fecha::text AS fecha, m.monto, m.duplicado_movimiento_id,
              to_char(r.recibido_en AT TIME ZONE 'America/El_Salvador', 'YYYY-MM-DD"T"HH24:MI') AS recibido
         FROM finn.movimientos m JOIN finn.sms_recibidos r ON r.id = m.sms_id`,
    );
    // 19:00 del día 20 son las 01:00 UTC del 21: la fecha sale de la hora local, no de la UTC (error 5)
    expect(m).toMatchObject({ estado: 'pendiente', fecha: '2027-02-20', monto: 3000 });
    expect(m?.recibido).toBe('2027-02-20T19:00');
    // Paso 3 de ESC-46: hoy 21 de febrero, "aprobar con categoría" a las 08:00
    for (const p of esc46.pasos.slice(1)) await ejecutorInt.paso(s, p);
    const [t] = await sql<{ fecha: string }>(
      `SELECT fecha::text AS fecha FROM finn.transacciones WHERE tipo = 'gasto'`,
    );
    expect(t?.fecha).toBe('2027-02-20'); // el día 20 es de P1 (21/01 a 20/02), aunque se aprobó el 21 (P2)
    expect(
      (
        await sql<{ estado: string }>(`SELECT estado FROM finn.movimientos WHERE id = '${m?.id}'`)
      )[0],
    ).toMatchObject({ estado: 'aprobado' });
  });

  it('PRU-INT-BAND-107 [CA-34.4] un SMS idéntico a otro de 9 minutos antes se autodescarta sin avisar; a los 10 minutos o más se evalúa normalmente', async () => {
    const antes = await notificaciones();
    const texto9 = compra('LIBRERIA NUEVE', '7.00');
    const primero = await llega(texto9, '2027-02-20T10:00');
    expect((await movimiento(primero)).estado).toBe('pendiente');
    expect(await notificaciones()).toBe(antes + 1);

    // 9 minutos después: autodescartado, con sus campos, y sin notificación que enviar (inv. 16, H12)
    const nueve = await llega(texto9, '2027-02-20T10:09');
    expect(await movimiento(nueve)).toMatchObject({ estado: 'autodescartado', monto: 700 });
    expect(await notificaciones()).toBe(antes + 1);

    // Con 10 minutos o más se evalúa normalmente. Se usan 11: la hora de recepción lleva los milisegundos reales entre
    // llamadas, así que el límite exacto de 10 no es estable aquí (lo fija PRU-DOM-BAND-101 [INV-16] con instantes puros)
    const texto10 = compra('LIBRERIA DIEZ', '8.00');
    await llega(texto10, '2027-02-20T11:00');
    const diez = await llega(texto10, '2027-02-20T11:11');
    expect((await movimiento(diez)).estado).toBe('pendiente');
    expect(await notificaciones()).toBe(antes + 3);
  });

  it('PRU-INT-BAND-108 [CA-34.5] dos compras de $3.50 en la misma tarjeta con 2 minutos de diferencia y distinta hora en el texto: la segunda queda como posible duplicado, no se descarta sola', async () => {
    const a = await llega(compra('CAFE LUNA', '3.50', ' 10:15'), '2027-02-20T10:15');
    const b = await llega(compra('CAFE LUNA', '3.50', ' 10:17'), '2027-02-20T10:17');
    const primero = await movimiento(a);
    const segundo = await movimiento(b);
    expect(primero.estado).toBe('pendiente');
    expect(segundo).toMatchObject({ estado: 'posible_duplicado', monto: 350 });
    // Apunta a la primera para que el usuario decida (CB-17); no es autodescarte
    expect(segundo.duplicado_movimiento_id).toBe(primero.id);
  });

  it('PRU-INT-BAND-109 [CA-34.7] un SMS sin fecha recibido a las 23:30 del día 20 en hora local (05:30 UTC del 21) queda con la fecha del 20', async () => {
    // Ningún formato sembrado omite la fecha (03 §9.5): se agrega uno de prueba, como lo haría OPT-05
    await consultar(
      s.base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       INSERT INTO finn.formatos_bancarios (institucion_id, nombre, tipo_movimiento, patron, banderas, monto_separador_miles, monto_separador_decimal)
         SELECT id, 'BAC compra sin fecha', 'compra',
                'VISA\\s+(?<ultimos4>\\d{4}):\\s+compra por USD\\s*(?<monto>[\\d,]+\\.?\\d*)\\s+en\\s+(?<comercio>.+)', 'i', ',', '.'
           FROM finn.instituciones WHERE lower(nombre) = 'bac'; COMMIT;`,
    );
    const id = await llega(
      'VISA 1234: compra por USD 4.20 en TIENDA SIN FECHA',
      '2027-02-20T23:30',
    );
    const m = await movimiento(id);
    expect(m.recibido).toBe('2027-02-20T23:30');
    expect(
      (
        await sql<{ utc: string }>(
          `SELECT to_char(recibido_en AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI') AS utc FROM finn.sms_recibidos WHERE id = '${id}'`,
        )
      )[0]?.utc,
    ).toBe('2027-02-21T05:30');
    expect(m).toMatchObject({ estado: 'pendiente', fecha: '2027-02-20', monto: 420 });
  });
});
