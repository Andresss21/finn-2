// Diferencial contra el oráculo (07 §3.1, CT-05; CH-19). Nivel PROP del proyecto `unidad`: es la única
// propiedad con E/S, porque lanza motor_min.py (Fase 6, alcance congelado de V7-03) con `python -I`, y
// por eso vive aquí y no en @finn/dominio (ADR-21). Los casos salen de `hechosArb` (V7-03 extendido)
// con un hoy cualquiera de 2027 y los ids de transacciones y líneas barajados: así el orden por id no
// coincide con el cronológico y el reparto D2 tiene que ordenar de verdad (mutante `orden`, 07 §19.4).
// 300 casos en PR y FC_RUNS (10.000) en el nocturno; la semilla es FC_SEED (07 §7.1).
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../../../packages/dominio/src/calculo/calcular.ts';
import type { Hechos, Instantanea, Uuid } from '../../../packages/dominio/src/hechos/index.ts';
import { hechosArb } from '../../../packages/dominio/src/pruebas/generadores.ts';
import { FechaLocal } from '../../../packages/dominio/src/valores/fecha-local.ts';

const runs = Number(process.env['FC_RUNS'] ?? '300');
const seed = Number(process.env['FC_SEED'] ?? '0');
const python = process.env['FINN_PYTHON'] || (process.platform === 'win32' ? 'python' : 'python3');
const ORACULO = join(dirname(fileURLToPath(import.meta.url)), 'oraculo.py');

type Numeros = Record<string, unknown>;
type Fila = [string, string, number];

/** Un hoy de 2027 desde el 10 de enero y unos hechos válidos hasta ese día. */
const hoyArb = fc
  .integer({ min: 9, max: 364 })
  .map((n) => FechaLocal.sumarDias(FechaLocal.desdePartes(2027, 1, 1), n));

/** Reasigna los ids de transacciones y líneas con una permutación (y las referencias a ellos). */
function barajar(h: Hechos, tx: readonly Uuid[], ln: readonly Uuid[]): Hechos {
  const m = new Map<Uuid, Uuid>();
  h.transacciones.forEach((t, i) => m.set(t.id, tx[i] as Uuid));
  const n = new Map<Uuid, Uuid>();
  h.lineas.forEach((l, i) => n.set(l.id, ln[i] as Uuid));
  const a = (id: Uuid): Uuid => m.get(id) ?? id;
  return {
    ...h,
    transacciones: h.transacciones.map((t) => ({ ...t, id: a(t.id) })),
    efectos: h.efectos.map((e) => ({ ...e, transaccionId: a(e.transaccionId) })),
    lineas: h.lineas.map((l) => ({
      ...l,
      id: n.get(l.id) ?? l.id,
      transaccionId: a(l.transaccionId),
    })),
  };
}

const casoArb = hoyArb.chain((hoy) =>
  hechosArb(hoy).chain((h) => {
    const ids = (xs: readonly { readonly id: Uuid }[]) =>
      fc.shuffledSubarray(
        xs.map((x) => x.id),
        { minLength: xs.length, maxLength: xs.length },
      );
    return fc
      .tuple(ids(h.transacciones), ids(h.lineas))
      .map(([tx, ln]) => ({ hoy, hechos: barajar(h, tx, ln) }));
  }),
);

