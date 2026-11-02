import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  BigintTexto,
  CambioPosterior,
  Conciliacion,
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Instante,
  Institucion,
  Linea,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { cuentas } from './cuentas';
import { detalleCuenta } from './detalle-cuenta';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Estado conocido: hoy = 2027-04-15, ciclo mensual (día 1). Efectivo `ef` (con conciliaciones), tarjeta
 * `vi` (corte 1, pago 17, límite 1000), tarjeta `mc` sin límite y con saldo a favor, préstamo `pr`
 * (Banco Agrícola, 1200 al 12 %, cuota 110, abierto el 2027-01-10, con la cuota 1 pagada), préstamo
 * `pr2` sin modelo, inversión `inv` y una cuenta archivada.
 */
function estado() {
  const cuentasH = [
    { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', fechaApertura: f('2027-01-01') },
    {
      id: id('vi'),
      tipo: 'tarjeta',
      nombre: 'Visa',
      fechaApertura: f('2027-01-01'),
      ultimos4: '1234',
      institucionId: id('banco'),
    },
    { id: id('mc'), tipo: 'tarjeta', nombre: 'Master', fechaApertura: f('2027-01-01') },
    { id: id('pr'), tipo: 'prestamo', nombre: 'Casa', fechaApertura: f('2027-01-10') },
    { id: id('pr2'), tipo: 'prestamo', nombre: 'Amigo', fechaApertura: f('2027-01-10') },
    { id: id('inv'), tipo: 'inversion', nombre: 'Fondo', fechaApertura: f('2027-01-01') },
    { id: id('vacia'), tipo: 'efectivo', nombre: 'Vacía', fechaApertura: f('2027-01-01') },
    {
      id: id('vieja'),
      tipo: 'efectivo',
      nombre: 'Vieja',
      fechaApertura: f('2027-01-01'),
      archivada: true,
    },
  ].map((k) => ({ ultimos4: null, institucionId: null, orden: 1, archivada: false, ...k }));
  const grupos = [
    { id: id('hogar'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null },
    { id: id('pagos'), nombre: 'Pagos', orden: 2, archivado: false, claveSistema: 'pagos' },
  ] as Grupo[];
  const categorias = [
    { id: id('casa'), grupoId: id('hogar'), nombre: 'Casa', clase: 'normal', tarjetaId: null },
    {
      id: id('pago-vi'),
      grupoId: id('pagos'),
      nombre: 'Pago Visa',
      clase: 'pago',
      tarjetaId: id('vi'),
    },
    {
      id: id('pago-mc'),
      grupoId: id('pagos'),
      nombre: 'Pago Master',
      clase: 'pago',
      tarjetaId: id('mc'),
    },
  ].map((x) => ({ orden: 1, archivada: false, ...x })) as Categoria[];
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const mov = (
    tx: string,
    tipo: Transaccion['tipo'],
    fecha: string,
    efs: [string, number, { interes?: number; seguro?: number }?][],
    cat?: string,
    extra: Partial<Transaccion> = {},
  ) => {
    const total = c(Math.max(...efs.map((e) => Math.abs(e[1]))));
    transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      horaRegistro: `${fecha}T12:00:00.000Z` as Instante,
      claveOrden: `${fecha}T12:00:00.000Z` as Instante,
      secuencia: String(transacciones.length + 1) as BigintTexto,
      origen: 'manual',
      estadoBancario: 'confirmada',
      conciliacionId: null,
      comercio: null,
      nota: null,
      total,
      monedaOriginal: null,
      montoOriginal: null,
      lineaCobradaId: null,
      revision: null,
      ...extra,
    });
    for (const [cuenta, monto, d] of efs)
      efectos.push({
        id: id(`e-${tx}-${cuenta}`),
        transaccionId: id(tx),
        cuentaId: id(cuenta),
        monto: c(monto),
        interes: d?.interes === undefined ? null : c(d.interes),
        seguro: d?.seguro === undefined ? null : c(d.seguro),
        revision: null,
      });
    if (cat !== undefined)
      lineas.push({
        id: id(`l-${tx}`),
        transaccionId: id(tx),
        orden: 1,
        monto: total,
        categoriaId: id(cat),
        deudorId: null,
        lineaOriginalId: null,
        revision: null,
      });
  };
  mov('si-ef', 'saldo_inicial', '2027-01-01', [['ef', 1000]]);
  mov('si-inv', 'saldo_inicial', '2027-01-01', [['inv', 400]]);
  mov('si-mc', 'saldo_inicial', '2027-01-01', [['mc', 25]]);
  mov('si-pr2', 'saldo_inicial', '2027-01-01', [['pr2', 300]]);
  mov('des', 'desembolso_prestamo', '2027-01-10', [
    ['ef', 1200],
    ['pr', 1200],
  ]);
  mov(
    'cuota1',
    'cuota_prestamo',
    '2027-02-10',
    [
      ['ef', -110],
      ['pr', -97.77, { interes: 12.23 }],
    ],
    'casa',
  );
  mov('g-vi1', 'gasto', '2027-02-20', [['vi', -200]], 'casa', { comercio: 'TIENDA' });
  mov('g-mar', 'gasto', '2027-03-10', [['ef', -60]], 'casa', { comercio: 'FARMACIA' });
  mov(
    'aporte',
    'aporte_inversion',
    '2027-03-15',
    [
      ['ef', -60],
      ['inv', 60],
    ],
    'casa',
  );
  mov('retiro', 'retiro_inversion', '2027-03-20', [
    ['inv', -40],
    ['ef', 40],
  ]);
  mov('ajuste', 'ajuste_inversion', '2027-04-01', [['inv', 5]]);
  mov('g-vi2', 'gasto', '2027-04-05', [['vi', -50]], 'casa', {
    comercio: 'CAFE',
    estadoBancario: 'conciliada',
    conciliacionId: id('con1'),
  });
  mov(
    'pago',
    'pago_tarjeta',
    '2027-04-08',
    [
      ['ef', -80],
      ['vi', 80],
    ],
    'pago-vi',
  );
  mov('abono', 'abono_capital', '2027-04-12', [
    ['ef', -100],
    ['pr', -100],
  ]);
  const hechos: Hechos = {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: cuentasH as Cuenta[],
    tarjetas: [
      {
        cuentaId: id('vi'),
        diaCorte: 1,
        diaPago: 17,
        limiteCredito: c(1000),
        red: 'visa',
        color: '#112233',
      },
      {
        cuentaId: id('mc'),
        diaCorte: 31,
        diaPago: 20,
        limiteCredito: c(0),
        red: null,
        color: null,
      },
    ].map((t) => ({
      tipo: 'tarjeta',
      tasaAnualMillonesimas: null,
      revision: null,
      ...t,
    })) as Hechos['tarjetas'],
    prestamos: [
      {
        cuentaId: id('pr'),
        tipo: 'prestamo',
        contraparte: 'Banco',
        montoOriginal: c(1200),
        tasaNominalAnualMillonesimas: 120_000,
        tipoTasa: 'fija',
        seguroPrimerMes: null,
        comision: null,
        frecuencia: 'mensual',
        frecuenciaDias: null,
        cuotaPactada: c(110),
        plazoCuotas: 12,
        modeloCalculo: 'banco_agricola',
        cuotasPagadasAlCrear: 0,
        revision: null,
      },
      {
        cuentaId: id('pr2'),
        tipo: 'prestamo',
        contraparte: 'Un amigo',
        montoOriginal: c(300),
        tasaNominalAnualMillonesimas: null,
        tipoTasa: 'fija',
        seguroPrimerMes: null,
        comision: null,
        frecuencia: 'mensual',
        frecuenciaDias: null,
        cuotaPactada: c(50),
        plazoCuotas: 6,
        modeloCalculo: null,
        cuotasPagadasAlCrear: 0,
        revision: null,
      },
    ] as Hechos['prestamos'],
    inversiones: [
      {
        cuentaId: id('inv'),
        tipo: 'inversion',
        rendimientoAnualEsperadoMillonesimas: null,
        revision: null,
      },
    ],
    grupos,
    categorias,
    asignaciones: [],
    deudores: [],
    transacciones,
    efectos,
    lineas,
    condonaciones: [],
    metas: [],
    programadas: [
      {
        id: id('prog-out'),
        tipo: 'gasto',
        cuentaId: id('ef'),
        cuentaDestinoId: null,
        comercio: 'LUZ',
        monto: c(30),
        tolerancia: c(0),
        frecuencia: 'mensual',
        frecuenciaDias: null,
        primeraFecha: f('2027-05-01'),
        fechaFin: null,
        registroAutomatico: false,
        activa: true,
        reactivadaDesde: null,
        revision: null,
      },
      {
        id: id('prog-in'),
        tipo: 'transferencia',
        cuentaId: id('inv'),
        cuentaDestinoId: id('ef'),
        comercio: 'RESCATE',
        monto: c(10),
        tolerancia: c(0),
        frecuencia: 'mensual',
        frecuenciaDias: null,
        primeraFecha: f('2027-05-01'),
        fechaFin: null,
        registroAutomatico: false,
        activa: false,
        reactivadaDesde: null,
        revision: null,
      },
    ] as Hechos['programadas'],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [
      {
        id: id('con0'),
        cuentaId: id('ef'),
        fechaEstado: f('2027-03-31'),
        saldoEstado: c(2000),
        terminadaEn: '2027-04-01T08:00:00.000Z' as Instante,
        diferenciaAceptada: c(0),
        modo: 'estado_cuenta',
        revision: null,
      },
      {
        id: id('con1'),
        cuentaId: id('ef'),
        fechaEstado: f('2027-04-10'),
        saldoEstado: c(1900),
        terminadaEn: '2027-04-11T08:00:00.000Z' as Instante,
        diferenciaAceptada: c(0),
        modo: 'estado_cuenta',
        revision: null,
      },
    ],
  };
  return calcular(hechos, f('2027-04-15'));
}

