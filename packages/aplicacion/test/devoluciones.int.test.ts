// Devolución vinculada contra PostgreSQL (TA-138 corrección; 03 §3.14 `ck_lineas_destino`, DB-05; 01 §5.5
// OP-33a): sobre los hechos de prueba de @finn/db, OP-33a del dominio se escribe con `escribir()` +
// `aplicarCambios()` y la base la acepta. Cada línea nueva guarda solo `linea_original_id`, y la instantánea
// releída da los mismos derivados que la de memoria. Vive en @finn/aplicacion porque `aplicar` y `calcular`
// son valores de dominio (04 §1.3, CH-28).
// TA-193 agrega OP-32, OP-33 (a y b) y OP-34 por el marco (04 §4.2, §4.3, §4.6): previsualizar, confirmar, releer, repetir
// con el mismo id, conflicto de id y de `revisionVista`, y los rechazos del dominio con su código y su mensaje.
import { beforeAll, describe, expect, it } from 'vitest';
import { aplicar, calcular, verificarInvariantes } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import type { ComandoDominio, Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, escribir, leer, Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, previsualizar, type DefinicionOperacion } from '../src/operaciones/marco.ts';
import { OP31, OP32, OP33, OP34 } from '../src/operaciones/eventos/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const c = (n: number) => n as never; // Centavos de la prueba
// De los hechos de prueba: el gasto 5 (E1, 25 ene) con L2 = 500 a C1 y L3 = 1.500 por cobrar a Ana,
// que tiene un cobro de 1.000 y una condonación de 300 (abierto 200).
const C1 = uuid(11),
  C2 = uuid(12),
  E1 = uuid(1),
  E2 = uuid(2),
  P1 = uuid(4),
  TX5 = uuid(105),
  TX6 = uuid(106), // el cobro de 1.000
  L1 = uuid(301),
  L2 = uuid(302),
  L3 = uuid(303);
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const FECHA = '2027-02-04';
const contiene = (t: string): string => expect.stringContaining(t) as string;