/** Los hechos en el formato de motor_min.py: categorías por id y pago(t) como "Pago <id de t>". */
function aOraculo(hoy: FechaLocal, h: Hechos) {
  const tipo = new Map(h.cuentas.map((k) => [k.id, k.tipo]));
  const deCuenta = (t: 'efectivo' | 'tarjeta') =>
    Object.fromEntries(h.cuentas.filter((k) => k.tipo === t).map((k) => [k.id, 0]));
  const nombre = new Map(
    h.categorias.map((c) => [c.id, c.clase === 'pago' ? `Pago ${String(c.tarjetaId)}` : c.id]),
  );
  const cat = (id: Uuid | null): string => nombre.get(id as Uuid) ?? '';
  // Clave de orden de motor_min: la posición en (fecha, clave de orden, secuencia), §4.1 conv. 2.
  const orden = [...h.transacciones]
    .map((t) => [`${t.fecha}|${t.claveOrden}|${(t.secuencia ?? '~').padStart(20, '0')}`, t.id])
    .sort(([x], [y]) => ((x as string) < (y as string) ? -1 : 1))
    .map(([, id]) => id);
  const ingresos: Fila[] = [];
  const gastos: { cuenta: string; fecha: string; clave: number; lineas: [string, number][] }[] = [];
  const pagos: [string, string, string, number][] = [];
  const devoluciones: [string, string, string, number][] = [];
  for (const t of h.transacciones) {
    const ef = h.efectos.filter((e) => e.transaccionId === t.id);
    const ls = h.lineas
      .filter((l) => l.transaccionId === t.id)
      .sort((x, y) => x.orden - y.orden)
      .map((l): [string, number] => [cat(l.categoriaId), l.monto]);
    const [e] = ef;
    if (e === undefined) throw new RangeError(`transacción ${t.id} sin efecto`);
    if (t.tipo === 'ingreso') ingresos.push([e.cuentaId, t.fecha, e.monto]);
    else if (t.tipo === 'gasto')
      gastos.push({ cuenta: e.cuentaId, fecha: t.fecha, clave: orden.indexOf(t.id), lineas: ls });
    else if (t.tipo === 'devolucion')
      devoluciones.push([e.cuentaId, t.fecha, ls[0]?.[0] ?? '', e.monto]);
    else if (t.tipo === 'pago_tarjeta') {
      const origen = ef.find((x) => tipo.get(x.cuentaId) === 'efectivo');
      const destino = ef.find((x) => tipo.get(x.cuentaId) === 'tarjeta');
      if (origen === undefined || destino === undefined) throw new RangeError(`pago ${t.id}`);
      pagos.push([origen.cuentaId, destino.cuentaId, t.fecha, destino.monto]);
    } else throw new RangeError(`tipo ${t.tipo} fuera del alcance del oráculo (V7-03)`);
  }
  return {
    hoy,
    efectivo: deCuenta('efectivo'),
    tarjetas: deCuenta('tarjeta'),
    categorias: h.categorias.filter((c) => c.clase === 'normal').map((c) => c.id),
    ingresos,
    gastos,
    pagos,
    asig: h.asignaciones.map((a): Fila => [cat(a.categoriaId), a.periodoInicio, a.monto]),
    devoluciones,
  };
}

/** Los mismos números desde la instantánea de `calcular`. */
function delMotor(i: Instantanea): Numeros {
  const activo = i.presupuesto.celdas.filter(
    (x) => x.periodo.inicio === i.presupuesto.activo.inicio,
  );
  const porTarjeta = (f: (t: Instantanea['tarjetas'][number]) => number) =>
    Object.fromEntries(i.tarjetas.map((t) => [t.tarjetaId, f(t)]));
  return {
    lpa: i.lpa.total,
    efectivo: i.cuentas.filter((k) => k.tipo === 'efectivo').reduce((s, k) => s + k.saldo, 0),
    disp: Object.fromEntries(
      activo.map((x) => [
        x.clase === 'pago' ? `Pago ${String(x.tarjetaId)}` : x.categoriaId,
        x.disponible,
      ]),
    ),
    S: porTarjeta((t) => t.sinRespaldo),
    deuda: porTarjeta((t) => t.deuda),
    RE: porTarjeta((t) => t.reservaExcedente),
    sobta: i.sobregiroConTarjeta,
  };
}

describe('PRU-PROP-MOTOR', () => {
  it(
    'PRU-PROP-MOTOR-106 [INV-01, INV-02, INV-03] MOT-diferencial (CT-05): para hechos del subconjunto congelado de V7-03, calcular y motor_min.py dan los mismos Disponibles del activo, S, RE, deuda, LPA, efectivo y SobTA',
    { timeout: 600_000 },
    () => {
      const casos = fc.sample(casoArb, { numRuns: runs, seed });
      const r = spawnSync(python, ['-I', '-X', 'utf8', '-B', ORACULO], {
        input: JSON.stringify(casos.map((c) => aOraculo(c.hoy, c.hechos))),
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 1024,
      });
      expect(r.error, `no se pudo ejecutar ${python}`).toBeUndefined();
      expect(r.status, r.stderr).toBe(0);
      const esperados = JSON.parse(r.stdout) as Numeros[];
      expect(esperados).toHaveLength(casos.length);
      casos.forEach((c, k) => {
        expect(
          delMotor(calcular(c.hechos, c.hoy)),
          `caso ${k} (FC_SEED=${seed}), hoy ${c.hoy}`,
        ).toStrictEqual(esperados[k]);
      });
    },
  );
});
