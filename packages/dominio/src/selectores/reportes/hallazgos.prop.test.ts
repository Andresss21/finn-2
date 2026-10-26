import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../../calculo/calcular';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  Transaccion,
  Uuid,
} from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { type Hallazgo, ordenarHallazgos } from './hallazgos';
import { hormiga, realidad } from './index';
import { HALLAZGOS_MAX, HORMIGA_MONTO_MAX } from './umbrales';

// 300 casos en PR (07 §1.1); FC_RUNS=5000 en el nocturno (V6-11). La semilla la fija vitest.config.ts.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const c = Centavos.desdeEntero;
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const HOY = f('2027-04-15');

/** Hechos con una cuenta de efectivo, un grupo y las categorías indicadas, ciclo mensual. */
class Libro {
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly asignaciones: Asignacion[] = [];

  constructor(readonly categorias: readonly string[]) {
    this.movimiento('si', '2026-12-01', 'saldo_inicial', '', 100_000_000, []);
  }

  movimiento(
    n: string,
    fecha: string,
    tipo: Transaccion['tipo'],
    comercio: string,
    total: number,
    partes: readonly [string, number][],
  ) {
    this.transacciones.push({
      id: id(n),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.${String(this.transacciones.length).padStart(3, '0')}Z`,
      secuencia: String(this.transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio,
      total: c(total),
      lineaCobradaId: null,
    } as Transaccion);
    this.efectos.push({
      id: id(`e-${n}`),
      transaccionId: id(n),
      cuentaId: id('ef'),
      monto: c(tipo === 'saldo_inicial' ? total : -total),
      interes: null,
      seguro: null,
    } as Efecto);
    partes.forEach(([categoria, monto], k) =>
      this.lineas.push({
        id: id(`l-${n}-${k}`),
        transaccionId: id(n),
        orden: k + 1,
        monto: c(monto),
        categoriaId: id(categoria),
        deudorId: null,
        lineaOriginalId: null,
      } as Linea),
    );
  }

  instantanea() {
    const hechos: Hechos = {
      vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
      cuentas: [
        { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', archivada: false },
      ] as Cuenta[],
      tarjetas: [],
      prestamos: [],
      inversiones: [],
      grupos: [
        { id: id('g'), nombre: 'Gastos', orden: 1, archivado: false, claveSistema: null },
      ] as Grupo[],
      categorias: this.categorias.map((n, k) => ({
        id: id(n),
        grupoId: id('g'),
        nombre: n,
        orden: k + 1,
        clase: 'normal',
        tarjetaId: null,
        archivada: false,
      })) as Categoria[],
      asignaciones: this.asignaciones,
      deudores: [],
      transacciones: this.transacciones,
      efectos: this.efectos,
      lineas: this.lineas,
      condonaciones: [],
      metas: [],
      programadas: [],
      programada_lineas: [],
      ocurrencias_resueltas: [],
      conciliaciones: [],
    };
    return calcular(hechos, HOY);
  }
}

const tipoArb = fc.constantFrom<Hallazgo['tipo']>(
  'ritmo',
  'tarjeta',
  'realidad',
  'suscripcion',
  'hormiga',
  'promedio',
);

describe('PRU-PROP-REP', () => {
  it('PRU-PROP-REP-004 [V6-11] REP-hallazgos (CF-04) hallazgos: una fila por clave con el mayor impacto, ordenados por impacto, máximo HALLAZGOS_MAX y sin depender del orden de entrada', () => {
    const hallazgo = fc.record({
      tipo: tipoArb,
      clave: fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'),
      impacto: fc.integer({ min: 1, max: 9000 }).map(c),
    });
    fc.assert(
      fc.property(fc.array(hallazgo, { maxLength: 15 }), fc.nat(1000), (hs, giro) => {
        const o = ordenarHallazgos(hs);
        expect(o.length).toBeLessThanOrEqual(HALLAZGOS_MAX);
        expect(new Set(o.map((x) => x.clave)).size).toBe(o.length);
        expect(o.every((x, k) => k === 0 || (o[k - 1]?.impacto ?? 0) >= x.impacto)).toBe(true);
        // Cada fila conserva el mayor impacto de su clave.
        for (const x of o)
          expect(x.impacto).toBe(
            Math.max(...hs.filter((y) => y.clave === x.clave).map((y) => y.impacto)),
          );
        // Si hay más claves que el máximo, las que quedan son las de mayor impacto.
        const mejores = [...new Map(hs.map((x) => [x.clave, 0])).keys()].map((k) =>
          Math.max(...hs.filter((y) => y.clave === k).map((y) => y.impacto)),
        );
        expect(o.map((x) => x.impacto)).toEqual(
          mejores.sort((a, b) => b - a).slice(0, HALLAZGOS_MAX),
        );
        // El orden de entrada no cambia el resultado.
        const g = giro % Math.max(1, hs.length);
        expect(ordenarHallazgos([...hs.slice(g), ...hs.slice(0, g)].reverse())).toEqual(o);
      }),
      opciones,
    );
  });

  it('PRU-PROP-REP-004 [V6-11] REP-hormiga (CF-04) hormiga: los hallazgos no comparten compras y no dependen del orden de las transacciones', () => {
    const compra = fc.record({
      comercio: fc.constantFrom('A', 'B', 'C'),
      total: fc.integer({ min: 100, max: 2000 }),
      dia: fc.integer({ min: 1, max: 15 }),
      categorias: fc.subarray(['P', 'Q', 'R', 'S'], { minLength: 1, maxLength: 2 }),
      corte: fc.integer({ min: 1, max: 1999 }),
    });
    fc.assert(
      fc.property(fc.array(compra, { maxLength: 40 }), (compras) => {
        const armar = (orden: readonly number[]) => {
          const libro = new Libro(['P', 'Q', 'R', 'S']);
          for (const n of orden) {
            const x = compras[n];
            if (x === undefined) continue;
            // Con dos categorías, la primera lleva `corte` (entre 1 y total − 1).
            const primera = Math.min(Math.max(1, x.corte), Math.max(1, x.total - 1));
            const partes: [string, number][] =
              x.categorias.length === 2
                ? [
                    [x.categorias[0] as string, primera],
                    [x.categorias[1] as string, x.total - primera],
                  ]
                : [[x.categorias[0] as string, x.total]];
            libro.movimiento(
              `t${n}`,
              `2027-04-${String(x.dia).padStart(2, '0')}`,
              'gasto',
              x.comercio,
              x.total,
              partes,
            );
          }
          return hormiga(libro.instantanea(), []);
        };
        const indices = compras.map((_, n) => n);
        const r = armar(indices);
        expect(armar([...indices].reverse())).toEqual(r);

        const pequenas = indices.filter((n) => c(compras[n]?.total ?? 0) <= HORMIGA_MONTO_MAX);
        const miembros = (clave: string) =>
          new Set(
            pequenas.filter((n) => {
              const x = compras[n];
              return clave.startsWith('comercio:')
                ? x?.comercio.toLowerCase() === clave.slice('comercio:'.length)
                : x?.categorias.includes(clave.slice('categoria:'.length)) === true;
            }),
          );
        const grupos = r.hallazgos.map((x) => miembros(x.clave));
        grupos.forEach((a, k) =>
          grupos.slice(k + 1).forEach((b) => expect([...a].some((n) => b.has(n))).toBe(false)),
        );
        expect(r.hallazgos.map((x) => x.total)).toEqual(
          [...r.hallazgos.map((x) => x.total)].sort((a, b) => b - a),
        );
      }),
      opciones,
    );
  });

  it('PRU-PROP-REP-004 [V6-11] REP-realidad (CF-04) realidad: el sugerido es un dólar entero y "te sobra" exige gasto en los tres períodos', () => {
    const periodo = fc.record({
      asignado: fc.integer({ min: 0, max: 30_000 }),
      gastado: fc.integer({ min: 0, max: 30_000 }),
    });
    fc.assert(
      fc.property(
        fc.array(periodo, { minLength: 3, maxLength: 3 }),
        fc.integer({ min: 0, max: 30_000 }),
        (previos, actual) => {
          const libro = new Libro(['c']);
          const inicios = ['2027-01-01', '2027-02-01', '2027-03-01', '2027-04-01'];
          [...previos.map((p) => p.asignado), actual].forEach((monto, k) =>
            libro.asignaciones.push({
              id: id(`a${k}`),
              categoriaId: id('c'),
              periodoInicio: f(inicios[k] as string),
              monto: c(monto),
            } as Asignacion),
          );
          previos.forEach((p, k) => {
            if (p.gastado > 0)
              libro.movimiento(
                `g${k}`,
                `${(inicios[k] as string).slice(0, 8)}05`,
                'gasto',
                'X',
                p.gastado,
                [['c', p.gastado]],
              );
          });
          const r = realidad(libro.instantanea());
          for (const h of r.hallazgos) {
            if (h.tipo !== 'realidad') continue;
            expect(h.sugerido % 100).toBe(0);
            expect(h.sugerido).toBeGreaterThanOrEqual(0);
            if (h.causa === 'sobra') expect(previos.every((p) => p.gastado > 0)).toBe(true);
          }
        },
      ),
      opciones,
    );
  });
});
