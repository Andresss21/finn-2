// C3, C5 y C6 de 03 §11.6 (TA-051, CH-21): pasan sobre una copia de la plantilla y fallan sobre una
// copia dañada (trigger deshabilitado, índice de expresión borrado), como en 03 §10.5.
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { c5, c6, prepararPlantilla } from '../../../tools/db/plantilla.ts';
import { consultar, crearBasePrueba } from './ayudantes/base.ts';

// Dos copias, para que ninguna prueba dependa del orden de la otra; la sana, sin reloj simulado (CT-02)
const sana = crearBasePrueba({ reloj: false });
const copia = crearBasePrueba();

async function comoAdmin(sql: string): Promise<void> {
  const c = new pg.Client({ connectionString: copia.urlAdmin });
  await c.connect();
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }
}

describe('PRU-ESQ-ESQ', () => {
  it('PRU-ESQ-ESQ-101 [C3, C5, C6, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R14] MIG-01 a MIG-08, MIG-schema: migrate deploy aplica todo sin pendientes, sin violaciones ni diferencias en la copia sana', async () => {
    await expect(prepararPlantilla(sana.urlMigraciones, consultar)).resolves.toBeUndefined();
    expect(await c5(sana.urlMigraciones, consultar)).toEqual([]);
    expect(await c6(sana.urlMigraciones, consultar)).toEqual([]);
  }, 120_000);

  it('PRU-ESQ-ESQ-102 [C5, C6] fallan sobre una copia dañada: trigger deshabilitado e índice de expresión borrado', async () => {
    await comoAdmin(`ALTER TABLE finn.grupos DISABLE TRIGGER a_exigir_bloqueo;
                     DROP INDEX finn.ux_reglas_patron;`);
    const reglas = await c5(copia.urlMigraciones, consultar);
    expect(reglas.some((l) => l.includes('grupos') && l.includes('a_exigir_bloqueo'))).toBe(true);
    const diferencias = await c6(copia.urlMigraciones, consultar);
    // El índice falta (lo que ninguna regla genérica sabe) y el trigger cambió de estado
    expect(diferencias.filter((l) => l.includes('ux_reglas_patron'))).toEqual([
      '- indice|CREATE UNIQUE INDEX ux_reglas_patron ON finn.reglas_comercio USING btree (lower(patron))',
    ]);
    expect(
      diferencias.filter((l) => l.includes('a_exigir_bloqueo') && l.includes('finn.grupos|')),
    ).toEqual([
      expect.stringMatching(/^- trigger\|finn\.grupos\|O\|/),
      expect.stringMatching(/^\+ trigger\|finn\.grupos\|D\|/),
    ]);
    // El gancho corta en C5, antes de C6: integracion terminaría sin correr pruebas
    await expect(prepararPlantilla(copia.urlMigraciones, consultar)).rejects.toThrow(
      /^C5: reglas de catálogo violadas/,
    );
  }, 120_000);
});
