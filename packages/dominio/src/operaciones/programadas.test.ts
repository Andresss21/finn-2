import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { ocurrencias } from '../calculo/ocurrencias';
import { saldo } from '../calculo/saldos';
import type {
  ComandoDominio,
  ComandoOp01,
  GeneradorIds,
  Hechos,
  Instante,
  Programada,
  ResultadoAplicar,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';
import { pagoDe } from './op-01';
import { op43Automatico } from './op-43';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
/** Ciclo del día 21 (01 §8.0): P1 = 21 ene – 20 feb, P2 = 21 feb – 20 mar, P3 = 21 mar – 20 abr. */
const [P1, P2, P3] = [f('2027-01-21'), f('2027-02-21'), f('2027-03-21')];
/** Hoy de ESC-50: 10 mar, A = P2. Los hechos se arman con hoy = 21 ene (P1 activo). */
const HOY = f('2027-03-10');
const INSTANTE = '2027-03-10T15:00:00.000Z' as Instante;

let comandos = 0;
const contador = (): GeneradorIds => {
  const k = ++comandos;
  let n = 0;
  return { siguiente: () => id(`n${k}.${++n}`) };
};
const exito = (r: ResultadoAplicar) => {
  if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);
  return r;
};
const codigos = (r: ResultadoAplicar) => (r.ok ? [] : r.rechazos.map((x) => x.codigo));
const hechos = (h: Hechos, hoy: FechaLocal, ...xs: ComandoDominio[]) =>
  xs.reduce((y, x) => exito(aplicar(y, x, hoy)).hechosNuevos, h);
const en = (h: Hechos, x: ComandoDominio) => aplicar(h, x, HOY);
const disp = (h: Hechos, categoriaId: Uuid, periodo = P2) =>
  calcular(h, HOY).presupuesto.celdas.find(
    (y) => y.categoriaId === categoriaId && y.periodo.inicio === periodo,
  )?.disponible;
/** Las ocurrencias pendientes con fecha ≤ hoy + 30 días, como `programada|fecha`. */
const pendientes = (h: Hechos, soloAtrasadas = false) =>
  calcular(h, HOY)
    .ocurrencias.filter((o) => o.atrasada || !soloAtrasadas)
    .map((o) => `${o.programadaId}|${o.fecha}`);
/** Las pendientes con fecha < hoy (A-6): las de ESC-50. */
const atrasadas = (h: Hechos) => pendientes(h, true);
const insertadas = (r: ResultadoAplicar, tabla: string) =>
  exito(r).cambios.flatMap((x) =>
    x.tipo === 'insertar' && x.tabla === tabla
      ? [x.fila as unknown as Record<string, unknown>]
      : [],
  );

const cuenta = (
  k: string,
  tipo: ComandoOp01['cuenta']['tipo'],
  saldoInicial: number,
  subtipo?: ComandoOp01['subtipo'],
): ComandoDominio => ({
  operacion: 'OP-01',
  id: id(k),
  instante: '2027-01-01T12:00:00.000Z' as Instante,
  ids: contador(),
  cuenta: { tipo, nombre: k, institucionId: null, ultimos4: null, fechaApertura: f('2027-01-01') },
  ...(subtipo && { subtipo }),
  saldo: c(saldoInicial),
});
const tarjeta = {
  tipo: 'tarjeta',
  limiteCredito: c(5000),
  tasaAnualMillonesimas: null,
  diaCorte: 20,
  diaPago: 5,
  red: null,
  color: null,
} as const;
const prestamo = {
  tipo: 'prestamo',
  contraparte: 'Banco',
  montoOriginal: c(10000),
  tasaNominalAnualMillonesimas: 120_000,
  tipoTasa: 'fija',
  seguroPrimerMes: c(10),
  comision: null,
  frecuencia: 'mensual',
  frecuenciaDias: null,
  cuotaPactada: c(500),
  plazoCuotas: 24,
  modeloCalculo: null,
  cuotasPagadasAlCrear: 0,
} as const;
const asignar = (
  categoriaId: string,
  periodoInicio: FechaLocal,
  monto: number,
): ComandoDominio => ({
  operacion: 'OP-14',
  categoriaId: id(categoriaId),
  periodoInicio,
  montoNuevo: c(monto),
  ids: contador(),
});

