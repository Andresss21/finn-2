import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Cambio,
  ComandoDominio,
  GeneradorIds,
  Hechos,
  Instante,
  Movimiento,
  MovimientoConTexto,
  MovimientoLinea,
  ResultadoAplicar,
  TablaEscribible,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';
import { pagoDe } from './op-01';

// ── PRU-DOM-BAND-102: editar, aprobar y resolver movimientos (OP-36, OP-37, OP-40) ──

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const HOY = f('2027-03-15');
const [ENE, MAR10] = [f('2027-01-01'), f('2027-03-10')];
const INSTANTE = '2027-03-15T15:00:00.000Z' as Instante;
const RECIBIDO = '2027-03-10T13:45:00.000Z' as Instante; // recepción del SMS (D2)

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
const rechazo = (r: ResultadoAplicar) => (r.ok ? undefined : r.rechazos[0]);
const codigo = (r: ResultadoAplicar) => rechazo(r)?.codigo;
const ap = (h: Hechos, x: object) => aplicar(h, x as ComandoDominio, HOY);
/** Los cambios de una tabla, en orden. */
const en = (r: ResultadoAplicar, tabla: TablaEscribible) =>
  exito(r).cambios.filter((x): x is Exclude<Cambio, { tipo: 'eliminarConciliacionesDeCuenta' }> =>
    x.tipo === 'eliminarConciliacionesDeCuenta' ? false : x.tabla === tabla,
  );
const lpa = (h: Hechos) => calcular(h, HOY).lpa.total;
const disp = (h: Hechos, x: string) =>
  calcular(h, HOY).presupuesto.celdas.find(
    (y) => y.categoriaId === x && y.periodo.inicio === f('2027-03-01'),
  )?.disponible;

