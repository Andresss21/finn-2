import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Asignacion, Categoria, Meta, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { presupuesto } from './disponible';
import { evaluarMeta, fechaObjetivo } from './metas';
import { ciclo, periodoDe, periodosEntre } from './periodos';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1) y
// FC_RUNS=2000 en local.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const CREACION = FechaLocal.desdeTexto('2027-01-10');
const CAT = 'ahorro' as Uuid;

/** Una meta de ahorro, un ciclo y lo que ya había en la categoría al empezar (arrastre). */
const casoArb = fc.record({
  dia: fc.integer({ min: 1, max: 31 }),
  tipo: fc.constantFrom<'anual' | 'para_fecha'>('anual', 'para_fecha'),
  // FO de 0 a 700 días después de la creación (para una fecha) o la fecha implícita (anual).
  dias: fc.option(fc.integer({ min: 0, max: 700 }), { nil: undefined }),
  monto: fc.integer({ min: 1, max: 5_000_000 }).map(Centavos.desdeEntero),
  previo: fc.integer({ min: 0, max: 6_000_000 }).map(Centavos.desdeEntero),
});

describe('PRU-PROP-META', () => {
  it('PRU-PROP-META-101 MOT-4.12: en una meta de ahorro (anual o para una fecha), asignar en cada período restante su pedido ⌈máx(0, monto − Base) / n⌉ deja Disponible = máx(monto, lo previo) en el período de la fecha objetivo: la suma de los pedidos alcanza el monto sin pasarse (techo de 01 §0.4)', () => {
    fc.assert(
      fc.property(casoArb, ({ dia, tipo, dias, monto, previo }) => {
        const c = ciclo([{ diaInicio: dia, rigeDesde: null }]);
        const fo =
          tipo === 'para_fecha' || dias !== undefined
            ? FechaLocal.sumarDias(CREACION, dias ?? 0)
            : null;
        const meta = {
          id: 'meta' as Uuid,
          categoriaId: CAT,
          tipo,
          modo: null,
          monto,
          fechaObjetivo: fo,
          fechaCreacion: CREACION,
          revision: null,
        } as Meta;
        const primero = periodoDe(c, CREACION);
        const objetivo = fechaObjetivo(meta, primero);
        const restantes = periodosEntre(c, primero.inicio, objetivo);
        const anterior = periodoDe(c, FechaLocal.sumarDias(primero.inicio, -1));
        const asignaciones: Asignacion[] = [
          {
            id: 'previo' as Uuid,
            categoriaId: CAT,
            periodoInicio: anterior.inicio,
            monto: previo,
          } as Asignacion,
        ];
        const hechos = {
          cuentas: [],
          transacciones: [],
          efectos: [],
          lineas: [],
          condonaciones: [],
          categorias: [{ id: CAT, clase: 'normal', tarjetaId: null } as Categoria],
          asignaciones,
        };
        let pedidos = Centavos.cero;
        let disponible = Centavos.cero;
        restantes.forEach((p, k) => {
          const b = presupuesto(hechos, c, p.inicio);
          const e = evaluarMeta(meta, { id: CAT, archivada: false }, b, c, p.inicio);
          if (e === null) throw new Error('la meta no se evaluó');
          // n(p) baja de a uno hasta 1 en el período de la FO.
          expect(e.periodosRestantes).toBe(restantes.length - k);
          // Nunca pide más de lo que falta.
          expect(e.pedido).toBeLessThanOrEqual(
            Centavos.max(Centavos.cero, Centavos.restar(monto, e.base)),
          );
          pedidos = Centavos.sumar(pedidos, e.pedido);
          asignaciones.push({
            id: `a${k}` as Uuid,
            categoriaId: CAT,
            periodoInicio: p.inicio,
            monto: e.pedido,
          } as Asignacion);
          disponible = Centavos.sumar(e.base, e.pedido);
        });
        expect(pedidos).toBe(Centavos.max(Centavos.cero, Centavos.restar(monto, previo)));
        expect(disponible).toBe(Centavos.max(monto, previo));
      }),
      opciones,
    );
  });
});
