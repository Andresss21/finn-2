// OP-37 con tipo devolución (04 OP-37 [CH-226]) contra PostgreSQL como `finn_app`: con la compra elegida se ejecuta OP-33a
// con el reparto de las líneas del movimiento y rigen sus precondiciones; sin compra, OP-33b. Movimientos propios con ids 4301
// en adelante sobre la base de `hechos-prueba`: la compra tx(4) de 12,50 en E1 ya tiene 2,50 devueltos.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP37 } from '../src/operaciones/bandeja/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1),
  C1 = uuid(11),
  COMPRA = uuid(104), // tx(4): gasto de 1250 en E1 con su línea li(1)
  LINEA_COMPRA = uuid(301),
  PAGO = uuid(109), // tx(9): un pago de tarjeta, con su línea li(6)
  LINEA_PAGO = uuid(306);
const VINCULADA = uuid(4301),
  SIN_ORIGINAL = uuid(4302),
  MAYOR = uuid(4303),
  DE_NO_GASTO = uuid(4304),
  SIN_COMPRA = uuid(4305),
  GASTO = uuid(4306);
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;

/** Un movimiento pendiente del 2027-02-04 en E1 con una línea hacia una línea de compra o una categoría. */
const movimiento = (
  n: number,
  tipo: 'devolucion' | 'gasto',
  monto: number,
  destino: { original: Uuid } | { categoria: Uuid } | null,
): string => {
  const [columna, valor] =
    destino === null
      ? ['', '']
      : 'original' in destino
        ? [', linea_original_id', `, '${destino.original}'`]
        : [', categoria_id', `, '${destino.categoria}'`];
  return `INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en)
       VALUES ('${uuid(4400 + n)}', 'sms devolucion ${n}', 'banco', timestamptz '2027-02-04T11:${String(10 + n).padStart(2, '0')}:00Z');
     INSERT INTO finn.movimientos (id, sms_id, estado, cuenta_id, fecha, monto, comercio, tipo_propuesto)
       VALUES ('${uuid(4300 + n)}', '${uuid(4400 + n)}', 'pendiente', '${E1}', date '2027-02-04', ${monto}, 'Super', '${tipo}');
     INSERT INTO finn.movimiento_lineas (movimiento_id, orden, monto${columna})
       VALUES ('${uuid(4300 + n)}', 1, ${monto}${valor});`;
};

describe('PRU-INT-BAND-210', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await consultar(
      base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       ${movimiento(1, 'devolucion', 400, { original: LINEA_COMPRA })}
       ${movimiento(2, 'devolucion', 300, null)}
       ${movimiento(3, 'devolucion', 700, { original: LINEA_COMPRA })}
       ${movimiento(4, 'devolucion', 100, { original: LINEA_PAGO })}
       ${movimiento(5, 'devolucion', 200, { categoria: C1 })}
       ${movimiento(6, 'gasto', 200, { categoria: C1 })}
       COMMIT;`,
    );
  });

  it('PRU-INT-BAND-210 [] (CH-226, OP-37) aprobar una devolución con la compra elegida ejecuta OP-33a con el reparto de las líneas y rigen sus precondiciones; sin compra, OP-33b', async () => {
    const aprobar = (movimientoId: Uuid, id: Uuid, transaccionOriginalId?: Uuid) =>
      confirmar(
        OP37,
        {
          movimientoId,
          id,
          ...(transaccionOriginalId === undefined ? {} : { transaccionOriginalId }),
        },
        deps(),
      );

    // OP-33a: la devolución queda vinculada a la compra, con la línea hacia la suya
    expect(await aprobar(VINCULADA, uuid(4501), COMPRA)).toMatchObject({
      ok: true,
      valor: { estado: 'aprobado', transaccionId: uuid(4501) },
    });
    let h = await hechos();
    expect(h.transacciones.find((t) => t.id === uuid(4501))).toMatchObject({
      tipo: 'devolucion',
      total: 400,
      origen: 'sms',
    });
    expect(h.lineas.filter((l) => l.transaccionId === uuid(4501))).toMatchObject([
      { monto: 400, categoriaId: null, lineaOriginalId: LINEA_COMPRA },
    ]);

    // Con la compra elegida, una línea sin lineaOriginalId no tiene destino
    expect(await aprobar(SIN_ORIGINAL, uuid(4502), COMPRA)).toMatchObject({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'linea_sin_destino' },
    });
    // Precondiciones de OP-33a: queda 6,00 de la compra; una compra que no es un gasto
    expect(await aprobar(MAYOR, uuid(4503), COMPRA)).toMatchObject({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'devolucion_mayor_que_total' },
    });
    expect(await aprobar(DE_NO_GASTO, uuid(4504), PAGO)).toMatchObject({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'devolucion_de_no_gasto' },
    });
    // Solo una devolución va con su compra
    expect(await aprobar(GASTO, uuid(4506), COMPRA)).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    h = await hechos();
    for (const n of [4502, 4503, 4504, 4506])
      expect(h.transacciones.some((t) => t.id === uuid(n))).toBe(false);

    // Sin compra: OP-33b, una línea a la categoría
    expect(await aprobar(SIN_COMPRA, uuid(4505))).toMatchObject({ ok: true });
    h = await hechos();
    expect(h.transacciones.find((t) => t.id === uuid(4505))).toMatchObject({ tipo: 'devolucion' });
    expect(h.lineas.filter((l) => l.transaccionId === uuid(4505))).toMatchObject([
      { monto: 200, categoriaId: C1, lineaOriginalId: null },
    ]);
  });
});
