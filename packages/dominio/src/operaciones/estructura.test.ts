import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Categoria,
  ComandoDominio,
  ComandoOp08,
  ComandoOp13,
  ElementoOp07,
  Grupo,
  Hechos,
  Instante,
  ResultadoAplicar,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { aplicar, op07EnLote } from './aplicar';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
/** Ciclo del día 1: marzo activo. */
const HOY = f('2027-03-15');
const [ENE, MAR] = [f('2027-01-01'), f('2027-03-01')];

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
/** Una transacción en E: saldo inicial sin `cat`, gasto con una línea hacia `cat`. */
function movimiento(tx: string, fecha: string, monto: number, cat?: string) {
  const hora = `${fecha}T12:00:00.000Z` as Instante;
  const t = {
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
  } as const;
  const e = { id: id(`ef-${tx}`), transaccionId: id(tx), cuentaId: id('E'), monto: c(monto) };
  const l = (cat === undefined ? [] : [cat]).map((x) => ({
    id: id(`${tx}.1`),
    transaccionId: id(tx),
    orden: 1,
    monto: c(Math.abs(monto)),
    categoriaId: id(x),
    deudorId: null,
    lineaOriginalId: null,
    revision: null,
  }));
  return { t, e: { ...e, interes: null, seguro: null, revision: null }, l };
}

/**
 * E (efectivo) con 1.000 y la tarjeta T con su pago P en "Pagos de tarjeta". Gastos: Café (50
 * asignado en marzo), Salidas (con la programada Q1), Vacía y Ropa (gasto de 40 en marzo). Hogar:
 * Luz. Viejo, archivado: Vieja, archivada con 25 en marzo y una meta de 100. Libre, sin nada.
 */
function base(): Hechos {
  const movs = [movimiento('si-E', '2027-01-01', 1000), movimiento('g', '2027-03-06', -40, 'ROPA')];
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
      grupo('PT', 'Pagos de tarjeta', 0, { claveSistema: 'pagos_tarjeta' }),
      grupo('G', 'Gastos', 1),
      grupo('H', 'Hogar', 2),
      grupo('Z', 'Viejo', 3, { archivado: true }),
      grupo('L', 'Libre', 4),
    ],
    categorias: [
      categoria('P', 'T', 'PT', 1, { clase: 'pago', tarjetaId: id('T') }),
      categoria('CAFE', 'Café', 'G', 1),
      categoria('SAL', 'Salidas', 'G', 2),
      categoria('VAC', 'Vacía', 'G', 3),
      categoria('ROPA', 'Ropa', 'G', 4),
      categoria('LUZ', 'Luz', 'H', 1),
      categoria('VIEJA', 'Vieja', 'Z', 1, { archivada: true }),
    ],
    asignaciones: [
      { id: id('a1'), categoriaId: id('CAFE'), periodoInicio: MAR, monto: c(50), revision: null },
      { id: id('a2'), categoriaId: id('VIEJA'), periodoInicio: MAR, monto: c(25), revision: null },
    ],
    deudores: [],
    transacciones: movs.map((m) => m.t),
    efectos: movs.map((m) => m.e),
    lineas: movs.flatMap((m) => m.l),
    condonaciones: [],
    metas: [
      {
        id: id('meta'),
        categoriaId: id('VIEJA'),
        tipo: 'mensual',
        modo: 'rellenar_hasta',
        monto: c(100),
        fechaObjetivo: null,
        fechaCreacion: ENE,
        revision: null,
      },
    ],
    programadas: [
      {
        id: id('Q1'),
        tipo: 'gasto',
        cuentaId: id('E'),
        cuentaDestinoId: null,
        comercio: 'Q1',
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
      },
    ],
    programada_lineas: [
      {
        id: id('Q1.1'),
        programadaId: id('Q1'),
        orden: 1,
        monto: c(10),
        categoriaId: id('SAL'),
        revision: null,
      },
    ],
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
const act = (tabla: string, i: string, campos: object) => ({
  tipo: 'actualizar',
  tabla,
  id: i,
  campos,
});

