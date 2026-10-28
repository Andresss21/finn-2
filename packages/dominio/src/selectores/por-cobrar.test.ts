// PRU-DOM-COBRO-102: por cobrar por deudor, programadas con próximos pagos a 30 días (BE-37, CF-20) y
// los contextos de formulario de la ola 2 (cobrar, condonar, devolver y las candidatas de devolución
// de un movimiento), sobre un estado armado a mano (hoy = 2027-04-15).
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Categoria,
  Cuenta,
  Efecto,
  Hechos,
  Instante,
  Linea,
  MovimientoLinea,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import type { DatosDeBandeja } from './bandeja';
import { formulario } from './formulario';
import { porCobrar } from './por-cobrar';
import { programadas } from './programadas';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

const cuentas = [
  { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', orden: 1 },
  { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa', orden: 2 },
  { id: id('pr'), tipo: 'prestamo', nombre: 'Préstamo', orden: 3 },
].map((x) => ({
  archivada: false,
  institucionId: null,
  ultimos4: null,
  fechaApertura: f('2027-01-01'),
  ...x,
})) as Cuenta[];

const grupos = [
  { id: id('hogar'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null },
  { id: id('ocio'), nombre: 'Ocio', orden: 2, archivado: false, claveSistema: null },
  { id: id('pagos'), nombre: 'Pagos', orden: 3, archivado: false, claveSistema: 'pagos' },
];
const categorias = [
  { id: id('super'), grupoId: id('hogar'), nombre: 'Super', orden: 1, clase: 'normal' },
  { id: id('ropa'), grupoId: id('hogar'), nombre: 'Ropa', orden: 2, clase: 'normal' },
  { id: id('viajes'), grupoId: id('ocio'), nombre: 'Viajes', orden: 1, clase: 'normal' },
  {
    id: id('pago-vi'),
    grupoId: id('pagos'),
    nombre: 'Pago Visa',
    orden: 1,
    clase: 'pago',
    tarjetaId: id('vi'),
  },
].map((x) => ({ tarjetaId: null, archivada: false, ...x })) as Categoria[];

const transacciones: Transaccion[] = [];
const efectos: Efecto[] = [];
const lineas: Linea[] = [];
interface LineaDeAlta {
  readonly monto: number;
  readonly cat?: string;
  readonly deudor?: string;
  readonly original?: string;
}
function alta(
  tx: string,
  tipo: Transaccion['tipo'],
  fecha: string,
  cuenta: string,
  monto: number,
  ls: readonly LineaDeAlta[] = [],
  extra: Partial<Transaccion> = {},
) {
  const instante = `${fecha}T12:00:00.000Z`;
  transacciones.push({
    id: id(tx),
    tipo,
    fecha: f(fecha),
    horaRegistro: instante,
    claveOrden: instante,
    secuencia: String(transacciones.length + 1),
    origen: 'manual',
    estadoBancario: 'confirmada',
    conciliacionId: null,
    comercio: null,
    nota: null,
    total: c(Math.abs(monto)),
    lineaCobradaId: null,
    ...extra,
  } as unknown as Transaccion);
  efectos.push({
    id: id(`ef-${tx}`),
    transaccionId: id(tx),
    cuentaId: id(cuenta),
    monto: c(monto),
    interes: null,
    seguro: null,
  } as Efecto);
  ls.forEach((l, k) =>
    lineas.push({
      id: id(`${tx}-${k}`),
      transaccionId: id(tx),
      orden: k + 1,
      monto: c(l.monto),
      categoriaId: l.cat === undefined ? null : id(l.cat),
      deudorId: l.deudor === undefined ? null : id(l.deudor),
      lineaOriginalId: l.original === undefined ? null : id(l.original),
    } as Linea),
  );
}
alta('si', 'saldo_inicial', '2027-01-05', 'ef', 5000);
// Cena de 100 en efectivo: 60 al super y 40 por cobrar a Ana; Ana paga 15.
alta(
  'g1',
  'gasto',
  '2027-04-01',
  'ef',
  -100,
  [
    { monto: 60, cat: 'super' },
    { monto: 40, deudor: 'ana' },
  ],
  {
    comercio: 'Cena',
  },
);
// Cine de 30 con Visa, todo por cobrar a Beto; se le condonan 10.
alta('g2', 'gasto', '2027-04-02', 'vi', -30, [{ monto: 30, deudor: 'beto' }], { comercio: 'Cine' });
alta('g3', 'gasto', '2027-04-03', 'ef', -50, [{ monto: 50, cat: 'super' }], {
  comercio: 'Mercado',
});
// Ana debe 10 más y los paga el 12: queda cerrada.
alta('g4', 'gasto', '2027-04-04', 'ef', -10, [{ monto: 10, deudor: 'ana' }], { comercio: 'Taxi' });
alta('c1', 'cobro', '2027-04-05', 'ef', 15, [], { lineaCobradaId: id('g1-1') });
alta('c2', 'cobro', '2027-04-12', 'ef', 10, [], { lineaCobradaId: id('g4-0') });
alta('d1', 'devolucion', '2027-04-06', 'ef', 20, [{ monto: 20, cat: 'super', original: 'g3-0' }]);

const programada = (x: Record<string, unknown>) => ({
  tipo: 'gasto',
  cuentaDestinoId: null,
  tolerancia: c(1),
  frecuenciaDias: null,
  fechaFin: null,
  registroAutomatico: false,
  activa: true,
  reactivadaDesde: null,
  ...x,
});
const hechos = {
  vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
  cuentas,
  tarjetas: [
    {
      cuentaId: id('vi'),
      tipo: 'tarjeta',
      diaCorte: 10,
      diaPago: 28,
      limiteCredito: c(1000),
      red: null,
      color: null,
    },
  ],
  prestamos: [
    {
      cuentaId: id('pr'),
      tipo: 'prestamo',
      contraparte: 'Banco',
      montoOriginal: c(500),
      tasaNominalAnualMillonesimas: null,
      tipoTasa: 'fija',
      seguroPrimerMes: null,
      comision: null,
      frecuencia: 'mensual',
      frecuenciaDias: null,
      cuotaPactada: c(40),
      plazoCuotas: 12,
      modeloCalculo: null,
      cuotasPagadasAlCrear: 0,
    },
  ],
  inversiones: [],
  grupos,
  categorias,
  asignaciones: [
    { id: id('a1'), categoriaId: id('super'), periodoInicio: f('2027-03-01'), monto: c(100) },
    { id: id('a2'), categoriaId: id('super'), periodoInicio: f('2027-04-01'), monto: c(80) },
  ],
  deudores: [
    { id: id('ana'), nombre: 'Ana' },
    { id: id('beto'), nombre: 'Beto' },
  ],
  transacciones,
  efectos,
  lineas,
  condonaciones: [
    {
      id: id('k1'),
      lineaId: id('g2-0'),
      fecha: f('2027-04-10'),
      monto: c(10),
      claveOrden: '2027-04-10T12:00:00.000Z',
      secuencia: null,
      categoriaId: id('super'),
    },
  ],
  metas: [],
  programadas: [
    programada({
      id: id('pg'),
      cuentaId: id('ef'),
      comercio: 'Netflix',
      monto: c(10),
      frecuencia: 'mensual',
      primeraFecha: f('2027-01-20'),
    }),
    // CF-20: reactivada el 10 de abril, no genera las del tramo inactivo.
    programada({
      id: id('pg2'),
      cuentaId: id('ef'),
      comercio: 'Gimnasio',
      monto: c(20),
      frecuencia: 'semanal',
      primeraFecha: f('2027-04-01'),
      reactivadaDesde: f('2027-04-10'),
    }),
    programada({
      id: id('pg3'),
      tipo: 'cuota_prestamo',
      cuentaId: id('ef'),
      cuentaDestinoId: id('pr'),
      comercio: 'Cuota',
      monto: c(40),
      frecuencia: 'mensual',
      primeraFecha: f('2027-03-25'),
      registroAutomatico: true,
    }),
    programada({
      id: id('pg4'),
      cuentaId: id('ef'),
      comercio: 'Vieja',
      monto: c(5),
      frecuencia: 'mensual',
      primeraFecha: f('2027-01-01'),
      activa: false,
    }),
  ],
  programada_lineas: [
    ['pgl', 'pg', 10, 'super'],
    ['pgl2', 'pg2', 20, 'super'],
    ['pgl3', 'pg3', 40, 'ropa'],
    ['pgl4', 'pg4', 5, 'super'],
  ].map(([lid, pid, m, cat]) => ({
    id: id(lid as string),
    programadaId: id(pid as string),
    orden: 1,
    monto: c(m as number),
    categoriaId: id(cat as string),
  })),
  ocurrencias_resueltas: ['2027-01-20', '2027-02-20', '2027-03-20'].map((d) => ({
    id: id(`r-${d}`),
    programadaId: id('pg'),
    fechaEsperada: f(d),
    estado: 'registrada',
    transaccionId: id('g3'),
  })),
  conciliaciones: [],
} as unknown as Hechos;
const i = calcular(hechos, f('2027-04-15'));

describe('PRU-DOM-COBRO-102: por cobrar, programadas y contextos de formulario de la ola 2', () => {
  it('PRU-DOM-COBRO-102 SEL-porCobrar: deudores por nombre con estado de cada línea, dinero en camino y categoría propuesta de la condonación', () => {
    const x = porCobrar(i);
    expect(x.totalAbierto).toBe(c(45));
    expect(x.enCamino).toBe(c(25));
    expect(x.deudores.map((d) => [d.deudor.nombre, d.abierto])).toEqual([
      ['Ana', c(25)],
      ['Beto', c(20)],
    ]);
    const [ana, beto] = x.deudores;
    expect(ana?.items).toEqual([
      {
        ...{ lineaId: 'g1-1', transaccionId: 'g1', fechaOrigen: f('2027-04-01'), comercio: 'Cena' },
        ...{ monto: c(40), restituido: c(15), condonado: c(0), devuelto: c(0), abierto: c(25) },
        medio: 'debito',
        estado: 'parcial',
        categoriaPropuestaCondonacion: { id: 'super', nombre: 'Super' },
      },
    ]);
    expect(beto?.items[0]).toMatchObject({
      ...{ lineaId: 'g2-0', medio: 'tarjeta', estado: 'parcial', condonado: c(10) },
      ...{ abierto: c(20), restituido: c(0) },
    });
    expect(beto?.items[0]?.categoriaPropuestaCondonacion).toBeUndefined();
    const todo = porCobrar(i, { incluirCerrados: true });
    expect(todo.deudores[0]?.items.map((y) => [y.lineaId, y.estado])).toEqual([
      ['g1-1', 'parcial'],
      ['g4-0', 'cerrado'],
    ]);
    expect(todo.deudores[0]?.items[1]?.categoriaPropuestaCondonacion).toBeUndefined();
    expect(todo.totalAbierto).toBe(c(45));
  });

  it('PRU-DOM-COBRO-102 SEL-programadas: próximos pagos a 30 días desde las ocurrencias del motor, con reactivación (CF-20), atrasadas y permisos', () => {
    const x = programadas(i);
    expect(x.programadas.map((p) => p.comercio)).toEqual(['Cuota', 'Gimnasio', 'Netflix', 'Vieja']);
    expect(x.proximosPagos.map((o) => [o.fechaEsperada, o.programada.id, o.atrasada])).toEqual([
      ['2027-03-25', 'pg3', true],
      ['2027-04-15', 'pg2', false],
      ['2027-04-20', 'pg', false],
      ['2027-04-22', 'pg2', false],
      ['2027-04-25', 'pg3', false],
      ['2027-04-29', 'pg2', false],
      ['2027-05-06', 'pg2', false],
      ['2027-05-13', 'pg2', false],
    ]);
    const por = (pid: string) => x.programadas.find((p) => p.id === pid);
    expect(por('pg2')?.proximas).toEqual(
      ['2027-04-15', '2027-04-22', '2027-04-29', '2027-05-06', '2027-05-13'].map(f),
    );
    expect(por('pg3')?.atrasadas).toEqual([f('2027-03-25')]);
    expect(por('pg')?.proximas).toEqual([f('2027-04-20')]);
    expect(por('pg4')).toMatchObject({ proximas: [], atrasadas: [], activa: false });
    expect(por('pg3')).toMatchObject({ avisoSinModelo: true, cuentaDestino: { id: 'pr' } });
    expect(por('pg')).toMatchObject({ avisoSinModelo: false, calendarioEditable: false });
    expect(por('pg')?.puedeEliminar).toBe(false);
    expect(por('pg2')).toMatchObject({ calendarioEditable: true, puedeEliminar: true });
    expect(por('pg2')?.lineas).toEqual([
      { categoria: { id: 'super', nombre: 'Super' }, monto: c(20) },
    ]);
    expect(programadas(i, {}, 7).proximosPagos.map((o) => o.fechaEsperada)).toEqual(
      ['2027-03-25', '2027-04-15', '2027-04-20', '2027-04-22'].map(f),
    );
    expect(() => programadas(i, {}, 31)).toThrow(RangeError);
    const movimiento = { esperadaProgramadaId: id('pg2'), estado: 'con_coincidencia' };
    const r = programadas(i, {
      movimientos: [movimiento as never],
      smsPorProgramada: new Map([[id('pg3'), 1]]),
    });
    expect(r.programadas.find((p) => p.id === 'pg2')).toMatchObject({
      calendarioEditable: false,
      puedeEliminar: false,
    });
    expect(r.programadas.find((p) => p.id === 'pg3')).toMatchObject({
      calendarioEditable: true,
      puedeEliminar: false,
    });
  });

  it('PRU-DOM-COBRO-102 SEL-formulario cobrar y condonar: líneas abiertas a la fecha, tarjeta con propuesta AV-22 y categoría propuesta', () => {
    const x = formulario(i, { operacion: 'cobrar' });
    expect(Object.keys(x.catalogos).sort()).toEqual(['categoriasPago', 'cuentas', 'deudores']);
    expect(x.contexto.lineas.map((l) => [l.lineaId, l.abierto, l.medio, l.propuestaAV22])).toEqual([
      ['g1-1', c(25), 'debito', false],
      ['g2-0', c(20), 'tarjeta', true],
    ]);
    expect(x.contexto.lineas[1]?.tarjeta).toEqual({ id: 'vi', nombre: 'Visa' });
    expect(x.contexto.lineas[0]).toMatchObject({
      transaccionId: 'g1',
      comercio: 'Cena',
      monto: c(40),
    });
    const beto = formulario(i, { operacion: 'cobrar', deudorId: id('beto') });
    expect(beto.contexto.lineas.map((l) => l.lineaId)).toEqual(['g2-0']);
    const alDia4 = formulario(i, { operacion: 'cobrar', fecha: f('2027-04-04') });
    expect(alDia4.contexto.lineas.map((l) => [l.lineaId, l.abierto])).toEqual([
      ['g1-1', c(40)],
      ['g2-0', c(30)],
      ['g4-0', c(10)],
    ]);
    expect(() => formulario(i, { operacion: 'cobrar', lineaId: id('g3-0') })).toThrow(RangeError);
    const k = formulario(i, { operacion: 'condonar', lineaId: id('g1-1') });
    expect(Object.keys(k.catalogos)).toEqual(['categorias']);
    expect(k.contexto).toEqual({
      linea: {
        lineaId: 'g1-1',
        deudor: { id: 'ana', nombre: 'Ana' },
        abierto: c(25),
        medio: 'debito',
        fechaOrigen: f('2027-04-01'),
      },
      categoriaPropuesta: { id: 'super', nombre: 'Super' },
    });
    expect(
      formulario(i, { operacion: 'condonar', lineaId: id('g2-0') }).contexto.categoriaPropuesta,
    ).toBeUndefined();
  });

  it('PRU-DOM-COBRO-102 SEL-formulario devolver: candidatas con restante, búsqueda, y la compra con la capacidad de OP-33 por línea', () => {
    const x = formulario(i, { operacion: 'devolver' });
    expect(Object.keys(x.catalogos)).toEqual(['cuentas']);
    expect(
      'candidatas' in x.contexto && x.contexto.candidatas.map((y) => [y.transaccionId, y.restante]),
    ).toEqual([
      ['g4', c(10)],
      ['g3', c(30)],
      ['g2', c(30)],
      ['g1', c(100)],
    ]);
    const m = formulario(i, { operacion: 'devolver', busqueda: ' MERC ' });
    expect('candidatas' in m.contexto && m.contexto.candidatas).toEqual([
      {
        transaccionId: 'g3',
        fecha: f('2027-04-03'),
        comercio: 'Mercado',
        cuenta: { id: 'ef', nombre: 'Efectivo' },
        total: c(50),
        restante: c(30),
      },
    ]);
    const g3 = formulario(i, { operacion: 'devolver', transaccionOriginalId: id('g3') });
    expect('compra' in g3.contexto && g3.contexto.compra).toMatchObject({
      devuelto: c(20),
      restante: c(30),
    });
    expect('lineas' in g3.contexto && g3.contexto.lineas).toEqual([
      {
        lineaId: 'g3-0',
        destino: { id: 'super', nombre: 'Super', tipo: 'categoria' },
        monto: c(50),
        devuelto: c(20),
        capacidad: c(30),
      },
    ]);
    const g1 = formulario(i, { operacion: 'devolver', transaccionOriginalId: id('g1') });
    // La línea por cobrar admite lo abierto (25), no el monto (40): inv. 9.
    expect(
      'lineas' in g1.contexto &&
        g1.contexto.lineas.map((l) => [l.lineaId, l.destino.tipo, l.capacidad]),
    ).toEqual([
      ['g1-0', 'categoria', c(60)],
      ['g1-1', 'deudor', c(25)],
    ]);
    expect(() => formulario(i, { operacion: 'devolver', transaccionOriginalId: id('c1') })).toThrow(
      RangeError,
    );
  });

  it('PRU-DOM-COBRO-102 SEL-formulario movimiento: las candidatas de devolución filtradas por cuenta, monto y fecha del movimiento', () => {
    const mov = (mid: string, tipo: string) => ({
      movimiento: {
        id: id(mid),
        smsId: id(`sms-${mid}`),
        estado: 'pendiente',
        cuentaId: id('ef'),
        fecha: f('2027-04-14'),
        monto: c(20),
        comercio: null,
        tipoPropuesto: tipo,
        nota: null,
        duplicadoTransaccionId: null,
        duplicadoMovimientoId: null,
        esperadaProgramadaId: null,
        esperadaFecha: null,
        transaccionId: null,
      },
      lineas: [] as MovimientoLinea[],
    });
    const datos = {
      movimientos: [mov('m1', 'devolucion'), mov('m2', 'gasto')],
      sms: ['m1', 'm2'].map((m) => ({
        id: id(`sms-${m}`),
        texto: `SMS ${m}`,
        remitente: 'Banco',
        recibidoEn: '2027-04-14T10:00:00.000Z' as Instante,
      })),
      procesamientos: [],
      formatos: [],
      reglas: [],
    } as unknown as DatosDeBandeja;
    const d = formulario(
      i,
      { operacion: 'movimiento', movimientoId: id('m1') },
      { bandeja: datos },
    );
    expect(d.contexto.candidatas?.map((y) => [y.transaccionId, y.restante])).toEqual([
      ['g3', c(30)],
      ['g1', c(100)],
    ]);
    const g = formulario(
      i,
      { operacion: 'movimiento', movimientoId: id('m2') },
      { bandeja: datos },
    );
    expect('candidatas' in g.contexto).toBe(false);
  });
});