/** OP-42 crear: un gasto mensual de 10 con una línea a SUSC, salvo lo que cambie `x`. */
const crear = (pid: string, x: Record<string, unknown> = {}) =>
  ({
    operacion: 'OP-42',
    accion: 'crear',
    id: id(pid),
    ids: contador(),
    tipo: 'gasto',
    cuentaId: id('T'),
    cuentaDestinoId: null,
    comercio: 'Suscripción',
    monto: c(10),
    tolerancia: c(0),
    frecuencia: 'mensual',
    frecuenciaDias: null,
    primeraFecha: f('2027-01-25'),
    fechaFin: null,
    registroAutomatico: true,
    lineas: [{ monto: c(10), categoriaId: id('SUSC') }],
    ...x,
  }) as unknown as ComandoDominio;
const activar = (pid: string, activa: boolean) =>
  ({ operacion: 'OP-42', accion: 'activar', programadaId: id(pid), activa }) as ComandoDominio;
const editar = (pid: string, x: Record<string, unknown>) =>
  ({
    operacion: 'OP-42',
    accion: 'editar',
    programadaId: id(pid),
    ids: contador(),
    coincidencias: 0,
    ...x,
  }) as unknown as ComandoDominio;
/** OP-43 de un toque; `x` trae los campos editables. */
const toque = (pid: string, fecha: string, x: Record<string, unknown> = {}) =>
  ({
    operacion: 'OP-43',
    programadaId: id(pid),
    fechaEsperada: f(fecha),
    id: id(`t${++comandos}`),
    instante: INSTANTE,
    ids: contador(),
    ...x,
  }) as unknown as ComandoDominio;
const omitir = (pid: string, fecha: string) =>
  ({
    operacion: 'OP-44',
    id: id(`o${++comandos}`),
    programadaId: id(pid),
    fechaEsperada: f(fecha),
  }) as ComandoDominio;
const eliminar = (pid: string, referencias = 0) =>
  ({ operacion: 'OP-51', programadaId: id(pid), referencias }) as ComandoDominio;
const automatico = (h: Hechos) => op43Automatico(h, HOY, contador(), INSTANTE);

/**
 * ESC-50, estado inicial: Ahorro (efectivo) con un ingreso de 100, la tarjeta T sin deuda y 10
 * asignados en SUSC en P1, P2 y P3; la programada PG (Suscripción, 10 al mes con T desde el 25 ene,
 * registro automático). Además, el préstamo L sin modelo y la categoría archivada VIEJA.
 */
function base(): Hechos {
  const vacio = Object.fromEntries(
    ['cuentas', 'tarjetas', 'prestamos', 'inversiones', 'asignaciones', 'transacciones']
      .concat(['efectos', 'lineas', 'condonaciones', 'metas', 'programadas', 'programada_lineas'])
      .concat(['ocurrencias_resueltas', 'conciliaciones', 'deudores'])
      .map((t) => [t, []]),
  );
  const categoria = (x: string, archivada = false) => ({
    ...{ id: id(x), grupoId: id('A'), nombre: x, orden: 1, clase: 'normal' as const },
    ...{ tarjetaId: null, archivada, revision: null },
  });
  const grupo = (g: string, clave: 'pagos_tarjeta' | null) => ({
    ...{ id: id(g), nombre: g, orden: 1, archivado: false, claveSistema: clave, revision: null },
  });
  const h = {
    ...vacio,
    vigencias_ciclo: [{ id: id('v'), diaInicio: 21, rigeDesde: null, revision: null }],
    grupos: [grupo('PT', 'pagos_tarjeta'), grupo('A', null)],
    categorias: [categoria('SUSC'), categoria('OTRA'), categoria('VIEJA', true)],
  } as unknown as Hechos;
  return hechos(
    h,
    P1,
    cuenta('AHORRO', 'efectivo', 0),
    cuenta('T', 'tarjeta', 0, tarjeta),
    cuenta('L', 'prestamo', 10000, prestamo),
    {
      operacion: 'OP-21',
      id: id('ING'),
      instante: '2027-01-21T12:00:00.000Z' as Instante,
      ids: contador(),
      cuentaId: id('AHORRO'),
      fecha: P1,
      total: c(100),
    },
    asignar('SUSC', P1, 10),
    asignar('SUSC', P2, 10),
    asignar('SUSC', P3, 10),
    crear('PG'),
  );
}
const H0 = base();
const PAGO_T = pagoDe(H0, id('T'))?.id as Uuid;

