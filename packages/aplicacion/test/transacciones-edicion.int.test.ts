// OP-28 a OP-30 contra PostgreSQL como `finn_app` (TA-166; 04 §3.4, §4.2, §4.3, §4.6.2, §4.6.3; 01 §5.4). Cada caso va de
// punta a punta (previsualizar, confirmar, releer los hechos), repite la entrada, prueba un conflicto con un valor visto
// viejo y un rechazo del dominio con su código y su mensaje. Ids de los hechos de prueba: efectivo 1 y 2, Visa 3,
// préstamo 4, categorías 11 y 12, deudor 14, conciliación 15; transacción n = 100+n, línea n = 300+n.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Cambio, Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, escribir, leer, Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP20, OP28, OP29, OP30 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1),
  E2 = uuid(2),
  P1 = uuid(4),
  C1 = uuid(11),
  C2 = uuid(12),
  D1 = uuid(14),
  K1 = uuid(15);
const TX4 = uuid(104), // gasto con una devolución vinculada a su línea
  TX5 = uuid(105), // gasto con un cobro y una condonación sobre su línea por cobrar
  TX9 = uuid(109); // pago de tarjeta conciliado (K1, efectivo 1)
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const FECHA = '2027-02-04';
const contiene = (t: string): string => expect.stringContaining(t) as string;

