import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../../calculo/calcular';
import type { Hechos, Instantanea, Linea, Transaccion, Uuid } from '../../hechos';
import { hechosArb } from '../../pruebas/generadores';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { detalleCategoria } from '../detalle-categoria';
import { detalleLpa } from '../detalle-lpa';
import { SIN_COMERCIO } from './agrupacion';
import { datosBase } from './datos-base';
import { existiaEn } from './existia-en';
import { hormiga } from './hormiga';
import { patrimonio } from './patrimonio';
import { realidad } from './realidad';
import { ritmo } from './ritmo';
import { suscripciones } from './suscripciones';
import { tarjetas } from './tarjetas';
import { HORMIGA_MONTO_MAX, SUSC_PERIODOS } from './umbrales';

// 300 casos en PR (07 §1.1); FC_RUNS más alto en el nocturno. La semilla la fija vitest.config.ts.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};
const PLAZO = 60_000;

const HOYS = ['2027-04-15', '2027-09-15', '2027-10-25', '2027-12-10'];
const COMERCIOS: readonly (string | null)[] = [
  'Café Sol',
  ' café  SOL ',
  'Super X',
  null,
  'super x',
];

/** Gastos mensuales de "Netflix" (día 5, de febrero a octubre) con montos casi iguales (suscripción). */
function conComercios(
  h: Hechos,
  hoy: FechaLocal,
  asignados: readonly number[],
  base: number,
  variaciones: readonly number[],
): Hechos {
  let n = 0;
  const transacciones: Transaccion[] = h.transacciones.map((t, k) =>
    t.tipo === 'gasto'
      ? {
          ...t,
          comercio: COMERCIOS[(asignados[k % asignados.length] ?? 0) % COMERCIOS.length] ?? null,
        }
      : t,
  );
  const efectos = [...h.efectos];
  const lineas: Linea[] = [...h.lineas];
  const cuenta = h.cuentas.find((c) => c.tipo === 'efectivo');
  const categoria = h.categorias.find((c) => c.clase === 'normal');
  if (cuenta === undefined || categoria === undefined) return h;
  const id = (): Uuid => `00000000-0000-4000-9000-${(++n).toString(16).padStart(12, '0')}` as Uuid;
  const molde = h.transacciones[0];
  variaciones.forEach((v, k) => {
    const fecha = FechaLocal.desdePartes(2027, 2 + k, 5);
    if (molde === undefined || fecha > hoy) return;
    const monto = Centavos.desdeEntero(Math.round(base * (1 + v / 100)));
    const marca = `${fecha}T03:00:00.${String(k).padStart(3, '0')}Z` as Transaccion['claveOrden'];
    const tx: Transaccion = {
      ...molde,
      id: id(),
      tipo: 'gasto',
      fecha,
      horaRegistro: marca,
      claveOrden: marca,
      secuencia: String(900_000 + k) as Transaccion['secuencia'],
      comercio: k % 2 === 0 ? 'Netflix' : ' NETFLIX ',
      total: monto,
    };
    transacciones.push(tx);
    efectos.push({
      id: id(),
      transaccionId: tx.id,
      cuentaId: cuenta.id,
      monto: Centavos.negar(monto),
      interes: null,
      seguro: null,
      revision: tx.revision,
    });
    lineas.push({
      id: id(),
      transaccionId: tx.id,
      orden: 0,
      monto,
      categoriaId: categoria.id,
      deudorId: null,
      lineaOriginalId: null,
      revision: tx.revision,
    });
  });
  return { ...h, transacciones, efectos, lineas };
}

const caso = fc
  .constantFrom(...HOYS)
  .chain((texto) => {
    const hoy = FechaLocal.desdeTexto(texto);
    return fc.record({
      hoy: fc.constant(hoy),
      hechos: hechosArb(hoy),
      asignados: fc.array(fc.nat(100), { minLength: 1, maxLength: 12 }),
      base: fc.integer({ min: 500, max: 5000 }),
      variaciones: fc.array(fc.integer({ min: -5, max: 5 }), { minLength: 9, maxLength: 9 }),
    });
  })
  .map((k): Instantanea => {
    const hechos = conComercios(k.hechos, k.hoy, k.asignados, k.base, k.variaciones);
    return calcular(hechos, k.hoy);
  });

const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
const abs = (x: Centavos) => Centavos.max(x, Centavos.negar(x));
/** Promedio al centavo, mitad hacia arriba y simétrico en negativos. */
function promedio(xs: readonly Centavos[]): Centavos {
  const total = suma(xs);
  const p = Centavos.proporcionMitadArriba(abs(total), 1, xs.length);
  return total < 0 ? Centavos.negar(p) : p;
}
const medianaBaja = (xs: readonly number[]): number =>
  [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)] as number;

