import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { capitalPendiente, saldo, valorDeInversion } from '../calculo/saldos';
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

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
/** Ciclo del día 1: enero y febrero cerrados, marzo activo. */
const HOY = f('2027-03-15');
const [ENE, MAR] = [f('2027-01-01'), f('2027-03-10')];
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
const codigos = (r: ResultadoAplicar) => rechazos(r).map((x) => x.codigo);
const aplicarEn = (h: Hechos, x: ComandoDominio) => aplicar(h, x, HOY);
const hechos = (h: Hechos, ...xs: ComandoDominio[]) =>
  xs.reduce((y, x) => exito(aplicarEn(y, x)).hechosNuevos, h);
const lpa = (h: Hechos) => calcular(h, HOY).lpa;
const disp = (h: Hechos, x: Uuid) =>
  calcular(h, HOY).presupuesto.celdas.find(
    (y) => y.categoriaId === x && y.periodo.inicio === f('2027-03-01'),
  )?.disponible;
/** Las partidas de §4.13 que origina la transacción `tx`. */
const partidas = (h: Hechos, tx: Uuid) =>
  calcular(h, HOY)
    .clasificacion.partidas.filter(
      (p) => p.id === tx || h.lineas.some((l) => l.id === p.id && l.transaccionId === tx),
    )
    .map(({ clase, categoriaId, monto }) => ({ clase, categoriaId, monto }));

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
const inversion = { tipo: 'inversion', rendimientoAnualEsperadoMillonesimas: null } as const;

/** Un alta con instante, fecha (marzo) y su propio generador de ids. */
const op = (x: { readonly operacion: string } & Record<string, unknown>) =>
  ({ instante: INSTANTE, fecha: MAR, ids: contador(), ...x }) as unknown as ComandoDominio;

/**
 * E (efectivo, 1.000), T (tarjeta sin deuda), L (préstamo sin modelo, 10.000) e I (inversión, 0).
 * SUPER tiene 300 asignados en marzo; VIEJA está archivada. LPA = 1.000 − 300 = 700.
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
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    grupos: [grupo('PT', 'pagos_tarjeta'), grupo('A', null)],
    categorias: [categoria('SUPER'), categoria('VIEJA', true)],
  } as unknown as Hechos;
  return hechos(
    h,
    cuenta('E', 'efectivo', 1000),
    cuenta('T', 'tarjeta', 0, tarjeta),
    cuenta('L', 'prestamo', 10000, prestamo),
    cuenta('I', 'inversion', 0, inversion),
    {
      operacion: 'OP-14',
      categoriaId: id('SUPER'),
      periodoInicio: f('2027-03-01'),
      montoNuevo: c(300),
      ids: contador(),
    },
  );
}
const H0 = base();
const PAGO_T = pagoDe(H0, id('T'))?.id as Uuid;

const op25 = (modalidad: string, total: number, extra: object = {}) =>
  op({
    operacion: 'OP-25',
    id: id(`i${++comandos}`),
    modalidad,
    inversionId: 'I',
    total: c(total),
    ...(modalidad !== 'ajuste' && { cuentaId: 'E' }),
    ...(modalidad === 'aporte' && { categoriaId: 'SUPER' }),
    ...extra,
  });
const op26 = (total: number, extra: object = {}) =>
  op({
    operacion: 'OP-26',
    id: id(`d${++comandos}`),
    prestamoId: 'L',
    cuentaId: 'E',
    total: c(total),
    ...extra,
  });
const txDe = (x: ComandoDominio) => (x as { id: Uuid }).id;
/** Los efectos que inserta un resultado, como [cuenta, monto]. */
const efectos = (r: ResultadoAplicar) =>
  exito(r).cambios.flatMap((x) =>
    x.tipo === 'insertar' && x.tabla === 'efectos'
      ? [[x.fila.cuentaId, x.fila.monto, x.fila.interes, x.fila.seguro]]
      : [],
  );

