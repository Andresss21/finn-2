// PRU-DOM-BAND-108: contextos de formulario `registrar`, `pagar_tarjeta` y `cuota_prestamo` con sus
// catálogos (04 §6.14), sobre un estado armado a mano (hoy = 2027-04-15; Visa corta el 10 y paga el 28).
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Asignacion,
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
import { cuentas as cuentasSel } from './cuentas';
import { formulario } from './formulario';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

const cuentas = [
  { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', orden: 1 },
  { id: id('bn'), tipo: 'efectivo', nombre: 'Banco', orden: 2 },
  { id: id('vieja'), tipo: 'efectivo', nombre: 'Vieja', orden: 3, archivada: true },
  { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa', orden: 4 },
  { id: id('mc'), tipo: 'tarjeta', nombre: 'Master', orden: 5 },
  { id: id('pr'), tipo: 'prestamo', nombre: 'Préstamo', orden: 6 },
].map((x) => ({
  archivada: false,
  institucionId: null,
  ultimos4: null,
  fechaApertura: f('2027-01-01'),
  ...x,
})) as Cuenta[];
const tarjeta = (cuentaId: string) => ({
  cuentaId: id(cuentaId),
  tipo: 'tarjeta',
  diaCorte: 10,
  diaPago: 28,
  limiteCredito: c(1000),
  red: null,
  color: null,
});

const grupos = [
  { id: id('hogar'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null },
  { id: id('ocio'), nombre: 'Ocio', orden: 2, archivado: false, claveSistema: null },
  { id: id('pagos'), nombre: 'Pagos', orden: 3, archivado: false, claveSistema: 'pagos' },
];
const categorias = [
  { id: id('super'), grupoId: id('hogar'), nombre: 'Super', orden: 1, clase: 'normal' },
  { id: id('ropa'), grupoId: id('hogar'), nombre: 'Ropa', orden: 2, clase: 'normal' },
  { id: id('cuota'), grupoId: id('hogar'), nombre: 'Cuota', orden: 3, clase: 'normal' },
  { id: id('viajes'), grupoId: id('ocio'), nombre: 'Viajes', orden: 1, clase: 'normal' },
  {
    id: id('cine'),
    grupoId: id('ocio'),
    nombre: 'Cine',
    orden: 2,
    clase: 'normal',
    archivada: true,
  },
  {
    id: id('pago-vi'),
    grupoId: id('pagos'),
    nombre: 'Pago Visa',
    orden: 1,
    clase: 'pago',
    tarjetaId: id('vi'),
  },
  {
    id: id('pago-mc'),
    grupoId: id('pagos'),
    nombre: 'Pago Master',
    orden: 2,
    clase: 'pago',
    tarjetaId: id('mc'),
  },
].map((x) => ({ tarjetaId: null, archivada: false, ...x })) as Categoria[];
const asignaciones = [
  ['super', '2027-03-01', 100],
  ['super', '2027-04-01', 80],
  ['super', '2027-05-01', 7],
  ['ropa', '2027-04-01', 10],
  ['cine', '2027-05-01', 5],
  ['pago-vi', '2027-04-01', 20],
].map(([cat, p, m]) => ({
  id: id(`a-${cat}-${p}`),
  categoriaId: id(cat as string),
  periodoInicio: f(p as string),
  monto: c(m as number),
})) as Asignacion[];

function armar(conGastos: boolean) {
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const mov = (
    tx: string,
    tipo: Transaccion['tipo'],
    fecha: string,
    mueve: readonly (readonly [string, number])[],
    linea?: { cat: string; monto: number },
    comercio: string | null = null,
  ) => {
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
      comercio,
      nota: null,
      total: c(Math.abs(mueve[0]?.[1] ?? 0)),
      lineaCobradaId: null,
    } as unknown as Transaccion);
    for (const [cuenta, monto] of mueve)
      efectos.push({
        id: id(`ef-${tx}-${cuenta}`),
        transaccionId: id(tx),
        cuentaId: id(cuenta),
        monto: c(monto),
        interes: null,
        seguro: null,
      } as Efecto);
    if (linea !== undefined)
      lineas.push({
        id: id(`${tx}-0`),
        transaccionId: id(tx),
        orden: 1,
        monto: c(linea.monto),
        categoriaId: id(linea.cat),
        deudorId: null,
        lineaOriginalId: null,
      } as Linea);
  };
  mov('si', 'saldo_inicial', '2027-01-05', [['ef', 5000]]);
  mov('si-bn', 'saldo_inicial', '2027-01-05', [['bn', 1000]]);
  mov('si-pr', 'saldo_inicial', '2027-01-05', [['pr', 500]]);
  mov(
    'p0',
    'pago_tarjeta',
    '2027-03-10',
    [
      ['ef', -20],
      ['vi', 20],
    ],
    { cat: 'pago-vi', monto: 20 },
  );
  mov(
    'p1',
    'pago_tarjeta',
    '2027-04-02',
    [
      ['bn', -30],
      ['vi', 30],
    ],
    { cat: 'pago-vi', monto: 30 },
  );
  mov(
    'p2',
    'pago_tarjeta',
    '2027-04-03',
    [
      ['vieja', -10],
      ['mc', 10],
    ],
    { cat: 'pago-mc', monto: 10 },
  );
  mov(
    'cq',
    'cuota_prestamo',
    '2027-04-05',
    [
      ['ef', -40],
      ['pr', -40],
    ],
    { cat: 'cuota', monto: 40 },
  );
  if (conGastos) {
    mov('g1', 'gasto', '2027-04-10', [['ef', -30]], { cat: 'super', monto: 30 }, 'Super Selectos');
    mov('g2', 'gasto', '2027-04-11', [['vi', -20]], { cat: 'super', monto: 20 }, 'super selectos');
    mov('g3', 'gasto', '2027-04-12', [['ef', -10]], { cat: 'super', monto: 10 }, 'Super Selectos');
    mov('g4', 'gasto', '2027-04-13', [['bn', -25]], { cat: 'ropa', monto: 25 }, 'Ropa Moda');
    mov('g5', 'gasto', '2026-12-01', [['ef', -15]], { cat: 'viajes', monto: 15 }, 'Hotel');
  }
  const hechos = {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas,
    tarjetas: [tarjeta('vi'), tarjeta('mc')],
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
    asignaciones,
    deudores: [{ id: id('ana'), nombre: 'Ana' }],
    transacciones,
    efectos,
    lineas,
    condonaciones: [],
    metas: [
      {
        id: id('m-ropa'),
        categoriaId: id('ropa'),
        tipo: 'mensual',
        modo: 'acumular',
        monto: c(50),
        fechaObjetivo: null,
        fechaCreacion: f('2027-01-01'),
      },
    ],
    programadas: [
      {
        id: id('pg'),
        tipo: 'gasto',
        cuentaId: id('ef'),
        cuentaDestinoId: null,
        comercio: 'Netflix',
        monto: c(10),
        tolerancia: c(1),
        frecuencia: 'mensual',
        frecuenciaDias: null,
        primeraFecha: f('2027-01-20'),
        fechaFin: null,
        registroAutomatico: false,
        activa: true,
      },
    ],
    programada_lineas: [
      { id: id('pgl'), programadaId: id('pg'), orden: 1, monto: c(10), categoriaId: id('cine') },
    ],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  } as unknown as Hechos;
  return calcular(hechos, f('2027-04-15'));
}
const i = armar(true);

const reglas: ReglaComercio[] = [{ id: id('r1'), patron: 'ropa', categoriaId: id('ropa') }];
describe('PRU-DOM-BAND-108: contextos de formulario de registrar, pagar tarjeta y cuota de préstamo', () => {
  it('PRU-DOM-BAND-108 SEL-formulario registrar: catálogos de gasto y cuenta propuesta (la del último gasto registrado)', () => {
    const g = formulario(i, { operacion: 'registrar', tipo: 'gasto' }, { reglas });
    expect(g.contexto).toEqual({ cuentaPropuesta: { id: 'bn', nombre: 'Banco' } });
    expect(Object.keys(g.catalogos).sort()).toEqual([
      'categorias',
      'comercios',
      'cuentas',
      'deudores',
    ]);
    // abiertas y por tipo; la archivada no se ofrece
    expect(g.catalogos.cuentas?.efectivo.map((x) => x.cuenta.nombre)).toEqual([
      'Efectivo',
      'Banco',
    ]);
    expect(g.catalogos.cuentas?.tarjetas.map((x) => x.cuenta.nombre)).toEqual(['Visa', 'Master']);
    expect(g.catalogos.cuentas?.prestamos[0]).toMatchObject({ tieneModelo: false });
    expect(
      g.catalogos.categorias?.grupos.map((x) => x.categorias.map((y) => y.categoria.nombre)),
    ).toEqual([['Super', 'Ropa', 'Cuota'], ['Viajes']]);
    expect(g.catalogos.deudores).toEqual([{ deudor: { id: 'ana', nombre: 'Ana' }, abierto: c(0) }]);
    expect(
      Object.keys(formulario(i, { operacion: 'registrar', tipo: 'transferencia' }).catalogos),
    ).toEqual(['cuentas']);
    expect(
      Object.keys(formulario(i, { operacion: 'registrar', tipo: 'aporte_inversion' }).catalogos),
    ).toEqual(['cuentas', 'categorias']);
    expect(
      formulario(i, { operacion: 'registrar', tipo: 'ingreso', cuentaId: id('ef') }).contexto,
    ).toEqual({ cuentaPropuesta: { id: 'ef', nombre: 'Efectivo' } });
  });

  it('PRU-DOM-BAND-108 SEL-formulario pagar_tarjeta: deuda, reservado, desglose al pagar y origen propuesto por tarjeta', () => {
    const p = formulario(i, { operacion: 'pagar_tarjeta', tarjetaId: id('vi') });
    expect(Object.keys(p.catalogos).sort()).toEqual(['categoriasPago', 'cuentas']);
    expect(p.catalogos.categoriasPago?.map((x) => x.categoria.nombre)).toEqual([
      'Pago Visa',
      'Pago Master',
    ]);
    const t = i.tarjetas.find((x) => x.tarjetaId === 'vi');
    if (t === undefined) throw new Error('falta Visa');
    expect(p.contexto.tarjetas).toHaveLength(1);
    expect(p.contexto.tarjetas[0]).toMatchObject({
      tarjeta: { id: 'vi', nombre: 'Visa' },
      deuda: t.deuda,
      reservado: t.reservado,
      disponiblePago: t.disponibleDePago,
      faltaReservar: t.sinRespaldo,
      origenPropuesto: { id: 'bn', nombre: 'Banco' },
      desgloseAlPagar: { ultimoCorte: '2027-04-10' },
    });
    expect(
      formulario(i, { operacion: 'pagar_tarjeta' }).contexto.tarjetas.map((x) => x.tarjeta.nombre),
    ).toEqual(['Visa', 'Master']);
  });

  it('PRU-DOM-BAND-108 SEL-formulario cuota_prestamo: capital pendiente, cuota pactada, sin modelo no hay desglose y la categoría sale de la última cuota', () => {
    const q = formulario(i, {
      operacion: 'cuota_prestamo',
      prestamoId: id('pr'),
      modalidad: 'cuota',
    });
    expect(q.contexto).toEqual({
      prestamo: { id: 'pr', nombre: 'Préstamo' },
      capitalPendiente: cuentasSel(i).prestamos[0]?.capitalPendiente,
      cuotaPactada: c(40),
      tieneModelo: false,
      categoriaPropuesta: { id: 'cuota', nombre: 'Cuota' },
    });
    expect(Object.keys(q.catalogos).sort()).toEqual(['categorias', 'cuentas']);
    expect(() =>
      formulario(i, { operacion: 'cuota_prestamo', prestamoId: id('nada'), modalidad: 'abono' }),
    ).toThrow(RangeError);
  });
});
