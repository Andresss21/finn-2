import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { saldo } from '../calculo/saldos';
import type {
  ComandoDominio,
  ComandoOp01,
  GeneradorIds,
  Hechos,
  Instante,
  ResultadoAplicar,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';
import { pagoDe } from './op-01';
import { propuestaCondonacion } from './op-32';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
/** Ciclo del día 1: enero y febrero cerrados, marzo activo. */
const HOY = f('2027-03-15');
const [ENE, FEB1, FEB, MAR, A] = [
  '2027-01-01',
  '2027-02-01',
  '2027-02-10',
  '2027-03-10',
  '2027-03-01',
].map(f) as [FechaLocal, FechaLocal, FechaLocal, FechaLocal, FechaLocal];
const INSTANTE = '2027-03-15T15:00:00.000Z' as Instante;

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
const rechazos = (r: ResultadoAplicar) => (r.ok ? [] : r.rechazos);
const codigos = (r: ResultadoAplicar) => exito(r).avisos.map((a) => a.codigo);
const aplicarEn = (h: Hechos, x: ComandoDominio) => aplicar(h, x, HOY);
const hechos = (h: Hechos, ...xs: ComandoDominio[]) =>
  xs.reduce((y, x) => exito(aplicarEn(y, x)).hechosNuevos, h);
const calc = (h: Hechos) => calcular(h, HOY);
const lpa = (h: Hechos) => calc(h).lpa.total;
const deuda = (h: Hechos, t: string) => calc(h).tarjetas.find((x) => x.tarjetaId === t)?.deuda;
const disp = (h: Hechos, x: string) =>
  calc(h).presupuesto.celdas.find((y) => y.categoriaId === x && y.periodo.inicio === A)
    ?.disponible ?? Centavos.cero;
const linea = (h: Hechos, l: Uuid) => calc(h).porCobrar.find((x) => x.lineaId === l);
const delta = (a: Hechos, b: Hechos, x: string) => Centavos.restar(disp(b, x), disp(a, x));

const op = (x: { readonly operacion: string } & Record<string, unknown>) =>
  ({ instante: INSTANTE, fecha: MAR, ids: contador(), ...x }) as unknown as ComandoDominio;
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
  cuenta: { tipo, nombre: k, institucionId: null, ultimos4: null, fechaApertura: ENE },
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
const inversion = { tipo: 'inversion', rendimientoAnualEsperadoMillonesimas: null } as const;
const gasto = (g: string, k: string, fecha: FechaLocal, lineas: [number, object][]) =>
  op({
    operacion: 'OP-20',
    id: id(g),
    cuentaId: id(k),
    fecha,
    total: c(lineas.reduce((s, [m]) => s + m, 0)),
    lineas: lineas.map(([m, destino]) => ({ monto: c(m), destino })),
  });

/**
 * E (efectivo, 1.000), T (tarjeta sin deuda), I (inversión); SUPER con 300 asignados en marzo y
 * GAS con 50 en febrero (cerrado). GE (10 mar, E): 60 a SUPER y LD = 40 por cobrar a Ana. GT (10
 * mar, T): 100 a SUPER y LTD = 50 por cobrar a Ana. GF (10 feb, T): LF = 80 a GAS, 50 cubiertos por
 * el reparto D2 y U_L = 30. GV (10 mar, E): 20 a VIEJA y 10 por cobrar a Ana; VIEJA se archiva
 * después (OP-09 cubre su sobregiro). AP: aporte de 10 de E a I, con línea a SUPER.
 */
function base(): Hechos {
  const vacio = Object.fromEntries(
    ['cuentas', 'tarjetas', 'prestamos', 'inversiones', 'transacciones']
      .concat(['efectos', 'lineas', 'condonaciones', 'metas', 'programadas', 'programada_lineas'])
      .concat(['ocurrencias_resueltas', 'conciliaciones'])
      .map((t) => [t, []]),
  );
  const grupo = (g: string, clave: 'pagos_tarjeta' | null) => ({
    ...{ id: id(g), nombre: g, orden: 1, archivado: false, claveSistema: clave, revision: null },
  });
  const categoria = (x: string, orden: number) => ({
    ...{ id: id(x), grupoId: id('A'), nombre: x, orden, clase: 'normal' },
    ...{ tarjetaId: null, archivada: false, revision: null },
  });
  const asignacion = { id: id('aGF'), categoriaId: id('GAS'), periodoInicio: FEB1 };
  const h = {
    ...vacio,
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    grupos: [grupo('PT', 'pagos_tarjeta'), grupo('A', null)],
    categorias: [categoria('SUPER', 1), categoria('GAS', 2), categoria('VIEJA', 3)],
    asignaciones: [{ ...asignacion, monto: c(50), revision: null }],
    deudores: [{ id: id('Ana'), nombre: 'Ana', revision: null }],
  } as unknown as Hechos;
  return hechos(
    h,
    cuenta('E', 'efectivo', 1000),
    cuenta('T', 'tarjeta', 0, tarjeta),
    cuenta('I', 'inversion', 0, inversion),
    op({ operacion: 'OP-14', categoriaId: id('SUPER'), periodoInicio: A, montoNuevo: c(300) }),
    gasto('GE', 'E', MAR, [
      [60, { categoriaId: id('SUPER') }],
      [40, { deudorId: id('Ana') }],
    ]),
    gasto('GT', 'T', MAR, [
      [100, { categoriaId: id('SUPER') }],
      [50, { deudorId: id('Ana') }],
    ]),
    gasto('GF', 'T', FEB, [[80, { categoriaId: id('GAS') }]]),
    gasto('GV', 'E', MAR, [
      [20, { categoriaId: id('VIEJA') }],
      [10, { deudorId: id('Ana') }],
    ]),
    op({
      operacion: 'OP-09',
      categoriaId: id('VIEJA'),
      destinoDisponible: 'lpa',
      cubrirSobregiroCon: 'lpa',
      devolverAsignacionesFuturas: true,
    }),
    op({
      operacion: 'OP-25',
      id: id('AP'),
      modalidad: 'aporte',
      inversionId: id('I'),
      cuentaId: id('E'),
      categoriaId: id('SUPER'),
      total: c(10),
    }),
  );
}
const H0 = base();
const lineaDe = (t: string, orden: number) =>
  H0.lineas.find((l) => l.transaccionId === t && l.orden === orden)?.id as Uuid;
const [L60, LD, LT1, LTD, LF, LV, LVD] = [
  lineaDe('GE', 1),
  lineaDe('GE', 2),
  lineaDe('GT', 1),
  lineaDe('GT', 2),
  lineaDe('GF', 1),
  lineaDe('GV', 1),
  lineaDe('GV', 2),
];
const PAGO_T = pagoDe(H0, id('T'))?.id as Uuid;

let devoluciones = 0;
/** OP-33a: la compra y su reparto [línea, X_i]; el total es Σ X_i salvo que `extra` lo cambie. */
const devolver = (h: Hechos, original: string, reparto: [Uuid, number][], extra: object = {}) =>
  aplicarEn(
    h,
    op({
      operacion: 'OP-33',
      id: id(`D${++devoluciones}`),
      transaccionOriginalId: id(original),
      total: c(reparto.reduce((s, [, m]) => s + m, 0)),
      reparto: reparto.map(([lineaId, m]) => ({ lineaId, monto: c(m) })),
      ...extra,
    }),
  );
/** OP-33b: sin compra original. */
const devolverSin = (h: Hechos, cuentaId: string, categoriaId: string, total: number) =>
  aplicarEn(
    h,
    op({
      operacion: 'OP-33',
      id: id(`D${++devoluciones}`),
      cuentaId: id(cuentaId),
      categoriaId: id(categoriaId),
      total: c(total),
    }),
  );
const condonar = (
  h: Hechos,
  lineaId: Uuid,
  monto: number,
  categoriaId: string,
  extra: object = {},
) =>
  aplicarEn(
    h,
    op({
      operacion: 'OP-32',
      id: id(`K${++devoluciones}`),
      lineaId,
      monto: c(monto),
      categoriaId: id(categoriaId),
      ...extra,
    }),
  );
const eliminar = (h: Hechos, evento: object) =>
  aplicarEn(h, op({ operacion: 'OP-34', movimientos: [], ...evento }));
const aporteDe = (h: Hechos, lineaId: Uuid) =>
  calc(h).presupuesto.aportes.find((x) => x.lineaId === lineaId);
const lineaNueva = (r: ResultadoAplicar) =>
  exito(r).cambios.flatMap((x) => (x.tipo === 'insertar' && x.tabla === 'lineas' ? [x.fila] : []));

describe('PRU-DOM-DEV-102: aplicar, condonar, devolver y eliminar evento (01 §4.4, §4.10, §5.5; 04 §3.5)', () => {
  it('PRU-DOM-DEV-102 OP-33a D-1: devolución vinculada en la misma cuenta y período: +X en la cuenta, una línea con el destino de la original y su `lineaOriginalId`; netea el consumo y no aporta', () => {
    const r = devolver(H0, 'GE', [[L60, 25]]);
    const { cambios, hechosNuevos: h } = exito(r);
    expect(cambios.map((x) => ('tabla' in x ? x.tabla : x.tipo))).toEqual([
      'transacciones',
      'efectos',
      'lineas',
    ]);
    expect(cambios[0]).toMatchObject({
      tipo: 'insertar',
      fila: {
        tipo: 'devolucion',
        fecha: MAR,
        total: c(25),
        lineaCobradaId: null,
        claveOrden: INSTANTE,
      },
    });
    expect(cambios[1]).toMatchObject({ fila: { cuentaId: id('E'), monto: c(25) } });
    expect(lineaNueva(r)).toEqual([
      expect.objectContaining({ orden: 1, monto: c(25), categoriaId: id('SUPER'), deudorId: null }),
    ]);
    expect(lineaNueva(r)[0]?.lineaOriginalId).toBe(L60);
    expect(saldo(h, id('E'))).toBe(Centavos.sumar(saldo(H0, id('E')), c(25)));
    expect(delta(H0, h, 'SUPER')).toBe(c(25));
    expect(lpa(h)).toBe(lpa(H0));
    const [d] = lineaNueva(r);
    expect(aporteDe(h, d?.id as Uuid)).toBeUndefined();
    expect(calc(h).presupuesto.aportes.length).toBe(calc(H0).presupuesto.aportes.length);
  });

  it('PRU-DOM-DEV-102 [AV-01] OP-33a D-2, D-3 y D-4: en efectivo sin ser D-1 aporta +X; en la misma tarjeta en un período posterior a = mín(X, U_L − A_L) solo baja la deuda y r va a la categoría y sale de pago(t); en una tarjeta que no es la de L aporta +X y −X a pago(t)', () => {
    // D-2: la compra fue con T y la devolución entra en E.
    const d2 = devolver(H0, 'GT', [[LT1, 30]], { cuentaId: id('E') });
    const h2 = exito(d2).hechosNuevos;
    expect(aporteDe(h2, lineaNueva(d2)[0]?.id as Uuid)).toMatchObject({
      caso: 'D-2',
      aCategoria: c(30),
      aPago: c(0),
    });
    expect(delta(H0, h2, 'SUPER')).toBe(c(30));
    expect(deuda(h2, 'T')).toBe(deuda(H0, 'T'));
    // D-3: LF (febrero, T) tiene U_L = 30; una devolución de 50 en marzo: a = 30, r = 20.
    const d3 = devolver(H0, 'GF', [[LF, 50]]);
    const h3 = exito(d3).hechosNuevos;
    expect(aporteDe(h3, lineaNueva(d3)[0]?.id as Uuid)).toMatchObject({
      caso: 'D-3',
      a: c(30),
      aCategoria: c(20),
    });
    expect(delta(H0, h3, 'GAS')).toBe(c(20));
    expect(delta(H0, h3, PAGO_T)).toBe(c(-20));
    expect(deuda(h3, 'T')).toBe(Centavos.restar(deuda(H0, 'T') ?? Centavos.cero, c(50)));
    // Una segunda D-3 de L ya no tiene parte a: A_L = 30 = U_L.
    const d3b = devolver(h3, 'GF', [[LF, 10]]);
    expect(aporteDe(exito(d3b).hechosNuevos, lineaNueva(d3b)[0]?.id as Uuid)).toMatchObject({
      caso: 'D-3',
      a: c(0),
      aCategoria: c(10),
    });
    // D-4: la compra fue con E y la devolución entra en T.
    const d4 = devolver(H0, 'GE', [[L60, 15]], { cuentaId: id('T') });
    const h4 = exito(d4).hechosNuevos;
    expect(aporteDe(h4, lineaNueva(d4)[0]?.id as Uuid)).toMatchObject({
      caso: 'D-4',
      aCategoria: c(15),
    });
    expect(delta(H0, h4, 'SUPER')).toBe(c(15));
    expect(delta(H0, h4, PAGO_T)).toBe(c(-15));
    // En febrero (cerrado), la misma tarjeta y el mismo período de L: D-1, con AV-01.
    const d1 = devolver(H0, 'GF', [[LF, 5]], { fecha: f('2027-02-20') });
    expect(codigos(d1)).toContain('AV-01');
    expect(aporteDe(exito(d1).hechosNuevos, lineaNueva(d1)[0]?.id as Uuid)).toBeUndefined();
  });

  it('PRU-DOM-DEV-102 OP-33b: sin compra original, una línea a la categoría: D-2 si la cuenta es de efectivo y D-4 si es una tarjeta; rechaza una categoría archivada o de pago', () => {
    const d4 = devolverSin(H0, 'T', 'GAS', 30);
    const h4 = exito(d4).hechosNuevos;
    expect(lineaNueva(d4)).toEqual([
      expect.objectContaining({ monto: c(30), categoriaId: id('GAS'), lineaOriginalId: null }),
    ]);
    expect(aporteDe(h4, lineaNueva(d4)[0]?.id as Uuid)).toMatchObject({ caso: 'D-4' });
    expect(delta(H0, h4, 'GAS')).toBe(c(30));
    expect(delta(H0, h4, PAGO_T)).toBe(c(-30));
    expect(deuda(h4, 'T')).toBe(Centavos.restar(deuda(H0, 'T') ?? Centavos.cero, c(30)));
    const d2 = devolverSin(H0, 'E', 'GAS', 10);
    const h2 = exito(d2).hechosNuevos;
    expect(aporteDe(h2, lineaNueva(d2)[0]?.id as Uuid)).toMatchObject({ caso: 'D-2' });
    expect(saldo(h2, id('E'))).toBe(Centavos.sumar(saldo(H0, id('E')), c(10)));
    expect(rechazos(devolverSin(H0, 'E', 'VIEJA', 10))).toEqual([
      { codigo: 'categoria_archivada', datos: { categoriaId: id('VIEJA') } },
    ]);
    expect(rechazos(devolverSin(H0, 'E', PAGO_T, 10))[0]?.codigo).toBe(
      'categoria_de_pago_no_permitida',
    );
    expect(rechazos(devolverSin(H0, 'I', 'GAS', 10))[0]?.codigo).toBe('cuenta_tipo_no_valido');
  });

  it('PRU-DOM-DEV-102 [AV-14, INV-20] OP-33a ajuste 1: la línea de devolución va a la categoría de la original aunque esté archivada, con AV-14 si le queda Disponible positivo', () => {
    const r = devolver(H0, 'GV', [[LV, 20]]);
    expect(lineaNueva(r)[0]).toMatchObject({ categoriaId: id('VIEJA'), lineaOriginalId: LV });
    expect(disp(exito(r).hechosNuevos, 'VIEJA')).toBe(c(20));
    expect(codigos(r)).toContain('AV-14');
  });

  it('PRU-DOM-DEV-102 [INV-09] OP-33a I5: sobre una línea por cobrar baja el saldo abierto (con débito, LPA +X; con tarjeta, deuda −X) y su capacidad es el saldo abierto', () => {
    const r = devolver(H0, 'GE', [[LD, 40]]);
    const h = exito(r).hechosNuevos;
    expect(lineaNueva(r)[0]).toMatchObject({
      categoriaId: null,
      deudorId: id('Ana'),
      lineaOriginalId: LD,
    });
    expect(linea(h, LD)).toMatchObject({ abierto: c(0), devuelto: c(40) });
    expect(lpa(h)).toBe(Centavos.sumar(lpa(H0), c(40)));
    const t = exito(devolver(H0, 'GT', [[LTD, 20]])).hechosNuevos;
    expect(linea(t, LTD)).toMatchObject({ abierto: c(30), devuelto: c(20) });
    expect(deuda(t, 'T')).toBe(Centavos.restar(deuda(H0, 'T') ?? Centavos.cero, c(20)));
    expect(lpa(t)).toBe(lpa(H0));
    // ESC-29: con 15 cobrados quedan 25 abiertos; 40 al por cobrar se rechaza; 25 + 25 a SUPER no.
    const cobro = op({
      operacion: 'OP-31',
      id: id('C1'),
      lineaId: LD,
      cuentaId: id('E'),
      total: c(15),
    });
    const cobrado = hechos(H0, cobro);
    expect(
      rechazos(
        devolver(cobrado, 'GE', [
          [L60, 10],
          [LD, 40],
        ]),
      ),
    ).toEqual([{ codigo: 'devolucion_mayor_que_linea', datos: { lineaId: LD, capacidad: c(25) } }]);
    const ok = exito(
      devolver(cobrado, 'GE', [
        [LD, 25],
        [L60, 25],
      ]),
    ).hechosNuevos;
    expect(linea(ok, LD)).toMatchObject({ abierto: c(0) });
    expect(delta(cobrado, ok, 'SUPER')).toBe(c(25));
  });

  it('PRU-DOM-DEV-102 [CB-02, INV-10, INV-11] OP-33a: devoluciones acumuladas que superan la línea o la compra se rechazan; el reparto debe sumar el total y sus líneas ser de la compra', () => {
    const h = exito(devolver(H0, 'GE', [[L60, 40]])).hechosNuevos;
    expect(rechazos(devolver(h, 'GE', [[L60, 30]]))).toEqual([
      { codigo: 'devolucion_mayor_que_linea', datos: { lineaId: L60, capacidad: c(20) } },
    ]);
    // La misma línea dos veces en el reparto se suma contra su capacidad.
    expect(
      rechazos(
        devolver(h, 'GE', [
          [L60, 15],
          [L60, 15],
        ]),
      )[0]?.codigo,
    ).toBe('devolucion_mayor_que_linea');
    const lleno = exito(
      devolver(h, 'GE', [
        [L60, 20],
        [LD, 40],
      ]),
    ).hechosNuevos;
    expect(rechazos(devolver(lleno, 'GE', [[L60, 1]]))).toEqual([
      { codigo: 'devolucion_mayor_que_total', datos: { total: c(100), devuelto: c(100) } },
    ]);
    expect(rechazos(devolver(H0, 'GE', [[L60, 10]], { total: c(12) }))).toEqual([
      { codigo: 'reparto_devolucion_distinto', datos: { suma: c(10), total: c(12) } },
    ]);
    expect(rechazos(devolver(H0, 'GE', [[LT1, 10]]))).toEqual([
      { codigo: 'no_encontrado', datos: { entidad: 'lineas', id: LT1 } },
    ]);
    expect(rechazos(devolver(H0, 'NADA', [[L60, 10]]))[0]?.codigo).toBe('no_encontrado');
    expect(rechazos(devolver(H0, 'GE', [[L60, 10]], { fecha: f('2027-03-09') }))).toEqual([
      { codigo: 'evento_anterior_a_original', datos: { fecha: MAR } },
    ]);
    expect(rechazos(devolver(H0, 'GE', [[L60, 10]], { cuentaId: id('I') }))[0]?.codigo).toBe(
      'cuenta_tipo_no_valido',
    );
    expect(() =>
      devolver(H0, 'GE', [
        [L60, 0],
        [LD, 10],
      ]),
    ).toThrow(TypeError);
  });

  it('PRU-DOM-DEV-102 OP-37 OP-33: aprobar un movimiento `devolucion` ejecuta OP-33a si sus líneas traen `lineaOriginalId` y OP-33b si trae una línea a categoría; sin destino, `linea_sin_destino`', () => {
    const movimiento = {
      ...{ id: id('M'), smsId: id('S'), estado: 'pendiente', cuentaId: id('E'), fecha: MAR },
      ...{ monto: c(25), comercio: null, tipoPropuesto: 'devolucion', nota: null },
      ...{ duplicadoTransaccionId: null, duplicadoMovimientoId: null, esperadaProgramadaId: null },
      ...{ esperadaFecha: null, transaccionId: null },
    };
    const lineaM = (n: number, monto: number, destino: object) => ({
      ...{ id: id(`ML${n}`), movimientoId: id('M'), orden: n, monto: c(monto) },
      ...{ categoriaId: null, deudorId: null, lineaOriginalId: null, ...destino },
    });
    const aprobar = (lineas: object[]) =>
      aplicarEn(
        H0,
        op({
          ...{ operacion: 'OP-37', id: id(`AM${++devoluciones}`), recibidoEn: INSTANTE },
          ...{ movimiento, lineas },
        }),
      );
    const a = aprobar([
      lineaM(1, 15, { lineaOriginalId: L60 }),
      lineaM(2, 10, { lineaOriginalId: LD }),
    ]);
    expect(lineaNueva(a).map((l) => [l.lineaOriginalId, l.monto])).toEqual([
      [L60, c(15)],
      [LD, c(10)],
    ]);
    expect(exito(a).cambios[0]).toMatchObject({ fila: { tipo: 'devolucion', origen: 'sms' } });
    const b = aprobar([lineaM(1, 25, { categoriaId: id('GAS') })]);
    expect(lineaNueva(b)).toEqual([
      expect.objectContaining({ categoriaId: id('GAS'), lineaOriginalId: null }),
    ]);
    expect(rechazos(aprobar([lineaM(1, 25, {})]))[0]?.codigo).toBe('linea_sin_destino');
    expect(
      rechazos(
        aprobar([
          lineaM(1, 15, { lineaOriginalId: L60 }),
          lineaM(2, 10, { categoriaId: id('GAS') }),
        ]),
      ),
    ).toEqual([{ codigo: 'linea_sin_destino', datos: { lineaId: id('ML2') } }]);
  });

  it('PRU-DOM-DEV-102 [CB-31] OP-33a C-3: solo los gastos admiten devoluciones vinculadas; una vinculada a un aporte (o a una cuota o un abono) se rechaza', () => {
    const aporte = H0.lineas.find((l) => l.transaccionId === 'AP')?.id as Uuid;
    expect(rechazos(devolver(H0, 'AP', [[aporte, 5]]))).toEqual([
      {
        codigo: 'devolucion_de_no_gasto',
        datos: { transaccionId: id('AP'), tipo: 'aporte_inversion' },
      },
    ]);
  });

  it('PRU-DOM-DEV-102 [INV-09, AV-02] OP-32 I4: condonar con débito crea la condonación, baja el saldo abierto, sube LPA y es un consumo de débito en la categoría elegida (que puede quedar sobregirada); la propuesta es la primera línea de categoría activa de la compra', () => {
    expect(propuestaCondonacion(H0, LD)).toBe(id('SUPER'));
    expect(propuestaCondonacion(H0, LVD)).toBeNull(); // VIEJA está archivada
    expect(propuestaCondonacion(H0, LTD)).toBe(id('SUPER'));
    const r = condonar(H0, LD, 15, 'GAS');
    const { cambios, hechosNuevos: h } = exito(r);
    expect(cambios).toEqual([
      {
        tipo: 'insertar',
        tabla: 'condonaciones',
        fila: {
          ...{ id: id(`K${devoluciones}`), lineaId: LD, fecha: MAR, monto: c(15) },
          ...{ claveOrden: INSTANTE, secuencia: null, categoriaId: id('GAS'), revision: null },
        },
      },
    ]);
    expect(linea(h, LD)).toMatchObject({ abierto: c(25), condonado: c(15) });
    expect(disp(h, 'GAS')).toBe(c(-15));
    expect(codigos(r).some((x) => x === 'AV-02' || x === 'AV-03')).toBe(true);
    expect(saldo(h, id('E'))).toBe(saldo(H0, id('E')));
    // Con tarjeta: un consumo con T en la categoría (D2); la deuda no cambia.
    const t = exito(condonar(H0, LTD, 20, 'SUPER')).hechosNuevos;
    expect(linea(t, LTD)).toMatchObject({ abierto: c(30), condonado: c(20) });
    expect(deuda(t, 'T')).toBe(deuda(H0, 'T'));
    expect(delta(H0, t, 'SUPER')).toBe(c(-20));
    expect(delta(H0, t, PAGO_T)).toBe(c(20));
  });

  it('PRU-DOM-DEV-102 [CB-22, INV-09, INV-20] OP-32: condonar más que el saldo abierto, hacia una categoría archivada o de pago, sobre una línea de categoría o antes de la compra se rechaza', () => {
    expect(rechazos(condonar(H0, LD, 50, 'GAS'))).toEqual([
      { codigo: 'condonacion_mayor_que_abierto', datos: { lineaId: LD, abierto: c(40) } },
    ]);
    const cobrado = hechos(
      H0,
      op({ operacion: 'OP-31', id: id('C2'), lineaId: LD, cuentaId: id('E'), total: c(30) }),
    );
    expect(rechazos(condonar(cobrado, LD, 11, 'GAS'))[0]).toMatchObject({
      codigo: 'condonacion_mayor_que_abierto',
      datos: { abierto: c(10) },
    });
    expect(rechazos(condonar(H0, LD, 10, 'VIEJA'))).toEqual([
      { codigo: 'categoria_archivada', datos: { categoriaId: id('VIEJA') } },
    ]);
    expect(rechazos(condonar(H0, LD, 10, PAGO_T))[0]?.codigo).toBe(
      'categoria_de_pago_no_permitida',
    );
    expect(rechazos(condonar(H0, L60, 10, 'GAS'))).toEqual([
      { codigo: 'linea_no_es_por_cobrar', datos: { lineaId: L60 } },
    ]);
    expect(rechazos(condonar(H0, LD, 10, 'GAS', { fecha: f('2027-03-09') }))).toEqual([
      { codigo: 'evento_anterior_a_original', datos: { fecha: MAR } },
    ]);
    expect(() => condonar(H0, LD, 0, 'GAS')).toThrow(TypeError);
  });

  it('PRU-DOM-DEV-102 [INV-09, INV-10, INV-11, AV-16] OP-34 supuesto 12: elimina una condonación, o un cobro o una devolución con su transacción, y el por cobrar vuelve a abrirse; AV-16 si estaba conciliada', () => {
    const conEventos = hechos(
      H0,
      op({ operacion: 'OP-31', id: id('C3'), lineaId: LD, cuentaId: id('E'), total: c(10) }),
      op({ operacion: 'OP-32', id: id('K'), lineaId: LD, monto: c(10), categoriaId: id('GAS') }),
      op({
        operacion: 'OP-33',
        id: id('DV'),
        transaccionOriginalId: id('GE'),
        total: c(30),
        reparto: [
          { lineaId: LD, monto: c(20) },
          { lineaId: L60, monto: c(10) },
        ],
      }),
    );
    expect(linea(conEventos, LD)).toMatchObject({ abierto: c(0) });
    const sinK = eliminar(conEventos, { tipo: 'condonacion', condonacionId: id('K') });
    expect(exito(sinK).cambios).toEqual([
      { tipo: 'eliminar', tabla: 'condonaciones', id: id('K') },
    ]);
    expect(linea(exito(sinK).hechosNuevos, LD)).toMatchObject({ abierto: c(10), condonado: c(0) });
    const sinC = eliminar(conEventos, { tipo: 'cobro', transaccionId: id('C3') });
    expect(exito(sinC).cambios).toEqual([
      { tipo: 'eliminar', tabla: 'transacciones', id: id('C3') },
    ]);
    expect(linea(exito(sinC).hechosNuevos, LD)).toMatchObject({ abierto: c(10), restituido: c(0) });
    const sinD = exito(eliminar(conEventos, { tipo: 'devolucion', transaccionId: id('DV') }));
    expect(sinD.hechosNuevos.lineas.filter((l) => l.transaccionId === 'DV')).toEqual([]);
    expect(linea(sinD.hechosNuevos, LD)).toMatchObject({ abierto: c(20), devuelto: c(0) });
    expect(disp(sinD.hechosNuevos, 'SUPER')).toBe(disp(H0, 'SUPER'));
    // Después, la compra ya no tiene eventos y se puede eliminar (CB-04).
    const limpio = hechos(
      sinD.hechosNuevos,
      op({ operacion: 'OP-34', tipo: 'cobro', transaccionId: id('C3'), movimientos: [] }),
      op({ operacion: 'OP-34', tipo: 'condonacion', condonacionId: id('K'), movimientos: [] }),
    );
    expect(linea(limpio, LD)).toMatchObject({ abierto: c(40) });
    expect(
      exito(aplicarEn(limpio, op({ operacion: 'OP-29', transaccionId: id('GE'), movimientos: [] })))
        .ok,
    ).toBe(true);
    // Una devolución conciliada: AV-16 y el cambio posterior.
    const conciliacion = {
      ...{ id: id('Q'), cuentaId: id('E'), fechaEstado: MAR, saldoEstado: c(0) },
      ...{ terminadaEn: INSTANTE, diferenciaAceptada: c(0), modo: 'saldo', revision: null },
    };
    const conciliada = {
      ...conEventos,
      conciliaciones: [conciliacion],
      transacciones: conEventos.transacciones.map((t) =>
        t.id === 'DV' ? { ...t, estadoBancario: 'conciliada', conciliacionId: id('Q') } : t,
      ),
    } as Hechos;
    const r = eliminar(conciliada, { tipo: 'devolucion', transaccionId: id('DV') });
    expect(codigos(r)).toContain('AV-16');
    expect(exito(r).cambios.map((x) => ('tabla' in x ? x.tabla : x.tipo))).toEqual([
      'cambios_posteriores',
      'transacciones',
    ]);
    // El tipo del evento tiene que ser el de su transacción; un id inexistente no se encuentra.
    expect(() => eliminar(conEventos, { tipo: 'cobro', transaccionId: id('DV') })).toThrow(
      TypeError,
    );
    expect(() => eliminar(conEventos, { tipo: 'devolucion', transaccionId: id('GE') })).toThrow(
      TypeError,
    );
    expect(
      rechazos(eliminar(conEventos, { tipo: 'condonacion', condonacionId: id('X') }))[0]?.codigo,
    ).toBe('no_encontrado');
  });
});
