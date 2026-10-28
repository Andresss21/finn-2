// PRU-DOM-BAND-104: la sugerencia de categoría y los comercios recientes (04 §6.14.3) y la `Propuesta`
// extendida (CF-05; 06 §3.6), sobre un estado
// armado a mano (hoy = 2027-04-15; Visa corta el 10 y paga el 28).
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
import { comerciosRecientes, propuestaDeAjuste, propuestaDeRegla, sugerencia } from './sugerencia';

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

describe('PRU-DOM-BAND-104: sugerencia de categoría, comercios recientes y Propuesta extendida', () => {
  it('PRU-DOM-BAND-104 CF-05 Propuesta extendida: regla de comercio de un toque y ajuste AV-21 que abre el flujo según la cuenta y el signo', () => {
    expect(propuestaDeRegla('Recordá', 'Ropa Moda', id('ropa'))).toEqual({
      aviso: 'regla_comercio',
      texto: 'Recordá',
      operacion: 'OP-41',
      ejecucion: 'un_toque',
      entrada: { patron: 'Ropa Moda', categoriaId: 'ropa' },
    });
    const ajuste = (tipoCuenta: 'efectivo' | 'tarjeta', diferencia: number) =>
      propuestaDeAjuste('Ajustá', {
        cuentaId: id('ef'),
        tipoCuenta,
        fechaEstado: f('2027-04-10'),
        diferencia: c(diferencia),
        total: c(Math.abs(diferencia)),
      });
    expect(ajuste('efectivo', -5)).toMatchObject({
      aviso: 'AV-21',
      operacion: 'OP-20',
      ejecucion: 'abrir_flujo',
    });
    expect(ajuste('efectivo', 5).operacion).toBe('OP-21');
    expect(ajuste('tarjeta', 5).operacion).toBe('OP-27');
    expect(ajuste('tarjeta', 5).entrada).toEqual({
      cuentaId: 'ef',
      fecha: '2027-04-10',
      total: c(5),
      comercio: 'Ajuste de conciliación',
    });
  });

  it('PRU-DOM-BAND-104 sugerencia de categoría y comercios recientes: la regla manda; si no, el historial; agrupados por comercio normalizado', () => {
    expect(sugerencia(i, reglas, 'Ropa Moda Centro')).toEqual({
      categoria: { id: 'ropa', nombre: 'Ropa' },
      origen: 'regla',
    });
    expect(sugerencia(i, [], 'SUPER SELECTOS')).toEqual({
      categoria: { id: 'super', nombre: 'Super' },
      origen: 'historial',
    });
    expect(sugerencia(i, reglas, 'Desconocido')).toBeNull();
    expect(sugerencia(i, reglas, null)).toBeNull();
    const r = comerciosRecientes(i, reglas);
    expect(r.map((x) => [x.comercio, x.usos, x.ultimoUso])).toEqual([
      ['Ropa Moda', 1, '2027-04-13'],
      ['Super Selectos', 3, '2027-04-12'],
      ['Hotel', 1, '2026-12-01'],
    ]);
    expect(r[1]?.sugerencia?.origen).toBe('historial');
    expect(comerciosRecientes(i, reglas, 1)).toHaveLength(1);
  });
});
