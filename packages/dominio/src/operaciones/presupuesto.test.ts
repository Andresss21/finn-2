import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { evaluarMeta } from '../calculo/metas';
import { periodoDe } from '../calculo/periodos';
import type {
  Asignacion,
  Categoria,
  ComandoDominio,
  GeneradorIds,
  Grupo,
  Hechos,
  Instante,
  Meta,
  ResultadoAplicar,
  Uuid,
  VarianteAsignacionRapida,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';
import { asignacionRapida } from './op-16';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
/** Ciclo del día 1: enero y febrero cerrados, marzo activo, abril futuro. */
const HOY = f('2027-03-15');
const [ENE, FEB, MAR, ABR] = [f('2027-01-01'), f('2027-02-01'), f('2027-03-01'), f('2027-04-01')];

/** Un generador por comando, con ids que no se repiten entre comandos. */
let comandos = 0;
const contador = (): GeneradorIds => {
  const k = ++comandos;
  let n = 0;
  return { siguiente: () => id(`n${k}.${++n}`) };
};
const grupo = (g: string, orden: number, extra: Partial<Grupo> = {}): Grupo => ({
  id: id(g),
  nombre: g,
  orden,
  archivado: false,
  claveSistema: null,
  revision: null,
  ...extra,
});
const categoria = (x: string, g: string, orden: number, extra: Partial<Categoria> = {}) => ({
  id: id(x),
  grupoId: id(g),
  nombre: x,
  orden,
  clase: 'normal' as const,
  tarjetaId: null,
  archivada: false,
  revision: null,
  ...extra,
});
const asignacion = (x: string, periodo: FechaLocal, monto: number): Asignacion => ({
  id: id(`asig-${x}-${periodo}`),
  categoriaId: id(x),
  periodoInicio: periodo,
  monto: c(monto),
  revision: null,
});
const meta = (x: string, monto: number, extra: Partial<Meta> = {}): Meta => ({
  id: id(`meta-${x}`),
  categoriaId: id(x),
  tipo: 'mensual',
  modo: 'acumular',
  monto: c(monto),
  fechaObjetivo: null,
  fechaCreacion: ENE,
  revision: null,
  ...extra,
});
const cuenta = (k: string, tipo: 'efectivo' | 'tarjeta', orden: number) => ({
  id: id(k),
  tipo,
  nombre: k,
  institucionId: null,
  ultimos4: null,
  fechaApertura: ENE,
  orden,
  archivada: false,
  revision: null,
});

/**
 * ESC-03 con más categorías: E con 1.025 de saldo inicial el 1 ene. Grupo A: Mascota (meta mensual
 * de 50), Super y Gas; grupo B: Ropa (meta mensual de 80) y Salidas. Vieja (archivada, con meta de
 * 100) tiene 25 asignados en marzo. P es el pago de la tarjeta T. LPA = 1.025 − 25 = 1.000.
 */
function base(asignaciones: readonly Asignacion[] = []): Hechos {
  const hora = '2027-01-01T12:00:00.000Z' as Instante;
  return {
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [cuenta('E', 'efectivo', 1), cuenta('T', 'tarjeta', 2)],
    tarjetas: [
      {
        cuentaId: id('T'),
        tipo: 'tarjeta',
        limiteCredito: c(1000),
        tasaAnualMillonesimas: null,
        diaCorte: 20,
        diaPago: 5,
        red: null,
        color: null,
        revision: null,
      },
    ],
    prestamos: [],
    inversiones: [],
    grupos: [
      grupo('PT', 0, { claveSistema: 'pagos_tarjeta' }),
      grupo('B', 20),
      grupo('A', 10),
      grupo('Z', 30, { archivado: true }),
    ],
    categorias: [
      categoria('P', 'PT', 1, { clase: 'pago', tarjetaId: id('T') }),
      categoria('ROPA', 'B', 10),
      categoria('SAL', 'B', 20),
      categoria('MASC', 'A', 10),
      categoria('SUPER', 'A', 20),
      categoria('GAS', 'A', 30),
      categoria('VIEJA', 'Z', 10, { archivada: true }),
    ],
    asignaciones: [asignacion('VIEJA', MAR, 25), ...asignaciones],
    deudores: [],
    transacciones: [
      {
        id: id('si-E'),
        tipo: 'saldo_inicial',
        fecha: ENE,
        horaRegistro: hora,
        claveOrden: hora,
        secuencia: null,
        origen: 'manual',
        estadoBancario: 'pendiente',
        conciliacionId: null,
        comercio: null,
        nota: null,
        total: c(1025),
        monedaOriginal: null,
        montoOriginal: null,
        lineaCobradaId: null,
        revision: null,
      },
    ],
    efectos: [
      {
        id: id('ef-si'),
        transaccionId: id('si-E'),
        cuentaId: id('E'),
        monto: c(1025),
        interes: null,
        seguro: null,
        revision: null,
      },
    ],
    lineas: [],
    condonaciones: [],
    metas: [meta('MASC', 50), meta('ROPA', 80), meta('VIEJA', 100)],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
}

const ejecutar = (h: Hechos, comando: ComandoDominio, hoy = HOY) => aplicar(h, comando, hoy);
const exito = (r: ResultadoAplicar) => {
  if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);
  return r;
};
const rechazos = (r: ResultadoAplicar) => (r.ok ? [] : r.rechazos);
const lpa = (h: Hechos, hoy = HOY) => calcular(h, hoy).lpa.total;
const asig = (h: Hechos, x: string, p: FechaLocal) =>
  h.asignaciones.find((a) => a.categoriaId === x && a.periodoInicio === p)?.monto ?? 0;
const aviso = (r: ResultadoAplicar, codigo: string) =>
  exito(r).avisos.find((a) => a.codigo === codigo);

const op14 = (x: string, p: FechaLocal, monto: number): ComandoDominio => ({
  operacion: 'OP-14',
  categoriaId: id(x),
  periodoInicio: p,
  montoNuevo: c(monto),
  ids: contador(),
});
const op15 = (o: string, d: string, p: FechaLocal, monto: number): ComandoDominio => ({
  operacion: 'OP-15',
  origenId: id(o),
  destinoId: id(d),
  periodoInicio: p,
  monto: c(monto),
  ids: contador(),
});
const op17 = (p: FechaLocal, categorias?: string[]): ComandoDominio => ({
  operacion: 'OP-17',
  periodoInicio: p,
  ...(categorias && { categorias: categorias.map(id) }),
  ids: contador(),
});

describe('PRU-DOM-PRES-101: aplicar, presupuesto y metas (01 §5.3, 04 §3.3)', () => {
  it('PRU-DOM-PRES-101 [ESC-03, AV-11, AV-18] OP-14 y OP-17: asignar en el activo con aviso, rechazo en un futuro (I1) y auto-asignar sin LPA', () => {
    const h1 = exito(ejecutar(base(), op14('SUPER', MAR, 600)));
    expect(h1.cambios).toEqual([
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: {
          id: expect.any(String) as string,
          categoriaId: 'SUPER',
          periodoInicio: MAR,
          monto: c(600),
          revision: null,
        },
      },
    ]);
    expect(lpa(h1.hechosNuevos)).toBe(c(400));
    expect(aviso(h1, 'AV-11')).toBeUndefined();
    const h2 = exito(ejecutar(h1.hechosNuevos, op14('SAL', ABR, 300)));
    expect(lpa(h2.hechosNuevos)).toBe(c(100));
    // Paso 4: en un futuro, LPA quedaría en −100 (I1).
    expect(rechazos(ejecutar(h2.hechosNuevos, op14('GAS', ABR, 200)))).toEqual([
      { codigo: 'lpa_negativo_en_futuro', datos: { faltante: c(100) } },
    ]);
    // Paso 5: en el activo se permite, con AV-11 antes de confirmar.
    const h3 = ejecutar(h2.hechosNuevos, op14('GAS', MAR, 200));
    expect(aviso(h3, 'AV-11')).toEqual({
      codigo: 'AV-11',
      momento: 'antes',
      requiereConfirmacion: true,
      datos: { lpa: c(-100) },
    });
    const h4 = exito(h3).hechosNuevos;
    expect(lpa(h4)).toBe(c(-100));
    // Paso 6: con LPA ≤ 0 no asigna nada; AV-18 trae lo que quedó sin cubrir, en orden.
    const h5 = ejecutar(h4, op17(MAR));
    expect(exito(h5).cambios).toEqual([]);
    expect(aviso(h5, 'AV-18')).toEqual({
      codigo: 'AV-18',
      momento: 'despues',
      requiereConfirmacion: false,
      datos: { MASC: c(50), ROPA: c(80) },
    });
    expect(Object.keys(aviso(h5, 'AV-18')?.datos ?? {})).toEqual(['MASC', 'ROPA']);
  });

  it('PRU-DOM-PRES-101 [CB-09, CB-25] OP-14: valor absoluto (0 elimina la fila), desasignar por debajo de cero y una archivada solo entrega', () => {
    const h = base([asignacion('SUPER', MAR, 600)]);
    expect(exito(ejecutar(h, op14('SUPER', MAR, 600))).cambios).toEqual([]);
    expect(exito(ejecutar(h, op14('SUPER', MAR, 400))).cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'asignaciones',
        id: 'asig-SUPER-2027-03-01',
        campos: { monto: c(400) },
      },
    ]);
    expect(exito(ejecutar(h, op14('SUPER', MAR, 0))).cambios).toEqual([
      { tipo: 'eliminar', tabla: 'asignaciones', id: 'asig-SUPER-2027-03-01' },
    ]);
    // CB-09: Asig = −50 se permite; LPA sube a 1.050 y el negativo, de tipo débito, lo baja al cierre.
    const negativo = exito(ejecutar(base(), op14('GAS', MAR, -50))).hechosNuevos;
    expect(asig(negativo, 'GAS', MAR)).toBe(c(-50));
    expect(lpa(negativo)).toBe(c(1050));
    const alCierre = calcular(negativo, f('2027-04-10')).lpa;
    expect([alCierre.sobregirosDebito, alCierre.total]).toEqual([c(50), c(1000)]);
    // CB-25: δ > 0 hacia una archivada se rechaza; sacar dinero se permite.
    expect(rechazos(ejecutar(base(), op14('VIEJA', MAR, 30)))).toEqual([
      { codigo: 'categoria_archivada', datos: { categoriaId: 'VIEJA' } },
    ]);
    expect(asig(exito(ejecutar(base(), op14('VIEJA', MAR, 10))).hechosNuevos, 'VIEJA', MAR)).toBe(
      c(10),
    );
    // H10 [CH-31]: en un período futuro, una archivada no cambia ni para entregar (03 §4.5.3, regla 3).
    expect(rechazos(ejecutar(base(), op14('VIEJA', ABR, -1)))).toEqual([
      { codigo: 'categoria_archivada', datos: { categoriaId: 'VIEJA' } },
    ]);
    // El período: un inicio, activo o futuro; la categoría existe.
    const codigo = (x: ComandoDominio) => rechazos(ejecutar(base(), x)).map((r) => r.codigo);
    expect(codigo(op14('GAS', f('2027-03-02'), 10))).toEqual(['periodo_no_valido']);
    expect(codigo(op14('GAS', FEB, 10))).toEqual(['periodo_cerrado']);
    expect(codigo(op14('GAS', ENE, 0))).toEqual(['periodo_cerrado']);
    expect(codigo(op14('NADA', MAR, 10))).toEqual(['no_encontrado']);
  });

  it('PRU-DOM-PRES-101 [CB-10, AV-18] OP-14 y OP-17: con LPA negativo al cierre se bloquean las asignaciones futuras y el auto-asignar no hace nada', () => {
    // Super recibió 1.200 en febrero (cerrado) y Salidas 100 en abril: LPA = 1.000 − 1.300 = −300.
    const h = base([asignacion('SUPER', FEB, 1200), asignacion('SAL', ABR, 100)]);
    expect(lpa(h)).toBe(c(-300));
    expect(rechazos(ejecutar(h, op14('GAS', ABR, 10)))).toEqual([
      { codigo: 'lpa_negativo_en_futuro', datos: { faltante: c(310) } },
    ]);
    // Devolver dinero de un futuro sube LPA: no es una asignación y no se bloquea (I1).
    const devuelto = ejecutar(h, op14('SAL', ABR, 40));
    expect(lpa(exito(devuelto).hechosNuevos)).toBe(c(-240));
    expect(aviso(devuelto, 'AV-11')).toBeUndefined();
    // En el activo sigue siendo posible, con AV-11.
    expect(aviso(ejecutar(h, op14('GAS', MAR, 10)), 'AV-11')?.datos).toEqual({ lpa: c(-310) });
    for (const p of [MAR, ABR]) {
      const r = ejecutar(h, op17(p));
      expect(exito(r).cambios).toEqual([]);
      expect(aviso(r, 'AV-18')?.datos).toEqual({ MASC: c(50), ROPA: c(80) });
    }
  });

  it('PRU-DOM-PRES-101 [AV-18] OP-17: cubre las faltas por orden de grupo y categoría hasta agotar LPA, sin dejarlo negativo; las archivadas no cuentan', () => {
    // Todo cubierto: sin AV-18; la meta de Vieja (archivada) no se evalúa.
    const todo = exito(ejecutar(base(), op17(MAR)));
    expect(todo.avisos.find((a) => a.codigo === 'AV-18')).toBeUndefined();
    expect([asig(todo.hechosNuevos, 'MASC', MAR), asig(todo.hechosNuevos, 'ROPA', MAR)]).toEqual([
      c(50),
      c(80),
    ]);
    expect(asig(todo.hechosNuevos, 'VIEJA', MAR)).toBe(c(25));
    // LPA 100 y Mascota con 20 asignados: Mascota recibe 30 (A antes que B), Ropa 70 y le faltan 10.
    for (const p of [MAR, ABR]) {
      const h = base([asignacion('SUPER', MAR, 880), asignacion('MASC', p, 20)]);
      expect(lpa(h)).toBe(c(100));
      const r = ejecutar(h, op17(p));
      const nuevos = exito(r).hechosNuevos;
      expect([asig(nuevos, 'MASC', p), asig(nuevos, 'ROPA', p)]).toEqual([c(50), c(70)]);
      expect(lpa(nuevos)).toBe(c(0));
      expect(aviso(r, 'AV-18')?.datos).toEqual({ ROPA: c(10) });
    }
    // Solo el subconjunto pedido.
    const ropa = exito(ejecutar(base(), op17(MAR, ['ROPA', 'SUPER']))).hechosNuevos;
    expect([asig(ropa, 'MASC', MAR), asig(ropa, 'ROPA', MAR)]).toEqual([0, c(80)]);
    const codigo = (x: ComandoDominio) => rechazos(ejecutar(base(), x)).map((r) => r.codigo);
    expect(codigo(op17(FEB))).toEqual(['periodo_cerrado']);
    expect(codigo(op17(f('2027-04-02')))).toEqual(['periodo_no_valido']);
  });

  it('PRU-DOM-PRES-101 OP-15: mover cambia dos celdas sin tocar LPA; el origen puede quedar sobregirado o estar archivado', () => {
    const h = base([asignacion('SUPER', MAR, 600)]);
    const r = exito(ejecutar(h, op15('SUPER', 'GAS', MAR, 100)));
    expect(r.cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'asignaciones',
        id: 'asig-SUPER-2027-03-01',
        campos: { monto: c(500) },
      },
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: {
          id: expect.any(String) as string,
          categoriaId: 'GAS',
          periodoInicio: MAR,
          monto: c(100),
          revision: null,
        },
      },
    ]);
    expect(r.impacto.deltaLpa).toBe(c(0));
    expect(r.avisos.find((a) => a.codigo === 'AV-11')).toBeUndefined();
    // Más que el Disponible: el origen queda sobregirado (YNAB).
    const sobre = exito(ejecutar(h, op15('SUPER', 'GAS', MAR, 700))).hechosNuevos;
    expect([asig(sobre, 'SUPER', MAR), lpa(sobre)]).toEqual([c(-100), c(400)]);
    // En un futuro y hacia una categoría de pago.
    const futuro = exito(ejecutar(h, op15('SUPER', 'P', ABR, 50))).hechosNuevos;
    expect([asig(futuro, 'SUPER', ABR), asig(futuro, 'P', ABR), lpa(futuro)]).toEqual([
      c(-50),
      c(50),
      c(400),
    ]);
    // Desde una archivada equivale a OP-11: hasta su Disponible.
    expect(asig(exito(ejecutar(h, op15('VIEJA', 'GAS', MAR, 25))).hechosNuevos, 'VIEJA', MAR)).toBe(
      0,
    );
    expect(rechazos(ejecutar(h, op15('VIEJA', 'GAS', MAR, 30)))).toEqual([
      { codigo: 'monto_mayor_que_disponible', datos: { categoriaId: 'VIEJA', disponible: c(25) } },
    ]);
    const codigo = (x: ComandoDominio) => rechazos(ejecutar(h, x)).map((y) => y.codigo);
    expect(codigo(op15('SUPER', 'SUPER', MAR, 10))).toEqual(['destino_igual_origen']);
    expect(codigo(op15('SUPER', 'VIEJA', MAR, 10))).toEqual(['categoria_archivada']);
    expect(codigo(op15('SUPER', 'GAS', FEB, 10))).toEqual(['periodo_cerrado']);
    expect(codigo(op15('SUPER', 'NADA', MAR, 10))).toEqual(['no_encontrado']);
    expect(() => ejecutar(h, op15('SUPER', 'GAS', MAR, 0))).toThrow(TypeError);
  });

  it('PRU-DOM-PRES-101 [CB-27] OP-18: crear, editar y eliminar una meta; la fecha objetivo pasada se rechaza al crear', () => {
    const crear = (x: string, extra: Partial<Meta> = {}): ComandoDominio => ({
      operacion: 'OP-18',
      accion: 'crear',
      id: id('M1'),
      categoriaId: id(x),
      tipo: 'para_fecha',
      monto: c(300),
      fechaObjetivo: HOY,
      ...extra,
    });
    expect(rechazos(ejecutar(base(), crear('GAS', { fechaObjetivo: f('2027-03-14') })))).toEqual([
      { codigo: 'fecha_objetivo_pasada', campo: 'fechaObjetivo', datos: { hoy: HOY } },
    ]);
    expect(exito(ejecutar(base(), crear('GAS'))).cambios).toEqual([
      {
        tipo: 'insertar',
        tabla: 'metas',
        fila: {
          id: 'M1',
          categoriaId: 'GAS',
          tipo: 'para_fecha',
          modo: null,
          monto: c(300),
          fechaObjetivo: HOY,
          fechaCreacion: HOY,
          revision: null,
        },
      },
    ]);
    const anual = crear('SAL', { tipo: 'anual', fechaObjetivo: null });
    expect(exito(ejecutar(base(), anual)).cambios).toHaveLength(1);
    const codigo = (x: ComandoDominio, h = base()) => rechazos(ejecutar(h, x)).map((r) => r.codigo);
    expect(codigo(crear('MASC'))).toEqual(['meta_ya_existe']);
    expect(codigo(crear('P'))).toEqual(['meta_en_categoria_de_pago']);
    expect(codigo(crear('VIEJA'))).toEqual(['categoria_archivada']);
    expect(codigo(crear('NADA'))).toEqual(['no_encontrado']);
    // Contrato (03 ck_metas_*): monto > 0; modo solo y siempre en mensuales y semanales.
    for (const extra of [
      { monto: c(0) },
      { tipo: 'mensual' as const, fechaObjetivo: null },
      { tipo: 'semanal' as const, modo: 'acumular' as const },
      { modo: 'acumular' as const },
      { fechaObjetivo: null },
    ])
      expect(() => ejecutar(base(), crear('GAS', extra))).toThrow(TypeError);

    // Editar una vencida: extender la fecha y ajustar el monto (sin exigir ≥ hoy).
    const vencida = meta('SAL', 300, { tipo: 'para_fecha', modo: null, fechaObjetivo: FEB });
    const h = { ...base(), metas: [...base().metas, vencida] };
    const editar: ComandoDominio = {
      operacion: 'OP-18',
      accion: 'editar',
      metaId: id('meta-SAL'),
      monto: c(400),
      fechaObjetivo: f('2027-06-30'),
    };
    expect(exito(ejecutar(h, editar)).cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'metas',
        id: 'meta-SAL',
        campos: { monto: c(400), fechaObjetivo: f('2027-06-30') },
      },
    ]);
    const quitar = {
      operacion: 'OP-18',
      accion: 'editar',
      metaId: id('meta-SAL'),
      fechaObjetivo: null,
    };
    expect(() => ejecutar(h, quitar as ComandoDominio)).toThrow(TypeError);
    const modo = {
      operacion: 'OP-18',
      accion: 'editar',
      metaId: id('meta-MASC'),
      modo: 'rellenar_hasta',
    };
    expect(exito(ejecutar(h, modo as ComandoDominio)).cambios).toHaveLength(1);
    const enArchivada = {
      operacion: 'OP-18',
      accion: 'editar',
      metaId: id('meta-VIEJA'),
      monto: c(5),
    };
    expect(codigo(enArchivada as ComandoDominio, h)).toEqual(['categoria_archivada']);
    const eliminar = (m: string): ComandoDominio => ({
      operacion: 'OP-18',
      accion: 'eliminar',
      metaId: id(m),
    });
    expect(exito(ejecutar(h, eliminar('meta-VIEJA'))).cambios).toEqual([
      { tipo: 'eliminar', tabla: 'metas', id: 'meta-VIEJA' },
    ]);
    expect(codigo(eliminar('nada'), h)).toEqual(['no_encontrado']);
  });
});

