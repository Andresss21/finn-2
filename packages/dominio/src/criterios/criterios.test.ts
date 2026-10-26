import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Categoria,
  ComandoOp35,
  GeneradorIds,
  Hechos,
  Instante,
  InterpretacionSms,
  Movimiento,
  MovimientoConTexto,
  Programada,
  ReglaComercio,
  ResultadoAplicar,
  Uuid,
} from '../hechos';
import { aplicar } from '../operaciones/aplicar';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { esAutodescarte } from './autodescarte';
import { categoriaPorHistorial, reglaDeComercio, sugerirCategoria } from './categoria';
import { coincidenciasDeConciliacion } from './conciliacion';
import { duplicado } from './duplicados';
import { emparejar } from './emparejamiento';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const ins = (t: string) => t as Instante;
const HOY = f('2027-03-15');
const ENE = f('2027-01-01');
const T0 = ins('2027-03-15T15:00:00.000Z');

const contador = (): GeneradorIds => {
  let n = 0;
  return { siguiente: () => id(`n${++n}`) };
};

const categoria = (cat: string, extra: Partial<Categoria> = {}): Categoria => ({
  id: id(cat),
  grupoId: id('G'),
  nombre: cat,
  orden: 1,
  clase: 'normal',
  tarjetaId: null,
  archivada: false,
  revision: null,
  ...extra,
});
const cuenta = (k: string, ultimos4: string, archivada = false) => ({
  id: id(k),
  tipo: 'efectivo' as const,
  nombre: k,
  institucionId: id('BAC'),
  ultimos4,
  fechaApertura: ENE,
  orden: 1,
  archivada,
  revision: null,
});
const programada = (p: string, extra: Partial<Programada> = {}): Programada => ({
  id: id(p),
  tipo: 'gasto',
  cuentaId: id('E'),
  cuentaDestinoId: null,
  comercio: p,
  monto: c(50),
  tolerancia: c(2),
  frecuencia: 'mensual',
  frecuenciaDias: null,
  primeraFecha: f('2027-01-10'),
  fechaFin: null,
  registroAutomatico: false,
  activa: true,
  revision: null,
  ...extra,
});

/** Un gasto en E (o el saldo inicial, sin líneas) con una línea por cada categoría. */
function tx(t: string, fecha: string, monto: number, comercio: string | null, cats: string[]) {
  const hora = ins(`${fecha}T12:00:00.000Z`);
  return {
    t: {
      id: id(t),
      tipo: cats.length === 0 ? 'saldo_inicial' : 'gasto',
      fecha: f(fecha),
      horaRegistro: hora,
      claveOrden: hora,
      secuencia: null,
      origen: 'manual',
      estadoBancario: 'pendiente',
      conciliacionId: null,
      comercio,
      nota: null,
      total: c(Math.abs(monto)),
      monedaOriginal: null,
      montoOriginal: null,
      lineaCobradaId: null,
      revision: null,
    } as const,
    e: {
      id: id(`ef-${t}`),
      transaccionId: id(t),
      cuentaId: id('E'),
      monto: c(monto),
      interes: null,
      seguro: null,
      revision: null,
    },
    l: cats.map((cat, k) => ({
      id: id(`${t}.${k + 1}`),
      transaccionId: id(t),
      orden: k + 1,
      monto: c(Math.abs(monto) / cats.length),
      categoriaId: id(cat),
      deudorId: null,
      lineaOriginalId: null,
      revision: null,
    })),
  };
}

/**
 * E (BAC 1234) con 1.000 de saldo inicial; X (BAC 5555) archivada, sin movimientos. Gastos en E:
 * g1 "Super  Selectos" 25 el 10 mar (SUPER), g2 "super selectos" 30 el 12 mar con dos líneas y g3
 * "Super Selectos" 40 el 1 feb (CAFE). Q1: programada mensual de 50 ± 2 en E, desde el 10 ene.
 */
