// Operaciones de registro OP-20 a OP-24 y OP-27 contra PostgreSQL como `finn_app` (TA-165; 04 §3.4, §4.2, §4.3, §4.6.1;
// 01 §5.4). Cada caso va de punta a punta (previsualizar, confirmar, releer los hechos), repite la entrada con el mismo
// id y prueba un rechazo del dominio con su código y su mensaje. Los ids nuevos son 1000+; las cuentas y categorías son
// las de los hechos de prueba (efectivo 1 y 2, Visa 3, préstamo 4, categorías 11 y 12, pago 13, deudor 14).
import { beforeAll, describe, expect, it } from 'vitest';
import type { Cambio, Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, escribir, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP01 } from '../src/operaciones/cuentas/index.ts';
import { OP20, OP21, OP22, OP23, OP24, OP27 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1), // efectivo
  E2 = uuid(2), // efectivo
  T1 = uuid(3), // Visa
  P1 = uuid(4), // préstamo
  C1 = uuid(11), // Comida
  C2 = uuid(12), // Préstamo (categoría)
  CP = uuid(13), // pago de la Visa
  D1 = uuid(14); // deudor Ana
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
  const escribirCambios = (cambios: Cambio[]) =>
    escribir((tx) => tx.aplicarCambios(cambios), RELOJ);
  /** La transacción `id` con sus efectos (cuenta → monto) y sus líneas en orden, tal como quedó en la base. */
  const releer = async (id: Uuid) => {
    const h = await hechos();
    return {
      tx: h.transacciones.find((t) => t.id === id),
      efectos: h.efectos.filter((f) => f.transaccionId === id),
      lineas: h.lineas.filter((l) => l.transaccionId === id).sort((a, b) => a.orden - b.orden),
      h,
    };
  };
  const monto = (efectos: readonly { cuentaId: Uuid; monto: number }[], cuenta: Uuid) =>
    efectos.find((f) => f.cuentaId === cuenta)?.monto;
  const rechazo = (codigo: string, mensaje: string) => ({
    ok: false,
    error: { categoria: 'DOMINIO', codigo, mensaje },
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-TX-101 [INV-06] OP-20: registra un gasto con categoría, deudor y deudor nuevo; repetirlo es ya aplicada y otro contenido con el mismo id es conflicto_id', async () => {
    const id = uuid(1000);
    const entrada = {
      id,
      cuentaId: E1,
      fecha: FECHA,
      total: '30.00',
      comercio: 'Súper',
      nota: 'semana',
      lineas: [
        { monto: '10.00', destino: { categoriaId: C1 } },
        { monto: '12.00', destino: { deudorId: D1 } },
        { monto: '8.00', destino: { deudorNuevo: 'Beto' } },
      ],
    };
    expect(await preparar(OP20, entrada)).toMatchObject({
      ok: true,
      valor: { rechazos: [], huellaImpacto: expect.any(String) as string },
    });
    expect((await releer(id)).tx).toBeUndefined(); // previsualizar no escribe

    expect(await ejecutar(OP20, entrada)).toMatchObject({
      ok: true,
      valor: { id },
      yaAplicada: false,
    });
    const { tx, efectos, lineas, h } = await releer(id);
    expect(tx).toMatchObject({
      tipo: 'gasto',
      fecha: FECHA,
      total: 3000,
      origen: 'manual',
      comercio: 'Súper',
      nota: 'semana',
    });
    expect(efectos).toHaveLength(1);
    expect(monto(efectos, E1)).toBe(-3000);
    const beto = h.deudores.find((d) => d.nombre === 'Beto');
    expect(lineas.map((l) => [l.monto, l.categoriaId, l.deudorId])).toEqual([
      [1000, C1, null],
      [1200, null, D1],
      [800, null, beto?.id],
    ]);

    expect(await ejecutar(OP20, entrada)).toMatchObject({
      ok: true,
      valor: { id },
      yaAplicada: true,
    });
    expect((await releer(id)).lineas).toHaveLength(3); // no duplicó nada
    // 'beto' sin mayúsculas reutiliza el deudor que la primera alta creó (04 §3.0.2) y es otro contenido: conflicto_id
    expect(await ejecutar(OP20, { ...entrada, total: '31.00' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    const otro = {
      ...entrada,
      id: uuid(1001),
      total: '5.00',
      lineas: [{ monto: '5.00', destino: { deudorNuevo: 'BETO' } }],
    };
    expect(await ejecutar(OP20, otro)).toMatchObject({ ok: true, yaAplicada: false });
    const despues = (await hechos()).deudores.filter((d) => d.nombre.toLowerCase() === 'beto');
    expect(despues).toHaveLength(1);
  });

  it('PRU-INT-TX-101 OP-20: los rechazos del dominio llegan con su código y su mensaje y no escriben', async () => {
    const entrada = {
      id: uuid(1010),
      cuentaId: E1,
      fecha: FECHA,
      total: '10.00',
      lineas: [{ monto: '10.00', destino: { categoriaId: C1 } }],
    };
    expect(
      await ejecutar(OP20, {
        ...entrada,
        lineas: [{ monto: '9.00', destino: { categoriaId: C1 } }],
      }),
    ).toMatchObject(rechazo('suma_lineas_distinta', contiene('Las partes suman')));
    expect(
      await ejecutar(OP20, {
        ...entrada,
        lineas: [{ monto: '10.00', destino: { categoriaId: CP } }],
      }),
    ).toMatchObject(
      rechazo(
        'categoria_de_pago_no_permitida',
        'Las categorías de pago de tarjeta no se pueden usar aquí.',
      ),
    );
    expect(await ejecutar(OP20, { ...entrada, fecha: '2027-02-06' })).toMatchObject(
      rechazo('fecha_posterior_a_hoy', 'La fecha no puede ser posterior a hoy (05/02/2027).'),
    );
    expect(await ejecutar(OP20, { ...entrada, cuentaId: P1 })).toMatchObject(
      rechazo('cuenta_tipo_no_valido', contiene('tipo prestamo')),
    );
    // el nombre de la cuenta sale de los hechos del marco, no del dominio
    expect(await ejecutar(OP20, { ...entrada, fecha: '2027-01-10' })).toMatchObject(
      rechazo('fecha_anterior_a_apertura', contiene('Efectivo se abrió')),
    );
    // contrato: un total en cero o sin partes es VALIDACION
    expect(await ejecutar(OP20, { ...entrada, total: '0' })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect(await ejecutar(OP20, { ...entrada, lineas: [] })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect((await releer(uuid(1010))).tx).toBeUndefined();
  });

  it('PRU-INT-TX-101 OP-21: registra un ingreso en efectivo; repetirlo es ya aplicada y una tarjeta se rechaza', async () => {
    const id = uuid(1020);
    const entrada = {
      id,
      cuentaId: E2,
      fecha: FECHA,
      total: '100.00',
      monedaOriginal: 'EUR',
      montoOriginal: '91.5',
    };
    expect(await preparar(OP21, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP21, entrada)).toMatchObject({
      ok: true,
      valor: { id },
      yaAplicada: false,
    });
    const { tx, efectos, lineas } = await releer(id);
    expect(tx).toMatchObject({ tipo: 'ingreso', total: 10000, monedaOriginal: 'EUR' });
    expect(monto(efectos, E2)).toBe(10000);
    expect(lineas).toHaveLength(0);
    expect(await ejecutar(OP21, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    // 91.5 y 91.5000 son el mismo decimal: el reintento con otro formato sigue siendo ya aplicada
    expect(await ejecutar(OP21, { ...entrada, montoOriginal: '91.5000' })).toMatchObject({
      ok: true,
      yaAplicada: true,
    });
    expect(await ejecutar(OP21, { ...entrada, cuentaId: E1 })).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP21, { ...entrada, id: uuid(1021), cuentaId: T1 })).toMatchObject(
      rechazo('cuenta_tipo_no_valido', contiene('tipo tarjeta')),
    );
    // M4: la moneda y su monto, juntos
    expect(
      await ejecutar(OP21, { ...entrada, id: uuid(1022), montoOriginal: undefined }),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
  });

  it('PRU-INT-TX-101 OP-22: mueve el dinero entre dos cuentas de efectivo; repetirla es ya aplicada y la misma cuenta se rechaza', async () => {
    const id = uuid(1030);
    const entrada = { id, origenId: E2, destinoId: E1, fecha: FECHA, total: '25.00' };
    expect(await preparar(OP22, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP22, entrada)).toMatchObject({
      ok: true,
      valor: { id },
      yaAplicada: false,
    });
    const { tx, efectos } = await releer(id);
    expect(tx).toMatchObject({ tipo: 'transferencia', total: 2500 });
    expect(monto(efectos, E2)).toBe(-2500);
    expect(monto(efectos, E1)).toBe(2500);
    expect(await ejecutar(OP22, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP22, { ...entrada, origenId: E1, destinoId: E2 })).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP22, { ...entrada, id: uuid(1031), destinoId: E2 })).toMatchObject(
      rechazo('cuentas_iguales', 'Elegí dos cuentas distintas.'),
    );
  });

  it('PRU-INT-TX-101 [AV-10] OP-23: un pago sobre lo reservado exige confirmar con la huella; con ella escribe, y una revisión vieja vuelve a pedirla', async () => {
    const id = uuid(1040);
    const entrada = { id, origenId: E1, tarjetaId: T1, fecha: FECHA, total: '200.00' };
    const vista = await preparar(OP23, entrada);
    expect(vista).toMatchObject({
      ok: true,
      valor: {
        rechazos: [],
        avisos: expect.arrayContaining([
          expect.objectContaining({ codigo: 'AV-10', requiereConfirmacion: true }),
        ]) as unknown,
      },
    });
    if (!vista.ok) throw new Error('previsualizar falló');
    const { revisionVista, huellaImpacto } = vista.valor;

    expect(await ejecutar(OP23, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION', codigo: 'requiere_confirmacion' },
    });
    expect((await releer(id)).tx).toBeUndefined();

    // otro cambio mueve la revisión y lo reservado: la huella vista ya no vale (04 §4.3)
    await escribirCambios([
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: {
          id: uuid(1041),
          categoriaId: CP,
          periodoInicio: (await hechos()).asignaciones[0]?.periodoInicio as never,
          monto: 500 as never,
          revision: null,
        },
      },
    ]);
    expect(await ejecutar(OP23, { ...entrada, revisionVista, huellaImpacto })).toMatchObject({
      ok: false,
      error: {
        categoria: 'REQUIERE_CONFIRMACION',
        datos: { revisionVista, revisionActual: expect.any(String) as string },
        previsualizacion: { huellaImpacto: expect.any(String) as string },
      },
    });
    const nueva = await preparar(OP23, entrada);
    if (!nueva.ok) throw new Error('previsualizar falló');
    expect(nueva.valor.huellaImpacto).not.toBe(huellaImpacto);

    const confirmada = {
      ...entrada,
      revisionVista: nueva.valor.revisionVista,
      huellaImpacto: nueva.valor.huellaImpacto,
    };
    expect(await ejecutar(OP23, confirmada)).toMatchObject({
      ok: true,
      valor: { id },
      yaAplicada: false,
    });
    const { tx, efectos, lineas } = await releer(id);
    expect(tx).toMatchObject({ tipo: 'pago_tarjeta', total: 20000 });
    expect(monto(efectos, E1)).toBe(-20000);
    expect(monto(efectos, T1)).toBe(20000);
    expect(lineas.map((l) => [l.monto, l.categoriaId])).toEqual([[20000, CP]]);
    // la idempotencia se decide antes de pedir confirmación
    expect(await ejecutar(OP23, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP23, { ...entrada, total: '201.00' })).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP23, { ...entrada, id: uuid(1042), tarjetaId: E2 })).toMatchObject(
      rechazo('cuenta_tipo_no_valido', contiene('tipo efectivo')),
    );
  });

  it('PRU-INT-TX-101 OP-24: paga una cuota con su desglose y abona a capital; repetirlas es ya aplicada y el desglose que no cuadra se rechaza', async () => {
    const cuota = {
      id: uuid(1050),
      modalidad: 'cuota',
      origenId: E1,
      prestamoId: P1,
      fecha: FECHA,
      total: '50.00',
      categoriaId: C2,
      capital: '40.00',
      interes: '8.00',
      seguro: '2.00',
      numeroCuota: 3,
    };
    expect(await preparar(OP24, cuota)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP24, cuota)).toMatchObject({
      ok: true,
      valor: { id: cuota.id },
      yaAplicada: false,
    });
    const a = await releer(cuota.id);
    expect(a.tx).toMatchObject({ tipo: 'cuota_prestamo', total: 5000 });
    expect(monto(a.efectos, E1)).toBe(-5000);
    expect(a.efectos.find((f) => f.cuentaId === P1)).toMatchObject({
      monto: -4000,
      interes: 800,
      seguro: 200,
    });
    expect(a.lineas.map((l) => [l.monto, l.categoriaId])).toEqual([[5000, C2]]);
    expect(await ejecutar(OP24, cuota)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP24, { ...cuota, interes: '9.00', capital: '39.00' })).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });

    const abono = {
      id: uuid(1051),
      modalidad: 'abono',
      origenId: E1,
      prestamoId: P1,
      fecha: FECHA,
      total: '15.00',
      categoriaId: C2,
    };
    expect(await ejecutar(OP24, abono)).toMatchObject({ ok: true, yaAplicada: false });
    const b = await releer(abono.id);
    expect(b.tx).toMatchObject({ tipo: 'abono_capital', total: 1500 });
    expect(b.efectos.find((f) => f.cuentaId === P1)).toMatchObject({
      monto: -1500,
      interes: null,
      seguro: null,
    });
    expect(await ejecutar(OP24, abono)).toMatchObject({ ok: true, yaAplicada: true });

    const sinCuadrar = { ...cuota, id: uuid(1052), seguro: '1.00' };
    expect(await ejecutar(OP24, sinCuadrar)).toMatchObject(
      rechazo('desglose_no_cuadra', contiene('Capital, interés y seguro suman')),
    );
    const enorme = { ...abono, id: uuid(1053), total: '999999.99' };
    expect(await ejecutar(OP24, enorme)).toMatchObject(
      rechazo('capital_mayor_que_pendiente', contiene('supera lo que debés del préstamo')),
    );
    expect(await ejecutar(OP24, { ...abono, id: uuid(1054), categoriaId: CP })).toMatchObject(
      rechazo('categoria_de_pago_no_permitida', contiene('categorías de pago')),
    );
  });

  it('PRU-INT-TX-101 [AV-24] OP-27: registra un avance, una entrada y una transferencia de deuda; repetirlas es ya aplicada y la misma tarjeta se rechaza', async () => {
    const avance = {
      id: uuid(1060),
      modalidad: 'avance',
      tarjetaId: T1,
      cuentaId: E2,
      fecha: FECHA,
      total: '40.00',
    };
    expect(await preparar(OP27, avance)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP27, avance)).toMatchObject({
      ok: true,
      valor: { id: avance.id },
      yaAplicada: false,
    });
    const a = await releer(avance.id);
    expect(a.tx).toMatchObject({ tipo: 'avance_efectivo', total: 4000 });
    expect(monto(a.efectos, T1)).toBe(-4000);
    expect(monto(a.efectos, E2)).toBe(4000);
    expect(await ejecutar(OP27, avance)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP27, { ...avance, cuentaId: E1 })).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });

    const entrada = {
      id: uuid(1061),
      modalidad: 'entrada',
      tarjetaId: T1,
      fecha: FECHA,
      total: '5.00',
    };
    expect(await ejecutar(OP27, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    const b = await releer(entrada.id);
    expect(b.tx).toMatchObject({ tipo: 'entrada_tarjeta', total: 500 });
    expect(b.efectos.map((f) => [f.cuentaId, f.monto])).toEqual([[T1, 500]]);
    expect(await ejecutar(OP27, entrada)).toMatchObject({ ok: true, yaAplicada: true });

    // una segunda tarjeta (con su categoría de pago, inv. 22) para pasarle la deuda de la Visa
    const T2 = uuid(1070);
    expect(
      await ejecutar(OP01, {
        id: T2,
        tipo: 'tarjeta',
        nombre: 'Otra tarjeta',
        saldo: '0',
        limiteCredito: '1500.00',
        diaCorte: 15,
        diaPago: 5,
      }),
    ).toMatchObject({ ok: true });
    const deuda = {
      id: uuid(1062),
      modalidad: 'transferencia_deuda',
      tarjetaId: T1,
      tarjetaDestinoId: T2,
      fecha: HOY, // la segunda tarjeta se abre hoy (04 §3.4: fecha ≥ apertura)
      total: '10.00',
    };
    expect(await preparar(OP27, deuda)).toMatchObject({
      ok: true,
      valor: {
        avisos: expect.arrayContaining([expect.objectContaining({ codigo: 'AV-24' })]) as unknown,
      },
    });
    expect(await ejecutar(OP27, deuda)).toMatchObject({
      ok: true,
      yaAplicada: false,
      avisos: expect.arrayContaining([expect.objectContaining({ codigo: 'AV-24' })]) as unknown,
    });
    const c = await releer(deuda.id);
    expect(c.tx).toMatchObject({ tipo: 'transferencia_tarjetas', total: 1000 });
    expect(monto(c.efectos, T1)).toBe(1000); // la que deja de deber recibe +X
    expect(monto(c.efectos, T2)).toBe(-1000);
    expect(await ejecutar(OP27, deuda)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP27, { ...deuda, id: uuid(1065), tarjetaDestinoId: T1 })).toMatchObject(
      rechazo('cuentas_iguales', 'Elegí dos cuentas distintas.'),
    );
    expect(await ejecutar(OP27, { ...avance, id: uuid(1063), cuentaId: T1 })).toMatchObject(
      rechazo('cuenta_tipo_no_valido', contiene('tipo tarjeta')),
    );
    expect(await ejecutar(OP27, { ...avance, id: uuid(1064), tarjetaId: E1 })).toMatchObject(
      rechazo('cuenta_tipo_no_valido', contiene('tipo efectivo')),
    );
  });
});
