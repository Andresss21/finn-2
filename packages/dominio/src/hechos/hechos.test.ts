import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  AvisoOperacion,
  BigintTexto,
  Cambio,
  ComandoDominio,
  FilaHecho,
  FilasPorTabla,
  GeneradorIds,
  Hechos,
  Impacto,
  Instantanea,
  Rechazo,
  ResultadoAplicar,
  TablaEscribible,
  Transaccion,
  Uuid,
} from '../index';
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';

// Una clave por columna de cada fila: si falta o sobra una, no compila.
const COLUMNAS: { readonly [T in TablaEscribible]: Record<keyof FilasPorTabla[T], true> } = {
  vigencias_ciclo: { id: true, diaInicio: true, rigeDesde: true, revision: true },
  cuentas: {
    id: true,
    tipo: true,
    nombre: true,
    institucionId: true,
    ultimos4: true,
    fechaApertura: true,
    orden: true,
    archivada: true,
    revision: true,
  },
  tarjetas: {
    cuentaId: true,
    tipo: true,
    limiteCredito: true,
    tasaAnualMillonesimas: true,
    diaCorte: true,
    diaPago: true,
    red: true,
    color: true,
    revision: true,
  },
  prestamos: {
    cuentaId: true,
    tipo: true,
    contraparte: true,
    montoOriginal: true,
    tasaNominalAnualMillonesimas: true,
    tipoTasa: true,
    seguroPrimerMes: true,
    comision: true,
    frecuencia: true,
    frecuenciaDias: true,
    cuotaPactada: true,
    plazoCuotas: true,
    modeloCalculo: true,
    cuotasPagadasAlCrear: true,
    revision: true,
  },
  inversiones: {
    cuentaId: true,
    tipo: true,
    rendimientoAnualEsperadoMillonesimas: true,
    revision: true,
  },
  grupos: {
    id: true,
    nombre: true,
    orden: true,
    archivado: true,
    claveSistema: true,
    revision: true,
  },
  categorias: {
    id: true,
    grupoId: true,
    nombre: true,
    orden: true,
    clase: true,
    tarjetaId: true,
    archivada: true,
    revision: true,
  },
  asignaciones: { id: true, categoriaId: true, periodoInicio: true, monto: true, revision: true },
  deudores: { id: true, nombre: true, revision: true },
  transacciones: {
    id: true,
    tipo: true,
    fecha: true,
    horaRegistro: true,
    claveOrden: true,
    secuencia: true,
    origen: true,
    estadoBancario: true,
    conciliacionId: true,
    comercio: true,
    nota: true,
    total: true,
    monedaOriginal: true,
    montoOriginal: true,
    lineaCobradaId: true,
    revision: true,
  },
  efectos: {
    id: true,
    transaccionId: true,
    cuentaId: true,
    monto: true,
    interes: true,
    seguro: true,
    revision: true,
  },
  lineas: {
    id: true,
    transaccionId: true,
    orden: true,
    monto: true,
    categoriaId: true,
    deudorId: true,
    lineaOriginalId: true,
    revision: true,
  },
  condonaciones: {
    id: true,
    lineaId: true,
    fecha: true,
    monto: true,
    claveOrden: true,
    secuencia: true,
    categoriaId: true,
    revision: true,
  },
  metas: {
    id: true,
    categoriaId: true,
    tipo: true,
    modo: true,
    monto: true,
    fechaObjetivo: true,
    fechaCreacion: true,
    revision: true,
  },
  programadas: {
    id: true,
    tipo: true,
    cuentaId: true,
    cuentaDestinoId: true,
    comercio: true,
    monto: true,
    tolerancia: true,
    frecuencia: true,
    frecuenciaDias: true,
    primeraFecha: true,
    fechaFin: true,
    registroAutomatico: true,
    activa: true,
    revision: true,
  },
  programada_lineas: {
    id: true,
    programadaId: true,
    orden: true,
    monto: true,
    categoriaId: true,
    revision: true,
  },
  ocurrencias_resueltas: {
    id: true,
    programadaId: true,
    fechaEsperada: true,
    estado: true,
    transaccionId: true,
    revision: true,
  },
  conciliaciones: {
    id: true,
    cuentaId: true,
    fechaEstado: true,
    saldoEstado: true,
    terminadaEn: true,
    diferenciaAceptada: true,
    modo: true,
    revision: true,
  },
  instituciones: { id: true, nombre: true },
  movimientos: {
    id: true,
    smsId: true,
    estado: true,
    cuentaId: true,
    fecha: true,
    monto: true,
    comercio: true,
    tipoPropuesto: true,
    nota: true,
    duplicadoTransaccionId: true,
    duplicadoMovimientoId: true,
    esperadaProgramadaId: true,
    esperadaFecha: true,
    transaccionId: true,
  },
  movimiento_lineas: {
    id: true,
    movimientoId: true,
    orden: true,
    monto: true,
    categoriaId: true,
    deudorId: true,
    lineaOriginalId: true,
  },
  formatos_bancarios: {
    id: true,
    institucionId: true,
    nombre: true,
    tipoMovimiento: true,
    patron: true,
    banderas: true,
    montoSeparadorMiles: true,
    montoSeparadorDecimal: true,
    formatosFecha: true,
    activo: true,
  },
  reglas_comercio: { id: true, patron: true, categoriaId: true },
  cambios_posteriores: {
    id: true,
    conciliacionId: true,
    transaccionId: true,
    registradoEn: true,
    motivos: true,
    fecha: true,
    montoEfecto: true,
    comercio: true,
  },
};

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-101 BE-09-tipos: Los tipos públicos de los hechos compilan con los nombres del modelo Prisma y TablaEscribible coincide con las tablas [M] y [H] de 03 §0.4', () => {
    // [M] (18) y [H] (6) de 03 §0.4 / §1.2, sin las [I] ni las [T].
    type Esperadas =
      | 'vigencias_ciclo'
      | 'cuentas'
      | 'tarjetas'
      | 'prestamos'
      | 'inversiones'
      | 'grupos'
      | 'categorias'
      | 'asignaciones'
      | 'deudores'
      | 'transacciones'
      | 'efectos'
      | 'lineas'
      | 'condonaciones'
      | 'metas'
      | 'programadas'
      | 'programada_lineas'
      | 'ocurrencias_resueltas'
      | 'conciliaciones'
      | 'instituciones'
      | 'movimientos'
      | 'movimiento_lineas'
      | 'formatos_bancarios'
      | 'reglas_comercio'
      | 'cambios_posteriores';
    expectTypeOf<TablaEscribible>().toEqualTypeOf<Esperadas>();
    expect(Object.keys(COLUMNAS)).toHaveLength(24);

    // Tipos del dominio en las columnas.
    expectTypeOf<FilasPorTabla['transacciones']>().toEqualTypeOf<Transaccion>();
    expectTypeOf<Transaccion['total']>().toEqualTypeOf<Centavos>();
    expectTypeOf<Transaccion['fecha']>().toEqualTypeOf<FechaLocal>();
    expectTypeOf<Transaccion['id']>().toEqualTypeOf<Uuid>();
    expectTypeOf<Transaccion['secuencia']>().toEqualTypeOf<BigintTexto | null>();
    expectTypeOf<FilasPorTabla['asignaciones']['monto']>().toEqualTypeOf<Centavos>();
    expectTypeOf<FilasPorTabla['asignaciones']['periodoInicio']>().toEqualTypeOf<FechaLocal>();

    // Los hechos del motor son las 18 tablas [M] y no incluyen las [H].
    expectTypeOf<keyof Hechos>().toEqualTypeOf<
      Exclude<
        TablaEscribible,
        | 'instituciones'
        | 'movimientos'
        | 'movimiento_lineas'
        | 'formatos_bancarios'
        | 'reglas_comercio'
        | 'cambios_posteriores'
      >
    >();
    expectTypeOf<Instantanea['hechos']>().toEqualTypeOf<Hechos>();
    expectTypeOf<Instantanea['hoy']>().toEqualTypeOf<FechaLocal>();

    // Cambio: la fila y los campos siguen a la tabla.
    expectTypeOf<Extract<Cambio, { tipo: 'insertar'; tabla: 'cuentas' }>['fila']>().toEqualTypeOf<
      FilasPorTabla['cuentas']
    >();
    expectTypeOf<Extract<Cambio, { tipo: 'actualizar'; tabla: 'metas' }>['campos']>().toEqualTypeOf<
      Partial<FilasPorTabla['metas']>
    >();
    expectTypeOf<
      Extract<Cambio, { tipo: 'eliminarConciliacionesDeCuenta' }>['cuentaId']
    >().toEqualTypeOf<Uuid>();
    expectTypeOf<Cambio['tipo']>().toEqualTypeOf<
      'insertar' | 'actualizar' | 'eliminar' | 'eliminarConciliacionesDeCuenta'
    >();
    expectTypeOf<FilaHecho>().toEqualTypeOf<FilasPorTabla[TablaEscribible]>();

    // ResultadoAplicar, Rechazo, Impacto, AvisoOperacion, ComandoDominio y GeneradorIds.
    expectTypeOf<ResultadoAplicar['ok']>().toEqualTypeOf<boolean>();
    expectTypeOf<Extract<ResultadoAplicar, { ok: false }>['rechazos']>().toEqualTypeOf<
      readonly Rechazo[]
    >();
    const exitoso = {} as Extract<ResultadoAplicar, { ok: true }>;
    expectTypeOf(exitoso.cambios).toEqualTypeOf<readonly Cambio[]>();
    expectTypeOf(exitoso.hechosNuevos).toEqualTypeOf<Hechos>();
    expectTypeOf(exitoso.impacto).toEqualTypeOf<Impacto>();
    expectTypeOf(exitoso.avisos).toEqualTypeOf<readonly AvisoOperacion[]>();
    expectTypeOf(exitoso.operacionDeclarada).toEqualTypeOf<
      'fusion' | 'eliminar_cuenta' | undefined
    >();
    expectTypeOf<Impacto['deltaLpa']>().toEqualTypeOf<Centavos>();
    expectTypeOf<ComandoDominio['operacion']>().toEqualTypeOf<
      | 'OP-01'
      | 'OP-02'
      | 'OP-03'
      | 'OP-04'
      | 'OP-05'
      | 'OP-06'
      | 'OP-07'
      | 'OP-08'
      | 'OP-09'
      | 'OP-10'
      | 'OP-11'
      | 'OP-12'
      | 'OP-13'
      | 'OP-14'
      | 'OP-15'
      | 'OP-17'
      | 'OP-18'
      | 'OP-48'
      | 'OP-35'
      | 'OP-20'
      | 'OP-21'
      | 'OP-22'
      | 'OP-23'
      | 'OP-24'
      | 'OP-27'
      | 'OP-28'
      | 'OP-29'
      | 'OP-30'
      | 'OP-31'
      | 'OP-52'
      | 'OP-46'
      | 'OP-47'
      | 'OP-53'
      | 'OP-36'
      | 'OP-37'
      | 'OP-40'
      | 'OP-39'
      | 'OP-41'
      | 'OP-49'
      | 'OP-50'
      | 'OP-25'
      | 'OP-26'
    >();
    expectTypeOf<GeneradorIds['siguiente']>().toEqualTypeOf<() => Uuid>();
  });
});