describe('PRU-DOM-CTA-104: aplicar, inversiones y desembolso (01 §5.4, §4.13; 04 §3.4)', () => {
  it('PRU-DOM-CTA-104 [INV-06, CB-28] OP-25: el aporte es un consumo de débito (efectivo −X, inversión +X, una línea a la categoría), gasto de su categoría y sin cambio en LPA', () => {
    const x = op25('aporte', 200, { comercio: 'Fondo', nota: 'n' });
    const r = exito(aplicarEn(H0, x));
    expect(r.cambios[0]).toMatchObject({
      tipo: 'insertar',
      tabla: 'transacciones',
      fila: {
        id: txDe(x),
        tipo: 'aporte_inversion',
        fecha: MAR,
        claveOrden: INSTANTE,
        origen: 'manual',
        total: c(200),
        comercio: 'Fondo',
        nota: 'n',
      },
    });
    expect(efectos(r)).toEqual([
      ['E', c(-200), null, null],
      ['I', c(200), null, null],
    ]);
    expect(r.cambios.filter((y) => y.tipo === 'insertar' && y.tabla === 'lineas')).toEqual([
      {
        tipo: 'insertar',
        tabla: 'lineas',
        fila: expect.objectContaining({
          orden: 1,
          monto: c(200),
          categoriaId: 'SUPER',
          deudorId: null,
          transaccionId: txDe(x),
        }) as object,
      },
    ]);
    const h = r.hechosNuevos;
    expect([saldo(h, id('E')), valorDeInversion(h, id('I'))]).toEqual([c(800), c(200)]);
    // Consumo de débito: Disp(SUPER) baja; LPA no cambia (01 §4.9).
    expect(disp(h, id('SUPER'))).toBe(c(100));
    expect(lpa(h).total).toBe(lpa(H0).total);
    expect(partidas(h, txDe(x))).toEqual([{ clase: 'gasto', categoriaId: 'SUPER', monto: c(200) }]);
    // CB-28: un monto cero no es un comando válido.
    expect(() => aplicarEn(H0, op25('aporte', 0))).toThrow(TypeError);
  });

  it('PRU-DOM-CTA-104 OP-25: el aporte rechaza una categoría de pago o archivada, una cuenta que no es de efectivo y una inversión que no es inversión', () => {
    expect(codigos(aplicarEn(H0, op25('aporte', 10, { categoriaId: PAGO_T })))).toEqual([
      'categoria_de_pago_no_permitida',
    ]);
    expect(codigos(aplicarEn(H0, op25('aporte', 10, { categoriaId: 'VIEJA' })))).toContain(
      'categoria_archivada',
    );
    expect(codigos(aplicarEn(H0, op25('aporte', 10, { cuentaId: 'T' })))).toEqual([
      'cuenta_tipo_no_valido',
    ]);
    expect(codigos(aplicarEn(H0, op25('aporte', 10, { inversionId: 'E' })))).toEqual([
      'cuenta_tipo_no_valido',
    ]);
    expect(codigos(aplicarEn(H0, op25('retiro', 10, { cuentaId: 'L' })))).toEqual([
      'cuenta_tipo_no_valido',
    ]);
  });

  it('PRU-DOM-CTA-104 OP-25: el retiro (inversión −X, efectivo +X) admite X = valor, entra a LPA como otras entradas y rechaza X > valor', () => {
    const h1 = hechos(H0, op25('aporte', 200));
    expect(codigos(aplicarEn(h1, op25('retiro', 200.01)))).toEqual(['retiro_mayor_que_valor']);
    expect(rechazos(aplicarEn(h1, op25('retiro', 200.01)))[0]?.datos).toMatchObject({
      valor: c(200),
    });
    const x = op25('retiro', 200);
    const r = exito(aplicarEn(h1, x));
    expect(r.cambios[0]).toMatchObject({ fila: { tipo: 'retiro_inversion', total: c(200) } });
    expect(efectos(r)).toEqual([
      ['I', c(-200), null, null],
      ['E', c(200), null, null],
    ]);
    expect(r.cambios.some((y) => y.tipo === 'insertar' && y.tabla === 'lineas')).toBe(false);
    const h = r.hechosNuevos;
    expect([saldo(h, id('E')), valorDeInversion(h, id('I'))]).toEqual([c(1000), c(0)]);
    expect(lpa(h).total).toBe(Centavos.sumar(lpa(h1).total, c(200)));
    expect(lpa(h).entradas.otras).toBe(Centavos.sumar(lpa(h1).entradas.otras, c(200)));
    expect(lpa(h).entradas.ingreso).toBe(lpa(h1).entradas.ingreso);
    expect(partidas(h, txDe(x))).toEqual([
      { clase: 'otras_entradas', categoriaId: null, monto: c(200) },
    ]);
    // Sin aportes, la inversión vale 0: cualquier retiro supera el valor.
    expect(codigos(aplicarEn(H0, op25('retiro', 1)))).toEqual(['retiro_mayor_que_valor']);
  });

  it('PRU-DOM-CTA-104 OP-25: el ajuste mueve solo la inversión (±X, total |X|), sin efecto presupuestario ni clase de reporte, y no deja el valor < 0', () => {
    const h1 = hechos(H0, op25('aporte', 200));
    const sube = op25('ajuste', 50);
    const r = exito(aplicarEn(h1, sube));
    expect(r.cambios[0]).toMatchObject({ fila: { tipo: 'ajuste_inversion', total: c(50) } });
    expect(efectos(r)).toEqual([['I', c(50), null, null]]);
    const h2 = r.hechosNuevos;
    expect(valorDeInversion(h2, id('I'))).toBe(c(250));
    expect([saldo(h2, id('E')), lpa(h2).total, disp(h2, id('SUPER'))]).toEqual([
      saldo(h1, id('E')),
      lpa(h1).total,
      disp(h1, id('SUPER')),
    ]);
    expect(partidas(h2, txDe(sube))).toEqual([]);
    // Un ajuste negativo: el total de la transacción es |X| y el efecto lleva el signo.
    expect(codigos(aplicarEn(h2, op25('ajuste', -250.01)))).toEqual(['valor_inversion_negativo']);
    const baja = exito(aplicarEn(h2, op25('ajuste', -250)));
    expect(baja.cambios[0]).toMatchObject({ fila: { tipo: 'ajuste_inversion', total: c(250) } });
    expect(efectos(baja)).toEqual([['I', c(-250), null, null]]);
    expect(valorDeInversion(baja.hechosNuevos, id('I'))).toBe(c(0));
    expect(lpa(baja.hechosNuevos).total).toBe(lpa(h1).total);
    // Un ajuste de 0 no es un comando válido (MontoTextoConSigno ≠ 0).
    expect(() => aplicarEn(h2, op25('ajuste', 0))).toThrow(TypeError);
  });

  it('PRU-DOM-CTA-104 OP-26: el desembolso suma X al capital pendiente y al efectivo, y entra a LPA como otras entradas', () => {
    const x = op26(1000, { nota: 'auto' });
    const r = exito(aplicarEn(H0, x));
    expect(r.cambios[0]).toMatchObject({
      fila: { id: txDe(x), tipo: 'desembolso_prestamo', total: c(1000), nota: 'auto' },
    });
    expect(efectos(r)).toEqual([
      ['L', c(1000), null, null],
      ['E', c(1000), null, null],
    ]);
    expect(r.cambios.some((y) => y.tipo === 'insertar' && y.tabla === 'lineas')).toBe(false);
    const h = r.hechosNuevos;
    expect([capitalPendiente(h, id('L')), saldo(h, id('E'))]).toEqual([c(11000), c(2000)]);
    expect(lpa(h).total).toBe(Centavos.sumar(lpa(H0).total, c(1000)));
    expect(lpa(h).entradas.otras).toBe(Centavos.sumar(lpa(H0).entradas.otras, c(1000)));
    expect(partidas(h, txDe(x))).toEqual([
      { clase: 'otras_entradas', categoriaId: null, monto: c(1000) },
    ]);
    expect(codigos(aplicarEn(H0, op26(10, { cuentaId: 'T' })))).toEqual(['cuenta_tipo_no_valido']);
    expect(codigos(aplicarEn(H0, op26(10, { prestamoId: 'I' })))).toEqual([
      'cuenta_tipo_no_valido',
    ]);
    expect(() => aplicarEn(H0, op26(0))).toThrow(TypeError);
  });
});
