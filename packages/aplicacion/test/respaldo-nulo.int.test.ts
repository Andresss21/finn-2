// CH-47 sobre una base sin hechos: una base recién instalada no avisa de un respaldo que nunca pudo correr, y el primer
// hecho (aquí, un evento `carga_completa`) la vuelve atrasada. La base con hechos está en push.int.test.ts.
import { beforeAll, describe, expect, it } from 'vitest';
import { Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { pasoAvisos } from '../src/tareas/diaria.ts';
import type { DepsMarco } from '../src/operaciones/marco.ts';

const HOY = '2027-02-05';

describe('PRU-INT-NOTIF', () => {
  const base = crearBasePrueba();
  const sql = (texto: string) => consultar(base.urlAdmin, texto);
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => ({ reloj: { hoy: HOY, desfaseMs: 0 } }),
    nuevoIdError: () => 'E-PRUEBA',
  });

  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url;
  });

  it('PRU-INT-NOTIF-104 avisos de sistema (CH-47): una base recién instalada no avisa; desde el primer hecho, un respaldo y una restauración que nunca corrieron cuentan como atrasados', async () => {
    const claves = () =>
      sql(`SELECT datos->>'clave' FROM finn.notificaciones
        WHERE motivo IN ('respaldo_atrasado', 'restauracion_atrasada') ORDER BY motivo`);
    expect(await sql('SELECT count(*) FROM finn.cuentas')).toEqual(['0']);
    await pasoAvisos.ejecutar(deps());
    expect(await claves()).toEqual([]);

    await sql(`INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos)
      VALUES ('info', 'motor', 'carga_completa', '{"bytes": 1000, "ms": 80}')`);
    await pasoAvisos.ejecutar(deps());
    await pasoAvisos.ejecutar(deps());
    expect(await claves()).toEqual([`respaldo:${HOY}`, `restauracion:${HOY}`]);
  });
});