describe('PRU-DOM-PROG-101: aplicar, transacciones programadas (01 §5.7, §4.16, §7.8; 04 §3.7)', () => {
  it('PRU-DOM-PROG-101 [ESC-50, AV-01, AV-23, inv. 15] OP-43 PR-3: el registro automático registra en orden y con la fecha esperada, no registra en un período cerrado, el de un toque sí (AV-01) y repetirlo no cambia nada', () => {
    // Paso 0: Ef 100, LPA 70, Susc 20 y Susc(fut) 10; pendientes 25 ene y 25 feb.
    const ef = (h: Hechos) => saldo(h, id('AHORRO'));
    const t = (h: Hechos) => calcular(h, HOY).tarjetas.find((x) => x.tarjetaId === id('T'));
    expect([ef(H0), calcular(H0, HOY).lpa.total, disp(H0, id('SUSC'))]).toEqual([
      c(100),
      c(70),
      c(20),
    ]);
    expect(disp(H0, id('SUSC'), P3)).toBe(c(30));
    expect(atrasadas(H0)).toEqual(['PG|2027-01-25', 'PG|2027-02-25']);

    // Paso 1 (PR-3): solo el 25 feb (P2); el 25 ene (P1, cerrado) queda pendiente con AV-23.
    const paso1 = automatico(H0);
    expect(paso1.resultados.map((x) => [x.fechaEsperada, codigos(x.salida)])).toEqual([
      [f('2027-01-25'), ['ocurrencia_en_periodo_cerrado']],
      [f('2027-02-25'), []],
    ]);
    expect(paso1.avisos).toEqual([
      expect.objectContaining({
        codigo: 'AV-23',
        datos: {
          programadaId: 'PG',
          fechaEsperada: '2027-01-25',
          resultado: 'ocurrencia_en_periodo_cerrado',
        },
      }),
      expect.objectContaining({
        codigo: 'AV-23',
        datos: { programadaId: 'PG', fechaEsperada: '2027-02-25', resultado: 'registrada' },
      }),
    ]);
    const h1 = paso1.hechos;
    const [tx] = insertadas(paso1.resultados[1]?.salida as ResultadoAplicar, 'transacciones');
    expect(tx).toMatchObject({
      fecha: '2027-02-25',
      origen: 'programada',
      comercio: 'Suscripción',
    });
    expect(h1.ocurrencias_resueltas).toEqual([
      expect.objectContaining({
        programadaId: 'PG',
        fechaEsperada: '2027-02-25',
        estado: 'registrada',
        transaccionId: (tx as { id: Uuid }).id,
      }),
    ]);
    expect([ef(h1), calcular(h1, HOY).lpa.total, disp(h1, id('SUSC')), disp(h1, PAGO_T)]).toEqual([
      c(100),
      c(70),
      c(10),
      c(10),
    ]);
    expect(t(h1)).toMatchObject({ deuda: c(10), sinRespaldo: c(0), reservaExcedente: c(0) });
    expect(atrasadas(h1)).toEqual(['PG|2027-01-25']);

    // Paso 1b: el registro de un toque del 25 ene, con AV-01, llega al estado final de 01.
    const paso1b = exito(en(h1, toque('PG', '2027-01-25')));
    expect(paso1b.avisos.map((a) => a.codigo)).toContain('AV-01');
    const h1b = paso1b.hechosNuevos;
    expect([
      ef(h1b),
      calcular(h1b, HOY).lpa.total,
      disp(h1b, id('SUSC')),
      disp(h1b, PAGO_T),
    ]).toEqual([c(100), c(70), c(0), c(20)]);
    expect(disp(h1b, id('SUSC'), P3)).toBe(c(10));
    expect(t(h1b)).toMatchObject({ deuda: c(20), sinRespaldo: c(0), reservaExcedente: c(0) });
    expect(atrasadas(h1b)).toEqual([]);

    // Paso 2: idempotente (inv. 15); tampoco se registra dos veces lo ya resuelto.
    const paso2 = automatico(h1b);
    expect([paso2.resultados, paso2.avisos]).toEqual([[], []]);
    expect(paso2.hechos).toEqual(h1b);
    expect(codigos(en(h1b, toque('PG', '2027-02-25')))).toEqual(['ocurrencia_ya_resuelta']);
    expect(automatico(h1).resultados.map((x) => codigos(x.salida))).toEqual([
      ['ocurrencia_en_periodo_cerrado'],
    ]);
  });

  it('PRU-DOM-PROG-101 [CB-33] OP-43: varias ocurrencias atrasadas se registran en orden cronológico con su fecha; una de una cuenta archivada queda pendiente con AV-23 y las demás siguen', () => {
    const semanal = crear('S', {
      cuentaId: id('AHORRO'),
      frecuencia: 'semanal',
      primeraFecha: f('2027-02-22'),
      lineas: [{ monto: c(10), categoriaId: id('OTRA') }],
    });
    const archivable = crear('X', {
      cuentaId: id('E2'),
      primeraFecha: f('2027-02-23'),
      lineas: [{ monto: c(10), categoriaId: id('OTRA') }],
    });
    const archivar = { operacion: 'OP-04', cuentaId: id('E2') } as ComandoDominio;
    const h = hechos(H0, HOY, cuenta('E2', 'efectivo', 0), semanal, archivable, archivar);
    const r = automatico(h);
    expect(r.resultados.map((x) => [x.programadaId, x.fechaEsperada, codigos(x.salida)])).toEqual([
      ['PG', f('2027-01-25'), ['ocurrencia_en_periodo_cerrado']],
      ['S', f('2027-02-22'), []],
      ['X', f('2027-02-23'), ['cuenta_archivada']],
      ['PG', f('2027-02-25'), []],
      ['S', f('2027-03-01'), []],
      ['S', f('2027-03-08'), []],
    ]);
    expect(r.avisos.map((a) => [a.codigo, a.datos?.resultado])).toContainEqual([
      'AV-23',
      'cuenta_archivada',
    ]);
    // Cada registro es su propio `aplicar`, en ese orden, con la fecha esperada (B-12).
    const fechas = r.resultados
      .filter((x) => x.salida.ok)
      .map((x) => insertadas(x.salida, 'transacciones')[0]?.fecha);
    expect(fechas).toEqual(['2027-02-22', '2027-02-25', '2027-03-01', '2027-03-08'].map(f));
    const programada = r.hechos.transacciones.filter((x) => x.origen === 'programada');
    expect(programada.map((x) => x.fecha).sort()).toEqual(fechas);
    expect(atrasadas(r.hechos)).toEqual(['PG|2027-01-25', 'X|2027-02-23']);
  });

  it('PRU-DOM-PROG-101 OP-43: el de un toque usa los datos de la programada según su tipo (editables), con la fecha esperada, y rechaza una fecha que no es ocurrencia', () => {
    const conPago = crear('PP', {
      tipo: 'pago_tarjeta',
      cuentaId: id('AHORRO'),
      cuentaDestinoId: id('T'),
      monto: c(5),
      primeraFecha: f('2027-03-01'),
      registroAutomatico: false,
      lineas: [],
    });
    const cuota = crear('CU', {
      tipo: 'cuota_prestamo',
      cuentaId: id('AHORRO'),
      cuentaDestinoId: id('L'),
      monto: c(20),
      primeraFecha: f('2027-03-02'),
      registroAutomatico: false,
      lineas: [{ monto: c(20), categoriaId: id('OTRA') }],
    });
    const h = hechos(H0, HOY, conPago, cuota);
    // Gasto con el monto editado: su única línea toma el monto nuevo.
    const g = exito(en(h, toque('PG', '2027-02-25', { monto: c(12) })));
    expect(insertadas(g, 'transacciones')).toEqual([
      expect.objectContaining({
        tipo: 'gasto',
        fecha: '2027-02-25',
        total: c(12),
        origen: 'programada',
      }),
    ]);
    expect(insertadas(g, 'lineas')).toEqual([
      expect.objectContaining({ monto: c(12), categoriaId: 'SUSC' }),
    ]);
    // Pago de tarjeta: OP-23 de Ahorro a T.
    const p = exito(en(h, toque('PP', '2027-03-01')));
    expect(insertadas(p, 'efectos').map((e) => [e.cuentaId, e.monto])).toEqual([
      ['AHORRO', c(-5)],
      ['T', c(5)],
    ]);
    // Cuota: sin modelo no hay desglose propuesto; con el desglose del usuario es OP-24.
    expect(codigos(en(h, toque('CU', '2027-03-02')))).toEqual(['registro_automatico_sin_modelo']);
    const desglose = { capital: c(15), interes: c(4), seguro: c(1) };
    const q = exito(en(h, toque('CU', '2027-03-02', { desglose })));
    expect(insertadas(q, 'transacciones')).toEqual([
      expect.objectContaining({ tipo: 'cuota_prestamo', fecha: '2027-03-02', total: c(20) }),
    ]);
    expect(insertadas(q, 'ocurrencias_resueltas')).toEqual([
      expect.objectContaining({ programadaId: 'CU', estado: 'registrada' }),
    ]);
    // §4.16: la fecha tiene que ser una ocurrencia de la programada.
    expect(codigos(en(h, toque('PG', '2027-02-26')))).toEqual(['ocurrencia_no_valida']);
    expect(codigos(en(h, toque('PG', '2027-01-24')))).toEqual(['ocurrencia_no_valida']);
    expect(codigos(en(h, toque('NO', '2027-02-25')))).toEqual(['no_encontrado']);
  });

  it('PRU-DOM-PROG-101 OP-43 CH-45 y QB-1: una cuota con modelo y fecha sin cuota a ±10 días es cuota_sin_coincidencia, sin modelo sigue siendo registro_automatico_sin_modelo, y el desglose a mano la registra', () => {
    const alta = cuenta('LM', 'prestamo', 10000, { ...prestamo, modeloCalculo: 'banco_agricola' });
    // Apertura 1 ene: cuotas el 1 feb y el 1 mar. El 15 feb queda a 14 días de las dos; el 2 mar empareja la del 1 mar.
    const cuota = (pid: string, primeraFecha: string) =>
      crear(pid, {
        tipo: 'cuota_prestamo',
        cuentaId: id('AHORRO'),
        cuentaDestinoId: id('LM'),
        monto: c(20),
        primeraFecha: f(primeraFecha),
        registroAutomatico: false,
        lineas: [{ monto: c(20), categoriaId: id('OTRA') }],
      });
    const h = hechos(H0, HOY, alta, cuota('LEJOS', '2027-02-15'), cuota('CERCA', '2027-03-02'));
    expect(en(h, toque('LEJOS', '2027-02-15'))).toMatchObject({
      ok: false,
      rechazos: [
        {
          codigo: 'cuota_sin_coincidencia',
          datos: { programadaId: 'LEJOS', fechaEsperada: '2027-02-15' },
        },
      ],
    });
    expect(codigos(en(h, toque('CERCA', '2027-03-02')))).toEqual([]);
    const desglose = { capital: c(15), interes: c(4), seguro: c(1) };
    expect(codigos(en(h, toque('LEJOS', '2027-02-15', { desglose })))).toEqual([]);
    // El modelo se quitó: es el caso de QB-1, no el de CH-45.
    const sinModelo = {
      ...h,
      prestamos: h.prestamos.map((p) =>
        p.cuentaId === id('LM') ? { ...p, modeloCalculo: null } : p,
      ),
    };
    expect(codigos(en(sinModelo, toque('LEJOS', '2027-02-15')))).toEqual([
      'registro_automatico_sin_modelo',
    ]);
  });

  it('PRU-DOM-PROG-101 OP-42 CF-20: crear sin efecto presupuestario, precondiciones de cuentas y líneas, editar con calendario fijo si hay historial, desactivar y reactivar desde hoy', () => {
    // Crear: sin efecto en LPA ni en Disponibles (inv. 13).
    const r = exito(en(H0, crear('N', { registroAutomatico: false })));
    expect(r.impacto).toMatchObject({ deltaLpa: c(0), deltaDisponible: [] });
    expect(insertadas(r, 'programadas')).toEqual([
      expect.objectContaining({ id: 'N', activa: true, reactivadaDesde: null }),
    ]);
    expect(insertadas(r, 'programada_lineas')).toEqual([
      expect.objectContaining({ programadaId: 'N', orden: 1, monto: c(10), categoriaId: 'SUSC' }),
    ]);
    // Precondiciones.
    const lineas = (...xs: [number, string][]) =>
      xs.map(([m, k]) => ({ monto: c(m), categoriaId: id(k) }));
    const casos: [Record<string, unknown>, string][] = [
      [{ lineas: lineas([6, 'SUSC'], [3, 'OTRA']) }, 'suma_lineas_distinta'],
      [{ lineas: lineas([10, 'VIEJA']) }, 'categoria_archivada'],
      [{ lineas: [{ monto: c(10), categoriaId: PAGO_T }] }, 'categoria_de_pago_no_permitida'],
      [
        { tipo: 'pago_tarjeta', cuentaDestinoId: id('AHORRO'), lineas: [] },
        'cuenta_tipo_no_valido',
      ],
      [{ cuentaId: id('L') }, 'cuenta_tipo_no_valido'],
      [
        { tipo: 'cuota_prestamo', cuentaId: id('AHORRO'), cuentaDestinoId: id('L') },
        'registro_automatico_sin_modelo',
      ],
    ];
    for (const [x, codigo] of casos) expect(codigos(en(H0, crear('N', x)))).toEqual([codigo]);
    const conArchivada = hechos(H0, HOY, cuenta('E3', 'efectivo', 0), {
      operacion: 'OP-04',
      cuentaId: id('E3'),
    });
    expect(codigos(en(conArchivada, crear('N', { cuentaId: id('E3') })))).toEqual([
      'cuenta_archivada',
    ]);

    // Editar: comercio y líneas sí; primera fecha o frecuencia no, con resoluciones o coincidencias.
    const e = exito(en(H0, editar('PG', { campos: { comercio: 'Streaming' } })));
    expect(e.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'programadas', id: 'PG', campos: { comercio: 'Streaming' } },
    ]);
    const nuevas = exito(en(H0, editar('PG', { lineas: lineas([4, 'SUSC'], [6, 'OTRA']) })))
      .hechosNuevos.programada_lineas;
    expect(nuevas.map((l) => [l.orden, l.monto, l.categoriaId])).toEqual([
      [1, c(4), 'SUSC'],
      [2, c(6), 'OTRA'],
    ]);
    const otraFecha = { campos: { primeraFecha: f('2027-01-26') } };
    expect(exito(en(H0, editar('PG', otraFecha))).ok).toBe(true);
    expect(codigos(en(H0, editar('PG', { ...otraFecha, coincidencias: 1 })))).toEqual([
      'calendario_con_historial',
    ]);
    const conHistorial = exito(en(H0, omitir('PG', '2027-01-25'))).hechosNuevos;
    expect(codigos(en(conHistorial, editar('PG', { campos: { frecuencia: 'semanal' } })))).toEqual([
      'calendario_con_historial',
    ]);

    // CF-20: desactivada no genera ocurrencias; reactivada, solo desde hoy (incluida la de hoy).
    const des = exito(en(H0, activar('PG', false)));
    expect(des.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'programadas', id: 'PG', campos: { activa: false } },
    ]);
    expect(pendientes(des.hechosNuevos)).toEqual([]);
    expect(codigos(en(des.hechosNuevos, toque('PG', '2027-02-25')))).toEqual([
      'ocurrencia_no_valida',
    ]);
    const re = exito(en(des.hechosNuevos, activar('PG', true)));
    expect(re.cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'programadas',
        id: 'PG',
        campos: { activa: true, reactivadaDesde: HOY },
      },
    ]);
    expect(pendientes(re.hechosNuevos)).toEqual(['PG|2027-03-25']);
    expect(automatico(re.hechosNuevos).resultados).toEqual([]);
    expect(codigos(en(re.hechosNuevos, toque('PG', '2027-02-25')))).toEqual([
      'ocurrencia_no_valida',
    ]);
    expect(exito(en(H0, activar('PG', true))).cambios).toEqual([]);
    const pg = re.hechosNuevos.programadas.find((p) => p.id === id('PG')) as Programada;
    expect(ocurrencias({ ...pg, reactivadaDesde: f('2027-02-25') }, HOY)).toEqual([
      f('2027-02-25'),
    ]);
    // Desactivar no toca `reactivada_desde`; reactivar exige líneas a categorías activas (M3).
    const otraVez = exito(en(re.hechosNuevos, activar('PG', false))).hechosNuevos;
    expect(otraVez.programadas.find((p) => p.id === id('PG'))?.reactivadaDesde).toBe(HOY);
    const haciaVieja = {
      ...des.hechosNuevos,
      programada_lineas: des.hechosNuevos.programada_lineas.map((l) => ({
        ...l,
        categoriaId: id('VIEJA'),
      })),
    };
    expect(codigos(en(haciaVieja, activar('PG', true)))).toEqual(['categoria_archivada']);
  });

  it('PRU-DOM-PROG-101 OP-44 OP-51: omitir resuelve la ocurrencia sin transacción; eliminar solo una programada sin historial, con sus líneas', () => {
    const o = exito(en(H0, omitir('PG', '2027-02-25')));
    expect(o.cambios).toHaveLength(1);
    expect(insertadas(o, 'ocurrencias_resueltas')).toEqual([
      expect.objectContaining({
        programadaId: 'PG',
        fechaEsperada: '2027-02-25',
        estado: 'omitida',
        transaccionId: null,
      }),
    ]);
    expect(o.impacto.deltaLpa).toBe(c(0));
    expect(pendientes(o.hechosNuevos)).toEqual(['PG|2027-01-25', 'PG|2027-03-25']);
    expect(codigos(en(o.hechosNuevos, omitir('PG', '2027-02-25')))).toEqual([
      'ocurrencia_ya_resuelta',
    ]);
    expect(codigos(en(H0, omitir('PG', '2027-02-24')))).toEqual(['ocurrencia_no_valida']);
    // Una ocurrencia futura dentro del horizonte también se omite; el registro automático la salta.
    const futura = exito(en(H0, omitir('PG', '2027-03-25'))).hechosNuevos;
    expect(pendientes(futura)).toEqual(['PG|2027-01-25', 'PG|2027-02-25']);
    expect(automatico(o.hechosNuevos).resultados.map((x) => x.fechaEsperada)).toEqual([
      f('2027-01-25'),
    ]);

    // OP-51 (HZ-1).
    const sin = exito(en(H0, eliminar('PG')));
    expect(sin.cambios).toEqual([{ tipo: 'eliminar', tabla: 'programadas', id: 'PG' }]);
    expect([sin.hechosNuevos.programadas, sin.hechosNuevos.programada_lineas]).toEqual([[], []]);
    expect(codigos(en(o.hechosNuevos, eliminar('PG')))).toEqual(['programada_con_historial']);
    expect(codigos(en(H0, eliminar('PG', 1)))).toEqual(['programada_con_historial']);
    expect(codigos(en(H0, eliminar('NO')))).toEqual(['no_encontrado']);
  });
});
