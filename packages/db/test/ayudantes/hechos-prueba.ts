// Hechos de prueba de las 18 tablas [M] (TA-152; PRU-INT-MOTOR-101): los escribe con `escribir()` en la base de
// prueba y devuelve lo escrito con la revisión y la secuencia que fijó la base. Los compara la prueba de
// `@finn/aplicacion`, que no ve Prisma (ADR-21).
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { FechaLocal } from '@finn/dominio/valores';
import type { BigintTexto, FilasPorTabla, Instante, TablaMotor, Uuid } from '@finn/dominio';
import { PrismaClient } from '../../src/generado/prisma/client.ts';
import { transaccionesSobre, txPrisma } from '../../src/transacciones.ts';
import { dateDeFechaLocal, dateDeInstante } from '../../src/mapeo/fechas.ts';
import type { BasePrueba } from './base.ts';

export const HOY = '2027-02-05';
export const RELOJ = { reloj: { hoy: HOY, desfaseMs: 0 } };
const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const inst = (s: string): Instante => s as Instante;
const fecha = (s: string) => FechaLocal.desdeTexto(s);
const c = (n: number) => n as never; // Centavos de la prueba (enteros, validados al cargar)

const E1 = uuid(1),
  E2 = uuid(2),
  T1 = uuid(3),
  P1 = uuid(4),
  I1 = uuid(5);
const G1 = uuid(10),
  C1 = uuid(11),
  C2 = uuid(12),
  CP = uuid(13),
  D1 = uuid(14);
const K1 = uuid(15),
  K2 = uuid(16),
  PG1 = uuid(17),
  PG2 = uuid(18);
const tx = (n: number): Uuid => uuid(100 + n);
const ef = (n: number): Uuid => uuid(200 + n);
const li = (n: number): Uuid => uuid(300 + n);

type Filas = { [T in TablaMotor]: FilasPorTabla[T][] };
type SinSello<T> = Omit<T, 'revision' | 'secuencia'> & { revision?: null; secuencia?: null };

