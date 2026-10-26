import { describe, expect, it } from 'vitest';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Linea,
  Meta,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { presupuesto } from './disponible';
import { evaluarMeta, fechaObjetivo } from './metas';
import { type Ciclo, ciclo, periodoDe } from './periodos';

const m = (t: string) => Centavos.desdeTexto(t);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const ciclo21 = ciclo([{ diaInicio: 21, rigeDesde: null }]);

/** Hechos mínimos: una cuenta de efectivo, categorías normales, asignaciones y débitos. */
class Libro {
  readonly cuentas = [{ id: id('ef'), tipo: 'efectivo', nombre: 'Ef' } as Cuenta];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly condonaciones = [];
  readonly categorias: Categoria[] = [];
  readonly asignaciones: Asignacion[] = [];

  constructor(...categorias: string[]) {
    for (const x of categorias)
      this.categorias.push({ id: id(x), clase: 'normal', tarjetaId: null } as Categoria);
  }

  asignar(cat: string, periodo: string, monto: string) {
    const n = this.asignaciones.length;
    this.asignaciones.push({
      id: id(`a${n}`),
      categoriaId: id(cat),
      periodoInicio: f(periodo),
      monto: m(monto),
    } as Asignacion);
    return this;
  }

  debito(cat: string, fecha: string, monto: string) {
    const n = String(this.transacciones.length + 1);
    const tx = id(`t${n}`);
    this.transacciones.push({
      id: tx,
      tipo: 'gasto',
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: n,
      total: m(monto),
    } as Transaccion);
    this.efectos.push({
      id: id(`e${n}`),
      transaccionId: tx,
      cuentaId: id('ef'),
      monto: m(`-${monto}`),
    } as Efecto);
    this.lineas.push({
      id: id(`l${n}`),
      transaccionId: tx,
      orden: 1,
      monto: m(monto),
      categoriaId: id(cat),
      deudorId: null,
      lineaOriginalId: null,
    } as Linea);
    return this;
  }
}

const meta = (x: Partial<Meta> & Pick<Meta, 'tipo' | 'monto' | 'categoriaId'>): Meta => ({
  id: id('meta'),
  modo: null,
  fechaObjetivo: null,
  fechaCreacion: f('2027-01-25'),
  revision: null,
  ...x,
});

/** Evalúa la meta con hoy en `hoy` y, si se da, en el período que contiene `en`. */
function evaluar(
  l: Libro,
  x: Meta,
  hoy: string,
  en?: string,
  c: Ciclo = ciclo21,
  archivada = false,
) {
  const b = presupuesto(l, c, f(hoy));
  const p = en === undefined ? undefined : periodoDe(c, f(en));
  return evaluarMeta(x, { id: x.categoriaId, archivada }, b, c, f(hoy), p);
}

const resumen = (e: ReturnType<typeof evaluar>) =>
  e === null
    ? null
    : { base: e.base, n: e.periodosRestantes, pedido: e.pedido, falta: e.falta, estado: e.estado };

