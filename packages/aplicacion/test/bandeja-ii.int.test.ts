// OP-38, OP-41, OP-49 y OP-50 contra PostgreSQL como `finn_app` (TA-179; 04 §3.0, §3.6, §4.2, §4.3, §4.6, §4.8; 01 §5.6;
// RT-03, N-02). Cada operación va de punta a punta (previsualizar, confirmar, releer), repite la entrada, prueba un
// conflicto con un valor visto viejo y un rechazo del dominio con su código y su mensaje. OP-38 escribe una vez por
// movimiento: lo que falla queda como está y no revierte a los demás.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, leerDatosDeBandeja, leerReglasComercio, Memoria } from '@finn/db';
import { txPrisma } from '../../db/src/transacciones.ts';
import { MOVIMIENTOS, sembrarBandejaCompleta } from '../../db/test/ayudantes/ajustes-prueba.ts';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import {
  aprobarTodos,
  definirOP49,
  OP41,
  OP50,
  previsualizarAprobarTodos,
  reprocesar,
} from '../src/operaciones/bandeja/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1),
  T1 = uuid(3),
  C1 = uuid(11),
  C2 = uuid(12),
  CP = uuid(13),
  PG1 = uuid(17);
const TX4 = uuid(104);
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const FECHA = '2027-02-04';
const RELOJ_TARDE = { reloj: { hoy: '2027-03-10', desfaseMs: 0 } }; // el ciclo vigente ya no incluye FECHA (AV-01)
// Movimientos propios n → uuid(2000 + n), con su SMS en uuid(2100 + n)
const mov = (n: number): Uuid => uuid(2000 + n);

