import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { capitalPendiente, saldo, saldoConfirmado } from '../calculo/saldos';
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
import { desglosePropuesto } from './op-24';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
/** Ciclo del día 1: enero y febrero cerrados, marzo activo. */
const HOY = f('2027-03-15');
const [ENE, FEB, MAR] = [f('2027-01-01'), f('2027-02-01'), f('2027-03-10')];
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
const rechazos = (r: ResultadoAplicar) => (r.ok ? [] : r.rechazos.map((x) => x.codigo));
const codigos = (r: ResultadoAplicar) => exito(r).avisos.map((a) => a.codigo);
const aplicarEn = (h: Hechos, x: ComandoDominio) => aplicar(h, x, HOY);
const hechos = (h: Hechos, ...xs: ComandoDominio[]) =>
  xs.reduce((y, x) => exito(aplicarEn(y, x)).hechosNuevos, h);
const lpa = (h: Hechos) => calcular(h, HOY).lpa.total;
const s = (h: Hechos, t: string) =>
  calcular(h, HOY).tarjetas.find((x) => x.tarjetaId === t)?.sinRespaldo;
const disp = (h: Hechos, x: Uuid) =>
  calcular(h, HOY).presupuesto.celdas.find(
    (y) => y.categoriaId === x && y.periodo.inicio === f('2027-03-01'),
  )?.disponible;

