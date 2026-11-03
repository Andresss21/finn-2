// FT-35 Revisar y aprobar (CA-35.3 y CA-35.4) contra PostgreSQL como `finn_app`: un movimiento con una línea sin destino no se
// aprueba (error 9) y «Recordar esta categoría» crea la regla solo con una línea (04 OP-37; 01 inv. 8). Movimientos propios con
// ids 4001 en adelante sobre la base de `hechos-prueba`.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, leerReglasComercio, Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP37 } from '../src/operaciones/bandeja/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1),
  C1 = uuid(11),
  C2 = uuid(12);
const SIN_DESTINO = uuid(4001),
  UNA_LINEA = uuid(4002),
  DOS_LINEAS = uuid(4003);
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;

describe('PRU-INT-BAND', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const reglas = async () =>
    (await leer((t) => leerReglasComercio(t), RELOJ)).map((r) => [r.patron, r.categoriaId]);
  /** Un movimiento pendiente de un gasto del 2027-02-04 con sus líneas (`categoria` nula = sin destino). */
  const movimiento = (n: number, comercio: string, lineas: [number, Uuid | null][]): string =>
    `INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en)
       VALUES ('${uuid(4100 + n)}', 'sms revisar ${n}', 'banco', timestamptz '2027-02-04T10:${String(20 + n).padStart(2, '0')}:00Z');
     INSERT INTO finn.movimientos (id, sms_id, estado, cuenta_id, fecha, monto, comercio, tipo_propuesto)
       VALUES ('${uuid(4000 + n)}', '${uuid(4100 + n)}', 'pendiente', '${E1}', date '2027-02-04', ${lineas.reduce((s, [m]) => s + m, 0)}, '${comercio}', 'gasto');
     ${lineas
       .map(
         ([monto, categoria], i) =>
           `INSERT INTO finn.movimiento_lineas (movimiento_id, orden, monto${categoria === null ? '' : ', categoria_id'})
              VALUES ('${uuid(4000 + n)}', ${i + 1}, ${monto}${categoria === null ? '' : `, '${categoria}'`});`,
       )
       .join('\n')}`;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await consultar(
      base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       ${movimiento(1, 'Tienda', [[700, null]])}
       ${movimiento(2, 'Farmacia San Jose', [[900, C1]])}
       ${movimiento(3, 'Mercado Central', [
         [600, C1],
         [400, C2],
       ])}
       COMMIT;`,
    );
  });

  it('PRU-INT-BAND-120 [CA-35.3, INV-08] aprobar un movimiento con una línea sin destino se rechaza con linea_sin_destino y no crea ninguna transacción', async () => {
    const antes = await hechos();
    const r = await confirmar(OP37, { movimientoId: SIN_DESTINO, id: uuid(4201) }, deps());
    expect(r).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'linea_sin_destino',
        mensaje: 'Cada parte necesita una categoría o un por cobrar.',
      },
    });
    const despues = await hechos();
    expect(despues.transacciones).toEqual(antes.transacciones);
    expect(despues.transacciones.some((t) => t.id === uuid(4201))).toBe(false);
  });

  it('PRU-INT-BAND-121 [CA-35.4] «Recordar esta categoría» con una sola línea crea la regla comercio → categoría; con dos líneas no crea ninguna', async () => {
    expect(await reglas()).toEqual([]);
    // con dos líneas la opción no se ofrece: aunque llegue, no deja regla
    expect(
      await confirmar(
        OP37,
        { movimientoId: DOS_LINEAS, id: uuid(4202), recordarRegla: true },
        deps(),
      ),
    ).toMatchObject({ ok: true, valor: { aprobado: { destino: { partes: 2 } } } });
    expect(await reglas()).toEqual([]);

    const una = await confirmar(
      OP37,
      { movimientoId: UNA_LINEA, id: uuid(4203), recordarRegla: true },
      deps(),
    );
    expect(una).toMatchObject({
      ok: true,
      valor: { aprobado: { destino: { categoria: { id: C1 } } } },
    });
    expect(await reglas()).toEqual([['Farmacia San Jose', C1]]);
  });
});
