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
    const a = { id: id(`a${this.asignaciones.length}`), categoriaId: id(cat), monto: m(monto) };
    this.asignaciones.push({ ...a, periodoInicio: f(periodo) } as Asignacion);
    return this;
  }

  debito(cat: string, fecha: string, monto: string) {
    const n = String(this.transacciones.length + 1);
    const transaccionId = id(`t${n}`);
    const momento = { fecha: f(fecha), claveOrden: `${fecha}T12:00:00.000Z`, secuencia: n };
    this.transacciones.push({ id: transaccionId, tipo: 'gasto', ...momento } as Transaccion);
    const efecto = { id: id(`e${n}`), transaccionId, cuentaId: id('ef'), monto: m(`-${monto}`) };
    this.efectos.push(efecto as Efecto);
    const linea = {
      id: id(`l${n}`),
      transaccionId,
      orden: 1,
      monto: m(monto),
      lineaOriginalId: null,
    };
    this.lineas.push({ ...linea, categoriaId: id(cat), deudorId: null } as Linea);
    return this;
  }
}

const meta = (tipo: Meta['tipo'], monto: string, cat: string, x: Partial<Meta> = {}): Meta => ({
  id: id('meta'),
  categoriaId: id(cat),
  tipo,
  modo: null,
  monto: m(monto),
  fechaObjetivo: null,
  fechaCreacion: f('2027-01-25'),
  revision: null,
  ...x,
});

/** Evalúa la meta con hoy en `hoy` y, si se da, en el período que contiene `en`. */
function evaluar(l: Libro, x: Meta, hoy: string, en?: string, c: Ciclo = ciclo21, arch = false) {
  const b = presupuesto(l, c, f(hoy));
  const p = en === undefined ? undefined : periodoDe(c, f(en));
  return evaluarMeta(x, { id: x.categoriaId, archivada: arch }, b, c, f(hoy), p);
}

/** Centavos como texto en dólares, sin dividir: −12000 → "-120.00". */
function usd(x: Centavos): string {
  const digitos = String(Math.abs(x)).padStart(3, '0');
  return `${x < 0 ? '-' : ''}${digitos.slice(0, -2)}.${digitos.slice(-2)}`;
}

/** "base · n · pedido · falta · estado", con los montos en dólares. */
function r(...args: Parameters<typeof evaluar>): string {
  const e = evaluar(...args);
  if (e === null) return 'sin evaluar';
  const n = e.periodosRestantes ?? '—';
  return `${usd(e.base)} · ${n} · ${usd(e.pedido)} · ${usd(e.falta)} · ${e.estado}`;
}

