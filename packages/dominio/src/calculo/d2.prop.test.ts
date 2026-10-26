import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Uuid } from '../hechos';
import { hechosArb } from '../pruebas/generadores';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { asignado, repartoD2, type RepartoD2, trasladoA } from './d2';
import { aportes, type Consumo, consumos } from './devoluciones';
import { ciclo, type Periodo, periodoDe } from './periodos';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const semilla = Number(entorno?.['FC_SEED'] ?? '0');
const opciones = { numRuns: 300, seed: semilla };

const HOY = FechaLocal.desdeTexto('2027-12-31');
const suma = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);

/** Comparador propio del orden D2 (CH-14): (fecha, clave de orden, secuencia, orden de línea). */
function antes(a: Consumo, b: Consumo): number {
  if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
  if (a.claveOrden !== b.claveOrden) return a.claveOrden < b.claveOrden ? -1 : 1;
  const sa = BigInt(a.secuencia ?? '0');
  const sb = BigInt(b.secuencia ?? '0');
  if (sa !== sb) return sa < sb ? -1 : 1;
  return a.orden - b.orden;
}

const caso = fc.record({
  hechos: hechosArb(HOY),
  // Desorden de entrada, arrastre (≥ 0) y un ajuste de la asignación que puede volver F negativo.
  claves: fc.array(fc.nat(), { minLength: 40, maxLength: 40 }),
  arrastres: fc.array(fc.nat(60_000), { minLength: 1, maxLength: 80 }),
  ajustes: fc.array(fc.integer({ min: -60_000, max: 30_000 }), { minLength: 1, maxLength: 80 }),
});

describe('PRU-PROP-MOTOR', () => {
  it('PRU-PROP-MOTOR-103 [INV-28, INV-05] MOT-4.5: reparto D2 (01 §4.5): orden propio, partes no cubiertas en sufijo, 0 ≤ SobT ≤ sobregiro total y cada traslado resta y suma el mismo monto', () => {
    fc.assert(
      fc.property(caso, ({ hechos, claves, arrastres, ajustes }) => {
        const ci = ciclo(hechos.vigencias_ciclo);
        const ordenados = consumos(hechos, ci);
        // Entregados en un orden arbitrario: el reparto no puede depender del orden de llegada.
        const desordenados = ordenados
          .map((x, i) => [claves[i % claves.length] as number, i, x] as const)
          .sort(([a, i], [b, j]) => a - b || i - j)
          .map(([, , x]) => x);
        const ap = aportes(hechos, ci, () => Centavos.cero);
        const periodos = new Map<string, Periodo>();
        for (const x of ordenados)
          periodos.set(periodoDe(ci, x.fecha).inicio, periodoDe(ci, x.fecha));
        const normales = hechos.categorias.filter((x) => x.clase === 'normal');

        let celda = 0;
        const porPeriodo = new Map<string, RepartoD2[]>();
        for (const p of periodos.values())
          for (const cat of normales) {
            const n = celda++;
            const arrastre = Centavos.desdeEntero(arrastres[n % arrastres.length] as number);
            const asig = Centavos.sumar(
              asignado(hechos.asignaciones, cat.id, p),
              Centavos.desdeEntero(ajustes[n % ajustes.length] as number),
            );
            const r = repartoD2({
              categoriaId: cat.id,
              periodo: p,
              consumos: desordenados,
              aportes: ap,
              arrastre,
              asignado: asig,
            });
            porPeriodo.set(p.inicio, [...(porPeriodo.get(p.inicio) ?? []), r]);

            // Oráculo: consumos de c en p por el comparador propio y el fondo repartido en ese orden.
            const esperados = ordenados
              .filter((x) => x.categoriaId === cat.id && p.inicio <= x.fecha && x.fecha <= p.fin)
              .sort(antes);
            expect(r.partes.map((x) => x.consumo.id)).toEqual(esperados.map((x) => x.id));
            let restante = r.fondo as number;
            for (const [i, x] of r.partes.entries()) {
              const m = (esperados[i] as Consumo).neto as number;
              const cubierto = Math.max(0, Math.min(m, restante));
              restante -= cubierto;
              expect([x.cubierto, x.noCubierto]).toEqual([cubierto, m - cubierto]);
            }

            // Las partes no cubiertas son un sufijo: tras el primer faltante, nada más se cubre.
            const primero = r.partes.findIndex((x) => x.noCubierto > 0);
            if (primero >= 0)
              expect(r.partes.slice(primero + 1).every((x) => x.cubierto === 0)).toBe(true);

            // inv. 28 y paso 7: 0 ≤ SobT ≤ máx(0, −Disp) y SobT + SobD = máx(0, −Disp).
            const sobregiro = Math.max(0, Centavos.negar(r.disponible));
            const sigma = suma(r.partes.map((x) => x.consumo.neto));
            expect(r.disponible).toBe(r.fondo - sigma);
            expect(r.sobT).toBeGreaterThanOrEqual(0);
            expect(r.sobT).toBeLessThanOrEqual(sobregiro);
            expect(r.sobD).toBeGreaterThanOrEqual(0);
            expect(r.sobT + r.sobD).toBe(sobregiro);
            const conTarjeta = r.partes.filter((x) => x.consumo.tarjetaId !== null);
            expect(r.sobT).toBe(suma(conTarjeta.map((x) => x.noCubierto)));

            // inv. 5: lo trasladado sale de c una sola vez; nunca más que lo cubierto con tarjeta.
            expect(suma([...r.traslados.values()])).toBe(suma(conTarjeta.map((x) => x.cubierto)));
            expect(suma(r.partes.map((x) => x.cubierto))).toBeLessThanOrEqual(Math.max(0, r.fondo));
          }

        // inv. 5: Σ_c Tr(c, p, t) llega a pago(t) por el mismo monto que salió de las categorías.
        for (const [inicio, rs] of porPeriodo) {
          const p = periodos.get(inicio) as Periodo;
          const salio = new Map<Uuid, number>();
          for (const r of rs)
            for (const x of r.partes)
              if (x.consumo.tarjetaId !== null)
                salio.set(x.consumo.tarjetaId, (salio.get(x.consumo.tarjetaId) ?? 0) + x.cubierto);
          for (const t of hechos.tarjetas)
            expect(trasladoA(rs, t.cuentaId, p)).toBe(salio.get(t.cuentaId) ?? 0);
        }
      }),
      opciones,
    );
  });
});
