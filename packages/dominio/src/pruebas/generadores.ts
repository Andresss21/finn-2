// Generadores fast-check de `@finn/dominio/pruebas` (07 §12.5). Solo para archivos de prueba: la
// subruta no la importa ningún código de producción. Todo sale de la semilla de fast-check
// (`FC_SEED`, 07 §7.1): ni reloj ni azar propio, y los ids salen de un contador, no de `uuidv4`.
import fc from 'fast-check';
import type {
  Asignacion,
  BigintTexto,
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Instante,
  Linea,
  Tarjeta,
  Transaccion,
  Uuid,
  VigenciaCiclo,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';

const INICIO_2027 = FechaLocal.desdePartes(2027, 1, 1);
const DIA_INICIO_CICLO = 21;

/**
 * Fechas de 2027 (ciclo 21) desde el 1 de enero hasta `hoy`, nunca posteriores a `hoy` (inv. 12).
 * Pesa más los días de cierre y apertura de período (20 a 22) y los extremos del rango. Si `hoy`
 * es anterior al 1 de enero de 2027, el rango es solo `hoy`.
 */
export function fechaArb(hoy: FechaLocal): fc.Arbitrary<FechaLocal> {
  const desde = FechaLocal.comparar(INICIO_2027, hoy) <= 0 ? INICIO_2027 : hoy;
  const dia = fc
    .integer({ min: 0, max: FechaLocal.diasEntre(desde, hoy) })
    .map((n) => FechaLocal.sumarDias(desde, n));
  // Del día 20 al 22 del mes de una fecha del rango, recortado al rango (sin filter: así nunca se agota).
  const cierres = fc.tuple(dia, fc.integer({ min: -1, max: 1 })).map(([f, d]) => {
    const cerca = FechaLocal.sumarDias(FechaLocal.inicioDeMes(f, DIA_INICIO_CICLO), d);
    return FechaLocal.comparar(cerca, desde) < 0
      ? desde
      : FechaLocal.comparar(cerca, hoy) > 0
        ? hoy
        : cerca;
  });
  return fc.oneof(
    { weight: 6, arbitrary: dia },
    { weight: 2, arbitrary: cierres },
    { weight: 1, arbitrary: fc.constantFrom(desde, hoy) },
  );
}

/** Monto de 1 a 60.000 centavos (CB-28: siempre > 0), con 1, 99, 100 y 9.999 sesgados. */
export function montoArb(): fc.Arbitrary<Centavos> {
  return fc
    .oneof(
      { weight: 3, arbitrary: fc.constantFrom(1, 99, 100, 9999) },
      { weight: 7, arbitrary: fc.integer({ min: 1, max: 60_000 }) },
    )
    .map(Centavos.desdeEntero);
}

// ───────────── hechosArb ─────────────

const uuid = (n: number): Uuid =>
  `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}` as Uuid;

const dos = (n: number): string => String(n).padStart(2, '0');

/** Instante único por `n`: la hora del día sale del contador (múltiplo de 997 ms). */
function instante(fecha: FechaLocal, n: number): Instante {
  const ms = (n * 997) % 86_400_000;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor(ms / 60_000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return `${fecha}T${dos(h)}:${dos(m)}:${dos(s)}.${String(ms % 1000).padStart(3, '0')}Z` as Instante;
}

/** Inicios de período del ciclo 21 que cubren 2027 (el primero es el 21 de diciembre de 2026). */
const INICIOS_PERIODO: readonly FechaLocal[] = Array.from({ length: 13 }, (_, i) =>
  FechaLocal.desdePartes(i === 0 ? 2026 : 2027, i === 0 ? 12 : i, DIA_INICIO_CICLO),
);

type Clase = 'ingreso' | 'gasto' | 'pago' | 'devolucion';

interface PlanTransaccion {
  readonly clase: Clase;
  readonly fecha: FechaLocal;
  readonly cuenta: number;
  readonly tarjeta: number;
  readonly montos: readonly Centavos[];
  readonly categorias: readonly number[];
}

interface Plan {
  readonly efectivo: number;
  readonly tarjetas: number;
  readonly grupos: number;
  readonly normales: number;
  readonly asignaciones: readonly { celda: number; monto: Centavos }[];
  readonly transacciones: readonly PlanTransaccion[];
}

function planArb(hoy: FechaLocal): fc.Arbitrary<Plan> {
  const transaccion = fc.record({
    clase: fc.constantFrom<Clase>('ingreso', 'gasto', 'gasto', 'pago', 'devolucion'),
    fecha: fechaArb(hoy),
    cuenta: fc.nat(1000),
    tarjeta: fc.nat(1000),
    montos: fc.array(montoArb(), { minLength: 1, maxLength: 3 }),
    categorias: fc.array(fc.nat(1000), { minLength: 3, maxLength: 3 }),
  });
  return fc.record({
    efectivo: fc.integer({ min: 1, max: 3 }),
    tarjetas: fc.integer({ min: 0, max: 2 }),
    grupos: fc.integer({ min: 1, max: 3 }),
    normales: fc.integer({ min: 1, max: 6 }),
    asignaciones: fc.array(fc.record({ celda: fc.nat(1000), monto: montoArb() }), {
      maxLength: 10,
    }),
    transacciones: fc.array(transaccion, { maxLength: 12 }),
  });
}

const tipoDe = (c: Clase): Transaccion['tipo'] =>
  c === 'ingreso' ? 'ingreso' : c === 'devolucion' ? 'devolucion' : 'gasto';

function construir(plan: Plan, hoy: FechaLocal): Hechos {
  let n = 0;
  const id = (): Uuid => uuid(++n);
  const revision = (): BigintTexto => String(++n) as BigintTexto;
  const apertura = FechaLocal.comparar(INICIO_2027, hoy) <= 0 ? INICIO_2027 : hoy;

  const vigencia: VigenciaCiclo = {
    id: id(),
    diaInicio: DIA_INICIO_CICLO,
    rigeDesde: null,
    revision: revision(),
  };

  const cuentas: Cuenta[] = [];
  const tarjetas: Tarjeta[] = [];
  const cuenta = (tipo: 'efectivo' | 'tarjeta', nombre: string): Cuenta => {
    const c: Cuenta = {
      id: id(),
      tipo,
      nombre,
      institucionId: null,
      ultimos4: null,
      fechaApertura: apertura,
      orden: cuentas.length,
      archivada: false,
      revision: revision(),
    };
    cuentas.push(c);
    return c;
  };
  const efectivo = Array.from({ length: plan.efectivo }, (_, i) =>
    cuenta('efectivo', `Cuenta ${i}`),
  );
  const conTarjeta = Array.from({ length: plan.tarjetas }, (_, i) => {
    const c = cuenta('tarjeta', `Tarjeta ${i}`);
    tarjetas.push({
      cuentaId: c.id,
      tipo: 'tarjeta',
      limiteCredito: Centavos.desdeEntero(500_000),
      tasaAnualMillonesimas: null,
      diaCorte: 15,
      diaPago: 5,
      red: null,
      color: null,
      revision: revision(),
    });
    return c;
  });

  const grupos: Grupo[] = Array.from({ length: plan.grupos + 1 }, (_, i) => ({
    id: id(),
    nombre: `Grupo ${i}`,
    orden: i,
    archivado: false,
    claveSistema: null,
    revision: revision(),
  }));
  const categorias: Categoria[] = [];
  const categoria = (grupo: Grupo, clase: 'normal' | 'pago', tarjetaId: Uuid | null): Categoria => {
    const c: Categoria = {
      id: id(),
      grupoId: grupo.id,
      nombre: `Categoría ${categorias.length}`,
      orden: categorias.length,
      clase,
      tarjetaId,
      archivada: false,
      revision: revision(),
    };
    categorias.push(c);
    return c;
  };
  const normales = Array.from({ length: plan.normales }, (_, i) =>
    categoria(grupos[i % plan.grupos] as Grupo, 'normal', null),
  );
  // Una categoría de pago por tarjeta y viceversa (inv. 22), en el último grupo.
  const pagos = conTarjeta.map((t) => categoria(grupos[plan.grupos] as Grupo, 'pago', t.id));

  // Una celda es (categoría, período): la primera asignación de cada celda gana (DM-2).
  const periodos = INICIOS_PERIODO.filter((p) => FechaLocal.comparar(p, hoy) <= 0);
  const celdas = categorias.length * periodos.length;
  const asignaciones: Asignacion[] = [];
  const usadas = new Set<number>();
  for (const a of plan.asignaciones) {
    const celda = a.celda % Math.max(celdas, 1);
    if (celdas === 0 || usadas.has(celda)) continue;
    usadas.add(celda);
    asignaciones.push({
      id: id(),
      categoriaId: (categorias[celda % categorias.length] as Categoria).id,
      periodoInicio: periodos[Math.floor(celda / categorias.length)] as FechaLocal,
      monto: a.monto,
      revision: revision(),
    });
  }

  const todas = [...efectivo, ...conTarjeta];
  const ordenadas = [...plan.transacciones].sort((a, b) => FechaLocal.comparar(a.fecha, b.fecha));
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  ordenadas.forEach((p, i) => {
    const marca = instante(p.fecha, i + 1);
    const montos = p.clase === 'gasto' ? p.montos : [p.montos[0] as Centavos];
    const total = montos.reduce((s, m) => Centavos.sumar(s, m), Centavos.cero);
    const tipo = p.clase === 'pago' && conTarjeta.length > 0 ? 'pago_tarjeta' : tipoDe(p.clase);
    const tx: Transaccion = {
      id: id(),
      tipo,
      fecha: p.fecha,
      horaRegistro: marca,
      claveOrden: marca,
      secuencia: String(i + 1) as BigintTexto,
      origen: 'manual',
      estadoBancario: 'confirmada',
      conciliacionId: null,
      comercio: null,
      nota: null,
      total,
      monedaOriginal: null,
      montoOriginal: null,
      lineaCobradaId: null,
      revision: revision(),
    };
    const efecto = (c: Cuenta, monto: Centavos): void => {
      efectos.push({
        id: id(),
        transaccionId: tx.id,
        cuentaId: c.id,
        monto,
        interes: null,
        seguro: null,
        revision: revision(),
      });
    };
    const linea = (orden: number, monto: Centavos, c: Categoria): void => {
      lineas.push({
        id: id(),
        transaccionId: tx.id,
        orden,
        monto,
        categoriaId: c.id,
        deudorId: null,
        lineaOriginalId: null,
        revision: revision(),
      });
    };
    const enEfectivo = efectivo[p.cuenta % efectivo.length] as Cuenta;
    if (tipo === 'pago_tarjeta') {
      const destino = p.tarjeta % conTarjeta.length;
      efecto(enEfectivo, Centavos.negar(total));
      efecto(conTarjeta[destino] as Cuenta, total);
      linea(0, total, pagos[destino] as Categoria);
    } else if (tipo === 'gasto') {
      efecto(todas[p.cuenta % todas.length] as Cuenta, Centavos.negar(total));
      montos.forEach((m, k) => {
        linea(k, m, normales[(p.categorias[k] as number) % normales.length] as Categoria);
      });
    } else if (tipo === 'devolucion') {
      // D-2 sin compra original (01 §5): entrada en efectivo a una categoría normal.
      efecto(enEfectivo, total);
      linea(0, total, normales[(p.categorias[0] as number) % normales.length] as Categoria);
    } else {
      efecto(enEfectivo, total);
    }
    transacciones.push(tx);
  });

  return {
    vigencias_ciclo: [vigencia],
    cuentas,
    tarjetas,
    prestamos: [],
    inversiones: [],
    grupos,
    categorias,
    asignaciones,
    deudores: [],
    transacciones,
    efectos,
    lineas,
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
}

/**
 * Hechos válidos de V7-03 extendido: cuentas, ingresos, gastos de varias líneas, pagos de tarjeta,
 * asignaciones y devoluciones D-2. Respeta inv. 6 (Σ líneas = total; el ingreso no tiene líneas),
 * 12 (apertura ≤ fecha ≤ `hoy`), 22 (una categoría de pago por tarjeta), DM-2 (una asignación por
 * categoría y período) y CB-21 (claves de orden únicas, `secuencia` creciente con la clave).
 */
export function hechosArb(hoy: FechaLocal): fc.Arbitrary<Hechos> {
  return planArb(hoy).map((plan) => construir(plan, hoy));
}
