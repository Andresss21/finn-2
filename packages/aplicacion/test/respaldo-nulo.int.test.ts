// CH-47 sobre una base sin hechos: una base recién instalada no avisa de un respaldo que nunca pudo correr, y desde el
// primer hecho (aquí, un evento `carga_completa`) cada plazo de 03 §7.5 corre con el reloj simulado. La base con cuentas
// está en push.int.test.ts.
import { beforeAll, describe, expect, it } from 'vitest';
import { Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { pasoAvisos } from '../src/tareas/diaria.ts';
import type { DepsMarco } from '../src/operaciones/marco.ts';

const HOY = '2027-02-05';
const MINUTO = 60_000;
const H36 = 36 * 60;
const D35 = 35 * 24 * 60;

describe('PRU-INT-NOTIF', () => {
  const base = crearBasePrueba();
  const sql = (texto: string) => consultar(base.urlAdmin, texto);
  const tras = (minutos: number): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => ({ reloj: { hoy: HOY, desfaseMs: minutos * MINUTO } }),
    nuevoIdError: () => 'E-PRUEBA',
  });

  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url;
  });

  it('PRU-INT-NOTIF-104 avisos de sistema (CH-47): una base sin hechos no avisa; con el primer hecho, dentro de cada plazo no avisa y pasado cada plazo avisa una vez por clave', async () => {
    const claves = () =>
      sql(`SELECT datos->>'clave' FROM finn.notificaciones
        WHERE motivo IN ('respaldo_atrasado', 'restauracion_atrasada') ORDER BY motivo`);
    expect(await sql('SELECT count(*) FROM finn.cuentas')).toEqual(['0']);
    await pasoAvisos.ejecutar(tras(D35 + 1));
    expect(await claves()).toEqual([]);

    await sql(`INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos)
      VALUES ('info', 'motor', 'carga_completa', '{"bytes": 1000, "ms": 80}')`);
    await pasoAvisos.ejecutar(tras(H36 - 1));
    expect(await claves()).toEqual([]);

    await pasoAvisos.ejecutar(tras(H36 + 1));
    await pasoAvisos.ejecutar(tras(H36 + 1));
    await pasoAvisos.ejecutar(tras(D35 - 1));
    expect(await claves()).toEqual([`respaldo:${HOY}`]);

    await pasoAvisos.ejecutar(tras(D35 + 1));
    await pasoAvisos.ejecutar(tras(D35 + 1));
    expect(await claves()).toEqual([`respaldo:${HOY}`, `restauracion:${HOY}`]);
  });
});