/** Los hechos que la prueba escribe (sin revisión ni secuencia: las fija la base). */
function escritos(
  grupoPagos: Uuid,
  institucion: Uuid,
): { [T in TablaMotor]: SinSello<FilasPorTabla[T]>[] } {
  const cuenta = (
    id: Uuid,
    tipo: 'efectivo' | 'tarjeta' | 'prestamo' | 'inversion',
    nombre: string,
    orden: number,
  ) =>
    ({
      id,
      tipo,
      nombre,
      institucionId: null,
      ultimos4: null,
      fechaApertura: fecha('2027-01-21'),
      orden,
      archivada: false,
    }) as const;
  const t = (
    n: number,
    tipo: FilasPorTabla['transacciones']['tipo'],
    f: string,
    total: number,
    resto = {},
  ) => ({
    id: tx(n),
    tipo,
    fecha: fecha(f),
    horaRegistro: inst(`${f}T15:${String(n).padStart(2, '0')}:00.123Z`),
    claveOrden: inst(`${f}T15:${String(n).padStart(2, '0')}:00.123Z`),
    origen: 'manual' as const,
    estadoBancario: 'pendiente' as const,
    conciliacionId: null,
    comercio: null,
    nota: null,
    total: c(total),
    monedaOriginal: null,
    montoOriginal: null,
    lineaCobradaId: null,
    ...resto,
  });
  const e = (
    n: number,
    transaccionId: Uuid,
    cuentaId: Uuid,
    monto: number,
    interes: number | null = null,
    seguro: number | null = null,
  ) => ({
    id: ef(n),
    transaccionId,
    cuentaId,
    monto: c(monto),
    interes: interes === null ? null : c(interes),
    seguro: seguro === null ? null : c(seguro),
  });
  const l = (n: number, transaccionId: Uuid, orden: number, monto: number, destino: object) => ({
    id: li(n),
    transaccionId,
    orden,
    monto: c(monto),
    categoriaId: null,
    deudorId: null,
    lineaOriginalId: null,
    ...destino,
  });
  return {
    vigencias_ciclo: [{ id: uuid(20), diaInicio: 15, rigeDesde: fecha('2027-04-21') }],
    cuentas: [
      { ...cuenta(E1, 'efectivo', 'Efectivo', 0), institucionId: institucion, ultimos4: '1234' },
      cuenta(E2, 'efectivo', 'Ahorros', 1),
      cuenta(T1, 'tarjeta', 'Visa', 2),
      cuenta(P1, 'prestamo', 'Préstamo', 3),
      cuenta(I1, 'inversion', 'Fondo', 4),
    ],
    tarjetas: [
      {
        cuentaId: T1,
        tipo: 'tarjeta',
        limiteCredito: c(500000),
        tasaAnualMillonesimas: 240000,
        diaCorte: 15,
        diaPago: 5,
        red: 'visa',
        color: '#1A2B3C',
      },
    ],
    prestamos: [
      {
        cuentaId: P1,
        tipo: 'prestamo',
        contraparte: 'Banco',
        montoOriginal: c(300000),
        tasaNominalAnualMillonesimas: 120000,
        tipoTasa: 'fija',
        seguroPrimerMes: c(300),
        comision: c(1500),
        frecuencia: 'cada_n_dias',
        frecuenciaDias: 14,
        cuotaPactada: c(5000),
        plazoCuotas: 60,
        modeloCalculo: 'banco_agricola',
        cuotasPagadasAlCrear: 2,
      },
    ],
    inversiones: [{ cuentaId: I1, tipo: 'inversion', rendimientoAnualEsperadoMillonesimas: 50000 }],
    grupos: [
      {
        id: grupoPagos,
        nombre: 'Pagos de tarjeta',
        orden: 0,
        archivado: false,
        claveSistema: 'pagos_tarjeta',
      },
      { id: G1, nombre: 'Gastos', orden: 1, archivado: false, claveSistema: null },
    ],
    categorias: [
      {
        id: C1,
        grupoId: G1,
        nombre: 'Comida',
        orden: 0,
        clase: 'normal',
        tarjetaId: null,
        archivada: false,
      },
      {
        id: C2,
        grupoId: G1,
        nombre: 'Préstamo',
        orden: 1,
        clase: 'normal',
        tarjetaId: null,
        archivada: false,
      },
      {
        id: CP,
        grupoId: grupoPagos,
        nombre: 'Visa',
        orden: 0,
        clase: 'pago',
        tarjetaId: T1,
        archivada: false,
      },
    ],
    asignaciones: [
      { id: uuid(30), categoriaId: C1, periodoInicio: fecha('2027-01-21'), monto: c(50000) },
      { id: uuid(31), categoriaId: C2, periodoInicio: fecha('2027-01-21'), monto: c(-2000) },
    ],
    deudores: [{ id: D1, nombre: 'Ana' }],
    transacciones: [
      t(1, 'saldo_inicial', '2027-01-21', 100000),
      t(2, 'saldo_inicial', '2027-01-21', 300000),
      t(3, 'saldo_inicial', '2027-01-21', 50000),
      t(4, 'gasto', '2027-01-22', 1250, {
        origen: 'sms',
        comercio: 'Super',
        nota: 'compra',
        monedaOriginal: 'EUR',
      }),
      t(5, 'gasto', '2027-01-25', 2000, { estadoBancario: 'confirmada' }),
      t(6, 'cobro', '2027-02-01', 1000, { lineaCobradaId: li(3) }),
      t(7, 'devolucion', '2027-02-03', 250),
      t(8, 'gasto', '2027-01-26', 3000, { origen: 'importada', estadoBancario: 'confirmada' }),
      t(9, 'pago_tarjeta', '2027-01-30', 1000, {
        estadoBancario: 'conciliada',
        conciliacionId: K1,
        origen: 'programada',
      }),
      t(10, 'cuota_prestamo', '2027-02-02', 5000),
    ],
    efectos: [
      e(1, tx(1), E1, 100000),
      e(2, tx(2), P1, 300000),
      e(3, tx(3), I1, 50000),
      e(4, tx(4), E1, -1250),
      e(5, tx(5), E1, -2000),
      e(6, tx(6), E1, 1000),
      e(7, tx(7), E1, 250),
      e(8, tx(8), T1, -3000),
      e(9, tx(9), E1, -1000),
      e(10, tx(9), T1, 1000),
      e(11, tx(10), E1, -5000),
      e(12, tx(10), P1, -4000, 800, 200),
    ],
    lineas: [
      l(1, tx(4), 1, 1250, { categoriaId: C1 }),
      l(2, tx(5), 1, 500, { categoriaId: C1 }),
      l(3, tx(5), 2, 1500, { deudorId: D1 }),
      l(4, tx(7), 1, 250, { lineaOriginalId: li(1) }),
      l(5, tx(8), 1, 3000, { categoriaId: C1 }),
      l(6, tx(9), 1, 1000, { categoriaId: CP }),
      l(7, tx(10), 1, 5000, { categoriaId: C2 }),
    ],
    condonaciones: [
      {
        id: uuid(40),
        lineaId: li(3),
        fecha: fecha('2027-02-02'),
        monto: c(300),
        claveOrden: inst('2027-02-02T16:00:00.001Z'),
        categoriaId: C1,
      },
    ],
    metas: [
      {
        id: uuid(50),
        categoriaId: C1,
        tipo: 'mensual',
        modo: 'acumular',
        monto: c(30000),
        fechaObjetivo: null,
        fechaCreacion: fecha('2027-01-21'),
      },
      {
        id: uuid(51),
        categoriaId: C2,
        tipo: 'para_fecha',
        modo: null,
        monto: c(90000),
        fechaObjetivo: fecha('2027-12-31'),
        fechaCreacion: fecha('2027-01-22'),
      },
    ],
    programadas: [
      {
        id: PG1,
        tipo: 'gasto',
        cuentaId: E1,
        cuentaDestinoId: null,
        comercio: 'Netflix',
        monto: c(1500),
        tolerancia: c(100),
        frecuencia: 'mensual',
        frecuenciaDias: null,
        primeraFecha: fecha('2027-01-25'),
        fechaFin: null,
        registroAutomatico: true,
        activa: true,
      },
      {
        id: PG2,
        tipo: 'pago_tarjeta',
        cuentaId: E1,
        cuentaDestinoId: T1,
        comercio: 'Pago Visa',
        monto: c(2000),
        tolerancia: c(0),
        frecuencia: 'cada_n_dias',
        frecuenciaDias: 14,
        primeraFecha: fecha('2027-02-01'),
        fechaFin: fecha('2027-12-31'),
        registroAutomatico: false,
        activa: false,
      },
    ],
    programada_lineas: [
      { id: uuid(60), programadaId: PG1, orden: 1, monto: c(1500), categoriaId: C1 },
    ],
    ocurrencias_resueltas: [
      {
        id: uuid(70),
        programadaId: PG1,
        fechaEsperada: fecha('2027-01-25'),
        estado: 'registrada',
        transaccionId: tx(8),
      },
      {
        id: uuid(71),
        programadaId: PG1,
        fechaEsperada: fecha('2027-02-25'),
        estado: 'omitida',
        transaccionId: null,
      },
    ],
    conciliaciones: [
      {
        id: K1,
        cuentaId: E1,
        fechaEstado: fecha('2027-01-31'),
        saldoEstado: c(95000),
        terminadaEn: inst('2027-02-01T10:30:45.678Z'),
        diferenciaAceptada: c(0),
        modo: 'estado_cuenta',
      },
      {
        id: K2,
        cuentaId: E2,
        fechaEstado: fecha('2027-02-01'),
        saldoEstado: c(0),
        terminadaEn: inst('2027-02-01T11:00:00.000Z'),
        diferenciaAceptada: c(-25),
        modo: 'saldo',
      },
    ],
  };
}

