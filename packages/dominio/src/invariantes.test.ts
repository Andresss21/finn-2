import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import * as actividad from './calculo/actividad';
import { calcular } from './calculo/calcular';
import * as clasificacion from './calculo/clasificacion';
import * as d2 from './calculo/d2';
import * as devoluciones from './calculo/devoluciones';
import * as disponible from './calculo/disponible';
import * as lpa from './calculo/lpa';
import * as metas from './calculo/metas';
import * as ocurrencias from './calculo/ocurrencias';
import * as patrimonio from './calculo/patrimonio';
import * as periodos from './calculo/periodos';
import * as porCobrar from './calculo/por-cobrar';
import * as saldos from './calculo/saldos';
import * as sobregiros from './calculo/sobregiros';
import * as tarjetas from './calculo/tarjetas';
import type {
  BigintTexto,
  Categoria,
  Cuenta,
  Efecto,
  Hechos,
  Instante,
  Instantanea,
  Linea,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from './hechos';
import * as publico from './index';
import { verificarInvariantes } from './invariantes';
import { hechosArb } from './pruebas/generadores';
import { Centavos } from './valores/centavos';
import { FechaLocal } from './valores/fecha-local';

const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

// ───────────── Hechos de ejemplo (ciclo del día 1, hoy 15 de marzo de 2027) ─────────────

const HOY = FechaLocal.desdeTexto('2027-03-15');
const f = FechaLocal.desdeTexto;
const c = Centavos.desdeEntero;
const id = (x: string) => `00000000-0000-4000-a000-${x.padStart(12, '0')}` as Uuid;
const [E, T, X, G, C1, C2, P, D] = ['e', 't', 'a', 'g', 'c1', 'c2', 'p', 'd'].map(id) as [
  Uuid,
  Uuid,
  Uuid,
  Uuid,
  Uuid,
  Uuid,
  Uuid,
  Uuid,
];

const cuenta = (cuentaId: Uuid, tipo: Cuenta['tipo'], archivada = false): Cuenta => ({
  id: cuentaId,
  tipo,
  nombre: cuentaId,
  institucionId: null,
  ultimos4: null,
  fechaApertura: f('2027-01-01'),
  orden: 0,
  archivada,
  revision: null,
});
const categoria = (
  x: Uuid,
  clase: Categoria['clase'],
  tarjetaId: Uuid | null = null,
): Categoria => ({
  id: x,
  grupoId: G,
  nombre: x,
  orden: 0,
  clase,
  tarjetaId,
  archivada: false,
  revision: null,
});
let n = 0;
const tx = (
  x: string,
  tipo: TipoTransaccion,
  fecha: string,
  total: number,
  lineaCobradaId: Uuid | null = null,
): Transaccion => {
  n += 1;
  const marca = `${fecha}T12:00:${String(n).padStart(2, '0')}.000Z` as Instante;
  return {
    id: id(x),
    tipo,
    fecha: f(fecha),
    horaRegistro: marca,
    claveOrden: marca,
    secuencia: String(n) as BigintTexto,
    origen: 'manual',
    estadoBancario: 'confirmada',
    conciliacionId: null,
    comercio: null,
    nota: null,
    total: c(total),
    monedaOriginal: null,
    montoOriginal: null,
    lineaCobradaId,
    revision: null,
  };
};
const efecto = (x: string, t: string, cuentaId: Uuid, monto: number): Efecto => ({
  id: id(x),
  transaccionId: id(t),
  cuentaId,
  monto: c(monto),
  interes: null,
  seguro: null,
  revision: null,
});
const linea = (x: string, t: string, monto: number, destino: Partial<Linea>): Linea => ({
  id: id(x),
  transaccionId: id(t),
  orden: 0,
  monto: c(monto),
  categoriaId: null,
  deudorId: null,
  lineaOriginalId: null,
  revision: null,
  ...destino,
});
const asignacion = (x: string, categoriaId: Uuid, inicio: string, monto: number) => ({
  id: id(x),
  categoriaId,
  periodoInicio: f(inicio),
  monto: c(monto),
  revision: null,
});
const meta = (x: string, categoriaId: Uuid) => ({
  id: id(x),
  categoriaId,
  tipo: 'mensual' as const,
  modo: 'acumular' as const,
  monto: c(20000),
  fechaObjetivo: null,
  fechaCreacion: f('2027-01-01'),
  revision: null,
});

const HECHOS: Hechos = {
  vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
  cuentas: [cuenta(E, 'efectivo'), cuenta(T, 'tarjeta'), cuenta(X, 'efectivo', true)],
  tarjetas: [
    {
      cuentaId: T,
      tipo: 'tarjeta',
      limiteCredito: c(500000),
      tasaAnualMillonesimas: null,
      diaCorte: 15,
      diaPago: 5,
      red: null,
      color: null,
      revision: null,
    },
  ],
  prestamos: [],
  inversiones: [],
  grupos: [{ id: G, nombre: 'G', orden: 0, archivado: false, claveSistema: null, revision: null }],
  categorias: [categoria(C1, 'normal'), categoria(C2, 'normal'), categoria(P, 'pago', T)],
  asignaciones: [
    asignacion('a1', C1, '2027-01-01', 30000),
    asignacion('a2', P, '2027-03-01', 5000),
    asignacion('a3', C1, '2027-04-01', 1000),
  ],
  deudores: [{ id: D, nombre: 'Ana', revision: null }],
  transacciones: [
    tx('t1', 'ingreso', '2027-01-05', 100000),
    tx('t2', 'gasto', '2027-01-10', 20000),
    tx('t3', 'gasto', '2027-03-03', 8000),
    tx('t4', 'devolucion', '2027-02-10', 3000),
    tx('t5', 'cobro', '2027-02-15', 2000, id('l2')),
    tx('t6', 'pago_tarjeta', '2027-03-05', 4000),
  ],
  efectos: [
    efecto('e1', 't1', E, 100000),
    efecto('e2', 't2', E, -20000),
    efecto('e3', 't3', T, -8000),
    efecto('e4', 't4', E, 3000),
    efecto('e5', 't5', E, 2000),
    efecto('e6', 't6', E, -4000),
    efecto('e7', 't6', T, 4000),
  ],
  lineas: [
    linea('l1', 't2', 15000, { categoriaId: C1 }),
    linea('l2', 't2', 5000, { deudorId: D, orden: 1 }),
    linea('l3', 't3', 8000, { categoriaId: C2 }),
    linea('l4', 't4', 3000, { categoriaId: C1, lineaOriginalId: id('l1') }),
    linea('l5', 't6', 4000, { categoriaId: P }),
  ],
  condonaciones: [
    {
      id: id('k1'),
      lineaId: id('l2'),
      fecha: f('2027-03-01'),
      monto: c(1000),
      claveOrden: '2027-03-01T12:00:00.000Z' as Instante,
      secuencia: '100' as BigintTexto,
      categoriaId: C1,
      revision: null,
    },
  ],
  metas: [meta('m1', C1)],
  programadas: [
    {
      id: id('r1'),
      tipo: 'gasto',
      cuentaId: E,
      cuentaDestinoId: null,
      comercio: 'Luz',
      monto: c(3000),
      tolerancia: c(0),
      frecuencia: 'mensual',
      frecuenciaDias: null,
      primeraFecha: f('2027-01-20'),
      fechaFin: null,
      registroAutomatico: false,
      activa: true,
      revision: null,
    },
  ],
  programada_lineas: [
    {
      id: id('rl1'),
      programadaId: id('r1'),
      orden: 0,
      monto: c(3000),
      categoriaId: C2,
      revision: null,
    },
  ],
  ocurrencias_resueltas: [
    {
      id: id('o1'),
      programadaId: id('r1'),
      fechaEsperada: f('2027-01-20'),
      estado: 'omitida',
      transaccionId: null,
      revision: null,
    },
  ],
  conciliaciones: [],
};

// ───────────── Alteraciones ─────────────

const I = calcular(HECHOS, HOY);
const conHechos = (cambio: Partial<Hechos>): Instantanea => ({
  ...I,
  hechos: { ...I.hechos, ...cambio },
});
const cambiar = <T extends { readonly id: Uuid }>(xs: readonly T[], x: Uuid, cambio: Partial<T>) =>
  xs.map((y) => (y.id === x ? { ...y, ...cambio } : y));
const masUno = (x: Centavos) => Centavos.sumar(x, c(1));
const rotas = (i: Instantanea) => [...new Set(verificarInvariantes(i).map((v) => v.invariante))];
const h = I.hechos;

const ALTERADAS: readonly [string, Instantanea, readonly number[]][] = [
  ['LPA + 1', { ...I, lpa: { ...I.lpa, total: masUno(I.lpa.total) } }, [1]],
  [
    'S(t) + 1',
    { ...I, tarjetas: I.tarjetas.map((x) => ({ ...x, sinRespaldo: masUno(x.sinRespaldo) })) },
    [2],
  ],
  [
    'RE(t) + 1',
    {
      ...I,
      tarjetas: I.tarjetas.map((x) => ({ ...x, reservaExcedente: masUno(x.reservaExcedente) })),
    },
    [3],
  ],
  ['un efecto más en E', conHechos({ efectos: [...h.efectos, efecto('e9', 't1', E, 1)] }), [4]],
  ['líneas ≠ total', conHechos({ lineas: cambiar(h.lineas, id('l3'), { monto: c(7000) }) }), [6]],
  [
    'línea en un tipo sin líneas',
    conHechos({ lineas: [...h.lineas, linea('l9', 't1', 1, { categoriaId: C1 })] }),
    [6],
  ],
  [
    'gasto en la categoría de pago',
    conHechos({ lineas: cambiar(h.lineas, id('l1'), { categoriaId: P }) }),
    [8],
  ],
  [
    'pago de tarjeta en una categoría normal',
    conHechos({ lineas: cambiar(h.lineas, id('l5'), { categoriaId: C2 }) }),
    [8],
  ],
  [
    'línea sin destino',
    conHechos({ lineas: cambiar(h.lineas, id('l3'), { categoriaId: null }) }),
    [8],
  ],
  [
    'condonado de más',
    { ...I, porCobrar: I.porCobrar.map((x) => ({ ...x, condonado: c(x.monto) })) },
    [9],
  ],
  [
    'saldo abierto negativo',
    { ...I, porCobrar: I.porCobrar.map((x) => ({ ...x, abierto: c(-1) })) },
    [9],
  ],
  [
    'devolución mayor que la línea',
    conHechos({
      lineas: cambiar(h.lineas, id('l4'), { monto: c(16000) }),
      transacciones: cambiar(h.transacciones, id('t4'), { total: c(16000) }),
    }),
    [10],
  ],
  [
    'devoluciones mayores que el total',
    conHechos({ transacciones: cambiar(h.transacciones, id('t2'), { total: c(2000) }) }),
    [6, 11],
  ],
  [
    'transacción posterior a hoy',
    conHechos({ transacciones: cambiar(h.transacciones, id('t3'), { fecha: f('2027-03-20') }) }),
    [12],
  ],
  [
    'transacción anterior a la apertura',
    conHechos({ transacciones: cambiar(h.transacciones, id('t1'), { fecha: f('2026-12-31') }) }),
    [12],
  ],
  [
    'condonación anterior a la compra',
    conHechos({ condonaciones: cambiar(h.condonaciones, id('k1'), { fecha: f('2027-01-05') }) }),
    [12],
  ],
  [
    'cobro anterior a la compra',
    conHechos({ transacciones: cambiar(h.transacciones, id('t5'), { fecha: f('2027-01-09') }) }),
    [12],
  ],
  [
    'hueco entre períodos',
    {
      ...I,
      presupuesto: { ...I.presupuesto, periodos: I.presupuesto.periodos.filter((_, k) => k !== 1) },
    },
    [17],
  ],
  [
    'activo que no contiene hoy',
    {
      ...I,
      presupuesto: {
        ...I.presupuesto,
        activo: I.presupuesto.periodos[0] as Instantanea['presupuesto']['activo'],
      },
    },
    [1, 2, 17],
  ],
  [
    'dos categorías de pago para T',
    conHechos({ categorias: [...h.categorias, categoria(id('p2'), 'pago', T)] }),
    [22],
  ],
  [
    'categoría de pago sin tarjeta',
    conHechos({ categorias: [...h.categorias, categoria(id('p3'), 'pago', E)] }),
    [22],
  ],
  ['meta en la categoría de pago', conHechos({ metas: [...h.metas, meta('m2', P)] }), [23]],
  [
    'cuenta archivada con saldo',
    conHechos({ cuentas: cambiar(h.cuentas, E, { archivada: true }) }),
    [24],
  ],
  [
    'asignación a una categoría inexistente',
    conHechos({ asignaciones: [...h.asignaciones, asignacion('a9', id('zz'), '2027-01-01', 1)] }),
    [25],
  ],
  [
    'efecto en una cuenta inexistente',
    conHechos({ efectos: [...h.efectos, efecto('e8', 't1', id('zz'), 1)] }),
    [25],
  ],
  [
    'SobT mayor que el sobregiro',
    {
      ...I,
      presupuesto: {
        ...I.presupuesto,
        celdas: I.presupuesto.celdas.map((x) =>
          x.sobT > 0 ? { ...x, sobT: masUno(x.reinicio) } : x,
        ),
      },
    },
    [28],
  ],
  [
    'SobT negativo',
    {
      ...I,
      presupuesto: {
        ...I.presupuesto,
        celdas: I.presupuesto.celdas.map((x, k) => (k === 0 ? { ...x, sobT: c(-1) } : x)),
      },
    },
    [28],
  ],
];

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-108 [INV-01, INV-02, INV-03, INV-04, INV-06, INV-08, INV-09, INV-10, INV-11, INV-12, INV-17, INV-22, INV-23, INV-24, INV-25, INV-28] verificarInvariantes detecta cada invariante calculable roto en una instantánea alterada, y ninguno en una correcta (04 §2.4)', () => {
    // La de ejemplo tiene de todo lo que se altera: S(t) > 0, sobregiro con tarjeta, un por cobrar
    // con cobro y condonación, una devolución vinculada, una cuenta archivada y una meta.
    expect(I.tarjetas[0]?.sinRespaldo).toBeGreaterThan(0);
    expect(I.sobregiroConTarjeta).toBeGreaterThan(0);
    expect(I.porCobrar[0]?.eventos).toHaveLength(2);
    expect(I.metas).toHaveLength(1);
    expect(I.ocurrencias.length).toBeGreaterThan(0);
    expect(I.historialLpa).toHaveLength(2);
    expect(verificarInvariantes(I)).toEqual([]);
    // Con el activo cambiado, inv. 1 y 2 se leen en otro período y también fallan.
    expect(ALTERADAS.map(([nombre, alterada]) => ({ nombre, rotas: rotas(alterada) }))).toEqual(
      ALTERADAS.map(([nombre, , rotas]) => ({ nombre, rotas })),
    );
  });

  // Plazo propio, mismo criterio que bb312c2 (#33): en el run 40355731276 de ci.yml en main
  // (runner de GitHub, cobertura v8) tardó 3424 ms, cerca de los 5 s por defecto. Mismos casos.
  it('PRU-DOM-MOTOR-108 [INV-01, INV-02, INV-03, INV-04, INV-17, INV-28] ninguna invariante rota en la instantánea de hechos válidos cualesquiera', () => {
    fc.assert(
      fc.property(hechosArb(FechaLocal.desdeTexto('2027-12-31')), (x) => {
        expect(verificarInvariantes(calcular(x, FechaLocal.desdeTexto('2027-12-31')))).toEqual([]);
      }),
      opciones,
    );
  }, 60_000);

  it('PRU-DOM-MOTOR-108 [INV-27] la API pública de @finn/dominio no exporta ninguna fórmula de calculo/', () => {
    // Fórmulas internas: todo lo que exportan los módulos de calculo/ (calcular.ts es la entrada pública).
    const internas = new Set<unknown>(
      [
        actividad,
        clasificacion,
        d2,
        devoluciones,
        disponible,
        lpa,
        metas,
        ocurrencias,
        patrimonio,
        periodos,
        porCobrar,
        saldos,
        sobregiros,
        tarjetas,
      ].flatMap((m: object): unknown[] => Object.values(m)),
    );
    const exportado = Object.entries(publico);
    expect(exportado.filter(([, v]) => internas.has(v)).map(([k]) => k)).toEqual([]);
    expect(Object.keys(publico).sort()).toEqual([
      'aplicar',
      'avisosDeEstado',
      'calcular',
      'formaCanonicaDelImpacto',
      'verificarInvariantes',
    ]);
    expect(publico.calcular).toBe(calcular);
    expect(publico.verificarInvariantes).toBe(verificarInvariantes);
  });
});
