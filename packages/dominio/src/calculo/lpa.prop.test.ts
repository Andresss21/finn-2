import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type {
  BigintTexto,
  Condonacion,
  Efecto,
  Hechos,
  Instante,
  Linea,
  Transaccion,
  Uuid,
} from '../hechos';
import { fechaArb, hechosArb, montoArb } from '../pruebas/generadores';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { presupuesto } from './disponible';
import { listoParaAsignar, lpaAlCierre } from './lpa';
import { ciclo } from './periodos';
import { pagosImplicitos, porCobrar } from './por-cobrar';
import { deuda, saldo, saldoAl } from './saldos';
import { sobregiroConTarjetaDelActivo } from './sobregiros';
import { estadoDeTarjeta } from './tarjetas';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1) y
// FC_RUNS=2000 en local.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const HOY = FechaLocal.desdeTexto('2027-12-31');

/** Un evento sobre una línea por cobrar (01 §4.10), a `dias` de la compra. */
interface Evento {
  readonly linea: number;
  readonly tipo: 'cobro' | 'condonacion' | 'devolucion';
  readonly dias: number;
  readonly monto: Centavos;
  readonly cuenta: number;
  readonly categoria: number;
}

const eventoArb: fc.Arbitrary<Evento> = fc.record({
  linea: fc.nat(1000),
  tipo: fc.constantFrom<Evento['tipo']>('cobro', 'cobro', 'condonacion', 'devolucion'),
  dias: fc.nat(70),
  monto: montoArb(),
  cuenta: fc.nat(1000),
  categoria: fc.nat(1000),
});

/**
 * Extiende `hechosArb` con por cobrar: algunas líneas de gasto pasan a un deudor y reciben cobros en
 * cualquier cuenta de efectivo o tarjeta, condonaciones y devoluciones a la cuenta de la compra, con
 * K y X ≤ abierto en su momento (inv. 9) y fecha entre la compra y HOY (inv. 12).
 */
function conPorCobrar(h: Hechos, elegidas: readonly number[], eventos: readonly Evento[]): Hechos {
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const deGasto = h.lineas.filter((l) => txs.get(l.transaccionId)?.tipo === 'gasto');
  if (deGasto.length === 0) return h;
  const deudor = '00000000-0000-4000-9000-000000000001' as Uuid;
  const ids = new Set(elegidas.map((i) => (deGasto[i % deGasto.length] as Linea).id));
  const lineas: Linea[] = h.lineas.map((l) =>
    ids.has(l.id) ? { ...l, categoriaId: null, deudorId: deudor } : l,
  );
  const porCobrarIds = [...ids];
  if (porCobrarIds.length === 0) return h;

  const cuentas = h.cuentas.filter((k) => k.tipo === 'efectivo' || k.tipo === 'tarjeta');
  const normales = h.categorias.filter((x) => x.clase === 'normal');
  const cuentaDe = new Map(h.efectos.map((e) => [e.transaccionId, e.cuentaId]));
  const transacciones: Transaccion[] = [...h.transacciones];
  const efectos: Efecto[] = [...h.efectos];
  const condonaciones: Condonacion[] = [];
  const abierto = new Map(lineas.filter((l) => ids.has(l.id)).map((l) => [l.id, l.monto]));
  let n = 0;
  const planes = eventos
    .map((e) => {
      const linea = lineas.find(
        (l) => l.id === porCobrarIds[e.linea % porCobrarIds.length],
      ) as Linea;
      const compra = txs.get(linea.transaccionId) as Transaccion;
      const fecha = FechaLocal.sumarDias(compra.fecha, e.dias);
      return { ...e, linea, compra, fecha: fecha > HOY ? HOY : fecha };
    })
    .sort((a, b) => FechaLocal.comparar(a.fecha, b.fecha));
  for (const e of planes) {
    n += 1;
    const uuid = `00000000-0000-4000-9000-${(1000 + n).toString(16).padStart(12, '0')}` as Uuid;
    const marca = {
      fecha: e.fecha,
      claveOrden: `${e.fecha}T23:59:59.${String(n).padStart(3, '0')}Z` as Instante,
      secuencia: String(100_000 + n) as BigintTexto,
      revision: null,
    };
    const previo = abierto.get(e.linea.id) as Centavos;
    const monto = e.tipo === 'cobro' ? e.monto : Centavos.min(e.monto, previo);
    if (monto <= 0) continue;
    if (e.tipo === 'condonacion') {
      const categoria = normales[e.categoria % normales.length];
      if (categoria === undefined) continue;
      condonaciones.push({
        id: uuid,
        lineaId: e.linea.id,
        monto,
        categoriaId: categoria.id,
        ...marca,
      });
      abierto.set(e.linea.id, Centavos.restar(previo, monto));
      continue;
    }
    const cuenta =
      e.tipo === 'cobro'
        ? (cuentas[e.cuenta % cuentas.length] as (typeof cuentas)[number]).id
        : (cuentaDe.get(e.compra.id) as Uuid);
    transacciones.push({
      ...e.compra,
      ...marca,
      id: uuid,
      tipo: e.tipo,
      horaRegistro: marca.claveOrden,
      total: monto,
      lineaCobradaId: e.tipo === 'cobro' ? e.linea.id : null,
    });
    efectos.push({
      id: `${uuid}e` as Uuid,
      transaccionId: uuid,
      cuentaId: cuenta,
      monto,
      interes: null,
      seguro: null,
      revision: null,
    });
    if (e.tipo === 'devolucion') {
      lineas.push({
        ...e.linea,
        id: `${uuid}l` as Uuid,
        transaccionId: uuid,
        orden: 0,
        monto,
        lineaOriginalId: e.linea.id,
      });
      abierto.set(e.linea.id, Centavos.restar(previo, monto));
    } else abierto.set(e.linea.id, Centavos.max(Centavos.cero, Centavos.restar(previo, monto)));
  }
  return {
    ...h,
    deudores: [{ id: deudor, nombre: 'Ana', revision: null }],
    transacciones,
    efectos,
    lineas,
    condonaciones,
  };
}

