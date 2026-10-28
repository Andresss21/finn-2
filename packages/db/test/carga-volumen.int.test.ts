// Volumen sintético en la base (TA-156; 07 §6.6, §12.7; 04 §5.6, BE-23): carga el volumen del generador por período,
// con el protocolo (`escribir()`, el bloqueo y `finn.hoy` = fin del período, para que pasen los triggers igual que
// en la app) y mide dos cosas con la mediana de 5 corridas:
// - PRU-REN-MOTOR-001: `cargarHechos` (json_agg) ≤ 500 ms con 10 años de volumen alto (V-13);
// - PRU-REN-ESQ-001: el costo de las verificaciones diferidas al confirmar una escritura masiva, 10.000 líneas
//   como una fusión (V-30, RK-22; FX-4 pide medirlo con el esquema completo).
// Con `FINN_REN=1` (el job `ren` del nocturno) usa el volumen alto a 10 años y escribe los tiempos en
// `test-results/ren/int.json`: un tiempo superado no falla aquí, lo evalúa `tools/pruebas/volumen/registrar.ts`
// (aviso y FINN_REN_ROJO, 07 §6.6). Sin la variable usa un año de volumen base: comprueba que la carga es válida y
// que `cargarHechos` devuelve lo escrito, sin tiempos. Los tiempos son duraciones (07 §7.1), no comparan el reloj.
import { mkdirSync, writeFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { FechaLocal } from '@finn/dominio/valores';
import type { Hechos, TablaMotor, Uuid } from '@finn/dominio';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  fechaFinal,
  generarHechos,
  generarPeriodos,
  TABLAS_MOTOR,
  type FilasMotor,
  type OpcionesVolumen,
} from '../../../tools/pruebas/volumen/generar.ts';
import { PrismaClient } from '../src/generado/prisma/client.ts';
import { cargarHechos } from '../src/hechos/cargar.ts';
import { dateDeFechaLocal, dateDeInstante } from '../src/mapeo/fechas.ts';
import { transaccionesSobre, txPrisma, type EscritorTx } from '../src/transacciones.ts';
import { crearBasePrueba } from './ayudantes/base.ts';

const NOCTURNO = process.env['FINN_REN'] === '1';
const VOLUMEN = NOCTURNO
  ? ({ nivel: 'alto', anios: 10, semilla: 1 } as const)
  : ({ nivel: 'base', anios: 1, semilla: 1 } as const);
const PRESUPUESTO_CARGA_MS = 500; // 02 §2.3, 04 §5.6
const CORRIDAS = 5; // mediana de 5 (07 §6.6)
const LINEAS_MASIVAS = 10_000; // una fusión grande (FX-4)

const base = crearBasePrueba();
let sobre: ReturnType<typeof transaccionesSobre>;
let grupoPagos: Uuid;
let esperados: Hechos;
let cargaVolumenMs = 0;
const resultados: Record<string, unknown> = {};

const mediana = (xs: number[]): number => {
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.floor(o.length / 2)] as number;
};
const redondear = (n: number): number => Math.round(n * 100) / 100;

// Filas del generador → datos de Prisma: fechas e instantes a Date; revisión y secuencia las pone la base
const dato = (f: object): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(f)
      .filter(([k]) => k !== 'revision' && k !== 'secuencia')
      .map(([k, v]) => [
        k,
        typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
          ? dateDeFechaLocal(v as FechaLocal)
          : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)
            ? dateDeInstante(v)
            : v,
      ]),
  );

/** Un período en una transacción: orden de FK; las verificaciones diferidas corren al confirmar (07 §12.7). */
async function cargarPeriodo(tx: EscritorTx, f: FilasMotor): Promise<void> {
  const p = txPrisma(tx);
  const d = (t: TablaMotor): never => f[t].map(dato) as never;
  await p.grupo.createMany({ data: d('grupos') });
  await p.cuenta.createMany({ data: d('cuentas') });
  await p.tarjeta.createMany({ data: d('tarjetas') });
  await p.categoria.createMany({ data: d('categorias') });
  await p.deudor.createMany({ data: d('deudores') });
  await p.meta.createMany({ data: d('metas') });
  await p.programada.createMany({ data: d('programadas') });
  await p.programadaLinea.createMany({ data: d('programada_lineas') });
  await p.asignacion.createMany({ data: d('asignaciones') });
  await p.transaccion.createMany({ data: d('transacciones') });
  await p.efecto.createMany({ data: d('efectos') });
  await p.linea.createMany({ data: d('lineas') });
}

const clave = (fila: object): string =>
  (fila as { id?: string; cuentaId: string }).id ?? (fila as { cuentaId: string }).cuentaId;
const sinSello = (fila: object): object =>
  Object.fromEntries(Object.entries(fila).filter(([k]) => k !== 'revision' && k !== 'secuencia'));

beforeAll(async () => {
  const admin = new pg.Client({ connectionString: base.urlAdmin });
  await admin.connect();
  try {
    const r = await admin.query<{ id: Uuid }>(
      `SELECT id FROM finn.grupos WHERE clave_sistema = 'pagos_tarjeta'`,
    );
    grupoPagos = (r.rows[0] as { id: Uuid }).id;
  } finally {
    await admin.end();
  }
  const op: OpcionesVolumen = { ...VOLUMEN, grupoPagos };
  esperados = generarHechos(op);
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: base.url, max: 3 }) });
  sobre = transaccionesSobre(db);
  const t0 = performance.now();
  for (const periodo of generarPeriodos(op))
    await sobre.escribir((tx) => cargarPeriodo(tx, periodo.filas), {
      reloj: { hoy: periodo.hoy, desfaseMs: 0 },
    });
  cargaVolumenMs = performance.now() - t0;
}, 3_600_000);