// ── TA-136: OP-16 y OP-19 (01 §5.3, §4.2 punto 9, CF-17, CF-25; 04 §3.3, §6.14.4).
const op16 = (x: string, p: FechaLocal, variante: VarianteAsignacionRapida): ComandoDominio => ({
  operacion: 'OP-16',
  categoriaId: id(x),
  periodoInicio: p,
  variante,
  ids: contador(),
});
const op19 = (diaInicio: number): ComandoDominio => ({
  operacion: 'OP-19',
  diaInicio,
  ids: contador(),
});
/** Un gasto en efectivo de E hacia la categoría x, registrado con OP-20. */
function gasto(h: Hechos, x: string, fecha: FechaLocal, monto: Centavos, hoy: FechaLocal) {
  const ids = contador();
  const comando: ComandoDominio = {
    operacion: 'OP-20',
    id: ids.siguiente(),
    instante: '2027-01-01T12:00:00.000Z' as Instante,
    ids,
    fecha,
    total: monto,
    cuentaId: id('E'),
    lineas: [{ monto, destino: { categoriaId: id(x) } }],
  };
  return exito(ejecutar(h, comando, hoy)).hechosNuevos;
}
const rapida = (h: Hechos, x: string, p: FechaLocal, hoy = HOY) => {
  const i = calcular(h, hoy);
  return asignacionRapida(i, id(x), periodoDe(i.ciclo, p));
};

