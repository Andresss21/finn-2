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

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
/** Ciclo del día 1: enero y febrero cerrados, marzo activo. */
const HOY = f('2027-03-15');
const [ENE, FEB, MAR, A] = [f('2027-01-01'), f('2027-02-10'), f('2027-03-10'), f('2027-03-01')];
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
const aviso = (r: ResultadoAplicar, codigo: string) =>
  exito(r).avisos.find((a) => a.codigo === codigo);
const aplicarEn = (h: Hechos, x: ComandoDominio) => aplicar(h, x, HOY);
const hechos = (h: Hechos, ...xs: ComandoDominio[]) =>
  xs.reduce((y, x) => exito(aplicarEn(y, x)).hechosNuevos, h);
const calc = (h: Hechos) => calcular(h, HOY);
const lpa = (h: Hechos) => calc(h).lpa.total;
const tarjetaDe = (h: Hechos, t: string) => calc(h).tarjetas.find((x) => x.tarjetaId === t);
const disp = (h: Hechos, x: Uuid) =>
  calc(h).presupuesto.celdas.find((y) => y.categoriaId === x && y.periodo.inicio === A)
    ?.disponible ?? Centavos.cero;
const asig = (h: Hechos, x: Uuid) =>
  h.asignaciones.find((y) => y.categoriaId === x && y.periodoInicio === A)?.monto;
const linea = (h: Hechos, l: Uuid) => calc(h).porCobrar.find((x) => x.lineaId === l);

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

const op = (x: { readonly operacion: string } & Record<string, unknown>) =>
  ({ instante: INSTANTE, fecha: MAR, ids: contador(), ...x }) as unknown as ComandoDominio;
const gasto = (k: string, fecha: FechaLocal, lineas: [number, object][]) =>
  op({
    operacion: 'OP-20',
    id: id(`G${k}`),
    cuentaId: id(k),
    fecha,
    total: c(lineas.reduce((s, [m]) => s + m, 0)),
    lineas: lineas.map(([m, destino]) => ({ monto: c(m), destino })),
  });

/**
 * E (efectivo, 1.000), T y U (tarjetas sin deuda), I (inversión); SUPER con 300 asignados en
 * marzo; Ana y Beto son deudores. GE (10 feb, con E): 60 a SUPER y LD = 40 por cobrar a Ana.
 * GT (10 feb, con T): LT = 80 por cobrar a Ana. El sobregiro de 60 de SUPER en febrero, cerrado,
 * reduce LPA al cierre (§4.7): LPA = 1.000 − 300 − 40 − 60 = 600.
 */
function base(): Hechos {
  const vacio = Object.fromEntries(
    ['cuentas', 'tarjetas', 'prestamos', 'inversiones', 'asignaciones', 'transacciones']
      .concat(['efectos', 'lineas', 'condonaciones', 'metas', 'programadas', 'programada_lineas'])
      .concat(['ocurrencias_resueltas', 'conciliaciones'])
      .map((t) => [t, []]),
  );
  const grupo = (g: string, clave: 'pagos_tarjeta' | null) => ({
    ...{ id: id(g), nombre: g, orden: 1, archivado: false, claveSistema: clave, revision: null },
  });
  const h = {
    ...vacio,
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    grupos: [grupo('PT', 'pagos_tarjeta'), grupo('A', null)],
    categorias: [
      {
        ...{ id: id('SUPER'), grupoId: id('A'), nombre: 'SUPER', orden: 1, clase: 'normal' },
        ...{ tarjetaId: null, archivada: false, revision: null },
      },
    ],
    deudores: ['Ana', 'Beto'].map((n) => ({ id: id(n), nombre: n, revision: null })),
  } as unknown as Hechos;
  return hechos(
    h,
    cuenta('E', 'efectivo', 1000),
    cuenta('T', 'tarjeta', 0, tarjeta),
    cuenta('U', 'tarjeta', 0, tarjeta),
    cuenta('I', 'inversion', 0, inversion),
    op({
      operacion: 'OP-14',
      categoriaId: id('SUPER'),
      periodoInicio: A,
      montoNuevo: c(300),
    }),
    gasto('E', FEB, [
      [60, { categoriaId: id('SUPER') }],
      [40, { deudorId: id('Ana') }],
    ]),
    gasto('T', FEB, [[80, { deudorId: id('Ana') }]]),
  );
}
const H0 = base();
const lineaDe = (t: string, orden: number) =>
  H0.lineas.find((l) => l.transaccionId === t && l.orden === orden)?.id as Uuid;
