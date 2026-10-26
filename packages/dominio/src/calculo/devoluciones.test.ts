import { describe, expect, it } from 'vitest';
import type {
  Cuenta,
  Efecto,
  Hechos,
  Linea,
  TipoCuenta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { actividadDePago, actividadNormal, gastado } from './actividad';
import { aportes, clasificar, consumos, cronologico, type HechosDeConsumo } from './devoluciones';
import { ciclo, periodoDe } from './periodos';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const mensual = ciclo([{ diaInicio: 1, rigeDesde: null }]);
const feb = periodoDe(mensual, f('2026-02-10'));
const mar = periodoDe(mensual, f('2026-03-10'));

type LineaNueva = { cat?: string; deudor?: string; monto: number; de?: string | undefined };

/** Libro de hechos mínimo: cada transacción mueve una cuenta de efectivo o tarjeta. */
class Libro {
  readonly cuentas: Cuenta[] = [];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly condonaciones: Hechos['condonaciones'][number][] = [];

  constructor(cuentas: [string, TipoCuenta][]) {
    for (const [nombre, tipo] of cuentas)
      this.cuentas.push({ id: id(nombre), tipo, nombre } as Cuenta);
  }

  /** Registra la transacción y devuelve los ids de sus líneas (`<tx>.<orden>`). */
  mov(tx: string, tipo: TipoTransaccion, cuenta: string, fecha: string, lineas: LineaNueva[]) {
    const total = lineas.reduce((s, l) => s + l.monto, 0);
    const signo = tipo === 'devolucion' || tipo === 'pago_tarjeta' ? 1 : -1;
    this.transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: String(this.transacciones.length + 1),
      total: c(total),
    } as Transaccion);
    // Un pago de tarjeta acredita la tarjeta; el débito de la cuenta de efectivo no importa aquí.
    this.efectos.push({
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id(cuenta),
      monto: c(signo * total),
    } as Efecto);
    return lineas.map((l, i) => {
      this.lineas.push({
        id: id(`${tx}.${i}`),
        transaccionId: id(tx),
        orden: i,
        monto: c(l.monto),
        categoriaId: l.cat === undefined ? null : id(l.cat),
        deudorId: l.deudor === undefined ? null : id(l.deudor),
        lineaOriginalId: l.de === undefined ? null : id(l.de),
      } as Linea);
      return `${tx}.${i}`;
    });
  }

  hechos(): HechosDeConsumo {
    return this;
  }
}

const casos = (h: HechosDeConsumo) =>
  Object.fromEntries(clasificar(h, mensual).map((d) => [d.lineaId, d.caso]));