/** ESC-45: hoy 10 nov 2027 (período 21 oct – 20 nov), ciclo 21, Super(fut) 100 en 21 nov – 20 dic. */
const HOY45 = f('2027-11-10');
const [NOV21, DIC21, ENE21] = [f('2027-11-21'), f('2027-12-21'), f('2028-01-21')];
const vigencia = (diaInicio: number, rigeDesde: FechaLocal | null) => ({
  id: id(`v-${diaInicio}-${rigeDesde}`),
  diaInicio,
  rigeDesde,
  revision: null,
});
const esc45 = (
  asignaciones: readonly Asignacion[] = [],
  vigencias: Hechos['vigencias_ciclo'] = [],
): Hechos => ({
  ...base(),
  vigencias_ciclo: [vigencia(21, null), ...vigencias],
  asignaciones: [asignacion('SUPER', NOV21, 100), ...asignaciones],
});
const insertadas = (r: ResultadoAplicar) =>
  exito(r).cambios.flatMap((x) =>
    x.tipo === 'insertar' && x.tabla === 'vigencias_ciclo'
      ? [{ diaInicio: x.fila.diaInicio, rigeDesde: x.fila.rigeDesde }]
      : [],
  );
const eliminadas = (r: ResultadoAplicar) =>
  exito(r).cambios.flatMap((x) =>
    x.tipo === 'eliminar' && x.tabla === 'vigencias_ciclo' ? [x.id] : [],
  );
