import { describe, expect, it } from 'vitest';
import { avisosDeEstado } from '../avisos/estado';
import { calcular } from '../calculo/calcular';
import type {
  Asignacion,
  Categoria,
  ComandoDominio,
  ComandoOp09,
  GeneradorIds,
  Grupo,
  Hechos,
  Instante,
  Meta,
  Programada,
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
const [ENE, MAR, ABR] = [f('2027-01-01'), f('2027-03-01'), f('2027-04-01')];

const contador = (): GeneradorIds => {
  let n = 0;
  return { siguiente: () => id(`n${++n}`) };
};

const grupo = (g: string, nombre: string, orden: number, extra: Partial<Grupo> = {}): Grupo => ({
  id: id(g),
  nombre,
  orden,
  archivado: false,
  claveSistema: null,
  revision: null,
  ...extra,
});
const categoria = (
  cat: string,
  nombre: string,
  g: string,
  orden: number,
  extra: Partial<Categoria> = {},
): Categoria => ({
  id: id(cat),
  grupoId: id(g),
  nombre,
  orden,
  clase: 'normal',
  tarjetaId: null,
  archivada: false,
  revision: null,
  ...extra,
});
const asignacion = (cat: string, periodo: FechaLocal, monto: number): Asignacion => ({
  id: id(`asig-${cat}-${periodo}`),
  categoriaId: id(cat),
  periodoInicio: periodo,
  monto: c(monto),
  revision: null,
});
const meta = (cat: string, monto: number): Meta => ({
  id: id(`meta-${cat}`),
  categoriaId: id(cat),
  tipo: 'mensual',
  modo: 'rellenar_hasta',
  monto: c(monto),
  fechaObjetivo: null,
  fechaCreacion: ENE,
  revision: null,
});
const programada = (p: string): Programada => ({
  id: id(p),
  tipo: 'gasto',
  cuentaId: id('E'),
  cuentaDestinoId: null,
  comercio: p,
  monto: c(10),
  tolerancia: c(0),
  frecuencia: 'mensual',
  frecuenciaDias: null,
  primeraFecha: f('2027-04-10'),
  fechaFin: null,
  registroAutomatico: false,
  activa: true,
  reactivadaDesde: null,
  revision: null,
});
const linea = (p: string, cat: string) => ({
  id: id(`${p}.1`),
  programadaId: id(p),
  orden: 1,
  monto: c(10),
  categoriaId: id(cat),
  revision: null,
});

/** Una transacción en E: saldo inicial sin `cat`, gasto con una línea hacia `cat`. */
function movimiento(tx: string, fecha: string, monto: number, cat?: string) {
  const hora = `${fecha}T12:00:00.000Z` as Instante;
  return {
    t: {
      id: id(tx),
      tipo: cat === undefined ? 'saldo_inicial' : 'gasto',
      fecha: f(fecha),
      horaRegistro: hora,
      claveOrden: hora,
      secuencia: null,
      origen: 'manual',
      estadoBancario: 'pendiente',
      conciliacionId: null,
      comercio: null,
      nota: null,
      total: c(Math.abs(monto)),
      monedaOriginal: null,
      montoOriginal: null,
      lineaCobradaId: null,
      revision: null,
    } as const,
    e: {
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id('E'),
      monto: c(monto),
      interes: null,
      seguro: null,
      revision: null,
    },
    l: (cat === undefined ? [] : [cat]).map((x) => ({
      id: id(`${tx}.1`),
      transaccionId: id(tx),
      orden: 1,
      monto: c(Math.abs(monto)),
      categoriaId: id(x),
      deudorId: null,
      lineaOriginalId: null,
      revision: null,
    })),
  };
}

/**
 * E (efectivo) con 1.000 de saldo inicial el 1 ene. ESC-42 en enero (cerrado): Café asignado 50 y
 * gasto 80 (SobD 30), Salidas asignado 100 y gasto 40 (arrastra 60); Café tiene meta de 50 y
 * Salidas de 100, y una programada activa (Q1) hacia Café. Luz (grupo Hogar): asignado 70 en marzo,
 * gasto 20, 30 en abril, meta de 40 y la programada Q2. Ropa: gasto 40 en marzo sin asignar.
 * Vieja (grupo Viejo, archivado) archivada con 25 en marzo. P, pago de la tarjeta T. Vacía y el
 * grupo Libre, sin nada.
 */
function base(): Hechos {
  const movs = [
    movimiento('si-E', '2027-01-01', 1000),
    movimiento('g-cafe', '2027-01-10', -80, 'CAFE'),
    movimiento('g-sal', '2027-01-12', -40, 'SAL'),
    movimiento('g-luz', '2027-03-05', -20, 'LUZ'),
    movimiento('g-ropa', '2027-03-06', -40, 'ROPA'),
  ];
  return {
    vigencias_ciclo: [{ id: id('v'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [
      {
        id: id('E'),
        tipo: 'efectivo',
        nombre: 'Efectivo',
        institucionId: null,
        ultimos4: null,
        fechaApertura: ENE,
        orden: 1,
        archivada: false,
        revision: null,
      },
      {
        id: id('T'),
        tipo: 'tarjeta',
        nombre: 'Visa',
        institucionId: null,
        ultimos4: null,
        fechaApertura: ENE,
        orden: 2,
        archivada: false,
        revision: null,
      },
    ],
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
      grupo('PT', 'Pagos de tarjeta', 0, { claveSistema: 'pagos_tarjeta' }),
      grupo('G', 'Gastos', 1),
      grupo('H', 'Hogar', 2),
      grupo('Z', 'Viejo', 3, { archivado: true }),
      grupo('L', 'Libre', 4),
    ],
    categorias: [
      categoria('P', 'Visa', 'PT', 1, { clase: 'pago', tarjetaId: id('T') }),
      categoria('CAFE', 'Café', 'G', 1),
      categoria('SAL', 'Salidas', 'G', 2),
      categoria('VAC', 'Vacía', 'G', 3),
      categoria('ROPA', 'Ropa', 'G', 4),
      categoria('LUZ', 'Luz', 'H', 1),
      categoria('VIEJA', 'Vieja', 'Z', 1, { archivada: true }),
    ],
    asignaciones: [
      asignacion('CAFE', ENE, 50),
      asignacion('SAL', ENE, 100),
      asignacion('LUZ', MAR, 70),
      asignacion('LUZ', ABR, 30),
      asignacion('VIEJA', MAR, 25),
    ],
    deudores: [],
    transacciones: movs.map((m) => m.t),
    efectos: movs.map((m) => m.e),
    lineas: movs.flatMap((m) => m.l),
    condonaciones: [],
    metas: [meta('CAFE', 50), meta('SAL', 100), meta('LUZ', 40)],
    programadas: [programada('Q1'), programada('Q2')],
    programada_lineas: [linea('Q1', 'CAFE'), linea('Q2', 'LUZ')],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
}

const ejecutar = (h: Hechos, comando: ComandoDominio) => aplicar(h, comando, HOY);
const exito = (r: ResultadoAplicar) => {
  if (!r.ok) throw new Error(`rechazada: ${JSON.stringify(r.rechazos)}`);
  return r;
};
const codigos = (r: ResultadoAplicar) => (r.ok ? [] : r.rechazos.map((x) => x.codigo));
const codigo = (comando: ComandoDominio, h = base()) => codigos(ejecutar(h, comando));
const disp = (h: Hechos, cat: string) =>
  calcular(h, HOY).presupuesto.celdas.find((x) => x.categoriaId === cat && x.periodo.inicio === MAR)
    ?.disponible;
const lpa = (h: Hechos) => calcular(h, HOY).lpa.total;

describe('PRU-DOM-CATEG-101: aplicar, grupos y categorías (01 §5.2, 04 §3.2)', () => {
  it('PRU-DOM-CATEG-101 OP-07: crea un grupo o una categoría normal al final de su lista; rechaza el nombre repetido sin mayúsculas, el grupo archivado y "Pagos de tarjeta"', () => {
    const grupoNuevo = { operacion: 'OP-07', id: id('N'), tipo: 'grupo', nombre: 'Ocio' } as const;
    expect(exito(ejecutar(base(), grupoNuevo)).cambios).toEqual([
      { tipo: 'insertar', tabla: 'grupos', fila: grupo('N', 'Ocio', 5) },
    ]);
    const cat = (nombre: string, g: string): ComandoDominio => ({
      operacion: 'OP-07',
      id: id('N'),
      tipo: 'categoria',
      nombre,
      grupoId: id(g),
    });
    expect(exito(ejecutar(base(), cat('Cine', 'G'))).cambios).toEqual([
      { tipo: 'insertar', tabla: 'categorias', fila: categoria('N', 'Cine', 'G', 5) },
    ]);
    expect(codigo({ ...grupoNuevo, nombre: 'GASTOS' })).toEqual(['nombre_repetido']);
    expect(ejecutar(base(), cat('café', 'G'))).toEqual({
      ok: false,
      rechazos: [
        { codigo: 'nombre_repetido', campo: 'nombre', datos: { nombre: 'café', grupo: 'Gastos' } },
      ],
    });
    // El mismo nombre en otro grupo sí se puede.
    expect(ejecutar(base(), cat('Café', 'H')).ok).toBe(true);
    expect(codigo(cat('Cine', 'Z'))).toEqual(['grupo_archivado']);
    expect(codigo(cat('Cine', 'PT'))).toEqual(['grupo_del_sistema']);
    expect(codigo(cat('Cine', 'NO'))).toEqual(['no_encontrado']);
    expect(() => ejecutar(base(), { ...grupoNuevo, tipo: 'categoria' })).toThrow(TypeError);
  });

  it('PRU-DOM-CATEG-101 OP-09: archivar es compuesta (Disp a 0 contra el destino, futuras a LPA, programadas decididas) y conserva la meta sin evaluarla (B-11)', () => {
    const archivar: ComandoOp09 = {
      operacion: 'OP-09',
      categoriaId: id('LUZ'),
      ids: contador(),
      destinoDisponible: { categoriaId: id('SAL') },
      devolverAsignacionesFuturas: true,
      programadas: [{ programadaId: id('Q2'), accion: 'desactivar' }],
    };
    expect(disp(base(), 'LUZ')).toBe(c(50));
    const r = exito(ejecutar(base(), archivar));
    expect(r.cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'asignaciones',
        id: 'asig-LUZ-2027-03-01',
        campos: { monto: c(20) },
      },
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: { ...asignacion('SAL', MAR, 50), id: 'n1' },
      },
      { tipo: 'eliminar', tabla: 'asignaciones', id: 'asig-LUZ-2027-04-01' },
      { tipo: 'actualizar', tabla: 'programadas', id: 'Q2', campos: { activa: false } },
      { tipo: 'actualizar', tabla: 'categorias', id: 'LUZ', campos: { archivada: true } },
    ]);
    const h = r.hechosNuevos;
    expect(disp(h, 'LUZ')).toBe(c(0));
    expect(r.impacto.deltaLpa).toBe(c(30)); // vuelve lo asignado en abril
    expect(r.impacto.deltaDisponible).toEqual([
      { categoriaId: 'LUZ', delta: c(-50) },
      { categoriaId: 'SAL', delta: c(50) },
    ]);
    // B-11: la meta sigue en los hechos, sin evaluarse mientras está archivada.
    const evaluacion = (x: Hechos) =>
      calcular(x, HOY).metas.find((m) => m.categoriaId === 'LUZ')?.evaluacion;
    expect(h.metas.some((m) => m.categoriaId === 'LUZ')).toBe(true);
    expect(evaluacion(h)).toBeNull();
    // Vuelve a evaluarse si la categoría deja de estar archivada.
    const activa = { ...h, categorias: h.categorias.map((x) => ({ ...x, archivada: false })) };
    expect(evaluacion(activa)).not.toBeNull();

    // Reasignar la programada en lugar de desactivarla.
    const reasignar = {
      programadaId: id('Q2'),
      accion: 'reasignar',
      categoriaId: id('SAL'),
    } as const;
    expect(
      exito(ejecutar(base(), { ...archivar, programadas: [reasignar] })).cambios,
    ).toContainEqual({
      tipo: 'actualizar',
      tabla: 'programada_lineas',
      id: 'Q2.1',
      campos: { categoriaId: 'SAL' },
    });
    // Sin bloqueos, solo se archiva.
    const vacia = exito(
      ejecutar(base(), { operacion: 'OP-09', categoriaId: id('VAC'), ids: contador() }),
    );
    expect(vacia.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'categorias', id: 'VAC', campos: { archivada: true } },
    ]);
  });

  it('PRU-DOM-CATEG-101 OP-09: un sobregiro se cubre desde LPA; cada precondición tiene su rechazo', () => {
    const ropa: ComandoOp09 = { operacion: 'OP-09', categoriaId: id('ROPA'), ids: contador() };
    expect(disp(base(), 'ROPA')).toBe(c(-40));
    const r = exito(ejecutar(base(), { ...ropa, cubrirSobregiroCon: 'lpa' }));
    expect(r.cambios[0]).toEqual({
      tipo: 'insertar',
      tabla: 'asignaciones',
      fila: { ...asignacion('ROPA', MAR, 40), id: 'n1' },
    });
    expect(disp(r.hechosNuevos, 'ROPA')).toBe(c(0));
    expect(r.impacto.deltaLpa).toBe(c(-40));
    expect(codigo({ ...ropa, destinoDisponible: 'lpa' })).toEqual(['conflicto_desactualizado']);

    const sinDestino: ComandoOp09 = {
      operacion: 'OP-09',
      categoriaId: id('LUZ'),
      ids: contador(),
      devolverAsignacionesFuturas: true,
      programadas: [{ programadaId: id('Q2'), accion: 'desactivar' }],
    };
    const luz: ComandoOp09 = { ...sinDestino, destinoDisponible: 'lpa' };
    expect(exito(ejecutar(base(), luz)).impacto.deltaLpa).toBe(c(80));
    const destino = (d: string) => codigo({ ...luz, destinoDisponible: { categoriaId: id(d) } });
    expect(destino('LUZ')).toEqual(['destino_igual_origen']);
    expect(destino('VIEJA')).toEqual(['categoria_archivada']);
    expect(destino('P')).toEqual(['categoria_de_pago_no_permitida']);
    expect(destino('NO')).toEqual(['no_encontrado']);
    expect(codigo(sinDestino)).toEqual(['conflicto_desactualizado']);
    expect(codigo({ ...luz, devolverAsignacionesFuturas: false })).toEqual([
      'conflicto_desactualizado',
    ]);
    expect(ejecutar(base(), { ...luz, programadas: [] })).toEqual({
      ok: false,
      rechazos: [{ codigo: 'programada_sin_decision', datos: { categoriaId: 'LUZ', n: 1 } }],
    });
    const a = (cat: string) => [
      { programadaId: id('Q2'), accion: 'reasignar', categoriaId: id(cat) } as const,
    ];
    expect(codigo({ ...luz, programadas: a('VIEJA') })).toEqual(['categoria_archivada']);
    expect(codigo({ ...ropa, categoriaId: id('P') })).toEqual(['categoria_de_pago_con_tarjeta']);
    expect(codigo({ ...ropa, categoriaId: id('VIEJA') })).toEqual(['categoria_ya_archivada']);
    expect(codigo({ ...ropa, categoriaId: id('NO') })).toEqual(['no_encontrado']);
  });

  it('PRU-DOM-CATEG-101 OP-11: sacar el Disponible de una archivada hacia una categoría activa o LPA, hasta Disp(c, A); en 0 desaparece AV-14', () => {
    const sacar = (monto: number, destino: string, cat = 'VIEJA') =>
      ejecutar(base(), {
        operacion: 'OP-11',
        categoriaId: id(cat),
        ids: contador(),
        monto: c(monto),
        destino: destino === 'lpa' ? 'lpa' : { categoriaId: id(destino) },
      });
    const av14 = (h: Hechos) =>
      avisosDeEstado(calcular(h, HOY)).some((x) => x.aviso === 'AV-14' && x.clave === 'VIEJA');
    expect(av14(base())).toBe(true);
    const parcial = exito(sacar(10, 'SAL'));
    expect(parcial.cambios).toEqual([
      {
        tipo: 'actualizar',
        tabla: 'asignaciones',
        id: 'asig-VIEJA-2027-03-01',
        campos: { monto: c(15) },
      },
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: { ...asignacion('SAL', MAR, 10), id: 'n1' },
      },
    ]);
    expect(av14(parcial.hechosNuevos)).toBe(true);
    const todo = exito(sacar(25, 'lpa'));
    expect(todo.cambios).toEqual([
      { tipo: 'eliminar', tabla: 'asignaciones', id: 'asig-VIEJA-2027-03-01' },
    ]);
    expect(todo.impacto.deltaLpa).toBe(c(25));
    expect(av14(todo.hechosNuevos)).toBe(false);
    expect(sacar(30, 'lpa')).toEqual({
      ok: false,
      rechazos: [
        {
          codigo: 'monto_mayor_que_disponible',
          datos: { categoriaId: 'VIEJA', disponible: c(25) },
        },
      ],
    });
    expect(codigos(sacar(5, 'lpa', 'SAL'))).toEqual(['categoria_no_archivada']);
    expect(codigos(sacar(5, 'VIEJA'))).toEqual(['destino_igual_origen']);
    expect(codigos(sacar(5, 'P'))).toEqual(['categoria_de_pago_no_permitida']);
    expect(codigos(sacar(5, 'lpa', 'NO'))).toEqual(['no_encontrado']);
    expect(() => sacar(0, 'lpa')).toThrow(TypeError);
  });

  it('PRU-DOM-CATEG-101 [AV-13, CB-20] OP-12 ESC-42: la fusión suma las asignaciones de los períodos cerrados (O4), mueve líneas, programadas y reglas, descarta la meta del origen y conserva la del destino', () => {
    const fusion = {
      operacion: 'OP-12',
      origenId: id('CAFE'),
      destinoId: id('SAL'),
      ids: contador(),
      reglas: [
        { id: id('R1'), patron: 'starbucks', categoriaId: id('CAFE') },
        { id: id('R2'), patron: 'cine', categoriaId: id('SAL') },
      ],
      movimientoLineas: [
        {
          id: id('ML1'),
          movimientoId: id('M1'),
          orden: 1,
          monto: c(5),
          categoriaId: id('CAFE'),
          deudorId: null,
          lineaOriginalId: null,
        },
      ],
    } as const;
    expect([lpa(base()), disp(base(), 'SAL')]).toEqual([c(1000 - 150 - 30 - 70 - 30 - 25), c(60)]);
    // LPA = 1.000 − asignado (150 en enero, 70 + 25 en marzo, 30 en abril) − SobD(Café, enero) 30.
    const r = exito(ejecutar(base(), fusion));
    const aSal = { categoriaId: 'SAL' };
    expect(r.cambios).toEqual([
      { tipo: 'actualizar', tabla: 'lineas', id: 'g-cafe.1', campos: aSal },
      { tipo: 'actualizar', tabla: 'programada_lineas', id: 'Q1.1', campos: aSal },
      { tipo: 'actualizar', tabla: 'reglas_comercio', id: 'R1', campos: aSal },
      { tipo: 'actualizar', tabla: 'movimiento_lineas', id: 'ML1', campos: aSal },
      { tipo: 'eliminar', tabla: 'asignaciones', id: 'asig-CAFE-2027-01-01' },
      { tipo: 'eliminar', tabla: 'metas', id: 'meta-CAFE' },
      { tipo: 'eliminar', tabla: 'categorias', id: 'CAFE' },
      {
        tipo: 'actualizar',
        tabla: 'asignaciones',
        id: 'asig-SAL-2027-01-01',
        campos: { monto: c(150) },
      },
    ]);
    expect(r.operacionDeclarada).toBe('fusion');
    // ESC-42: Δ LPA +30 (el SobD de Café en enero se compensa) y Δ Salidas(A) −30.
    expect(r.impacto.deltaLpa).toBe(c(30));
    expect(r.impacto.deltaDisponible).toEqual([{ categoriaId: 'SAL', delta: c(-30) }]);
    expect(r.avisos.map((a) => [a.codigo, a.requiereConfirmacion])).toEqual([
      ['AV-01', true],
      ['AV-13', true],
    ]);
    expect(r.avisos[1]?.datos).toEqual({
      origenId: 'CAFE',
      destinoId: 'SAL',
      'asignado:2027-01-01': c(50),
      programadas: 1,
      reglas: 1,
      metaDescartada: 'mensual',
    });
    // inv. 18 admite el cambio de enero solo en la fusión; CB-20: Salidas conserva su meta.
    const h = r.hechosNuevos;
    expect(
      h.asignaciones.find((a) => a.categoriaId === 'SAL' && a.periodoInicio === ENE)?.monto,
    ).toBe(c(150));
    expect(h.metas.map((m) => m.categoriaId).sort()).toEqual(['LUZ', 'SAL']);
    expect(h.categorias.some((x) => x.id === 'CAFE')).toBe(false);
    // Un origen archivado se fusiona; sin asignación del destino en el período se inserta, y una en 0
    // no escribe nada en el destino.
    const vieja = exito(
      ejecutar(
        { ...base(), asignaciones: [...base().asignaciones, asignacion('VIEJA', ABR, 0)] },
        { ...fusion, origenId: id('VIEJA'), ids: contador() },
      ),
    );
    expect(vieja.cambios.at(-1)).toEqual({
      tipo: 'insertar',
      tabla: 'asignaciones',
      fila: { ...asignacion('SAL', MAR, 25), id: 'n1' },
    });
    expect(vieja.avisos.map((a) => a.codigo)).toEqual(['AV-13']);
    expect(vieja.avisos[0]?.datos?.metaDescartada).toBe(false);
  });

  it('PRU-DOM-CATEG-101 [INV-23] OP-12: una categoría de pago no se fusiona ni como origen ni como destino; tampoco consigo misma ni hacia una archivada', () => {
    const fusion = (o: string, d: string) =>
      codigo({
        operacion: 'OP-12',
        origenId: id(o),
        destinoId: id(d),
        ids: contador(),
        reglas: [],
        movimientoLineas: [],
      });
    expect(fusion('P', 'SAL')).toEqual(['fusion_categoria_de_pago']);
    expect(fusion('SAL', 'P')).toEqual(['fusion_categoria_de_pago']);
    expect(fusion('SAL', 'SAL')).toEqual(['fusion_misma_categoria']);
    expect(fusion('SAL', 'VIEJA')).toEqual(['fusion_destino_archivado']);
    expect(fusion('NO', 'SAL')).toEqual(['no_encontrado']);
    expect(fusion('SAL', 'NO')).toEqual(['no_encontrado']);
  });
});
