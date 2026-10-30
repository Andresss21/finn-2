// OP-36, OP-37, OP-39 y OP-40 contra PostgreSQL como `finn_app` (TA-178; 04 §3.6, §4.2, §4.3, §4.6; 01 §5.6, §7.1). Cada
// operación va de punta a punta (previsualizar, confirmar, releer), repite la entrada, prueba un conflicto con un valor
// visto viejo y un rechazo del dominio con su código y su mensaje. Un movimiento no cambia los hechos [M] ni la
// revisión hasta que se aprueba (inv. 13). Movimientos de `sembrarBandejaCompleta` (pendiente, con coincidencia
// vencida, posible duplicado, no reconocido, error, descartado, autodescartado) y los propios, ids 2001 en adelante.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Cambio, Hechos, Instante, Uuid } from '@finn/dominio';
import {
  cargarHechos,
  escribir,
  leer,
  leerDatosDeBandeja,
  leerReglasComercio,
  Memoria,
} from '@finn/db';
import { MOVIMIENTOS, sembrarBandejaCompleta } from '../../db/test/ayudantes/ajustes-prueba.ts';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP36, OP37, OP39, OP40 } from '../src/operaciones/bandeja/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1),
  T1 = uuid(3),
  C1 = uuid(11),
  C2 = uuid(12),
  CP = uuid(13),
  D1 = uuid(14),
  PG1 = uuid(17);
const TX4 = uuid(104),
  TX8 = uuid(108);
// Movimientos propios (con su SMS en uuid(2100 + n))
const MA = uuid(2001), // pendiente, sin líneas: CF-21
  MB = uuid(2002), // pendiente, una línea a Comida: "recordar regla"
  MC = uuid(2003), // pendiente, una línea a Comida: CF-21 con líneas viejas
  MD = uuid(2004), // con coincidencia sobre la transacción 8 ya registrada
  ME = uuid(2005), // posible duplicado de la transacción 4
  MF = uuid(2006), // pago de tarjeta pendiente
  MG = uuid(2007); // con coincidencia sobre una ocurrencia sin resolver
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const FECHA = '2027-02-04';

