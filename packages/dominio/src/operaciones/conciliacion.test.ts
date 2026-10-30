import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Cambio,
  ComandoDominio,
  EstadoDeCuenta,
  GeneradorIds,
  Hechos,
  Instante,
  ResultadoAplicar,
  Uuid,
} from '../hechos';
import { clasificarConciliacion, propuestaDeVerificacion } from '../selectores/conciliacion';
import { diferenciaActual } from '../selectores/detalle-cuenta';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';
import { op45 } from './op-45';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(`2027-02-${t}`);
const id = (t: string) => t as Uuid;
/** ESC-47: hoy 16/02/2027 (07 §12.1); ciclo del día 1, febrero activo. */
const HOY = f('16');
const INSTANTE = '2027-02-16T15:00:00.000Z' as Instante;
const ins = (n: number) => `2027-02-01T1${n}:00:00.000Z` as Instante;

let k = 0;
const contador = (): GeneradorIds => {
  const n = ++k;
  let m = 0;
  return { siguiente: () => id(`n${n}.${++m}`) };
};
const exito = (r: ResultadoAplicar) => {
  if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);
  return r;
};
const primero = (r: ResultadoAplicar) => (r.ok ? undefined : r.rechazos[0]);
const en = (h: Hechos, x: object) => aplicar(h, { ids: contador(), ...x } as ComandoDominio, HOY);
const hechos = (h: Hechos, ...xs: object[]) =>
  xs.reduce<Hechos>((y, x) => exito(en(y, x)).hechosNuevos, h);
const tabla = (r: ResultadoAplicar, t: string) =>
  exito(r).cambios.filter((x) => x.tipo !== 'eliminarConciliacionesDeCuenta' && x.tabla === t);
/** Inv. 14: ningún cambio crea una transacción, un efecto o una línea. */
const altas = (r: ResultadoAplicar) =>
  exito(r).cambios.filter(
    (x: Cambio) =>
      x.tipo === 'insertar' && ['transacciones', 'efectos', 'lineas'].includes(x.tabla),
  );
const SUPER = { categoriaId: id('SUPER') };
const gasto = (t: string, cuentaId: string, total: number, dia: string, i = 1) => ({
  operacion: 'OP-20',
  id: id(t),
  instante: ins(i),
  cuentaId: id(cuentaId),
  fecha: f(dia),
  total: c(total),
  lineas: [{ monto: c(total), destino: SUPER }],
});
const cuenta = (x: string, tipo: 'efectivo' | 'tarjeta', subtipo?: object) => ({
  operacion: 'OP-01',
  id: id(x),
  instante: ins(0),
  cuenta: {
    tipo,
    nombre: x,
    institucionId: null,
    ultimos4: null,
    fechaApertura: FechaLocal.desdeTexto('2027-01-01'),
  },
  ...(subtipo && { subtipo }),
  saldo: c(0),
});
const tarjeta = { tipo: 'tarjeta', limiteCredito: c(5000), tasaAnualMillonesimas: null } as const;

