import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Hechos, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { fechaArb, hechosArb, montoArb } from './generadores';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = { numRuns: 300, seed: Number(entorno?.['FC_SEED'] ?? '0') };

const FIN_2027 = FechaLocal.desdePartes(2027, 12, 31);
const INICIO_2027 = FechaLocal.desdePartes(2027, 1, 1);
// `hoy` de cada caso: cualquier fecha de 2027, también la del primer día.
const hoyArb = fechaArb(FIN_2027);

const suma = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

function repetidos(claves: readonly string[]): number {
  return claves.length - new Set(claves).size;
}

function comprobarHechos(h: Hechos, hoy: FechaLocal): void {
  const apertura = FechaLocal.comparar(INICIO_2027, hoy) <= 0 ? INICIO_2027 : hoy;

  // Inv. 12: apertura ≤ fecha ≤ hoy.
  for (const c of h.cuentas)
    expect(FechaLocal.comparar(c.fechaApertura, hoy)).toBeLessThanOrEqual(0);
  for (const t of h.transacciones) {
    expect(FechaLocal.comparar(t.fecha, hoy)).toBeLessThanOrEqual(0);
    expect(FechaLocal.comparar(t.fecha, apertura)).toBeGreaterThanOrEqual(0);
    expect(t.claveOrden.startsWith(t.fecha)).toBe(true);
  }

  // CB-28: ningún monto ≤ 0 (los efectos llevan signo, pero nunca valen 0).
  expect(h.transacciones.every((t) => t.total > 0)).toBe(true);
  expect(h.lineas.every((l) => l.monto > 0)).toBe(true);
  expect(h.asignaciones.every((a) => a.monto > 0)).toBe(true);
  expect(h.efectos.every((e) => e.monto !== 0)).toBe(true);

  // Inv. 6: Σ líneas = total; el ingreso no tiene líneas.
  for (const t of h.transacciones) {
    const propias = h.lineas.filter((l) => l.transaccionId === t.id);
    if (t.tipo === 'ingreso') expect(propias).toEqual([]);
    else expect(suma(propias.map((l) => l.monto))).toBe(t.total);
  }

  // DM-2: una asignación por categoría y período, con categoría existente y período ya iniciado.
  const categorias = new Set(h.categorias.map((c) => c.id));
  expect(repetidos(h.asignaciones.map((a) => `${a.categoriaId}|${a.periodoInicio}`))).toBe(0);
  for (const a of h.asignaciones) {
    expect(categorias.has(a.categoriaId)).toBe(true);
    expect(FechaLocal.comparar(a.periodoInicio, hoy)).toBeLessThanOrEqual(0);
    expect(FechaLocal.partes(a.periodoInicio).dia).toBe(21);
  }

  // CB-21: claves de orden únicas y secuencia creciente con (fecha, clave de orden).
  expect(repetidos(h.transacciones.map((t) => t.claveOrden))).toBe(0);
  const porOrden = [...h.transacciones].sort(
    (a, b) => FechaLocal.comparar(a.fecha, b.fecha) || (a.claveOrden < b.claveOrden ? -1 : 1),
  );
  expect(porOrden.map((t) => Number(t.secuencia))).toEqual(
    [...porOrden.map((t) => Number(t.secuencia))].sort((a, b) => a - b),
  );
  expect(repetidos(h.transacciones.map((t) => t.secuencia ?? ''))).toBe(0);

  // Inv. 22: una categoría de pago por tarjeta y viceversa.
  const pagos = h.categorias.filter((c) => c.clase === 'pago');
  expect(pagos.map((c) => c.tarjetaId).sort()).toEqual(h.tarjetas.map((t) => t.cuentaId).sort());

  // Referencias: cada efecto y cada línea apuntan a filas que existen.
  const cuentas = new Set(h.cuentas.map((c) => c.id));
  const transacciones = new Set(h.transacciones.map((t) => t.id));
  for (const e of h.efectos) {
    expect(cuentas.has(e.cuentaId) && transacciones.has(e.transaccionId)).toBe(true);
  }
  for (const l of h.lineas) {
    expect(transacciones.has(l.transaccionId) && categorias.has(l.categoriaId as Uuid)).toBe(true);
  }

  // Los pagos de tarjeta suman 0 entre sus dos efectos y sus líneas van a la categoría de pago.
  for (const t of h.transacciones.filter((x) => x.tipo === 'pago_tarjeta')) {
    const efectos = h.efectos.filter((e) => e.transaccionId === t.id);
    expect(suma(efectos.map((e) => e.monto))).toBe(0);
    for (const l of h.lineas.filter((x) => x.transaccionId === t.id)) {
      expect(pagos.some((p) => p.id === l.categoriaId)).toBe(true);
    }
  }

  // Los ids de todas las filas son únicos.
  const ids = [
    ...h.vigencias_ciclo,
    ...h.cuentas,
    ...h.grupos,
    ...h.categorias,
    ...h.asignaciones,
    ...h.transacciones,
    ...h.efectos,
    ...h.lineas,
  ].map((f) => f.id);
  expect(repetidos(ids)).toBe(0);
}

