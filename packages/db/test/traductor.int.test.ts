// Traductor de cambios (TA-153; 04 §4.5, BE-15, BE-16; 04 §4.5.6, BE-32; 04 §2.4.1, BE-31; 03 §4.6.4, HZ-1):
// PRU-INT-ESQ-105. Sobre los hechos de prueba de las 18 tablas [M], tres escrituras con los cambios en un orden
// que la base rechazaría si el traductor no los reordenara: altas con una actualización que apunta a una fila
// nueva (F3 → F4), una edición que desvincula y elimina (F1 → F2, hijos antes que padres) y OP-06 con las
// conciliaciones de la cuenta (HZ-1). Las sentencias se leen de los eventos `query` de Prisma; lo escrito, con
// `cargarHechos`. Ninguna comparación usa el reloj de pared.
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { FechaLocal } from '@finn/dominio/valores';
import type { Cambio, Hechos, Instante, Uuid } from '@finn/dominio';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../src/generado/prisma/client.ts';
import { cargarHechos } from '../src/hechos/cargar.ts';
import { ErrorTraductor, ORDEN_TABLAS, type ValoresDeLaBase } from '../src/hechos/traductor.ts';
import { transaccionesSobre, type EscritorTx } from '../src/transacciones.ts';
import { crearBasePrueba } from './ayudantes/base.ts';
import { escribirHechosDePrueba, RELOJ } from './ayudantes/hechos-prueba.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const fecha = (s: string) => FechaLocal.desdeTexto(s);
const inst = (s: string): Instante => s as Instante;
const c = (n: number) => n as never; // Centavos de la prueba
// De los hechos de prueba (ayudantes/hechos-prueba.ts)
const E1 = uuid(1),
  E2 = uuid(2),
  G1 = uuid(10),
  C1 = uuid(11),
  K1 = uuid(15),
  K2 = uuid(16),
  L1 = uuid(301);
// Filas nuevas de esta prueba
const CN = uuid(900),
  AN = uuid(901),
  TN = uuid(902),
  EN = uuid(903),
  LN1 = uuid(904),
  LN2 = uuid(905),
  TS = uuid(906),
  ES = uuid(907),
  CPN = uuid(908),
  CX = uuid(909);

const transaccion = (id: Uuid, tipo: 'gasto' | 'saldo_inicial', f: string, total: number) => ({
  id,
  tipo,
  fecha: fecha(f),
  horaRegistro: inst(`${f}T18:00:00.250Z`),
  claveOrden: inst(`${f}T18:00:00.250Z`),
  secuencia: null,
  origen: 'manual' as const,
  estadoBancario: 'pendiente' as const,
  conciliacionId: null,
  comercio: null,
  nota: null,
  total: c(total),
  monedaOriginal: null,
  montoOriginal: null,
  lineaCobradaId: null,
  revision: null,
});
const categoria = (id: Uuid) => ({
  id,
  grupoId: G1,
  nombre: 'Nueva',
  orden: 5,
  clase: 'normal' as const,
  tarjetaId: null,
  archivada: false,
  revision: null,
});
const linea = (id: Uuid, orden: number, categoriaId: Uuid) => ({
  id,
  transaccionId: TN,
  orden,
  monto: c(700),
  categoriaId,
  deudorId: null,
  lineaOriginalId: null,
  revision: null,
});
const efecto = (id: Uuid, transaccionId: Uuid, cuentaId: Uuid, monto: number) => ({
  id,
  transaccionId,
  cuentaId,
  monto: c(monto),
  interes: null,
  seguro: null,
  revision: null,
});

/** Las sentencias de escritura, como `verbo tabla`, en el orden en que llegaron a la base. */
function escrituras(consultas: readonly string[]): string[] {
  return consultas.flatMap((q) => {
    const conc = /eliminar_conciliaciones_de_cuenta/.exec(q);
    if (conc) return ['funcion conciliaciones'];
    const m = /^\s*(INSERT INTO|UPDATE|DELETE FROM)\s+"finn"\."(\w+)"/.exec(q);
    if (!m?.[1] || !m[2]) return [];
    return [
      `${{ 'INSERT INTO': 'insert', UPDATE: 'update', 'DELETE FROM': 'delete' }[m[1]]} ${m[2]}`,
    ];
  });
}