/** ESC-47 paso 0: T con A 40, B 25 y C 12 en Super (100 asignados); ingreso 100 en Ef. */
function paso0(): Hechos {
  const vacio = Object.fromEntries(
    ['cuentas', 'tarjetas', 'prestamos', 'inversiones', 'asignaciones', 'transacciones']
      .concat(['efectos', 'lineas', 'condonaciones', 'metas', 'programadas', 'programada_lineas'])
      .concat(['ocurrencias_resueltas', 'conciliaciones', 'deudores'])
      .map((t) => [t, []]),
  );
  const grupo = (g: string, claveSistema: string | null) => ({
    ...{ id: id(g), nombre: g, orden: 1, archivado: false, claveSistema, revision: null },
  });
  const h = {
    ...vacio,
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    grupos: [grupo('PT', 'pagos_tarjeta'), grupo('A', null)],
    categorias: [
      ...[{ id: id('SUPER'), grupoId: id('A'), nombre: 'Super', orden: 1, clase: 'normal' }],
    ].map((x) => ({ ...x, tarjetaId: null, archivada: false, revision: null })),
  } as unknown as Hechos;
  const t = { ...tarjeta, diaCorte: 20, diaPago: 5, red: null, color: null };
  return hechos(
    h,
    cuenta('Ef', 'efectivo'),
    cuenta('T', 'tarjeta', t),
    {
      operacion: 'OP-21',
      id: id('I'),
      instante: ins(1),
      cuentaId: id('Ef'),
      fecha: f('01'),
      total: c(100),
    },
    { operacion: 'OP-14', categoriaId: id('SUPER'), periodoInicio: f('01'), montoNuevo: c(100) },
    gasto('A', 'T', 40, '05', 2),
    gasto('B', 'T', 25, '08', 3),
    gasto('C', 'T', 12, '12', 4),
  );
}
const H0 = paso0();
/** El estado al 15 feb: A 40 (06 feb), B 25 y D 10, con saldo −75 (01 §0.4: deuda negativa). */
const ESTADO: EstadoDeCuenta = {
  fechaEstado: f('15'),
  saldoFinal: c(-75),
  movimientos: [
    { indice: 0, fecha: f('06'), monto: c(-40) },
    { indice: 1, fecha: f('08'), monto: c(-25) },
    { indice: 2, fecha: f('14'), monto: c(-10) },
  ],
};
const terminar = (coincidencias: [string, number][], estado = ESTADO) => ({
  operacion: 'OP-47',
  id: id('K'),
  instante: INSTANTE,
  cuentaId: id('T'),
  estado,
  coincidencias: coincidencias.map(([t, m]) => ({ transaccionId: id(t), movimientoIndice: m })),
});
const verificar = (cuentaId: string, saldoEstado: number, marcar: object = { todas: true }) => ({
  operacion: 'OP-53',
  id: id('V'),
  instante: INSTANTE,
  cuentaId: id(cuentaId),
  fechaEstado: f('15'),
  saldoEstado: c(saldoEstado),
  marcar,
});
const av21 = (r: ResultadoAplicar) => exito(r).avisos.find((a) => a.codigo === 'AV-21')?.datos;

