import { describe, expect, it } from 'vitest';
import type {
  Asignacion,
  Categoria,
  Condonacion,
  Cuenta,
  Efecto,
  Linea,
  TipoCuenta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { celda, presupuesto } from './disponible';
import { listoParaAsignar, lpaAlCierre } from './lpa';
import { ciclo, periodoDe } from './periodos';
import { dineroEnCamino, pagosImplicitos, porCobrar, porCobrarAbierto } from './por-cobrar';
import { saldoAl } from './saldos';
import { sobregiroConTarjetaDelActivo } from './sobregiros';
import { estadoDeTarjeta, teFaltaReservar } from './tarjetas';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const mensual = ciclo([{ diaInicio: 1, rigeDesde: null }]);
const HOY = f('2026-03-15');

type LineaNueva = { cat?: string; deudor?: string; de?: string; monto: number };

/** Libro de hechos mínimo con efectos explícitos por cuenta. */
class Libro {
  readonly cuentas: Cuenta[] = [];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly condonaciones: Condonacion[] = [];
  readonly categorias: Categoria[] = [];
  readonly asignaciones: Asignacion[] = [];
  private n = 0;

  constructor(cuentas: [string, TipoCuenta][]) {
    for (const [nombre, tipo] of cuentas)
      this.cuentas.push({ id: id(nombre), tipo, nombre } as Cuenta);
  }

  categoria(nombre: string, tarjeta: string | null = null) {
    const clase = tarjeta === null ? 'normal' : 'pago';
    this.categorias.push({ id: id(nombre), clase, tarjetaId: tarjeta && id(tarjeta) } as Categoria);
  }

  asignar(cat: string, periodoInicio: string, monto: number) {
    this.asignaciones.push({
      id: id(`asig-${cat}-${periodoInicio}`),
      categoriaId: id(cat),
      periodoInicio: f(periodoInicio),
      monto: c(monto),
    } as Asignacion);
  }

  private marca(fecha: string) {
    this.n += 1;
    return {
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:${String(this.n).padStart(2, '0')}.000Z`,
      secuencia: String(this.n),
    };
  }

  mov(
    tx: string,
    tipo: TipoTransaccion,
    fecha: string,
    efectos: [string, number][],
    lineas: LineaNueva[] = [],
    lineaCobrada: string | null = null,
  ) {
    const total =
      lineas.length > 0 ? lineas.reduce((s, l) => s + l.monto, 0) : Math.abs(efectos[0]?.[1] ?? 0);
    this.transacciones.push({
      id: id(tx),
      tipo,
      ...this.marca(fecha),
      total: c(total),
      lineaCobradaId: lineaCobrada && id(lineaCobrada),
    } as Transaccion);
    efectos.forEach(([cuenta, monto], i) =>
      this.efectos.push({
        id: id(`ef-${tx}-${i}`),
        transaccionId: id(tx),
        cuentaId: id(cuenta),
        monto: c(monto),
      } as Efecto),
    );
    lineas.forEach((l, i) =>
      this.lineas.push({
        id: id(`${tx}.${i}`),
        transaccionId: id(tx),
        orden: i,
        monto: c(l.monto),
        categoriaId: l.cat === undefined ? null : id(l.cat),
        deudorId: l.deudor === undefined ? null : id(l.deudor),
        lineaOriginalId: l.de === undefined ? null : id(l.de),
      } as Linea),
    );
  }

  condonar(x: string, linea: string, fecha: string, cat: string, monto: number) {
    this.condonaciones.push({
      id: id(x),
      lineaId: id(linea),
      ...this.marca(fecha),
      categoriaId: id(cat),
      monto: c(monto),
    } as Condonacion);
  }
}

/**
 * Mensual con enero y febrero cerrados, marzo activo (hoy 15) y abril futuro. E es efectivo, T y U
 * tarjetas y P un préstamo. Ana y Carla deben compras con débito; Beto, una con T.
 */
function escenario() {
  const l = new Libro([
    ['E', 'efectivo'],
    ['T', 'tarjeta'],
    ['U', 'tarjeta'],
    ['P', 'prestamo'],
  ]);
  l.categoria('Super');
  l.categoria('Ocio');
  l.categoria('PagoT', 'T');
  l.categoria('PagoU', 'U');

  // Enero. Super: F = 300, débito 100 y T 250 → 200 trasladado a PagoT, SobT 50, SobD 0. Ocio: U 100
  // cubierto. PagoT: 200 − pago 260 = −60 → E(T, ene) = 60. PagoU: 100.
  l.mov('si', 'saldo_inicial', '2026-01-01', [['E', 1000]]);
  l.mov('ing', 'ingreso', '2026-01-02', [['E', 500]]);
  l.asignar('Super', '2026-01-01', 300);
  l.asignar('Ocio', '2026-01-01', 100);
  l.mov('g1', 'gasto', '2026-01-05', [['E', -100]], [{ cat: 'Super', monto: 100 }]);
  l.mov('g2', 'gasto', '2026-01-06', [['T', -250]], [{ cat: 'Super', monto: 250 }]);
  l.mov('pcA', 'gasto', '2026-01-10', [['E', -80]], [{ deudor: 'Ana', monto: 80 }]);
  l.mov('pcB', 'gasto', '2026-01-12', [['T', -60]], [{ deudor: 'Beto', monto: 60 }]);
  l.mov('g3', 'gasto', '2026-01-15', [['U', -100]], [{ cat: 'Ocio', monto: 100 }]);
  l.mov(
    'p1',
    'pago_tarjeta',
    '2026-01-20',
    [
      ['E', -260],
      ['T', 260],
    ],
    [{ cat: 'PagoT', monto: 260 }],
  );

  // Febrero. Ana: cobro de 50 en E (R 50) y de 40 en U (R 30, excedente 10, pago implícito 30 en U).
  // Beto: cobro 25 en E (restitución), condonación 10 en Ocio (consumo con T sin cubrir), devolución 5
  // a T y cobro 30 en E (R 20, excedente 10). Super: débito 40 sin fondo → SobD 40.
  l.mov('cA1', 'cobro', '2026-02-03', [['E', 50]], [], 'pcA.0');
  l.mov('cA2', 'cobro', '2026-02-05', [['U', 40]], [], 'pcA.0');
  l.mov('cB1', 'cobro', '2026-02-08', [['E', 25]], [], 'pcB.0');
  l.condonar('kB', 'pcB.0', '2026-02-10', 'Ocio', 10);
  l.mov('dB', 'devolucion', '2026-02-12', [['T', 5]], [{ deudor: 'Beto', de: 'pcB.0', monto: 5 }]);
  l.mov('cB2', 'cobro', '2026-02-14', [['E', 30]], [], 'pcB.0');
  l.mov('g4', 'gasto', '2026-02-15', [['E', -40]], [{ cat: 'Super', monto: 40 }]);

  // Marzo (activo). Desembolso 200 y avance 40 (otras entradas). Carla: 70 con débito, condonación 20
  // en Super y devolución 10 a E → abierto 40. Super: F = 50 cubre la condonación y 30 con T.
  l.mov('des', 'desembolso_prestamo', '2026-03-02', [
    ['P', 200],
    ['E', 200],
  ]);
  l.mov('av', 'avance_efectivo', '2026-03-03', [
    ['T', -40],
    ['E', 40],
  ]);
  l.mov('pcC', 'gasto', '2026-03-04', [['E', -70]], [{ deudor: 'Carla', monto: 70 }]);
  l.condonar('kC', 'pcC.0', '2026-03-05', 'Super', 20);
  l.mov(
    'dC',
    'devolucion',
    '2026-03-06',
    [['E', 10]],
    [{ deudor: 'Carla', de: 'pcC.0', monto: 10 }],
  );
  l.mov('g5', 'gasto', '2026-03-07', [['T', -30]], [{ cat: 'Super', monto: 30 }]);
  l.asignar('Super', '2026-03-01', 50);
  l.asignar('PagoT', '2026-03-01', 30);
  l.asignar('Super', '2026-04-01', 25);
  return l;
}

function calcular(l: Libro) {
  const cobros = porCobrar(l);
  const b = presupuesto(l, mensual, HOY, pagosImplicitos(cobros));
  return { cobros, b, lpa: listoParaAsignar(l, b, cobros) };
}

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-106 MOT-4.8, MOT-4.9 y MOT-4.10: deuda sin respaldo, reserva excedente, LPA y por cobrar (01 §4.8 a §4.10): S(t), RE(t) y su descomposición; LPA con sus términos; LPA al cierre con su comprobación; saldo abierto, dinero en camino y pago implícito', () => {
    const l = escenario();
    const { cobros, b, lpa } = calcular(l);

    // §4.10: recorrido de cada línea, saldo abierto, dinero en camino y pago implícito.
    const de = (linea: string) => cobros.find((x) => x.lineaId === linea);
    const ana = de('pcA.0');
    expect(ana?.eventos.map((e) => [e.tipo, e.restituido, e.excedente, e.abierto])).toEqual([
      ['cobro', c(50), c(0), c(30)],
      ['cobro', c(30), c(10), c(0)],
    ]);
    expect(de('pcB.0')).toMatchObject({
      medio: { tarjetaId: 'T' },
      restituido: c(45),
      condonado: c(10),
      devuelto: c(5),
      abierto: c(0),
    });
    expect(de('pcC.0')).toMatchObject({
      restituido: c(0),
      condonado: c(20),
      devuelto: c(10),
      abierto: c(40),
    });
    expect(dineroEnCamino(cobros)).toBe(c(40));
    expect(porCobrarAbierto(cobros)).toBe(c(40));
    expect(dineroEnCamino(porCobrar(l, f('2026-02-04')))).toBe(c(30));
    expect(dineroEnCamino(porCobrar(l, f('2026-01-31')))).toBe(c(80));
    // Solo el cobro de un por cobrar con débito depositado en una tarjeta da pago implícito (Q7).
    expect(pagosImplicitos(cobros)).toEqual([
      { tarjetaId: 'U', fecha: '2026-02-05', monto: c(30) },
    ]);
    expect(celda(b, id('PagoU'), f('2026-02-01')).disponible).toBe(c(70));
    // Ocio de febrero: la condonación de Beto es un consumo con T sin fondo (H8).
    expect(celda(b, id('Ocio'), f('2026-02-01')).sobT).toBe(c(10));

    // §4.8: T con deuda 115 y R⁺ 60 → S 55; U con deuda 60 y R⁺ 70 → RE 10.
    const t = estadoDeTarjeta(l, b, id('T'));
    expect(t).toMatchObject({
      deuda: c(115),
      reservado: c(60),
      sinRespaldo: c(55),
      reservaExcedente: c(0),
    });
    expect(teFaltaReservar(t)).toBe(c(55));
    const u = estadoDeTarjeta(l, b, id('U'));
    expect(u).toMatchObject({
      deuda: c(60),
      reservado: c(70),
      sinRespaldo: c(0),
      reservaExcedente: c(10),
    });
    for (const x of [t, u]) expect(x.deuda).toBe(x.reservado + x.sinRespaldo - x.reservaExcedente);
    expect(() => estadoDeTarjeta(l, b, id('E'))).toThrow(RangeError);

    // §4.9: cada término de la descomposición.
    expect(lpa).toEqual({
      entradas: {
        ingreso: c(510),
        otras: c(240),
        restitucion: c(45),
        saldoInicial: c(1000),
        total: c(1795),
      },
      asignadoCerrados: c(400),
      asignadoActivo: c(80),
      asignadoFuturos: c(25),
      sobregirosDebito: c(40),
      pagosExcedentes: c(60),
      dineroEnCamino: c(40),
      total: c(1150),
    });

    // Identidad (inv. 1): efectivo 1305 = LPA 1150 + ΣDisp(A) 130 + futuras 25 + SobTA 0.
    const activo = b.celdas.filter((x) => x.periodo.inicio === b.activo.inicio);
    const sumaDisp = activo.reduce((s, x) => s + x.disponible, 0);
    expect(saldoAl(l, id('E'), HOY)).toBe(c(1305));
    expect(lpa.total + sumaDisp + lpa.asignadoFuturos + sobregiroConTarjetaDelActivo(b)).toBe(
      c(1305),
    );

    // LPA al cierre de cada período y su comprobación: efectivo al fin(p) = LPA_p + Σ_c Arr(c, p + 1).
    const esperado: [string, number][] = [
      ['2026-01-01', 960],
      ['2026-02-01', 1055],
      ['2026-03-01', 1175],
    ];
    for (const [inicio, valor] of esperado) {
      const p = periodoDe(mensual, f(inicio));
      const arr = b.celdas
        .filter((x) => x.periodo.inicio === p.inicio)
        .reduce((s, x) => s + Math.max(0, x.disponible), 0);
      expect(lpaAlCierre(l, b, p)).toBe(c(valor));
      expect(saldoAl(l, id('E'), p.fin)).toBe(lpaAlCierre(l, b, p) + arr);
    }

    // Una asignación futura a PagoT no entra en R⁺ (inv. 2) y solo baja LPA.
    l.asignar('PagoT', '2026-04-01', 100);
    const otra = calcular(l);
    expect(estadoDeTarjeta(l, otra.b, id('T')).sinRespaldo).toBe(c(55));
    expect(otra.lpa.total).toBe(c(1050));

    // Inv. 9: una condonación que supera el saldo abierto en su momento se rechaza.
    l.condonar('kC2', 'pcC.0', '2026-03-08', 'Super', 41);
    expect(() => porCobrar(l)).toThrow(RangeError);
  });
});
