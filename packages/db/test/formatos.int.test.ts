// Formatos de la frontera (TA-158; 04 §13.5, §13.3, §13.2; BE-28, BE-29): V-15 de 04 como prueba permanente (07 §20.1).
// La primera lectura de 4.2 devuelve revisión, hoy e instante con el formato que esperan los contratos, y
// `json_build_array` serializa una columna `date` sin hora (la carga del motor, 5.2, depende de eso).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generado/prisma/client.ts';
import type { Cliente } from '../src/cliente.ts';
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

  it('PRU-INT-VAL-002 [V-15] BE-28, BE-29: la primera lectura devuelve revision (cadena decimal), hoy (AAAA-MM-DD) e instante ISO UTC con milisegundos, y json_build_array serializa un date como "2026-12-21"', async () => {
    const reloj = { hoy: '2026-10-14', desfaseMs: 0 };
    const r = await tx.escribir(
      async (t) => {
        await txPrisma(t).vigenciaCiclo.create({
          data: { diaInicio: 15, rigeDesde: new Date('2026-12-21T00:00:00.000Z') },
        });
        const [fila] = await txPrisma(t).$queryRaw<
          { fila: string }[]
        >`SELECT json_build_array(id, rige_desde)::text AS fila FROM finn.vigencias_ciclo WHERE rige_desde IS NOT NULL`;
        return { estado: t.estado, fila: fila?.fila ?? '' };
      },
      { reloj },
    );
    // Revisión: texto de 1 a 19 cifras, el contrato `revision` de 13.3
    expect(r.estado.revision).toMatch(/^\d{1,19}$/);
    expect(r.estado.hoy).toBe('2026-10-14');
    // Instante: exactamente `2026-10-14T04:04:00.549Z` (ISO, UTC, tres decimales)
    expect(r.estado.instante).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(r.estado.instante).toISOString()).toBe(r.estado.instante);
    // La fecha viaja como texto, sin hora ni zona
    const [, fecha] = JSON.parse(r.fila) as [string, string];
    expect(fecha).toBe('2026-12-21');
    expect(r.fila).toContain('"2026-12-21"');
    // La lectura sin escritura devuelve revisión y hoy con los mismos formatos
    const lectura = await tx.leer((t) => Promise.resolve(t.estado), { reloj });
    expect(lectura.revision).toMatch(/^\d{1,19}$/);
    expect(lectura.hoy).toBe('2026-10-14');
  });
});