describe('PRU-DOM-CONC-101: conciliación y verificar saldo (01 §5.8; 04 §3.8, §9.5; 06 §3.2)', () => {
  it('PRU-DOM-CONC-101 [ESC-47, CB-18] OP-45 BE-48: seleccionar.clasificarConciliacion empareja 1 a 1 con la fecha más cercana y la clave de orden más antigua, y propone la diferencia del estado', () => {
    const i = calcular(H0, HOY);
    expect(clasificarConciliacion(i, id('T'), ESTADO)).toEqual({
      coincidencias: [
        { transaccionId: 'A', movimientoIndice: 0 },
        { transaccionId: 'B', movimientoIndice: 1 },
      ],
      soloEnEstado: [2],
      soloEnFinn: ['C'],
      saldoFinn: c(-77),
      diferencia: c(2), // −75 − (−77)
    });
    expect(op45(i, { cuentaId: id('T'), estado: ESTADO })).toEqual(
      clasificarConciliacion(i, id('T'), ESTADO),
    );
    expect(op45(i, { cuentaId: id('nada'), estado: ESTADO })).toMatchObject({
      codigo: 'no_encontrado',
    });
    // Cuatro de 10 en Ef el 10: X a 2 días, Y y Z a 1 día; Y y Z empatan en clave y desempata la
    // secuencia (9 antes que 10), no el id. Una conciliada y una fuera de la ventana no son candidatas.
    const h = hechos(
      H0,
      gasto('X', 'Ef', 10, '08', 5),
      gasto('Y', 'Ef', 10, '11', 6),
      gasto('Z', 'Ef', 10, '11', 6),
      gasto('W', 'Ef', 10, '02', 7),
      gasto('Q', 'Ef', 10, '10', 8),
    );
    const seq: Record<string, string> = { Y: '10', Z: '9' };
    const ajustado = {
      ...h,
      transacciones: h.transacciones.map((t) =>
        t.id === 'Q'
          ? { ...t, estadoBancario: 'conciliada' as const, conciliacionId: id('vieja') }
          : { ...t, secuencia: (seq[t.id] ?? null) as never },
      ),
    };
    const estado = (dias: string[]): EstadoDeCuenta => ({
      fechaEstado: f('15'),
      saldoFinal: c(0),
      movimientos: dias.map((d, indice) => ({ indice, fecha: f(d), monto: c(-10) })),
    });
    const r = clasificarConciliacion(
      calcular(ajustado, HOY),
      id('Ef'),
      estado(['10', '10', '10', '10']),
    );
    expect(r.coincidencias.map((p) => p.transaccionId)).toEqual(['Z', 'Y', 'X']);
    expect(r).toMatchObject({ soloEnEstado: [3], soloEnFinn: [] });
    // Con el primer movimiento el 10, la ventana empieza el 7: W (2 feb) queda fuera.
    expect(
      clasificarConciliacion(calcular(ajustado, HOY), id('Ef'), estado(['10'])).soloEnFinn,
    ).toEqual(['X', 'Y']);
  });

  it('PRU-DOM-CONC-101 [ESC-47, CB-18, AV-21, INV-14] OP-47 terminar: A y B conciliadas, diferencia aceptada +2 con la entrada a la tarjeta propuesta; después, la diferencia actual sigue a las ediciones (pasos 1 a 3)', () => {
    const r = en(
      H0,
      terminar([
        ['A', 0],
        ['B', 1],
      ]),
    );
    expect(tabla(r, 'conciliaciones')).toEqual([
      {
        tipo: 'insertar',
        tabla: 'conciliaciones',
        fila: {
          ...{ id: 'K', cuentaId: 'T', fechaEstado: f('15'), saldoEstado: c(-75) },
          ...{
            terminadaEn: INSTANTE,
            diferenciaAceptada: c(2),
            modo: 'estado_cuenta',
            revision: null,
          },
        },
      },
    ]);
    const conciliada = { estadoBancario: 'conciliada', conciliacionId: 'K' };
    expect(tabla(r, 'transacciones')).toEqual(
      ['A', 'B'].map((x) => ({
        tipo: 'actualizar',
        tabla: 'transacciones',
        id: x,
        campos: conciliada,
      })),
    );
    expect(altas(r)).toEqual([]);
    expect(exito(r).avisos.filter((a) => a.codigo === 'AV-21')).toEqual([
      {
        codigo: 'AV-21',
        momento: 'despues',
        requiereConfirmacion: false,
        datos: {
          ...{ conciliacionId: 'K', cuentaId: 'T', fechaEstado: f('15'), diferencia: c(2) },
          ...{
            operacion: 'OP-27',
            modalidad: 'entrada',
            monto: c(2),
            comercio: 'Ajuste de conciliación',
          },
        },
      },
    ]);
    const k1 = exito(r).hechosNuevos;
    const fila = k1.conciliaciones[0] as Hechos['conciliaciones'][number];
    // Paso 2: C a 10 (no conciliada): diferencia actual 0, sin cambio posterior.
    const editar = (t: string, total: number) => ({
      operacion: 'OP-28',
      transaccionId: id(t),
      instante: INSTANTE,
      total: c(total),
    });
    const r2 = en(k1, editar('C', 10));
    expect(tabla(r2, 'cambios_posteriores')).toEqual([]);
    const k2 = exito(r2).hechosNuevos;
    expect(diferenciaActual(calcular(k2, HOY), fila)).toBe(c(0));
    // Paso 3: A a 45 (conciliada): AV-16, A confirmada, cambio posterior y diferencia actual +5.
    const r3 = en(k2, editar('A', 45));
    expect(exito(r3).avisos.map((a) => a.codigo)).toContain('AV-16');
    expect(tabla(r3, 'cambios_posteriores')).toHaveLength(1);
    const k3 = exito(r3).hechosNuevos;
    expect(k3.transacciones.find((t) => t.id === 'A')?.estadoBancario).toBe('confirmada');
    expect(diferenciaActual(calcular(k3, HOY), fila)).toBe(c(5)); // −75 − (−80)
    // Sin diferencia no hay AV-21.
    const cero = en(H0, terminar([['A', 0]], { ...ESTADO, saldoFinal: c(-77) }));
    expect(av21(cero)).toBeUndefined();
  });

  it('PRU-DOM-CONC-101 [ESC-47, CB-18] OP-47 BE-48: reclasifica con los hechos del momento; un par que ya no cumple el criterio o repetido da coincidencia_no_valida, y una conciliada transaccion_ya_conciliada', () => {
    const no = (t: string, m: number) => ({
      codigo: 'coincidencia_no_valida',
      datos: { transaccionId: t, movimientoIndice: m },
    });
    // A cambió de monto entre la subida y la confirmación.
    const editada = hechos(H0, {
      operacion: 'OP-28',
      transaccionId: id('A'),
      instante: INSTANTE,
      total: c(41),
    });
    expect(primero(en(editada, terminar([['A', 0]])))).toEqual(no('A', 0));
    expect(primero(en(H0, terminar([['C', 2]])))).toEqual(no('C', 2)); // otro monto
    expect(
      primero(
        en(
          H0,
          terminar([
            ['A', 0],
            ['A', 1],
          ]),
        ),
      ),
    ).toEqual(no('A', 1)); // 1 a 1
    expect(
      primero(
        en(
          H0,
          terminar([
            ['A', 0],
            ['B', 0],
          ]),
        ),
      ),
    ).toEqual(no('B', 0));
    // Fuera de la ventana del estado: el 5 de febrero, con el estado desde el 14.
    const tarde: EstadoDeCuenta = {
      ...ESTADO,
      movimientos: [{ indice: 0, fecha: f('14'), monto: c(-40) }],
    };
    expect(primero(en(H0, terminar([['A', 0]], tarde)))).toEqual(no('A', 0));
    const k1 = exito(en(H0, terminar([['A', 0]]))).hechosNuevos;
    expect(primero(en(k1, { ...terminar([['A', 0]]), id: id('K2') }))).toEqual({
      codigo: 'transaccion_ya_conciliada',
      datos: { transaccionId: 'A' },
    });
    expect(primero(en(H0, terminar([['nada', 0]])))).toMatchObject({ codigo: 'no_encontrado' });
    expect(primero(en(H0, { ...terminar([]), cuentaId: id('nada') }))).toMatchObject({
      codigo: 'no_encontrado',
    });
    expect(() => en(H0, terminar([['A', 9]]))).toThrow(TypeError);
  });

  it('PRU-DOM-CONC-101 [CB-18, AV-01, INV-14] OP-46 BE-48: agregar D desde el estado crea una sola transacción importada y confirmada con la fecha y el monto del movimiento; uno que ya coincide da coincidencia_no_valida', () => {
    const agregar = (indice: number, alta: object) => ({
      operacion: 'OP-46',
      cuentaId: id('T'),
      estado: ESTADO,
      movimientoIndice: indice,
      alta: { ids: contador(), ...alta },
    });
    const d = gasto('D', 'T', 10, '16', 9);
    const r = en(H0, agregar(2, d));
    expect(tabla(r, 'transacciones')).toEqual([
      expect.objectContaining({
        fila: expect.objectContaining({
          ...{ id: 'D', tipo: 'gasto', fecha: f('14'), total: c(10) },
          ...{ origen: 'importada', estadoBancario: 'confirmada' },
        }) as unknown,
      }),
    ]);
    expect(tabla(r, 'efectos')).toEqual([
      expect.objectContaining({
        fila: expect.objectContaining({ cuentaId: 'T', monto: c(-10) }) as unknown,
      }),
    ]);
    // Agregado D, la reclasificación lo empareja: agregarlo otra vez se rechaza.
    const k1 = exito(r).hechosNuevos;
    expect(primero(en(k1, agregar(2, { ...d, id: id('D2') })))).toEqual({
      codigo: 'coincidencia_no_valida',
      datos: { movimientoIndice: 2, transaccionId: 'D' },
    });
    // A y el movimiento 0 coinciden: no se agrega un duplicado.
    expect(primero(en(H0, agregar(0, gasto('A2', 'T', 40, '06'))))).toMatchObject({
      codigo: 'coincidencia_no_valida',
    });
    // El alta no corresponde al movimiento: otro monto u otra cuenta.
    for (const otro of [gasto('D3', 'T', 11, '14'), gasto('D4', 'Ef', 10, '14')])
      expect(primero(en(H0, agregar(2, otro)))).toEqual({
        codigo: 'coincidencia_no_valida',
        datos: { movimientoIndice: 2 },
      });
    // Los rechazos de la operación que ejecuta pasan tal cual.
    const sinCategoria = { ...d, lineas: [{ monto: c(10), destino: { categoriaId: id('nada') } }] };
    expect(primero(en(H0, agregar(2, sinCategoria)))).toMatchObject({ codigo: 'no_encontrado' });
    // En un período cerrado avisa AV-01 como la operación que ejecuta.
    const enero: EstadoDeCuenta = {
      ...ESTADO,
      movimientos: [{ indice: 0, fecha: FechaLocal.desdeTexto('2027-01-20'), monto: c(-10) }],
    };
    const r2 = en(H0, { ...agregar(0, d), estado: enero });
    expect(exito(r2).avisos.map((a) => a.codigo)).toContain('AV-01');
    expect(() => en(H0, agregar(7, d))).toThrow(TypeError);
  });

  it('PRU-DOM-CONC-101 [CB-18, AV-21, INV-14] OP-53 CF-01: verificar saldo sin estado de cuenta registra el modo saldo y la diferencia con su signo en efectivo y en tarjeta, y marca las elegidas sin crear transacciones', () => {
    // Tarjeta: el usuario escribe la deuda en positivo (75): d = −75 − (−77) = +2, entrada a la tarjeta.
    const t = en(H0, verificar('T', 75));
    expect(tabla(t, 'conciliaciones')).toEqual([
      expect.objectContaining({
        fila: expect.objectContaining({
          saldoEstado: c(-75),
          diferenciaAceptada: c(2),
          modo: 'saldo',
        }) as unknown,
      }),
    ]);
    expect(tabla(t, 'transacciones').map((x) => (x.tipo === 'actualizar' ? x.id : ''))).toEqual([
      'A',
      'B',
      'C',
    ]);
    expect(altas(t)).toEqual([]);
    expect(av21(t)).toMatchObject({
      diferencia: c(2),
      operacion: 'OP-27',
      modalidad: 'entrada',
      monto: c(2),
    });
    // Tarjeta con más deuda en el banco (80): d = −3, gasto con la tarjeta.
    expect(av21(en(H0, verificar('T', 80)))).toMatchObject({
      diferencia: c(-3),
      operacion: 'OP-20',
      monto: c(3),
    });
    // Efectivo: 100 en Finn. El banco con 90: d = −10, gasto; con 104: d = +4, ingreso; con 100, sin AV-21.
    expect(av21(en(H0, verificar('Ef', 90)))).toMatchObject({
      diferencia: c(-10),
      operacion: 'OP-20',
      monto: c(10),
    });
    const mas = av21(en(H0, verificar('Ef', 104)));
    expect(mas).toMatchObject({ diferencia: c(4), operacion: 'OP-21', monto: c(4) });
    expect(mas).not.toHaveProperty('modalidad');
    const igual = en(H0, verificar('Ef', 100, { ids: [id('I')] }));
    expect(av21(igual)).toBeUndefined();
    // La propuesta de la previsualización (04 §3.8 [CH-36]): saldo de Finn, diferencia con la deuda positiva y cuántas marca
    const pedido = (cuenta: string, saldo: number, marcar: object) =>
      verificar(cuenta, saldo, marcar) as Parameters<typeof propuestaDeVerificacion>[1];
    expect(propuestaDeVerificacion(H0, pedido('T', 75, { todas: true }))).toEqual({
      saldoFinn: c(-77),
      diferencia: c(2),
      marcaria: 3,
    });
    expect(propuestaDeVerificacion(H0, pedido('Ef', 90, { ids: [id('I'), id('I')] }))).toEqual({
      saldoFinn: c(100),
      diferencia: c(-10),
      marcaria: 1,
    });
    expect(propuestaDeVerificacion(H0, pedido('nadie', 90, { todas: true }))).toBeUndefined();
    expect(tabla(igual, 'transacciones')).toHaveLength(1);
    // Con ids: solo las elegidas; una posterior a la fecha, de otra cuenta o ya conciliada se rechaza.
    expect(
      tabla(en(H0, verificar('T', 75, { ids: [id('B'), id('B')] })), 'transacciones'),
    ).toHaveLength(1);
    const posterior = hechos(H0, gasto('P', 'T', 5, '16', 9));
    const fuera = (x: string) => ({
      codigo: 'transaccion_fuera_de_verificacion',
      datos: { transaccionId: x },
    });
    expect(primero(en(posterior, verificar('T', 75, { ids: [id('P')] })))).toEqual(fuera('P'));
    expect(primero(en(H0, verificar('T', 75, { ids: [id('I')] })))).toEqual(fuera('I'));
    expect(tabla(en(posterior, verificar('T', 75)), 'transacciones')).toHaveLength(3); // sin P
    const k1 = exito(en(H0, verificar('T', 75))).hechosNuevos;
    expect(primero(en(k1, { ...verificar('T', 75, { ids: [id('A')] }), id: id('V2') }))).toEqual({
      codigo: 'transaccion_ya_conciliada',
      datos: { transaccionId: 'A' },
    });
    expect(tabla(en(k1, { ...verificar('T', 75), id: id('V2') }), 'transacciones')).toEqual([]);
    // Precondiciones de la cuenta y de la fecha.
    expect(primero(en(H0, { ...verificar('T', 75), fechaEstado: f('17') }))).toMatchObject({
      codigo: 'fecha_posterior_a_hoy',
    });
    expect(
      primero(en(H0, { ...verificar('T', 75), fechaEstado: FechaLocal.desdeTexto('2026-12-31') })),
    ).toMatchObject({ codigo: 'fecha_anterior_a_apertura' });
    const archivada = {
      ...H0,
      cuentas: H0.cuentas.map((x) => (x.id === 'Ef' ? { ...x, archivada: true } : x)),
    };
    expect(primero(en(archivada, verificar('Ef', 100)))).toMatchObject({
      codigo: 'cuenta_archivada',
    });
    const conPrestamo = hechos(H0, {
      ...cuenta('L', 'tarjeta'),
      cuenta: { ...cuenta('L', 'tarjeta').cuenta, tipo: 'prestamo' },
      subtipo: {
        ...{
          tipo: 'prestamo',
          contraparte: 'Banco',
          montoOriginal: c(100),
          tasaNominalAnualMillonesimas: 0,
        },
        ...{ tipoTasa: 'fija', seguroPrimerMes: null, comision: null, frecuencia: 'mensual' },
        ...{ frecuenciaDias: null, cuotaPactada: c(10), plazoCuotas: 10, modeloCalculo: null },
        cuotasPagadasAlCrear: 0,
      },
      saldo: c(100),
    });
    expect(primero(en(conPrestamo, verificar('L', 100)))).toMatchObject({
      codigo: 'cuenta_tipo_no_valido',
    });
  });
});
