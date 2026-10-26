import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Hechos,
  Linea,
  Meta,
  TipoCuenta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { avisosDeEstado } from './estado';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const HOY = f('2027-03-15');

type LineaNueva = { cat?: string; deudor?: string; de?: string; monto: number };

/** Libro de hechos completo: ciclo del día 1, febrero cerrado, marzo activo (hoy 15). */
class Libro {
  cuentas: Cuenta[] = [];
  categorias: Categoria[] = [];
  asignaciones: Asignacion[] = [];
  transacciones: Transaccion[] = [];
  efectos: Efecto[] = [];
  lineas: Linea[] = [];
  metas: Meta[] = [];
  private n = 0;

  constructor(cuentas: [string, TipoCuenta][]) {
    for (const [nombre, tipo] of cuentas)
      this.cuentas.push({ id: id(nombre), tipo, nombre, archivada: false } as Cuenta);
  }

  categoria(nombre: string, tarjeta: string | null = null, archivada = false) {
    this.categorias.push({
      id: id(nombre),
      clase: tarjeta === null ? 'normal' : 'pago',
      tarjetaId: tarjeta === null ? null : id(tarjeta),
      archivada,
    } as Categoria);
  }

  /** Fija la asignación de (categoría, período): reemplaza la que hubiera. */
  asignar(cat: string, periodoInicio: string, monto: number) {
    const clave = id(`asig-${cat}-${periodoInicio}`);
    this.asignaciones = this.asignaciones.filter((a) => a.id !== clave);
    this.asignaciones.push({
      id: clave,
      categoriaId: id(cat),
      periodoInicio: f(periodoInicio),
      monto: c(monto),
    } as Asignacion);
  }

