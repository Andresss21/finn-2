// Cobrar, condiciones del préstamo, renombrar deudor y verificar saldo contra PostgreSQL como `finn_app` (TA-167;
// 04 §3.5, §3.8, §3.9, §4.2, §4.3, §4.6; 01 §5). Cada operación va de punta a punta (previsualizar, confirmar, releer
// los hechos), repite la entrada con el mismo id y prueba un rechazo del dominio con su código y su mensaje. Las cuentas,
// categorías y deudor son los de los hechos de prueba (efectivo 1 y 2, Visa 3, préstamo 4, categoría 11, pago 13,
// deudor 14); la línea por cobrar de Ana es la 303 (compra de $20 con $15 a Ana: cobrado $10, condonado $3, abierto $2).
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
import { OP48 } from '../src/operaciones/cuentas/index.ts';
import { OP31, OP52 } from '../src/operaciones/eventos/index.ts';
import { OP53 } from '../src/operaciones/conciliacion/index.ts';
import { OP20 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1), // efectivo
  E2 = uuid(2), // efectivo
  T1 = uuid(3), // Visa
  P1 = uuid(4), // préstamo
  C1 = uuid(11), // Comida
  CP = uuid(13), // pago de la Visa
  D1 = uuid(14), // deudor Ana
  L3 = uuid(303), // línea por cobrar de Ana
  L1 = uuid(301); // línea de categoría
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const FECHA = '2027-02-04';
const contiene = (t: string): string => expect.stringContaining(t) as string;

