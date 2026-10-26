import { describe, expect, it } from 'vitest';
import { calcular } from '../../calculo/calcular';
import type {
  Categoria,
  Cuenta,
  Deudor,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  Tarjeta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { flujoEfectivo, hallazgos, tarjetas } from './index';
import { ordenarHallazgos } from './hallazgos';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Hoy = 2027-04-15, ciclo mensual: diciembre a marzo cerrados y abril activo. Efectivo `ef` (con
 * `ef2` para una transferencia) y la tarjeta `vi` con corte el 1 y pago el 17.
 *
 * Visa: cargo de 200 (10/12), pago de 150 (10/1), cargo de 100 (20/1), pago de 150 (15/2), cashback
 * de 20 (16/2), cargo de 300 (20/2), pago de 100 (17/3) y cargo de 60 (5/4).
 */
function estado(ajustar: (h: Hechos) => Hechos = (h) => h) {
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const tx = (
    n: string,
    tipo: TipoTransaccion,
    fecha: string,
    total: number,
    patas: [string, number][],
    extra: Partial<Transaccion> = {},
  ) => {
    transacciones.push({
      id: id(n),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.${String(transacciones.length).padStart(3, '0')}Z`,
      secuencia: String(transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio: null,
      total: c(total),
      lineaCobradaId: null,
      ...extra,
    } as Transaccion);
    for (const [cuenta, monto] of patas)
      efectos.push({
        id: id(`e-${n}-${cuenta}`),
        transaccionId: id(n),
        cuentaId: id(cuenta),
        monto: c(monto),
        interes: null,
        seguro: null,
      } as Efecto);
  };
  const linea = (
    n: string,
    orden: number,
    monto: number,
    categoria: string | null,
    deudor?: string,
  ) =>
    lineas.push({
      id: id(`l-${n}-${orden}`),
      transaccionId: id(n),
      orden,
      monto: c(monto),
      categoriaId: categoria === null ? null : id(categoria),
      deudorId: deudor === undefined ? null : id(deudor),
      lineaOriginalId: null,
    } as Linea);
  const cargo = (n: string, fecha: string, monto: number) => {
    tx(n, 'gasto', fecha, monto, [['vi', -monto]]);
    linea(n, 1, monto, 'c1');
  };
  const pago = (n: string, fecha: string, monto: number) => {
    tx(n, 'pago_tarjeta', fecha, monto, [
      ['ef', -monto],
      ['vi', monto],
    ]);
  };

  tx('si', 'saldo_inicial', '2026-12-01', 1000, [['ef', 1000]]);
  cargo('v1', '2026-12-10', 200);
  pago('p1', '2027-01-10', 150);
  cargo('v2', '2027-01-20', 100);
  pago('p2', '2027-02-15', 150);
  tx('cb', 'entrada_tarjeta', '2027-02-16', 20, [['vi', 20]]);
  cargo('v3', '2027-02-20', 300);
  pago('p3', '2027-03-17', 100);
  cargo('v4', '2027-04-05', 60);
  // Efectivo: un gasto, un ingreso, una transferencia, un gasto con una parte por cobrar y su cobro.
  tx('g1', 'gasto', '2027-01-12', 40, [['ef', -40]]);
  linea('g1', 1, 40, 'c1');
  tx('in', 'ingreso', '2027-02-05', 500, [['ef', 500]]);
  tx('tr', 'transferencia', '2027-02-10', 50, [
    ['ef', -50],
    ['ef2', 50],
  ]);
  tx('g2', 'gasto', '2027-03-03', 30, [['ef', -30]]);
  linea('g2', 1, 20, 'c1');
  linea('g2', 2, 10, null, 'd1');
  tx('co', 'cobro', '2027-03-20', 15, [['ef', 15]], { lineaCobradaId: id('l-g2-2') });

  const hechos: Hechos = {
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: ['ef', 'ef2', 'vi'].map((k) => ({
      id: id(k),
      tipo: k === 'vi' ? 'tarjeta' : 'efectivo',
      nombre: k,
      fechaApertura: f('2026-12-01'),
      archivada: false,
    })) as unknown as Cuenta[],
    tarjetas: [
      { cuentaId: id('vi'), tipo: 'tarjeta', limiteCredito: c(5000), diaCorte: 1, diaPago: 17 },
    ] as Tarjeta[],
    prestamos: [],
    inversiones: [],
    grupos: [
      { id: id('g'), nombre: 'Gastos', orden: 1, archivado: false, claveSistema: null },
      { id: id('pagos'), nombre: 'Pagos', orden: 2, archivado: false, claveSistema: 'pagos' },
    ] as Grupo[],
    categorias: [
      {
        id: id('c1'),
        grupoId: id('g'),
        nombre: 'c1',
        orden: 1,
        clase: 'normal',
        tarjetaId: null,
        archivada: false,
      },
      {
        id: id('pago-vi'),
        grupoId: id('pagos'),
        nombre: 'Pago Visa',
        orden: 1,
        clase: 'pago',
        tarjetaId: id('vi'),
        archivada: false,
      },
    ] as Categoria[],
    asignaciones: [],
    deudores: [{ id: id('d1'), nombre: 'Deudor' }] as Deudor[],
    transacciones,
    efectos,
    lineas,
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
  return calcular(ajustar(hechos), f('2027-04-15'));
}

const conReserva = (h: Hechos): Hechos => ({
  ...h,
  asignaciones: [
    { id: id('a1'), categoriaId: id('pago-vi'), periodoInicio: f('2027-04-01'), monto: c(1000) },
  ] as unknown as Hechos['asignaciones'],
});

describe('PRU-DOM-REP', () => {
  const i = estado();

  it('PRU-DOM-REP-001 [V6-01] REP-tarjetas (CF-04) tarjetas: deuda del estado, pagado o acreditado a tiempo y arrastre de cada ciclo, y el último ciclo da el hallazgo', () => {
    const r = tarjetas(i);
    expect(r.periodos.map((p) => p.inicio)).toEqual(
      ['2026-12-01', '2027-01-01', '2027-02-01', '2027-03-01'].map(f),
    );
    const [visa] = r.tarjetas;
    expect(visa?.tarjeta).toEqual({ id: 'vi', nombre: 'vi' });
    expect(
      visa?.ciclos.map((x) => [x.corte, x.fechaPago, x.deudaEstado, x.pagadoATiempo, x.arrastre]),
    ).toEqual([
      [f('2026-12-01'), f('2026-12-17'), c(0), c(0), c(0)],
      [f('2027-01-01'), f('2027-01-17'), c(200), c(150), c(50)],
      // Los 20 del cashback cuentan como acreditados (06 §3.5.10 [R1]): 150 + 20 ≥ 150.
      [f('2027-02-01'), f('2027-02-17'), c(150), c(170), c(0)],
      [f('2027-03-01'), f('2027-03-17'), c(280), c(100), c(180)],
    ]);
    expect(visa?.periodos.map((p) => [p.cargos, p.pagos, p.deudaAlFin])).toEqual([
      [c(200), c(0), c(200)],
      [c(100), c(150), c(150)],
      [c(300), c(170), c(280)],
      [c(0), c(100), c(180)],
    ]);
    expect(visa?.pagaElTotal).toBe(false);

    // Te falta reservar los 240 de deuda (nada asignado a pago(Visa)): la acción es "Reservar".
    expect(i.tarjetas[0]?.sinRespaldo).toBe(c(240));
    expect(r.hallazgos).toEqual([
      {
        tipo: 'tarjeta',
        clave: 'tarjeta:vi',
        impacto: c(180),
        estado: 'deuda-sin-respaldo',
        tarjeta: { id: 'vi', nombre: 'vi' },
        arrastre: c(180),
        corte: f('2027-03-01'),
        sinRespaldo: c(240),
        accion: { tipo: 'reservar', categoriaId: 'pago-vi', montoNuevo: c(240) },
      },
    ]);
    // Con lo reservado, la acción es pagar la tarjeta.
    const reservada = estado(conReserva);
    expect(reservada.tarjetas[0]?.sinRespaldo).toBe(c(0));
    expect(tarjetas(reservada).hallazgos[0]).toMatchObject({
      estado: 'advertencia',
      accion: { tipo: 'pagar', tarjetaId: 'vi' },
    });
    // Sin ciclos vencidos en la ventana (solo el período activo) no hay nada que evaluar.
    expect(tarjetas(i, { ventana: 'actual' }).tarjetas[0]?.ciclos).toEqual([]);
    expect(tarjetas(i, { cuentaIds: [id('ef')] }).tarjetas).toEqual([]);
  });

  it('PRU-DOM-REP-001 [V6-03] REP-flujo_efectivo (CF-02) flujo de efectivo: filas por período con la identidad, la transferencia solo con filtro y la acción de cierre', () => {
    const r = flujoEfectivo(i, { ventana: 'ultimos_3' });
    const filas = (n: number) =>
      Object.fromEntries(r.periodos[n]?.filas.map((x) => [x.fila, x.monto]) ?? []);
    expect(r.periodos.map((p) => [p.saldoInicial, p.saldoFinal, p.comprasConTarjeta])).toEqual([
      [c(1000), c(810), c(100)],
      [c(810), c(1160), c(300)],
      [c(1160), c(1045), c(0)],
    ]);
    expect(filas(0)).toMatchObject({ gastos_debito: c(-40), pagos_tarjeta: c(-150) });
    expect(filas(1)).toMatchObject({ ingresos: c(500), pagos_tarjeta: c(-150) });
    expect(filas(2)).toMatchObject({
      gastos_debito: c(-20),
      por_cobrar_debito: c(-10),
      pagos_tarjeta: c(-100),
      restituciones: c(10),
      ingresos: c(5),
    });
    expect(r.periodos[1]?.filas.some((x) => x.fila === 'transferencias')).toBe(false);

    // Con el filtro de `ef`, la pata que cae en `ef2` va a la fila `transferencias`.
    const k = flujoEfectivo(i, { ventana: 'ultimos_3', cuentaIds: [id('ef')] });
    const feb = k.periodos[1];
    expect(feb?.filas.find((x) => x.fila === 'transferencias')?.monto).toBe(c(-50));
    expect(feb?.saldoFinal).toBe(c(1110));

    // Abril: compras con tarjeta (60) frente a pagos (0): "Reservar" si falta, o ver el remanente.
    expect(r.accion).toMatchObject({
      tipo: 'reservar',
      monto: c(240),
      montoNuevo: c(240),
      tarjeta: { id: 'vi' },
    });
    expect(r.hallazgos).toHaveLength(1);
    expect(r.hallazgos[0]).toMatchObject({ clave: 'tarjeta:vi', impacto: c(240) });
    // Con todo reservado no hay hallazgo: el reporte termina con el enlace a "Lo que te quedó".
    const reservada = flujoEfectivo(estado(conReserva), { ventana: 'actual' });
    expect(reservada.accion).toEqual({ tipo: 'ver', reporte: 'remanente' });
    expect(reservada.hallazgos).toEqual([]);
  });

  it('PRU-DOM-REP-001 [V6-01] REP-hallazgos (CF-04) hallazgos: una fila por clave, la de mayor impacto; a igual impacto el menor orden de tipo; máximo 5', () => {
    const h = (
      tipo: 'ritmo' | 'tarjeta' | 'realidad' | 'hormiga' | 'promedio',
      clave: string,
      impacto: number,
    ) => ({ tipo, clave, impacto: c(impacto) }) as const;
    const o = ordenarHallazgos([
      h('promedio', 'categoria:a', 30),
      h('realidad', 'categoria:a', 30),
      h('ritmo', 'categoria:b', 10),
      h('hormiga', 'categoria:b', 40),
      h('tarjeta', 'tarjeta:t', 30),
      h('hormiga', 'comercio:x', 5),
      h('ritmo', 'categoria:c', 1),
      h('ritmo', 'categoria:d', 2),
    ]);
    expect(o.map((x) => [x.tipo, x.clave])).toEqual([
      ['hormiga', 'categoria:b'],
      ['tarjeta', 'tarjeta:t'],
      ['realidad', 'categoria:a'],
      ['hormiga', 'comercio:x'],
      ['ritmo', 'categoria:d'],
    ]);

    const r = hallazgos(i, []);
    expect(r.periodo.inicio).toBe('2027-04-01');
    expect(r.hallazgos.length).toBeLessThanOrEqual(5);
    expect(r.hallazgos.find((x) => x.tipo === 'tarjeta')).toMatchObject({
      clave: 'tarjeta:vi',
      impacto: c(180),
    });
    expect(r.hallazgos.map((x) => x.impacto)).toEqual(
      [...r.hallazgos.map((x) => x.impacto)].sort((a, b) => b - a),
    );
  });
});