describe('PRU-DOM-META', () => {
  it('PRU-DOM-META-101 [CB-34] MOT-4.12: metas (01 §4.12, §7.5) con los números de ESC-35 a ESC-38 y ESC-45: los cuatro tipos con su pedido, falta y estado, la renovación anual con el dinero no gastado, una meta para una fecha cumplida, completada, vencida y extendida, y una meta de una categoría archivada que no se evalúa', () => {
    // ESC-35: mensual de 200, Gas con "rellenar hasta" y Fondo con "acumular".
    const gas = meta('mensual', '200', 'gas', { modo: 'rellenar_hasta' });
    const fondo = meta('mensual', '200', 'fondo', { modo: 'acumular' });
    const l35 = new Libro('gas', 'fondo').asignar('gas', '2027-01-21', '200');
    l35.asignar('fondo', '2027-01-21', '200').debito('gas', '2027-01-30', '120');
    expect(r(l35, gas, '2027-02-01')).toBe('-120.00 · — · 200.00 · 0.00 · cubierta');
    expect(r(l35, fondo, '2027-02-01')).toBe('0.00 · — · 200.00 · 0.00 · cubierta');
    expect(r(l35, gas, '2027-02-21')).toBe('80.00 · — · 120.00 · 120.00 · con_faltante');
    expect(r(l35, fondo, '2027-02-21')).toBe('200.00 · — · 200.00 · 200.00 · con_faltante');
    l35.asignar('gas', '2027-02-21', '120').asignar('fondo', '2027-02-21', '200');
    expect(r(l35, gas, '2027-02-21')).toBe('80.00 · — · 120.00 · 0.00 · cubierta');
    expect(r(l35, fondo, '2027-02-21')).toBe('200.00 · — · 200.00 · 0.00 · cubierta');

    // ESC-36: semanal de 50 en períodos de 31, 28 y 30 días (ciclo del día 1).
    const semanal = meta('semanal', '50', 'gas', { modo: 'acumular' });
    const ciclo1 = ciclo([{ diaInicio: 1, rigeDesde: null }]);
    const l36 = new Libro('gas');
    const delPeriodo = (en: string) =>
      evaluar(l36, semanal, '2027-01-10', en, ciclo1)?.montoDelPeriodo;
    const montos = [delPeriodo('2027-01-10'), delPeriodo('2027-02-10'), delPeriodo('2027-04-10')];
    expect(montos).toEqual([m('221.43'), m('200'), m('214.29')]);
    // Con "rellenar hasta", el pedido descuenta el arrastre.
    const relleno = { ...semanal, modo: 'rellenar_hasta' as const };
    l36.asignar('gas', '2027-01-01', '50');
    expect(r(l36, relleno, '2027-02-03', undefined, ciclo1)).toBe(
      '50.00 · — · 150.00 · 150.00 · con_faltante',
    );

    // ESC-45: período de transición de 11 días (21 dic – 31 dic) al cambiar el día de inicio a 1.
    const cambio = ciclo([
      { diaInicio: 21, rigeDesde: null },
      { diaInicio: 1, rigeDesde: f('2027-12-21') },
    ]);
    const enTransicion = (x: Meta) =>
      evaluar(new Libro('gas'), x, '2027-12-25', undefined, cambio)?.montoDelPeriodo;
    expect([enTransicion(semanal), enTransicion(gas)]).toEqual([m('78.57'), m('200')]);

    // ESC-37: anual de 1,200 creada el 25 ene 2027 sin fecha: FO₀ = 25 ene 2028.
    const viaje = meta('anual', '1200', 'viaje');
    const l37 = new Libro('viaje');
    expect(r(l37, viaje, '2027-01-25')).toBe('0.00 · 13 · 92.31 · 92.31 · en_curso');
    l37.asignar('viaje', '2027-01-21', '92.31');
    // P2 evaluado como período futuro (sin celda propia) y como activo dan lo mismo.
    expect(r(l37, viaje, '2027-01-25', '2027-02-21')).toBe('92.31 · 12 · 92.31 · 92.31 · en_curso');
    expect(r(l37, viaje, '2027-02-25')).toBe('92.31 · 12 · 92.31 · 92.31 · en_curso');
    l37.asignar('viaje', '2027-02-21', '1007.69');
    expect(r(l37, viaje, '2028-01-22')).toBe('1100.00 · 1 · 100.00 · 100.00 · en_curso');
    expect(evaluar(l37, viaje, '2028-01-22')?.fechaObjetivo).toBe(f('2028-01-25'));
    l37.asignar('viaje', '2028-01-21', '100');
    expect(r(l37, viaje, '2028-01-22')).toBe('1100.00 · 1 · 100.00 · 0.00 · cumplida');
    l37.debito('viaje', '2028-01-30', '600');
    expect(evaluar(l37, viaje, '2028-02-01')?.estado).toBe('en_curso');
    // Renovación: desde el período siguiente rige FO₁ = 25 ene 2029 y los 600 cuentan.
    expect(r(l37, viaje, '2028-02-21')).toBe('600.00 · 12 · 50.00 · 50.00 · en_curso');
    expect(evaluar(l37, viaje, '2028-02-21')?.fechaObjetivo).toBe(f('2029-01-25'));

    // FO₀ de una anual: 29 de febrero → 28 de febrero; FOₖ = FO₀ + k años.
    const p = (x: string) => periodoDe(ciclo21, f(x));
    const bisiesta = meta('anual', '1', 'viaje', { fechaCreacion: f('2028-02-29') });
    expect(fechaObjetivo(bisiesta, p('2028-03-01'))).toBe(f('2029-02-28'));
    const dada = { ...bisiesta, fechaObjetivo: f('2028-02-29') };
    const fos = ['2028-02-25', '2028-03-25', '2032-02-25'].map((x) => fechaObjetivo(dada, p(x)));
    expect(fos).toEqual([f('2028-02-29'), f('2029-02-28'), f('2032-02-29')]);

    // ESC-38: para una fecha, 600 en Laptop para el 15 may 2027 (P4).
    const laptop = meta('para_fecha', '600', 'laptop', { fechaObjetivo: f('2027-05-15') });
    const l38 = () =>
      new Libro('laptop')
        .asignar('laptop', '2027-01-21', '150')
        .asignar('laptop', '2027-02-21', '150');
    expect(r(new Libro('laptop'), laptop, '2027-01-25')).toBe(
      '0.00 · 4 · 150.00 · 150.00 · en_curso',
    );
    expect(r(l38(), laptop, '2027-03-25')).toBe('300.00 · 2 · 150.00 · 150.00 · en_curso');
    // 3a: asigna 300 en P3 → cumplida; en P4 pide 0; después de la FO, completada.
    const a = l38().asignar('laptop', '2027-03-21', '300');
    expect(r(a, laptop, '2027-03-25')).toBe('300.00 · 2 · 150.00 · 0.00 · cumplida');
    expect(r(a, laptop, '2027-04-25')).toBe('600.00 · 1 · 0.00 · 0.00 · cumplida');
    expect(r(a, laptop, '2027-05-25')).toBe('600.00 · 1 · 0.00 · 0.00 · completada');
    // Completada aunque después se gaste: alcanzó el monto en el período de la FO (A-4).
    a.debito('laptop', '2027-05-26', '600');
    expect(r(a, laptop, '2027-05-27')).toBe('0.00 · 1 · 0.00 · 0.00 · completada');
    // 3b–5b: no asigna en P3, asigna 100 en P4 → vencida en P5, pide todo lo que falta (n = 1).
    const b = l38().asignar('laptop', '2027-04-21', '100');
    expect(r(b, laptop, '2027-04-25')).toBe('300.00 · 1 · 300.00 · 200.00 · en_curso');
    expect(r(b, laptop, '2027-05-25')).toBe('400.00 · 1 · 200.00 · 200.00 · vencida');
    // 6b: extender la FO al 15 jul (P6) → en curso con n = 2.
    const extendida = { ...laptop, fechaObjetivo: f('2027-07-15') };
    expect(r(b, extendida, '2027-05-25')).toBe('400.00 · 2 · 100.00 · 100.00 · en_curso');
    // Vencida → completada cuando el Disponible alcanza el monto.
    b.asignar('laptop', '2027-05-21', '200');
    expect(r(b, laptop, '2027-05-25')).toBe('400.00 · 1 · 0.00 · 0.00 · completada');

    // CB-34: la meta de una categoría archivada se conserva, pero no se evalúa.
    expect(r(l37, viaje, '2028-02-21', undefined, ciclo21, true)).toBe('sin evaluar');
    // Solo se evalúan el período activo y los futuros, con la meta de su categoría.
    expect(() => evaluar(l37, viaje, '2028-02-21', '2028-01-25')).toThrow(RangeError);
    const b37 = presupuesto(l37, ciclo21, f('2028-02-21'));
    const otra = { id: id('otra'), archivada: false };
    expect(() => evaluarMeta(viaje, otra, b37, ciclo21, f('2028-02-21'))).toThrow(RangeError);
    expect(() => fechaObjetivo({ ...laptop, fechaObjetivo: null }, p('2027-01-25'))).toThrow(
      RangeError,
    );
    expect(() => fechaObjetivo(gas, p('2027-01-25'))).toThrow(RangeError);
  });
});