/** Datos de Prisma desde una fila: fechas e instantes a `Date`; revisión y secuencia las pone la base. */
const dato = (f: object): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(f).map(([k, v]) => [
      k,
      typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
        ? dateDeFechaLocal(v as FechaLocal)
        : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)
          ? dateDeInstante(v)
          : v,
    ]),
  );

export type Escritos = {
  /** Lo escrito por tabla, con `revision` y, donde existe, `secuencia` tal como quedaron en la base. */
  escritas: Record<TablaMotor, object[]>;
  /** Filas que sembró la migración (03 §9) y la prueba no escribió. */
  sembradas: Partial<Record<TablaMotor, number>>;
  /** Columnas de cada tabla [M] según la base. */
  columnas: Record<TablaMotor, string[]>;
  /** El identificador de una fila de la tabla. */
  clave: (tabla: TablaMotor, fila: object) => string;
  /** Id de la transacción 4, la que tiene moneda original (`monto_original` no se carga). */
  txMonedaOriginal: Uuid;
};

const TABLAS_CUENTA = ['tarjetas', 'prestamos', 'inversiones'];
const clave = (tabla: TablaMotor, fila: object): string =>
  (fila as Record<string, string>)[TABLAS_CUENTA.includes(tabla) ? 'cuentaId' : 'id'] ?? '';