describe('PRU-DOM-DEV', () => {
  it('PRU-DOM-DEV-101 [CB-06, CB-32] devoluciones (01 §4.4): D-1 a D-4 con U_L y A_L, consumo neto, devolución en otra cuenta, medio cambiado después y actividad', () => {
    const libro = new Libro([
      ['E', 'efectivo'],
      ['E2', 'efectivo'],
      ['T', 'tarjeta'],
      ['T2', 'tarjeta'],
    ]);
    // D-1 (ESC-26): compra con T de 100 y dos devoluciones con T en el mismo período.
    const [ropaT] = libro.mov('c1', 'gasto', 'T', '2026-02-05', [{ cat: 'Ropa', monto: 100 }]);
    libro.mov('d1', 'devolucion', 'T', '2026-02-08', [{ cat: 'Ropa', monto: 30, de: ropaT }]);
    libro.mov('d2', 'devolucion', 'T', '2026-02-09', [{ cat: 'Ropa', monto: 20, de: ropaT }]);
    // D-2 (ESC-25): compra con débito y devolución vinculada en el período siguiente.
    const [ropaE] = libro.mov('c2', 'gasto', 'E', '2026-02-05', [{ cat: 'Ropa', monto: 100 }]);
    libro.mov('d3', 'devolucion', 'E', '2026-03-01', [{ cat: 'Ropa', monto: 100, de: ropaE }]);
    // D-3 (ESC-28 A): compra con T de 100 con U_L = 40; devoluciones de 70 y 20 en marzo. La de 20
    // se registra primero pero es posterior: A_L sigue el orden cronológico, no el de registro.
    const [zapatos] = libro.mov('c3', 'gasto', 'T', '2026-02-05', [{ cat: 'Zapatos', monto: 100 }]);
    libro.mov('d5', 'devolucion', 'T', '2026-03-03', [{ cat: 'Zapatos', monto: 20, de: zapatos }]);
    libro.mov('d4', 'devolucion', 'T', '2026-03-02', [{ cat: 'Zapatos', monto: 70, de: zapatos }]);
    // D-4 (ESC-30): devolución con T sin compra original; D-2 sin compra original en efectivo.
    libro.mov('d6', 'devolucion', 'T', '2026-03-04', [{ cat: 'Super', monto: 30 }]);
    libro.mov('d7', 'devolucion', 'E', '2026-03-04', [{ cat: 'Gas', monto: 10 }]);
    // CB-06: devolución en una cuenta distinta de la original, en el mismo período: una compra en
    // efectivo devuelta a la tarjeta (D-4) y una compra con T devuelta a otra cuenta de efectivo (D-2).
    const [superE] = libro.mov('c4', 'gasto', 'E', '2026-03-05', [{ cat: 'Super', monto: 50 }]);
    libro.mov('d8', 'devolucion', 'T2', '2026-03-06', [{ cat: 'Super', monto: 50, de: superE }]);
    const [superT] = libro.mov('c5', 'gasto', 'T', '2026-03-05', [{ cat: 'Super', monto: 40 }]);
    libro.mov('d9', 'devolucion', 'E2', '2026-03-06', [{ cat: 'Super', monto: 15, de: superT }]);
    // Split con por cobrar: la devolución sobre la línea por cobrar no es de categoría (§4.10).
    const [, ana] = libro.mov('c6', 'gasto', 'E', '2026-03-07', [
      { cat: 'Super', monto: 60 },
      { deudor: 'Ana', monto: 40 },
    ]);
    libro.mov('d10', 'devolucion', 'E', '2026-03-08', [{ deudor: 'Ana', monto: 10, de: ana }]);
    // Pago de T y una condonación del por cobrar, que consume con el medio de la compra (débito).
    libro.mov('p1', 'pago_tarjeta', 'T', '2026-03-09', [{ cat: 'PagoT', monto: 25 }]);
    libro.condonaciones.push({
      id: id('k1'),
      lineaId: id(ana ?? ''),
      fecha: f('2026-03-10'),
      monto: c(5),
      claveOrden: '2026-03-10T12:00:00.000Z',
      secuencia: null,
      categoriaId: id('Gas'),
    } as Hechos['condonaciones'][number]);
    const h = libro.hechos();

    expect(casos(h)).toEqual({
      'd1.0': 'D-1',
      'd2.0': 'D-1',
      'd3.0': 'D-2',
      'd4.0': 'D-3',
      'd5.0': 'D-3',
      'd6.0': 'D-4',
      'd7.0': 'D-2',
      'd8.0': 'D-4',
      'd9.0': 'D-2',
    });

    // Consumo neto: m = 100 − 30 − 20 = 50 en la línea con D-1; las demás quedan enteras.
    const ks = consumos(h, mensual);
    const neto = Object.fromEntries(ks.map((k) => [k.id, k.neto]));
    expect(neto).toEqual({
      'c1.0': c(50),
      'c2.0': c(100),
      'c3.0': c(100),
      'c4.0': c(50),
      'c5.0': c(40),
      'c6.0': c(60),
      k1: c(5),
    });
    expect(ks.find((k) => k.id === 'k1')).toMatchObject({ tarjetaId: null, cuentaId: 'E' });
    expect(ks.find((k) => k.id === 'c1.0')).toMatchObject({ tarjetaId: 'T', cuentaId: 'T' });

    // U_L de la compra de Zapatos = 40 (60 cubiertos por la asignación, que da el reparto D2).
    const U = (l: Uuid) => (l === zapatos ? c(40) : Centavos.cero);
    const ap = Object.fromEntries(
      aportes(h, mensual, U).map((d) => [d.lineaId, [d.a, d.aCategoria, d.aPago]]),
    );
    expect(ap).toEqual({
      'd3.0': [0, c(100), 0], // D-2: +X a la categoría
      'd4.0': [c(40), c(30), c(-30)], // D-3: a = mín(70, 40 − 0) = 40; r = 30
      'd5.0': [0, c(20), c(-20)], // D-3: A_L = 40, a = mín(20, 0) = 0; r = 20
      'd6.0': [0, c(30), c(-30)], // D-4: +X y −X a pago(T)
      'd7.0': [0, c(10), 0],
      'd8.0': [0, c(50), c(-50)], // CB-06: D-4 en T2
      'd9.0': [0, c(15), 0], // CB-06: D-2 en E2
    });

    // Actividad. Ropa en febrero: −(50 + 100); en marzo, +100 de la D-2.
    const aps = aportes(h, mensual, U);
    expect(actividadNormal(ks, aps, id('Ropa'), feb)).toBe(c(-150));
    expect(actividadNormal(ks, aps, id('Ropa'), mar)).toBe(c(100));
    expect(gastado(ks, aps, id('Ropa'), mar)).toBe(c(-100));
    // Super en marzo: −(50 + 40 + 60) + 30 + 50 + 15 = −55. Gas: +10 − 5 de la condonación.
    expect(actividadNormal(ks, aps, id('Super'), mar)).toBe(c(-55));
    expect(actividadNormal(ks, aps, id('Gas'), mar)).toBe(c(5));
    // Pago T en marzo: −25 del pago − 30 − 20 (r de D-3) − 30 (D-4); los traslados llegan con D2.
    const pagoT = { id: id('PagoT'), tarjetaId: id('T') };
    expect(actividadDePago(h, aps, pagoT, mar)).toBe(c(-105));
    expect(actividadDePago(h, aps, pagoT, feb)).toBe(0);
    expect(actividadDePago(h, aps, { id: id('PagoT2'), tarjetaId: id('T2') }, mar)).toBe(c(-50));

    // CB-32: la compra cambia de medio (E → T) después de registradas sus devoluciones. Se
    // reclasifica con los hechos de hoy: la devolución en E ya no es de la cuenta de L.
    const cambio = new Libro([
      ['E', 'efectivo'],
      ['T', 'tarjeta'],
    ]);
    const [l] = cambio.mov('c', 'gasto', 'E', '2026-02-05', [{ cat: 'Ropa', monto: 100 }]);
    cambio.mov('dE', 'devolucion', 'E', '2026-02-08', [{ cat: 'Ropa', monto: 30, de: l }]);
    cambio.mov('dT', 'devolucion', 'T', '2026-03-08', [{ cat: 'Ropa', monto: 20, de: l }]);
    expect(casos(cambio.hechos())).toEqual({ 'dE.0': 'D-1', 'dT.0': 'D-4' });
    const despues = cambio.hechos();
    const movida = {
      ...despues,
      efectos: despues.efectos.map((e) =>
        e.transaccionId === 'c' ? { ...e, cuentaId: id('T') } : e,
      ),
    };
    expect(casos(movida)).toEqual({ 'dE.0': 'D-2', 'dT.0': 'D-3' });
    // U_L se pide al reparto D2 con el medio actual: 30 no cubiertos → a = 20, r = 0.
    expect(aportes(movida, mensual, () => c(30)).map((d) => [d.a, d.aCategoria])).toEqual([
      [0, c(30)],
      [c(20), 0],
    ]);
    expect(consumos(movida, mensual)[0]).toMatchObject({ neto: c(100), tarjetaId: 'T' });

    // Orden cronológico: fecha, clave de orden, secuencia (sin secuencia al final) y orden.
    const m = (fecha: string, clave: string, secuencia: string | null, orden: number) =>
      ({ fecha, claveOrden: clave, secuencia, orden }) as Parameters<typeof cronologico>[0][number];
    const a = m('2026-02-01', 'x2', '5', 0);
    const b = m('2026-02-01', 'x1', '9', 0);
    const s = m('2026-02-01', 'x1', null, 0);
    const o = m('2026-02-01', 'x1', '9', 1);
    expect(cronologico([a, s, o, b])).toEqual([b, o, s, a]);

    // Hechos rotos: una cuenta, transacción, línea o medio que no existen son errores.
    const sinCuenta = { ...h, cuentas: [] };
    expect(() => clasificar(sinCuenta, mensual)).toThrow(RangeError);
    const sinTx = { ...h, transacciones: [] };
    expect(() => clasificar(sinTx, mensual)).toThrow(RangeError);
    const sinMedio = { ...h, efectos: [] };
    expect(() => clasificar(sinMedio, mensual)).toThrow(RangeError);
    const sinLinea = { ...h, lineas: h.lineas.filter((x) => x.id !== ana) };
    expect(() => consumos(sinLinea, mensual)).toThrow(RangeError);
  });
});