describe('volumen sintético en la base', () => {
  it(`PRU-REN-MOTOR-001 [V-13] la carga de hechos con json_agg devuelve lo escrito y no pasa de ${PRESUPUESTO_CARGA_MS} ms a 10 años de volumen alto`, async () => {
    const tiempos: number[] = [];
    let cargados = {} as Hechos;
    for (let i = 0; i <= CORRIDAS; i++) {
      const t0 = performance.now();
      cargados = await sobre.leer((tx) => cargarHechos(tx));
      if (i > 0) tiempos.push(performance.now() - t0); // la primera calienta el pool
    }
    // Lo cargado es lo generado, tabla por tabla; el grupo del sistema y la vigencia los sembró la migración
    for (const t of TABLAS_MOTOR) {
      const sembradas = t === 'grupos' || t === 'vigencias_ciclo' ? 1 : 0;
      expect(cargados[t], t).toHaveLength(esperados[t].length + sembradas);
    }
    if (!NOCTURNO)
      for (const t of TABLAS_MOTOR) {
        if (t === 'grupos' || t === 'vigencias_ciclo') continue;
        const ordenar = (xs: readonly object[]) =>
          xs.map(sinSello).sort((a, b) => clave(a).localeCompare(clave(b)));
        expect(ordenar(cargados[t]), t).toEqual(ordenar(esperados[t]));
      }
    const filas = TABLAS_MOTOR.reduce((n, t) => n + cargados[t].length, 0);
    resultados['motor001'] = {
      nivel: VOLUMEN.nivel,
      anios: VOLUMEN.anios,
      filas,
      medianaMs: redondear(mediana(tiempos)),
      corridasMs: tiempos.map(redondear),
      presupuestoMs: PRESUPUESTO_CARGA_MS,
      cargaVolumenMs: Math.round(cargaVolumenMs),
    };
    expect(filas).toBeGreaterThan(0);
  }, 600_000);

  it('PRU-REN-ESQ-001 [V-30] las verificaciones diferidas de una escritura masiva se miden al confirmar, con el esquema completo', async () => {
    const admin = new pg.Client({ connectionString: base.urlAdmin });
    await admin.connect();
    let origen: Uuid, destino: Uuid;
    try {
      const filas = (
        await admin.query<{ categoria_id: Uuid }>(
          `SELECT categoria_id FROM finn.lineas WHERE categoria_id IS NOT NULL
           GROUP BY categoria_id ORDER BY count(*) DESC, categoria_id`,
        )
      ).rows;
      origen = (filas[0] as { categoria_id: Uuid }).categoria_id;
      destino = (filas[filas.length - 1] as { categoria_id: Uuid }).categoria_id;
    } finally {
      await admin.end();
    }
    expect(destino).not.toBe(origen);

    const escrituras: number[] = [];
    const verificaciones: number[] = [];
    let afectadas = 0;
    class Deshacer extends Error {}
    for (let i = 0; i <= CORRIDAS; i++) {
      let e = 0,
        v = 0;
      await sobre
        .escribir(
          async (tx) => {
            const p = txPrisma(tx);
            const t0 = performance.now();
            afectadas = await p.$executeRawUnsafe(
              `UPDATE finn.lineas SET categoria_id = $1::uuid
               WHERE id IN (SELECT id FROM finn.lineas WHERE categoria_id = $2::uuid ORDER BY id LIMIT ${LINEAS_MASIVAS})`,
              destino,
              origen,
            );
            const t1 = performance.now();
            // Las verificaciones por fila (x_verificar_*) son diferidas: aquí corren todas
            await p.$executeRawUnsafe('SET CONSTRAINTS ALL IMMEDIATE');
            const t2 = performance.now();
            e = t1 - t0;
            v = t2 - t1;
            throw new Deshacer(); // la corrida no deja huella: la siguiente parte del mismo estado
          },
          { reloj: { hoy: fechaFinal(VOLUMEN), desfaseMs: 0 } },
        )
        .catch((err: unknown) => {
          if (!(err instanceof Deshacer)) throw err;
        });
      if (i > 0) {
        escrituras.push(e);
        verificaciones.push(v);
      }
    }
    expect(afectadas).toBeGreaterThan(0);
    resultados['esq001'] = {
      nivel: VOLUMEN.nivel,
      anios: VOLUMEN.anios,
      lineas: afectadas,
      medianaMs: redondear(mediana(verificaciones)),
      corridasMs: verificaciones.map(redondear),
      escrituraMedianaMs: redondear(mediana(escrituras)),
      presupuestoMs: null, // V-30 fue indicativa (04 RS-10, FX-4): se registra, sin tope
    };
  }, 600_000);
});

afterAll(() => {
  if (!NOCTURNO) return;
  mkdirSync('test-results/ren', { recursive: true });
  writeFileSync('test-results/ren/int.json', JSON.stringify(resultados, null, 2) + '\n');
});