describe('PRU-PROP-REP', () => {
  it(
    'PRU-PROP-REP-101 REP-datos_base (CF-09) categoriasPorPeriodo coincide con el detalle de categoría (período, historial, sobregiros) y con "contra la realidad" (promedio de 3 períodos, CF-17)',
    () => {
      fc.assert(
        fc.property(caso, (i) => {
          const a = i.presupuesto.activo;
          const filas = [
            ...datosBase(i, { ventana: 'ultimos_12' }).categoriasPorPeriodo,
            ...datosBase(i, { ventana: 'actual' }).categoriasPorPeriodo,
          ];
          const de = (c: Uuid, periodo: FechaLocal) =>
            filas.find((x) => x.categoria.id === c && x.periodo === periodo);
          const normales = i.hechos.categorias.filter((c) => c.clase === 'normal');
          const cerrados = i.presupuesto.periodos.filter((p) => p.fin < a.inicio);

          for (const c of normales) {
            for (const p of [...cerrados, a]) {
              const d = detalleCategoria(i, c.id, { periodoInicio: p.inicio });
              const f = de(c.id, p.inicio);
              expect(f).toBeDefined();
              if (f === undefined) continue;
              expect(f.asignado).toBe(d.numeros.asignado);
              expect(f.gastado).toBe(d.numeros.gastado);
              expect(f.arrastre).toBe(d.numeros.arrastre);
              expect(f.disponible).toBe(d.numeros.disponible);
              expect(f.sobregiroTarjeta).toBe(d.sobregiro?.parteTarjeta ?? 0);
              expect(f.sobregiroDebito).toBe(d.sobregiro?.parteDebito ?? 0);
            }
            const d = detalleCategoria(i, c.id);
            for (const x of d.historial) {
              const f = de(c.id, x.periodo.inicio);
              expect([f?.asignado, f?.gastado, f?.disponible]).toEqual([
                x.asignado,
                x.gastado,
                x.disponible,
              ]);
            }
            if (d.historial.length > 0)
              expect(d.historialResumen.promedioGastado).toBe(
                promedio(
                  d.historial.map((x) => de(c.id, x.periodo.inicio)?.gastado ?? Centavos.cero),
                ),
              );
          }

          for (const r of realidad(i).categorias) {
            const previos = cerrados.filter((q) => existiaEn(i, r.categoria.id, q)).slice(-3);
            expect(r.periodos.map((x) => x.periodo)).toEqual(previos.map((q) => q.inicio));
            for (const x of r.periodos) {
              const f = de(r.categoria.id, x.periodo);
              expect([f?.asignado, f?.gastado]).toEqual([x.asignado, x.gastado]);
            }
            expect(r.promedioGastado).toBe(
              previos.length === 3
                ? promedio(
                    previos.map((q) => de(r.categoria.id, q.inicio)?.gastado ?? Centavos.cero),
                  )
                : null,
            );
          }
        }),
        opciones,
      );
    },
    PLAZO,
  );

  let detectadas = 0;
  it(
    'PRU-PROP-REP-102 REP-datos_base (CF-09) consumos coincide con ritmo (gasto variable), gastos hormiga (totales por categoría y por comercio) y suscripciones (mensual y día)',
    () => {
      fc.assert(
        fc.property(caso, (i) => {
          const h = i.hechos;
          const txs = new Map(h.transacciones.map((t) => [t.id, t]));
          const resueltas = new Set(
            h.ocurrencias_resueltas.flatMap((r) =>
              r.transaccionId !== null && r.estado !== 'omitida' ? [r.transaccionId] : [],
            ),
          );
          const actuales = datosBase(i, { ventana: 'actual' }).consumos;

          // Ritmo: el gasto variable de cada categoría es lo consumido en A, sin las resueltas.
          for (const r of ritmo(i).categorias)
            expect(r.gastoVariable).toBe(
              Centavos.max(
                Centavos.cero,
                suma(
                  actuales
                    .filter(
                      (x) =>
                        x.categoria.id === r.categoria.id &&
                        !(x.transaccionId !== undefined && resueltas.has(x.transaccionId)),
                    )
                    .map((x) => x.montoNeto),
                ),
              ),
            );

          // Hormiga: compras de gasto de hasta HORMIGA_MONTO_MAX, agrupadas igual que el reporte.
          const pequenos = actuales.filter((x) => {
            const t = x.transaccionId === undefined ? undefined : txs.get(x.transaccionId);
            return t?.tipo === 'gasto' && t.total <= HORMIGA_MONTO_MAX && !resueltas.has(t.id);
          });
          const grupos = new Map<string, { total: Centavos; compras: Set<Uuid> }>();
          for (const x of pequenos)
            for (const clave of [
              `categoria:${x.categoria.id}`,
              `comercio:${x.comercioNormalizado ?? SIN_COMERCIO}`,
            ]) {
              const g = grupos.get(clave) ?? { total: Centavos.cero, compras: new Set<Uuid>() };
              g.total = Centavos.sumar(g.total, x.montoNeto);
              g.compras.add(x.transaccionId as Uuid);
              grupos.set(clave, g);
            }
          const esperados = [...grupos].filter(([, g]) => g.compras.size >= 2);
          const dados = hormiga(i, []).grupos;
          expect(dados.map((g) => g.clave).sort()).toEqual(esperados.map(([c]) => c).sort());
          for (const g of dados) {
            expect(g.total).toBe(grupos.get(g.clave)?.total);
            expect(g.compras).toBe(grupos.get(g.clave)?.compras.size);
          }

          // Suscripciones: cada detectada sale de los cobros de su comercio en los 4 últimos cerrados.
          const s = suscripciones(i, []);
          const cerrados = i.presupuesto.periodos
            .filter((p) => p.fin < i.hoy)
            .slice(-SUSC_PERIODOS);
          expect(s.suficiente).toBe(cerrados.length === SUSC_PERIODOS);
          const delasVentana = datosBase(i, { ventana: 'ultimos_6' }).consumos.filter((x) =>
            cerrados.some((p) => p.inicio <= x.fecha && x.fecha <= p.fin),
          );
          for (const d of s.detectadas) {
            const porTx = new Map<Uuid, { total: number; dia: number }>();
            for (const x of delasVentana) {
              const t = x.transaccionId === undefined ? undefined : txs.get(x.transaccionId);
              if (t?.tipo !== 'gasto' || (x.comercioNormalizado ?? SIN_COMERCIO) !== d.clave)
                continue;
              const previo = porTx.get(t.id)?.total ?? 0;
              porTx.set(t.id, {
                total: previo + x.montoNeto,
                dia: FechaLocal.partes(t.fecha).dia,
              });
            }
            const filas = [...porTx.values()];
            expect(d.mensual).toBe(medianaBaja(filas.map((x) => x.total)));
            expect(d.dia).toBe(medianaBaja(filas.map((x) => x.dia)));
            detectadas += 1;
          }
        }),
        opciones,
      );
      // La propiedad no es vacía: el generador produce suscripciones que se detectan.
      expect(detectadas).toBeGreaterThan(0);
    },
    PLAZO,
  );

  it(
    'PRU-PROP-REP-103 REP-datos_base (CF-09) tarjetasPorPeriodo coincide con TarjetasDto.periodos (cargos, pagos, deuda al fin) y su Disponible de pago con el de la celda de pago',
    () => {
      fc.assert(
        fc.property(caso, (i) => {
          const sinTarjetas = i.hechos.tarjetas.length === 0;
          const filtros = [
            {},
            ...i.hechos.tarjetas.slice(0, 1).map((t) => ({ cuentaIds: [t.cuentaId] })),
          ];
          for (const filtro of filtros) {
            const parametros = { ...filtro, ventana: 'ultimos_6' } as const;
            const base = datosBase(i, parametros).tarjetasPorPeriodo;
            const reporte = tarjetas(i, parametros).tarjetas;
            expect(base.length).toBe(reporte.reduce((n, t) => n + t.periodos.length, 0));
            for (const t of reporte)
              for (const p of t.periodos) {
                const f = base.find(
                  (x) => x.tarjeta.id === t.tarjeta.id && x.periodo === p.periodo,
                );
                expect([f?.cargos, f?.pagos, f?.deudaAlFin]).toEqual([
                  p.cargos,
                  p.pagos,
                  p.deudaAlFin,
                ]);
                const celda = i.presupuesto.celdas.find(
                  (c) =>
                    c.clase === 'pago' &&
                    c.tarjetaId === t.tarjeta.id &&
                    c.periodo.inicio === p.periodo,
                );
                expect(f?.disponiblePago).toBe(celda?.disponible ?? 0);
              }
          }
          if (sinTarjetas) expect(datosBase(i).tarjetasPorPeriodo).toEqual([]);
        }),
        opciones,
      );
    },
    PLAZO,
  );

  it(
    'PRU-PROP-REP-104 REP-datos_base (CF-09) lpaAlCierre coincide con el historial del detalle de LPA en cada período cerrado de la ventana',
    () => {
      fc.assert(
        fc.property(
          caso,
          fc.constantFrom('ultimos_1', 'ultimos_3', 'ultimos_6', 'ultimos_12'),
          (i, ventana) => {
            const base = datosBase(i, { ventana }).lpaAlCierre;
            const n = Number(ventana.slice('ultimos_'.length));
            const historial = detalleLpa(i, 60).historial.slice(-n);
            expect(base).toEqual(
              historial.map((x) => ({ periodo: x.periodo.inicio, lpa: x.lpaAlCierre })),
            );
          },
        ),
        opciones,
      );
    },
    PLAZO,
  );

  it(
    'PRU-PROP-REP-105 REP-datos_base (CF-09) patrimonioAlCierre coincide con la serie del reporte patrimonio en cada período de la ventana, con y sin filtro de cuentas',
    () => {
      fc.assert(
        fc.property(
          caso,
          fc.constantFrom('actual', 'ultimos_3', 'ultimos_12'),
          fc.boolean(),
          (i, ventana, conFiltro) => {
            const cuentaIds = conFiltro ? i.hechos.cuentas.slice(0, 1).map((c) => c.id) : undefined;
            const filtro = { ventana, ...(cuentaIds === undefined ? {} : { cuentaIds }) } as const;
            expect(datosBase(i, filtro).patrimonioAlCierre).toEqual(
              patrimonio(i, filtro).serie.map((x) => ({ periodo: x.periodo, neto: x.neto })),
            );
          },
        ),
        opciones,
      );
    },
    PLAZO,
  );
});