describe('PRU-INT-COBRO', () => {
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
  const cobro = async (id: Uuid) => {
    const h = await hechos();
    return {
      tx: h.transacciones.find((t) => t.id === id),
      efectos: h.efectos.filter((f) => f.transaccionId === id),
      h,
    };
  };
  const rechazo = (codigo: string, mensaje: string) => ({
    ok: false,
    error: { categoria: 'DOMINIO', codigo, mensaje },
  });
  const vista = async <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) => {
    const v = await preparar(def, entrada);
    if (!v.ok) throw new Error('previsualizar falló');
    return v.valor;
  };

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-COBRO-101 [INV-06] OP-31: cobra el saldo abierto; repetirlo es ya aplicada, otra línea con el mismo id es conflicto_id y los rechazos llegan con su mensaje', async () => {
    const entrada = { id: uuid(1100), lineaId: L3, cuentaId: E2, fecha: FECHA, total: '2.00' };
    expect(await preparar(OP31, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect((await cobro(entrada.id)).tx).toBeUndefined(); // previsualizar no escribe

    expect(await ejecutar(OP31, entrada)).toMatchObject({
      ok: true,
      valor: { id: entrada.id },
      yaAplicada: false,
    });
    const { tx, efectos } = await cobro(entrada.id);
    expect(tx).toMatchObject({ tipo: 'cobro', total: 200, lineaCobradaId: L3, origen: 'manual' });
    expect(efectos.map((f) => [f.cuentaId, f.monto])).toEqual([[E2, 200]]);

    expect(await ejecutar(OP31, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP31, { ...entrada, lineaId: L1 })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP31, { ...entrada, total: '1.00' })).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });

    // ya no queda saldo abierto; una línea de categoría no es un por cobrar; antes de la compra; una cuenta que no sirve
    const otro = { ...entrada, id: uuid(1101) };
    expect(await ejecutar(OP31, otro)).toMatchObject(
      rechazo('sin_saldo_abierto', 'Ese por cobrar no tiene saldo pendiente al 04/02/2027.'),
    );
    expect(await ejecutar(OP31, { ...otro, lineaId: L1 })).toMatchObject(
      rechazo('linea_no_es_por_cobrar', 'Esa parte no es un por cobrar.'),
    );
    expect(await ejecutar(OP31, { ...otro, fecha: '2027-01-24' })).toMatchObject(
      rechazo(
        'evento_anterior_a_original',
        'El evento no puede ser anterior a la compra (25/01/2027).',
      ),
    );
    expect(await ejecutar(OP31, { ...otro, cuentaId: P1 })).toMatchObject(
      rechazo('cuenta_tipo_no_valido', contiene('tipo prestamo')),
    );
    expect(await ejecutar(OP31, { ...otro, total: '0' })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect((await cobro(otro.id)).tx).toBeUndefined();
  });

  it('PRU-INT-COBRO-101 [BE-36, AV-22] OP-31: el cobro de un por cobrar con tarjeta que entra en efectivo propone asignar a pago(t) y, con la casilla, lo asigna en la misma operación', async () => {
    const compra = {
      id: uuid(1110),
      cuentaId: T1,
      fecha: FECHA,
      total: '20.00',
      lineas: [{ monto: '20.00', destino: { deudorId: D1 } }],
    };
    expect(await ejecutar(OP20, compra)).toMatchObject({ ok: true });
    const lineaId = (await hechos()).lineas.find((l) => l.transaccionId === compra.id)?.id as Uuid;
    const entrada = { id: uuid(1111), lineaId, cuentaId: E1, fecha: FECHA, total: '20.00' };

    const sin = await vista(OP31, entrada);
    expect(sin.avisos).toEqual([
      expect.objectContaining({
        codigo: 'AV-22',
        momento: 'despues',
        datos: expect.objectContaining({ categoriaId: CP, tarjetaId: T1, monto: 2000 }) as unknown,
      }),
    ]);
    const con = await vista(OP31, { ...entrada, asignarAPagoTarjeta: true });
    expect(con.avisos.map((a) => a.codigo)).not.toContain('AV-22');
    expect(con.huellaImpacto).not.toBe(sin.huellaImpacto);

    expect(await ejecutar(OP31, { ...entrada, asignarAPagoTarjeta: true })).toMatchObject({
      ok: true,
      valor: { id: entrada.id },
      yaAplicada: false,
    });
    const { tx, efectos, h } = await cobro(entrada.id);
    expect(tx).toMatchObject({ tipo: 'cobro', total: 2000, lineaCobradaId: lineaId });
    expect(efectos.map((f) => [f.cuentaId, f.monto])).toEqual([[E1, 2000]]);
    expect(h.asignaciones.filter((a) => a.categoriaId === CP).map((a) => a.monto)).toEqual([2000]);

    // el reintento no duplica ni la transacción ni la asignación
    expect(await ejecutar(OP31, { ...entrada, asignarAPagoTarjeta: true })).toMatchObject({
      ok: true,
      yaAplicada: true,
    });
    const despues = (await hechos()).asignaciones.filter((a) => a.categoriaId === CP);
    expect(despues.map((a) => a.monto)).toEqual([2000]);
  });

  it('PRU-INT-COBRO-101 OP-52: renombra al deudor con el nombre que vio la interfaz; repetirlo es ya aplicada, un nombre ya cambiado es conflicto_desactualizado y uno repetido se rechaza', async () => {
    await ejecutar(OP20, {
      id: uuid(1120),
      cuentaId: E1,
      fecha: FECHA,
      total: '1.00',
      lineas: [{ monto: '1.00', destino: { deudorNuevo: 'Beto' } }],
    });
    const entrada = { deudorId: D1, nombre: 'Ana María', esperado: { nombre: 'Ana' } };
    expect(await preparar(OP52, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect((await hechos()).deudores.find((d) => d.id === D1)?.nombre).toBe('Ana');

    expect(await ejecutar(OP52, { ...entrada, nombre: 'beto' })).toMatchObject(
      rechazo('nombre_repetido', 'Ya existe un deudor llamado beto.'),
    );
    expect(await ejecutar(OP52, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).deudores.find((d) => d.id === D1)?.nombre).toBe('Ana María');

    expect(await ejecutar(OP52, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP52, { ...entrada, nombre: 'Anita' })).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { nombre: 'Ana María' } },
      },
    });
    expect(await ejecutar(OP52, { ...entrada, deudorId: uuid(9999) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
    expect(await ejecutar(OP52, { ...entrada, esperado: undefined })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
  });

  it('PRU-INT-COBRO-101 OP-48: edita las condiciones del préstamo con lo que vio la interfaz; repetirlo es ya aplicada, un valor ya cambiado es conflicto_desactualizado y una cuenta que no es préstamo se rechaza', async () => {
    const entrada = {
      prestamoId: P1,
      cuotaPactada: '55.00',
      tasaNominalAnual: '13.5',
      esperado: { cuotaPactada: '50.00', tasaNominalAnual: '12' },
    };
    expect(await preparar(OP48, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect((await hechos()).prestamos[0]).toMatchObject({ cuotaPactada: 5000 });

    expect(await ejecutar(OP48, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).prestamos[0]).toMatchObject({
      cuentaId: P1,
      cuotaPactada: 5500,
      tasaNominalAnualMillonesimas: 135000,
      plazoCuotas: 60, // lo que no se editó no cambia
    });

    expect(await ejecutar(OP48, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP48, { ...entrada, cuotaPactada: '60.00' })).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { cuotaPactada: 5500, tasaNominalAnual: 135000 } },
      },
    });
    expect(await ejecutar(OP48, { ...entrada, prestamoId: E1 })).toMatchObject({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'cuenta_tipo_no_valido' },
    });
    expect(await ejecutar(OP48, { ...entrada, prestamoId: uuid(9999) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
    expect(await ejecutar(OP48, { ...entrada, esperado: {} })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
  });

  it('PRU-INT-COBRO-101 [AV-21, INV-14] OP-53: verificar saldo siempre pide confirmar; la propuesta trae saldo de Finn y diferencia; con la huella registra modo saldo y marca; repetirlo es ya aplicada y una revisión vieja vuelve a pedirla', async () => {
    const entrada = {
      id: uuid(1130),
      cuentaId: E1,
      fechaEstado: FECHA,
      saldoEstado: '100.00',
      marcar: { todas: true },
    };
    const v = await vista(OP53, entrada);
    const antes = v.propuesta as { saldoFinn: number; diferencia: number; marcaria: number };
    expect(antes.diferencia).toBe(10000 - antes.saldoFinn);
    expect(v.avisos.map((a) => a.codigo)).toContain('AV-21'); // el saldo de Finn no es $100.00
    // la propuesta no entra en la huella: cambia al marcar menos (otro impacto), no por traer propuesta
    expect((await vista(OP53, entrada)).huellaImpacto).toBe(v.huellaImpacto);

    expect(await ejecutar(OP53, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION', codigo: 'requiere_confirmacion' },
    });
    expect((await hechos()).conciliaciones.some((c) => c.id === entrada.id)).toBe(false);

    // un cambio que mueve el impacto (otra transacción por marcar): la huella vista ya no vale (04 §4.3)
    expect(
      await ejecutar(OP20, {
        id: uuid(1131),
        cuentaId: E1,
        fecha: FECHA,
        total: '1.00',
        lineas: [{ monto: '1.00', destino: { categoriaId: C1 } }],
      }),
    ).toMatchObject({ ok: true });
    const confirmada = {
      ...entrada,
      revisionVista: v.revisionVista,
      huellaImpacto: v.huellaImpacto,
    };
    expect(await ejecutar(OP53, confirmada)).toMatchObject({
      ok: false,
      error: {
        categoria: 'REQUIERE_CONFIRMACION',
        datos: { revisionVista: v.revisionVista, revisionActual: expect.any(String) as string },
      },
    });
    const nueva = await vista(OP53, entrada);
    expect(nueva.revisionVista).not.toBe(v.revisionVista);
    expect(nueva.huellaImpacto).not.toBe(v.huellaImpacto);
    const p = nueva.propuesta as { saldoFinn: number; diferencia: number; marcaria: number };
    expect(p.diferencia).toBe(10000 - p.saldoFinn);
    expect(p.marcaria).toBeGreaterThan(0);

    expect(
      await ejecutar(OP53, {
        ...entrada,
        revisionVista: nueva.revisionVista,
        huellaImpacto: nueva.huellaImpacto,
      }),
    ).toMatchObject({
      ok: true,
      valor: { id: entrada.id },
      yaAplicada: false,
      avisos: expect.any(Array) as unknown,
    });
    const h = await hechos();
    expect(h.conciliaciones.find((c) => c.id === entrada.id)).toMatchObject({
      cuentaId: E1,
      fechaEstado: FECHA,
      saldoEstado: 10000,
      modo: 'saldo',
      diferenciaAceptada: p.diferencia,
    });
    const marcadas = h.transacciones.filter((t) => t.conciliacionId === entrada.id);
    expect(marcadas).toHaveLength(p.marcaria);
    expect(marcadas.every((t) => t.estadoBancario === 'conciliada')).toBe(true);
    // la que ya estaba conciliada antes no se movió
    expect(h.transacciones.find((t) => t.id === uuid(109))?.conciliacionId).toBe(uuid(15));

    expect(await ejecutar(OP53, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP53, { ...entrada, saldoEstado: '99.00' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
  });

  it('PRU-INT-COBRO-101 OP-53: en una tarjeta el saldo se escribe como deuda positiva; los rechazos llegan con su mensaje y no escriben', async () => {
    const tarjeta = {
      id: uuid(1140),
      cuentaId: T1,
      fechaEstado: FECHA,
      saldoEstado: '30.00',
      marcar: { ids: [uuid(108)] },
    };
    const v = await vista(OP53, tarjeta);
    const p = v.propuesta as { saldoFinn: number; diferencia: number; marcaria: number };
    expect(p.diferencia).toBe(-3000 - p.saldoFinn); // la deuda de $30 es −3000 en la convención de 01 §0.4
    expect(p.marcaria).toBe(1);
    expect(
      await ejecutar(OP53, {
        ...tarjeta,
        revisionVista: v.revisionVista,
        huellaImpacto: v.huellaImpacto,
      }),
    ).toMatchObject({ ok: true, valor: { id: tarjeta.id } });
    expect((await hechos()).conciliaciones.find((c) => c.id === tarjeta.id)).toMatchObject({
      saldoEstado: -3000,
      modo: 'saldo',
    });

    const otra = { ...tarjeta, id: uuid(1141), cuentaId: E2, marcar: { todas: true } };
    expect(await ejecutar(OP53, { ...otra, fechaEstado: '2027-02-06' })).toMatchObject(
      rechazo('fecha_posterior_a_hoy', 'La fecha no puede ser posterior a hoy (05/02/2027).'),
    );
    expect(await ejecutar(OP53, { ...otra, cuentaId: P1 })).toMatchObject({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'cuenta_tipo_no_valido' },
    });
    expect(await ejecutar(OP53, { ...otra, marcar: { ids: [uuid(109)] } })).toMatchObject(
      rechazo('transaccion_ya_conciliada', 'Esa transacción ya está conciliada.'),
    );
    await ejecutar(OP20, {
      id: uuid(1150),
      cuentaId: E2,
      fecha: FECHA,
      total: '1.00',
      lineas: [{ monto: '1.00', destino: { categoriaId: C1 } }],
    });
    expect(
      await ejecutar(OP53, { ...otra, fechaEstado: '2027-02-01', marcar: { ids: [uuid(1150)] } }),
    ).toMatchObject(
      rechazo(
        'transaccion_fuera_de_verificacion',
        'Esa transacción es posterior a la fecha que verificaste.',
      ),
    );
    expect(await ejecutar(OP53, { ...otra, marcar: { todas: false } })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect((await hechos()).conciliaciones.some((c) => c.id === otra.id)).toBe(false);
  });
});