describe('PRU-INT-BAND', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const preparar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    previsualizar(def, entrada, deps());
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  /** Los hechos [M] y la revisión: lo que un movimiento sin aprobar no puede mover. */
  const estado = () =>
    leer(async (t) => ({ revision: t.estado.revision, hechos: await cargarHechos(t) }), RELOJ);
  const movimiento = async (id: Uuid) => {
    const b = await leer((t) => leerDatosDeBandeja(t), RELOJ);
    const x = b.movimientos.find((y) => y.movimiento.id === id);
    if (x === undefined) throw new Error(`falta el movimiento ${id}`);
    return { ...x.movimiento, lineas: x.lineas };
  };
  const rechazo = (codigo: string, mensaje: string) => ({
    ok: false,
    error: { categoria: 'DOMINIO', codigo, mensaje },
  });
  const saldo = (h: Hechos, cuentaId: Uuid) =>
    h.efectos.filter((f) => f.cuentaId === cuentaId).reduce((s, f) => s + f.monto, 0);
  const vista = async <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) => {
    const v = await preparar(def, entrada);
    if (!v.ok) throw new Error('previsualizar falló');
    return v.valor;
  };
  /** Previsualiza y confirma con la huella, como la interfaz. */
  const aprobar = async <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: object) => {
    const { revisionVista, huellaImpacto } = await vista(def, entrada);
    return ejecutar(def, { ...entrada, revisionVista, huellaImpacto });
  };
  /** Un movimiento propio: SMS el 2027-02-04 a las 10:`n` y, si se pide, una línea a Comida. */
  const sembrar = (
    n: number,
    estadoMov: string,
    cuenta: Uuid,
    fecha: string,
    monto: number,
    comercio: string,
    tipo: string,
    resto: { columnas?: string; valores?: string; linea?: number } = {},
  ) =>
    `INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en)
       VALUES ('${uuid(2100 + n)}', 'sms propio ${n}', 'banco', timestamptz '2027-02-04T10:${String(20 + n).padStart(2, '0')}:00Z');
     INSERT INTO finn.movimientos (id, sms_id, estado, cuenta_id, fecha, monto, comercio, tipo_propuesto${resto.columnas ?? ''})
       VALUES ('${uuid(2000 + n)}', '${uuid(2100 + n)}', '${estadoMov}', '${cuenta}', date '${fecha}', ${monto}, '${comercio}', '${tipo}'${resto.valores ?? ''});
     ${resto.linea === undefined ? '' : `INSERT INTO finn.movimiento_lineas (movimiento_id, orden, monto, categoria_id) VALUES ('${uuid(2000 + n)}', 1, ${resto.linea}, '${C1}');`}`;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarBandejaCompleta(base);
    await consultar(
      base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       ${sembrar(1, 'pendiente', E1, FECHA, 2500, 'Tienda', 'gasto')}
       ${sembrar(2, 'pendiente', E1, FECHA, 700, 'Panaderia', 'gasto', { linea: 700 })}
       ${sembrar(3, 'pendiente', E1, FECHA, 900, 'Libreria', 'gasto', { linea: 900 })}
       ${sembrar(4, 'con_coincidencia', T1, '2027-01-25', 3200, 'Compra tarjeta', 'gasto', { columnas: ', esperada_programada_id, esperada_fecha', valores: `, '${PG1}', date '2027-01-25'` })}
       ${sembrar(5, 'posible_duplicado', E1, '2027-01-22', 1250, 'Super', 'gasto', { columnas: ', duplicado_transaccion_id', valores: `, '${TX4}'` })}
       ${sembrar(6, 'pendiente', T1, FECHA, 20000, 'Pago Visa', 'pago_tarjeta')}
       ${sembrar(7, 'con_coincidencia', E1, '2027-03-25', 1500, 'Netflix', 'gasto', { columnas: ', esperada_programada_id, esperada_fecha', valores: `, '${PG1}', date '2027-03-25'` })}
       COMMIT;`,
    );
  });

  it('PRU-INT-BAND-102 [INV-13] OP-36: edita comercio, monto y líneas; repetirla es ya aplicada, un valor visto viejo es conflicto_desactualizado, un estado que no corresponde se rechaza y los hechos [M] no se mueven', async () => {
    const M1 = MOVIMIENTOS.pendiente as Uuid;
    const antes = await estado();
    const entrada = {
      movimientoId: M1,
      comercio: 'Super Selectos',
      monto: '13.00',
      esperado: { comercio: 'Super', monto: 1250 },
    };
    expect(await preparar(OP36, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await movimiento(M1)).toMatchObject({ comercio: 'Super', monto: 1250 }); // previsualizar no escribe

    expect(await ejecutar(OP36, entrada)).toMatchObject({
      ok: true,
      valor: { movimientoId: M1, estado: 'pendiente' },
      yaAplicada: false,
    });
    const editado = await movimiento(M1);
    expect(editado).toMatchObject({ comercio: 'Super Selectos', monto: 1300 });
    expect(editado.lineas.map((l) => [l.monto, l.categoriaId])).toEqual([[1300, C1]]); // la única línea sigue al monto
    expect(await ejecutar(OP36, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP36, { movimientoId: M1, comercio: 'Otro', esperado: { comercio: 'Super' } }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { comercio: 'Super Selectos' } },
      },
    });

    // la lista completa de líneas: dos partes que suman el monto (la edición del monto ya había dejado el orden 2)
    const vistas = editado.lineas.map((l) => ({
      monto: l.monto,
      categoriaId: l.categoriaId,
      deudorId: l.deudorId,
      lineaOriginalId: l.lineaOriginalId,
    }));
    expect(
      await ejecutar(OP36, {
        movimientoId: M1,
        lineas: [
          { monto: '8.00', destino: { categoriaId: C1 } },
          { monto: '5.00', destino: { deudorId: D1 } },
        ],
        esperado: { lineas: vistas },
      }),
    ).toMatchObject({ ok: true });
    expect(
      (await movimiento(M1)).lineas.map((l) => [l.orden, l.monto, l.categoriaId, l.deudorId]),
    ).toEqual([
      [3, 800, C1, null],
      [4, 500, null, D1],
    ]); // BE-16: las líneas nuevas no reutilizan el orden

    expect(
      await ejecutar(OP36, {
        movimientoId: MOVIMIENTOS.descartado,
        nota: 'x',
        esperado: { nota: null },
      }),
    ).toMatchObject(rechazo('movimiento_estado_no_valido', 'Este movimiento ya está descartado.'));
    expect(await estado()).toEqual(antes);
  });

  it('PRU-INT-BAND-102 [INV-13, CB-15] OP-37: aprueba con origen SMS y hora de recepción, repetirla es ya aplicada con su transacción, otro id no duplica y los rechazos llegan con su mensaje', async () => {
    const M1 = MOVIMIENTOS.pendiente as Uuid;
    const id = uuid(3001);
    const antes = await estado();
    expect(await preparar(OP37, { movimientoId: M1, id })).toMatchObject({
      ok: true,
      valor: { rechazos: [], huellaImpacto: expect.any(String) as string },
    });
    expect(await estado()).toEqual(antes); // previsualizar no escribe, y el movimiento no movió nada

    const aprobado = await aprobar(OP37, { movimientoId: M1, id });
    expect(aprobado).toMatchObject({
      ok: true,
      yaAplicada: false,
      valor: {
        movimientoId: M1,
        estado: 'aprobado',
        transaccionId: id,
        aprobado: {
          total: 1300,
          comercio: 'Super Selectos',
          fecha: FECHA,
          cuenta: { id: E1, nombre: 'Efectivo' },
          destino: { partes: 2 },
        },
      },
    });
    const despues = await hechos();
    expect(despues.transacciones.find((t) => t.id === id)).toMatchObject({
      tipo: 'gasto',
      total: 1300,
      origen: 'sms',
      horaRegistro: '2027-02-04T10:01:00.000Z', // la recepción del SMS (D2)
    });
    expect(saldo(despues, E1) - saldo(antes.hechos, E1)).toBe(-1300);
    expect(await movimiento(M1)).toMatchObject({ estado: 'aprobado', transaccionId: id });

    const valor = aprobado.ok ? aprobado.valor : undefined;
    expect(await ejecutar(OP37, { movimientoId: M1, id })).toMatchObject({
      ok: true,
      yaAplicada: true,
      valor,
    });
    // el reintento con otro id no crea otra transacción: el movimiento ya tiene la suya
    expect(await ejecutar(OP37, { movimientoId: M1, id: uuid(3002) })).toMatchObject({
      ok: true,
      yaAplicada: true,
      valor: { transaccionId: id },
    });
    expect((await hechos()).transacciones.some((t) => t.id === uuid(3002))).toBe(false);
    // el id de una transacción que existe, en otro movimiento, es un conflicto
    expect(await ejecutar(OP37, { movimientoId: MA, id: TX4 })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });

    expect(
      await ejecutar(OP37, { movimientoId: MOVIMIENTOS.noReconocido, id: uuid(3003) }),
    ).toMatchObject(rechazo('movimiento_sin_cuenta', 'Elegí la cuenta de este movimiento.'));
    expect(await ejecutar(OP37, { movimientoId: M1, id: uuid(3004) })).toMatchObject({
      yaAplicada: true,
    });
    expect(
      await ejecutar(OP37, { movimientoId: MOVIMIENTOS.descartado, id: uuid(3005) }),
    ).toMatchObject(rechazo('movimiento_estado_no_valido', 'Este movimiento ya está descartado.'));
    expect(await ejecutar(OP37, { movimientoId: MF, id: uuid(3006) })).toMatchObject({
      ok: false,
      error: {
        categoria: 'VALIDACION',
        campos: { origenId: 'Elegí de qué cuenta salió el pago.' },
      },
    });
  });

  it('PRU-INT-BAND-102 [CF-21] OP-37 variante { categoriaId }: aprueba arrastrando en una sola operación; líneas viejas son conflicto_desactualizado y un movimiento que no es un gasto pendiente es arrastre_no_permitido', async () => {
    const entrada = { movimientoId: MA, id: uuid(3010), categoriaId: C2, esperado: { lineas: [] } };
    expect(await aprobar(OP37, entrada)).toMatchObject({
      ok: true,
      yaAplicada: false,
      valor: {
        estado: 'aprobado',
        aprobado: { total: 2500, destino: { categoria: { id: C2 } } },
      },
    });
    const h = await hechos();
    expect(
      h.lineas.filter((l) => l.transaccionId === uuid(3010)).map((l) => [l.monto, l.categoriaId]),
    ).toEqual([[2500, C2]]);
    expect((await movimiento(MA)).lineas.map((l) => [l.monto, l.categoriaId])).toEqual([
      [2500, C2],
    ]);
    expect(await ejecutar(OP37, entrada)).toMatchObject({ ok: true, yaAplicada: true });

    // la lista vio otras líneas: no se cambia nada
    expect(
      await ejecutar(OP37, {
        movimientoId: MC,
        id: uuid(3011),
        categoriaId: C2,
        esperado: { lineas: [] },
      }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { lineas: [{ monto: 900, categoriaId: C1 }] } },
      },
    });
    expect(await movimiento(MC)).toMatchObject({ estado: 'pendiente' });
    expect(
      await ejecutar(OP37, {
        movimientoId: MOVIMIENTOS.posibleDuplicado,
        id: uuid(3012),
        categoriaId: C2,
        esperado: { lineas: [] },
      }),
    ).toMatchObject(
      rechazo(
        'arrastre_no_permitido',
        'Este movimiento no se puede aprobar arrastrándolo. Abrilo para revisarlo.',
      ),
    );
    expect(
      await ejecutar(OP37, {
        movimientoId: MC,
        id: uuid(3013),
        categoriaId: C2,
        recordarRegla: true,
        esperado: { lineas: [] },
      }),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
  });

  it('PRU-INT-BAND-102 OP-37: "recordar esta categoría para este comercio" crea la regla con el comercio del movimiento', async () => {
    expect(await leer((t) => leerReglasComercio(t), RELOJ)).toEqual([]);
    expect(
      await aprobar(OP37, { movimientoId: MB, id: uuid(3020), recordarRegla: true }),
    ).toMatchObject({
      ok: true,
      valor: { aprobado: { destino: { categoria: { id: C1 } } } },
    });
    expect(
      (await leer((t) => leerReglasComercio(t), RELOJ)).map((r) => [r.patron, r.categoriaId]),
    ).toEqual([['Panaderia', C1]]);
  });

  it('PRU-INT-BAND-102 [AV-10] OP-37: un pago de tarjeta pide origen, exige confirmar el aviso con la huella y una revisión vieja vuelve a pedirla', async () => {
    const entrada = { movimientoId: MF, id: uuid(3030), origenId: E1 };
    const v = await vista(OP37, entrada);
    expect(v.avisos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ codigo: 'AV-10', requiereConfirmacion: true }),
      ]),
    );
    expect(await ejecutar(OP37, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION', codigo: 'requiere_confirmacion' },
    });
    expect(await movimiento(MF)).toMatchObject({ estado: 'pendiente' });

    // otro cambio mueve la revisión y lo reservado: la huella vista ya no vale (04 §4.3)
    const cambios: Cambio[] = [
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: {
          id: uuid(3031),
          categoriaId: CP,
          periodoInicio: (await hechos()).asignaciones[0]?.periodoInicio as never,
          monto: 500 as never,
          revision: null,
        },
      },
    ];
    await escribir((tx) => tx.aplicarCambios(cambios), RELOJ);
    expect(
      await ejecutar(OP37, {
        ...entrada,
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
    expect(await aprobar(OP37, entrada)).toMatchObject({
      ok: true,
      valor: { estado: 'aprobado', aprobado: { total: 20000, cuenta: { id: T1 } } },
    });
    const h = await hechos();
    expect(h.transacciones.find((t) => t.id === uuid(3030))).toMatchObject({
      tipo: 'pago_tarjeta',
      origen: 'sms',
    });
    expect(
      h.efectos
        .filter((f) => f.transaccionId === uuid(3030))
        .map((f) => [f.cuentaId, f.monto])
        .sort(),
    ).toEqual(
      [
        [E1, -20000],
        [T1, 20000],
      ].sort(),
    );
  });

  it('PRU-INT-BAND-102 [INV-13] OP-40: confirmar una coincidencia sobre una registrada la vincula y le da el monto del SMS; rechazarla, "es legítimo" y "es duplicado" cambian el estado sin mover los hechos [M]; cada decisión repetida es ya aplicada', async () => {
    const antes = await estado();
    // rechazar: la propuesta se quita y, sin duplicados, queda pendiente
    const rechazar = { movimientoId: MG, decision: 'rechazar_coincidencia' };
    expect(await preparar(OP40, rechazar)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await movimiento(MG)).toMatchObject({ estado: 'con_coincidencia' });
    expect(await ejecutar(OP40, rechazar)).toMatchObject({
      ok: true,
      valor: { movimientoId: MG, estado: 'pendiente' },
    });
    expect(await movimiento(MG)).toMatchObject({
      estado: 'pendiente',
      esperadaProgramadaId: null,
      esperadaFecha: null,
    });
    expect(await ejecutar(OP40, rechazar)).toMatchObject({ ok: true, yaAplicada: true });

    const legitimo = { movimientoId: MOVIMIENTOS.posibleDuplicado, decision: 'es_legitimo' };
    expect(await ejecutar(OP40, legitimo)).toMatchObject({
      ok: true,
      valor: { estado: 'pendiente' },
    });
    expect(await movimiento(MOVIMIENTOS.posibleDuplicado as Uuid)).toMatchObject({
      estado: 'pendiente',
      duplicadoTransaccionId: null,
    });
    expect(await ejecutar(OP40, legitimo)).toMatchObject({ ok: true, yaAplicada: true });

    const duplicado = { movimientoId: ME, decision: 'es_duplicado' };
    expect(await ejecutar(OP40, duplicado)).toMatchObject({
      ok: true,
      valor: { estado: 'descartado' },
    });
    expect(await ejecutar(OP40, duplicado)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP40, { movimientoId: MG, decision: 'es_duplicado' })).toMatchObject(
      rechazo('movimiento_estado_no_valido', 'Este movimiento ya está pendiente.'),
    );
    expect(await estado()).toEqual(antes);

    // confirmar: sobre una transacción ya registrada no crea otra; su total pasa a ser el del SMS (B-9)
    const confirmarD = { movimientoId: MD, decision: 'confirmar_coincidencia', id: uuid(3040) };
    expect(await aprobar(OP40, confirmarD)).toMatchObject({
      ok: true,
      yaAplicada: false,
      valor: {
        estado: 'aprobado',
        transaccionId: TX8,
        aprobado: { total: 3200, cuenta: { id: T1 } },
      },
    });
    const h = await hechos();
    expect(h.transacciones.find((t) => t.id === TX8)).toMatchObject({ total: 3200 });
    expect(h.transacciones.some((t) => t.id === uuid(3040))).toBe(false);
    expect(h.ocurrencias_resueltas.find((o) => o.id === uuid(70))).toMatchObject({
      estado: 'emparejada',
    });
    expect(await movimiento(MD)).toMatchObject({ estado: 'aprobado', transaccionId: TX8 });
    expect(await ejecutar(OP40, confirmarD)).toMatchObject({
      ok: true,
      yaAplicada: true,
      valor: { transaccionId: TX8 },
    });
    // una coincidencia ya resuelta de otra forma (la ocurrencia está omitida) quedó vieja
    expect(
      await ejecutar(OP40, {
        movimientoId: MOVIMIENTOS.conCoincidencia,
        decision: 'confirmar_coincidencia',
        id: uuid(3041),
      }),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'conflicto_desactualizado' },
    });
  });

  it('PRU-INT-BAND-102 [INV-13] OP-39: descarta y restaura reevaluando; repetirla es ya aplicada, un aprobado no se descarta y un movimiento que no existe no se encuentra', async () => {
    const antes = await estado();
    const descartar = { movimientoId: MOVIMIENTOS.noReconocido, accion: 'descartar' };
    expect(await preparar(OP39, descartar)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await movimiento(MOVIMIENTOS.noReconocido as Uuid)).toMatchObject({
      estado: 'no_reconocido',
    });
    expect(await ejecutar(OP39, descartar)).toMatchObject({
      ok: true,
      valor: { estado: 'descartado' },
      yaAplicada: false,
    });
    expect(await ejecutar(OP39, descartar)).toMatchObject({ ok: true, yaAplicada: true });

    const restaurar = { movimientoId: MOVIMIENTOS.descartado, accion: 'restaurar' };
    expect(await ejecutar(OP39, restaurar)).toMatchObject({
      ok: true,
      valor: { estado: 'pendiente' },
    });
    expect(await movimiento(MOVIMIENTOS.descartado as Uuid)).toMatchObject({ estado: 'pendiente' });
    expect(await ejecutar(OP39, restaurar)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP39, { movimientoId: MOVIMIENTOS.autodescartado, accion: 'restaurar' }),
    ).toMatchObject({ ok: true, valor: { estado: 'pendiente' } });

    expect(
      await ejecutar(OP39, { movimientoId: MOVIMIENTOS.pendiente, accion: 'descartar' }),
    ).toMatchObject(rechazo('movimiento_estado_no_valido', 'Este movimiento ya está aprobado.'));
    const nuevo = { movimientoId: uuid(9999), accion: 'descartar' };
    expect(await ejecutar(OP39, nuevo)).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO', codigo: 'no_encontrado' },
    });
    expect(await preparar(OP39, nuevo)).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect(await estado()).toEqual(antes);
  });
});
