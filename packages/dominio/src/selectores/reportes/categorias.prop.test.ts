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
import { hechosArb } from '../../pruebas/generadores';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { categorias, PORCIONES_DE_LA_DONA } from './categorias';
import type { Ventana } from './comunes';

// 300 casos en PR (07 §1.1); FC_RUNS más alto en el nocturno. La semilla la fija vitest.config.ts.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const HOY = FechaLocal.desdeTexto('2027-04-15');
const id = (t: string) => t as Uuid;
const sumar = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * Un período mensual (día 1) con una categoría por monto: con monto > 0, un gasto en efectivo el 2 de abril; con 0, solo
 * una asignación (tiene actividad y gastado 0, va con las de devolución neta). Así hay más de 8 categorías con gasto.
 */
function libro(montos: readonly number[]): Hechos {
  const categoriasH = montos.map(
    (_, k) =>
      ({
        id: id(`cat-${String(k).padStart(2, '0')}`),
        grupoId: id('g'),
        nombre: `Categoría ${k}`,
        orden: k,
        clase: 'normal',
        tarjetaId: null,
        archivada: false,
      }) as Categoria,
  );
  const gastos = montos.flatMap((monto, k) => (monto > 0 ? [{ monto, k }] : []));
  return {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [{ id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo' } as Cuenta],
    tarjetas: [],
    prestamos: [],
    inversiones: [],
    grupos: [{ id: id('g'), nombre: 'Grupo', orden: 1, archivado: false } as Grupo],
    categorias: categoriasH,
    asignaciones: montos.flatMap((monto, k) =>
      monto > 0
        ? []
        : [
            {
              id: id(`asig-${k}`),
              categoriaId: id(`cat-${String(k).padStart(2, '0')}`),
              periodoInicio: FechaLocal.desdeTexto('2027-04-01'),
              monto: Centavos.desdeEntero(1000),
            } as Asignacion,
          ],
    ),
    deudores: [],
    transacciones: gastos.map(
      ({ monto, k }, n) =>
        ({
          id: id(`tx-${k}`),
          tipo: 'gasto',
          fecha: FechaLocal.desdeTexto('2027-04-02'),
          claveOrden: '2027-04-02T12:00:00.000Z',
          secuencia: String(n + 1),
          estadoBancario: 'confirmada',
          comercio: null,
          total: Centavos.desdeEntero(monto),
          lineaCobradaId: null,
        }) as Transaccion,
    ),
    efectos: gastos.map(
      ({ monto, k }) =>
        ({
          id: id(`ef-${k}`),
          transaccionId: id(`tx-${k}`),
          cuentaId: id('ef'),
          monto: Centavos.desdeEntero(-monto),
          interes: null,
          seguro: null,
        }) as Efecto,
    ),
    lineas: gastos.map(
      ({ monto, k }) =>
        ({
          id: id(`ln-${k}`),
          transaccionId: id(`tx-${k}`),
          orden: 1,
          monto: Centavos.desdeEntero(monto),
          categoriaId: id(`cat-${String(k).padStart(2, '0')}`),
          deudorId: null,
          lineaOriginalId: null,
        }) as Linea,
    ),
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
}

/** El total es la suma de las porciones y «Otras» es lo que no cabe en las 8 primeras; las porciones suman 10.000. */
function cuadra(r: ReturnType<typeof categorias>) {
  const gastados = r.categorias.map((x) => x.gastado);
  expect(r.total).toBe(sumar(gastados));
  expect(r.montoOtras).toBe(sumar(gastados.slice(PORCIONES_DE_LA_DONA)));
  expect(r.total - r.montoOtras).toBe(sumar(gastados.slice(0, PORCIONES_DE_LA_DONA)));
  expect(r.montoOtras >= 0 && r.montoOtras <= r.total).toBe(true);
  expect(r.categorias.every((x) => x.gastado > 0)).toBe(true);
  expect(sumar(r.categorias.map((x) => x.porcentaje))).toBe(r.categorias.length === 0 ? 0 : 10_000);
  if (r.categorias.length <= PORCIONES_DE_LA_DONA) expect(r.montoOtras).toBe(Centavos.cero);
}

describe('PRU-PROP-REP', () => {
  it('PRU-PROP-REP-150 [FT-60] REP-categorias (04 §6.9.2, CH-177): `total` es la suma de los gastado positivos de todas las porciones, «Otras» incluida, y `montoOtras` la de las que siguen a las 8 primeras', () => {
    // Hasta 14 categorías, algunas sin gasto: con más de 8 con gasto hay «Otras».
    fc.assert(
      fc.property(fc.array(fc.nat(500_000), { minLength: 0, maxLength: 14 }), (montos) => {
        const r = categorias(calcular(libro(montos), HOY));
        cuadra(r);
        expect(r.total).toBe(sumar(montos));
        expect(r.categorias.length).toBe(montos.filter((x) => x > 0).length);
      }),
      opciones,
    );
    // Hechos generados (devoluciones, tarjetas, cobros): las mismas igualdades en cada ventana.
    fc.assert(
      fc.property(
        hechosArb(HOY),
        fc.constantFrom<Ventana>('actual', 'ultimos_3', 'ultimos_12'),
        (h, ventana) => {
          cuadra(categorias(calcular(h, HOY), { ventana }));
        },
      ),
      opciones,
    );
  });
});