const [L60, LD, LT] = [lineaDe('GE', 1), lineaDe('GE', 2), lineaDe('GT', 1)];
const PAGO_T = pagoDe(H0, id('T'))?.id as Uuid;
const PAGO_U = pagoDe(H0, id('U'))?.id as Uuid;

let cobros = 0;
const cobro = (lineaId: Uuid, cuentaId: string, total: number, extra: object = {}) =>
  op({ operacion: 'OP-31', id: id(`C${++cobros}`), lineaId, cuentaId, total: c(total), ...extra });
const cobrar = (h: Hechos, ...xs: Parameters<typeof cobro>) => aplicarEn(h, cobro(...xs));

describe('PRU-DOM-COBRO-101: aplicar, cobrar y renombrar deudor (01 §4.10, §5.5; 04 §3.5)', () => {
  it('PRU-DOM-COBRO-101 [INV-09] OP-31: el cobro crea la transacción `cobro` vinculada a la línea con +C en la cuenta; por cobrar con débito y depósito en efectivo: LPA +R y baja el dinero en camino (AV-09)', () => {
    expect(lpa(H0)).toBe(c(600));
    const r = cobrar(H0, LD, 'E', 30);
    const { cambios, hechosNuevos: h } = exito(r);
    expect(cambios).toHaveLength(2);
    expect(cambios[0]).toMatchObject({
      tipo: 'insertar',
      tabla: 'transacciones',
      fila: {
        ...{ id: id(`C${cobros}`), tipo: 'cobro', fecha: MAR, total: c(30) },
        ...{ lineaCobradaId: LD, claveOrden: INSTANTE, estadoBancario: 'pendiente' },
      },
    });
    expect(cambios[1]).toMatchObject({
      tipo: 'insertar',
      tabla: 'efectos',
      fila: { transaccionId: id(`C${cobros}`), cuentaId: id('E'), monto: c(30) },
    });
    expect(saldo(h, id('E'))).toBe(c(930));
    expect(lpa(h)).toBe(c(630));
    expect(linea(h, LD)).toMatchObject({ abierto: c(10), restituido: c(30) });
    expect(aviso(r, 'AV-09')?.datos).toMatchObject({ monto: c(10) });
    expect(codigos(r)).not.toContain('AV-22');
    expect(exito(r).impacto.deltaLpa).toBe(c(30));
  });

  it('PRU-DOM-COBRO-101 [INV-09, CB-23] OP-31: el excedente entra a LPA como ingreso; un por cobrar cerrado en la fecha del cobro se rechaza (sin_saldo_abierto)', () => {
    const r = cobrar(H0, LD, 'E', 50);
    const h = exito(r).hechosNuevos;
    expect(lpa(h)).toBe(c(650)); // R = 40 por el dinero en camino y 10 de ingreso
    const l = linea(h, LD);
    expect(l).toMatchObject({ abierto: c(0), restituido: c(40) });
    expect(l?.eventos.map((e) => [e.restituido, e.excedente])).toEqual([[c(40), c(10)]]);
    expect(rechazos(cobrar(h, LD, 'E', 5))).toEqual([
      { codigo: 'sin_saldo_abierto', datos: { lineaId: LD, fecha: MAR } },
    ]);
    // En una fecha anterior al cobro que lo cerró, la línea todavía tenía saldo abierto.
    const antes = exito(cobrar(h, LD, 'E', 5, { fecha: f('2027-03-05') })).hechosNuevos;
    expect(linea(antes, LD)?.eventos.map((e) => [e.restituido, e.excedente])).toEqual([
      [c(5), c(0)],
      [c(35), c(15)],
    ]);
  });

  it('PRU-DOM-COBRO-101 [CB-05, AV-05, AV-08, INV-09] OP-31: por cobrar con débito depositado en una tarjeta u: baja la deuda de u, LPA +R y pago implícito Disp(pago(u)) −R; AV-08 si sobra reserva y AV-05 si no la había; el excedente solo reduce la deuda', () => {
    const conDeuda = hechos(H0, gasto('U', MAR, [[100, { categoriaId: id('SUPER') }]]));
    expect(tarjetaDe(conDeuda, 'U')?.deuda).toBe(c(100));
    const r = cobrar(conDeuda, LD, 'U', 50);
    const h = exito(r).hechosNuevos;
    expect(tarjetaDe(h, 'U')?.deuda).toBe(c(50));
    expect(lpa(h)).toBe(Centavos.sumar(lpa(conDeuda), c(40)));
    expect(Centavos.restar(disp(h, PAGO_U), disp(conDeuda, PAGO_U))).toBe(c(-40));
    // pago(u) tenía 100 reservados por D2: quedan 60 para una deuda de 50 (AV-08).
    expect(codigos(r)).toEqual(['AV-08']); // AV-09 desaparece: no queda dinero en camino
    expect(linea(h, LD)).toMatchObject({ abierto: c(0), restituido: c(40) });
    // Sin reserva ni deuda en u: Disp(pago(u)) queda en −40, pago excedente por un cobro (AV-05).
    const sinReserva = cobrar(H0, LD, 'U', 40);
    expect(disp(exito(sinReserva).hechosNuevos, PAGO_U)).toBe(c(-40));
    expect(aviso(sinReserva, 'AV-05')).toMatchObject({ momento: 'despues' });
  });

  it('PRU-DOM-COBRO-101 [AV-22] OP-31 BE-36: por cobrar con tarjeta t depositado en efectivo: R entra a LPA como restitución con la propuesta AV-22 de asignarla a pago(t); el excedente es ingreso', () => {
    const r = cobrar(H0, LT, 'E', 100);
    const h = exito(r).hechosNuevos;
    expect(lpa(h)).toBe(c(700)); // 80 de restitución y 20 de ingreso
    expect(tarjetaDe(h, 'T')?.deuda).toBe(c(80));
    expect(aviso(r, 'AV-22')).toEqual({
      ...{ codigo: 'AV-22', momento: 'despues', requiereConfirmacion: false },
      datos: { categoriaId: PAGO_T, tarjetaId: id('T'), periodoInicio: A, monto: c(80) },
    });
    expect(linea(h, LT)).toMatchObject({ abierto: c(0), restituido: c(80) });
  });

  it('PRU-DOM-COBRO-101 [AV-22, AV-11] OP-31 BE-36 OP-14: con asignarAPagoTarjeta la misma operación asigna R a pago(t) en el período activo con las reglas de OP-14 (AV-11 si LPA queda negativo), sin AV-22; fuera de ese caso es un comando mal formado', () => {
    const conAsig = hechos(
      H0,
      op({ operacion: 'OP-14', categoriaId: PAGO_T, periodoInicio: A, montoNuevo: c(10) }),
    );
    const r = cobrar(conAsig, LT, 'E', 50, { asignarAPagoTarjeta: true });
    const h = exito(r).hechosNuevos;
    expect(asig(h, PAGO_T)).toBe(c(60));
    expect(lpa(h)).toBe(lpa(conAsig)); // +50 de restitución y −50 asignados
    expect(tarjetaDe(h, 'T')).toMatchObject({ deuda: c(80), sinRespaldo: c(20) });
    expect(codigos(r)).not.toContain('AV-22');
    expect(exito(r).cambios.map((x) => ('tabla' in x ? x.tabla : x.tipo))).toEqual([
      'transacciones',
      'efectos',
      'asignaciones',
    ]);
    // AV-11: con LPA ya negativo, la asignación de R lo deja negativo (OP-14 en el activo).
    const sinLpa = hechos(
      H0,
      op({ operacion: 'OP-14', categoriaId: id('SUPER'), periodoInicio: A, montoNuevo: c(1000) }),
    );
    expect(lpa(sinLpa)).toBe(c(-100));
    const negativo = cobrar(sinLpa, LT, 'E', 30, { asignarAPagoTarjeta: true });
    expect(aviso(negativo, 'AV-11')).toMatchObject({ momento: 'antes', datos: { lpa: c(-100) } });
    expect(asig(exito(negativo).hechosNuevos, PAGO_T)).toBe(c(30));
    // Un cobro anterior a una condonación de todo el saldo la deja por encima del abierto: inv. 9.
    const condonacion = {
      ...{ id: id('K'), lineaId: LT, fecha: MAR, monto: c(80), claveOrden: INSTANTE },
      ...{ secuencia: null, categoriaId: id('SUPER'), revision: null },
    };
    const condonada = { ...H0, condonaciones: [condonacion] };
    const previo = cobrar(condonada, LT, 'E', 10, {
      fecha: f('2027-03-05'),
      asignarAPagoTarjeta: true,
    });
    expect(rechazos(previo).map((x) => x.codigo)).toEqual(['invariante_violada']);
    expect(String(rechazos(previo)[0]?.datos?.['error'])).toContain('inv. 9');
    // Débito, o depósito en una tarjeta: no hay propuesta que aceptar.
    expect(() => cobrar(H0, LD, 'E', 10, { asignarAPagoTarjeta: true })).toThrow(TypeError);
    expect(() => cobrar(H0, LT, 'U', 10, { asignarAPagoTarjeta: true })).toThrow(TypeError);
  });

  it('PRU-DOM-COBRO-101 [CB-05] OP-31: por cobrar con tarjeta depositado en una tarjeta: solo reduce la deuda; LPA y pago(u) no cambian y no hay AV-22', () => {
    const r = cobrar(H0, LT, 'T', 30);
    const h = exito(r).hechosNuevos;
    expect(tarjetaDe(h, 'T')).toMatchObject({ deuda: c(50), sinRespaldo: c(50) });
    expect(lpa(h)).toBe(lpa(H0));
    expect(disp(h, PAGO_T)).toBe(disp(H0, PAGO_T));
    expect(codigos(r)).not.toContain('AV-22');
    expect(codigos(r)).not.toContain('AV-05');
  });

  it('PRU-DOM-COBRO-101 [INV-12, AV-01, CB-23] OP-31: rechaza una línea de categoría, una línea o cuenta inexistente, una cuenta que no es efectivo ni tarjeta y una fecha anterior a la compra o posterior a hoy; en un período cerrado da AV-01', () => {
    const primero = (r: ResultadoAplicar) => rechazos(r)[0];
    expect(primero(cobrar(H0, L60, 'E', 10))).toEqual({
      codigo: 'linea_no_es_por_cobrar',
      datos: { lineaId: L60 },
    });
    expect(primero(cobrar(H0, id('nada'), 'E', 10))?.codigo).toBe('no_encontrado');
    expect(primero(cobrar(H0, LD, 'nada', 10))?.codigo).toBe('no_encontrado');
    expect(primero(cobrar(H0, LD, 'I', 10))?.codigo).toBe('cuenta_tipo_no_valido');
    expect(primero(cobrar(H0, LD, 'E', 10, { fecha: f('2027-02-09') }))).toEqual({
      codigo: 'evento_anterior_a_original',
      datos: { fecha: FEB },
    });
    expect(primero(cobrar(H0, LD, 'E', 10, { fecha: f('2027-03-16') }))?.codigo).toBe(
      'fecha_posterior_a_hoy',
    );
    const r = cobrar(H0, LD, 'E', 10, { fecha: f('2027-02-20') });
    expect(codigos(r)).toContain('AV-01');
    expect(lpa(exito(r).hechosNuevos)).toBe(c(610));
  });

  it('PRU-DOM-COBRO-101 OP-52 QB-2: renombra el deudor sin efecto en los cálculos; el nombre es único sin mayúsculas entre los deudores, salvo el propio', () => {
    const renombrar = (deudorId: string, nombre: string) =>
      aplicarEn(H0, { operacion: 'OP-52', deudorId: id(deudorId), nombre });
    const r = renombrar('Ana', 'Ana María');
    expect(exito(r).cambios).toEqual([
      { tipo: 'actualizar', tabla: 'deudores', id: id('Ana'), campos: { nombre: 'Ana María' } },
    ]);
    expect(exito(r).impacto.deltaLpa).toBe(c(0));
    expect(exito(r).avisos).toEqual([]);
    expect(calc(exito(r).hechosNuevos).porCobrar).toEqual(calc(H0).porCobrar);
    expect(exito(renombrar('Ana', 'ANA')).cambios).toHaveLength(1);
    expect(exito(renombrar('Ana', 'Ana')).cambios).toEqual([]);
    expect(rechazos(renombrar('Ana', 'beto'))).toEqual([
      { codigo: 'nombre_repetido', campo: 'nombre', datos: { nombre: 'beto', deudorId: id('Ana') } },
    ]);
    expect(rechazos(renombrar('nadie', 'Carla'))[0]?.codigo).toBe('no_encontrado');
  });
});
