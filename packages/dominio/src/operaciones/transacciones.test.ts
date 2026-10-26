import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { capitalPendiente, saldo } from '../calculo/saldos';
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
