// PRU-DOM-COBRO-103: contextos de formulario `fusionar`, `programada`, `regla`, `conciliar` y
// `verificar_saldo` con su catálogo y sus rechazos (04 §6.14.4, §6.14.4.1), sobre un estado armado a
// mano (hoy = 2027-04-15; programadas y resoluciones como en PRU-DOM-COBRO-102).
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Categoria,
  Cuenta,
  Efecto,
  Hechos,
  Linea,
  ReglaComercio,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { formulario } from './formulario';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

const cuentas = [
  { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', orden: 1 },
  { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa', orden: 2 },
  { id: id('pr'), tipo: 'prestamo', nombre: 'Préstamo', orden: 3 },
].map((x) => ({
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
function alta(
  tx: string,
  tipo: Transaccion['tipo'],
  fecha: string,
  cuenta: string,
  monto: number,
  ls: readonly { monto: number; cat?: string; deudor?: string }[] = [],
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
      lineaOriginalId: null,
    } as Linea),
  );
}
alta('si', 'saldo_inicial', '2027-01-05', 'ef', 5000);
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
  { comercio: 'Cena' },
);
alta('g3', 'gasto', '2027-04-03', 'ef', -50, [{ monto: 50, cat: 'super' }], {
  estadoBancario: 'pendiente',
});
alta('g5', 'gasto', '2027-04-10', 'ef', -20, [{ monto: 20, cat: 'super' }], {
  estadoBancario: 'conciliada',
  conciliacionId: id('cn1'),
});
alta('g6', 'gasto', '2027-04-12', 'vi', -30, [{ monto: 30, cat: 'ropa' }]);

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
      ...{ cuentaId: id('pr'), tipo: 'prestamo', contraparte: 'Banco', montoOriginal: c(500) },
      ...{
        tasaNominalAnualMillonesimas: null,
        tipoTasa: 'fija',
        seguroPrimerMes: null,
        comision: null,
      },
      ...{ frecuencia: 'mensual', frecuenciaDias: null, cuotaPactada: c(40), plazoCuotas: 12 },
      ...{ modeloCalculo: null, cuotasPagadasAlCrear: 0 },
    },
  ],
  inversiones: [],
  grupos,
  categorias,
  asignaciones: [
    { id: id('a1'), categoriaId: id('super'), periodoInicio: f('2027-03-01'), monto: c(100) },
    { id: id('a2'), categoriaId: id('super'), periodoInicio: f('2027-04-01'), monto: c(80) },
  ],
  deudores: [{ id: id('ana'), nombre: 'Ana' }],
  transacciones,
  efectos,
  lineas,
  condonaciones: [
    {
      id: id('k1'),
      lineaId: id('g1-1'),
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
  conciliaciones: [
    {
      id: id('cn1'),
      cuentaId: id('ef'),
      fechaEstado: f('2027-04-10'),
      saldoEstado: c(4800),
      terminadaEn: '2027-04-11T10:00:00.000Z',
      diferenciaAceptada: c(-30),
      modo: 'saldo',
      revision: null,
    },
  ],
} as unknown as Hechos;
const i = calcular(hechos, f('2027-04-15'));
const reglas: ReglaComercio[] = [{ id: id('r1'), patron: 'cena', categoriaId: id('super') }];

describe('PRU-DOM-COBRO-103: contextos de formulario fusionar, programada, regla, conciliar y verificar_saldo', () => {
  it('PRU-DOM-COBRO-103 OP-12 fusionar: destinos válidos (normales, activas, distintas del origen) y resumen de lo que se mueve; una categoría de pago se rechaza', () => {
    const x = formulario(i, { operacion: 'fusionar', categoriaId: id('super') }, { reglas });
    expect(Object.keys(x.catalogos)).toEqual(['categorias']);
    expect(x.contexto.origen).toEqual({ id: 'super', nombre: 'Super' });
    expect(x.contexto.destinosValidos.map((d) => d.id)).toEqual(['ropa', 'viajes']);
    expect(x.contexto.resumen).toEqual({
      periodosConAsignacion: 2,
      transacciones: 3,
      condonaciones: 1,
      programadas: 3,
      reglas: 1,
    });
    expect(() => formulario(i, { operacion: 'fusionar', categoriaId: id('pago-vi') })).toThrow(
      RangeError,
    );
    expect(() => formulario(i, { operacion: 'fusionar', categoriaId: id('nada') })).toThrow(
      RangeError,
    );
  });

  it('PRU-DOM-COBRO-103 CP-10c OP-41 regla: sin id solo el catálogo de categorías; con id la regla con su esperado; una regla inexistente se rechaza', () => {
    const vacia = formulario(i, { operacion: 'regla' }, { reglas });
    expect(Object.keys(vacia.catalogos)).toEqual(['categorias']);
    expect(vacia.contexto).toEqual({});
    const r = formulario(i, { operacion: 'regla', reglaId: id('r1') }, { reglas });
    expect(r.contexto).toEqual({
      regla: {
        id: 'r1',
        patron: 'cena',
        categoria: { id: 'super', nombre: 'Super' },
        esperado: { patron: 'cena', categoriaId: 'super' },
      },
    });
    expect(() => formulario(i, { operacion: 'regla', reglaId: id('r1') })).toThrow(RangeError);
  });

  it('PRU-DOM-COBRO-103 CP-10b OP-42 programada: crear da los préstamos con modelo; editar da los campos con esperado, las próximas 5 (CF-20), calendarioEditable y la ocurrencia pedida', () => {
    const nueva = formulario(i, { operacion: 'programada' });
    expect(Object.keys(nueva.catalogos).sort()).toEqual(['categorias', 'comercios', 'cuentas']);
    expect(nueva.contexto).toEqual({ prestamosConModelo: [] });
    const e = formulario(i, { operacion: 'programada', programadaId: id('pg2') });
    const p = 'programada' in e.contexto ? e.contexto.programada : undefined;
    expect(p?.proximas).toEqual(
      ['2027-04-15', '2027-04-22', '2027-04-29', '2027-05-06', '2027-05-13'].map(f),
    );
    expect(p).toMatchObject({
      calendarioEditable: true,
      comercio: 'Gimnasio',
      monto: c(20),
      activa: true,
    });
    expect(p?.esperado).toMatchObject({
      comercio: 'Gimnasio',
      lineas: [{ categoriaId: 'super', monto: c(20) }],
    });
    expect('ocurrencia' in e.contexto).toBe(false);
    const o = formulario(i, {
      operacion: 'programada',
      programadaId: id('pg2'),
      fechaEsperada: f('2027-04-22'),
    });
    expect('ocurrencia' in o.contexto && o.contexto.ocurrencia).toMatchObject({
      fechaEsperada: '2027-04-22',
      estado: 'pendiente',
      monto: c(20),
      cuenta: { id: 'ef' },
    });
    const r = formulario(i, {
      operacion: 'programada',
      programadaId: id('pg'),
      fechaEsperada: f('2027-02-20'),
    });
    expect('ocurrencia' in r.contexto && r.contexto.ocurrencia).toMatchObject({
      estado: 'registrada',
      transaccionId: 'g3',
    });
    expect('programada' in r.contexto && r.contexto.programada.calendarioEditable).toBe(false);
    expect(() =>
      formulario(i, {
        operacion: 'programada',
        programadaId: id('pg2'),
        fechaEsperada: f('2027-04-23'),
      }),
    ).toThrow(RangeError);
    expect(() => formulario(i, { operacion: 'programada', programadaId: id('nada') })).toThrow(
      RangeError,
    );
  });

  it('PRU-DOM-COBRO-103 CP-16 OP-46 conciliar: catálogos, saldos, última conciliación, tipos de alta por signo, préstamos y por cobrar abiertos; el préstamo y una cuenta inexistente se rechazan', () => {
    const x = formulario(i, { operacion: 'conciliar', cuentaId: id('ef') });
    expect(Object.keys(x.catalogos).sort()).toEqual([
      'categorias',
      'categoriasPago',
      'comercios',
      'cuentas',
      'deudores',
    ]);
    expect(x.contexto.cuenta).toEqual({
      cuenta: { id: 'ef', nombre: 'Efectivo' },
      tipo: 'efectivo',
      saldo: c(4830),
      saldoConfirmado: c(4880),
      ultimaConciliacion: {
        fechaEstado: f('2027-04-10'),
        saldoEstado: c(4800),
        diferenciaActual: c(-30),
      },
    });
    expect(x.contexto.tiposAlta.abono).toContain('cobro');
    expect(x.contexto.tiposAlta.cargo).toContain('pago_tarjeta');
    expect('origenPropuestoPago' in x.contexto).toBe(false);
    expect(x.contexto.prestamos).toEqual([
      {
        cuenta: { id: 'pr', nombre: 'Préstamo' },
        tieneModelo: false,
        categoriaPropuesta: { id: 'ropa', nombre: 'Ropa' },
      },
    ]);
    expect(x.contexto.porCobrarAbiertos).toEqual([
      {
        ...{ lineaId: 'g1-1', transaccionId: 'g1', deudor: { id: 'ana', nombre: 'Ana' } },
        ...{ fechaOrigen: f('2027-04-01'), comercio: 'Cena', abierto: c(30), medio: 'debito' },
      },
    ]);
    const t = formulario(i, { operacion: 'conciliar', cuentaId: id('vi') });
    expect(t.contexto.cuenta).toMatchObject({
      tipo: 'tarjeta',
      saldo: c(-30),
      saldoConfirmado: c(-30),
    });
    expect('ultimaConciliacion' in t.contexto.cuenta).toBe(false);
    expect(t.contexto.tiposAlta.abono).toContain('pago_tarjeta');
    expect(t.contexto.tiposAlta.cargo).not.toContain('cobro');
    expect(() => formulario(i, { operacion: 'conciliar', cuentaId: id('pr') })).toThrow(RangeError);
    expect(() => formulario(i, { operacion: 'conciliar', cuentaId: id('nada') })).toThrow(
      RangeError,
    );
  });

  it('PRU-DOM-COBRO-103 CF-01 OP-53 verificar_saldo: la cuenta, la fecha pedida o hoy, las candidatas no conciliadas más recientes primero y la última conciliación con su modo; fecha futura o préstamo se rechazan', () => {
    const x = formulario(i, { operacion: 'verificar_saldo', cuentaId: id('ef') });
    expect(x.catalogos).toEqual({});
    expect(x.contexto.cuenta).toEqual({
      id: 'ef',
      nombre: 'Efectivo',
      tipo: 'efectivo',
    });
    expect(x.contexto.fecha).toBe(f('2027-04-15'));
    expect(x.contexto.candidatas.cantidad).toBe(3);
    expect(x.contexto.candidatas.recientes.map((t) => t.id)).toEqual(['g3', 'g1', 'si']);
    expect(x.contexto.ultimaConciliacion).toEqual({
      fechaEstado: f('2027-04-10'),
      saldoEstado: c(4800),
      modo: 'saldo',
      diferenciaActual: c(-30),
    });
    const antes = formulario(i, {
      operacion: 'verificar_saldo',
      cuentaId: id('ef'),
      fecha: f('2027-04-02'),
    });
    expect(antes.contexto.fecha).toBe(f('2027-04-02'));
    expect(antes.contexto.candidatas.recientes.map((t) => t.id)).toEqual(['g1', 'si']);
    expect(() =>
      formulario(i, { operacion: 'verificar_saldo', cuentaId: id('ef'), fecha: f('2027-04-16') }),
    ).toThrow(RangeError);
    expect(() => formulario(i, { operacion: 'verificar_saldo', cuentaId: id('pr') })).toThrow(
      RangeError,
    );
  });
});