/**
 * E (efectivo, 1.000), T (tarjeta) y X (efectivo archivado); SUPER con 300 en marzo, CASA y VIEJA
 * (archivada); Ana es deudora. P (gasto mensual de 50 en E desde el 10 ene) ya registró R el 10 mar;
 * Q (50 desde el 12 ene) espera su ocurrencia del 12 mar.
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
  const cuenta = (k: string, tipo: 'efectivo' | 'tarjeta', saldo: number) => ({
    operacion: 'OP-01',
    id: id(k),
    instante: '2027-01-01T12:00:00.000Z' as Instante,
    ids: contador(),
    cuenta: { tipo, nombre: k, institucionId: null, ultimos4: null, fechaApertura: ENE },
    ...(tipo === 'tarjeta' && {
      subtipo: {
        ...{ tipo, limiteCredito: c(5000), tasaAnualMillonesimas: null, diaCorte: 20 },
        ...{ diaPago: 5, red: null, color: null },
      },
    }),
    saldo: c(saldo),
  });
  const programada = (p: string, primeraFecha: string) => ({
    ...{ id: id(p), tipo: 'gasto', cuentaId: id('E'), cuentaDestinoId: null, comercio: p },
    ...{ monto: c(50), tolerancia: c(5), frecuencia: 'mensual', frecuenciaDias: null },
    ...{ primeraFecha: f(primeraFecha), fechaFin: null, registroAutomatico: false },
    ...{ activa: true, revision: null },
  });
  let h = {
    ...vacio,
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    grupos: [grupo('PT', 'pagos_tarjeta'), grupo('A', null)],
    categorias: [categoria('SUPER'), categoria('CASA'), categoria('VIEJA', true)],
    deudores: [{ id: id('ana'), nombre: 'Ana', revision: null }],
    programadas: [programada('P', '2027-01-10'), programada('Q', '2027-01-12')],
  } as unknown as Hechos;
  const pasos = [
    cuenta('E', 'efectivo', 1000),
    cuenta('T', 'tarjeta', 0),
    cuenta('X', 'efectivo', 0),
    {
      ...{ operacion: 'OP-14', categoriaId: id('SUPER'), periodoInicio: f('2027-03-01') },
      ...{ montoNuevo: c(300), ids: contador() },
    },
    {
      ...{ operacion: 'OP-20', id: id('R'), instante: INSTANTE, ids: contador(), fecha: MAR10 },
      ...{ cuentaId: id('E'), total: c(50), origen: 'programada' },
      lineas: [{ monto: c(50), destino: { categoriaId: id('SUPER') } }],
    },
  ];
  for (const x of pasos) h = exito(ap(h, x)).hechosNuevos;
  const ocurrencia = { id: id('O'), programadaId: id('P'), fechaEsperada: MAR10 };
  return {
    ...h,
    cuentas: h.cuentas.map((k) => (k.id === 'X' ? { ...k, archivada: true } : k)),
    ocurrencias_resueltas: [
      { ...ocurrencia, estado: 'registrada', transaccionId: id('R'), revision: null },
    ],
  };
}
const H0 = base();
const PAGO_T = pagoDe(H0, id('T'))?.id as Uuid;

const mov = (estado: Movimiento['estado'], extra: Partial<Movimiento> = {}): Movimiento => ({
  ...{ id: id('M'), smsId: id('S'), estado, cuentaId: id('E'), fecha: MAR10, monto: c(40) },
  ...{ comercio: 'Super Uno', tipoPropuesto: 'gasto', nota: null, transaccionId: null },
  ...{ duplicadoTransaccionId: null, duplicadoMovimientoId: null },
  ...{ esperadaProgramadaId: null, esperadaFecha: null },
  ...extra,
});
const linea = (monto: number, extra: Partial<MovimientoLinea> = {}): MovimientoLinea => ({
  ...{ id: id('ML1'), movimientoId: id('M'), orden: 1, monto: c(monto) },
  ...{ categoriaId: id('SUPER'), deudorId: null, lineaOriginalId: null },
  ...extra,
});
const aprobar = (m: Movimiento, lineas: MovimientoLinea[], extra: object = {}) => ({
  ...{ operacion: 'OP-37', movimiento: m, lineas, id: id('TX'), instante: INSTANTE },
  ...{ recibidoEn: RECIBIDO, ids: contador() },
  ...extra,
});
const PM = (r: ResultadoAplicar) => en(r, 'movimientos');

describe('PRU-DOM-BAND-102: aplicar, editar, aprobar y resolver movimientos (01 §5.6, §7.1; 04 §3.6)', () => {
  it('PRU-DOM-BAND-102 [INV-06, INV-08] OP-37 gasto, Pendiente → Aprobado: OP-20 con origen SMS, hora de registro y clave de orden = recepción del SMS (D2), comercio, nota y líneas a categoría y por cobrar; el movimiento queda vinculado', () => {
    const m = mov('pendiente', { nota: 'compra' });
    const lineas = [
      linea(30),
      linea(10, { id: id('ML2'), categoriaId: null, deudorId: id('ana') }),
    ];
    const r = ap(H0, aprobar(m, lineas));
    const [tx] = en(r, 'transacciones');
    expect(tx).toMatchObject({
      tipo: 'insertar',
      fila: {
        ...{ id: 'TX', tipo: 'gasto', fecha: MAR10, total: c(40), origen: 'sms' },
        ...{ horaRegistro: RECIBIDO, claveOrden: RECIBIDO, comercio: 'Super Uno', nota: 'compra' },
        estadoBancario: 'pendiente',
      },
    });
    const lineasTx = en(r, 'lineas').map((x) => (x.tipo === 'insertar' ? x.fila : undefined));
    expect(lineasTx).toMatchObject([
      { orden: 1, monto: c(30), categoriaId: 'SUPER', deudorId: null },
      { orden: 2, monto: c(10), categoriaId: null, deudorId: 'ana' },
    ]);
    expect(PM(r)).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'movimientos',
        id: 'M',
        campos: { estado: 'aprobado', transaccionId: 'TX' },
      },
    ]);
    const h = exito(r).hechosNuevos;
    expect(disp(h, 'SUPER')).toBe(c(300 - 50 - 30));
    expect(en(r, 'ocurrencias_resueltas')).toEqual([]);
  });

  it('PRU-DOM-BAND-102 [AV-10] OP-37 ingreso y pago de tarjeta: OP-21 toma cuenta, fecha y monto (sus líneas no se usan); OP-23 toma la tarjeta del movimiento y el origen de la entrada, con sus avisos', () => {
    const ingreso = mov('pendiente', { tipoPropuesto: 'ingreso', comercio: null });
    const r = ap(H0, aprobar(ingreso, [linea(40, { categoriaId: null })]));
    expect(en(r, 'transacciones')[0]).toMatchObject({
      fila: { tipo: 'ingreso', origen: 'sms', horaRegistro: RECIBIDO, total: c(40) },
    });
    expect(en(r, 'lineas')).toEqual([]);
    expect(lpa(exito(r).hechosNuevos)).toBe(Centavos.sumar(lpa(H0), c(40)));

    const pago = mov('pendiente', { tipoPropuesto: 'pago_tarjeta', cuentaId: id('T') });
    const p = ap(H0, aprobar(pago, [], { origenId: id('E') }));
    expect(en(p, 'transacciones')[0]).toMatchObject({
      fila: { tipo: 'pago_tarjeta', origen: 'sms', claveOrden: RECIBIDO },
    });
    const efectos = en(p, 'efectos').map((x) => (x.tipo === 'insertar' ? x.fila : undefined));
    expect(efectos).toMatchObject([
      { cuentaId: 'E', monto: c(-40) },
      { cuentaId: 'T', monto: c(40) },
    ]);
    expect(en(p, 'lineas')[0]).toMatchObject({ fila: { categoriaId: PAGO_T } });
    expect(exito(p).avisos.map((a) => a.codigo)).toContain('AV-10');
    // El origen es obligatorio en un pago de tarjeta: el SMS no lo informa (comando mal formado).
    expect(() => ap(H0, aprobar(pago, []))).toThrow(TypeError);
  });

  it('PRU-DOM-BAND-102 [CB-15] OP-37 rechazos: estado, sin cuenta, cuenta archivada, datos incompletos, línea sin destino, suma distinta y las precondiciones de la operación de su tipo; un No reconocido completado a mano pasa a Aprobado', () => {
    const una = [linea(40)];
    for (const estado of ['posible_duplicado', 'aprobado', 'descartado', 'autodescartado'] as const)
      expect(codigo(ap(H0, aprobar(mov(estado), una)))).toBe('movimiento_estado_no_valido');
    expect(rechazo(ap(H0, aprobar(mov('aprobado', { transaccionId: id('R') }), una)))).toEqual({
      codigo: 'movimiento_estado_no_valido',
      datos: { movimientoId: 'M', estado: 'aprobado', transaccionId: 'R' },
    });
    expect(codigo(ap(H0, aprobar(mov('pendiente', { cuentaId: null }), una)))).toBe(
      'movimiento_sin_cuenta',
    );
    expect(codigo(ap(H0, aprobar(mov('pendiente', { cuentaId: id('X') }), una)))).toBe(
      'cuenta_archivada',
    );
    const incompleto = mov('no_reconocido', { fecha: null, tipoPropuesto: null });
    expect(rechazo(ap(H0, aprobar(incompleto, una)))).toEqual({
      codigo: 'movimiento_incompleto',
      datos: { campos: 'fecha, tipo' },
    });
    expect(codigo(ap(H0, aprobar(mov('pendiente'), [linea(40, { categoriaId: null })])))).toBe(
      'linea_sin_destino',
    );
    expect(codigo(ap(H0, aprobar(mov('pendiente'), [linea(30)])))).toBe('suma_lineas_distinta');
    expect(codigo(ap(H0, aprobar(mov('pendiente'), [linea(40, { categoriaId: PAGO_T })])))).toBe(
      'categoria_de_pago_no_permitida',
    );
    const enTarjeta = mov('pendiente', { tipoPropuesto: 'ingreso', cuentaId: id('T') });
    expect(codigo(ap(H0, aprobar(enTarjeta, [])))).toBe('cuenta_tipo_no_valido');
    expect(codigo(ap(H0, aprobar(mov('pendiente', { fecha: f('2027-03-16') }), una)))).toBe(
      'fecha_posterior_a_hoy',
    );
    // No reconocido → Aprobado: el usuario creó la transacción a mano desde él (P19).
    expect(PM(ap(H0, aprobar(mov('no_reconocido'), una)))[0]).toMatchObject({
      campos: { estado: 'aprobado', transaccionId: 'TX' },
    });
  });

  it('PRU-DOM-BAND-102 OP-37 OP-40 Con coincidencia → Aprobado sobre una esperada pendiente: la transacción se crea con los datos del movimiento y la ocurrencia queda emparejada con ella', () => {
    const m = mov('con_coincidencia', {
      esperadaProgramadaId: id('Q'),
      esperadaFecha: f('2027-03-12'),
    });
    for (const x of [
      aprobar(m, [linea(40)]),
      { ...aprobar(m, [linea(40)]), operacion: 'OP-40', decision: 'confirmar_coincidencia' },
    ]) {
      const r = ap(H0, x);
      expect(en(r, 'transacciones')[0]).toMatchObject({ fila: { id: 'TX', total: c(40) } });
      expect(en(r, 'ocurrencias_resueltas')).toMatchObject([
        {
          tipo: 'insertar',
          fila: { programadaId: 'Q', fechaEsperada: f('2027-03-12'), estado: 'emparejada' },
        },
      ]);
      expect(en(r, 'ocurrencias_resueltas')[0]).toMatchObject({ fila: { transaccionId: 'TX' } });
      expect(PM(r)[0]).toMatchObject({ campos: { estado: 'aprobado', transaccionId: 'TX' } });
    }
  });

  it('PRU-DOM-BAND-102 [AV-16] OP-37 Con coincidencia → Aprobado sobre la transacción que la programada ya registró: no crea otra, su monto pasa a ser el del SMS (OP-28) y la ocurrencia pasa a emparejada; conciliada, pasa a confirmada con AV-16', () => {
    const m = mov('con_coincidencia', { esperadaProgramadaId: id('P'), esperadaFecha: MAR10 });
    // El movimiento trae 52 y su línea sin destino: se vincula, sus líneas no se usan.
    const r = ap(H0, aprobar({ ...m, monto: c(52) }, [linea(52, { categoriaId: null })]));
    expect(en(r, 'transacciones')).toEqual([
      { tipo: 'actualizar', tabla: 'transacciones', id: 'R', campos: { total: c(52) } },
    ]);
    expect(en(r, 'ocurrencias_resueltas')).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'ocurrencias_resueltas',
        id: 'O',
        campos: { estado: 'emparejada' },
      },
    ]);
    expect(PM(r)[0]).toMatchObject({ campos: { estado: 'aprobado', transaccionId: 'R' } });
    expect(disp(exito(r).hechosNuevos, 'SUPER')).toBe(c(300 - 52));

    // Mismo monto: solo se vincula y se empareja.
    expect(en(ap(H0, aprobar({ ...m, monto: c(50) }, [])), 'transacciones')).toEqual([]);

    const conciliacion = {
      ...{ id: id('K'), cuentaId: id('E'), fechaEstado: MAR10, saldoEstado: c(950) },
      ...{
        terminadaEn: INSTANTE,
        diferenciaAceptada: c(0),
        modo: 'saldo' as const,
        revision: null,
      },
    } as const;
    const conciliado: Hechos = {
      ...H0,
      conciliaciones: [conciliacion],
      transacciones: H0.transacciones.map((t) =>
        t.id === 'R' ? { ...t, estadoBancario: 'conciliada', conciliacionId: id('K') } : t,
      ),
    };
    const k = ap(conciliado, aprobar({ ...m, monto: c(52) }, []));
    expect(exito(k).avisos.map((a) => a.codigo)).toContain('AV-16');
    expect(en(k, 'transacciones')[0]).toMatchObject({
      campos: { total: c(52), estadoBancario: 'confirmada', conciliacionId: null },
    });
    expect(en(k, 'cambios_posteriores')[0]).toMatchObject({ fila: { motivos: ['monto'] } });

    // Si la ocurrencia ya se emparejó u omitió, la coincidencia quedó vieja.
    const emparejada: Hechos = {
      ...H0,
      ocurrencias_resueltas: H0.ocurrencias_resueltas.map((o) => ({ ...o, estado: 'omitida' })),
    };
    expect(rechazo(ap(emparejada, aprobar(m, [])))).toEqual({
      codigo: 'conflicto_desactualizado',
      campo: 'esperada',
    });
  });

  it('PRU-DOM-BAND-102 OP-37 recordar esta categoría para este comercio: crea la regla o actualiza la de igual patrón sin mayúsculas, solo con una línea de categoría', () => {
    const m = mov('pendiente');
    const recordar = { recordarRegla: true, reglas: [] };
    expect(en(ap(H0, aprobar(m, [linea(40)], recordar)), 'reglas_comercio')).toMatchObject([
      { tipo: 'insertar', fila: { patron: 'Super Uno', categoriaId: 'SUPER' } },
    ]);
    const previa = { id: id('RG'), patron: 'SUPER UNO', categoriaId: id('CASA') };
    const otra = { recordarRegla: true, reglas: [previa] };
    expect(en(ap(H0, aprobar(m, [linea(40)], otra)), 'reglas_comercio')).toEqual([
      { tipo: 'actualizar', tabla: 'reglas_comercio', id: 'RG', campos: { categoriaId: 'SUPER' } },
    ]);
    const igual = { recordarRegla: true, reglas: [{ ...previa, categoriaId: id('SUPER') }] };
    expect(en(ap(H0, aprobar(m, [linea(40)], igual)), 'reglas_comercio')).toEqual([]);
    const dos = [linea(30), linea(10, { id: id('ML2'), categoriaId: id('CASA') })];
    expect(en(ap(H0, aprobar(m, dos, recordar)), 'reglas_comercio')).toEqual([]);
    const deudor = [linea(40, { categoriaId: null, deudorId: id('ana') })];
    expect(en(ap(H0, aprobar(m, deudor, recordar)), 'reglas_comercio')).toEqual([]);
    expect(en(ap(H0, aprobar(m, [linea(40)])), 'reglas_comercio')).toEqual([]);
  });

  it('PRU-DOM-BAND-102 OP-37 variante { categoriaId } (CF-21): la única línea pasa a la categoría con orden nuevo y se aprueba en la misma operación; fuera de un gasto pendiente con a lo sumo una línea a categoría o sin destino, arrastre_no_permitido', () => {
    const arrastre = (m: Movimiento, lineas: MovimientoLinea[], categoriaId = id('CASA')) =>
      ap(H0, aprobar(m, lineas, { categoriaId }));
    const r = arrastre(mov('pendiente'), [linea(40, { categoriaId: null })]);
    expect(en(r, 'movimiento_lineas')).toMatchObject([
      { tipo: 'eliminar', id: 'ML1' },
      { tipo: 'insertar', fila: { orden: 2, monto: c(40), categoriaId: 'CASA', deudorId: null } },
    ]);
    expect(en(r, 'lineas')[0]).toMatchObject({ fila: { categoriaId: 'CASA', monto: c(40) } });
    expect(PM(r)[0]).toMatchObject({ campos: { estado: 'aprobado', transaccionId: 'TX' } });
    // Sin líneas: se crea la única.
    expect(en(arrastre(mov('pendiente'), []), 'movimiento_lineas')).toMatchObject([
      { tipo: 'insertar', fila: { orden: 1, categoriaId: 'CASA' } },
    ]);

    const fuera = [
      arrastre(mov('con_coincidencia'), [linea(40)]),
      arrastre(mov('posible_duplicado'), [linea(40)]),
      arrastre(mov('no_reconocido'), [linea(40)]),
      arrastre(mov('pendiente', { tipoPropuesto: 'ingreso' }), [linea(40)]),
      arrastre(mov('pendiente'), [linea(30), linea(10, { id: id('ML2') })]),
      arrastre(mov('pendiente'), [linea(40, { categoriaId: null, deudorId: id('ana') })]),
      arrastre(mov('pendiente'), [linea(40, { categoriaId: null, lineaOriginalId: id('x') })]),
    ];
    for (const x of fuera)
      expect(rechazo(x)).toEqual({ codigo: 'arrastre_no_permitido', datos: { movimientoId: 'M' } });
    expect(codigo(arrastre(mov('pendiente'), [linea(40)], PAGO_T))).toBe(
      'categoria_de_pago_no_permitida',
    );
    expect(codigo(arrastre(mov('pendiente'), [linea(40)], id('VIEJA')))).toBe(
      'categoria_archivada',
    );
    expect(codigo(arrastre(mov('pendiente', { cuentaId: null }), [linea(40)]))).toBe(
      'movimiento_sin_cuenta',
    );
    // recordarRegla no forma parte de la variante (comando mal formado).
    expect(() =>
      ap(H0, aprobar(mov('pendiente'), [], { categoriaId: id('CASA'), recordarRegla: true })),
    ).toThrow(TypeError);
  });

  it('PRU-DOM-BAND-102 [INV-13] OP-36 cambia campos y líneas sin tocar el estado ni las candidatas: líneas con orden nuevo (BE-16), la única sigue al monto; en Aprobado, Descartado o Autodescartado se rechaza', () => {
    const m = mov('posible_duplicado', { duplicadoTransaccionId: id('R') });
    const editar = (x: Movimiento, extra: object) =>
      ap(H0, { operacion: 'OP-36', movimiento: x, lineas: [linea(40)], ids: contador(), ...extra });
    const r = editar(m, {
      campos: { cuentaId: id('T'), comercio: 'Super Dos', nota: null, fecha: MAR10 },
      lineasNuevas: [
        { monto: c(40), destino: { categoriaId: id('SUPER') } },
        { monto: c(5), destino: { deudorNuevo: 'beto' } },
        { monto: c(5) },
      ],
    });
    expect(PM(r)).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'movimientos',
        id: 'M',
        campos: { cuentaId: 'T', comercio: 'Super Dos' },
      },
    ]);
    const deudor = en(r, 'deudores')[0];
    expect(deudor).toMatchObject({ tipo: 'insertar', fila: { nombre: 'beto' } });
    const beto = deudor?.tipo === 'insertar' ? (deudor.fila as { id: Uuid }).id : undefined;
    expect(en(r, 'movimiento_lineas')).toMatchObject([
      { tipo: 'insertar', fila: { orden: 2, monto: c(5), deudorId: beto, categoriaId: null } },
      { tipo: 'insertar', fila: { orden: 3, monto: c(5), deudorId: null, categoriaId: null } },
    ]);
    expect(calcular(exito(r).hechosNuevos, HOY).lpa).toEqual(calcular(H0, HOY).lpa);

    // Solo el monto: la única línea lo sigue.
    expect(en(editar(m, { campos: { monto: c(45) } }), 'movimiento_lineas')).toMatchObject([
      { tipo: 'eliminar', id: 'ML1' },
      { tipo: 'insertar', fila: { orden: 2, monto: c(45), categoriaId: 'SUPER' } },
    ]);
    expect(exito(editar(m, { campos: { monto: c(40) } })).cambios).toEqual([]);
    expect(codigo(editar(m, { campos: { cuentaId: id('nada') } }))).toBe('no_encontrado');
    const lineasNuevas = [{ monto: c(40), destino: { categoriaId: id('VIEJA') } }];
    expect(codigo(editar(m, { campos: {}, lineasNuevas }))).toBe('categoria_archivada');
    for (const estado of ['pendiente', 'con_coincidencia', 'no_reconocido', 'error'] as const)
      expect(exito(editar(mov(estado), { campos: { nota: 'x' } })).cambios).toHaveLength(1);
    for (const estado of ['aprobado', 'descartado', 'autodescartado'] as const)
      expect(codigo(editar(mov(estado), { campos: { nota: 'x' } }))).toBe(
        'movimiento_estado_no_valido',
      );
    // Un tipo sin operación de aprobación, o un monto no positivo, es un comando mal formado.
    expect(() => editar(m, { campos: { tipoPropuesto: 'transferencia' } })).toThrow(TypeError);
    expect(() => editar(m, { campos: { monto: c(0) } })).toThrow(TypeError);
  });

  it('PRU-DOM-BAND-102 OP-40 Con coincidencia → Pendiente o Posible duplicado al rechazarla (se evalúan los duplicados y se quita la propuesta); Posible duplicado → Pendiente si es legítimo o → Descartado si es duplicado', () => {
    const resolver = (m: Movimiento, decision: string, extra: object = {}) =>
      ap(H0, { operacion: 'OP-40', movimiento: m, lineas: [], decision, ...extra });
    const sinEsperada = { esperadaProgramadaId: null, esperadaFecha: null };
    const coincide = mov('con_coincidencia', {
      esperadaProgramadaId: id('Q'),
      esperadaFecha: MAR10,
    });
    const bandeja: MovimientoConTexto[] = [{ ...coincide, texto: 'SMS' }];
    const rechazar = { texto: 'SMS', movimientos: bandeja };
    expect(PM(resolver(coincide, 'rechazar_coincidencia', rechazar))[0]).toMatchObject({
      campos: { ...sinEsperada, estado: 'pendiente', duplicadoTransaccionId: null },
    });
    // R (50 en E el 10 mar) es candidata a duplicado de un SMS de 50.
    const de50 = { ...coincide, monto: c(50) };
    expect(PM(resolver(de50, 'rechazar_coincidencia', rechazar))[0]).toMatchObject({
      campos: { ...sinEsperada, estado: 'posible_duplicado', duplicadoTransaccionId: 'R' },
    });

    const dup = mov('posible_duplicado', { duplicadoTransaccionId: id('R') });
    expect(PM(resolver(dup, 'es_legitimo'))[0]).toMatchObject({
      campos: { estado: 'pendiente', duplicadoTransaccionId: null, duplicadoMovimientoId: null },
    });
    expect(PM(resolver(dup, 'es_duplicado'))).toEqual([
      { tipo: 'actualizar', tabla: 'movimientos', id: 'M', campos: { estado: 'descartado' } },
    ]);

    for (const [m, decision] of [
      [dup, 'rechazar_coincidencia'],
      [dup, 'confirmar_coincidencia'],
      [coincide, 'es_legitimo'],
      [mov('pendiente'), 'es_duplicado'],
      [mov('aprobado'), 'rechazar_coincidencia'],
    ] as const)
      expect(codigo(resolver(m, decision, rechazar))).toBe('movimiento_estado_no_valido');
  });
});
