// Mapeo de fechas, instantes y montos (TA-151; 04 §13.2, §13.3, §13.6; ADR-16; BE-28, BE-29, BE-33): V-14 y V-17
// de 04 como pruebas permanentes (07 §20.1). Portado de docs/anexos/04-backend-verificacion/t5.ts y t8.ts. La base
// tiene la zona America/Guatemala: así "la sesión está en UTC" no pasa por casualidad.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { Centavos, FechaLocal } from '@finn/dominio/valores';
import { PrismaClient } from '../src/generado/prisma/client.ts';
import type { Cliente } from '../src/cliente.ts';
import {
  dateDeFechaLocal,
  dateDeInstante,
  fechaLocalDeDate,
  instanteDeDate,
} from '../src/mapeo/fechas.ts';
import {
  bigintDeRevision,
  centavosDeEntero,
  enteroDeCentavos,
  revisionDeBigint,
} from '../src/mapeo/montos.ts';
import { transaccionesSobre, txPrisma } from '../src/transacciones.ts';
import { consultar, crearBasePrueba } from './ayudantes/base.ts';

describe('PRU-INT-VAL', () => {
  const base = crearBasePrueba();
  let db: Cliente;
  let tx: ReturnType<typeof transaccionesSobre>;

  beforeAll(async () => {
    await consultar(
      base.urlAdmin,
      `ALTER DATABASE ${base.nombre} SET TimeZone = 'America/Guatemala'`,
    );
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: base.url, max: 3 }) });
    tx = transaccionesSobre(db);
  });
  afterAll(async () => {
    await db.$disconnect();
  });

  it('PRU-INT-VAL-001 [V-14] ADR-16, BE-28, BE-29: una columna @db.Date hace la ida y vuelta como FechaLocal con TZ=America/El_Salvador, donde getDate() devuelve el día anterior; Centavos y la revisión (bigint) viajan sin pérdida', async () => {
    const zonaAntes = process.env['TZ'];
    process.env['TZ'] = 'America/El_Salvador';
    try {
      // La zona del proceso cambió de verdad: la medianoche UTC del 21 es el 20 a las 18:00 locales
      expect(new Date('2026-12-21T00:00:00.000Z').getTimezoneOffset()).toBe(360);
      const f = FechaLocal.desdeTexto('2026-12-21');
      const filaEscrita = await tx.escribir(
        (t) =>
          txPrisma(t).vigenciaCiclo.create({
            data: { diaInicio: 15, rigeDesde: dateDeFechaLocal(f) },
          }),
        { reloj: { hoy: '2026-10-14', desfaseMs: 0 } },
      );
      const leida = await tx.leer(
        (t) => txPrisma(t).vigenciaCiclo.findUniqueOrThrow({ where: { id: filaEscrita.id } }),
        { reloj: { hoy: '2026-10-14', desfaseMs: 0 } },
      );
      const d = leida.rigeDesde;
      expect(d).toBeInstanceOf(Date);
      if (!d) return;
      // El fallo que el mapeo evita (04 §13.2): los métodos locales dan el día anterior
      expect(d.getDate()).toBe(20);
      expect(d.getUTCDate()).toBe(21);
      expect(fechaLocalDeDate(d)).toBe(f);
      expect(dateDeFechaLocal(fechaLocalDeDate(d)).getTime()).toBe(d.getTime());
      // La base ve la misma fecha que el dominio
      const [s] = await consultar(
        base.urlAdmin,
        `SELECT rige_desde::text FROM finn.vigencias_ciclo WHERE id = '${filaEscrita.id}'`,
      );
      expect(s).toBe(f);
    } finally {
      if (zonaAntes === undefined) delete process.env['TZ'];
      else process.env['TZ'] = zonaAntes;
    }
    // Montos: integer de 32 bits en centavos; fuera de rango es un error del llamador
    expect(centavosDeEntero(123_450)).toBe(Centavos.desdeTexto('1234.50'));
    expect(enteroDeCentavos(Centavos.desdeTexto('-1234.50'))).toBe(-123_450);
    expect(enteroDeCentavos(Centavos.desdeEntero(2_147_483_647))).toBe(2_147_483_647);
    expect(() => enteroDeCentavos(Centavos.desdeEntero(2_147_483_648))).toThrow(RangeError);
    // Revisión: bigint ↔ cadena decimal, exacta más allá de 2^53
    expect(revisionDeBigint(9_007_199_254_740_993n)).toBe('9007199254740993');
    expect(bigintDeRevision('9007199254740993')).toBe(9_007_199_254_740_993n);
    expect(() => bigintDeRevision('-1')).toThrow(RangeError);
    expect(() => bigintDeRevision('12a')).toThrow(RangeError);
  });

  it('PRU-INT-VAL-003 [V-17] BE-33, CT-02: con la sesión de la base en America/Guatemala, un timestamptz escrito por Prisma y por SQL se lee igual dentro de escribir() y leer(), y fuera de ellos Prisma lo desplaza (la razón de set_config)', async () => {
    const instante = '2026-10-14T04:00:00.000Z';
    const clave = 'VAL-003';
    const id = await tx.escribir(async (t) => {
      const p = txPrisma(t);
      const n = await p.notificacion.create({
        data: { motivo: clave, titulo: clave, cuerpo: clave, creadaEn: dateDeInstante(instante) },
      });
      // El mismo instante escrito por SQL: debe coincidir con el de Prisma
      await p.$executeRaw`UPDATE finn.notificaciones SET leida_en = ${instante}::timestamptz WHERE id = ${n.id}::uuid`;
      return n.id;
    });
    const leida = await tx.leer((t) =>
      txPrisma(t).notificacion.findUniqueOrThrow({ where: { id } }),
    );
    expect(instanteDeDate(leida.creadaEn)).toBe(instante);
    expect(leida.leidaEn && instanteDeDate(leida.leidaEn)).toBe(instante);
    const [crudo] = await consultar(
      base.urlAdmin,
      `SELECT to_char(creada_en AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') FROM finn.notificaciones WHERE id = '${id}'`,
    );
    expect(crudo).toBe(instante);
    // Contraste: sin la zona UTC de la transacción, Prisma envía la hora UTC como hora de la sesión (-6 h)
    const fuera = await db.notificacion.findUniqueOrThrow({ where: { id } });
    expect(instanteDeDate(fuera.creadaEn)).not.toBe(instante);
    // Formato: solo se acepta el de 04 §13.3
    expect(() => dateDeInstante('2026-10-14T04:00:00Z')).toThrow(RangeError);
    expect(() => dateDeInstante('2026-10-14 04:00:00.000')).toThrow(RangeError);
  });
});
