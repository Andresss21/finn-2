import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { ComandoDominio, Hechos, Instante, Uuid } from '../hechos';
import { hechosArb, montoArb } from '../pruebas/generadores';
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
const CON_LINEAS = new Set(['gasto', 'pago_tarjeta']);

/** Fechas de 2026-12-25 a 2027-07-02: algunas antes de toda apertura y algunas después de hoy. */
const fechaArb = fc
  .integer({ min: 0, max: 189 })
  .map((n) => FechaLocal.sumarDias(FechaLocal.desdeTexto('2026-12-25'), n));

/** Unos hechos de `hechosArb` y un alta de OP-20 a OP-23 u OP-27 sobre cuentas y categorías cualesquiera. */
const casoArb = hechosArb(HOY).chain((h) => {
  const cuenta = fc.constantFrom(...h.cuentas.map((k) => k.id));
  // Casi siempre del tipo que pide la operación, a veces cualquiera (cuenta_tipo_no_valido).
  const de = (tipo: string) => {
    const ids = h.cuentas.filter((k) => k.tipo === tipo).map((k) => k.id);
    return ids.length === 0
      ? cuenta
      : fc.oneof(
          { weight: 4, arbitrary: fc.constantFrom(...ids) },
          { weight: 1, arbitrary: cuenta },
        );
  };
  const [efectivo, tarjeta] = [de('efectivo'), de('tarjeta')];
  const categoria = fc.constantFrom(...h.categorias.map((x) => x.id));
  const destino = fc.oneof(
    categoria.map((categoriaId) => ({ categoriaId })),
    fc.constantFrom('Ana', 'ana', 'Beto').map((deudorNuevo) => ({ deudorNuevo })),
  );
  const lineas = fc.array(fc.record({ monto: montoArb(), destino }), {
    minLength: 1,
    maxLength: 3,
  });
  const comunes = { id: 'tx' as Uuid, instante: '2027-06-30T12:00:00.000Z' as Instante };
  const alta = fc.record({ fecha: fechaArb, total: montoArb(), ids: fc.constant(0) });
  const comando = fc.oneof(
    fc
      .record({ cuentaId: cuenta, lineas, descuadre: fc.constantFrom(0, 0, 0, 1) })
      .map(({ descuadre, ...x }) => ({
        operacion: 'OP-20',
        ...x,
        total: Centavos.sumar(
          x.lineas.map((l) => l.monto).reduce(Centavos.sumar),
          Centavos.desdeEntero(descuadre),
        ),
      })),
    fc.record({ operacion: fc.constant('OP-21'), cuentaId: efectivo }),
    fc.record({ operacion: fc.constant('OP-22'), origenId: efectivo, destinoId: efectivo }),
    fc.record({ operacion: fc.constant('OP-23'), origenId: efectivo, tarjetaId: tarjeta }),
    fc.record({
      operacion: fc.constant('OP-27'),
      modalidad: fc.constantFrom('avance', 'entrada', 'transferencia_deuda'),
      tarjetaId: tarjeta,
      cuentaId: efectivo,
      tarjetaDestinoId: tarjeta,
    }),
  );
  return fc
    .record({ h: fc.constant(h), alta, comando })
    .map(({ h: hechos, alta: a, comando: x }) => {
      let n = 0;
      const ids = { siguiente: () => `id${++n}` as Uuid };
      return { h: hechos, x: { ...comunes, ...a, ...x, ids } as unknown as ComandoDominio };
    });
});

/** La transacción `tx` de los hechos, con sus efectos y líneas. */
function alta(h: Hechos) {
  const t = h.transacciones.find((y) => y.id === 'tx');
  if (t === undefined) throw new Error('falta la transacción');
  return {
    t,
    efectos: h.efectos.filter((e) => e.transaccionId === t.id),
    lineas: h.lineas.filter((l) => l.transaccionId === t.id),
  };
}

describe('PRU-PROP-TX', () => {
  it('PRU-PROP-TX-101 [INV-06, INV-07, INV-08, INV-12] OP-20 OP-21 OP-22 OP-23 OP-27: toda alta aceptada tiene líneas que suman el total (y solo en los tipos con líneas), sin fecha, con destino válido, y una fecha entre la apertura de sus cuentas y hoy; lo que rompería eso se rechaza', () => {
    fc.assert(
      fc.property(casoArb, ({ h, x }) => {
        const r = aplicar(h, x, HOY);
        const comando = x as unknown as Record<string, unknown> & {
          fecha: FechaLocal;
          total: Centavos;
        };
        const cuentas = new Map(h.cuentas.map((k) => [k.id as string, k]));
        // Lo que una alta nunca puede dejar pasar.
        const lineas = (comando['lineas'] ?? []) as {
          monto: Centavos;
          destino: { categoriaId?: Uuid };
        }[];
        const suma = lineas.map((l) => l.monto).reduce(Centavos.sumar, Centavos.cero);
        const pago = lineas.some(
          (l) => h.categorias.find((c) => c.id === l.destino.categoriaId)?.clase === 'pago',
        );
        if (comando.fecha > HOY || (x.operacion === 'OP-20' && (suma !== comando.total || pago)))
          expect(r.ok).toBe(false);
        if (!r.ok) return;
        const { t, efectos, lineas: propias } = alta(r.hechosNuevos);
        // inv. 6: Σ líneas = total en los tipos con líneas; los demás no tienen.
        if (CON_LINEAS.has(t.tipo))
          expect(propias.map((l) => l.monto).reduce(Centavos.sumar, Centavos.cero)).toBe(t.total);
        else expect(propias).toEqual([]);
        expect(t.total).toBe(comando.total);
        // inv. 7: ninguna línea tiene fecha.
        for (const l of propias) expect(Object.keys(l)).not.toContain('fecha');
        // inv. 8: destino normal o por cobrar; las de un pago de tarjeta, a pago(t) de su tarjeta.
        for (const l of propias) {
          const c = r.hechosNuevos.categorias.find((y) => y.id === l.categoriaId);
          if (t.tipo === 'pago_tarjeta') expect(c?.tarjetaId).toBe(comando['tarjetaId']);
          else expect(c === undefined ? l.deudorId !== null : c.clase === 'normal').toBe(true);
        }
        // inv. 12: apertura de cada cuenta de sus efectos ≤ fecha ≤ hoy.
        expect(t.fecha <= HOY).toBe(true);
        for (const e of efectos) {
          const k = cuentas.get(e.cuentaId);
          expect(k !== undefined && k.fechaApertura <= t.fecha && !k.archivada).toBe(true);
        }
        expect(new Set(efectos.map((e) => e.cuentaId)).size).toBe(efectos.length);
      }),
      opciones,
    );
  }, 60_000);
});