function base(): Hechos {
  const txs = [
    tx('si-E', '2027-01-01', 1000, null, []),
    tx('g1', '2027-03-10', -25, 'Super  Selectos', ['SUPER']),
    tx('g2', '2027-03-12', -30, 'super selectos', ['SUPER', 'CAFE']),
    tx('g3', '2027-02-01', -40, 'Super Selectos', ['CAFE']),
  ];
  return {
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [cuenta('E', '1234'), cuenta('X', '5555', true)],
    tarjetas: [],
    prestamos: [],
    inversiones: [],
    grupos: [
      { id: id('G'), nombre: 'G', orden: 1, archivado: false, claveSistema: null, revision: null },
    ],
    categorias: [categoria('SUPER'), categoria('CAFE'), categoria('VIEJA', { archivada: true })],
    asignaciones: [],
    deudores: [],
    transacciones: txs.map((x) => x.t),
    efectos: txs.map((x) => x.e),
    lineas: txs.flatMap((x) => x.l),
    condonaciones: [],
    metas: [],
    programadas: [programada('Q1')],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
}

const movimiento = (m: string, extra: Partial<MovimientoConTexto> = {}): MovimientoConTexto => ({
  id: id(m),
  smsId: id(`sms-${m}`),
  estado: 'pendiente',
  cuentaId: id('E'),
  fecha: f('2027-03-14'),
  monto: c(30),
  comercio: null,
  tipoPropuesto: 'gasto',
  nota: null,
  duplicadoTransaccionId: null,
  duplicadoMovimientoId: null,
  esperadaProgramadaId: null,
  esperadaFecha: null,
  transaccionId: null,
  texto: `texto ${m}`,
  ...extra,
});

const reconocido = (extra: Partial<Extract<InterpretacionSms, { resultado: 'reconocido' }>>) =>
  ({
    resultado: 'reconocido',
    institucionId: id('BAC'),
    tipoMovimiento: 'compra',
    ultimos4: '1234',
    monto: c(50),
    comercio: null,
    fecha: f('2027-03-12'),
    ...extra,
  }) as const;

function comando(extra: Partial<ComandoOp35> = {}): ComandoOp35 {
  return {
    operacion: 'OP-35',
    id: id('M'),
    ids: contador(),
    sms: { id: id('S'), texto: 'BAC: compra', recibidoEn: T0, fechaRecepcion: HOY },
    interpretacion: reconocido({}),
    anteriores: [],
    movimientos: [],
    reglas: [],
    ...extra,
  };
}

const exito = (r: ResultadoAplicar) => {
  if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);
  return r;
};
const recibir = (extra: Partial<ComandoOp35> = {}, h = base()) =>
  exito(aplicar(h, comando(extra), HOY));
/** El movimiento que inserta OP-35 y la categoría de su línea (o `undefined` si no tiene). */
function resultado(r: Extract<ResultadoAplicar, { ok: true }>) {
  const [m, l] = r.cambios.map((x) => (x.tipo === 'insertar' ? x.fila : undefined));
  return { m: m as Movimiento, linea: l as { categoriaId: Uuid | null; monto: Centavos } };
}
const sms = (texto: string, recibidoEn: string, k = 'A') => ({
  id: id(k),
  texto,
  recibidoEn: ins(recibidoEn),
});
const regla = (r: string, patron: string, cat: string): ReglaComercio => ({
  id: id(r),
  patron,
  categoriaId: id(cat),
});