describe('PRU-INT-TX', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const preparar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    previsualizar(def, entrada, deps());
  const releer = async (id: Uuid) => {
    const h = await hechos();
    return {
      tx: h.transacciones.find((t) => t.id === id),
      efectos: h.efectos.filter((f) => f.transaccionId === id),
      lineas: h.lineas.filter((l) => l.transaccionId === id).sort((a, b) => a.orden - b.orden),
      h,
    };
  };
  const rechazo = (codigo: string, mensaje: string) => ({
    ok: false,
    error: { categoria: 'DOMINIO', codigo, mensaje },
  });
  /** Los cambios posteriores de una conciliación como `transacción|motivos|fecha|montoEfecto`. */
  const cambiosDe = (conciliacionId: Uuid) =>
    consultar(
      base.urlAdmin,
      `select coalesce(transaccion_id::text, ''), array_to_string(motivos, ','), fecha::text, monto_efecto
         from finn.cambios_posteriores where conciliacion_id = '${conciliacionId}'`,
    );
  /** Un gasto de 30.00 en el efectivo 1: 20.00 a Comida y 10.00 a Ana. */
  const crear = async (n: number, extra = {}) => {
    const id = uuid(n);
    const alta = await ejecutar(OP20, {
      id,
      cuentaId: E1,
      fecha: FECHA,
      total: '30.00',
      lineas: [
        { monto: '20.00', destino: { categoriaId: C1 } },
        { monto: '10.00', destino: { deudorId: D1 } },
      ],
      ...extra,
    });
    expect(alta).toMatchObject({ ok: true });
    return id;
  };
  /** Pasa una transacción a conciliada con una conciliación nueva del efectivo 1 (lo que hará OP-47). */
  const conciliar = async (id: Uuid, conciliacionId: Uuid) => {
    const cambios: Cambio[] = [
      {
        tipo: 'insertar',
        tabla: 'conciliaciones',
        fila: {
          id: conciliacionId,
          cuentaId: E1,
          fechaEstado: FECHA as never,
          saldoEstado: 0 as never,
          terminadaEn: INSTANTE,
          diferenciaAceptada: 0 as never,
          modo: 'saldo',
          revision: null,
        },
      },
      {
        tipo: 'actualizar',
        tabla: 'transacciones',
        id,
        campos: { estadoBancario: 'conciliada', conciliacionId },
      },
    ];
    await escribir((tx) => tx.aplicarCambios(cambios), RELOJ);
  };

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-TX-102 OP-28: edita fecha, cuenta, total, comercio y líneas; repetirla es ya aplicada y un valor visto viejo es conflicto_desactualizado', async () => {
    const id = await crear(2000);
    const { lineas: antes } = await releer(id);
    const [l1, l2] = antes.map((l) => l.id);
    const visto = {
      fecha: FECHA,
      total: '30.00',
      cuentaId: E1,
      comercio: null,
      lineas: [
        { monto: '20.00', destino: { categoriaId: C1 } },
        { monto: '10.00', destino: { deudorId: D1 } },
      ],
    };
    const entrada = {
      transaccionId: id,
      fecha: '2027-02-03',
      total: '40.00',
      cuentaId: E2,
      comercio: 'Nuevo',
      lineas: [
        { lineaId: l1, monto: '25.00' },
        { lineaId: l2, monto: '15.00', destino: { categoriaId: C2 } },
      ],
      esperado: visto,
    };
    expect(await preparar(OP28, entrada)).toMatchObject({
      ok: true,
      valor: { rechazos: [], huellaImpacto: expect.any(String) as string },
    });
    expect((await releer(id)).tx).toMatchObject({ total: 3000 }); // previsualizar no escribe

    expect(await ejecutar(OP28, entrada)).toMatchObject({
      ok: true,
      valor: { id },
      yaAplicada: false,
    });
    const { tx, efectos, lineas } = await releer(id);
    expect(tx).toMatchObject({ fecha: '2027-02-03', total: 4000, comercio: 'Nuevo' });
    expect(efectos.map((f) => [f.cuentaId, f.monto])).toEqual([[E2, -4000]]);
    expect(lineas.map((l) => [l.monto, l.categoriaId, l.deudorId])).toEqual([
      [2500, C1, null],
      [1500, C2, null],
    ]);

    expect(await ejecutar(OP28, entrada)).toMatchObject({
      ok: true,
      valor: { id },
      yaAplicada: true,
    });
    expect((await releer(id)).lineas).toHaveLength(2); // no duplicó nada
    // otro valor nuevo sobre un total que ya no es el visto: la interfaz recibe los valores actuales
    expect(
      await ejecutar(OP28, { transaccionId: id, total: '50.00', esperado: { total: '30.00' } }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { total: 4000 } },
      },
    });
    // sin el valor visto de un campo que cambia, el contrato no lo deja pasar
    expect(await ejecutar(OP28, { transaccionId: id, total: '50.00', esperado: {} })).toMatchObject(
      {
        ok: false,
        error: { categoria: 'VALIDACION', campos: { 'esperado.total': contiene('Falta') } },
      },
    );
    expect(await ejecutar(OP28, { ...entrada, transaccionId: uuid(9999) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
  });

  it('PRU-INT-TX-102 OP-28: la moneda original se conserva al editar otro campo y se cambia con su monto', async () => {
    const id = await crear(2010, { monedaOriginal: 'USD', montoOriginal: '12.5' });
    expect(
      await ejecutar(OP28, { transaccionId: id, nota: 'a', esperado: { nota: null } }),
    ).toMatchObject({ ok: true, yaAplicada: false });
    expect((await releer(id)).tx).toMatchObject({ nota: 'a', monedaOriginal: 'USD' });
    const cambio = {
      transaccionId: id,
      monedaOriginal: 'EUR',
      montoOriginal: '11.2500',
      esperado: { monedaOriginal: 'USD', montoOriginal: '12.5000' },
    };
    expect(await ejecutar(OP28, cambio)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await releer(id)).tx).toMatchObject({ monedaOriginal: 'EUR' });
    expect(await ejecutar(OP28, { ...cambio, montoOriginal: '11.25' })).toMatchObject({
      ok: true,
      yaAplicada: true,
    });
    expect(
      await ejecutar(OP28, { transaccionId: id, monedaOriginal: 'EUR', esperado: {} }),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
  });

  it('PRU-INT-TX-102 OP-28: editar otro campo no pierde el monto original de la fila y null en la moneda y su monto la quita', async () => {
    const id = await crear(2011, { monedaOriginal: 'USD', montoOriginal: '12.5' });
    const fila = () =>
      consultar(
        base.urlAdmin,
        `select coalesce(moneda_original, '-'), coalesce(monto_original::text, '-')
           from finn.transacciones where id = '${id}'`,
      );
    // `monto_original` no se carga (04 §5.2): la edición no lo lee ni lo vuelve a escribir
    const comercio = { transaccionId: id, comercio: 'Tienda', esperado: { comercio: null } };
    expect(await ejecutar(OP28, comercio)).toMatchObject({ ok: true, yaAplicada: false });
    expect(await fila()).toEqual(['USD|12.5000']);
    const quitar = {
      transaccionId: id,
      monedaOriginal: null,
      montoOriginal: null,
      esperado: { monedaOriginal: 'USD', montoOriginal: '12.5' },
    };
    expect(await ejecutar(OP28, quitar)).toMatchObject({ ok: true, yaAplicada: false });
    expect(await fila()).toEqual(['-|-']); // ck_transacciones_moneda_par se cumple
    expect((await releer(id)).tx).toMatchObject({ comercio: 'Tienda', monedaOriginal: null });
    expect(await ejecutar(OP28, quitar)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP28, {
        transaccionId: id,
        monedaOriginal: null,
        montoOriginal: '3',
        esperado: { monedaOriginal: null, montoOriginal: null },
      }),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
  });

  it('PRU-INT-TX-102 OP-28: la categoría de una línea con devoluciones cambia sin tocar la devolución; la cuenta no', async () => {
    // la devolución vinculada (TX7) lleva solo `lineaOriginalId` y sigue a su línea (DB-05, `ck_lineas_destino`)
    const cuenta = {
      transaccionId: TX4,
      cuentaId: E2,
      esperado: { cuentaId: E1 },
    };
    expect(await ejecutar(OP28, cuenta)).toMatchObject(
      rechazo(
        'cambio_cuenta_con_devoluciones',
        'Esta compra tiene devoluciones; no se puede cambiar su cuenta.',
      ),
    );
    const categoria = {
      transaccionId: TX4,
      lineas: [{ lineaId: uuid(301), monto: '12.50', destino: { categoriaId: C2 } }],
      esperado: { lineas: [{ monto: '12.50', destino: { categoriaId: C1 } }] },
    };
    expect(await ejecutar(OP28, categoria)).toMatchObject({ ok: true, yaAplicada: false });
    const { lineas, h } = await releer(TX4);
    expect(lineas.map((l) => [l.id, l.categoriaId])).toEqual([[uuid(301), C2]]);
    expect(h.lineas.find((l) => l.id === uuid(304))).toMatchObject({
      categoriaId: null,
      lineaOriginalId: uuid(301),
    });
    expect(await ejecutar(OP28, categoria)).toMatchObject({ ok: true, yaAplicada: true });
  });

  it('PRU-INT-TX-102 OP-28: los rechazos del dominio llegan con su código y su mensaje y no escriben', async () => {
    const id = await crear(2020);
    expect(
      await ejecutar(OP28, { transaccionId: id, cuentaId: P1, esperado: { cuentaId: E1 } }),
    ).toMatchObject(
      rechazo('cambio_tipo_de_cuenta_incompatible', 'Esta transacción no puede pasar a Préstamo.'),
    );
    expect(
      await ejecutar(OP28, { transaccionId: TX5, fecha: FECHA, esperado: { fecha: '2027-01-25' } }),
    ).toMatchObject(
      rechazo('fecha_posterior_a_eventos', contiene('Hay cobros o devoluciones del')),
    );
    const destino = {
      transaccionId: TX5,
      lineas: [
        { lineaId: uuid(302), monto: '5.00' },
        { lineaId: uuid(303), monto: '15.00', destino: { categoriaId: C1 } },
      ],
      esperado: {
        lineas: [
          { monto: '5.00', destino: { categoriaId: C1 } },
          { monto: '15.00', destino: { deudorId: D1 } },
        ],
      },
    };
    expect(await ejecutar(OP28, destino)).toMatchObject(
      rechazo(
        'linea_con_eventos_cambio_destino',
        'Esa parte tiene cobros o devoluciones; no puede cambiar de destino.',
      ),
    );
    const menor = {
      ...destino,
      lineas: [
        { lineaId: uuid(302), monto: '19.00' },
        { lineaId: uuid(303), monto: '1.00' },
      ],
    };
    expect(await ejecutar(OP28, menor)).toMatchObject(
      rechazo('linea_menor_que_eventos', contiene('ya tiene')),
    );
    expect(
      await ejecutar(OP28, { transaccionId: id, total: '31.00', esperado: { total: '30.00' } }),
    ).toMatchObject(rechazo('suma_lineas_distinta', contiene('')));
    expect((await releer(TX5)).lineas.map((l) => l.monto)).toEqual([500, 1500]); // nada se escribió
  });

  it('PRU-INT-TX-102 [AV-16] OP-28: editar una conciliada pide confirmar (AV-16) y crea el cambio posterior; con una vista vieja es conflicto_desactualizado', async () => {
    const entrada = { transaccionId: TX9, total: '12.00', esperado: { total: '10.00' } };
    const vista = await preparar(OP28, entrada);
    expect(vista).toMatchObject({
      ok: true,
      valor: {
        avisos: expect.arrayContaining([
          expect.objectContaining({ codigo: 'AV-16', requiereConfirmacion: true }),
        ]) as unknown,
      },
    });
    if (!vista.ok) throw new Error('previsualizar falló');
    const { revisionVista, huellaImpacto } = vista.valor;
    expect(await ejecutar(OP28, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION', codigo: 'requiere_confirmacion' },
    });
    expect((await releer(TX9)).tx).toMatchObject({ estadoBancario: 'conciliada' });

    // otra edición confirma antes: el total ya no es el visto y la huella de la vista vieja no sirve (04 §4.6.2)
    const otra = { transaccionId: TX9, total: '11.00', esperado: { total: '10.00' } };
    const vistaOtra = await preparar(OP28, otra);
    if (!vistaOtra.ok) throw new Error('previsualizar falló');
    expect(
      await ejecutar(OP28, {
        ...otra,
        revisionVista: vistaOtra.valor.revisionVista,
        huellaImpacto: vistaOtra.valor.huellaImpacto,
      }),
    ).toMatchObject({ ok: true, yaAplicada: false });
    expect(await ejecutar(OP28, { ...entrada, revisionVista, huellaImpacto })).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { total: 1100 } },
      },
    });
    expect((await releer(TX9)).tx).toMatchObject({
      total: 1100,
      estadoBancario: 'confirmada',
      conciliacionId: null,
    });
    expect(await cambiosDe(K1)).toEqual([`${TX9}|monto|2027-01-30|-1000`]);
    expect(await ejecutar(OP28, otra)).toMatchObject({ ok: true, yaAplicada: true });
  });

  it('PRU-INT-TX-102 OP-29: elimina una transacción; repetirla es ya aplicada, una desconocida no existe y una con eventos se rechaza', async () => {
    const id = await crear(2100);
    expect(await preparar(OP29, { transaccionId: id })).toMatchObject({
      ok: true,
      valor: { rechazos: [] },
    });
    expect((await releer(id)).tx).toBeDefined(); // previsualizar no elimina
    // un SMS aprobado dio origen a esta transacción: al eliminarla su movimiento queda descartado (F1, 03 §4.6.1)
    await consultar(
      base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       INSERT INTO finn.sms_recibidos (id, texto, remitente) VALUES ('${uuid(2101)}', 'compra', 'BANCO');
       INSERT INTO finn.movimientos (id, sms_id, estado) VALUES ('${uuid(2102)}', '${uuid(2101)}', 'pendiente');
       UPDATE finn.movimientos SET estado = 'aprobado', transaccion_id = '${id}' WHERE id = '${uuid(2102)}'; COMMIT;`,
    );
    expect(await ejecutar(OP29, { transaccionId: id })).toMatchObject({
      ok: true,
      yaAplicada: false,
    });
    expect(
      await consultar(
        base.urlAdmin,
        `SELECT estado, coalesce(transaccion_id::text, '') FROM finn.movimientos WHERE id = '${uuid(2102)}'`,
      ),
    ).toEqual(['descartado|']);
    const { tx, efectos, lineas } = await releer(id);
    expect([tx, efectos, lineas]).toEqual([undefined, [], []]);
    expect(await ejecutar(OP29, { transaccionId: id })).toMatchObject({
      ok: true,
      yaAplicada: true,
    });
    expect(await ejecutar(OP29, { transaccionId: uuid(9998) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
    expect(await ejecutar(OP29, { transaccionId: TX5 })).toMatchObject(
      rechazo(
        'transaccion_con_eventos',
        'Esta compra tiene cobros, condonaciones o devoluciones. Eliminalos primero.',
      ),
    );
    // la ocurrencia que TX8 resolvió vuelve a pendiente: su fila desaparece con la transacción
    expect((await hechos()).ocurrencias_resueltas.some((o) => o.transaccionId === uuid(108))).toBe(
      true,
    );
    expect(await ejecutar(OP29, { transaccionId: uuid(108) })).toMatchObject({ ok: true });
    expect((await hechos()).ocurrencias_resueltas.some((o) => o.transaccionId === uuid(108))).toBe(
      false,
    );
  });

  it('PRU-INT-TX-102 [AV-16] OP-29: eliminar una conciliada pide confirmar (AV-16) y deja un cambio posterior sin transacción', async () => {
    const id = await crear(2110);
    await conciliar(id, uuid(2111));
    const entrada = { transaccionId: id };
    const vista = await preparar(OP29, entrada);
    if (!vista.ok) throw new Error('previsualizar falló');
    expect(vista.valor.avisos).toEqual(
      expect.arrayContaining([expect.objectContaining({ codigo: 'AV-16' })]) as unknown,
    );
    expect(await ejecutar(OP29, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
    expect((await releer(id)).tx).toBeDefined();
    const { revisionVista, huellaImpacto } = vista.valor;
    expect(await ejecutar(OP29, { ...entrada, revisionVista, huellaImpacto })).toMatchObject({
      ok: true,
      yaAplicada: false,
    });
    const { tx } = await releer(id);
    expect(tx).toBeUndefined();
    expect(await cambiosDe(uuid(2111))).toEqual([`|eliminacion|${FECHA}|-3000`]);
  });

  it('PRU-INT-TX-102 OP-30: cambia el estado bancario; repetirlo es ya aplicada, un estado visto viejo es conflicto y conciliada no se fija a mano', async () => {
    const id = await crear(2200);
    const confirmar_ = {
      transaccionId: id,
      estadoNuevo: 'confirmada',
      esperado: { estado: 'pendiente' },
    };
    expect(await preparar(OP30, confirmar_)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect((await releer(id)).tx).toMatchObject({ estadoBancario: 'pendiente' });
    expect(await ejecutar(OP30, confirmar_)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await releer(id)).tx).toMatchObject({ estadoBancario: 'confirmada' });
    expect(await ejecutar(OP30, confirmar_)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP30, {
        transaccionId: id,
        estadoNuevo: 'pendiente',
        esperado: { estado: 'pendiente' },
      }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { estado: 'confirmada' } },
      },
    });
    expect(
      await ejecutar(OP30, {
        transaccionId: id,
        estadoNuevo: 'pendiente',
        esperado: { estado: 'confirmada' },
      }),
    ).toMatchObject({ ok: true, yaAplicada: false });

    const nueva = await crear(2201);
    await conciliar(nueva, uuid(2202));
    expect(
      await ejecutar(OP30, {
        transaccionId: nueva,
        estadoNuevo: 'pendiente',
        esperado: { estado: 'conciliada' },
      }),
    ).toMatchObject(
      rechazo('transicion_estado_bancario_invalida', 'Ese cambio de estado no está permitido.'),
    );
    expect(
      await ejecutar(OP30, {
        transaccionId: id,
        estadoNuevo: 'conciliada',
        esperado: { estado: 'pendiente' },
      }),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
    expect(
      await ejecutar(OP30, {
        transaccionId: uuid(9997),
        estadoNuevo: 'pendiente',
        esperado: { estado: 'pendiente' },
      }),
    ).toMatchObject({ ok: false, error: { categoria: 'NO_ENCONTRADO' } });
  });
});