const periodoNuevo = (r: ResultadoAplicar, fecha: string) =>
  periodoDe(calcular(exito(r).hechosNuevos, HOY45).ciclo, f(fecha));
const enero = { inicio: f('2028-01-01'), fin: f('2028-01-31'), transicion: false };

describe('PRU-DOM-PRES-103: aplicar, asignación rápida y cambiar el ciclo (01 §5.3, 04 §3.3)', () => {
  it('PRU-DOM-PRES-103 [AV-11] OP-16 "lo que falta para la meta" y "lo mismo que el período pasado": el valor de Asig con las reglas de OP-14', () => {
    const h = base([asignacion('MASC', MAR, 20), asignacion('SUPER', FEB, 600)]);
    // Falta(MASC, MAR) = 50 − 20: Asig queda en 50; en abril, la meta entera.
    expect(rapida(h, 'MASC', MAR)).toEqual({ faltaMeta: c(50), igualPeriodoAnterior: c(0) });
    const marzo = exito(ejecutar(h, op16('MASC', MAR, 'falta_meta')));
    expect(asig(marzo.hechosNuevos, 'MASC', MAR)).toBe(c(50));
    const abril = exito(ejecutar(h, op16('MASC', ABR, 'falta_meta')));
    expect(asig(abril.hechosNuevos, 'MASC', ABR)).toBe(c(50));
    // Sin meta, la variante no se ofrece (04 §6.14.4).
    expect(rapida(h, 'GAS', MAR).faltaMeta).toBeUndefined();
    expect(() => ejecutar(h, op16('GAS', MAR, 'falta_meta'))).toThrow(TypeError);
    // Asig(SUPER, MAR) = Asig(SUPER, FEB) = 600 > LPA 380: en el activo, con AV-11 (OP-14).
    const activo = ejecutar(h, op16('SUPER', MAR, 'igual_periodo_anterior'));
    expect(asig(exito(activo).hechosNuevos, 'SUPER', MAR)).toBe(c(600));
    expect(aviso(activo, 'AV-11')?.datos).toEqual({ lpa: c(-220) });
    // En un futuro, el mismo valor se rechaza (I1); en un cerrado, también (inv. 18).
    const conMarzo = base([asignacion('SUPER', MAR, 600)]);
    expect(rechazos(ejecutar(conMarzo, op16('SUPER', ABR, 'igual_periodo_anterior')))).toEqual([
      { codigo: 'lpa_negativo_en_futuro', datos: { faltante: c(200) } },
    ]);
    expect(rechazos(ejecutar(h, op16('SUPER', FEB, 'igual_periodo_anterior')))).toEqual([
      { codigo: 'periodo_cerrado', datos: { periodoInicio: FEB } },
    ]);
  });

  it('PRU-DOM-PRES-103 OP-16 "el promedio de gasto" con CF-17: los últimos 3 períodos cerrados en que existía la categoría, o los que haya, con la mitad hacia arriba', () => {
    const MAY = f('2027-05-01');
    const hoy = f('2027-05-15');
    // Sin ningún período cerrado en que existiera, la variante no se ofrece.
    expect(rapida(base(), 'GAS', MAY, hoy).promedioGasto).toBeUndefined();
    expect(() => ejecutar(base(), op16('GAS', MAY, 'promedio_gasto'), hoy)).toThrow(TypeError);
    // Un período: enero, 40.
    const uno = gasto(base(), 'GAS', ENE, c(40), hoy);
    expect(rapida(uno, 'GAS', MAY, hoy).promedioGasto).toEqual({ monto: c(40), periodos: 1 });
    // Dos períodos: (10.01 + 10.00) / 2 = 10.005 → 10.01.
    const dos = gasto(
      gasto(base(), 'SAL', ENE, Centavos.desdeEntero(1001), hoy),
      'SAL',
      MAR,
      c(10),
      hoy,
    );
    const promedioDos = { monto: Centavos.desdeEntero(1001), periodos: 2 };
    expect(rapida(dos, 'SAL', MAY, hoy).promedioGasto).toEqual(promedioDos);
    // Cuatro períodos en que existía: enero (90), febrero (solo Asig ≠ 0, gastado 0), marzo (30) y
    // abril (33). Van los 3 últimos: (0 + 30 + 33) / 3 = 21, y Asig(GAS, MAY) queda en 21.
    let h = base([asignacion('GAS', FEB, 5)]);
    for (const [fecha, monto] of [
      [ENE, 90],
      [MAR, 30],
      [ABR, 33],
    ] as const)
      h = gasto(h, 'GAS', fecha, c(monto), hoy);
    expect(rapida(h, 'GAS', MAY, hoy).promedioGasto).toEqual({ monto: c(21), periodos: 3 });
    const r = exito(ejecutar(h, op16('GAS', MAY, 'promedio_gasto'), hoy));
    expect(asig(r.hechosNuevos, 'GAS', MAY)).toBe(c(21));
  });

  it('PRU-DOM-PRES-103 OP-16 "cubrir el sobregiro" de CF-25: Asig + máx(0, −Disp), solo si Disp < 0', () => {
    const h = gasto(base([asignacion('SUPER', MAR, 10)]), 'SUPER', f('2027-03-05'), c(25), HOY);
    // Disp(SUPER, MAR) = 10 − 25 = −15: Asig queda en 25 y Disp en 0.
    expect(rapida(h, 'SUPER', MAR).cubrirSobregiro).toBe(c(25));
    const r = exito(ejecutar(h, op16('SUPER', MAR, 'cubrir_sobregiro')));
    expect(asig(r.hechosNuevos, 'SUPER', MAR)).toBe(c(25));
    const celdas = calcular(r.hechosNuevos, HOY).presupuesto.celdas;
    const celda = celdas.find((x) => x.categoriaId === 'SUPER' && x.periodo.inicio === MAR);
    expect(celda?.disponible).toBe(c(0));
    // Sin sobregiro no se ofrece.
    expect(rapida(r.hechosNuevos, 'SUPER', MAR).cubrirSobregiro).toBeUndefined();
    const otra = () => ejecutar(r.hechosNuevos, op16('SUPER', MAR, 'cubrir_sobregiro'));
    expect(otra).toThrow(TypeError);
  });

  it('PRU-DOM-PRES-103 [ESC-45, AV-12] OP-19: R es el período siguiente al último con asignaciones, con el período de transición de Q5', () => {
    const h = esc45();
    const r = ejecutar(h, op19(1), HOY45);
    expect(insertadas(r)).toEqual([{ diaInicio: 1, rigeDesde: DIC21 }]);
    expect(eliminadas(r)).toEqual([]);
    expect(aviso(r, 'AV-12')).toEqual({
      codigo: 'AV-12',
      momento: 'antes',
      requiereConfirmacion: true,
      datos: {
        diaInicio: 1,
        rigeDesde: DIC21,
        transicionInicio: DIC21,
        transicionFin: f('2027-12-31'),
      },
    });
    // 21 nov – 20 dic sin cambio; 21 – 31 dic (11 días, transición); 1 – 31 ene.
    const noviembre = { inicio: NOV21, fin: f('2027-12-20'), transicion: false };
    expect(periodoNuevo(r, '2027-12-01')).toEqual(noviembre);
    const transicion = { inicio: DIC21, fin: f('2027-12-31'), transicion: true };
    expect(periodoNuevo(r, '2027-12-25')).toEqual(transicion);
    expect(periodoNuevo(r, '2028-01-15')).toEqual(enero);
    // Sin cambios de dinero: LPA igual.
    expect(lpa(exito(r).hechosNuevos, HOY45)).toBe(lpa(h, HOY45));
    // Paso 2: metas en la transición; semanal de 50 → 78.57, mensual de 200 → 200.
    const despues = calcular(exito(r).hechosNuevos, HOY45);
    const p = periodoDe(despues.ciclo, DIC21);
    const cat = { id: id('SUPER'), archivada: false };
    const montoDe = (m: Meta) =>
      evaluarMeta(m, cat, despues.presupuesto, despues.ciclo, HOY45, p)?.montoDelPeriodo;
    expect(montoDe(meta('SUPER', 50, { tipo: 'semanal' }))).toBe(Centavos.desdeEntero(7857));
    expect(montoDe(meta('SUPER', 200))).toBe(c(200));
    // Paso 1′: si 21 dic – 20 ene también tuviera asignaciones, R = 21 ene (transición 21 – 31 ene).
    const r1 = ejecutar(esc45([asignacion('GAS', DIC21, 10)]), op19(1), HOY45);
    expect(insertadas(r1)).toEqual([{ diaInicio: 1, rigeDesde: ENE21 }]);
    expect(aviso(r1, 'AV-12')?.datos).toMatchObject({ transicionFin: f('2028-01-31') });
    // El día vigente se rechaza.
    expect(rechazos(ejecutar(h, op19(21), HOY45))).toEqual([
      { codigo: 'ciclo_sin_cambio', datos: { dia: 21 } },
    ]);
  });

  it('PRU-DOM-PRES-103 [CB-12, AV-12] OP-19: con asignaciones lejanas R siempre existe; sin asignaciones futuras es el primer período futuro', () => {
    // CB-12: una asignación en 21 mar 2028 deja R = 21 abr 2028.
    const lejos = ejecutar(esc45([asignacion('GAS', f('2028-03-21'), 10)]), op19(5), HOY45);
    expect(insertadas(lejos)).toEqual([{ diaInicio: 5, rigeDesde: f('2028-04-21') }]);
    // Solo el activo con asignaciones: R es el primer período futuro, 21 nov.
    const soloActivo = { ...esc45(), asignaciones: [asignacion('SUPER', f('2027-10-21'), 100)] };
    const r = ejecutar(soloActivo, op19(1), HOY45);
    expect(insertadas(r)).toEqual([{ diaInicio: 1, rigeDesde: NOV21 }]);
    expect(aviso(r, 'AV-12')?.datos).toMatchObject({ transicionFin: f('2027-11-30') });
    // Sin transición: del día 31 al 30, R = 30 abr 2027 ya es IM(abr, 30).
    const del31 = { ...base(), asignaciones: [], vigencias_ciclo: [vigencia(31, null)] };
    const sin = ejecutar(del31, op19(30), f('2027-04-10'));
    expect(insertadas(sin)).toEqual([{ diaInicio: 30, rigeDesde: f('2027-04-30') }]);
    expect(aviso(sin, 'AV-12')?.datos).toEqual({ diaInicio: 30, rigeDesde: f('2027-04-30') });
  });

  it('PRU-DOM-PRES-103 [CB-12, AV-12] OP-19: una vigencia futura que aún no rige se reemplaza, salvo que ya tenga períodos con asignaciones', () => {
    const pendiente = vigencia(1, DIC21);
    // Reemplazo: (1, 21 dic) se elimina y entra (15, 21 dic); transición 21 dic – 14 ene.
    const r = ejecutar(esc45([], [pendiente]), op19(15), HOY45);
    expect(eliminadas(r)).toEqual([pendiente.id]);
    expect(insertadas(r)).toEqual([{ diaInicio: 15, rigeDesde: DIC21 }]);
    expect(aviso(r, 'AV-12')?.datos).toMatchObject({ transicionFin: f('2028-01-14') });
    // El día de la vigencia que regirá no cambia nada (ya aplicada, 04 OP-19).
    expect(exito(ejecutar(esc45([], [pendiente]), op19(1), HOY45)).cambios).toEqual([]);
    // Con una asignación en 1 ene (un período de la pendiente), esa vigencia queda y R = 1 feb.
    const enEnero = asignacion('GAS', f('2028-01-01'), 10);
    const r2 = ejecutar(esc45([enEnero], [pendiente]), op19(15), HOY45);
    expect(eliminadas(r2)).toEqual([]);
    expect(insertadas(r2)).toEqual([{ diaInicio: 15, rigeDesde: f('2028-02-01') }]);
    expect(periodoNuevo(r2, '2028-01-15')).toEqual(enero);
    // Volver al día de la pendiente con asignaciones: solo se elimina la posterior (15, 1 feb).
    const posterior = vigencia(15, f('2028-02-01'));
    const r3 = ejecutar(esc45([enEnero], [pendiente, posterior]), op19(1), HOY45);
    expect(eliminadas(r3)).toEqual([posterior.id]);
    expect(insertadas(r3)).toEqual([]);
    expect(periodoNuevo(r3, '2028-02-15').inicio).toBe(f('2028-02-01'));
    expect(periodoNuevo(r3, '2028-01-15')).toEqual(enero);
  });
});