describe('PRU-INT-BAND', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const depsTarde = (): DepsMarco => ({ ...deps(), opciones: () => RELOJ_TARDE });
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const preparar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    previsualizar(def, entrada, deps());
  const estado = () =>
    leer(async (t) => ({ revision: t.estado.revision, hechos: await cargarHechos(t) }), RELOJ);
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const movimiento = async (id: Uuid) => {
    const b = await leer((t) => leerDatosDeBandeja(t), RELOJ);
    const x = b.movimientos.find((y) => y.movimiento.id === id);
    if (x === undefined) throw new Error(`falta el movimiento ${id}`);
    return { ...x.movimiento, lineas: x.lineas };
  };
  const reglas = () => leer((t) => leerReglasComercio(t), RELOJ);
  const rechazo = (codigo: string, mensaje: string) => ({
    ok: false,
    error: { categoria: 'DOMINIO', codigo, mensaje },
  });
  const intentos = (smsId: Uuid) =>
    leer(
      (t) =>
        txPrisma(t).smsProcesamiento.findMany({
          where: { smsId },
          orderBy: { intento: 'asc' },
        }),
      RELOJ,
    );
  /** Un movimiento propio: SMS el 2027-02-04 a las 10:(20+n) y, si se pide, una línea a Comida. */
  const sembrar = (
    n: number,
    estadoMov: string,
    cuenta: Uuid | null,
    fecha: string | null,
    monto: number | null,
    tipo: string | null,
    resto: { texto?: string; columnas?: string; valores?: string; linea?: number } = {},
  ) => {
    const lit = (v: string | number | null) => (v === null ? 'NULL' : `'${v}'`);
    return `INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en)
       VALUES ('${uuid(2100 + n)}', '${resto.texto ?? `sms propio ${n}`}', 'banco', timestamptz '2027-02-04T10:${String(20 + n).padStart(2, '0')}:00Z');
     INSERT INTO finn.movimientos (id, sms_id, estado, cuenta_id, fecha, monto, comercio, tipo_propuesto${resto.columnas ?? ''})
       VALUES ('${mov(n)}', '${uuid(2100 + n)}', '${estadoMov}', ${lit(cuenta)}, ${fecha === null ? 'NULL' : `date '${fecha}'`}, ${lit(monto)}, 'Comercio ${n}', ${lit(tipo)}${resto.valores ?? ''});
     ${resto.linea === undefined ? '' : `INSERT INTO finn.movimiento_lineas (movimiento_id, orden, monto, categoria_id) VALUES ('${mov(n)}', 1, ${resto.linea}, '${C1}');`}`;
  };

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarBandejaCompleta(base);
    await consultar(
      base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       ${sembrar(1, 'pendiente', E1, FECHA, 500, 'gasto', { linea: 500 })}
       ${sembrar(2, 'pendiente', E1, FECHA, 600, 'gasto', { linea: 600 })}
       ${sembrar(3, 'pendiente', T1, FECHA, 20000, 'pago_tarjeta')}
       ${sembrar(4, 'con_coincidencia', T1, '2027-01-25', 3200, 'gasto', { linea: 3200, columnas: ', esperada_programada_id, esperada_fecha', valores: `, '${PG1}', date '2027-01-25'` })}
       ${sembrar(5, 'pendiente', E1, FECHA, 700, 'gasto')}
       ${sembrar(6, 'pendiente', E1, FECHA, 800, 'gasto', { linea: 800 })}
       ${sembrar(7, 'pendiente', E1, FECHA, 900, 'gasto', { linea: 900 })}
       ${sembrar(11, 'error', null, null, null, null, { texto: '1234 25' })}
       ${sembrar(12, 'error', E1, FECHA, 1500, 'gasto', { linea: 1500 })}
       ${sembrar(13, 'error', E1, FECHA, 1700, 'gasto', { linea: 1700 })}
       INSERT INTO finn.sms_procesamientos (sms_id, intento, resultado, error_detalle)
         VALUES ('${uuid(2111)}', 1, 'error', 'fallo del intento 1');
       COMMIT;`,
    );
  });

  it('PRU-INT-BAND-103 [AV-19, AV-01] OP-38: aprueba un movimiento por escritura; los que no se pueden quedan como están con su motivo, un fallo no revierte a los demás y repetir el lote no duplica', async () => {
    const L = [mov(1), mov(5), mov(2), mov(3), mov(4), mov(6)];
    const ids = Object.fromEntries(
      L.map((m, k) => [m, k === 5 ? TX4 : uuid(3100 + k)]), // el de mov(6) usa el id de una transacción que existe
    );
    const entrada = { movimientoIds: L, ids };
    const antes = await estado();

    // la previsualización no comprueba ids repetidos: el de mov(6) se prueba al confirmar
    const vista = await previsualizarAprobarTodos(
      { movimientoIds: L.filter((m) => m !== mov(6)), ids },
      deps(),
    );
    expect(vista).toMatchObject({ ok: true });
    expect(
      vista.ok && vista.valor.elementos.map((e) => [e.movimientoId, e.aprobable, e.motivo?.codigo]),
    ).toEqual([
      [mov(1), true, undefined],
      [mov(5), false, 'suma_lineas_distinta'],
      [mov(2), true, undefined],
      [mov(3), false, 'pago_sin_origen'],
      [mov(4), false, 'movimiento_estado_no_valido'],
    ]);
    expect(await estado()).toEqual(antes); // previsualizar no escribe

    const r = await aprobarTodos(entrada, deps());
    expect(r).toMatchObject({
      ok: true,
      yaAplicada: false,
      avisos: [{ codigo: 'AV-19' }],
      valor: {
        elementos: [
          { movimientoId: mov(1), resultado: 'aprobado' },
          {
            movimientoId: mov(5),
            resultado: {
              codigo: 'suma_lineas_distinta',
              mensaje: 'Las partes suman $0.00 y el total es $7.00.',
            },
          },
          { movimientoId: mov(2), resultado: 'aprobado' },
          {
            movimientoId: mov(3),
            resultado: { codigo: 'pago_sin_origen', mensaje: 'Elegí de qué cuenta salió el pago.' },
          },
          {
            movimientoId: mov(4),
            resultado: {
              codigo: 'movimiento_estado_no_valido',
              mensaje: 'Este movimiento ya está con_coincidencia.',
            },
          },
          { movimientoId: mov(6), resultado: { codigo: 'conflicto_id' } },
        ],
      },
    });
    const h = await hechos();
    expect(h.transacciones.filter((t) => t.origen === 'sms').map((t) => [t.id, t.total])).toEqual(
      expect.arrayContaining([
        [uuid(3100), 500],
        [uuid(3102), 600],
      ]),
    );
    expect(await movimiento(mov(1))).toMatchObject({
      estado: 'aprobado',
      transaccionId: uuid(3100),
    });
    expect(await movimiento(mov(2))).toMatchObject({
      estado: 'aprobado',
      transaccionId: uuid(3102),
    });
    for (const [m, e] of [
      [mov(5), 'pendiente'],
      [mov(3), 'pendiente'],
      [mov(4), 'con_coincidencia'],
      [mov(6), 'pendiente'],
    ] as const)
      expect(await movimiento(m)).toMatchObject({ estado: e, transaccionId: null });
    expect(h.transacciones.some((t) => t.id === uuid(3101))).toBe(false);

    // repetir el lote: los aprobados son ya_aplicada con las mismas transacciones; los demás, el mismo motivo
    const otra = await aprobarTodos({ movimientoIds: L, ids }, deps());
    expect(otra).toMatchObject({
      ok: true,
      valor: {
        elementos: [
          { movimientoId: mov(1), resultado: 'ya_aplicada' },
          { movimientoId: mov(5), resultado: { codigo: 'suma_lineas_distinta' } },
          { movimientoId: mov(2), resultado: 'ya_aplicada' },
          { movimientoId: mov(3), resultado: { codigo: 'pago_sin_origen' } },
          { movimientoId: mov(4), resultado: { codigo: 'movimiento_estado_no_valido' } },
          { movimientoId: mov(6), resultado: { codigo: 'conflicto_id' } },
        ],
      },
    });
    expect((await hechos()).transacciones).toHaveLength(h.transacciones.length);

    // lo que exigiría confirmar (AV-01: el 4 de febrero ya es un período cerrado el 10 de marzo) no se aprueba en lote
    const tarde = { movimientoIds: [mov(7)], ids: { [mov(7)]: uuid(3107) } };
    expect(await previsualizarAprobarTodos(tarde, depsTarde())).toMatchObject({
      ok: true,
      valor: {
        elementos: [{ aprobable: false, motivo: { codigo: 'requiere_revision_individual' } }],
      },
    });
    expect(await aprobarTodos(tarde, depsTarde())).toMatchObject({
      ok: true,
      avisos: [{ codigo: 'AV-19' }],
      valor: {
        elementos: [
          {
            movimientoId: mov(7),
            resultado: {
              codigo: 'requiere_revision_individual',
              mensaje: 'Requiere revisión individual (afecta un período cerrado).',
            },
          },
        ],
      },
    });
    expect(await movimiento(mov(7))).toMatchObject({ estado: 'pendiente', transaccionId: null });

    // un movimiento que no existe se informa sin detener el lote; sin el id de un movimiento, el contrato lo rechaza
    expect(
      await aprobarTodos(
        { movimientoIds: [uuid(9999)], ids: { [uuid(9999)]: uuid(3200) } },
        deps(),
      ),
    ).toMatchObject({
      ok: true,
      valor: { elementos: [{ resultado: { codigo: 'no_encontrado' } }] },
    });
    expect(await aprobarTodos({ movimientoIds: [mov(1)], ids: {} }, deps())).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
  });

  it('PRU-INT-BAND-103 [CB-28] OP-41: crea, edita y elimina una regla; repetir es ya aplicada, un valor visto viejo es conflicto_desactualizado, un patrón repetido o una categoría no permitida se rechazan con su mensaje', async () => {
    const R1 = uuid(4001);
    const crear = { accion: 'crear', id: R1, patron: 'Panaderia', categoriaId: C1 };
    expect(await reglas()).toEqual([]);
    expect(await preparar(OP41, crear)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await reglas()).toEqual([]); // previsualizar no escribe
    expect(await ejecutar(OP41, crear)).toMatchObject({
      ok: true,
      yaAplicada: false,
      valor: { reglaId: R1 },
    });
    expect((await reglas()).map((r) => [r.patron, r.categoriaId])).toEqual([['Panaderia', C1]]);
    expect(await ejecutar(OP41, crear)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP41, { ...crear, patron: 'Otro' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    expect(
      await ejecutar(OP41, {
        accion: 'crear',
        id: uuid(4002),
        patron: 'PANADERIA',
        categoriaId: C2,
      }),
    ).toMatchObject(rechazo('patron_repetido', 'Ya hay una regla para PANADERIA.'));
    expect(
      await ejecutar(OP41, { accion: 'crear', id: uuid(4003), patron: 'Pago', categoriaId: CP }),
    ).toMatchObject(
      rechazo(
        'categoria_de_pago_no_permitida',
        'Las categorías de pago de tarjeta no se pueden usar aquí.',
      ),
    );
    expect(await reglas()).toHaveLength(1);

    const editar = {
      accion: 'editar',
      reglaId: R1,
      patron: 'Panadería',
      esperado: { patron: 'Panaderia' },
    };
    expect(await ejecutar(OP41, editar)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await reglas()).map((r) => [r.patron, r.categoriaId])).toEqual([['Panadería', C1]]);
    expect(await ejecutar(OP41, editar)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP41, {
        accion: 'editar',
        reglaId: R1,
        categoriaId: C2,
        esperado: { categoriaId: CP },
      }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { categoriaId: C1 } },
      },
    });
    expect(await ejecutar(OP41, { accion: 'editar', reglaId: R1, esperado: {} })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });

    const eliminar = { accion: 'eliminar', reglaId: R1 };
    expect(await ejecutar(OP41, eliminar)).toMatchObject({ ok: true, yaAplicada: false });
    expect(await reglas()).toEqual([]);
    expect(await ejecutar(OP41, eliminar)).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO', codigo: 'no_encontrado' },
    });
  });

  it('PRU-INT-BAND-103 [V-27] OP-49: reprocesa el SMS con error con su instante original y agrega un intento; con un intento más nuevo es ya aplicada y un movimiento que no está en error se rechaza', async () => {
    const SMS = uuid(2111);
    const entrada = { smsId: SMS, intentoVisto: 1 };
    const antes = await estado();
    expect(await movimiento(mov(11))).toMatchObject({ estado: 'error', cuentaId: null });

    const def = await definirOP49(SMS, deps());
    expect(await previsualizar(def, entrada, deps())).toMatchObject({
      ok: true,
      valor: { rechazos: [] },
    });
    expect(await intentos(SMS)).toHaveLength(1); // previsualizar no escribe

    const r = await reprocesar(entrada, deps());
    expect(r).toMatchObject({
      ok: true,
      yaAplicada: false,
      valor: { smsId: SMS, movimientoId: mov(11), intento: 2 },
    });
    const nuevo = await intentos(SMS);
    expect(nuevo.map((i) => [i.intento, i.resultado])).toEqual([
      [1, 'error'],
      [2, r.ok ? r.valor.estado : ''],
    ]); // el intento 1 no se toca (N-02)
    expect(nuevo[1]?.resultado).not.toBe('error');
    expect(await movimiento(mov(11))).toMatchObject({
      estado: nuevo[1]?.resultado,
      fecha: FECHA, // la fecha por defecto sale de la recepción original, no de hoy (N-02)
    });
    expect((await estado()).hechos).toEqual(antes.hechos); // un movimiento sin aprobar no mueve los hechos [M]

    // el mismo intento visto, repetido: la interfaz ya vio un intento más nuevo
    expect(await reprocesar(entrada, deps())).toMatchObject({
      ok: true,
      yaAplicada: true,
      valor: { intento: 2, estado: nuevo[1]?.resultado },
    });
    expect(await intentos(SMS)).toHaveLength(2);

    // un SMS cuyo movimiento no está en error no se reprocesa; uno que no existe no se encuentra
    const pendiente = '00000000-0000-4000-8000-000000000951'; // SMS del movimiento pendiente sembrado
    expect(await reprocesar({ smsId: pendiente, intentoVisto: 2 }, deps())).toMatchObject(
      rechazo('sms_no_reprocesable', 'Este SMS no tiene un error que reprocesar.'),
    );
    expect(MOVIMIENTOS.pendiente).toBeDefined();
    expect(await reprocesar({ smsId: uuid(9999), intentoVisto: 0 }, deps())).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
  });

  it('PRU-INT-BAND-103 [INV-13, AV-01] OP-50: crea la transacción desde un SMS con error como OP-37; repetirla es ya aplicada, otro id no duplica, el período cerrado pide confirmar y un movimiento que no está en error se rechaza', async () => {
    const id = uuid(5001);
    const entrada = { movimientoId: mov(12), id };
    const antes = await estado();
    expect(await preparar(OP50, entrada)).toMatchObject({
      ok: true,
      valor: { rechazos: [], huellaImpacto: expect.any(String) as string },
    });
    expect((await estado()).hechos).toEqual(antes.hechos);

    const v = await preparar(OP50, entrada);
    const huella = v.ok ? v.valor : undefined;
    const aprobado = await ejecutar(OP50, {
      ...entrada,
      revisionVista: huella?.revisionVista,
      huellaImpacto: huella?.huellaImpacto,
    });
    expect(aprobado).toMatchObject({
      ok: true,
      yaAplicada: false,
      valor: {
        movimientoId: mov(12),
        estado: 'aprobado',
        transaccionId: id,
        aprobado: {
          total: 1500,
          fecha: FECHA,
          cuenta: { id: E1, nombre: 'Efectivo' },
          destino: { categoria: { id: C1 } },
        },
      },
    });
    expect((await hechos()).transacciones.find((t) => t.id === id)).toMatchObject({
      tipo: 'gasto',
      total: 1500,
      origen: 'sms',
    });
    expect(await movimiento(mov(12))).toMatchObject({ estado: 'aprobado', transaccionId: id });
    const valor = aprobado.ok ? aprobado.valor : undefined;
    expect(await ejecutar(OP50, entrada)).toMatchObject({ ok: true, yaAplicada: true, valor });
    expect(await ejecutar(OP50, { ...entrada, id: uuid(5002) })).toMatchObject({
      ok: true,
      yaAplicada: true,
      valor: { transaccionId: id },
    });
    expect((await hechos()).transacciones.some((t) => t.id === uuid(5002))).toBe(false);
    expect(await ejecutar(OP50, { movimientoId: mov(13), id: TX4 })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });

    // en un período cerrado pide confirmar el aviso; la huella vieja vuelve a pedirla y no escribe
    const retro = { movimientoId: mov(13), id: uuid(5003) };
    const vr = await previsualizar(OP50, retro, depsTarde());
    expect(vr).toMatchObject({ ok: true });
    expect(vr.ok && vr.valor.avisos.map((a) => a.codigo)).toContain('AV-01');
    expect(await confirmar(OP50, retro, depsTarde())).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
    expect(
      await confirmar(
        OP50,
        { ...retro, revisionVista: '1', huellaImpacto: 'huella-vieja' },
        depsTarde(),
      ),
    ).toMatchObject({ ok: false, error: { categoria: 'REQUIERE_CONFIRMACION' } });
    expect(await movimiento(mov(13))).toMatchObject({ estado: 'error', transaccionId: null });
    if (!vr.ok) throw new Error('previsualizar falló');
    expect(
      await confirmar(
        OP50,
        { ...retro, revisionVista: vr.valor.revisionVista, huellaImpacto: vr.valor.huellaImpacto },
        depsTarde(),
      ),
    ).toMatchObject({ ok: true, valor: { estado: 'aprobado', transaccionId: uuid(5003) } });

    expect(
      await ejecutar(OP50, { movimientoId: MOVIMIENTOS.pendiente, id: uuid(5004) }),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'movimiento_estado_no_valido' },
    });
  });
});