describe('PRU-DOM-BAND-101: criterios de comparación (01 §4.17) y OP-35 pasos 2 a 11', () => {
  it('PRU-DOM-BAND-101 [INV-16] autodescarte: texto idéntico en [t − 10 min, t), a 10 minutos exactos sí y a 10 min + 1 ms no; ningún otro caso se descarta solo', () => {
    const yo = sms('BAC: compra', T0, 'S');
    const es = (...xs: ReturnType<typeof sms>[]) => esAutodescarte(yo, xs);
    expect(es(sms('BAC: compra', '2027-03-15T14:50:00.000Z'))).toBe(true);
    expect(es(sms('BAC: compra', '2027-03-15T14:49:59.999Z'))).toBe(false);
    expect(es(sms('BAC: compra', '2027-03-15T14:59:59.999Z'))).toBe(true);
    expect(es(sms('BAC: compra', T0))).toBe(false); // no es anterior
    expect(es(sms('BAC: compra ', '2027-03-15T14:55:00.000Z'))).toBe(false); // un espacio más
    expect(es(sms('bac: compra', '2027-03-15T14:55:00.000Z'))).toBe(false); // mayúsculas
    expect(es({ ...yo })).toBe(false); // el mismo SMS no se descarta a sí mismo
    const medianoche = sms('BAC: compra', '2027-03-15T00:05:00.000Z', 'S');
    const antes = sms('BAC: compra', '2027-03-14T23:55:00.000Z');
    expect(esAutodescarte(medianoche, [antes])).toBe(true);

    // Por OP-35: autodescartado sin aviso ni candidatas, reconocido o no.
    const a = recibir({ anteriores: [sms('BAC: compra', '2027-03-15T14:50:00.000Z')] });
    const { m, linea } = resultado(a);
    expect(m).toMatchObject({ estado: 'autodescartado', cuentaId: 'E', monto: c(50) });
    expect(m.esperadaProgramadaId).toBeNull();
    expect(linea.categoriaId).toBeNull();
    expect(a.avisos).toEqual([]);
    const nr = recibir({
      interpretacion: { resultado: 'no_reconocido' },
      anteriores: [sms('BAC: compra', '2027-03-15T14:51:00.000Z')],
    });
    expect(resultado(nr).m.estado).toBe('autodescartado');
    expect(nr.avisos).toEqual([]);
    const b = recibir({ anteriores: [sms('BAC: compra', '2027-03-15T14:49:59.999Z')] });
    expect(resultado(b).m.estado).toBe('con_coincidencia');
  });

  it('PRU-DOM-BAND-101 emparejamiento: misma cuenta, Δ monto ≤ tolerancia, Δ fecha ≤ 5 días; desempata por fecha más cercana, menor Δ monto y fecha esperada más antigua', () => {
    const h = base();
    const de = (monto: number, fecha: string, ps: Programada[] = h.programadas, ms = []) =>
      emparejar({ ...h, programadas: ps }, ms, {
        cuentaId: id('E'),
        monto: c(monto),
        fecha: f(fecha),
      });
    expect(de(50, '2027-03-15')).toEqual({ programadaId: 'Q1', fecha: f('2027-03-10') }); // 5 días
    expect(de(50, '2027-03-05')).toEqual({ programadaId: 'Q1', fecha: f('2027-03-10') });
    expect(de(50, '2027-03-16')).toBeUndefined(); // 6 días del 10 mar y 25 del 10 abr
    expect(de(52, '2027-03-10')).toBeDefined(); // Δ = tolerancia
    expect(de(52.01, '2027-03-10')).toBeUndefined();
    expect(de(47.99, '2027-03-10')).toBeUndefined();
    expect(
      emparejar(h, [], { cuentaId: id('X'), monto: c(50), fecha: f('2027-03-10') }),
    ).toBeUndefined(); // otra cuenta
    expect(de(50, '2027-03-10', [programada('Q1', { activa: false })])).toBeUndefined();

    // Desempates: la fecha más cercana gana aunque el monto difiera más.
    const cerca = programada('B', { monto: c(51), primeraFecha: f('2027-01-11') });
    expect(de(50, '2027-03-12', [programada('A'), cerca])).toEqual({
      programadaId: 'B',
      fecha: f('2027-03-11'),
    });
    // A igual distancia, el menor Δ monto.
    const lejos = programada('B', { monto: c(51), primeraFecha: f('2027-01-14') });
    expect(de(50, '2027-03-12', [lejos, programada('A')])?.programadaId).toBe('A');
    // A igual distancia y Δ monto, la fecha esperada más antigua.
    const despues = programada('A', { primeraFecha: f('2027-01-14') });
    expect(de(50, '2027-03-12', [despues, programada('B')])).toEqual({
      programadaId: 'B',
      fecha: f('2027-03-10'),
    });
    // Semanal: de dos ocurrencias de la misma programada, la más cercana.
    const semanal = programada('W', { frecuencia: 'semanal', primeraFecha: f('2027-03-01') });
    expect(de(50, '2027-03-12', [semanal])).toEqual({ programadaId: 'W', fecha: f('2027-03-15') });
  });

  it('PRU-DOM-BAND-101 [CB-16] la ocurrencia pendiente o registrada sin emparejar es candidata; una emparejada, omitida o ya propuesta no, y el segundo SMS se evalúa como posible duplicado', () => {
    const h = base();
    const ocurrencia = (estado: 'emparejada' | 'registrada' | 'omitida') => ({
      ...h,
      ocurrencias_resueltas: [
        {
          id: id('o'),
          programadaId: id('Q1'),
          fechaEsperada: f('2027-03-10'),
          estado,
          transaccionId: null,
          revision: null,
        },
      ],
    });
    const sms12 = { cuentaId: id('E'), monto: c(50), fecha: f('2027-03-12') };
    expect(emparejar(ocurrencia('registrada'), [], sms12)?.fecha).toBe('2027-03-10');
    expect(emparejar(ocurrencia('emparejada'), [], sms12)).toBeUndefined();
    expect(emparejar(ocurrencia('omitida'), [], sms12)).toBeUndefined();
    const vinculado = movimiento('V', {
      estado: 'aprobado',
      esperadaProgramadaId: id('Q1'),
      esperadaFecha: f('2027-03-10'),
    });
    expect(emparejar(ocurrencia('registrada'), [vinculado], sms12)).toBeUndefined();
    const descartado = { ...vinculado, estado: 'descartado' as const };
    expect(emparejar(ocurrencia('registrada'), [descartado], sms12)).toBeDefined();

    // Dos SMS de la misma ocurrencia por OP-35: el primero empareja, el segundo ya no (inv. 15).
    const primero = recibir();
    const { m } = resultado(primero);
    expect(m).toMatchObject({
      estado: 'con_coincidencia',
      esperadaProgramadaId: 'Q1',
      esperadaFecha: '2027-03-10',
      fecha: '2027-03-12',
      tipoPropuesto: 'gasto',
    });
    const segundo = recibir({
      id: id('M2'),
      sms: { id: id('S2'), texto: 'BAC: compra otra', recibidoEn: T0, fechaRecepcion: HOY },
      movimientos: [{ ...m, texto: 'BAC: compra' }],
    });
    expect(resultado(segundo).m).toMatchObject({
      estado: 'posible_duplicado',
      duplicadoMovimientoId: 'M',
      duplicadoTransaccionId: null,
      esperadaProgramadaId: null,
    });
  });

  it('PRU-DOM-BAND-101 [CB-17] posible duplicado: transacción aprobada o movimiento pendiente, misma cuenta y monto, ±1 día y texto distinto', () => {
    const h = base();
    const de = (monto: number, fecha: string, ms: MovimientoConTexto[] = [], texto = 'nuevo') =>
      duplicado(h, ms, { cuentaId: id('E'), monto: c(monto), fecha: f(fecha), texto });
    expect(de(25, '2027-03-11')).toEqual({ transaccionId: 'g1' }); // +1 día
    expect(de(25, '2027-03-09')).toEqual({ transaccionId: 'g1' }); // −1 día
    expect(de(25, '2027-03-12')).toBeUndefined(); // 2 días
    expect(de(25.01, '2027-03-10')).toBeUndefined();
    const desdeSms = movimiento('A', { estado: 'aprobado', transaccionId: id('g1'), texto: 'x' });
    expect(de(25, '2027-03-10', [desdeSms], 'x')).toBeUndefined(); // mismo texto
    expect(de(25, '2027-03-10', [desdeSms], 'y')).toEqual({ transaccionId: 'g1' });

    const pendiente = movimiento('P');
    expect(de(30, '2027-03-15', [pendiente])).toEqual({ movimientoId: 'P' });
    expect(de(30, '2027-03-15', [pendiente], 'texto P')).toBeUndefined();
    for (const estado of ['descartado', 'autodescartado'] as const)
      expect(de(30, '2027-03-15', [{ ...pendiente, estado }])).toBeUndefined();
    for (const estado of ['con_coincidencia', 'posible_duplicado', 'no_reconocido'] as const)
      expect(de(30, '2027-03-15', [{ ...pendiente, estado }])).toEqual({ movimientoId: 'P' });
    expect(de(30, '2027-03-15', [{ ...pendiente, cuentaId: id('X') }])).toBeUndefined();
    // g2 (30, 12 mar) también cuenta: el más cercano gana; a igual distancia, la transacción.
    expect(de(30, '2027-03-13', [pendiente])).toEqual({ transaccionId: 'g2' });
    const mismoDia = movimiento('P', { fecha: f('2027-03-12') });
    expect(de(30, '2027-03-12', [mismoDia])).toEqual({ transaccionId: 'g2' });

    // Por OP-35, sin esperada que coincida: Posible duplicado y AV-23.
    const r = recibir({
      interpretacion: reconocido({ monto: c(30), fecha: f('2027-03-15') }),
      movimientos: [pendiente],
    });
    expect(resultado(r).m).toMatchObject({
      estado: 'posible_duplicado',
      duplicadoMovimientoId: 'P',
    });
    expect(r.avisos).toEqual([
      {
        codigo: 'AV-23',
        momento: 'despues',
        requiereConfirmacion: false,
        datos: {
          movimientoId: 'M',
          motivo: 'posible_duplicado',
          cuentaId: 'E',
          fecha: '2027-03-15',
          monto: c(30),
        },
      },
    ]);
  });

  it('PRU-DOM-BAND-101 regla de comercio de patrón más largo (sin mayúsculas, sin archivadas) y, si no hay, sugerencia por historial', () => {
    const h = base();
    const reglas = [
      regla('r1', 'super', 'CAFE'),
      regla('r2', 'Super Selectos', 'SUPER'),
      regla('r3', 'super selectos sa', 'VIEJA'), // la más larga, pero archivada
    ];
    expect(reglaDeComercio(h, reglas, 'SUPER SELECTOS SA')?.id).toBe('r2');
    expect(reglaDeComercio(h, reglas, 'Hipermercado Super')?.id).toBe('r1');
    expect(reglaDeComercio(h, reglas, 'Despensa')).toBeUndefined();
    const empate = [
      regla('b', 'abc', 'CAFE'),
      regla('a', 'abc', 'SUPER'),
      regla('z', 'xyz', 'CAFE'),
    ];
    expect(reglaDeComercio(h, empate, 'abc xyz')?.id).toBe('a');

    // Historial: g1 (10 mar, una línea) gana a g3 (1 feb); g2 (12 mar) tiene dos líneas.
    expect(categoriaPorHistorial(h, '  SUPER   selectos ')).toBe('SUPER');
    const archivada = {
      ...h,
      categorias: h.categorias.map((x) => (x.id === 'SUPER' ? { ...x, archivada: true } : x)),
    };
    expect(categoriaPorHistorial(archivada, 'super selectos')).toBe('CAFE');
    expect(categoriaPorHistorial(h, 'super')).toBeUndefined(); // otro comercio
    expect(sugerirCategoria(h, reglas, 'Super Selectos')).toBe('SUPER'); // por regla
    expect(sugerirCategoria(h, [regla('r', 'selectos', 'CAFE')], 'Super Selectos')).toBe('CAFE');
    expect(sugerirCategoria(h, [], 'Super Selectos')).toBe('SUPER'); // por historial
    expect(sugerirCategoria(h, reglas, null)).toBeNull();
    expect(sugerirCategoria(h, [], 'Despensa')).toBeNull();

    // Por OP-35: una línea por el monto con la categoría sugerida.
    const r = recibir({ interpretacion: reconocido({ comercio: 'Super Selectos', monto: c(80) }) });
    expect(resultado(r).linea).toMatchObject({ categoriaId: 'SUPER', monto: c(80) });
  });

  it('PRU-DOM-BAND-101 [CB-15, AV-23] OP-35 pasos 3 a 11: cuenta archivada o inexistente queda sin cuenta, fecha del SMS o de la recepción, tipo propuesto, Pendiente y AV-23', () => {
    for (const ultimos4 of ['5555', '0000']) {
      const r = recibir({ interpretacion: reconocido({ ultimos4, comercio: 'Super Selectos' }) });
      const { m, linea } = resultado(r);
      expect(m).toMatchObject({ estado: 'pendiente', cuentaId: null, monto: c(50) });
      expect(linea.categoriaId).toBe('SUPER');
      expect(r.avisos[0]?.datos).toEqual({
        movimientoId: 'M',
        motivo: 'nuevo',
        fecha: '2027-03-12',
        monto: c(50),
        comercio: 'Super Selectos',
      });
    }
    const otraInstitucion = recibir({ interpretacion: reconocido({ institucionId: id('OTRO') }) });
    expect(resultado(otraInstitucion).m.cuentaId).toBeNull();

    const sinFecha = recibir({ interpretacion: reconocido({ fecha: null, monto: c(10) }) });
    expect(resultado(sinFecha).m).toMatchObject({ estado: 'pendiente', fecha: HOY });
    const tipos = { compra: 'gasto', deposito: 'ingreso', pago_tarjeta: 'pago_tarjeta' } as const;
    for (const [tipoMovimiento, tipo] of Object.entries({ ...tipos, devolucion: 'devolucion' })) {
      const r = recibir({
        interpretacion: reconocido({ tipoMovimiento: tipoMovimiento as 'compra', monto: c(9) }),
      });
      expect(resultado(r).m.tipoPropuesto).toBe(tipo);
    }

    const nr = recibir({ interpretacion: { resultado: 'no_reconocido' } });
    expect(nr.cambios).toHaveLength(1);
    expect(resultado(nr).m).toMatchObject({ estado: 'no_reconocido', cuentaId: null, monto: null });
    expect(nr.avisos[0]?.datos).toEqual({ movimientoId: 'M', motivo: 'no_reconocido' });
    const coincide = recibir();
    expect(coincide.avisos[0]?.datos).toMatchObject({ motivo: 'coincidencia', cuentaId: 'E' });
  });

  it('PRU-DOM-BAND-101 [INV-13] los movimientos, las programadas y las esperadas no entran a calcular: OP-35 no cambia hechos, saldos, Disponibles ni LPA', () => {
    const h = base();
    const r = recibir({ interpretacion: reconocido({ comercio: 'Super Selectos' }) }, h);
    expect(r.cambios.map((x) => x.tipo === 'insertar' && x.tabla)).toEqual([
      'movimientos',
      'movimiento_lineas',
    ]);
    expect(r.hechosNuevos).toEqual(calcular(h, HOY).hechos); // los mismos, en forma canónica
    expect(r.impacto).toMatchObject({
      deltaLpa: 0,
      deltaDisponible: [],
      deltaTarjetas: [],
      deltaReduccionProyectadaLpaAlCierre: 0,
    });
    const [antes, despues] = [calcular(h, HOY), calcular(r.hechosNuevos, HOY)];
    expect(despues.cuentas).toEqual(antes.cuentas);
    expect(despues.lpa).toEqual(antes.lpa);
  });

  it('PRU-DOM-BAND-101 coincidencia de conciliación: misma cuenta y monto, ±3 días, 1 a 1 por fecha más cercana y clave de orden más antigua', () => {
    const p = (k: string, fecha: string, monto = 10, cuentaId = 'E') => ({
      id: k,
      cuentaId: id(cuentaId),
      fecha: f(fecha),
      monto: c(monto),
    });
    const t = (k: string, fecha: string, clave: string, monto = 10) => ({
      ...p(k, fecha, monto),
      claveOrden: ins(clave),
    });
    const candidatas = [
      t('t1', '2027-03-13', '2027-03-13T10:00:00.000Z'),
      t('t2', '2027-03-11', '2027-03-11T09:00:00.000Z'),
      t('t3', '2027-03-11', '2027-03-11T08:00:00.000Z'),
      t('t4', '2027-03-20', '2027-03-20T08:00:00.000Z'),
    ];
    const pares = coincidenciasDeConciliacion(
      [
        p('a', '2027-03-12'), // t1 y t2/t3 a 1 día: gana la clave más antigua, t3
        p('b', '2027-03-12'), // queda t2 (1 día) antes que t1 (1 día, clave más nueva)
        p('c', '2027-03-16'), // t1 a 3 días: el borde entra
        p('d', '2027-03-16', 10, 'X'), // otra cuenta
        p('e', '2027-03-24', 11), // otro monto
        p('g', '2027-03-24'), // t4 a 4 días: no
      ],
      candidatas,
    );
    expect([...pares]).toEqual([
      ['a', 't3'],
      ['b', 't2'],
      ['c', 't1'],
    ]);
  });
});