describe('PRU-DOM-META', () => {
  it('PRU-DOM-META-101 [CB-34] MOT-4.12: metas (01 §4.12, §7.5) con los números de ESC-35 a ESC-38 y ESC-45: los cuatro tipos con su pedido, falta y estado, la renovación anual con el dinero no gastado, una meta para una fecha cumplida, completada, vencida y extendida, y una meta de una categoría archivada que no se evalúa', () => {
    // ESC-35: mensual de 200, Gas con "rellenar hasta" y Fondo con "acumular".
    const gas = meta({
      tipo: 'mensual',
      modo: 'rellenar_hasta',
      monto: m('200'),
      categoriaId: id('gas'),
    });
    const fondo = meta({
      tipo: 'mensual',
      modo: 'acumular',
      monto: m('200'),
      categoriaId: id('fondo'),
    });
    const l35 = new Libro('gas', 'fondo')
      .asignar('gas', '2027-01-21', '200')
      .asignar('fondo', '2027-01-21', '200');
    l35.debito('gas', '2027-01-30', '120');
    expect(resumen(evaluar(l35, gas, '2027-02-01'))).toEqual({
      base: m('-120'),
      n: null,
      pedido: m('200'),
      falta: m('0'),
      estado: 'cubierta',
    });
    expect(evaluar(l35, fondo, '2027-02-01')?.falta).toBe(m('0'));
    expect(resumen(evaluar(l35, gas, '2027-02-21'))).toEqual({
      base: m('80'),
      n: null,
      pedido: m('120'),
      falta: m('120'),
      estado: 'con_faltante',
    });
    expect(resumen(evaluar(l35, fondo, '2027-02-21'))).toEqual({
      base: m('200'),
      n: null,
      pedido: m('200'),
      falta: m('200'),
      estado: 'con_faltante',
    });
    l35.asignar('gas', '2027-02-21', '120').asignar('fondo', '2027-02-21', '200');
    expect(evaluar(l35, gas, '2027-02-21')?.estado).toBe('cubierta');
    expect(evaluar(l35, fondo, '2027-02-21')?.falta).toBe(m('0'));

    // ESC-36: semanal de 50 en períodos de 31, 28 y 30 días (ciclo del día 1).
    const semanal = meta({
      tipo: 'semanal',
      modo: 'acumular',
      monto: m('50'),
      categoriaId: id('gas'),
    });
    const ciclo1 = ciclo([{ diaInicio: 1, rigeDesde: null }]);
    const l36 = new Libro('gas');
    const delPeriodo = (en: string) =>
      evaluar(l36, semanal, '2027-01-10', en, ciclo1)?.montoDelPeriodo;
    expect([delPeriodo('2027-01-10'), delPeriodo('2027-02-10'), delPeriodo('2027-04-10')]).toEqual([
      m('221.43'),
      m('200'),
      m('214.29'),
    ]);
    // Con "rellenar hasta", el pedido descuenta el arrastre.
    const relleno = { ...semanal, modo: 'rellenar_hasta' as const };
    l36.asignar('gas', '2027-01-01', '50');
    expect(resumen(evaluar(l36, relleno, '2027-02-03', undefined, ciclo1))).toEqual({
      base: m('50'),
      n: null,
      pedido: m('150'),
      falta: m('150'),
      estado: 'con_faltante',
    });

    // ESC-45: período de transición de 11 días (21 dic – 31 dic) al cambiar el día de inicio a 1.
    const transicion = ciclo([
      { diaInicio: 21, rigeDesde: null },
      { diaInicio: 1, rigeDesde: f('2027-12-21') },
    ]);
    const enTransicion = (x: Meta) =>
      evaluar(new Libro('gas'), x, '2027-12-25', undefined, transicion)?.montoDelPeriodo;
    expect(enTransicion(semanal)).toBe(m('78.57'));
    expect(enTransicion(gas)).toBe(m('200'));

    // ESC-37: anual de 1,200 creada el 25 ene 2027 sin fecha: FO₀ = 25 ene 2028.
    const viaje = meta({ tipo: 'anual', monto: m('1200'), categoriaId: id('viaje') });
    const l37 = new Libro('viaje');
    expect(resumen(evaluar(l37, viaje, '2027-01-25'))).toEqual({
      base: m('0'),
      n: 13,
      pedido: m('92.31'),
      falta: m('92.31'),
      estado: 'en_curso',
    });
    l37.asignar('viaje', '2027-01-21', '92.31');
    // P2 evaluado como período futuro (sin celda propia) y como activo dan lo mismo.
    expect(resumen(evaluar(l37, viaje, '2027-01-25', '2027-02-21'))).toEqual({
      base: m('92.31'),
      n: 12,
      pedido: m('92.31'),
      falta: m('92.31'),
      estado: 'en_curso',
    });
    expect(resumen(evaluar(l37, viaje, '2027-02-25'))).toEqual({
      base: m('92.31'),
      n: 12,
      pedido: m('92.31'),
      falta: m('92.31'),
      estado: 'en_curso',
    });
    l37.asignar('viaje', '2027-02-21', '1007.69');
    expect(resumen(evaluar(l37, viaje, '2028-01-22'))).toEqual({
      base: m('1100'),
      n: 1,
      pedido: m('100'),
      falta: m('100'),
      estado: 'en_curso',
    });
    expect(evaluar(l37, viaje, '2028-01-22')?.fechaObjetivo).toBe(f('2028-01-25'));
    l37.asignar('viaje', '2028-01-21', '100');
    expect(resumen(evaluar(l37, viaje, '2028-01-22'))).toEqual({
      base: m('1100'),
      n: 1,
      pedido: m('100'),
      falta: m('0'),
      estado: 'cumplida',
    });
    l37.debito('viaje', '2028-01-30', '600');
    expect(evaluar(l37, viaje, '2028-02-01')?.estado).toBe('en_curso');
    // Renovación: desde el período siguiente rige FO₁ = 25 ene 2029 y los 600 cuentan.
    const renovada = evaluar(l37, viaje, '2028-02-21');
    expect(resumen(renovada)).toEqual({
      base: m('600'),
      n: 12,
      pedido: m('50'),
      falta: m('50'),
      estado: 'en_curso',
    });
    expect(renovada?.fechaObjetivo).toBe(f('2029-01-25'));

    // FO₀ de una anual: 29 de febrero → 28 de febrero; FOₖ = FO₀ + k años.
    const p = (x: string) => periodoDe(ciclo21, f(x));
    const bisiesta = meta({
      tipo: 'anual',
      monto: m('1'),
      categoriaId: id('viaje'),
      fechaCreacion: f('2028-02-29'),
    });
    expect(fechaObjetivo(bisiesta, p('2028-03-01'))).toBe(f('2029-02-28'));
    const dada = { ...bisiesta, fechaObjetivo: f('2028-02-29') };
    expect([
      fechaObjetivo(dada, p('2028-02-25')),
      fechaObjetivo(dada, p('2028-03-25')),
      fechaObjetivo(dada, p('2032-02-25')),
    ]).toEqual([f('2028-02-29'), f('2029-02-28'), f('2032-02-29')]);

    // ESC-38: para una fecha, 600 en Laptop para el 15 may 2027 (P4).
    const laptop = meta({
      tipo: 'para_fecha',
      monto: m('600'),
      categoriaId: id('laptop'),
      fechaObjetivo: f('2027-05-15'),
    });
    const l38 = () =>
      new Libro('laptop')
        .asignar('laptop', '2027-01-21', '150')
        .asignar('laptop', '2027-02-21', '150');
    expect(resumen(evaluar(new Libro('laptop'), laptop, '2027-01-25'))).toEqual({
      base: m('0'),
      n: 4,
      pedido: m('150'),
      falta: m('150'),
      estado: 'en_curso',
    });
    expect(resumen(evaluar(l38(), laptop, '2027-03-25'))).toEqual({
      base: m('300'),
      n: 2,
      pedido: m('150'),
      falta: m('150'),
      estado: 'en_curso',
    });
    // 3a: asigna 300 en P3 → cumplida; en P4 pide 0; después de la FO, completada.
    const a = l38().asignar('laptop', '2027-03-21', '300');
    expect(evaluar(a, laptop, '2027-03-25')?.estado).toBe('cumplida');
    expect(resumen(evaluar(a, laptop, '2027-04-25'))).toEqual({
      base: m('600'),
      n: 1,
      pedido: m('0'),
      falta: m('0'),
      estado: 'cumplida',
    });
    expect(resumen(evaluar(a, laptop, '2027-05-25'))).toEqual({
      base: m('600'),
      n: 1,
      pedido: m('0'),
      falta: m('0'),
      estado: 'completada',
    });
    // Completada aunque después se gaste: alcanzó el monto en el período de la FO (A-4).
    a.debito('laptop', '2027-05-26', '600');
    expect(resumen(evaluar(a, laptop, '2027-05-27'))).toEqual({
      base: m('0'),
      n: 1,
      pedido: m('0'),
      falta: m('0'),
      estado: 'completada',
    });
    // 3b–5b: no asigna en P3, asigna 100 en P4 → vencida en P5, pide todo lo que falta (n = 1).
    const b = l38().asignar('laptop', '2027-04-21', '100');
    expect(resumen(evaluar(b, laptop, '2027-04-25'))).toEqual({
      base: m('300'),
      n: 1,
      pedido: m('300'),
      falta: m('200'),
      estado: 'en_curso',
    });
    expect(resumen(evaluar(b, laptop, '2027-05-25'))).toEqual({
      base: m('400'),
      n: 1,
      pedido: m('200'),
      falta: m('200'),
      estado: 'vencida',
    });
    // 6b: extender la FO al 15 jul (P6) → en curso con n = 2.
    const extendida = { ...laptop, fechaObjetivo: f('2027-07-15') };
    expect(resumen(evaluar(b, extendida, '2027-05-25'))).toEqual({
      base: m('400'),
      n: 2,
      pedido: m('100'),
      falta: m('100'),
      estado: 'en_curso',
    });
    // Vencida → completada cuando el Disponible alcanza el monto.
    b.asignar('laptop', '2027-05-21', '200');
    expect(evaluar(b, laptop, '2027-05-25')?.estado).toBe('completada');

    // CB-34: la meta de una categoría archivada se conserva, pero no se evalúa.
    expect(evaluar(l37, viaje, '2028-02-21', undefined, ciclo21, true)).toBeNull();
    // Solo se evalúan el período activo y los futuros, con la meta de su categoría.
    expect(() => evaluar(l37, viaje, '2028-02-21', '2028-01-25')).toThrow(RangeError);
    expect(() =>
      evaluarMeta(
        viaje,
        { id: id('otra'), archivada: false },
        presupuesto(l37, ciclo21, f('2028-02-21')),
        ciclo21,
        f('2028-02-21'),
      ),
    ).toThrow(RangeError);
    expect(() => fechaObjetivo({ ...laptop, fechaObjetivo: null }, p('2027-01-25'))).toThrow(
      RangeError,
    );
    expect(() => fechaObjetivo(gas, p('2027-01-25'))).toThrow(RangeError);
  });
});