const instituciones: Institucion[] = [{ id: id('banco'), nombre: 'Banco Uno' }];
const cambios = [
  {
    id: id('cp1'),
    conciliacionId: id('con1'),
    transaccionId: id('g-vi2'),
    registradoEn: '2027-04-12T09:00:00.000Z' as Instante,
    motivos: ['monto'],
    fecha: f('2027-04-05'),
    montoEfecto: c(-50),
    comercio: 'CAFE',
  },
  {
    id: id('cp2'),
    conciliacionId: id('con0'),
    transaccionId: null,
    registradoEn: '2027-04-12T09:00:00.000Z' as Instante,
    motivos: ['eliminada'],
    fecha: f('2027-03-01'),
    montoEfecto: c(-5),
    comercio: null,
  },
] as CambioPosterior[];

const hechosDe = (i: ReturnType<typeof estado>) => i.hechos;

describe('PRU-DOM-CTA', () => {
  it('PRU-DOM-CTA-105 cuentas y detalle de cuenta: posición neta, saldos, desglose del pago, monto para no generar intereses, amortización y saldo corrido', () => {
    const i = estado();
    const aux = { instituciones, cambios };
    const lista = cuentas(i, aux);

    // Saldos por tipo (01 §4.14): efectivo con su última conciliación (DM-8, recalculada).
    expect(lista.efectivo).toEqual([
      {
        cuenta: { id: id('ef'), nombre: 'Efectivo' },
        saldo: c(1830),
        saldoConfirmado: c(1830),
        ultimaConciliacion: { fechaEstado: f('2027-04-10'), diferenciaActual: c(-30) },
      },
      // Sin conciliaciones no hay `ultimaConciliacion`.
      {
        cuenta: { id: id('vacia'), nombre: 'Vacía' },
        saldo: c(0),
        saldoConfirmado: c(0),
      },
    ]);
    expect(lista.inversiones).toEqual([
      { cuenta: { id: id('inv'), nombre: 'Fondo' }, valor: c(425) },
    ]);
    expect(lista).not.toHaveProperty('archivadas');
    expect(cuentas(i, { incluirArchivadas: true }).archivadas).toEqual([
      { id: id('vieja'), nombre: 'Vieja', archivada: true },
    ]);

    // Tarjetas: corte y pago siguientes, desglose al pagar y monto para no generar intereses.
    const visa = lista.tarjetas.find((t) => t.cuenta.id === id('vi'));
    expect(visa).toMatchObject({
      institucion: 'Banco Uno',
      ultimos4: '1234',
      red: 'visa',
      color: '#112233',
      deuda: c(170),
      saldoAFavor: c(0),
      limite: c(1000),
      usoLimite: 1700,
      faltaReservar: c(170),
      proximoCorte: f('2027-05-01'),
      proximoPago: f('2027-04-17'),
      paraNoGenerarIntereses: c(120),
      usoSinReservarBp: 1700,
    });
    // Sin límite: sin porcentaje de uso; con saldo a favor; el día 31 se recorta al fin de mes.
    const master = lista.tarjetas.find((t) => t.cuenta.id === id('mc'));
    expect(master).toMatchObject({
      saldoAFavor: c(25),
      usoLimite: 0,
      usoSinReservarBp: null,
      proximoCorte: f('2027-04-30'),
      proximoPago: f('2027-04-20'),
      paraNoGenerarIntereses: c(0),
    });
    expect(master).not.toHaveProperty('institucion');

    // Préstamos: la próxima cuota viene de la tabla; sin modelo no hay cuota.
    expect(lista.prestamos).toEqual([
      {
        cuenta: { id: id('pr'), nombre: 'Casa' },
        contraparte: 'Banco',
        capitalPendiente: c(1002.23),
        proximaCuota: { fecha: f('2027-03-10'), monto: c(110), numero: 2 },
      },
      {
        cuenta: { id: id('pr2'), nombre: 'Amigo' },
        contraparte: 'Un amigo',
        capitalPendiente: c(300),
      },
    ]);

    // Posición neta: activos 1830 + 25 + 425, deudas 170 + 1302.23; la barra mayor vale 10.000.
    expect(lista.posicionNeta).toEqual({
      activos: {
        efectivo: c(1830),
        saldosAFavor: c(25),
        inversiones: c(425),
        porCobrar: c(0),
        total: c(2280),
      },
      deudas: { tarjetas: c(170), prestamos: c(1302.23), total: c(1472.23) },
      neto: c(807.77),
      barras: { activosBp: 10_000, deudasBp: 6457 },
    });
    expect(lista.enCamino).toBe(c(0));

    // Detalle del efectivo: saldo corrido sobre todo el historial, orden inverso.
    const ef = detalleCuenta(i, id('ef'), aux);
    expect(ef.movimientos.map((m) => [m.id, m.efectoEnCuenta, m.saldoDespues])).toEqual([
      [id('abono'), c(-100), c(1830)],
      [id('pago'), c(-80), c(1930)],
      [id('retiro'), c(40), c(2010)],
      [id('aporte'), c(-60), c(1970)],
      [id('g-mar'), c(-60), c(2030)],
      [id('cuota1'), c(-110), c(2090)],
      [id('des'), c(1200), c(2200)],
      [id('si-ef'), c(1000), c(1000)],
    ]);
    expect(ef.saldo).toBe(c(1830));
    expect(ef.cuenta).toEqual({
      id: id('ef'),
      nombre: 'Efectivo',
      tipo: 'efectivo',
      fechaApertura: f('2027-01-01'),
      archivada: false,
    });
    expect(ef.conciliaciones).toEqual([
      {
        id: id('con1'),
        fechaEstado: f('2027-04-10'),
        saldoEstado: c(1900),
        terminadaEn: '2027-04-11T08:00:00.000Z',
        diferenciaAceptada: c(0),
        diferenciaActual: c(-30),
        modo: 'estado_cuenta',
        transaccionesConciliadas: 1,
        cambiosPosteriores: [
          {
            registradoEn: '2027-04-12T09:00:00.000Z',
            motivos: ['monto'],
            transaccionId: id('g-vi2'),
            foto: { fecha: f('2027-04-05'), montoEfecto: c(-50), comercio: 'CAFE' },
          },
        ],
      },
      {
        id: id('con0'),
        fechaEstado: f('2027-03-31'),
        saldoEstado: c(2000),
        terminadaEn: '2027-04-01T08:00:00.000Z',
        diferenciaAceptada: c(0),
        diferenciaActual: c(-10),
        modo: 'estado_cuenta',
        transaccionesConciliadas: 0,
        cambiosPosteriores: [
          {
            registradoEn: '2027-04-12T09:00:00.000Z',
            motivos: ['eliminada'],
            foto: { fecha: f('2027-03-01'), montoEfecto: c(-5) },
          },
        ],
      },
    ]);
    const saldo = (x: Conciliacion) => (x.id === id('con0') ? { ...x, modo: 'saldo' as const } : x);
    const conSaldo = {
      ...i,
      hechos: { ...i.hechos, conciliaciones: i.hechos.conciliaciones.map(saldo) },
    };
    const modos = detalleCuenta(conSaldo, id('ef'));
    expect(modos.conciliaciones.map((x) => x.modo)).toEqual(['estado_cuenta', 'saldo']);
    expect(ef.programadas).toEqual([
      { programada: { id: id('prog-in'), nombre: 'RESCATE' }, rol: 'destino', activa: false },
      { programada: { id: id('prog-out'), nombre: 'LUZ' }, rol: 'origen', activa: true },
    ]);
    expect(ef.acciones).toEqual({
      puedeArchivar: false,
      bloqueosArchivo: ['cuenta_con_saldo'],
      puedeEliminar: false,
      bloqueosEliminar: ['cuenta_con_movimientos', 'cuenta_con_programadas'],
    });

    // Filtros: período (con su navegación), tipo, estado y paginación por cursor.
    const marzo = detalleCuenta(i, id('ef'), { periodoInicio: f('2027-03-01') });
    expect(marzo.movimientos.map((m) => m.id)).toEqual([id('retiro'), id('aporte'), id('g-mar')]);
    expect(marzo.navegacion).toEqual({ anterior: f('2027-02-01'), siguiente: f('2027-04-01') });
    expect(detalleCuenta(i, id('ef'), { tipo: 'gasto' }).movimientos.map((m) => m.id)).toEqual([
      id('g-mar'),
    ]);
    expect(detalleCuenta(i, id('ef'), { estado: 'conciliada' }).movimientos).toEqual([]);
    const p1 = detalleCuenta(i, id('ef'), { limite: 3 });
    expect(p1.movimientos.map((m) => m.id)).toEqual([id('abono'), id('pago'), id('retiro')]);
    const p2 = detalleCuenta(i, id('ef'), { limite: 3, cursor: p1.siguienteCursor as string });
    expect(p2.movimientos.map((m) => m.id)).toEqual([id('aporte'), id('g-mar'), id('cuota1')]);
    expect(() => detalleCuenta(i, id('nada'))).toThrow(RangeError);
    expect(() => detalleCuenta(i, id('ef'), { periodoInicio: f('2020-01-01') })).toThrow(
      RangeError,
    );

    // Tarjeta: ciclo, uso del límite y desglose del pago a hoy.
    const vi = detalleCuenta(i, id('vi'), aux);
    expect(vi.cuenta).toMatchObject({ institucion: 'Banco Uno', ultimos4: '1234' });
    expect(vi.tarjeta).toEqual({
      deuda: c(170),
      saldoAFavor: c(0),
      reservado: c(0),
      faltaReservar: c(170),
      reservaExcedente: c(0),
      limite: c(1000),
      usoLimite: 1700,
      cicloFacturacion: { desde: f('2027-04-02'), hasta: f('2027-05-01') },
      desgloseAlPagar: {
        deudaAnterior: c(200),
        cargosDelCiclo: c(50),
        yaPagado: c(80),
        paraNoGenerarIntereses: c(120),
      },
    });
    expect(vi.acciones.bloqueosArchivo).toEqual([
      'cuenta_con_saldo',
      'tarjeta_con_deuda',
      'reserva_tarjeta_no_cero', // Disp(pago(t)) ≠ 0 también cuando falta reservar
    ]);
    expect(detalleCuenta(i, id('mc')).tarjeta?.usoLimite).toBe(0);

    // Préstamo con modelo: amortización con estado, comparación y costo financiero.
    const pr = detalleCuenta(i, id('pr')).prestamo;
    expect(pr?.capitalPendiente).toBe(c(1002.23));
    expect(pr?.amortizacion?.length).toBe(11); // el abono acorta el plazo;
    expect(pr?.amortizacion?.slice(0, 3)).toEqual([
      {
        numero: 1,
        fecha: f('2027-02-10'),
        interes: c(12.23),
        seguro: c(0),
        capital: c(97.77),
        saldo: c(1102.23),
        estado: 'pagada',
        pagado: c(110),
      },
      {
        numero: 2,
        fecha: f('2027-03-10'),
        interes: c(10.15),
        seguro: c(0),
        capital: c(99.85),
        saldo: c(1002.38),
        estado: 'atrasada',
        pagado: c(0),
      },
      {
        numero: 3,
        fecha: f('2027-04-10'),
        interes: c(10.22),
        seguro: c(0),
        capital: c(99.78),
        saldo: c(902.6),
        estado: 'atrasada',
        pagado: c(0),
      },
    ]);
    expect(pr?.amortizacion?.at(-1)).toMatchObject({
      numero: 11,
      saldo: c(0),
      estado: 'pendiente',
    });
    expect(pr?.comparacion).toEqual({ proyectadoHastaHoy: c(330), pagadoHastaHoy: c(110) });
    expect(pr?.costoFinanciero).toEqual({ interes: c(12.23), seguro: c(0) });
    expect(pr?.condiciones).toMatchObject({ contraparte: 'Banco', cuotaPactada: c(110) });

    // Préstamo sin modelo: sin tabla ni comparación.
    const pr2 = detalleCuenta(i, id('pr2')).prestamo;
    expect(pr2?.amortizacion).toBeNull();
    expect(pr2?.comparacion).toBeNull();

    // Inversión.
    expect(detalleCuenta(i, id('inv')).inversion).toEqual({
      valor: c(425),
      aportes: c(60),
      retiros: c(40),
      ajustes: c(5),
    });
    expect(detalleCuenta(i, id('ef')).inversion).toBeUndefined();

    // Una cuenta en cero sin movimientos se puede archivar y eliminar; una tarjeta sin deuda ni reserva solo
    // queda bloqueada por su saldo a favor.
    expect(detalleCuenta(i, id('vacia')).acciones).toEqual({
      puedeArchivar: true,
      bloqueosArchivo: [],
      puedeEliminar: true,
      bloqueosEliminar: [],
    });
    expect(detalleCuenta(i, id('mc')).acciones.bloqueosArchivo).toEqual(['cuenta_con_saldo']);

    // Un abono a capital reduce el saldo desde la primera cuota posterior a su fecha (Anexo A.2).
    expect(pr?.amortizacion?.[3]).toEqual({
      numero: 4,
      fecha: f('2027-05-10'),
      interes: c(7.92),
      seguro: c(0),
      capital: c(102.08),
      saldo: c(700.52),
      estado: 'pendiente',
      pagado: c(0),
    });

    // Solo activos y sin conciliaciones: la barra de deudas queda en cero.
    const solo = cuentas(
      calcular(
        {
          ...hechosDe(i),
          cuentas: hechosDe(i).cuentas.filter((k) => k.id === id('ef')),
          tarjetas: [],
          prestamos: [],
          inversiones: [],
          categorias: hechosDe(i).categorias.filter((x) => x.clase === 'normal'),
          transacciones: hechosDe(i).transacciones.filter((t) => t.id === id('si-ef')),
          efectos: hechosDe(i).efectos.filter((e) => e.transaccionId === id('si-ef')),
          lineas: [],
          programadas: [],
          conciliaciones: [],
        },
        f('2027-04-15'),
      ),
    );
    expect(solo.posicionNeta.barras).toEqual({ activosBp: 10_000, deudasBp: 0 });
    expect(solo.efectivo[0]).not.toHaveProperty('ultimaConciliacion');

    // Archivada: no se vuelve a archivar, y sin movimientos ni programadas se puede eliminar.
    const vieja = detalleCuenta(i, id('vieja'));
    expect(vieja.cuenta.archivada).toBe(true);
    expect(vieja.acciones).toEqual({
      puedeArchivar: false,
      bloqueosArchivo: ['cuenta_ya_archivada'],
      puedeEliminar: true,
      bloqueosEliminar: [],
    });
  });

  it('PRU-DOM-CTA-108 [CA-51.7, CA-51.8] usoSinReservarBp con la tarjeta Visa (te falta reservar $170.00): 100 con límite $17,000.00, nulo con límite $0.00 y 10,000 si lo que falta supera el límite; las barras con activos y deudas en $0.00 son 0', () => {
    const h = estado().hechos;
    const conLimite = (limite: number) => {
      const lista = cuentas(
        calcular(
          {
            ...h,
            tarjetas: h.tarjetas.map((t) =>
              t.cuentaId === id('vi') ? { ...t, limiteCredito: c(limite) } : t,
            ),
          },
          f('2027-04-15'),
        ),
      );
      return lista.tarjetas.find((t) => t.cuenta.id === id('vi'));
    };
    expect(conLimite(17000)).toMatchObject({ faltaReservar: c(170), usoSinReservarBp: 100 });
    expect(conLimite(0)).toMatchObject({ faltaReservar: c(170), usoSinReservarBp: null });
    expect(conLimite(100)).toMatchObject({ faltaReservar: c(170), usoSinReservarBp: 10_000 });

    // Sin saldos, las dos barras valen 0 (con activos iguales a deudas valen 10.000: lo comprueba la E2E de Cuentas).
    const vacio = (extra: Partial<Hechos> = {}) =>
      cuentas(
        calcular(
          {
            ...h,
            cuentas: h.cuentas.filter((k) => k.id === id('ef')),
            tarjetas: [],
            prestamos: [],
            inversiones: [],
            transacciones: [],
            efectos: [],
            lineas: [],
            conciliaciones: [],
            ...extra,
          },
          f('2027-04-15'),
        ),
      ).posicionNeta.barras;
    expect(vacio()).toEqual({ activosBp: 0, deudasBp: 0 });
  });
});