describe('PRU-DOM-CATEG-104: aplicar, renombrar, desarchivar, eliminar y crear en lote (01 §5.2, 04 §3.2)', () => {
  const op08 = (x: Omit<ComandoOp08, 'operacion'>, h = base()) =>
    ejecutar(h, { operacion: 'OP-08', ...x });

  it('PRU-DOM-CATEG-104 OP-08: renombra, mueve de grupo y reordena con posición × 10, solo en las filas que cambian, sin efectos de cálculo', () => {
    const renombrar = exito(op08({ tipo: 'categoria', id: id('SAL'), nombre: 'Salir' }));
    expect(renombrar.cambios).toEqual([act('categorias', 'SAL', { nombre: 'Salir' })]);
    expect(renombrar.impacto.deltaLpa).toBe(c(0));
    expect(renombrar.impacto.deltaDisponible).toEqual([]);
    // Mover Vacía a Hogar: queda al final y Luz pasa a 10; Gastos no se renumera.
    expect(exito(op08({ tipo: 'categoria', id: id('VAC'), grupoId: id('H') })).cambios).toEqual([
      act('categorias', 'LUZ', { orden: 10 }),
      act('categorias', 'VAC', { grupoId: 'H', orden: 20 }),
    ]);
    // Mover a una posición del grupo destino.
    expect(
      exito(op08({ tipo: 'categoria', id: id('VAC'), grupoId: id('H'), orden: 1 })).cambios,
    ).toEqual([
      act('categorias', 'VAC', { grupoId: 'H', orden: 10 }),
      act('categorias', 'LUZ', { orden: 20 }),
    ]);
    // Vacía primera en Gastos: todas las de Gastos cambian.
    expect(exito(op08({ tipo: 'categoria', id: id('VAC'), orden: 1 })).cambios).toEqual([
      act('categorias', 'VAC', { orden: 10 }),
      act('categorias', 'CAFE', { orden: 20 }),
      act('categorias', 'SAL', { orden: 30 }),
      act('categorias', 'ROPA', { orden: 40 }),
    ]);
    // Renombrar y reordenar a la vez.
    expect(exito(op08({ tipo: 'grupo', id: id('H'), nombre: 'Casa', orden: 1 })).cambios).toEqual([
      act('grupos', 'H', { nombre: 'Casa', orden: 10 }),
      act('grupos', 'PT', { orden: 20 }),
      act('grupos', 'G', { orden: 30 }),
      act('grupos', 'Z', { orden: 40 }),
      act('grupos', 'L', { orden: 50 }),
    ]);
    // Ya en posición × 10: solo las filas que cambian.
    const enOrden = {
      ...base(),
      grupos: base().grupos.map((g) => ({ ...g, orden: (g.orden + 1) * 10 })),
    };
    expect(exito(op08({ tipo: 'grupo', id: id('G'), orden: 2 }, enOrden)).cambios).toEqual([]);
    expect(
      exito(op08({ tipo: 'grupo', id: id('G'), nombre: 'Gastos varios', orden: 2 }, enOrden))
        .cambios,
    ).toEqual([act('grupos', 'G', { nombre: 'Gastos varios' })]);
    // Una posición fuera de la lista se acota al final.
    expect(exito(op08({ tipo: 'grupo', id: id('L'), orden: 99 }, enOrden)).cambios).toEqual([]);
    expect(exito(op08({ tipo: 'grupo', id: id('PT'), orden: 2 }, enOrden)).cambios).toEqual([
      act('grupos', 'G', { orden: 10 }),
      act('grupos', 'PT', { orden: 20 }),
    ]);
    // Sin cambios pedidos, nada; el mismo nombre con otras mayúsculas sí se escribe.
    expect(exito(op08({ tipo: 'categoria', id: id('SAL') })).cambios).toEqual([]);
    expect(exito(op08({ tipo: 'grupo', id: id('G'), nombre: 'GASTOS' })).cambios).toEqual([
      act('grupos', 'G', { nombre: 'GASTOS' }),
    ]);
    // Una archivada se renombra en su grupo archivado; una de pago, dentro de "Pagos de tarjeta".
    expect(exito(op08({ tipo: 'categoria', id: id('VIEJA'), nombre: 'Antigua' })).cambios).toEqual([
      act('categorias', 'VIEJA', { nombre: 'Antigua' }),
    ]);
    expect(exito(op08({ tipo: 'categoria', id: id('P'), grupoId: id('PT') })).cambios).toEqual([]);
  });

  it('PRU-DOM-CATEG-104 OP-08: cada rechazo de 04 §3.2 (nombre_repetido, grupo_archivado, grupo_del_sistema) y no_encontrado', () => {
    expect(
      ejecutar(base(), { operacion: 'OP-08', tipo: 'grupo', id: id('G'), nombre: 'hogar' }),
    ).toEqual({
      ok: false,
      rechazos: [{ codigo: 'nombre_repetido', campo: 'nombre', datos: { nombre: 'hogar' } }],
    });
    expect(
      ejecutar(base(), { operacion: 'OP-08', tipo: 'categoria', id: id('SAL'), nombre: 'CAFÉ' }),
    ).toEqual({
      ok: false,
      rechazos: [
        { codigo: 'nombre_repetido', campo: 'nombre', datos: { nombre: 'CAFÉ', grupo: 'Gastos' } },
      ],
    });
    // Al mover, el nombre se compara con las del grupo destino.
    const conLuz = {
      ...base(),
      categorias: [...base().categorias, categoria('L2', 'luz', 'G', 5)],
    };
    expect(codigos(op08({ tipo: 'categoria', id: id('L2'), grupoId: id('H') }, conLuz))).toEqual([
      'nombre_repetido',
    ]);
    expect(codigos(op08({ tipo: 'categoria', id: id('SAL'), grupoId: id('Z') }))).toEqual([
      'grupo_archivado',
    ]);
    expect(codigos(op08({ tipo: 'categoria', id: id('SAL'), grupoId: id('PT') }))).toEqual([
      'grupo_del_sistema',
    ]);
    expect(codigos(op08({ tipo: 'categoria', id: id('P'), grupoId: id('G') }))).toEqual([
      'grupo_del_sistema',
    ]);
    expect(codigos(op08({ tipo: 'grupo', id: id('NO'), nombre: 'X' }))).toEqual(['no_encontrado']);
    expect(codigos(op08({ tipo: 'categoria', id: id('SAL'), grupoId: id('NO') }))).toEqual([
      'no_encontrado',
    ]);
  });

  it('PRU-DOM-CATEG-104 [CB-34] OP-10: desarchivar pide su grupo activo o desarchivarlo en el mismo paso; su meta vuelve a evaluarse; una de pago va con su tarjeta', () => {
    const op10 = { operacion: 'OP-10', categoriaId: id('VIEJA') } as const;
    expect(ejecutar(base(), op10)).toEqual({
      ok: false,
      rechazos: [{ codigo: 'grupo_archivado', datos: { grupo: 'Viejo' } }],
    });
    const r = exito(ejecutar(base(), { ...op10, desarchivarGrupo: true }));
    expect(r.cambios).toEqual([
      act('grupos', 'Z', { archivado: false }),
      act('categorias', 'VIEJA', { archivada: false }),
    ]);
    // CB-34 (B-11): la meta se conserva sin evaluarse y vuelve a evaluarse al desarchivar.
    const evaluacion = (h: Hechos) =>
      calcular(h, HOY).metas.find((m) => m.categoriaId === 'VIEJA')?.evaluacion;
    expect(evaluacion(base())).toBeNull();
    expect(evaluacion(r.hechosNuevos)).not.toBeNull();
    expect(evaluacion(r.hechosNuevos)).toBeDefined();
    // Con el grupo activo no hace falta desarchivarlo.
    const enActivo = {
      ...base(),
      categorias: base().categorias.map((x) => (x.id === 'VIEJA' ? { ...x, grupoId: id('L') } : x)),
    };
    expect(exito(ejecutar(enActivo, op10)).cambios).toEqual([
      act('categorias', 'VIEJA', { archivada: false }),
    ]);
    const pagoArchivada = {
      ...base(),
      categorias: base().categorias.map((x) => (x.id === 'P' ? { ...x, archivada: true } : x)),
    };
    expect(codigos(ejecutar(pagoArchivada, { ...op10, categoriaId: id('P') }))).toEqual([
      'categoria_de_pago_con_tarjeta',
    ]);
    expect(codigos(ejecutar(base(), { ...op10, categoriaId: id('SAL') }))).toEqual([
      'categoria_no_archivada',
    ]);
    expect(codigos(ejecutar(base(), { ...op10, categoriaId: id('NO') }))).toEqual([
      'no_encontrado',
    ]);
  });

  it('PRU-DOM-CATEG-104 OP-13: elimina una categoría sin historial o un grupo vacío y archiva un grupo con todo archivado; cada rechazo de 04 §3.2', () => {
    const op13 = (accion: ComandoOp13['accion'], i: string, h = base()) =>
      ejecutar(h, { operacion: 'OP-13', accion, id: id(i) });
    const eliminada = exito(op13('eliminar_categoria', 'VAC'));
    expect(eliminada.cambios).toEqual([{ tipo: 'eliminar', tabla: 'categorias', id: 'VAC' }]);
    expect(eliminada.hechosNuevos.categorias.some((x) => x.id === 'VAC')).toBe(false);
    // Historial: asignación (Café), línea (Ropa), programada (Salidas) o regla (de la entrada).
    for (const cat of ['CAFE', 'ROPA', 'SAL'])
      expect(op13('eliminar_categoria', cat)).toEqual({
        ok: false,
        rechazos: [{ codigo: 'categoria_con_historial', datos: { categoriaId: cat } }],
      });
    const conRegla = ejecutar(base(), {
      operacion: 'OP-13',
      accion: 'eliminar_categoria',
      id: id('VAC'),
      reglas: [{ id: id('R'), patron: 'x', categoriaId: id('VAC') }],
    });
    expect(codigos(conRegla)).toEqual(['categoria_con_historial']);
    // Una archivada sin historial se elimina, y su meta en cascada.
    const vieja = {
      ...base(),
      asignaciones: base().asignaciones.filter((x) => x.categoriaId !== 'VIEJA'),
    };
    const sinVieja = exito(op13('eliminar_categoria', 'VIEJA', vieja)).hechosNuevos;
    expect(sinVieja.metas).toEqual([]);
    expect(codigos(op13('eliminar_categoria', 'P'))).toEqual(['categoria_de_pago_con_tarjeta']);
    expect(codigos(op13('eliminar_categoria', 'NO'))).toEqual(['no_encontrado']);

    expect(exito(op13('eliminar_grupo', 'L')).cambios).toEqual([
      { tipo: 'eliminar', tabla: 'grupos', id: 'L' },
    ]);
    expect(op13('eliminar_grupo', 'Z')).toEqual({
      ok: false,
      rechazos: [{ codigo: 'grupo_no_vacio', datos: { grupo: 'Viejo' } }],
    });
    expect(codigos(op13('eliminar_grupo', 'PT'))).toEqual(['grupo_del_sistema']);
    expect(codigos(op13('eliminar_grupo', 'NO'))).toEqual(['no_encontrado']);

    expect(exito(op13('archivar_grupo', 'L')).cambios).toEqual([
      act('grupos', 'L', { archivado: true }),
    ]);
    const hogar = {
      ...base(),
      categorias: base().categorias.map((x) => (x.id === 'LUZ' ? { ...x, archivada: true } : x)),
    };
    expect(exito(op13('archivar_grupo', 'H', hogar)).cambios).toEqual([
      act('grupos', 'H', { archivado: true }),
    ]);
    expect(op13('archivar_grupo', 'H')).toEqual({
      ok: false,
      rechazos: [{ codigo: 'grupo_con_categorias_activas', datos: { grupo: 'Hogar' } }],
    });
    expect(codigos(op13('archivar_grupo', 'PT'))).toEqual(['grupo_del_sistema']);
    expect(codigos(op13('archivar_grupo', 'NO'))).toEqual(['no_encontrado']);
    // Idempotencia natural: archivar un grupo ya archivado no escribe nada.
    expect(exito(op13('archivar_grupo', 'Z')).cambios).toEqual([]);
  });

  it('PRU-DOM-CATEG-104 OP-07 CF-19: el lote crea en orden y no es atómico; las categorías de un grupo que falló responden su motivo sin intentarse, y la reanudación con los mismos ids responde ya_aplicada', () => {
    const e = (i: string, tipo: ElementoOp07['tipo'], nombre: string, g?: string) => ({
      id: id(i),
      tipo,
      nombre,
      ...(g !== undefined && { grupoId: id(g) }),
    });
    const [ocio, cine] = [e('N1', 'grupo', 'Ocio'), e('N2', 'categoria', 'Cine', 'N1')];
    const elementos = [
      ocio,
      cine,
      e('N3', 'grupo', 'gastos'),
      e('N4', 'categoria', 'Teatro', 'N3'),
      e('N5', 'categoria', 'Café', 'G'),
      e('N6', 'categoria', 'Libros', 'G'),
      e('N7', 'categoria', 'Museos', 'N1'),
    ];
    const { resultados, hechos } = op07EnLote(base(), { elementos }, HOY);
    const repetido = { codigo: 'nombre_repetido', campo: 'nombre', datos: { nombre: 'gastos' } };
    expect(resultados).toEqual([
      { id: 'N1', resultado: 'creado' },
      { id: 'N2', resultado: 'creado' },
      { id: 'N3', resultado: repetido },
      { id: 'N4', resultado: repetido },
      {
        id: 'N5',
        resultado: {
          codigo: 'nombre_repetido',
          campo: 'nombre',
          datos: { nombre: 'Café', grupo: 'Gastos' },
        },
      },
      { id: 'N6', resultado: 'creado' },
      { id: 'N7', resultado: 'creado' },
    ]);
    expect(hechos.grupos.find((x) => x.id === 'N1')).toEqual(grupo('N1', 'Ocio', 5));
    expect(hechos.categorias.filter((x) => x.grupoId === 'N1').map((x) => [x.id, x.orden])).toEqual(
      [
        ['N2', 1],
        ['N7', 2],
      ],
    );
    expect(hechos.grupos.some((x) => x.id === 'N3')).toBe(false);
    // Reanudación con los ids del borrador (04 §4.6.1): lo creado responde ya_aplicada y lo que
    // falta se crea; la categoría de un grupo creado en una llamada anterior entra en él.
    const resto = [ocio, cine, e('N8', 'categoria', 'Conciertos', 'N1')];
    const otra = op07EnLote(hechos, { elementos: resto }, HOY);
    expect(otra.resultados.map((x) => x.resultado)).toEqual([
      'ya_aplicada',
      'ya_aplicada',
      'creado',
    ]);
    expect(otra.hechos.categorias.find((x) => x.id === 'N8')?.grupoId).toBe('N1');
    const igual = op07EnLote(hechos, { elementos: [ocio] }, HOY);
    expect(igual.hechos).toBe(hechos);
    // El mismo id con otros datos (nombre, grupo o tipo) es conflicto_id, nunca ya_aplicada.
    const conflicto = { codigo: 'conflicto_id', datos: { id: 'N2' } };
    for (const distinto of [
      e('N2', 'categoria', 'Cinema', 'N1'),
      e('N2', 'categoria', 'Cine', 'G'),
      e('N2', 'grupo', 'Cine'),
    ])
      expect(op07EnLote(hechos, { elementos: [distinto] }, HOY).resultados).toEqual([
        { id: 'N2', resultado: conflicto },
      ]);
    expect(() => op07EnLote(base(), { elementos: [] }, HOY)).toThrow(TypeError);
    const quince = Array.from({ length: 15 }, (_, i) => e(`M${i}`, 'grupo', `G${i}`));
    expect(op07EnLote(base(), { elementos: quince }, HOY).resultados).toHaveLength(15);
    const dieciseis = [...quince, e('M15', 'grupo', 'G15')];
    expect(() => op07EnLote(base(), { elementos: dieciseis }, HOY)).toThrow(TypeError);
  });
});
