import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
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
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar } from './aplicar';

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
