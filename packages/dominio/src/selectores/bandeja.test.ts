// PRU-DOM-BAND-107: selectores de la bandeja (04 §6.8, BE-41, CF-22), sobre un estado armado a mano
// (hoy = 2027-04-15; Visa corta el 10 y paga el 28).
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Hechos,
  Instante,
  Linea,
  Movimiento,
  MovimientoLinea,
  ReglaComercio,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import {
  type DatosDeBandeja,
  bandeja,
  destinosDeArrastre,
  origenPropuestoPagoTarjeta,
} from './bandeja';

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

// ── movimientos de la bandeja ──
const sms: DatosDeBandeja['sms'][number][] = [];
const movimientos: { movimiento: Movimiento; lineas: MovimientoLinea[] }[] = [];
function m(
  nombre: string,
  parcial: Partial<Movimiento>,
  lineas: readonly Partial<MovimientoLinea>[] = [],
  minuto = movimientos.length,
) {
  const recibidoEn = `2027-04-14T10:${String(minuto).padStart(2, '0')}:00.000Z` as Instante;
  sms.push({ id: id(`sms-${nombre}`), texto: `SMS ${nombre}`, remitente: 'Banco', recibidoEn });
  movimientos.push({
    movimiento: {
      id: id(nombre),
      smsId: id(`sms-${nombre}`),
      estado: 'pendiente',
      cuentaId: id('ef'),
      fecha: f('2027-04-14'),
      monto: c(12),
      comercio: 'Super Selectos',
      tipoPropuesto: 'gasto',
      nota: null,
      duplicadoTransaccionId: null,
      duplicadoMovimientoId: null,
      esperadaProgramadaId: null,
      esperadaFecha: null,
      transaccionId: null,
      ...parcial,
    },
    lineas: lineas.map((l, k) => ({
      id: id(`${nombre}-l${k}`),
      movimientoId: id(nombre),
      orden: k + 1,
      monto: c(12),
      categoriaId: null,
      deudorId: null,
      lineaOriginalId: null,
      ...l,
    })),
  });
}
m('m1', {}, [{ categoriaId: id('super') }]);
m('m2', { cuentaId: id('vi'), tipoPropuesto: 'pago_tarjeta', comercio: null, monto: c(50) });
m('m3', { cuentaId: id('mc'), tipoPropuesto: 'pago_tarjeta', comercio: null, monto: c(50) });
m(
  'm4',
  {
    estado: 'con_coincidencia',
    esperadaProgramadaId: id('pg'),
    esperadaFecha: f('2027-04-20'),
    comercio: 'Netflix',
  },
  [{ categoriaId: id('cine') }],
);
m('m5', { estado: 'posible_duplicado', duplicadoTransaccionId: id('g1') }, [
  { categoriaId: id('super') },
]);
m('m6', { estado: 'descartado' }, [{ categoriaId: id('super') }]);
m('m7', { fecha: f('2027-02-10') }, [{ categoriaId: id('super') }]);
m('m8', {}, [{ categoriaId: id('super') }, { categoriaId: id('ropa') }]);
m('m9', { comercio: 'Ropa Moda' }, [{}]);
m('m10', {
  estado: 'no_reconocido',
  cuentaId: null,
  fecha: null,
  monto: null,
  tipoPropuesto: null,
  comercio: null,
});
m('m11', {
  estado: 'error',
  cuentaId: null,
  fecha: null,
  monto: null,
  tipoPropuesto: null,
  comercio: null,
});
m('m12', { estado: 'autodescartado' });
const datos: DatosDeBandeja = {
  movimientos,
  sms,
  procesamientos: [
    {
      smsId: id('sms-m11'),
      intento: 2,
      resultado: 'error',
      formatosCoincidentes: [],
      errorDetalle: 'detalle',
    },
  ],
  formatos: [],
  reglas,
};

