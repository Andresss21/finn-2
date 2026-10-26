import { describe, expect, it } from 'vitest';
import type {
  Asignacion,
  Cambio,
  Categoria,
  ComandoDominio,
  ComandoOp01,
  Conciliacion,
  Cuenta,
  Efecto,
  GeneradorIds,
  Hechos,
  Instante,
  Programada,
  ResultadoAplicar,
  Tarjeta,
  TipoCuenta,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';
import { claveOrdenEditada } from './op-02';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const ins = (t: string) => t as Instante;
/** Ciclo del día 1: enero y febrero cerrados, marzo activo. */
const HOY = f('2027-03-15');
const INSTANTE = ins('2027-03-15T15:00:00.000Z');

/** Contador determinista (04 §2.4.1: en pruebas, un contador). */
const contador = (): GeneradorIds => {
  let n = 0;
  return { siguiente: () => id(`n${++n}`) };
};

const cuenta = (
  nombre: string,
  tipo: TipoCuenta,
  apertura: string,
  extra: Partial<Cuenta> = {},
): Cuenta => ({
  id: id(nombre),
  tipo,
  nombre,
  institucionId: null,
  ultimos4: null,
  fechaApertura: f(apertura),
  orden: 1,
  archivada: false,
  revision: null,
  ...extra,
});
const subtipoTarjeta = {
  tipo: 'tarjeta',
  limiteCredito: c(1000),
  tasaAnualMillonesimas: null,
  diaCorte: 20,
  diaPago: 5,
  red: null,
  color: null,
} as const;
const tarjeta = (cuentaId: string): Tarjeta => ({
  cuentaId: id(cuentaId),
  ...subtipoTarjeta,
  revision: null,
});
const categoria = (
  cat: string,
  nombre: string,
  tarjetaId: string | null,
  archivada = false,
): Categoria => ({
  id: id(cat),
  grupoId: id(tarjetaId === null ? 'G' : 'PT'),
  nombre,
  orden: 1,
  clase: tarjetaId === null ? 'normal' : 'pago',
  tarjetaId: tarjetaId === null ? null : id(tarjetaId),
  archivada,
  revision: null,
});
const asignacion = (cat: string, periodo: string, monto: number): Asignacion => ({
  id: id(`asig-${cat}-${periodo}`),
  categoriaId: id(cat),
  periodoInicio: f(periodo),
  monto: c(monto),
  revision: null,
});

/** Una transacción con un efecto en `cuentaId`; sin `cat`, es un saldo inicial. */
function movimiento(tx: string, fecha: string, cuentaId: string, monto: number, cat?: string) {
  const t: Transaccion = {
    id: id(tx),
    tipo: cat === undefined ? 'saldo_inicial' : 'gasto',
    fecha: f(fecha),
    horaRegistro: ins(`${fecha}T12:00:00.000Z`),
    claveOrden: ins(`${fecha}T12:00:00.000Z`),
    secuencia: null,
    origen: 'manual',
    estadoBancario: 'pendiente',
    conciliacionId: null,
    comercio: null,
    nota: null,
    total: c(Math.abs(monto)),
    monedaOriginal: null,
    montoOriginal: null,
    lineaCobradaId: null,
    revision: null,
  };
  const e: Efecto = {
    id: id(`ef-${tx}`),
    transaccionId: id(tx),
    cuentaId: id(cuentaId),
    monto: c(monto),
    interes: null,
    seguro: null,
    revision: null,
  };
  const l =
    cat === undefined
      ? []
      : [
          {
            id: id(`${tx}.1`),
            transaccionId: id(tx),
            orden: 1,
            monto: c(Math.abs(monto)),
            categoriaId: id(cat),
            deudorId: null,
            lineaOriginalId: null,
            revision: null,
          },
        ];
  return { t, e, l };
}

/**
 * E (efectivo, BAC 1111) con 1.000 de saldo inicial el 1 ene y un gasto de 100 en C1 el 3 mar;
 * T "Visa Oro" (tarjeta, BAC 2222) abierta el 1 feb con 200 de deuda inicial y su categoría P
 * (asignado 150 en feb, cerrado, y 50 en mar); M "Master", tarjeta archivada con su categoría PM;
 * X, efectivo archivada sin movimientos. LPA = 1.000 − 100 − 200 = 700.
 */
function base(): Hechos {
  const movs = [
    movimiento('si-E', '2027-01-01', 'E', 1000),
    movimiento('g1', '2027-03-03', 'E', -100, 'C1'),
    movimiento('si-T', '2027-02-01', 'T', -200),
  ];
  const bac = { institucionId: id('BAC') };
  return {
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [
      cuenta('E', 'efectivo', '2027-01-01', { ...bac, ultimos4: '1111', orden: 1 }),
      cuenta('T', 'tarjeta', '2027-02-01', {
        ...bac,
        ultimos4: '2222',
        orden: 2,
        nombre: 'Visa Oro',
      }),
      cuenta('M', 'tarjeta', '2027-01-01', { orden: 3, nombre: 'Master', archivada: true }),
      cuenta('X', 'efectivo', '2027-01-01', { orden: 4, archivada: true }),
    ],
    tarjetas: [tarjeta('T'), tarjeta('M')],
    prestamos: [],
    inversiones: [],
    grupos: [
      {
        id: id('G'),
        nombre: 'Gastos',
        orden: 1,
        archivado: false,
        claveSistema: null,
        revision: null,
      },
      {
        id: id('PT'),
        nombre: 'Pagos de tarjeta',
        orden: 0,
        archivado: false,
        claveSistema: 'pagos_tarjeta',
        revision: null,
      },
    ],
    categorias: [
      categoria('C1', 'Comida', null),
      categoria('P', 'Visa Oro', 'T'),
      categoria('PM', 'Master', 'M', true),
    ],
    asignaciones: [
      asignacion('C1', '2027-03-01', 100),
      asignacion('P', '2027-02-01', 150),
      asignacion('P', '2027-03-01', 50),
    ],
    deudores: [],
    transacciones: movs.map((m) => m.t),
    efectos: movs.map((m) => m.e),
    lineas: movs.flatMap((m) => m.l),
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
}

const ejecutar = (h: Hechos, comando: ComandoDominio) => aplicar(h, comando, HOY);
const exito = (r: ResultadoAplicar) => {
  if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);
  return r;
};
const rechazos = (r: ResultadoAplicar) => (r.ok ? [] : r.rechazos);
const avisos = (r: ResultadoAplicar) => (r.ok ? r.avisos.map((a) => a.codigo) : []);

/** OP-01 de una cuenta sin institución, abierta hoy, con saldo 0. */
const crear = (
  nombre: string,
  tipo: TipoCuenta,
  extra: Partial<ComandoOp01> = {},
  cuentaExtra: Partial<ComandoOp01['cuenta']> = {},
): ComandoOp01 => ({
  operacion: 'OP-01',
  id: id(nombre),
  instante: INSTANTE,
  ids: contador(),
  cuenta: { tipo, nombre, institucionId: null, ultimos4: null, ...cuentaExtra },
  ...(tipo === 'tarjeta' && { subtipo: subtipoTarjeta }),
  saldo: c(0),
  ...extra,
});

describe('PRU-DOM-CTA-102: aplicar, operaciones de cuentas (01 §5.1, 04 §3.1)', () => {
  it('PRU-DOM-CTA-102 [INV-22] OP-01 BE-35: una tarjeta nace con su subtipo, su categoría de pago con su nombre en Pagos de tarjeta y el saldo inicial como −deuda', () => {
    const comando = crear(
      'U',
      'tarjeta',
      { saldo: c(300) },
      {
        fechaApertura: f('2027-03-10'),
      },
    );
    const r = exito(ejecutar(base(), comando));
    expect(r.cambios).toEqual([
      {
        tipo: 'insertar',
        tabla: 'cuentas',
        fila: cuenta('U', 'tarjeta', '2027-03-10', { orden: 5 }),
      },
      { tipo: 'insertar', tabla: 'tarjetas', fila: tarjeta('U') },
      {
        tipo: 'insertar',
        tabla: 'categorias',
        fila: { ...categoria('n1', 'U', 'U'), orden: 2 },
      },
      {
        tipo: 'insertar',
        tabla: 'transacciones',
        fila: {
          ...movimiento('n2', '2027-03-10', 'U', -300).t,
          horaRegistro: INSTANTE,
          claveOrden: INSTANTE,
        },
      },
      {
        tipo: 'insertar',
        tabla: 'efectos',
        fila: { ...movimiento('n2', '2027-03-10', 'U', -300).e, id: id('n3') },
      },
    ]);
    // inv. 22: la tarjeta tiene exactamente una categoría de pago.
    expect(r.hechosNuevos.categorias.filter((x) => x.tarjetaId === 'U')).toHaveLength(1);
    // Deuda 300 sin reserva: S(U) = 300 aparece y se informa después (AV-07). Sin LPA de por medio.
    expect(r.impacto.deltaTarjetas).toEqual([
      { tarjetaId: 'U', deltaSaldo: c(300), deltaReserva: c(0) },
    ]);
    expect(r.impacto.deltaLpa).toBe(0);
    expect(avisos(r)).toEqual(['AV-07']);
  });

  it('PRU-DOM-CTA-102 [AV-01] OP-01: el saldo inicial lleva el signo de la cuenta; la apertura por defecto es hoy; con saldo 0 no hay transacción; una apertura en un período cerrado es retroactiva', () => {
    const hoy = exito(ejecutar(base(), crear('D', 'efectivo', { saldo: c(500) })));
    expect(hoy.cambios[0]).toMatchObject({ fila: { fechaApertura: HOY, orden: 5 } });
    expect(hoy.cambios[2]).toMatchObject({ tabla: 'efectos', fila: { monto: c(500) } });
    expect(hoy.impacto.deltaLpa).toBe(c(500));
    expect(avisos(hoy)).toEqual([]);
    // Sobregiro inicial de efectivo: −saldo, con total positivo.
    const neg = exito(ejecutar(base(), crear('D', 'efectivo', { saldo: c(-20) })));
    expect(neg.cambios.slice(1).map((x) => (x.tipo === 'insertar' ? x.fila : null))).toMatchObject([
      { tipo: 'saldo_inicial', total: c(20) },
      { monto: c(-20) },
    ]);
    // Tarjeta con saldo a favor (entrada negativa): +saldo.
    const favor = crear('U', 'tarjeta', { saldo: c(-40) });
    expect(exito(ejecutar(base(), favor)).cambios[4]).toMatchObject({ fila: { monto: c(40) } });
    expect(exito(ejecutar(base(), crear('D', 'efectivo'))).cambios).toHaveLength(1);
    const prestamo: ComandoOp01['subtipo'] = {
      tipo: 'prestamo',
      contraparte: 'Banco',
      montoOriginal: c(900),
      tasaNominalAnualMillonesimas: null,
      tipoTasa: 'fija',
      seguroPrimerMes: null,
      comision: null,
      frecuencia: 'mensual',
      frecuenciaDias: null,
      cuotaPactada: c(100),
      plazoCuotas: 9,
      modeloCalculo: null,
      cuotasPagadasAlCrear: 0,
    };
    const conPrestamo = crear('L', 'prestamo', { subtipo: prestamo, saldo: c(900) });
    expect(
      exito(ejecutar(base(), conPrestamo))
        .cambios.slice(1)
        .map((x) => x.tipo === 'insertar' && x.tabla),
    ).toEqual(['prestamos', 'transacciones', 'efectos']);
    const atras = crear('D', 'efectivo', { saldo: c(500) }, { fechaApertura: f('2027-02-10') });
    const r = exito(ejecutar(base(), atras));
    expect(avisos(r)).toEqual(['AV-01']);
    expect(r.cambios[1]).toMatchObject({ fila: { fecha: '2027-02-10' } });
    // Un subtipo que no corresponde al tipo es un comando mal formado.
    expect(() => ejecutar(base(), crear('D', 'efectivo', { subtipo: subtipoTarjeta }))).toThrow(
      TypeError,
    );
  });

  it('PRU-DOM-CTA-102 OP-01 BE-35: rechaza una apertura posterior a hoy, últimos cuatro repetidos en la institución y un nombre de tarjeta que ya usa otra, también archivada', () => {
    const futura = crear('D', 'efectivo', {}, { fechaApertura: f('2027-03-16') });
    expect(rechazos(ejecutar(base(), futura))).toEqual([
      { codigo: 'fecha_posterior_a_hoy', datos: { fecha: '2027-03-16', hoy: HOY } },
    ]);
    const bac = { institucionId: id('BAC'), ultimos4: '2222' };
    expect(rechazos(ejecutar(base(), crear('D', 'efectivo', {}, bac)))).toEqual([
      {
        codigo: 'ultimos4_repetidos',
        campo: 'ultimos4',
        datos: { institucionId: 'BAC', ultimos4: '2222' },
      },
    ]);
    // Contra una cuenta archivada también.
    const h = base();
    const conX = {
      ...h,
      cuentas: h.cuentas.map((k) => (k.id === 'X' ? { ...k, ...bac, ultimos4: '3333' } : k)),
    };
    const x = crear('D', 'efectivo', {}, { ...bac, ultimos4: '3333' });
    expect(rechazos(ejecutar(conX, x))[0]?.codigo).toBe('ultimos4_repetidos');
    const abierta = crear('visa oro', 'tarjeta');
    expect(rechazos(ejecutar(base(), abierta))).toEqual([
      {
        codigo: 'nombre_repetido',
        campo: 'nombre',
        datos: { nombre: 'visa oro', grupo: 'Pagos de tarjeta' },
      },
    ]);
    const archivada = crear('MASTER', 'tarjeta');
    expect(rechazos(ejecutar(base(), archivada))).toEqual([
      {
        codigo: 'nombre_repetido',
        campo: 'nombre',
        datos: { nombre: 'MASTER', grupo: 'Pagos de tarjeta', tarjeta: 'Master' },
      },
    ]);
    // Una cuenta que no es tarjeta puede llamarse como una tarjeta: no tiene categoría de pago.
    expect(ejecutar(base(), crear('Visa Oro', 'efectivo')).ok).toBe(true);
  });

  it('PRU-DOM-CTA-102 [CB-14] OP-01: dos cuentas con los mismos últimos cuatro dígitos se admiten si son de instituciones distintas o sin institución', () => {
    const otra = crear('D', 'efectivo', {}, { institucionId: id('Agricola'), ultimos4: '1111' });
    expect(ejecutar(base(), otra).ok).toBe(true);
    const sin = crear('D', 'efectivo', {}, { institucionId: null, ultimos4: '1111' });
    expect(ejecutar(base(), sin).ok).toBe(true);
  });

  it('PRU-DOM-CTA-102 OP-02 BE-35: editar escribe solo los campos que cambian, y el nombre de una tarjeta arrastra el de su categoría de pago', () => {
    const r = exito(
      ejecutar(base(), {
        operacion: 'OP-02',
        cuentaId: id('T'),
        instante: INSTANTE,
        ids: contador(),
        campos: { nombre: 'Visa Platino', ultimos4: '2222' },
        subtipo: { limiteCredito: c(2000), diaCorte: 20 },
      }),
    );
    expect(r.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'cuentas', id: 'T', campos: { nombre: 'Visa Platino' } },
      { tipo: 'actualizar', tabla: 'tarjetas', id: 'T', campos: { limiteCredito: c(2000) } },
      { tipo: 'actualizar', tabla: 'categorias', id: 'P', campos: { nombre: 'Visa Platino' } },
    ]);
    expect(r.hechosNuevos.categorias.find((x) => x.id === 'P')?.nombre).toBe('Visa Platino');
    const igual = { operacion: 'OP-02', cuentaId: id('E'), instante: INSTANTE, ids: contador() };
    expect(exito(ejecutar(base(), { ...igual, campos: { nombre: 'E' } } as never)).cambios).toEqual(
      [],
    );
    expect(() =>
      ejecutar(base(), { ...igual, campos: {}, subtipo: { diaCorte: 3 } } as never),
    ).toThrow(TypeError);
  });

  it('PRU-DOM-CTA-102 [AV-01] OP-02: mover la apertura mueve el saldo inicial con clave_orden = máx(instante, anterior + 1 ms); cambiarlo de período es retroactivo', () => {
    const mover = (cuentaId: string, fecha: string, instante = INSTANTE) =>
      ejecutar(base(), {
        operacion: 'OP-02',
        cuentaId: id(cuentaId),
        instante,
        ids: contador(),
        campos: { fechaApertura: f(fecha) },
      });
    const r = exito(mover('T', '2027-01-20'));
    expect(r.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'cuentas', id: 'T', campos: { fechaApertura: '2027-01-20' } },
      {
        tipo: 'actualizar',
        tabla: 'transacciones',
        id: 'si-T',
        campos: { fecha: '2027-01-20', claveOrden: INSTANTE },
      },
    ]);
    expect(avisos(r)).toEqual(['AV-01']);
    // Un instante anterior a la clave vigente: la clave anterior + 1 ms.
    const antes = ins('2027-02-01T11:00:00.000Z');
    expect(exito(mover('T', '2027-02-02', antes)).cambios[1]).toMatchObject({
      campos: { claveOrden: '2027-02-01T12:00:00.001Z' },
    });
    expect(claveOrdenEditada(antes, ins('2027-01-31T23:59:59.999Z'))).toBe(
      '2027-02-01T11:00:00.000Z',
    );
    expect(claveOrdenEditada(antes, ins('2027-02-28T23:59:59.999Z'))).toBe(
      '2027-03-01T00:00:00.000Z',
    );
  });

  it('PRU-DOM-CTA-102 OP-02: el saldo inicial conciliado que cambia de fecha deja su cambio posterior (PC) y pide confirmar con AV-16', () => {
    const h = base();
    const k: Conciliacion = {
      id: id('K'),
      cuentaId: id('E'),
      fechaEstado: f('2027-01-31'),
      saldoEstado: c(1000),
      terminadaEn: ins('2027-02-01T10:00:00.000Z'),
      diferenciaAceptada: c(0),
      revision: null,
    };
    const conciliada = {
      ...h,
      conciliaciones: [k],
      transacciones: h.transacciones.map((t) =>
        t.id === 'si-E' ? { ...t, estadoBancario: 'conciliada' as const, conciliacionId: k.id } : t,
      ),
    };
    const r = exito(
      ejecutar(conciliada, {
        operacion: 'OP-02',
        cuentaId: id('E'),
        instante: INSTANTE,
        ids: contador(),
        campos: { fechaApertura: f('2026-12-20') },
      }),
    );
    expect(r.cambios.slice(1)).toEqual([
      {
        tipo: 'insertar',
        tabla: 'cambios_posteriores',
        fila: {
          id: 'n1',
          conciliacionId: 'K',
          transaccionId: 'si-E',
          registradoEn: INSTANTE,
          motivos: ['fecha'],
          fecha: '2027-01-01',
          montoEfecto: c(1000),
          comercio: null,
        },
      },
      {
        tipo: 'actualizar',
        tabla: 'transacciones',
        id: 'si-E',
        campos: {
          fecha: '2026-12-20',
          claveOrden: INSTANTE,
          estadoBancario: 'confirmada',
          conciliacionId: null,
        },
      },
    ]);
    expect(r.avisos.find((a) => a.codigo === 'AV-16')).toEqual({
      codigo: 'AV-16',
      momento: 'antes',
      requiereConfirmacion: true,
      datos: { transaccionId: 'si-E' },
    });
  });

  it('PRU-DOM-CTA-102 OP-02 BE-35: rechaza una apertura posterior a los movimientos o a hoy, últimos cuatro repetidos, un nombre de tarjeta en uso y una cuenta inexistente', () => {
    const editar = (cuentaId: string, campos: object) =>
      rechazos(
        ejecutar(base(), {
          operacion: 'OP-02',
          cuentaId: id(cuentaId),
          instante: INSTANTE,
          ids: contador(),
          campos,
        }),
      );
    // El saldo inicial (1 ene) se mueve con la apertura; el gasto del 3 mar no.
    expect(editar('E', { fechaApertura: f('2027-03-04') })).toEqual([
      {
        codigo: 'apertura_posterior_a_movimientos',
        campo: 'fechaApertura',
        datos: { fecha: '2027-03-03' },
      },
    ]);
    expect(editar('E', { fechaApertura: f('2027-03-03') })).toEqual([]);
    expect(editar('X', { fechaApertura: f('2027-03-16') })).toEqual([
      { codigo: 'fecha_posterior_a_hoy', datos: { fecha: '2027-03-16', hoy: HOY } },
    ]);
    expect(editar('E', { ultimos4: '2222' })).toEqual([
      {
        codigo: 'ultimos4_repetidos',
        campo: 'ultimos4',
        datos: { institucionId: 'BAC', ultimos4: '2222' },
      },
    ]);
    expect(editar('T', { nombre: 'master' })).toEqual([
      {
        codigo: 'nombre_repetido',
        campo: 'nombre',
        datos: { nombre: 'master', grupo: 'Pagos de tarjeta', tarjeta: 'Master' },
      },
    ]);
    // Su propio nombre con otras mayúsculas no se repite con su categoría de pago.
    expect(editar('T', { nombre: 'VISA ORO' })).toEqual([]);
    expect(editar('NO', { nombre: 'x' })).toEqual([
      { codigo: 'no_encontrado', datos: { entidad: 'cuentas', id: 'NO' } },
    ]);
  });

  it('PRU-DOM-CTA-102 OP-03: reordenar escribe posición × 10 solo en las filas que cambian; con el mismo orden no escribe; una lista que no son las cuentas abiertas es un conflicto', () => {
    const r = exito(ejecutar(base(), { operacion: 'OP-03', orden: [id('T'), id('E')] }));
    expect(r.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'cuentas', id: 'T', campos: { orden: 10 } },
      { tipo: 'actualizar', tabla: 'cuentas', id: 'E', campos: { orden: 20 } },
    ]);
    expect(r.impacto.deltaLpa).toBe(0);
    const igual = exito(ejecutar(base(), { operacion: 'OP-03', orden: [id('E'), id('T')] }));
    expect(igual.cambios).toEqual([]);
    for (const orden of [[id('E')], [id('E'), id('T'), id('X')], [id('E'), id('E')]])
      expect(rechazos(ejecutar(base(), { operacion: 'OP-03', orden }))).toEqual([
        { codigo: 'conflicto_desactualizado', campo: 'orden' },
      ]);
  });

  /** `base()` con la tarjeta U (sin deuda) creada por OP-01 y asignaciones en su categoría n1. */
  function conU(...asignaciones: [string, number][]): Hechos {
    const h = exito(ejecutar(base(), crear('U', 'tarjeta'))).hechosNuevos;
    return {
      ...h,
      asignaciones: [...h.asignaciones, ...asignaciones.map(([p, m]) => asignacion('n1', p, m))],
    };
  }
  const archivar = (h: Hechos, cuentaId: string, devolverAsignacionesFuturas?: boolean) =>
    ejecutar(h, {
      operacion: 'OP-04',
      cuentaId: id(cuentaId),
      ...(devolverAsignacionesFuturas !== undefined && { devolverAsignacionesFuturas }),
    });

  it('PRU-DOM-CTA-102 OP-04: rechaza archivar con saldo, una tarjeta con deuda, con Disponible en su categoría de pago o con asignaciones futuras sin devolverlas, y una ya archivada', () => {
    expect(rechazos(archivar(base(), 'E'))).toEqual([
      { codigo: 'cuenta_con_saldo', datos: { cuentaId: 'E', saldo: c(900) } },
    ]);
    expect(rechazos(archivar(base(), 'T'))).toEqual([
      { codigo: 'tarjeta_con_deuda', datos: { cuentaId: 'T', deuda: c(200) } },
    ]);
    expect(rechazos(archivar(conU(['2027-03-01', 30]), 'U'))).toEqual([
      { codigo: 'reserva_tarjeta_no_cero', datos: { cuentaId: 'U', disponible: c(30) } },
    ]);
    const futuras = conU(['2027-04-01', 30], ['2027-05-01', 5]);
    expect(rechazos(archivar(futuras, 'U'))).toEqual([
      { codigo: 'reserva_tarjeta_no_cero', datos: { cuentaId: 'U', futuras: c(35) } },
    ]);
    expect(rechazos(archivar(futuras, 'U', false))[0]?.codigo).toBe('reserva_tarjeta_no_cero');
    expect(rechazos(archivar(base(), 'X'))).toEqual([
      { codigo: 'cuenta_ya_archivada', datos: { cuentaId: 'X' } },
    ]);
    // Saldo a favor en una tarjeta: no tiene deuda, pero su saldo no es 0.
    const favor = exito(ejecutar(base(), crear('U', 'tarjeta', { saldo: c(-10) }))).hechosNuevos;
    expect(rechazos(archivar(favor, 'U'))).toEqual([
      { codigo: 'cuenta_con_saldo', datos: { cuentaId: 'U', saldo: c(10) } },
    ]);
  });

  it('PRU-DOM-CTA-102 OP-04 OP-05: archivar una tarjeta archiva su categoría de pago y, si se acepta, devuelve a LPA sus asignaciones futuras; desarchivar las abre a las dos', () => {
    const r = exito(archivar(conU(['2027-04-01', 30], ['2027-05-01', 5]), 'U', true));
    expect(r.cambios).toEqual([
      { tipo: 'eliminar', tabla: 'asignaciones', id: 'asig-n1-2027-04-01' },
      { tipo: 'eliminar', tabla: 'asignaciones', id: 'asig-n1-2027-05-01' },
      { tipo: 'actualizar', tabla: 'cuentas', id: 'U', campos: { archivada: true } },
      { tipo: 'actualizar', tabla: 'categorias', id: 'n1', campos: { archivada: true } },
    ]);
    // Lo asignado a futuro vuelve a LPA.
    expect(r.impacto.deltaLpa).toBe(c(35));
    const efectivo = exito(ejecutar(base(), crear('D', 'efectivo'))).hechosNuevos;
    expect(exito(archivar(efectivo, 'D')).cambios).toEqual([
      { tipo: 'actualizar', tabla: 'cuentas', id: 'D', campos: { archivada: true } },
    ]);
    const abrir = exito(ejecutar(base(), { operacion: 'OP-05', cuentaId: id('M') }));
    expect(abrir.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'cuentas', id: 'M', campos: { archivada: false } },
      { tipo: 'actualizar', tabla: 'categorias', id: 'PM', campos: { archivada: false } },
    ]);
    expect(abrir.hechosNuevos.categorias.find((x) => x.id === 'PM')?.archivada).toBe(false);
    expect(rechazos(ejecutar(base(), { operacion: 'OP-05', cuentaId: id('E') }))).toEqual([
      { codigo: 'cuenta_no_archivada', datos: { cuentaId: 'E' } },
    ]);
    expect(rechazos(ejecutar(base(), { operacion: 'OP-05', cuentaId: id('NO') }))[0]?.codigo).toBe(
      'no_encontrado',
    );
  });

  it('PRU-DOM-CTA-102 [AV-15] [INV-25] OP-06: eliminar una tarjeta con asignaciones en un período cerrado (F1) borra su categoría de pago con todas sus asignaciones, su saldo inicial y sus conciliaciones', () => {
    const r = exito(ejecutar(base(), { operacion: 'OP-06', cuentaId: id('T') }));
    expect(r.cambios).toEqual<Cambio[]>([
      { tipo: 'eliminar', tabla: 'asignaciones', id: id('asig-P-2027-02-01') },
      { tipo: 'eliminar', tabla: 'asignaciones', id: id('asig-P-2027-03-01') },
      { tipo: 'eliminar', tabla: 'transacciones', id: id('si-T') },
      { tipo: 'eliminarConciliacionesDeCuenta', cuentaId: id('T') },
      { tipo: 'eliminar', tabla: 'categorias', id: id('P') },
      { tipo: 'eliminar', tabla: 'cuentas', id: id('T') },
    ]);
    expect(r.operacionDeclarada).toBe('eliminar_cuenta');
    // ESC-43: Δ LPA = +Σ Asig(pago(t), ·) = 150 + 50.
    expect(r.impacto.deltaLpa).toBe(c(200));
    expect(r.avisos.find((a) => a.codigo === 'AV-15')).toEqual({
      codigo: 'AV-15',
      momento: 'antes',
      requiereConfirmacion: true,
      datos: { cuentaId: 'T', categoriaId: 'P', conciliaciones: 0 },
    });
    expect(avisos(r)).toEqual(['AV-01', 'AV-15']);
    // inv. 25: nada queda apuntando a la tarjeta ni a su categoría.
    const h = r.hechosNuevos;
    expect(h.tarjetas.map((x) => x.cuentaId)).toEqual(['M']);
    expect(h.efectos.some((e) => e.cuentaId === 'T')).toBe(false);
    expect(h.asignaciones.some((a) => a.categoriaId === 'P')).toBe(false);
    expect(h.categorias.map((x) => x.id)).toEqual(['C1', 'PM']);
  });

  it('PRU-DOM-CTA-102 [AV-15] [AV-01] OP-06: eliminar una tarjeta con su saldo inicial en el período activo es retroactivo solo por sus asignaciones de un período cerrado', () => {
    const h = conU(['2027-02-01', 15]);
    const r = exito(ejecutar(h, { operacion: 'OP-06', cuentaId: id('U') }));
    expect(avisos(r)).toEqual(['AV-01', 'AV-15']);
    const sinCerradas = exito(
      ejecutar(conU(['2027-03-01', 15]), { operacion: 'OP-06', cuentaId: id('U') }),
    );
    expect(avisos(sinCerradas)).toEqual(['AV-15']);
  });

  it('PRU-DOM-CTA-102 [AV-15] OP-06: eliminar una cuenta de efectivo con solo saldo inicial resta ese saldo de LPA; con movimientos o programadas se rechaza', () => {
    const conD = exito(ejecutar(base(), crear('D', 'efectivo', { saldo: c(500) }))).hechosNuevos;
    const r = exito(ejecutar(conD, { operacion: 'OP-06', cuentaId: id('D') }));
    expect(r.impacto.deltaLpa).toBe(c(-500));
    expect(avisos(r)).toEqual(['AV-15']);
    expect(r.avisos[0]?.datos).toEqual({ cuentaId: 'D', conciliaciones: 0 });
    // X, sin transacciones, también se elimina.
    expect(ejecutar(base(), { operacion: 'OP-06', cuentaId: id('X') }).ok).toBe(true);
    expect(rechazos(ejecutar(base(), { operacion: 'OP-06', cuentaId: id('E') }))).toEqual([
      { codigo: 'cuenta_con_movimientos', datos: { cuentaId: 'E' } },
    ]);
    const programada: Programada = {
      id: id('Q'),
      tipo: 'gasto',
      cuentaId: id('X'),
      cuentaDestinoId: null,
      comercio: 'Gimnasio',
      monto: c(10),
      tolerancia: c(0),
      frecuencia: 'mensual',
      frecuenciaDias: null,
      primeraFecha: f('2027-01-10'),
      fechaFin: null,
      registroAutomatico: false,
      activa: false,
      revision: null,
    };
    const conQ = { ...base(), programadas: [programada] };
    expect(rechazos(ejecutar(conQ, { operacion: 'OP-06', cuentaId: id('X') }))).toEqual([
      { codigo: 'cuenta_con_programadas', datos: { cuentaId: 'X', n: 1 } },
    ]);
    expect(rechazos(ejecutar(base(), { operacion: 'OP-06', cuentaId: id('NO') }))[0]?.codigo).toBe(
      'no_encontrado',
    );
  });
});