describe('PRU-INT-DEV', () => {
  const base = crearBasePrueba();
  let antes: Hechos;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    antes = await leer((t) => cargarHechos(t), RELOJ);
  });

  it('PRU-INT-DEV-101 [INV-08] OP-33a DB-05: una devolución vinculada con una parte a categoría y otra por cobrar se escribe sin 23514 `ck_lineas_destino`; sus líneas guardan solo `linea_original_id` y la instantánea releída da los mismos derivados', async () => {
    let n = 0;
    const comando = {
      operacion: 'OP-33',
      id: uuid(960),
      instante: '2027-02-04T15:00:00.000Z' as Instante,
      fecha: FechaLocal.desdeTexto('2027-02-04'),
      ids: { siguiente: () => uuid(970 + ++n) },
      transaccionOriginalId: TX5,
      total: c(250),
      reparto: [
        { lineaId: L2, monto: c(100) },
        { lineaId: L3, monto: c(150) },
      ],
    } as unknown as ComandoDominio;
    const r = aplicar(antes, comando, FechaLocal.desdeTexto(HOY));
    if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);

    await escribir((tx) => tx.aplicarCambios(r.cambios), RELOJ);
    const despues = await leer((t) => cargarHechos(t), RELOJ);

    const nuevas = despues.lineas
      .filter((l) => l.transaccionId === uuid(960))
      .sort((a, b) => a.orden - b.orden)
      .map((l) => [l.categoriaId, l.deudorId, l.lineaOriginalId, l.monto]);
    expect(nuevas).toEqual([
      [null, null, L2, 100],
      [null, null, L3, 150],
    ]);
    const hoy = FechaLocal.desdeTexto(HOY);
    const [enBase, enMemoria] = [calcular(despues, hoy), calcular(r.hechosNuevos, hoy)];
    expect(verificarInvariantes(enBase)).toEqual([]);
    const abierto = (i: typeof enBase) => i.porCobrar.find((x) => x.lineaId === L3)?.abierto;
    expect(abierto(enBase)).toBe(50);
    expect(abierto(enBase)).toBe(abierto(enMemoria));
    const disp = (i: typeof enBase) =>
      i.presupuesto.celdas.filter((x) => x.categoriaId === C1).map((x) => x.disponible);
    expect(disp(enBase)).toEqual(disp(enMemoria));
  });
  const deps = () => ({ memoria: new Memoria(), opciones: () => RELOJ, instante: () => INSTANTE });
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const abierto = async (lineaId: Uuid) =>
    calcular(await hechos(), FechaLocal.desdeTexto(HOY)).porCobrar.find(
      (x) => x.lineaId === lineaId,
    )?.abierto;
  const rechazo = (codigo: string, mensaje: string) => ({
    ok: false,
    error: { categoria: 'DOMINIO', codigo, mensaje },
  });
  const vista = async <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) => {
    const v = await previsualizar(def, entrada, deps());
    if (!v.ok) throw new Error('previsualizar falló');
    return v.valor;
  };

  it('PRU-INT-DEV-101 [INV-09] OP-32: condona sin escribir en la vista, baja el saldo abierto; repetirla es ya aplicada, otro monto con el mismo id es conflicto_id y los rechazos llegan con su mensaje', async () => {
    const entrada = { id: uuid(1200), lineaId: L3, monto: '0.30', fecha: FECHA, categoriaId: C1 };
    const antesAbierto = (await abierto(L3)) as number;
    expect(await vista(OP32, entrada)).toMatchObject({ rechazos: [] });
    expect((await hechos()).condonaciones.some((x) => x.id === entrada.id)).toBe(false);

    expect(await ejecutar(OP32, entrada)).toMatchObject({
      ok: true,
      valor: { id: entrada.id },
      yaAplicada: false,
    });
    expect((await hechos()).condonaciones.find((x) => x.id === entrada.id)).toMatchObject({
      lineaId: L3,
      monto: 30,
      fecha: FECHA,
      categoriaId: C1,
    });
    expect(await abierto(L3)).toBe(antesAbierto - 30);

    expect(await ejecutar(OP32, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP32, { ...entrada, monto: '0.20' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });

    const otra = { ...entrada, id: uuid(1201) };
    expect(await ejecutar(OP32, { ...otra, monto: '1000.00' })).toMatchObject(
      rechazo('condonacion_mayor_que_abierto', contiene('Solo quedan')),
    );
    expect(await ejecutar(OP32, { ...otra, lineaId: L1 })).toMatchObject(
      rechazo('linea_no_es_por_cobrar', 'Esa parte no es un por cobrar.'),
    );
    expect(await ejecutar(OP32, { ...otra, monto: '0' })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect((await hechos()).condonaciones.some((x) => x.id === otra.id)).toBe(false);
  });

  it('PRU-INT-DEV-101 [ESC-29] OP-33a: devuelve parte de una línea con su vínculo y sin categoría; repetirla es ya aplicada, otro reparto con el mismo id es conflicto_id y los rechazos llegan con su mensaje', async () => {
    const entrada = {
      id: uuid(1300),
      transaccionOriginalId: TX5,
      fecha: FECHA,
      total: '2.00',
      reparto: [{ lineaId: L2, monto: '2.00' }],
    };
    expect(await vista(OP33, entrada)).toMatchObject({ rechazos: [] });
    expect((await hechos()).transacciones.some((t) => t.id === entrada.id)).toBe(false);

    expect(await ejecutar(OP33, entrada)).toMatchObject({
      ok: true,
      valor: { id: entrada.id },
      yaAplicada: false,
    });
    const h = await hechos();
    expect(h.transacciones.find((t) => t.id === entrada.id)).toMatchObject({
      tipo: 'devolucion',
      total: 200,
    });
    expect(
      h.efectos.filter((f) => f.transaccionId === entrada.id).map((f) => [f.cuentaId, f.monto]),
    ).toEqual([[E1, 200]]); // la cuenta de la compra
    expect(
      h.lineas
        .filter((l) => l.transaccionId === entrada.id)
        .map((l) => [l.categoriaId, l.deudorId, l.lineaOriginalId, l.monto]),
    ).toEqual([[null, null, L2, 200]]);

    expect(await ejecutar(OP33, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP33, { ...entrada, reparto: [{ lineaId: L3, monto: '2.00' }] }),
    ).toMatchObject({ ok: false, error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' } });

    const otra = { ...entrada, id: uuid(1301) };
    expect(await ejecutar(OP33, { ...otra, total: '3.00' })).toMatchObject(
      rechazo('reparto_devolucion_distinto', 'El reparto suma $2.00 y la devolución es de $3.00.'),
    );
    expect(
      await ejecutar(OP33, { ...otra, total: '5.00', reparto: [{ lineaId: L2, monto: '5.00' }] }),
    ).toMatchObject(rechazo('devolucion_mayor_que_linea', contiene('En esa parte quedan')));
    expect(await ejecutar(OP33, { ...otra, transaccionOriginalId: TX6 })).toMatchObject(
      rechazo('devolucion_de_no_gasto', 'Solo las compras admiten devoluciones vinculadas.'),
    );
    expect(await ejecutar(OP33, { ...otra, reparto: undefined })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect((await hechos()).transacciones.some((t) => t.id === otra.id)).toBe(false);
  });

  it('PRU-INT-DEV-101 [ESC-30] OP-33b: devuelve sin compra original a una categoría; repetirla es ya aplicada, otra categoría con el mismo id es conflicto_id y una cuenta que no sirve se rechaza', async () => {
    const entrada = { id: uuid(1310), cuentaId: E1, fecha: FECHA, total: '1.00', categoriaId: C1 };
    expect(await ejecutar(OP33, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    const h = await hechos();
    expect(h.transacciones.find((t) => t.id === entrada.id)).toMatchObject({
      tipo: 'devolucion',
      total: 100,
    });
    expect(
      h.lineas
        .filter((l) => l.transaccionId === entrada.id)
        .map((l) => [l.categoriaId, l.lineaOriginalId]),
    ).toEqual([[C1, null]]);

    expect(await ejecutar(OP33, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP33, { ...entrada, categoriaId: C2 })).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP33, { ...entrada, id: uuid(1311), cuentaId: P1 })).toMatchObject(
      rechazo('cuenta_tipo_no_valido', contiene('tipo prestamo')),
    );
    expect(
      await ejecutar(OP33, { ...entrada, id: uuid(1312), categoriaId: undefined }),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
  });

  it('PRU-INT-DEV-101 [AV-16] OP-34: elimina una devolución, una condonación y un cobro conciliado (pide confirmar y detecta la revisión vieja); repetir es ya aplicada y lo inexistente o de otro tipo se rechaza', async () => {
    // devolución (OP-33b de la prueba anterior)
    const dev = { tipo: 'devolucion', transaccionId: uuid(1310) };
    expect(await ejecutar(OP34, dev)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).transacciones.some((t) => t.id === uuid(1310))).toBe(false);
    expect(await ejecutar(OP34, dev)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP34, { tipo: 'devolucion', transaccionId: uuid(1399) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
    expect(await ejecutar(OP34, { tipo: 'cobro', transaccionId: uuid(1300) })).toMatchObject({
      ok: false,
      error: {
        categoria: 'VALIDACION',
        campos: { transaccionId: 'Ese movimiento no es un cobro.' },
      },
    });
    expect((await hechos()).transacciones.some((t) => t.id === uuid(1300))).toBe(true);

    // condonación: el por cobrar vuelve a abrirse
    const antesAbierto = (await abierto(L3)) as number;
    const con = { tipo: 'condonacion', condonacionId: uuid(1200) };
    expect(await vista(OP34, con)).toMatchObject({ rechazos: [] });
    expect(await ejecutar(OP34, con)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).condonaciones.some((x) => x.id === uuid(1200))).toBe(false);
    expect(await abierto(L3)).toBe(antesAbierto + 30);
    expect(await ejecutar(OP34, con)).toMatchObject({ ok: true, yaAplicada: true });

    // un cobro conciliado: AV-16 pide confirmar; con un cambio que mueve el impacto, la huella vista ya no vale
    const cobro = { id: uuid(1210), lineaId: L3, cuentaId: E2, fecha: FECHA, total: '0.20' };
    expect(await ejecutar(OP31, cobro)).toMatchObject({ ok: true });
    // la conciliación la fija OP-47 (FN010): aquí, el estado inicial de la prueba, como lo deja `escribirHechosDePrueba`
    await consultar(
      base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       INSERT INTO finn.conciliaciones (id, cuenta_id, fecha_estado, saldo_estado, terminada_en, diferencia_aceptada, modo)
         VALUES ('${uuid(1230)}', '${E2}', '${FECHA}', 0, now(), 0, 'estado_cuenta');
       UPDATE finn.transacciones SET estado_bancario = 'confirmada' WHERE id = '${cobro.id}';
       UPDATE finn.transacciones SET estado_bancario = 'conciliada', conciliacion_id = '${uuid(1230)}' WHERE id = '${cobro.id}'; COMMIT`,
    );
    const eliminar = { tipo: 'cobro', transaccionId: cobro.id };
    const v = await vista(OP34, eliminar);
    expect(v.avisos.map((a) => a.codigo)).toContain('AV-16');
    expect(await ejecutar(OP34, eliminar)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION', codigo: 'requiere_confirmacion' },
    });
    expect(
      await ejecutar(OP32, {
        id: uuid(1220),
        lineaId: L3,
        monto: '0.10',
        fecha: FECHA,
        categoriaId: C1,
      }),
    ).toMatchObject({ ok: true });
    expect(
      await ejecutar(OP34, {
        ...eliminar,
        revisionVista: v.revisionVista,
        huellaImpacto: v.huellaImpacto,
      }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'REQUIERE_CONFIRMACION',
        datos: { revisionVista: v.revisionVista, revisionActual: expect.any(String) as string },
      },
    });
    const nueva = await vista(OP34, eliminar);
    expect(nueva.revisionVista).not.toBe(v.revisionVista);
    expect(
      await ejecutar(OP34, {
        ...eliminar,
        revisionVista: nueva.revisionVista,
        huellaImpacto: nueva.huellaImpacto,
      }),
    ).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).transacciones.some((t) => t.id === cobro.id)).toBe(false);
  });
});