describe('PRU-INT-ESQ', () => {
  const base = crearBasePrueba();
  let db: PrismaClient<'query'>;
  let admin: pg.Client;
  const consultas: string[] = [];
  let t: ReturnType<typeof transaccionesSobre>;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: base.url, options: '-c TimeZone=UTC', max: 3 }),
      log: [{ emit: 'event', level: 'query' }],
    });
    db.$on('query', (e) => consultas.push(e.query));
    t = transaccionesSobre(db);
    admin = new pg.Client({ connectionString: base.urlAdmin });
    await admin.connect();
  });
  afterAll(async () => {
    await db.$disconnect();
    await admin.end();
  });

  /** Una escritura con `cambios`: lo devuelto, la revisión resultante y las sentencias de escritura. */
  async function aplicar(
    cambios: readonly Cambio[],
    antes?: (tx: EscritorTx) => Promise<void>,
  ): Promise<{ valores: ValoresDeLaBase; revision: string; sentencias: string[] }> {
    consultas.length = 0;
    const r = await t.escribir(async (tx) => {
      await antes?.(tx);
      const valores = await tx.aplicarCambios(cambios);
      return { valores, revision: await tx.revisionActual() };
    }, RELOJ);
    return { ...r, sentencias: escrituras(consultas) };
  }
  const cargar = (): Promise<Hechos> => t.leer((tx) => cargarHechos(tx), RELOJ);
  const filasDe = async (sql: string): Promise<string[]> =>
    (await admin.query<{ x: string }>(sql)).rows.map((f) => f.x);

  it('PRU-INT-ESQ-105 BE-15, BE-16, BE-31, BE-32, HZ-1: el traductor aplica las cuatro fases en el orden fijo de tablas, envía siempre el id, devuelve secuencia y revision con RETURNING, no cambia lineas.orden y elimina las conciliaciones de una cuenta', async () => {
    // ── 1. Altas emitidas de hijos a padres y una actualización que apunta a una fila nueva: F3 y luego F4
    const altas: Cambio[] = [
      { tipo: 'actualizar', tabla: 'lineas', id: L1, campos: { categoriaId: CN } },
      { tipo: 'insertar', tabla: 'lineas', fila: linea(LN1, 1, CN) },
      { tipo: 'insertar', tabla: 'efectos', fila: efecto(EN, TN, E1, -700) },
      { tipo: 'insertar', tabla: 'efectos', fila: efecto(ES, TS, E2, 4000) },
      {
        tipo: 'insertar',
        tabla: 'cambios_posteriores',
        fila: {
          id: CPN,
          conciliacionId: K2,
          transaccionId: null,
          registradoEn: inst('2000-01-01T00:00:00.000Z'), // lo reemplaza finn.ahora() (CT-02)
          motivos: ['monto'],
          fecha: fecha('2027-01-21'),
          montoEfecto: c(4000),
          comercio: null,
        },
      },
      {
        tipo: 'insertar',
        tabla: 'transacciones',
        fila: transaccion(TN, 'gasto', '2027-02-04', 700),
      },
      {
        tipo: 'insertar',
        tabla: 'transacciones',
        fila: transaccion(TS, 'saldo_inicial', '2027-01-21', 4000),
      },
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: {
          id: AN,
          categoriaId: CN,
          periodoInicio: fecha('2027-01-21'),
          monto: c(1000),
          revision: null,
        },
      },
      {
        tipo: 'insertar',
        tabla: 'categorias',
        fila: categoria(CN),
      },
    ];
    const r1 = await aplicar(altas);
    expect(r1.sentencias).toEqual([
      'insert categorias',
      'insert transacciones',
      'insert efectos',
      'insert lineas',
      'insert cambios_posteriores',
      'insert asignaciones',
      'update lineas',
    ]);
    // RETURNING: una fila por alta o actualización [M] (las [H] no tienen revision), con la revisión resultante
    const porId = new Map(r1.valores.map((v) => [v.id, v]));
    expect([...porId.keys()].sort()).toEqual([CN, AN, TN, EN, LN1, TS, ES, L1].sort());
    for (const v of r1.valores) expect(v.revision).toBe(r1.revision);
    const h1 = await cargar();
    for (const id of [TN, TS]) {
      const fila = h1.transacciones.find((x) => x.id === id);
      expect(fila?.secuencia).toMatch(/^\d+$/);
      expect(porId.get(id)?.secuencia).toBe(fila?.secuencia);
    }
    expect(porId.get(CN)?.secuencia).toBeUndefined();
    // Los ids son los del dominio (BE-31) y la columna técnica es la de la base
    expect(h1.categorias.find((x) => x.id === CN)?.revision).toBe(r1.revision);
    expect(h1.lineas.find((x) => x.id === L1)?.categoriaId).toBe(CN);
    expect(
      await filasDe(
        `SELECT (registrado_en > '2000-01-01')::text AS x FROM finn.cambios_posteriores WHERE id = '${CPN}'`,
      ),
    ).toEqual(['true']);

    // ── 2. Edición emitida de padres a hijos: F1 desvincula, F2 elimina de hijos a padres, F3 inserta
    const edicion: Cambio[] = [
      { tipo: 'eliminar', tabla: 'categorias', id: CN },
      { tipo: 'insertar', tabla: 'lineas', fila: linea(LN2, 2, C1) },
      { tipo: 'eliminar', tabla: 'asignaciones', id: AN },
      { tipo: 'eliminar', tabla: 'lineas', id: LN1 },
      { tipo: 'actualizar', tabla: 'lineas', id: L1, campos: { categoriaId: C1 } },
    ];
    const r2 = await aplicar(edicion);
    expect(r2.sentencias).toEqual([
      'update lineas',
      'delete asignaciones',
      'delete lineas',
      'delete categorias',
      'insert lineas',
    ]);
    expect(r2.valores.map((v) => v.id).sort()).toEqual([L1, LN2].sort());
    // BE-16: las líneas que quedan conservan su orden; la nueva lleva uno mayor
    const h2 = await cargar();
    expect(h2.lineas.find((x) => x.id === L1)).toMatchObject({ orden: 1, categoriaId: C1 });
    expect(h2.lineas.filter((x) => x.transaccionId === TN).map((x) => [x.id, x.orden])).toEqual([
      [LN2, 2],
    ]);
    expect(h2.categorias.some((x) => x.id === CN)).toBe(false);

    // ── 3. Reglas del traductor: se rechazan antes de enviar una sola escritura
    const rechazos: Cambio[][] = [
      // insertar sin id (BE-31)
      [
        {
          tipo: 'insertar',
          tabla: 'deudores',
          fila: { nombre: 'Sin id', revision: null } as never,
        },
      ],
      // eliminar conciliaciones por la vía común (HZ-1)
      [{ tipo: 'eliminar', tabla: 'conciliaciones', id: K1 }],
      // cambiar lineas.orden (BE-16)
      [{ tipo: 'actualizar', tabla: 'lineas', id: L1, campos: { orden: 9 } }],
      // F1 que apunta a una fila nueva
      [
        {
          tipo: 'insertar',
          tabla: 'categorias',
          fila: { ...categoria(CX), nombre: 'Otra' },
        },
        { tipo: 'eliminar', tabla: 'categorias', id: C1 },
        { tipo: 'actualizar', tabla: 'lineas', id: L1, campos: { categoriaId: CX } },
      ],
    ];
    for (const cambios of rechazos) {
      consultas.length = 0;
      await expect(t.escribir((tx) => tx.aplicarCambios(cambios), RELOJ)).rejects.toBeInstanceOf(
        ErrorTraductor,
      );
      expect(escrituras(consultas)).toEqual([]);
    }

    // ── 4. OP-06 de la cuenta E2 (03 §4.6.4), emitida de padres a hijos: saldo inicial (14), conciliaciones (13)
    // con la función de vía única, cuenta (3). La función exige que la cuenta ya no tenga efectos.
    const op06: Cambio[] = [
      { tipo: 'eliminar', tabla: 'cuentas', id: E2 },
      { tipo: 'eliminarConciliacionesDeCuenta', cuentaId: E2 },
      { tipo: 'eliminar', tabla: 'transacciones', id: TS },
    ];
    const r4 = await aplicar(op06, (tx) => tx.declararOperacion('eliminar_cuenta'));
    expect(r4.sentencias).toEqual([
      'delete transacciones',
      'funcion conciliaciones',
      'delete cuentas',
    ]);
    expect(r4.valores).toEqual([]);
    const h4 = await cargar();
    expect(h4.conciliaciones.map((x) => x.id)).toEqual([K1]);
    expect(h4.cuentas.some((x) => x.id === E2)).toBe(false);
    expect(h4.efectos.some((x) => x.id === ES)).toBe(false); // en cascada (DB-12)
    expect(await filasDe(`SELECT id::text AS x FROM finn.cambios_posteriores`)).toEqual([]);
    // El orden fijo es el de 04 §4.5.1
    expect(ORDEN_TABLAS.indexOf('asignaciones')).toBe(19);
  });
});