describe('PRU-DOM-BAND-107: bandeja, destinos de arrastre y origen propuesto', () => {
  it('PRU-DOM-BAND-107 CF-22 destinosArrastre: frecuentes de gastos de los últimos 90 días y todas las normales activas por grupo, sin pagos de tarjeta ni archivadas', () => {
    const d = destinosDeArrastre(i);
    // Super (3 líneas) antes que Ropa (1); Hotel (2026-12-01) cae fuera de los 90 días.
    expect(d.frecuentes.map((x) => x.nombre)).toEqual(['Super', 'Ropa']);
    expect(d.grupos.map((g) => [g.grupo.nombre, g.categorias.map((x) => x.nombre)])).toEqual([
      ['Hogar', ['Super', 'Ropa', 'Cuota']],
      ['Ocio', ['Viajes']],
    ]);
    // Sin historial de gastos: las primeras por orden de grupo y categoría.
    expect(destinosDeArrastre(armar(false)).frecuentes.map((x) => x.nombre)).toEqual([
      'Super',
      'Ropa',
      'Cuota',
      'Viajes',
    ]);
  });

  it('PRU-DOM-BAND-107 CF-22 arrastrable: solo pendiente de gasto con a lo sumo una línea a categoría o sin destino', () => {
    const b = bandeja(i, datos);
    const de = (n: string) => b.movimientos.find((x) => x.id === n)?.aprobacion.arrastrable;
    expect(b.movimientos.map((x) => x.id).filter((n) => de(n) === true)).toEqual([
      'm1',
      'm7',
      'm9',
    ]);
    expect(de('m2')).toBe(false); // pago de tarjeta
    expect(de('m4')).toBe(false); // con coincidencia
    expect(de('m8')).toBe(false); // dos líneas
    expect(b.destinosArrastre.frecuentes.length).toBeLessThanOrEqual(6);
  });

  it('PRU-DOM-BAND-107 bandeja: contadores, activos con sus datos, elegibles de OP-38 y motivos de los demás', () => {
    const b = bandeja(i, datos);
    expect(b.contadores).toEqual({
      pendientes: 6,
      conCoincidencia: 1,
      posiblesDuplicados: 1,
      noReconocidos: 1,
      errores: 1,
    });
    expect(b.movimientos).toHaveLength(12 - 2);
    expect(b.elegiblesAprobarTodos).toEqual(['m1', 'm8']);
    const por = (n: string) => {
      const x = b.movimientos.find((y) => y.id === n);
      if (x === undefined) throw new Error(`falta ${n}`);
      return x;
    };
    expect(por('m2').aprobacion).toMatchObject({
      posible: true,
      elegibleAprobarTodos: false,
      motivoNoElegible: 'pago_sin_origen',
    });
    expect(por('m3').aprobacion).toMatchObject({ posible: false, faltantes: ['origen'] });
    expect(por('m4').aprobacion.motivoNoElegible).toBe('movimiento_estado_no_valido');
    expect(por('m7').aprobacion).toMatchObject({
      requiereConfirmacion: true,
      motivoNoElegible: 'requiere_revision_individual',
    });
    expect(por('m9').aprobacion).toMatchObject({
      faltantes: ['destino'],
      motivoNoElegible: 'linea_sin_destino',
    });
    expect(por('m10').aprobacion.faltantes).toEqual(['cuenta', 'fecha', 'monto', 'tipo']);
    expect(por('m11').procesamiento).toMatchObject({
      intento: 2,
      resultado: 'error',
      errorDetalle: 'detalle',
    });
    expect(por('m1').categoriaSugerida).toEqual({ id: 'super', nombre: 'Super', porRegla: false });
    expect(por('m9').categoriaSugerida).toEqual({ id: 'ropa', nombre: 'Ropa', porRegla: true });
    expect(por('m4').coincidencia).toEqual({
      programada: { id: 'pg', nombre: 'Netflix' },
      fechaEsperada: '2027-04-20',
      montoEsperado: c(10),
      ocurrencia: 'pendiente',
    });
    expect(por('m5').duplicado).toMatchObject({
      tipo: 'transaccion',
      id: 'g1',
      monto: c(30),
      cuenta: { id: 'ef', nombre: 'Efectivo' },
    });
    const descartados = bandeja(i, datos, { vista: 'descartados' });
    expect(descartados.movimientos.map((x) => x.id)).toEqual(['m12', 'm6']);
    expect(bandeja(i, datos, { vista: 'descartados', limite: 1 }).siguienteCursor).toBeDefined();
  });

  it('PRU-DOM-BAND-107 BE-41 origenPropuesto: la cuenta del último pago a la tarjeta, si sigue abierta', () => {
    expect(origenPropuestoPagoTarjeta(i, id('vi'))).toEqual({ id: 'bn', nombre: 'Banco' });
    expect(origenPropuestoPagoTarjeta(i, id('mc'))).toBeUndefined(); // la cuenta de su único pago está archivada
    expect(origenPropuestoPagoTarjeta(armar(false), id('pr'))).toBeUndefined();
    const b = bandeja(i, datos);
    expect(b.movimientos.find((x) => x.id === 'm2')?.origenPropuesto).toEqual({
      id: 'bn',
      nombre: 'Banco',
    });
    expect(b.movimientos.find((x) => x.id === 'm3')?.origenPropuesto).toBeUndefined();
  });
});