export async function escribirHechosDePrueba(base: BasePrueba): Promise<Escritos> {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: base.url, max: 3 }) });
  const admin = new pg.Client({ connectionString: base.urlAdmin });
  await admin.connect();
  try {
    const [{ id: grupoPagos }] = (
      await admin.query<{ id: Uuid }>(
        `SELECT id FROM finn.grupos WHERE clave_sistema = 'pagos_tarjeta'`,
      )
    ).rows as [{ id: Uuid }];
    const [{ id: institucion }] = (
      await admin.query<{ id: Uuid }>(
        `SELECT id FROM finn.instituciones WHERE lower(nombre) = 'bac'`,
      )
    ).rows as [{ id: Uuid }];
    const [{ id: vigencia }] = (
      await admin.query<{ id: Uuid }>(`SELECT id FROM finn.vigencias_ciclo`)
    ).rows as [{ id: Uuid }];
    const esperados = escritos(grupoPagos, institucion);
    // El grupo del sistema y la vigencia inicial los siembra la migración (03 §9): ya existen
    esperados.grupos = esperados.grupos.filter((g) => g.id !== grupoPagos);
    const sembrados = { grupos: 1, vigencias_ciclo: 1 } as Partial<Record<TablaMotor, number>>;
    const sobre = transaccionesSobre(db);
    await sobre.escribir(async (t) => {
      const p = txPrisma(t);
      const e = esperados;
      await p.vigenciaCiclo.createMany({ data: e.vigencias_ciclo.map(dato) as never });
      await p.grupo.createMany({ data: e.grupos.map(dato) as never });
      await p.cuenta.createMany({ data: e.cuentas.map(dato) as never });
      await p.tarjeta.createMany({ data: e.tarjetas.map(dato) as never });
      await p.prestamo.createMany({ data: e.prestamos.map(dato) as never });
      await p.inversion.createMany({ data: e.inversiones.map(dato) as never });
      await p.categoria.createMany({ data: e.categorias.map(dato) as never });
      await p.asignacion.createMany({ data: e.asignaciones.map(dato) as never });
      await p.deudor.createMany({ data: e.deudores.map(dato) as never });
      await p.conciliacion.createMany({ data: e.conciliaciones.map(dato) as never });
      // monto_original se escribe pero no se carga: el cargado lo trae en null
      await p.transaccion.createMany({
        data: e.transacciones
          .filter((x) => x.tipo !== 'cobro')
          .map((x) => ({
            ...dato(x),
            ...(x.monedaOriginal ? { montoOriginal: '10.5000' } : {}),
            ...(x.id === tx(5) || x.id === tx(9)
              ? { estadoBancario: 'pendiente', conciliacionId: null }
              : {}),
          })) as never,
      });
      // el estado inicial es pendiente (o confirmada si es importada, §7.2): después pasan a su estado
      await p.transaccion.update({ where: { id: tx(5) }, data: { estadoBancario: 'confirmada' } });
      await p.transaccion.update({
        where: { id: tx(9) },
        data: { estadoBancario: 'conciliada', conciliacionId: K1 },
      });
      await p.efecto.createMany({
        data: e.efectos.filter((x) => x.transaccionId !== tx(6)).map(dato) as never,
      });
      await p.linea.createMany({
        data: e.lineas.filter((x) => x.lineaOriginalId === null).map(dato) as never,
      });
      await p.linea.createMany({
        data: e.lineas.filter((x) => x.lineaOriginalId !== null).map(dato) as never,
      });
      await p.transaccion.createMany({
        data: e.transacciones.filter((x) => x.tipo === 'cobro').map(dato) as never,
      });
      await p.efecto.createMany({
        data: e.efectos.filter((x) => x.transaccionId === tx(6)).map(dato) as never,
      });
      await p.condonacion.createMany({ data: e.condonaciones.map(dato) as never });
      await p.meta.createMany({ data: e.metas.map(dato) as never });
      await p.programada.createMany({ data: e.programadas.map(dato) as never });
      await p.programadaLinea.createMany({ data: e.programada_lineas.map(dato) as never });
      await p.ocurrenciaResuelta.createMany({ data: e.ocurrencias_resueltas.map(dato) as never });
    }, RELOJ);

    const escritas = {} as Record<TablaMotor, object[]>;
    const columnas = {} as Record<TablaMotor, string[]>;
    for (const tabla of Object.keys(esperados) as TablaMotor[]) {
      const llave = TABLAS_CUENTA.includes(tabla) ? 'cuenta_id' : 'id';
      const conSecuencia = ['transacciones', 'condonaciones'].includes(tabla);
      const sello = (
        await admin.query<{ k: string; revision: string; secuencia?: string }>(
          `SELECT ${llave}::text AS k, revision::text${conSecuencia ? ', secuencia::text' : ''} FROM finn.${tabla}`,
        )
      ).rows;
      const porClave = new Map(sello.map((s) => [s.k, s]));
      escritas[tabla] = (esperados[tabla] as object[]).map((f) => {
        const s = porClave.get(clave(tabla, f));
        if (!s || s.revision === '0') throw new Error(`${tabla} ${clave(tabla, f)}: sin revisión`);
        return {
          ...f,
          revision: s.revision as BigintTexto,
          ...(s.secuencia ? { secuencia: s.secuencia as BigintTexto } : {}),
        };
      });
      columnas[tabla] = (
        await admin.query<{ column_name: string }>(
          `SELECT column_name FROM information_schema.columns WHERE table_schema = 'finn' AND table_name = $1`,
          [tabla],
        )
      ).rows.map((r) => r.column_name);
    }
    return { escritas, sembradas: sembrados, columnas, clave, txMonedaOriginal: tx(4) };
  } finally {
    await db.$disconnect();
    await admin.end();
  }
}