describe('PRU-PROP-MOTOR', () => {
  it('PRU-PROP-MOTOR-101 [GEN-base, 07 §12.5, inv. 6, inv. 12, DM-2, CB-21, CB-28] fechaArb, montoArb y hechosArb respetan sus restricciones', () => {
    // fechaArb: de 2027, nunca posterior a hoy.
    fc.assert(
      fc.property(
        hoyArb.chain((hoy) => fechaArb(hoy).map((f) => ({ f, hoy }))),
        ({ f, hoy }) => {
          expect(FechaLocal.desdeTexto(f)).toBe(f);
          expect(FechaLocal.comparar(f, hoy)).toBeLessThanOrEqual(0);
          expect(FechaLocal.comparar(f, INICIO_2027)).toBeGreaterThanOrEqual(0);
        },
      ),
      opciones,
    );
    // Antes de 2027 el rango se reduce a `hoy`.
    const antes = FechaLocal.desdePartes(2026, 6, 30);
    fc.assert(
      fc.property(fechaArb(antes), (f) => f === antes),
      opciones,
    );

    // montoArb: de 1 a 60.000, enteros, con los cuatro bordes presentes.
    const montos = fc.sample(montoArb(), { ...opciones, numRuns: 1000 });
    for (const m of montos) {
      expect(Number.isInteger(m) && m > 0 && m <= 60_000).toBe(true);
    }
    for (const borde of [1, 99, 100, 9999]) expect(montos).toContain(Centavos.desdeEntero(borde));

    // hechosArb: hechos válidos para cualquier `hoy`.
    fc.assert(
      fc.property(
        hoyArb.chain((hoy) => hechosArb(hoy).map((h) => ({ h, hoy }))),
        ({ h, hoy }) => {
          comprobarHechos(h, hoy);
        },
      ),
      opciones,
    );
    fc.assert(
      fc.property(hechosArb(antes), (h) => {
        comprobarHechos(h, antes);
      }),
      opciones,
    );
  });

  it('PRU-PROP-MOTOR-101 [GEN-base, 07 §12.5] hechosArb produce de todo: pagos, devoluciones, gastos de varias líneas y asignaciones', () => {
    const muestra = fc.sample(hechosArb(FIN_2027), { ...opciones, numRuns: 300 });
    const tipos = new Set(muestra.flatMap((h) => h.transacciones.map((t) => t.tipo)));
    expect([...tipos].sort()).toEqual(['devolucion', 'gasto', 'ingreso', 'pago_tarjeta']);
    expect(muestra.some((h) => h.asignaciones.length > 0)).toBe(true);
    expect(muestra.some((h) => h.tarjetas.length === 2)).toBe(true);
    const variasLineas = muestra.some((h) =>
      h.transacciones.some((t) => h.lineas.filter((l) => l.transaccionId === t.id).length > 1),
    );
    expect(variasLineas).toBe(true);
  });
});