/** Los hechos con fecha ≤ hoy (inv. 12); las asignaciones se quedan: las posteriores son futuras. */
function hasta(h: Hechos, hoy: FechaLocal): Hechos {
  const transacciones = h.transacciones.filter((t) => t.fecha <= hoy);
  const ids = new Set(transacciones.map((t) => t.id));
  return {
    ...h,
    transacciones,
    efectos: h.efectos.filter((e) => ids.has(e.transaccionId)),
    lineas: h.lineas.filter((l) => ids.has(l.transaccionId)),
    condonaciones: h.condonaciones.filter((x) => x.fecha <= hoy),
  };
}

const caso = fc.record({
  hechos: hechosArb(HOY),
  hoy: fechaArb(HOY),
  elegidas: fc.array(fc.nat(1000), { maxLength: 3 }),
  eventos: fc.array(eventoArb, { maxLength: 8 }),
});

describe('PRU-PROP-MOTOR', () => {
  it('PRU-PROP-MOTOR-104 [INV-01, INV-02, INV-03] identidad de saldo, deuda sin respaldo y S(t) = 0 o RE(t) = 0 (01 §6, §4.15), con por cobrar y en todo período: cualquier hoy y la comprobación de LPA al cierre de cada período hasta el activo', () => {
    fc.assert(
      fc.property(caso, ({ hechos, hoy, elegidas, eventos }) => {
        const h = hasta(conPorCobrar(hechos, elegidas, eventos), hoy);
        const ci = ciclo(h.vigencias_ciclo);
        const cobros = porCobrar(h);
        const b = presupuesto(h, ci, hoy, pagosImplicitos(cobros));
        const lpa = listoParaAsignar(h, b, cobros);
        const efectivo = h.cuentas.filter((k) => k.tipo === 'efectivo');
        const delActivo = b.celdas.filter((x) => x.periodo.inicio === b.activo.inicio);

        // Inv. 1: Σ efectivo = LPA + Σ_c Disp(c, A) + Σ asignaciones futuras + SobTA.
        const sumaEfectivo = efectivo.reduce((s, k) => s + saldo(h, k.id), 0);
        const sumaDisp = delActivo.reduce((s, x) => s + x.disponible, 0);
        const futuras = h.asignaciones
          .filter((a) => a.periodoInicio > b.activo.inicio)
          .reduce((s, a) => s + a.monto, 0);
        expect(sumaEfectivo).toBe(lpa.total + sumaDisp + futuras + sobregiroConTarjetaDelActivo(b));

        // Inv. 2 y 3: S y RE con Disp(pago(t), A), su descomposición y S = 0 o RE = 0.
        for (const t of h.cuentas.filter((k) => k.tipo === 'tarjeta')) {
          const x = estadoDeTarjeta(h, b, t.id);
          const pago = delActivo.find((y) => y.clase === 'pago' && y.tarjetaId === t.id);
          const r = Math.max(0, pago?.disponible ?? Number.NaN);
          expect(x.sinRespaldo).toBe(Math.max(0, deuda(h, t.id) - r));
          expect(x.reservaExcedente).toBe(Math.max(0, r - deuda(h, t.id)));
          expect(x.deuda).toBe(x.reservado + x.sinRespaldo - x.reservaExcedente);
          expect(Math.min(x.sinRespaldo, x.reservaExcedente)).toBe(0);
        }

        // Cada período hasta el activo: Σ efectivo al fin(p) = LPA_p + Σ_c Arr(c, p + 1) (§4.9).
        for (const p of b.periodos.filter((q) => q.inicio <= b.activo.inicio)) {
          const arr = b.celdas
            .filter((x) => x.periodo.inicio === p.inicio)
            .reduce((s, x) => s + Math.max(0, x.disponible), 0);
          const alFin = efectivo.reduce((s, k) => s + saldoAl(h, k.id, p.fin), 0);
          expect(alFin).toBe(lpaAlCierre(h, b, p) + arr);
        }
      }),
      opciones,
    );
  });
});