const cuenta = (
  k: string,
  tipo: ComandoOp01['cuenta']['tipo'],
  saldoInicial: number,
  fechaApertura = ENE,
  subtipo?: ComandoOp01['subtipo'],
): ComandoDominio => ({
  operacion: 'OP-01',
  id: id(k),
  instante: '2027-01-01T12:00:00.000Z' as Instante,
  ids: contador(),
  cuenta: { tipo, nombre: k, institucionId: null, ultimos4: null, fechaApertura },
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
/** L: Banco Agrícola, 10.000 al 12 % nominal, seguro de 10 el primer mes y cuota de 500. */
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
  modeloCalculo: 'banco_agricola',
  cuotasPagadasAlCrear: 0,
} as const;

const alta = { instante: INSTANTE, fecha: MAR } as const;
/** Un alta con instante, fecha (por defecto, en marzo) y su propio generador de ids. */
const op = (x: { readonly operacion: string } & Record<string, unknown>) =>
  ({ ...alta, ids: contador(), ...x }) as unknown as ComandoDominio;

/**
 * E (efectivo, 1.000 desde el 1 ene), E2 (efectivo, abierta el 10 feb), T y U (tarjetas sin deuda),
 * L (préstamo, 10.000) y M (préstamo sin modelo). SUPER tiene 300 asignados en marzo; VIEJA está
 * archivada; Ana es un deudor. LPA = 1.000 − 300 = 700.
 */
function base(): Hechos {
  const vacio = Object.fromEntries(
    ['cuentas', 'tarjetas', 'prestamos', 'inversiones', 'asignaciones', 'transacciones']
      .concat(['efectos', 'lineas', 'condonaciones', 'metas', 'programadas', 'programada_lineas'])
      .concat(['ocurrencias_resueltas', 'conciliaciones'])
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
    deudores: [{ id: id('ana'), nombre: 'Ana', revision: null }],
  } as unknown as Hechos;
  return hechos(
    h,
    cuenta('E', 'efectivo', 1000),
    cuenta('E2', 'efectivo', 0, f('2027-02-10')),
    cuenta('T', 'tarjeta', 0, ENE, tarjeta),
    cuenta('U', 'tarjeta', 0, ENE, tarjeta),
    cuenta('L', 'prestamo', 10000, ENE, prestamo),
    cuenta('M', 'prestamo', 2000, ENE, { ...prestamo, modeloCalculo: null }),
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
const PAGO_U = pagoDe(H0, id('U'))?.id as Uuid;

const gasto = (cuentaId: string, total: number, lineas: [number, object][], fecha = MAR) =>
  op({
    operacion: 'OP-20',
    id: id(`g${++comandos}`),
    cuentaId: id(cuentaId),
    fecha,
    total: c(total),
    lineas: lineas.map(([m, destino]) => ({ monto: c(m), destino })),
  });
const SUPER = { categoriaId: id('SUPER') };
const pagar = (origenId: string, tarjetaId: string, total: number, fecha = MAR) =>
  op({ operacion: 'OP-23', id: id(`p${++comandos}`), origenId, tarjetaId, total: c(total), fecha });
const cuota = (origenId: string, d: [number, number, number], extra: object = {}) =>
  op({
    operacion: 'OP-24',
    id: id(`q${++comandos}`),
    modalidad: 'cuota',
    origenId,
    prestamoId: 'L',
    categoriaId: 'SUPER',
    total: c(d[0] + d[1] + d[2]),
    capital: c(d[0]),
    interes: c(d[1]),
    seguro: c(d[2]),
    ...extra,
  });
const tarjetaSin = (modalidad: string, total: number, extra: object = {}) =>
  op({
    operacion: 'OP-27',
    id: id(`m${++comandos}`),
    modalidad,
    tarjetaId: 'T',
    total: c(total),
    ...extra,
  });

describe('PRU-DOM-TX-101: aplicar, registrar transacciones (01 §5.4, 04 §3.4)', () => {
  it('PRU-DOM-TX-101 [INV-06, INV-07, INV-08, CB-28] OP-20 BE-31: un gasto con tarjeta crea la transacción (PT), −total en la cuenta y sus líneas en orden; deudorNuevo reutiliza el nombre sin mayúsculas o crea el deudor', () => {
    const x = gasto('T', 100, [
      [60, SUPER],
      [30, { deudorNuevo: 'ana' }],
      [10, { deudorNuevo: 'Beto' }],
    ]);
    const r = exito(aplicarEn(H0, { ...x, comercio: 'Super', nota: 'n' } as ComandoDominio));
    const tx = (x as { id: Uuid }).id;
    const [k] = [comandos];
    expect(r.cambios).toEqual([
      {
        tipo: 'insertar',
        tabla: 'deudores',
        fila: { id: `n${k}.1`, nombre: 'Beto', revision: null },
      },
      {
        tipo: 'insertar',
        tabla: 'transacciones',
        fila: {
          id: tx,
          tipo: 'gasto',
          fecha: MAR,
          horaRegistro: INSTANTE,
          claveOrden: INSTANTE,
          secuencia: null,
          origen: 'manual',
          estadoBancario: 'pendiente',
          conciliacionId: null,
          comercio: 'Super',
          nota: 'n',
          total: c(100),
          monedaOriginal: null,
          montoOriginal: null,
          lineaCobradaId: null,
          revision: null,
        },
      },
      {
        tipo: 'insertar',
        tabla: 'efectos',
        fila: expect.objectContaining({
          cuentaId: 'T',
          monto: c(-100),
          interes: null,
          seguro: null,
        }) as object,
      },
      ...[
        [1, 60, 'SUPER', null],
        [2, 30, null, 'ana'],
        [3, 10, null, `n${k}.1`],
      ].map(([orden, monto, categoriaId, deudorId]) => ({
        tipo: 'insertar',
        tabla: 'lineas',
        fila: expect.objectContaining({
          orden,
          monto: c(monto as number),
          categoriaId,
          deudorId,
          lineaOriginalId: null,
        }) as object,
      })),
    ]);
    // inv. 7: la línea no tiene fecha; su período es el de la transacción.
    expect(r.hechosNuevos.lineas.every((l) => !('fecha' in l))).toBe(true);
    expect(saldo(r.hechosNuevos, id('T'))).toBe(c(-100));
    // Importada: confirmada (03 §4.6.2).
    const importada = { ...gasto('E', 5, [[5, SUPER]]), origen: 'importada' } as ComandoDominio;
    expect(exito(aplicarEn(H0, importada)).cambios[0]).toMatchObject({
      fila: { estadoBancario: 'confirmada' },
    });
    // CB-28: un monto cero no es un comando válido (MontoTexto > 0).
    expect(() => aplicarEn(H0, gasto('E', 0, [[0, SUPER]]))).toThrow(TypeError);
    expect(() =>
      aplicarEn(
        H0,
        gasto('E', 10, [
          [10, SUPER],
          [0, SUPER],
        ]),
      ),
    ).toThrow(TypeError);
  });

  it('PRU-DOM-TX-101 [INV-06, INV-08, CB-19] OP-20: rechaza líneas que no suman el total, una categoría de pago, archivada o inexistente, un deudor inexistente, una cuenta que no es de efectivo ni tarjeta y una fecha fuera de la apertura a hoy', () => {
    expect(
      rechazos(
        aplicarEn(
          H0,
          gasto('E', 100, [
            [60, SUPER],
            [30, SUPER],
          ]),
        ),
      ),
    ).toEqual(['suma_lineas_distinta']);
    const distinta = aplicarEn(H0, gasto('E', 100, [[60, SUPER]]));
    expect(distinta.ok ? undefined : distinta.rechazos[0]?.datos).toEqual({
      suma: c(60),
      total: c(100),
    });
    expect(rechazos(aplicarEn(H0, gasto('E', 10, [[10, { categoriaId: PAGO_T }]])))).toEqual([
      'categoria_de_pago_no_permitida',
    ]);
    expect(rechazos(aplicarEn(H0, gasto('E', 10, [[10, { categoriaId: id('VIEJA') }]])))).toEqual([
      'categoria_archivada',
    ]);
    expect(rechazos(aplicarEn(H0, gasto('E', 10, [[10, { categoriaId: id('X') }]])))).toEqual([
      'no_encontrado',
    ]);
    expect(rechazos(aplicarEn(H0, gasto('E', 10, [[10, { deudorId: id('X') }]])))).toEqual([
      'no_encontrado',
    ]);
    expect(rechazos(aplicarEn(H0, gasto('L', 10, [[10, SUPER]])))).toEqual([
      'cuenta_tipo_no_valido',
    ]);
    expect(rechazos(aplicarEn(H0, gasto('X', 10, [[10, SUPER]])))).toEqual(['no_encontrado']);
    // CB-19: E2 se abrió el 10 feb.
    expect(rechazos(aplicarEn(H0, gasto('E2', 10, [[10, SUPER]], f('2027-02-09'))))).toEqual([
      'fecha_anterior_a_apertura',
    ]);
    expect(rechazos(aplicarEn(H0, gasto('E', 10, [[10, SUPER]], f('2027-03-16'))))).toEqual([
      'fecha_posterior_a_hoy',
    ]);
  });

  it('PRU-DOM-TX-101 [CB-19, CB-29] OP-21 OP-22: el ingreso suma a la cuenta y a LPA; la transferencia neutral solo mueve saldos entre dos cuentas de efectivo distintas', () => {
    const ingreso = (cuentaId: string, fecha = MAR) =>
      op({ operacion: 'OP-21', id: id(`i${++comandos}`), cuentaId, total: c(250), fecha });
    const r = exito(aplicarEn(H0, ingreso('E')));
    expect(r.cambios.filter((x) => x.tipo === 'insertar' && x.tabla === 'lineas')).toEqual([]);
    expect(saldo(r.hechosNuevos, id('E'))).toBe(c(1250));
    expect(r.impacto.deltaLpa).toBe(c(250));
    expect(r.cambios[0]).toMatchObject({ fila: { tipo: 'ingreso', total: c(250) } });
    expect(rechazos(aplicarEn(H0, ingreso('T')))).toEqual(['cuenta_tipo_no_valido']);
    expect(rechazos(aplicarEn(H0, ingreso('E2', f('2027-01-31'))))).toEqual([
      'fecha_anterior_a_apertura',
    ]);

    const transferir = (origenId: string, destinoId: string, fecha = MAR) =>
      op({
        operacion: 'OP-22',
        id: id(`x${++comandos}`),
        origenId,
        destinoId,
        total: c(400),
        fecha,
      });
    const t = exito(aplicarEn(H0, transferir('E', 'E2')));
    expect(t.cambios[0]).toMatchObject({ fila: { tipo: 'transferencia' } });
    expect([saldo(t.hechosNuevos, id('E')), saldo(t.hechosNuevos, id('E2'))]).toEqual([
      c(600),
      c(400),
    ]);
    expect(t.impacto).toMatchObject({ deltaLpa: 0, deltaDisponible: [], deltaTarjetas: [] });
    expect(rechazos(aplicarEn(H0, transferir('E', 'E')))).toEqual(['cuentas_iguales']);
    expect(rechazos(aplicarEn(H0, transferir('E', 'T')))).toEqual(['cuenta_tipo_no_valido']);
    expect(rechazos(aplicarEn(H0, transferir('T', 'E')))).toEqual(['cuenta_tipo_no_valido']);
    expect(rechazos(aplicarEn(H0, transferir('E', 'E2', f('2027-02-01'))))).toEqual([
      'fecha_anterior_a_apertura',
    ]);
  });

  it('PRU-DOM-TX-101 [AV-10, CB-01, INV-08] OP-23: pagar la tarjeta crea la línea a pago(t); AV-10 si el pago supera lo reservado en el período de la fecha; sin deuda se permite y queda saldo a favor', () => {
    // Una compra cubierta de 300 traslada 300 a pago(T): pagar 300 no avisa.
    const h = hechos(H0, gasto('T', 300, [[300, SUPER]]));
    expect(disp(h, PAGO_T)).toBe(c(300));
    const justo = exito(aplicarEn(h, pagar('E', 'T', 300)));
    expect(justo.cambios[0]).toMatchObject({ fila: { tipo: 'pago_tarjeta', total: c(300) } });
    expect(justo.cambios.slice(1).map((x) => (x.tipo === 'insertar' ? x.fila : x))).toEqual([
      expect.objectContaining({ cuentaId: 'E', monto: c(-300) }),
      expect.objectContaining({ cuentaId: 'T', monto: c(300) }),
      expect.objectContaining({ orden: 1, monto: c(300), categoriaId: PAGO_T, deudorId: null }),
    ]);
    expect(codigos(justo)).not.toContain('AV-10');
    expect(saldo(justo.hechosNuevos, id('T'))).toBe(0);
    // 400: 100 más de lo reservado, AV-10 antes de confirmar; la tarjeta queda con 100 a favor.
    const mas = exito(aplicarEn(h, pagar('E', 'T', 400)));
    expect(mas.avisos.find((a) => a.codigo === 'AV-10')).toEqual({
      codigo: 'AV-10',
      momento: 'antes',
      requiereConfirmacion: true,
      datos: { tarjetaId: 'T', exceso: c(100) },
    });
    expect(saldo(mas.hechosNuevos, id('T'))).toBe(c(100));
    // CB-01: U no tiene deuda ni reserva; el pago se permite, todo es exceso y Disp(pago(U)) < 0.
    const sinDeuda = exito(aplicarEn(H0, pagar('E', 'U', 50)));
    expect(sinDeuda.avisos.find((a) => a.codigo === 'AV-10')?.datos).toEqual({
      tarjetaId: 'U',
      exceso: c(50),
    });
    expect(saldo(sinDeuda.hechosNuevos, id('U'))).toBe(c(50));
    expect(disp(sinDeuda.hechosNuevos, PAGO_U)).toBe(c(-50));
    expect(rechazos(aplicarEn(H0, pagar('E', 'E2', 10)))).toEqual(['cuenta_tipo_no_valido']);
    expect(rechazos(aplicarEn(H0, pagar('T', 'U', 10)))).toEqual(['cuenta_tipo_no_valido']);
  });

  it('PRU-DOM-TX-101 [CB-26, AV-01, AV-10] OP-23: un pago olvidado con fecha en un período cerrado afecta Pago(t) en ese período; el E que aparece reduce LPA', () => {
    const r = exito(aplicarEn(H0, pagar('E', 'U', 80, f('2027-02-10'))));
    expect(codigos(r)).toEqual(expect.arrayContaining(['AV-01', 'AV-10']));
    expect(r.avisos.find((a) => a.codigo === 'AV-01')?.requiereConfirmacion).toBe(true);
    const i = calcular(r.hechosNuevos, HOY);
    const feb = i.presupuesto.celdas.find(
      (y) => y.categoriaId === PAGO_U && y.periodo.inicio === FEB,
    );
    expect(feb?.disponible).toBe(c(-80));
    expect(i.lpa.pagosExcedentes).toBe(c(80));
    // El efectivo baja 80 y LPA baja los mismos 80 por el E de febrero.
    expect(r.impacto.deltaLpa).toBe(c(-80));
    expect(lpa(r.hechosNuevos)).toBe(c(620));
  });

  it('PRU-DOM-TX-101 [CB-07, INV-06] OP-24: la cuota usa el desglose propuesto del modelo, confirmado por el usuario; con tarjeta es un consumo con tarjeta en la categoría (D2 y traslado); el abono baja el capital por el total', () => {
    const i = calcular(H0, HOY);
    const propuesto = desglosePropuesto(i, id('L'));
    // Cuota 1 (Anexo A.2): interés 10.000 × 12 % × 31/365 = 101,92; seguro 10; capital 500 − 111,92.
    expect(propuesto).toEqual({ numero: 1, interes: c(101.92), seguro: c(10), capital: c(388.08) });
    expect(desglosePropuesto(i, id('L'), 2)?.numero).toBe(2);
    expect(desglosePropuesto(i, id('M'))).toBeNull();
    expect(desglosePropuesto(i, id('X'))).toBeNull();

    const r = exito(aplicarEn(H0, cuota('E', [388.08, 101.92, 10])));
    expect(r.cambios.map((x) => (x.tipo === 'insertar' ? x.fila : x))).toEqual([
      expect.objectContaining({ tipo: 'cuota_prestamo', total: c(500) }),
      expect.objectContaining({ cuentaId: 'E', monto: c(-500), interes: null, seguro: null }),
      expect.objectContaining({
        cuentaId: 'L',
        monto: c(-388.08),
        interes: c(101.92),
        seguro: c(10),
      }),
      expect.objectContaining({ orden: 1, monto: c(500), categoriaId: 'SUPER', deudorId: null }),
    ]);
    expect(capitalPendiente(r.hechosNuevos, id('L'))).toBe(c(9611.92));
    // Pagada el 2 feb (cuota 1 vence el 1 feb, regla 7), la propuesta pasa a la cuota 2.
    const feb = hechos(H0, cuota('E', [388.08, 101.92, 10], { fecha: f('2027-02-02') }));
    expect(desglosePropuesto(calcular(feb, HOY), id('L'))?.numero).toBe(2);

    // CB-07: con T, la cuota de 500 consume SUPER (300 cubiertos) y traslada lo cubierto a pago(T).
    const t = exito(aplicarEn(H0, cuota('T', [388.08, 101.92, 10])));
    expect(saldo(t.hechosNuevos, id('T'))).toBe(c(-500));
    expect(disp(t.hechosNuevos, PAGO_T)).toBe(c(300));
    expect(s(t.hechosNuevos, 'T')).toBe(c(200));

    const abono = exito(aplicarEn(H0, cuota('E', [1000, 0, 0], { modalidad: 'abono' })));
    expect(abono.cambios[0]).toMatchObject({ fila: { tipo: 'abono_capital' } });
    expect(abono.cambios[2]).toMatchObject({
      fila: { cuentaId: 'L', monto: c(-1000), interes: null, seguro: null },
    });
    expect(capitalPendiente(abono.hechosNuevos, id('L'))).toBe(c(9000));
  });

  it('PRU-DOM-TX-101 [INV-08] OP-24: rechaza un desglose que no cuadra, capital mayor que el pendiente, una categoría de pago, un préstamo que no lo es y un origen que no es efectivo ni tarjeta', () => {
    const mal = {
      ...(cuota('E', [388.08, 101.92, 10]) as object),
      total: c(501),
    } as ComandoDominio;
    const r = aplicarEn(H0, mal);
    expect(r.ok ? undefined : r.rechazos[0]).toEqual({
      codigo: 'desglose_no_cuadra',
      datos: { suma: c(500), total: c(501) },
    });
    expect(aplicarEn(H0, cuota('E', [10000.01, 0, 0], { modalidad: 'abono' }))).toEqual({
      ok: false,
      rechazos: [
        {
          codigo: 'capital_mayor_que_pendiente',
          datos: { capital: c(10000.01), pendiente: c(10000) },
        },
      ],
    });
    expect(rechazos(aplicarEn(H0, cuota('E', [100, 0, 0], { categoriaId: PAGO_T })))).toEqual([
      'categoria_de_pago_no_permitida',
    ]);
    expect(rechazos(aplicarEn(H0, cuota('E', [100, 0, 0], { categoriaId: 'VIEJA' })))).toEqual([
      'categoria_archivada',
    ]);
    expect(rechazos(aplicarEn(H0, cuota('E', [100, 0, 0], { prestamoId: 'E2' })))).toEqual([
      'cuenta_tipo_no_valido',
    ]);
    expect(rechazos(aplicarEn(H0, cuota('M', [100, 0, 0])))).toEqual(['cuenta_tipo_no_valido']);
    // Un componente negativo, o interés en un abono, no son un comando válido.
    expect(() => aplicarEn(H0, cuota('E', [110, -10, 0]))).toThrow(TypeError);
    expect(() => aplicarEn(H0, cuota('E', [90, 10, 0], { modalidad: 'abono' }))).toThrow(TypeError);
  });

  it('PRU-DOM-TX-101 [AV-24, CB-29] OP-27: el avance entra a LPA y sube S(t); la entrada a la tarjeta baja la deuda sin tocar LPA; la transferencia de deuda mueve S entre las dos tarjetas con AV-24', () => {
    const avance = exito(aplicarEn(H0, tarjetaSin('avance', 200, { cuentaId: 'E' })));
    expect(avance.cambios[0]).toMatchObject({ fila: { tipo: 'avance_efectivo' } });
    expect([saldo(avance.hechosNuevos, id('T')), saldo(avance.hechosNuevos, id('E'))]).toEqual([
      c(-200),
      c(1200),
    ]);
    expect(avance.impacto.deltaLpa).toBe(c(200));
    expect(s(avance.hechosNuevos, 'T')).toBe(c(200));

    const conDeuda = hechos(H0, gasto('T', 300, [[300, SUPER]]), gasto('U', 50, [[50, SUPER]]));
    const entrada = exito(aplicarEn(conDeuda, tarjetaSin('entrada', 40)));
    expect(entrada.cambios[0]).toMatchObject({ fila: { tipo: 'entrada_tarjeta' } });
    expect(entrada.cambios.slice(1)).toEqual([
      {
        tipo: 'insertar',
        tabla: 'efectos',
        fila: expect.objectContaining({ cuentaId: 'T', monto: c(40) }) as object,
      },
    ]);
    expect(entrada.impacto.deltaLpa).toBe(0);
    // Deuda 260 con 300 reservados: RE(T) = 40.
    expect(
      calcular(entrada.hechosNuevos, HOY).tarjetas.find((x) => x.tarjetaId === 'T')
        ?.reservaExcedente,
    ).toBe(c(40));

    // T debe 300 (300 reservados) y U debe 50 sin reserva: pasar 100 de T a U.
    const tr = exito(
      aplicarEn(conDeuda, tarjetaSin('transferencia_deuda', 100, { tarjetaDestinoId: 'U' })),
    );
    expect(tr.cambios.slice(1).map((x) => (x.tipo === 'insertar' ? x.fila : x))).toEqual([
      expect.objectContaining({ cuentaId: 'U', monto: c(-100) }),
      expect.objectContaining({ cuentaId: 'T', monto: c(100) }),
    ]);
    expect(tr.impacto.deltaLpa).toBe(0);
    const datos = { origenId: 'T', destinoId: 'U', origenAntes: c(0), origenDespues: c(0) };
    expect(tr.avisos.find((a) => a.codigo === 'AV-24')).toEqual({
      codigo: 'AV-24',
      momento: 'despues',
      requiereConfirmacion: false,
      datos: { ...datos, destinoAntes: c(50), destinoDespues: c(150) },
    });
    expect([s(tr.hechosNuevos, 'T'), s(tr.hechosNuevos, 'U')]).toEqual([c(0), c(150)]);
    // Al revés, U → T: T pasa de 0 a 0 (le sobran 300 reservados para 400) y U de 50 a 0.
    const vuelta = {
      ...(tarjetaSin('transferencia_deuda', 50, { tarjetaDestinoId: 'T' }) as object),
      tarjetaId: 'U',
    };
    const v = exito(aplicarEn(conDeuda, vuelta as ComandoDominio));
    expect(v.avisos.find((a) => a.codigo === 'AV-24')?.datos).toMatchObject({
      destinoDespues: c(50),
      origenDespues: c(0),
    });
    expect([s(v.hechosNuevos, 'U'), s(v.hechosNuevos, 'T')]).toEqual([c(0), c(50)]);

    expect(
      rechazos(aplicarEn(H0, tarjetaSin('transferencia_deuda', 10, { tarjetaDestinoId: 'T' }))),
    ).toEqual(['cuentas_iguales']);
    expect(
      rechazos(aplicarEn(H0, tarjetaSin('transferencia_deuda', 10, { tarjetaDestinoId: 'E' }))),
    ).toEqual(['cuenta_tipo_no_valido']);
    expect(rechazos(aplicarEn(H0, tarjetaSin('avance', 10, { cuentaId: 'U' })))).toEqual([
      'cuenta_tipo_no_valido',
    ]);
    expect(
      rechazos(
        aplicarEn(H0, {
          ...(tarjetaSin('entrada', 10) as object),
          tarjetaId: 'E',
        } as ComandoDominio),
      ),
    ).toEqual(['cuenta_tipo_no_valido']);
  });
});

// ── PRU-DOM-TX-102: editar, eliminar y estado bancario (OP-28 a OP-30) ──
const INSTANTE2 = '2027-03-15T16:00:00.000Z' as Instante;
const OCIO = id('OCIO');
const H1 = hechos(
  H0,
  { operacion: 'OP-07', id: OCIO, tipo: 'categoria', nombre: 'Ocio', grupoId: id('A') },
  cuenta('E3', 'efectivo', 0),
  cuenta('E4', 'efectivo', 0),
  { operacion: 'OP-04', cuentaId: id('E4') },
);
/** G: un gasto de 100 en E el 10 mar, 60 a SUPER (L1) y 40 por cobrar a Ana (L2). */
const G = id('G');
const conG = hechos(H1, {
  ...(gasto('E', 100, [
    [60, SUPER],
    [40, { deudorId: id('ana') }],
  ]) as object),
  id: G,
  comercio: 'Super',
} as ComandoDominio);
const lineasDe = (h: Hechos, t: Uuid) =>
  h.lineas.filter((l) => l.transaccionId === t).sort((a, b) => a.orden - b.orden);
const [L1, L2] = lineasDe(conG, G).map((l) => l.id) as [Uuid, Uuid];
const EFECTO_G = conG.efectos.find((e) => e.transaccionId === G)?.id as Uuid;

const editar = (transaccionId: string, x: object = {}, instante = INSTANTE2) =>
  ({
    operacion: 'OP-28',
    transaccionId,
    instante,
    ids: contador(),
    ...x,
  }) as unknown as ComandoDominio;
const eliminar = (transaccionId: string, movimientos: object[] = []) =>
  ({
    operacion: 'OP-29',
    transaccionId,
    instante: INSTANTE2,
    ids: contador(),
    movimientos,
  }) as unknown as ComandoDominio;
const marcar = (transaccionId: string, estadoNuevo: string) =>
  ({ operacion: 'OP-30', transaccionId, estadoNuevo }) as unknown as ComandoDominio;
const lineas = (...xs: [string | undefined, number, object?][]) =>
  xs.map(([lineaId, monto, destino]) => ({
    ...(lineaId !== undefined && { lineaId }),
    monto: c(monto),
    ...(destino && { destino }),
  }));

/** Una transacción escrita a mano (los eventos llegan con TA-119 y la conciliación con OP-47). */
const fila = (t: string, tipo: string, fecha: FechaLocal, total: number, extra = {}) => ({
  ...{ id: id(t), tipo, fecha, horaRegistro: INSTANTE, claveOrden: INSTANTE, secuencia: null },
  ...{ origen: 'manual', estadoBancario: 'pendiente', conciliacionId: null, comercio: null },
  ...{ nota: null, total: c(total), monedaOriginal: null, montoOriginal: null },
  ...{ lineaCobradaId: null, revision: null, ...extra },
});
const efectoDe = (t: string, cuentaId: string, monto: number) => ({
  ...{ id: id(`${t}.e`), transaccionId: id(t), cuentaId: id(cuentaId), monto: c(monto) },
  ...{ interes: null, seguro: null, revision: null },
});
const con = (h: Hechos, x: Readonly<Record<string, readonly object[]>>): Hechos =>
  Object.fromEntries(
    Object.entries(h).map(([k, v]) => [k, [...(v as object[]), ...(x[k] ?? [])]]),
  ) as unknown as Hechos;
/** Un cobro de `monto` sobre L2, depositado en E. */
const cobrar = (h: Hechos, monto: number, fecha = MAR) =>
  con(h, {
    transacciones: [fila('CB', 'cobro', fecha, monto, { lineaCobradaId: L2 })],
    efectos: [efectoDe('CB', 'E', monto)],
  });
/** Una devolución vinculada de `monto` sobre L1, a E. */
const devolver = (h: Hechos, monto: number, fecha = MAR) =>
  con(h, {
    transacciones: [fila('DV', 'devolucion', fecha, monto)],
    efectos: [efectoDe('DV', 'E', monto)],
    lineas: [
      {
        ...{ id: id('DV.1'), transaccionId: id('DV'), orden: 1, monto: c(monto) },
        ...{ categoriaId: id('SUPER'), deudorId: null, lineaOriginalId: L1, revision: null },
      },
    ],
  });
/** Una condonación de `monto` sobre L2. */
const condonar = (h: Hechos, monto: number) =>
  con(h, {
    condonaciones: [
      {
        ...{ id: id('K'), lineaId: L2, fecha: MAR, monto: c(monto), claveOrden: INSTANTE },
        ...{ secuencia: null, categoriaId: id('SUPER'), revision: null },
      },
    ],
  });
/** La transacción `t` queda conciliada en la conciliación `cc` de la cuenta. */
const conciliar = (h: Hechos, t: Uuid, cuentaId = 'E'): Hechos => {
  const cc = {
    ...{ id: id('cc'), cuentaId: id(cuentaId), fechaEstado: MAR, saldoEstado: c(0) },
    ...{ terminadaEn: INSTANTE, diferenciaAceptada: c(0), revision: null },
  };
  const estado = { estadoBancario: 'conciliada', conciliacionId: id('cc') } as const;
  return {
    ...con(h, { conciliaciones: [cc] }),
    transacciones: h.transacciones.map((x) => (x.id === t ? { ...x, ...estado } : x)),
  };
};
const av16 = (transaccionId: string = G) => ({
  codigo: 'AV-16',
  momento: 'antes',
  requiereConfirmacion: true,
  datos: { transaccionId },
});
const pc = (motivos: string[], transaccionId: Uuid | null = G) => ({
  tipo: 'insertar',
  tabla: 'cambios_posteriores',
  fila: {
    ...{ id: expect.any(String) as string, conciliacionId: 'cc', transaccionId },
    ...{ registradoEn: INSTANTE2, motivos, fecha: MAR, montoEfecto: c(-100), comercio: 'Super' },
  },
});
const aConfirmada = { estadoBancario: 'confirmada', conciliacionId: null };
const deTabla = (r: ResultadoAplicar, tabla: string) =>
  exito(r).cambios.filter((x) => x.tipo !== 'eliminarConciliacionesDeCuenta' && x.tabla === tabla);
const insertadas = (r: ResultadoAplicar) =>
  deTabla(r, 'lineas').flatMap((x) => (x.tipo === 'insertar' ? [x.fila] : []));
const primero = (r: ResultadoAplicar) => (r.ok ? undefined : r.rechazos[0]);

describe('PRU-DOM-TX-102: aplicar, editar, eliminar y estado bancario (01 §5.4, §7.2; 04 §3.4)', () => {
  it('PRU-DOM-TX-102 [INV-06, AV-16] OP-28 BE-16: total y líneas; Σ líneas = total, una línea sin eventos que cambia se reemplaza con un orden nuevo y la única línea sigue al total; una conciliada que cambia de total pasa a confirmada con un cambio posterior', () => {
    const x = editar(G, { total: c(120), lineas: lineas([L1, 80], [L2, 40]) });
    const r = exito(aplicarEn(conG, x));
    expect(r.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'transacciones', id: G, campos: { total: c(120) } },
      { tipo: 'actualizar', tabla: 'efectos', id: EFECTO_G, campos: { monto: c(-120) } },
      { tipo: 'eliminar', tabla: 'lineas', id: L1 },
      {
        tipo: 'insertar',
        tabla: 'lineas',
        fila: {
          ...{ id: `n${comandos}.1`, transaccionId: G, orden: 3, monto: c(80) },
          ...{ categoriaId: 'SUPER', deudorId: null, lineaOriginalId: null, revision: null },
        },
      },
    ]);
    expect(saldo(r.hechosNuevos, id('E'))).toBe(c(880));
    expect(disp(r.hechosNuevos, id('SUPER'))).toBe(c(220));
    expect(codigos(r)).not.toContain('AV-16');
    // Una línea nueva con su destino (un deudor nuevo), al final.
    const mas = lineas([L1, 60], [L2, 40], [undefined, 20, { deudorNuevo: 'Beto' }]);
    const n = aplicarEn(conG, editar(G, { total: c(120), lineas: mas }));
    expect(insertadas(n)).toEqual([expect.objectContaining({ orden: 3, monto: c(20) })]);
    expect(exito(n).hechosNuevos.deudores.map((d) => d.nombre)).toContain('Beto');
    // Una sola línea sigue al total sin pedirla.
    const uno = { ...(gasto('E', 50, [[50, SUPER]]) as object), id: id('S1') } as ComandoDominio;
    const u = aplicarEn(hechos(conG, uno), editar('S1', { total: c(70) }));
    expect(insertadas(u)).toEqual([
      expect.objectContaining({ monto: c(70), categoriaId: 'SUPER' }),
    ]);
    expect(primero(aplicarEn(conG, editar(G, { total: c(120) })))).toEqual({
      codigo: 'suma_lineas_distinta',
      datos: { suma: c(100), total: c(120) },
    });
    const malas = [
      lineas([L1, 60], [undefined, 40]), // línea nueva sin destino
      lineas([L1, 100], [L2, 0]), // monto cero (CB-28)
      lineas([L1, 60], ['X', 40]), // línea de otra transacción
      lineas([L1, 60], [L1, 40]), // repetida
    ];
    for (const m of malas)
      expect(() => aplicarEn(conG, editar(G, { total: c(100), lineas: m }))).toThrow(TypeError);
    expect(() => aplicarEn(conG, editar(G, { total: c(0) }))).toThrow(TypeError);
    expect(rechazos(aplicarEn(conG, editar('X')))).toEqual(['no_encontrado']);

    // Conciliada: cambia el total → confirmada, cambio posterior con la foto conciliada y AV-16.
    const k = exito(aplicarEn(conciliar(conG, G), x));
    expect(k.cambios[0]).toEqual({
      tipo: 'actualizar',
      tabla: 'transacciones',
      id: G,
      campos: { total: c(120), ...aConfirmada },
    });
    expect(k.cambios.at(-1)).toEqual(pc(['monto']));
    expect(k.avisos).toContainEqual(av16());
    // Líneas sin cambio de total: sigue conciliada (§7.2).
    const reparto = aplicarEn(
      conciliar(conG, G),
      editar(G, { lineas: lineas([L1, 50], [L2, 50]) }),
    );
    expect(deTabla(reparto, 'transacciones')).toEqual([]);
    expect(deTabla(reparto, 'cambios_posteriores')).toEqual([]);
    expect(exito(reparto).avisos).toContainEqual(av16());
  });

  it('PRU-DOM-TX-102 [CB-03, INV-09, INV-10] OP-28 BE-16: una línea no baja de lo ya cobrado, condonado o devuelto, ni desaparece ni cambia de destino si tiene eventos; con eventos conserva su fila', () => {
    const hc = cobrar(conG, 30);
    const bajar = (l: Uuid, a: number, otra: number, total: number) =>
      editar(G, {
        total: c(total),
        lineas: l === L1 ? lineas([L1, a], [L2, otra]) : lineas([L1, otra], [L2, a]),
      });
    expect(primero(aplicarEn(hc, bajar(L2, 25, 60, 85)))).toEqual({
      codigo: 'linea_menor_que_eventos',
      datos: { lineaId: L2, resuelto: c(30) },
    });
    // Cobrado 30 y condonado 10: 39 ya es menos que lo resuelto.
    expect(primero(aplicarEn(condonar(hc, 10), bajar(L2, 39, 60, 99)))).toEqual({
      codigo: 'linea_menor_que_eventos',
      datos: { lineaId: L2, resuelto: c(40) },
    });
    // Devuelto 20 sobre L1.
    expect(primero(aplicarEn(devolver(conG, 20), bajar(L1, 15, 40, 55)))).toEqual({
      codigo: 'linea_menor_que_eventos',
      datos: { lineaId: L1, resuelto: c(20) },
    });
    // Quitar la línea con el cobro equivale a bajarla a cero.
    expect(rechazos(aplicarEn(hc, editar(G, { total: c(60), lineas: lineas([L1, 60]) })))).toEqual([
      'linea_menor_que_eventos',
    ]);
    // Con eventos no pasa de por cobrar a categoría ni de deudor.
    for (const destino of [SUPER, { deudorNuevo: 'Beto' }])
      expect(
        rechazos(aplicarEn(hc, editar(G, { lineas: lineas([L1, 60], [L2, 40, destino]) }))),
      ).toEqual(['linea_con_eventos_cambio_destino']);
    // 35 ≥ 30: se permite y la línea conserva su id y su orden (F4).
    const r = aplicarEn(hc, bajar(L2, 35, 60, 95));
    expect(deTabla(r, 'lineas')).toEqual([
      { tipo: 'actualizar', tabla: 'lineas', id: L2, campos: { monto: c(35) } },
    ]);
    expect(lineasDe(exito(r).hechosNuevos, G).map((l) => [l.id, l.orden])).toEqual([
      [L1, 1],
      [L2, 2],
    ]);
  });

  it('PRU-DOM-TX-102 [AV-01, AV-16, INV-12] OP-28 fecha: la clave de orden pasa al instante del cambio (supuesto 5; al menos la anterior + 1 ms); ningún evento queda antes de la compra; una conciliada pasa a confirmada', () => {
    const r = exito(aplicarEn(conG, editar(G, { fecha: f('2027-03-12') })));
    expect(r.cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'transacciones',
        id: G,
        campos: { fecha: f('2027-03-12'), claveOrden: INSTANTE2 },
      },
    ]);
    const temprano = '2027-03-15T14:00:00.000Z' as Instante;
    expect(
      exito(aplicarEn(conG, editar(G, { fecha: f('2027-03-12') }, temprano))).cambios[0],
    ).toMatchObject({
      campos: { claveOrden: '2027-03-15T15:00:00.001Z' },
    });
    // A febrero (cerrado): se recalculan ambos períodos (I6) y AV-01.
    const feb = exito(aplicarEn(conG, editar(G, { fecha: f('2027-02-10') })));
    expect(codigos(feb)).toContain('AV-01');
    expect(disp(feb.hechosNuevos, id('SUPER'))).toBe(c(300));
    expect(rechazos(aplicarEn(conG, editar(G, { fecha: f('2027-03-16') })))).toEqual([
      'fecha_posterior_a_hoy',
    ]);
    // Un cobro del 11 mar: la compra puede pasar al 11, no al 12.
    const hc = cobrar(conG, 30, f('2027-03-11'));
    expect(primero(aplicarEn(hc, editar(G, { fecha: f('2027-03-12') })))).toEqual({
      codigo: 'fecha_posterior_a_eventos',
      datos: { fecha: f('2027-03-11') },
    });
    expect(aplicarEn(hc, editar(G, { fecha: f('2027-03-11') })).ok).toBe(true);
    const k = exito(aplicarEn(conciliar(conG, G), editar(G, { fecha: f('2027-03-12') })));
    expect(k.cambios[0]).toMatchObject({ campos: aConfirmada });
    expect(k.cambios.at(-1)).toEqual(pc(['fecha']));
    expect(k.avisos).toContainEqual(av16());
  });

  it('PRU-DOM-TX-102 [CB-30, CB-19, CB-29, AV-16] OP-28 cuenta: el gasto pasa de efectivo a tarjeta; la cuenta nueva es compatible, abierta y sin devoluciones; una conciliada pasa a confirmada con un cambio posterior', () => {
    const r = exito(aplicarEn(conG, editar(G, { cuentaId: 'T' })));
    expect(r.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'efectos', id: EFECTO_G, campos: { cuentaId: 'T' } },
    ]);
    expect([saldo(r.hechosNuevos, id('E')), saldo(r.hechosNuevos, id('T'))]).toEqual([
      c(1000),
      c(-100),
    ]);
    // C1, D2 y H3: los 60 cubiertos de SUPER pasan a pago(T).
    expect(disp(r.hechosNuevos, PAGO_T)).toBe(c(60));
    expect(rechazos(aplicarEn(conG, editar(G, { cuentaId: 'L' })))).toEqual([
      'cambio_tipo_de_cuenta_incompatible',
    ]);
    expect(rechazos(aplicarEn(conG, editar(G, { cuentaId: 'E4' })))).toEqual(['cuenta_archivada']);
    expect(rechazos(aplicarEn(conG, editar(G, { cuentaId: 'X' })))).toEqual(['no_encontrado']);
    expect(rechazos(aplicarEn(devolver(conG, 20), editar(G, { cuentaId: 'T' })))).toEqual([
      'cambio_cuenta_con_devoluciones',
    ]);
    const viejo = { ...(gasto('E', 10, [[10, SUPER]], f('2027-02-05')) as object), id: id('G2') };
    expect(
      rechazos(aplicarEn(hechos(conG, viejo as ComandoDominio), editar('G2', { cuentaId: 'E2' }))),
    ).toEqual(['fecha_anterior_a_apertura']);

    // Transferencia E → E2: origen (efecto −) y destino (efecto +).
    const tr = op({
      operacion: 'OP-22',
      id: id('TR'),
      origenId: 'E',
      destinoId: 'E2',
      total: c(400),
    });
    const ht = hechos(conG, tr);
    const a3 = exito(aplicarEn(ht, editar('TR', { destinoId: 'E3' })));
    expect([saldo(a3.hechosNuevos, id('E2')), saldo(a3.hechosNuevos, id('E3'))]).toEqual([
      0,
      c(400),
    ]);
    expect(rechazos(aplicarEn(ht, editar('TR', { origenId: 'T' })))).toEqual([
      'cambio_tipo_de_cuenta_incompatible',
    ]);
    expect(rechazos(aplicarEn(ht, editar('TR', { destinoId: 'E' })))).toEqual(['cuentas_iguales']);
    expect(() => aplicarEn(ht, editar('TR', { cuentaId: 'E3' }))).toThrow(TypeError);
    expect(() => aplicarEn(conG, editar(G, { destinoId: 'E3' }))).toThrow(TypeError);
    // Un pago a otra tarjeta lleva su línea a pago(U).
    const hp = hechos(conG, { ...(pagar('E', 'T', 50) as object), id: id('PG') } as ComandoDominio);
    const p = aplicarEn(hp, editar('PG', { destinoId: 'U' }));
    expect(insertadas(p)).toEqual([expect.objectContaining({ monto: c(50), categoriaId: PAGO_U })]);
    expect(saldo(exito(p).hechosNuevos, id('U'))).toBe(c(50));

    // CB-30: conciliada en E; cambia la cuenta → confirmada y cambio posterior por cuenta.
    const k = exito(aplicarEn(conciliar(conG, G), editar(G, { cuentaId: 'T' })));
    expect(k.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'transacciones', id: G, campos: aConfirmada },
      { tipo: 'actualizar', tabla: 'efectos', id: EFECTO_G, campos: { cuentaId: 'T' } },
      pc(['cuenta']),
    ]);
    expect(k.avisos).toContainEqual(av16());
    // Conciliada en E y cambia el destino: el efecto conciliado no cambia y sigue conciliada.
    const kt = aplicarEn(conciliar(ht, id('TR')), editar('TR', { destinoId: 'E3' }));
    expect(exito(kt).cambios.map((x) => x.tipo)).toEqual(['actualizar']);
    expect(deTabla(kt, 'efectos')).toHaveLength(1);
    expect(exito(kt).avisos).toContainEqual(av16('TR'));
  });

  it('PRU-DOM-TX-102 [AV-16, INV-08, INV-20] OP-28 categoría de una línea: recalcula ambas categorías y no rompe la conciliación (P12); las devoluciones vinculadas cambian de categoría con ella', () => {
    const x = editar(G, { lineas: lineas([L1, 60, { categoriaId: OCIO }], [L2, 40]) });
    const r = aplicarEn(conG, x);
    expect(deTabla(r, 'transacciones')).toEqual([]);
    expect(insertadas(r)).toEqual([
      expect.objectContaining({ orden: 3, monto: c(60), categoriaId: OCIO }),
    ]);
    expect([disp(exito(r).hechosNuevos, id('SUPER')), disp(exito(r).hechosNuevos, OCIO)]).toEqual([
      c(300),
      c(-60),
    ]);
    const k = aplicarEn(conciliar(conG, G), x);
    expect(deTabla(k, 'cambios_posteriores')).toEqual([]);
    expect(exito(k).hechosNuevos.transacciones.find((t) => t.id === G)?.estadoBancario).toBe(
      'conciliada',
    );
    expect(exito(k).avisos).toContainEqual(av16());
    // Con una devolución, la línea conserva su fila y la devolución la sigue.
    expect(deTabla(aplicarEn(devolver(conG, 20), x), 'lineas')).toEqual([
      { tipo: 'actualizar', tabla: 'lineas', id: L1, campos: { categoriaId: OCIO } },
      { tipo: 'actualizar', tabla: 'lineas', id: 'DV.1', campos: { categoriaId: OCIO } },
    ]);
    const a = (categoriaId: Uuid) =>
      editar(G, { lineas: lineas([L1, 60, { categoriaId }], [L2, 40]) });
    expect(rechazos(aplicarEn(conG, a(PAGO_T)))).toEqual(['categoria_de_pago_no_permitida']);
    expect(rechazos(aplicarEn(conG, a(id('VIEJA'))))).toEqual(['categoria_archivada']);
  });

  it('PRU-DOM-TX-102 [CB-24, AV-16] OP-28 comercio, nota y moneda original: sin efectos de cálculo; en una cuenta archivada solo se permite lo que no cambia su saldo', () => {
    const campos = { comercio: 'Otro', nota: 'n', monedaOriginal: 'USD', montoOriginal: '2.50' };
    const r = exito(aplicarEn(conG, editar(G, campos)));
    expect(r.cambios).toEqual([{ tipo: 'actualizar', tabla: 'transacciones', id: G, campos }]);
    expect(r.impacto).toMatchObject({ deltaLpa: 0, deltaDisponible: [], deltaTarjetas: [] });
    expect(exito(aplicarEn(conG, editar(G, { comercio: 'Super' }))).cambios).toEqual([]);
    expect(() => aplicarEn(conG, editar(G, { monedaOriginal: 'USD' }))).toThrow(TypeError);
    const k = exito(aplicarEn(conciliar(conG, G), editar(G, { nota: 'n' })));
    expect(k.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'transacciones', id: G, campos: { nota: 'n' } },
    ]);
    expect(k.avisos).toContainEqual(av16());

    // CB-24: E5 recibe 50, gasta 50 (saldo 0) y se archiva.
    const ingreso = op({ operacion: 'OP-21', id: id('I5'), cuentaId: 'E5', total: c(50) });
    const ga = { ...(gasto('E5', 50, [[50, SUPER]]) as object), id: id('GA') } as ComandoDominio;
    const archivar = { operacion: 'OP-04', cuentaId: id('E5') } as ComandoDominio;
    const ha = hechos(conG, cuenta('E5', 'efectivo', 0), ingreso, ga, archivar);
    const [la] = lineasDe(ha, id('GA')).map((l) => l.id);
    expect(aplicarEn(ha, editar('GA', { nota: 'x' })).ok).toBe(true);
    const otra = editar('GA', { lineas: lineas([la, 50, { categoriaId: OCIO }]) });
    expect(aplicarEn(ha, otra).ok).toBe(true);
    expect(rechazos(aplicarEn(ha, editar('GA', { total: c(40) })))).toEqual(['cuenta_archivada']);
    expect(rechazos(aplicarEn(ha, editar('GA', { cuentaId: 'E' })))).toEqual(['cuenta_archivada']);
    expect(rechazos(aplicarEn(ha, eliminar('GA')))).toEqual(['cuenta_archivada']);
  });

  it('PRU-DOM-TX-102 [INV-06] OP-28 OP-24 desglose de una cuota: cumple las precondiciones de OP-24 y cambia el capital pendiente; el abono sigue al total', () => {
    const q = cuota('E', [388.08, 101.92, 10]);
    const Q = (q as unknown as { id: Uuid }).id;
    const hq = hechos(conG, q);
    const efectoL = hq.efectos.find((e) => e.transaccionId === Q && e.cuentaId === 'L')?.id;
    const d = (capital: number, interes: number, seguro: number) => ({
      desglose: { capital: c(capital), interes: c(interes), seguro: c(seguro) },
    });
    const r = exito(aplicarEn(hq, editar(Q, d(400, 90, 10))));
    expect(r.cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'efectos',
        id: efectoL,
        campos: { monto: c(-400), interes: c(90) },
      },
    ]);
    expect(capitalPendiente(r.hechosNuevos, id('L'))).toBe(c(9600));
    const caro = exito(aplicarEn(hq, editar(Q, { total: c(600), ...d(500, 90, 10) })));
    expect([
      saldo(caro.hechosNuevos, id('E')),
      capitalPendiente(caro.hechosNuevos, id('L')),
    ]).toEqual([c(300), c(9500)]);
    expect(primero(aplicarEn(hq, editar(Q, { total: c(600) })))).toEqual({
      codigo: 'desglose_no_cuadra',
      datos: { suma: c(500), total: c(600) },
    });
    // Pendiente sin esta cuota: 10.000.
    expect(primero(aplicarEn(hq, editar(Q, { total: c(10000.01), ...d(10000.01, 0, 0) })))).toEqual(
      {
        codigo: 'capital_mayor_que_pendiente',
        datos: { capital: c(10000.01), pendiente: c(10000) },
      },
    );
    expect(() => aplicarEn(hq, editar(Q, d(410, -10, 0)))).toThrow(TypeError);
    expect(() => aplicarEn(conG, editar(G, d(100, 0, 0)))).toThrow(TypeError);
    const a = cuota('E', [1000, 0, 0], { modalidad: 'abono' });
    const A = (a as unknown as { id: Uuid }).id;
    const ha = hechos(conG, a);
    expect(
      capitalPendiente(exito(aplicarEn(ha, editar(A, { total: c(1500) }))).hechosNuevos, id('L')),
    ).toBe(c(8500));
    expect(() => aplicarEn(ha, editar(A, d(900, 100, 0)))).toThrow(TypeError);
  });

  it('PRU-DOM-TX-102 [CB-04, AV-01, AV-16] OP-29: elimina la transacción sin eventos; su movimiento queda descartado, la ocurrencia que resolvió vuelve a pendiente y, si estaba conciliada, queda un cambio posterior', () => {
    const r = exito(aplicarEn(conG, eliminar(G)));
    expect(r.cambios).toEqual([{ tipo: 'eliminar', tabla: 'transacciones', id: G }]);
    expect(saldo(r.hechosNuevos, id('E'))).toBe(c(1000));
    expect(r.hechosNuevos.lineas.filter((l) => l.transaccionId === G)).toEqual([]);
    for (const h of [cobrar(conG, 30), devolver(conG, 20), condonar(conG, 10)])
      expect(rechazos(aplicarEn(h, eliminar(G)))).toEqual(['transaccion_con_eventos']);
    const k = exito(aplicarEn(conciliar(conG, G), eliminar(G)));
    expect(k.cambios).toEqual([
      pc(['eliminacion'], null),
      { tipo: 'eliminar', tabla: 'transacciones', id: G },
    ]);
    expect(k.avisos).toContainEqual(av16());
    const mov = (m: string, transaccionId: string) => ({
      ...{ id: id(m), smsId: id('sms'), estado: 'aprobado', cuentaId: id('E'), fecha: MAR },
      ...{ monto: c(100), comercio: null, tipoPropuesto: 'gasto', nota: null },
      ...{ duplicadoTransaccionId: null, duplicadoMovimientoId: null, esperadaProgramadaId: null },
      ...{ esperadaFecha: null, transaccionId: id(transaccionId) },
    });
    const programada = {
      ...{ id: id('PR'), tipo: 'gasto', cuentaId: id('E'), cuentaDestinoId: null, comercio: 'S' },
      ...{ monto: c(100), tolerancia: c(0), frecuencia: 'mensual', frecuenciaDias: null },
      ...{ primeraFecha: MAR, fechaFin: null, registroAutomatico: false, activa: true },
      revision: null,
    };
    const ocurrencia = {
      ...{ id: id('OC'), programadaId: id('PR'), fechaEsperada: MAR, estado: 'registrada' },
      ...{ transaccionId: G, revision: null },
    };
    const ho = con(conG, { programadas: [programada], ocurrencias_resueltas: [ocurrencia] });
    expect(exito(aplicarEn(ho, eliminar(G, [mov('MV', G), mov('MV2', 'otra')]))).cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'movimientos',
        id: 'MV',
        campos: { estado: 'descartado', transaccionId: null },
      },
      { tipo: 'eliminar', tabla: 'ocurrencias_resueltas', id: 'OC' },
      { tipo: 'eliminar', tabla: 'transacciones', id: G },
    ]);
    // Eliminar el saldo inicial equivale a saldo inicial 0.
    const deE = new Set(conG.efectos.filter((e) => e.cuentaId === 'E').map((e) => e.transaccionId));
    const si = conG.transacciones.find((t) => t.tipo === 'saldo_inicial' && deE.has(t.id))?.id;
    const s0 = exito(aplicarEn(conG, eliminar(si as Uuid)));
    expect([saldo(s0.hechosNuevos, id('E')), s0.impacto.deltaLpa]).toEqual([c(-100), c(-1000)]);
    const viejo = { ...(gasto('E', 10, [[10, SUPER]], f('2027-02-05')) as object), id: id('G2') };
    expect(codigos(aplicarEn(hechos(conG, viejo as ComandoDominio), eliminar('G2')))).toContain(
      'AV-01',
    );
    expect(rechazos(aplicarEn(conG, eliminar('X')))).toEqual(['no_encontrado']);
  });

  it('PRU-DOM-TX-102 OP-30: pendiente ↔ confirmada a mano (§7.2) cambia solo el saldo confirmado; a conciliada o desde conciliada, solo la conciliación', () => {
    const r = exito(aplicarEn(conG, marcar(G, 'confirmada')));
    expect(r.cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'transacciones',
        id: G,
        campos: { estadoBancario: 'confirmada' },
      },
    ]);
    expect([saldoConfirmado(conG, id('E')), saldoConfirmado(r.hechosNuevos, id('E'))]).toEqual([
      0,
      c(-100),
    ]);
    expect(r.impacto).toMatchObject({ deltaLpa: 0, deltaDisponible: [], deltaTarjetas: [] });
    expect(exito(aplicarEn(r.hechosNuevos, marcar(G, 'pendiente'))).cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'transacciones',
        id: G,
        campos: { estadoBancario: 'pendiente' },
      },
    ]);
    expect(exito(aplicarEn(conG, marcar(G, 'pendiente'))).cambios).toEqual([]);
    expect(primero(aplicarEn(conciliar(conG, G), marcar(G, 'confirmada')))).toEqual({
      codigo: 'transicion_estado_bancario_invalida',
      datos: { desde: 'conciliada', hacia: 'confirmada' },
    });
    expect(rechazos(aplicarEn(conG, marcar(G, 'conciliada')))).toEqual([
      'transicion_estado_bancario_invalida',
    ]);
    expect(rechazos(aplicarEn(conG, marcar('X', 'confirmada')))).toEqual(['no_encontrado']);
  });
});
