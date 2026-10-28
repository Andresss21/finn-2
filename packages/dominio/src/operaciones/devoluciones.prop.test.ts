import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type { ComandoDominio, Hechos, Instante, Uuid } from '../hechos';
import { fechaArb, hechosArb, montoArb } from '../pruebas/generadores';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const HOY = FechaLocal.desdeTexto('2027-06-30');
const INSTANTE = '2027-06-30T12:00:00.000Z' as Instante;
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
const ids = (p: string) => {
  let n = 0;
  return { siguiente: () => `${p}.${++n}` as Uuid };
};

/**
 * Unos hechos de `hechosArb` con una compra G de 1 a 3 líneas (a una categoría normal activa o por
 * cobrar a Ana) con efectivo o tarjeta, y de 1 a 6 devoluciones vinculadas a G con un reparto de 1
 * a 3 partes sobre sus líneas, en cuentas, fechas y montos cualesquiera.
 */
const casoArb = hechosArb(HOY).chain((h) => {
  const medios = h.cuentas.filter((k) => k.tipo === 'efectivo' || k.tipo === 'tarjeta');
  const normal = h.categorias.find((x) => x.clase === 'normal' && !x.archivada);
  return fc.record({
    h: fc.constant(h),
    medio: fc.constantFrom(...medios.map((k) => k.id), ...h.cuentas.map((k) => k.id)),
    compra: fc.record({
      fecha: fechaArb(HOY),
      lineas: fc.array(fc.record({ monto: montoArb(), aCategoria: fc.boolean() }), {
        minLength: 1,
        maxLength: 3,
      }),
    }),
    categoriaId: fc.constant(normal?.id ?? null),
    devoluciones: fc.array(
      fc.record({
        cuenta: fc.option(fc.constantFrom(...h.cuentas.map((k) => k.id)), { nil: undefined }),
        fecha: fechaArb(HOY),
        reparto: fc.array(fc.record({ linea: fc.nat(), monto: montoArb() }), {
          minLength: 1,
          maxLength: 3,
        }),
      }),
      { minLength: 1, maxLength: 6 },
    ),
  });
});

/** Σ de las devoluciones aplicadas a cada línea y a cada transacción. */
function devuelto(h: Hechos) {
  const m = new Map<string, Centavos>();
  const originales = new Map(h.lineas.map((l) => [l.id, l]));
  const devoluciones = new Set(
    h.transacciones.filter((t) => t.tipo === 'devolucion').map((t) => t.id),
  );
  for (const l of h.lineas) {
    const o = l.lineaOriginalId === null ? undefined : originales.get(l.lineaOriginalId);
    if (!devoluciones.has(l.transaccionId) || o === undefined) continue;
    for (const k of [o.id, o.transaccionId])
      m.set(k, Centavos.sumar(m.get(k) ?? Centavos.cero, l.monto));
  }
  return (k: string) => m.get(k) ?? Centavos.cero;
}

/** Inv. 10 y 11 (y la parte de inv. 9 que toca a las devoluciones) en los hechos. */
function inv10y11(h: Hechos) {
  const de = devuelto(h);
  for (const l of h.lineas) if (l.categoriaId !== null) expect(de(l.id) <= l.monto).toBe(true);
  for (const t of h.transacciones) expect(de(t.id) <= t.total).toBe(true);
  for (const x of calcular(h, HOY).porCobrar) expect(x.abierto >= 0).toBe(true);
}

describe('PRU-PROP-DEV', () => {
  it('PRU-PROP-DEV-101 [INV-10, INV-11, CB-02] inv. 10 y 11 OP-33 CH-27: después de toda devolución aceptada, Σ devoluciones de cada línea de categoría ≤ su monto y de cada transacción ≤ su total; la que los superaría se rechaza y no escribe nada, y ningún rechazo es una invariante violada', () => {
    fc.assert(
      fc.property(casoArb, ({ h, medio, compra, categoriaId, devoluciones }) => {
        const lineas = compra.lineas.map(({ monto, aCategoria }) => ({
          monto,
          destino: aCategoria && categoriaId !== null ? { categoriaId } : { deudorNuevo: 'Ana' },
        }));
        const gasto = {
          ...{ operacion: 'OP-20', id: 'G' as Uuid, instante: INSTANTE, ids: ids('G') },
          ...{ cuentaId: medio, fecha: compra.fecha, total: suma(lineas.map((l) => l.monto)) },
          lineas,
        } as unknown as ComandoDominio;
        const g = aplicar(h, gasto, HOY);
        fc.pre(g.ok);
        let actual = g.hechosNuevos;
        const propias = actual.lineas.filter((l) => l.transaccionId === 'G');
        const total = suma(propias.map((l) => l.monto));
        inv10y11(actual);
        devoluciones.forEach((x, n) => {
          const reparto = x.reparto.map((y) => ({
            lineaId: (propias[y.linea % propias.length] as (typeof propias)[number]).id,
            monto: y.monto,
          }));
          const comando = {
            ...{ operacion: 'OP-33', id: `D${n}` as Uuid, instante: INSTANTE, ids: ids(`D${n}`) },
            ...{
              transaccionOriginalId: 'G',
              fecha: x.fecha,
              total: suma(reparto.map((y) => y.monto)),
            },
            ...(x.cuenta !== undefined && { cuentaId: x.cuenta }),
            reparto,
          } as unknown as ComandoDominio;
          // La capacidad de cada línea antes del paso (01 OP-33a), con su reparto acumulado.
          const previo = devuelto(actual);
          const abiertos = new Map(
            calcular(actual, HOY).porCobrar.map((y) => [y.lineaId, y.abierto]),
          );
          const pedido = new Map<string, Centavos>();
          for (const y of reparto)
            pedido.set(y.lineaId, Centavos.sumar(pedido.get(y.lineaId) ?? Centavos.cero, y.monto));
          const excede = propias.some((l) => {
            const capacidad =
              l.categoriaId !== null
                ? Centavos.restar(l.monto, previo(l.id))
                : (abiertos.get(l.id) ?? Centavos.cero);
            return (pedido.get(l.id) ?? Centavos.cero) > capacidad;
          });
          const sobraTotal =
            suma(reparto.map((y) => y.monto)) > Centavos.restar(total, previo('G'));
          const foto = JSON.stringify(actual);
          const r = aplicar(actual, comando, HOY);
          if (sobraTotal || excede) {
            expect(r.ok).toBe(false);
            const codigo = r.ok ? '' : r.rechazos[0]?.codigo;
            const esperado = sobraTotal
              ? 'devolucion_mayor_que_total'
              : 'devolucion_mayor_que_linea';
            if (codigo === 'devolucion_mayor_que_total' || codigo === 'devolucion_mayor_que_linea')
              expect(codigo).toBe(esperado);
            expect(JSON.stringify(actual)).toBe(foto);
            return;
          }
          // Una devolución que pasa las precondiciones de OP-33 nunca rompe una invariante (CH-27).
          if (!r.ok) {
            expect(r.rechazos.map((y) => y.codigo)).not.toContain('invariante_violada');
            return; // otra precondición: fecha o cuenta
          }
          inv10y11(r.hechosNuevos);
          actual = r.hechosNuevos;
        });
      }),
      opciones,
    );
  }, 60_000);
});