  mov(
    tx: string,
    tipo: TipoTransaccion,
    fecha: string,
    efectos: [string, number][],
    lineas: LineaNueva[] = [],
    lineaCobrada: string | null = null,
  ) {
    this.n += 1;
    const total =
      lineas.length > 0 ? lineas.reduce((s, l) => s + l.monto, 0) : Math.abs(efectos[0]?.[1] ?? 0);
    this.transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:${String(this.n).padStart(2, '0')}.000Z`,
      secuencia: String(this.n),
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

  meta(nombre: string, cat: string, monto: number, fechaObjetivo: string) {
    this.metas.push({
      id: id(nombre),
      categoriaId: id(cat),
      tipo: 'para_fecha',
      modo: null,
      monto: c(monto),
      fechaObjetivo: f(fechaObjetivo),
      fechaCreacion: f('2027-01-01'),
    } as Meta);
  }

  hechos(): Hechos {
    const tarjetas = this.cuentas
      .filter((k) => k.tipo === 'tarjeta')
      .map((k) => ({ cuentaId: k.id, tipo: 'tarjeta' as const }));
    return {
      vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
      cuentas: this.cuentas,
      tarjetas,
      prestamos: [],
      inversiones: [],
      grupos: [],
      categorias: this.categorias,
      asignaciones: this.asignaciones,
      deudores: [],
      transacciones: this.transacciones,
      efectos: this.efectos,
      lineas: this.lineas,
      condonaciones: [],
      metas: this.metas,
      programadas: [],
      programada_lineas: [],
      ocurrencias_resueltas: [],
      conciliaciones: [],
    } as unknown as Hechos;
  }
}

const vigentes = (l: Libro) => avisosDeEstado(calcular(l.hechos(), HOY));
/** El aviso `AV-nn` de la fila `clave` con sus datos, o `undefined` si no está vigente. */
const aviso = (l: Libro, av: string, clave?: string) =>
  vigentes(l).find((a) => a.aviso === av && (clave === undefined || a.clave === clave));
const numeros = (l: Libro) => vigentes(l).map((a) => a.aviso);

/** E con 1.000 de saldo inicial, una tarjeta T con su categoría de pago P y la categoría C1. */
function base() {
  const l = new Libro([
    ['E', 'efectivo'],
    ['T', 'tarjeta'],
  ]);
  l.categoria('C1');
  l.categoria('P', 'T');
  l.mov('si', 'saldo_inicial', '2027-01-01', [['E', 1000]]);
  return l;
}

const pagar = (l: Libro, tx: string, fecha: string, monto: number) => {
  l.mov(
    tx,
    'pago_tarjeta',
    fecha,
    [
      ['E', -monto],
      ['T', monto],
    ],
    [{ cat: 'P', monto }],
  );
};

describe('avisos de estado (01 §5.0.7)', () => {
  it('PRU-DOM-MOTOR-109 [AV-02, AV-03] MOT-4.7: sobregiro de débito y de tarjeta en una categoría, con sus partes; desaparecen al cubrirlo', () => {
    const d = base();
    d.asignar('C1', '2027-03-01', 100);
    d.mov('g', 'gasto', '2027-03-05', [['E', -150]], [{ cat: 'C1', monto: 150 }]);
    expect(aviso(d, 'AV-02')).toEqual({
      aviso: 'AV-02',
      clave: 'C1',
      datos: { categoriaId: 'C1', monto: c(50) },
    });
    expect(numeros(d)).not.toContain('AV-03');
    d.asignar('C1', '2027-03-01', 150);
    expect(numeros(d)).toEqual([]);

    const t = base();
    t.asignar('C1', '2027-03-01', 100);
    t.mov('g', 'gasto', '2027-03-05', [['T', -150]], [{ cat: 'C1', monto: 150 }]);
    expect(aviso(t, 'AV-03')).toEqual({
      aviso: 'AV-03',
      clave: 'C1',
      datos: {
        categoriaId: 'C1',
        monto: c(50),
        total: c(50),
        parteTarjeta: c(50),
        parteDebito: c(0),
      },
    });
    expect(numeros(t)).not.toContain('AV-02');
    t.asignar('C1', '2027-03-01', 150);
    expect(numeros(t)).not.toContain('AV-03');

    // Mixto: las dos partes suman el sobregiro total de la categoría y cada una tiene su aviso.
    const m = base();
    m.asignar('C1', '2027-03-01', 100);
    m.mov('g1', 'gasto', '2027-03-05', [['E', -150]], [{ cat: 'C1', monto: 150 }]);
    m.mov('g2', 'gasto', '2027-03-06', [['T', -100]], [{ cat: 'C1', monto: 100 }]);
    // F = 100: E 150 consume el fondo y deja 50 sin cubrir (débito); T 100 queda entero sin cubrir.
    expect(aviso(m, 'AV-02')?.datos).toEqual({ categoriaId: 'C1', monto: c(50) });
    expect(aviso(m, 'AV-03')?.datos).toEqual({
      categoriaId: 'C1',
      monto: c(100),
      total: c(150),
      parteTarjeta: c(100),
      parteDebito: c(50),
    });
  });

  it('PRU-DOM-MOTOR-109 [AV-04] MOT-4.7: pago de más de lo reservado, por la parte de pagos del excedente; desaparece al reservarlo', () => {
    const l = base();
    l.mov('g', 'gasto', '2027-03-03', [['T', -100]], [{ cat: 'C1', monto: 100 }]);
    pagar(l, 'p', '2027-03-10', 100);
    expect(aviso(l, 'AV-04')).toEqual({
      aviso: 'AV-04',
      clave: 'T',
      datos: { tarjetaId: 'T', monto: c(100) },
    });
    l.asignar('C1', '2027-03-01', 100); // el gasto queda cubierto y se reserva para pagar
    expect(numeros(l)).not.toContain('AV-04');
  });

  it('PRU-DOM-MOTOR-109 [AV-05] MOT-4.7: cobro aplicado a la tarjeta sin reserva; desaparece al reservar', () => {
    const l = base();
    l.mov('pc', 'gasto', '2027-03-02', [['E', -40]], [{ deudor: 'Ana', monto: 40 }]);
    l.mov('g', 'gasto', '2027-03-03', [['T', -100]], [{ cat: 'C1', monto: 100 }]);
    l.mov('co', 'cobro', '2027-03-10', [['T', 40]], [], 'pc.0');
    expect(aviso(l, 'AV-05')).toEqual({
      aviso: 'AV-05',
      clave: 'T',
      datos: { tarjetaId: 'T', monto: c(40) },
    });
    l.asignar('C1', '2027-03-01', 100);
    expect(numeros(l)).not.toContain('AV-05');
  });

  it('PRU-DOM-MOTOR-109 [AV-06] MOT-4.7: devolución cuyo dinero ya se pagó, en sus dos variantes (saldo a favor y con deuda); desaparece al reservar', () => {
    // Febrero: gasto con T cubierto y pagado. Marzo: se devuelve (D-3): C1 recupera 100 y pago(T) −100.
    const aFavor = base();
    aFavor.asignar('C1', '2027-02-01', 100);
    aFavor.mov('g', 'gasto', '2027-02-05', [['T', -100]], [{ cat: 'C1', monto: 100 }]);
    pagar(aFavor, 'p', '2027-02-10', 100);
    aFavor.mov(
      'd',
      'devolucion',
      '2027-03-05',
      [['T', 100]],
      [{ cat: 'C1', de: 'g.0', monto: 100 }],
    );
    expect(aviso(aFavor, 'AV-06')).toEqual({
      aviso: 'AV-06',
      clave: 'T',
      datos: { tarjetaId: 'T', monto: c(100), variante: 'saldo_a_favor', categoriaIds: 'C1' },
    });
    aFavor.asignar('P', '2027-03-01', 100);
    expect(numeros(aFavor)).not.toContain('AV-06');

    // Con un gasto posterior de 150 sin cubrir, a la tarjeta le queda deuda de 50.
    const conDeuda = base();
    conDeuda.asignar('C1', '2027-02-01', 100);
    conDeuda.mov('g', 'gasto', '2027-02-05', [['T', -100]], [{ cat: 'C1', monto: 100 }]);
    pagar(conDeuda, 'p', '2027-02-10', 100);
    conDeuda.categoria('C2'); // otra categoría: si fuera C1, la devolución cubriría el gasto nuevo
    conDeuda.mov('g2', 'gasto', '2027-03-04', [['T', -150]], [{ cat: 'C2', monto: 150 }]);
    conDeuda.mov(
      'd',
      'devolucion',
      '2027-03-05',
      [['T', 100]],
      [{ cat: 'C1', de: 'g.0', monto: 100 }],
    );
    expect(aviso(conDeuda, 'AV-06')?.datos).toEqual({
      tarjetaId: 'T',
      monto: c(100),
      variante: 'con_deuda',
      categoriaIds: 'C1',
    });
  });

  it('PRU-DOM-MOTOR-109 [AV-07, AV-08] MOT-4.8: te falta reservar S(t) y reserva excedente RE(t), nunca los dos; desaparecen al cuadrar', () => {
    const l = base();
    l.mov('g', 'gasto', '2027-03-03', [['T', -100]], [{ cat: 'C1', monto: 100 }]);
    expect(aviso(l, 'AV-07')).toEqual({
      aviso: 'AV-07',
      clave: 'T',
      datos: { tarjetaId: 'T', monto: c(100) },
    });
    expect(numeros(l)).not.toContain('AV-08');
    l.asignar('C1', '2027-03-01', 100);
    expect(numeros(l)).not.toContain('AV-07');
    expect(numeros(l)).not.toContain('AV-08');
    l.asignar('P', '2027-03-01', 50);
    expect(aviso(l, 'AV-08')).toEqual({
      aviso: 'AV-08',
      clave: 'T',
      datos: { tarjetaId: 'T', monto: c(50) },
    });
    expect(numeros(l)).not.toContain('AV-07');
  });

  it('PRU-DOM-MOTOR-109 [AV-09] MOT-4.10: dinero en camino mientras haya por cobrar de una compra con débito; desaparece al cobrarse', () => {
    const l = base();
    l.mov('pc', 'gasto', '2027-03-02', [['E', -70]], [{ deudor: 'Ana', monto: 70 }]);
    expect(aviso(l, 'AV-09')).toEqual({ aviso: 'AV-09', clave: 'lpa', datos: { monto: c(70) } });
    l.mov('co', 'cobro', '2027-03-10', [['E', 70]], [], 'pc.0');
    expect(numeros(l)).not.toContain('AV-09');
  });

  it('PRU-DOM-MOTOR-109 [AV-14] MOT-4.6: categoría archivada con Disponible; desaparece al desarchivarla o vaciarla', () => {
    const l = base();
    l.categoria('V', null, true);
    l.asignar('V', '2027-03-01', 100);
    expect(aviso(l, 'AV-14')).toEqual({
      aviso: 'AV-14',
      clave: 'V',
      datos: { categoriaId: 'V', monto: c(100) },
    });
    const sinArchivar = base();
    sinArchivar.categoria('V');
    sinArchivar.asignar('V', '2027-03-01', 100);
    expect(numeros(sinArchivar)).not.toContain('AV-14');
    const vacia = base();
    vacia.categoria('V', null, true);
    expect(numeros(vacia)).not.toContain('AV-14');
  });

  it('PRU-DOM-MOTOR-109 [AV-17] MOT-4.12: meta para una fecha vencida; desaparece al extender la fecha', () => {
    const l = base();
    l.meta('m', 'C1', 1000, '2027-02-20');
    expect(aviso(l, 'AV-17')).toEqual({
      aviso: 'AV-17',
      clave: 'm',
      datos: { metaId: 'm', categoriaId: 'C1', falta: c(1000), fechaObjetivo: '2027-02-20' },
    });
    const extendida = base();
    extendida.meta('m', 'C1', 1000, '2027-06-01');
    expect(numeros(extendida)).not.toContain('AV-17');
  });

  it('PRU-DOM-MOTOR-109 [AV-20] MOT-4.9: LPA negativo; desaparece al dejar de serlo', () => {
    const l = base();
    l.asignar('C1', '2027-03-01', 1200);
    expect(aviso(l, 'AV-20')).toEqual({ aviso: 'AV-20', clave: 'lpa', datos: { monto: c(-200) } });
    l.asignar('C1', '2027-03-01', 1000);
    expect(numeros(l)).not.toContain('AV-20');
  });

  it('PRU-DOM-MOTOR-109 [AV-07, AV-20] sin condiciones no hay avisos, y salen ordenados por número de aviso', () => {
    expect(numeros(base())).toEqual([]);
    const l = base();
    l.mov('g', 'gasto', '2027-03-03', [['T', -100]], [{ cat: 'C1', monto: 100 }]);
    l.categoria('C2');
    l.asignar('C2', '2027-03-01', 1500);
    expect(numeros(l)).toEqual(['AV-03', 'AV-07', 'AV-20']);
  });
});
