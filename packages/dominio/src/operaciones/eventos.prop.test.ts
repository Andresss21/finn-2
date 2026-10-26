import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { porCobrar } from '../calculo/por-cobrar';
import type { Condonacion, ComandoDominio, Hechos, Instante, Uuid } from '../hechos';
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

/** Un generador de ids con prefijo propio, para que no choquen entre comandos. */
const ids = (p: string) => {
  let n = 0;
  return { siguiente: () => `${p}.${++n}` as Uuid };
};

/**
 * Unos hechos de `hechosArb` con una compra G de 1 a 3 líneas por cobrar a Ana (con efectivo o
 * tarjeta), quizá una condonación sobre la primera, y de 1 a 6 cobros sobre líneas, cuentas,
 * fechas y montos cualesquiera.
 */
const casoArb = hechosArb(HOY).chain((h) => {
  const medios = h.cuentas.filter((k) => k.tipo === 'efectivo' || k.tipo === 'tarjeta');
  const cuenta = fc.constantFrom(...h.cuentas.map((k) => k.id));
  const medio = medios.length === 0 ? cuenta : fc.constantFrom(...medios.map((k) => k.id));
  const normal = h.categorias.find((x) => x.clase === 'normal' && !x.archivada);
  return fc.record({
    h: fc.constant(h),
    compra: fc.record({
      cuentaId: medio,
      fecha: fechaArb(HOY),
      montos: fc.array(montoArb(), { minLength: 1, maxLength: 3 }),
    }),
    condonacion:
      normal === undefined
        ? fc.constant(null)
        : fc.option(fc.double({ min: 0, max: 1, noNaN: true })),
    categoriaId: fc.constant(normal?.id ?? ('' as Uuid)),
    cobros: fc.array(
      fc.record({
        linea: fc.nat(),
        cuentaId: fc.oneof({ weight: 5, arbitrary: medio }, { weight: 1, arbitrary: cuenta }),
        fecha: fechaArb(HOY),
        total: montoArb(),
      }),
      { minLength: 1, maxLength: 6 },
    ),
  });
});

/** Inv. 9 en todas las líneas por cobrar de los hechos. */
function inv9(h: Hechos) {
  for (const x of calcular(h, HOY).porCobrar) {
    const resuelto = suma([x.restituido, x.condonado, x.devuelto]);
    expect(resuelto <= x.monto).toBe(true);
    expect(x.abierto >= 0).toBe(true);
    expect(x.abierto).toBe(Centavos.restar(x.monto, resuelto));
  }
}

describe('PRU-PROP-COBRO', () => {
  it('PRU-PROP-COBRO-101 [INV-09, CB-23] inv. 9 OP-31: después de todo cobro aceptado, restituido + condonado + devuelto ≤ monto de la línea y el saldo abierto ≥ 0; un cobro sin saldo abierto en su fecha se rechaza', () => {
    fc.assert(
      fc.property(casoArb, ({ h, compra, condonacion, categoriaId, cobros }) => {
        const lineas = compra.montos.map((monto) => ({ monto, destino: { deudorNuevo: 'Ana' } }));
        const gasto = {
          operacion: 'OP-20',
          id: 'G' as Uuid,
          instante: INSTANTE,
          ids: ids('G'),
          ...compra,
          total: suma(compra.montos),
          lineas,
        } as unknown as ComandoDominio;
        const g = aplicar(h, gasto, HOY);
        fc.pre(g.ok);
        if (!g.ok) return;
        let actual = g.hechosNuevos;
        const propias = actual.lineas.filter((l) => l.transaccionId === 'G');
        const [primera] = propias;
        if (condonacion !== null && primera !== undefined) {
          const monto = Centavos.desdeEntero(Math.floor(primera.monto * condonacion));
          const fila: Condonacion = {
            ...{ id: 'K' as Uuid, lineaId: primera.id, fecha: compra.fecha, monto },
            ...{ claveOrden: INSTANTE, secuencia: null, categoriaId, revision: null },
          };
          if (monto > 0) actual = { ...actual, condonaciones: [...actual.condonaciones, fila] };
        }
        inv9(actual);
        cobros.forEach((x, n) => {
          const linea = propias[x.linea % propias.length];
          if (linea === undefined) return;
          const comando = {
            operacion: 'OP-31',
            id: `C${n}` as Uuid,
            instante: INSTANTE,
            ids: ids(`C${n}`),
            lineaId: linea.id,
            cuentaId: x.cuentaId,
            fecha: x.fecha,
            total: x.total,
          } as unknown as ComandoDominio;
          const enFecha = porCobrar(actual, x.fecha).find((y) => y.lineaId === linea.id);
          const r = aplicar(actual, comando, HOY);
          const tipo = actual.cuentas.find((k) => k.id === x.cuentaId)?.tipo;
          if (enFecha !== undefined && enFecha.abierto <= 0) {
            expect(r.ok).toBe(false);
            if (tipo === 'efectivo' || tipo === 'tarjeta')
              expect(r.ok ? [] : r.rechazos.map((y) => y.codigo)).toEqual(['sin_saldo_abierto']);
          }
          if (!r.ok) return;
          expect(enFecha !== undefined && enFecha.abierto > 0).toBe(true);
          inv9(r.hechosNuevos);
          actual = r.hechosNuevos;
        });
      }),
      opciones,
    );
  }, 60_000);
});
