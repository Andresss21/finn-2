// PRU-DOM-CATEG-102: detalle de una categoría (reparto, calendario, historial con
// "existía en el período"), metas y estructura sobre un estado armado a mano (hoy = 2027-04-15).
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  Meta,
  Programada,
  ProgramadaLinea,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { detalleCategoria } from './detalle-categoria';
import { estructura } from './estructura';
import { metas } from './metas';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

const cuentas = [
  { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo' },
  { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa' },
] as Cuenta[];
const grupos = [
  { id: id('hogar'), nombre: 'Hogar', orden: 1, archivado: false, claveSistema: null },
  { id: id('ocio'), nombre: 'Ocio', orden: 2, archivado: false, claveSistema: null },
  {
    id: id('pagos'),
    nombre: 'Pagos de tarjeta',
    orden: 3,
    archivado: false,
    claveSistema: 'pagos',
  },
] as Grupo[];
const cat = (n: string, g: string, orden: number, archivada = false): Categoria =>
  ({
    id: id(n),
    grupoId: id(g),
    nombre: n,
    orden,
    clase: 'normal',
    tarjetaId: null,
    archivada,
  }) as Categoria;
const categorias: Categoria[] = [
  cat('super', 'hogar', 1),
  cat('cine', 'ocio', 2),
  cat('vieja', 'ocio', 3, true),
  cat('viaje', 'ocio', 4),
  cat('nueva', 'ocio', 5),
  { ...cat('pago-vi', 'pagos', 1), clase: 'pago', tarjetaId: id('vi') },
];

const asignaciones: Asignacion[] = [];
const asignar = (categoria: string, periodo: string, monto: number) =>
  asignaciones.push({
    id: id(`a-${categoria}-${periodo}`),
    categoriaId: id(categoria),
    periodoInicio: f(periodo),
    monto: c(monto),
  } as Asignacion);
// super: 7 períodos de 10 (jun a dic de 2026), luego 100 en ene, feb y mar, y 350 en abril.
for (const m of ['06', '07', '08', '09', '10', '11', '12']) asignar('super', `2026-${m}-01`, 10);
for (const m of ['01', '02', '03']) asignar('super', `2027-${m}-01`, 100);
asignar('super', '2027-04-01', 350);
asignar('cine', '2027-01-01', 50); // cine: existía en enero (asignación) y en marzo (consumo), no en febrero
asignar('viaje', '2027-04-01', 100);
asignar('super', '2027-06-01', 40); // asignación futura (bloquea el archivo)

const transacciones: Transaccion[] = [];
const efectos: Efecto[] = [];
const lineas: Linea[] = [];
function mov(
  tx: string,
  tipo: Transaccion['tipo'],
  fecha: string,
  cuenta: string,
  monto: number,
  linea?: { cat: string; de?: string },
  comercio: string | null = null,
) {
  transacciones.push({
    id: id(tx),
    tipo,
    fecha: f(fecha),
    claveOrden: `${fecha}T12:00:00.000Z`,
    secuencia: String(transacciones.length + 1),
    estadoBancario: 'confirmada',
    comercio,
    total: c(Math.abs(monto)),
    lineaCobradaId: null,
  } as Transaccion);
  efectos.push({
    id: id(`ef-${tx}`),
    transaccionId: id(tx),
    cuentaId: id(cuenta),
    monto: c(monto),
    interes: null,
    seguro: null,
  } as Efecto);
  if (linea !== undefined)
    lineas.push({
      id: id(`${tx}-0`),
      transaccionId: id(tx),
      orden: 1,
      monto: c(Math.abs(monto)),
      categoriaId: id(linea.cat),
      deudorId: null,
      lineaOriginalId: linea.de === undefined ? null : id(linea.de),
    } as Linea);
}
mov('si', 'saldo_inicial', '2026-06-01', 'ef', 5000);
mov('g-ene', 'gasto', '2027-01-10', 'ef', -80, { cat: 'super' }, 'SUPER ENERO');
mov('g-feb', 'gasto', '2027-02-10', 'ef', -130, { cat: 'super' }, 'SUPER FEBRERO');
mov('g-mar-cine', 'gasto', '2027-03-12', 'vi', -60, { cat: 'cine' }, 'CINE');
mov('g-abr-1', 'gasto', '2027-04-03', 'ef', -50, { cat: 'super' }, 'SUPER A');
mov('g-abr-2', 'gasto', '2027-04-03', 'ef', -30, { cat: 'super' }, 'SUPER B');
mov('g-abr-3', 'gasto', '2027-04-10', 'ef', -100, { cat: 'super' }, 'SUPER C');
mov('d-abr', 'devolucion', '2027-04-12', 'ef', 20, { cat: 'super' });

const metasHechos = [
  {
    id: id('m-cine'),
    categoriaId: id('cine'),
    tipo: 'mensual',
    modo: 'acumular',
    monto: c(50),
    fechaObjetivo: null,
    fechaCreacion: f('2027-01-01'),
  },
  {
    id: id('m-viaje'),
    categoriaId: id('viaje'),
    tipo: 'para_fecha',
    modo: null,
    monto: c(1000),
    fechaObjetivo: f('2027-03-31'),
    fechaCreacion: f('2027-01-01'),
  },
  {
    id: id('m-vieja'),
    categoriaId: id('vieja'),
    tipo: 'mensual',
    modo: 'acumular',
    monto: c(10),
    fechaObjetivo: null,
    fechaCreacion: f('2027-01-01'),
  },
] as Meta[];
const programadas = [
  {
    id: id('netflix'),
    tipo: 'gasto',
    cuentaId: id('vi'),
    comercio: 'NETFLIX',
    monto: c(15),
    tolerancia: c(0),
    frecuencia: 'mensual',
    frecuenciaDias: null,
    primeraFecha: f('2027-04-20'),
    fechaFin: null,
    activa: true,
  },
  {
    id: id('apagada'),
    tipo: 'gasto',
    cuentaId: id('vi'),
    comercio: 'VIEJA',
    monto: c(5),
    tolerancia: c(0),
    frecuencia: 'mensual',
    frecuenciaDias: null,
    primeraFecha: f('2027-04-21'),
    fechaFin: null,
    activa: false,
  },
] as Programada[];
const programadaLineas = [
  { id: id('pl1'), programadaId: id('netflix'), orden: 1, monto: c(15), categoriaId: id('cine') },
  { id: id('pl2'), programadaId: id('apagada'), orden: 1, monto: c(5), categoriaId: id('cine') },
] as ProgramadaLinea[];

const hechos: Hechos = {
  vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
  cuentas,
  tarjetas: [],
  prestamos: [],
  inversiones: [],
  grupos,
  categorias,
  asignaciones,
  deudores: [],
  transacciones,
  efectos,
  lineas,
  condonaciones: [],
  metas: metasHechos,
  programadas,
  programada_lineas: programadaLineas,
  ocurrencias_resueltas: [],
  conciliaciones: [],
};
const i = calcular(hechos, f('2027-04-15'));

describe('detalle de categoría', () => {
  it('PRU-DOM-CATEG-102 reparte el período activo y lista los consumos en orden D2', () => {
    const d = detalleCategoria(i, id('super'));
    expect(d.periodo.inicio).toBe('2027-04-01');
    expect(d.categoria).toEqual({ id: 'super', nombre: 'super' });
    expect(d.grupo.nombre).toBe('Hogar');
    // Arr: 70 al cierre de 2026; ene 70+100−80=90; feb 90+100−130=60; mar 60+100=160.
    expect(d.numeros).toMatchObject({
      asignado: c(350),
      arrastre: c(160),
      entradas: c(20),
      fondo: c(530),
      gastado: c(160),
      disponible: c(350),
    });
    expect(d.consumos.map((x) => [x.comercio, x.montoNeto, x.noCubierto, x.medio])).toEqual([
      ['SUPER A', c(50), c(0), 'debito'],
      ['SUPER B', c(30), c(0), 'debito'],
      ['SUPER C', c(100), c(0), 'debito'],
    ]);
    expect(d.consumos[0]?.origen).toEqual({ transaccionId: 'g-abr-1' });
    expect(d.consumos[0]?.cuenta.nombre).toBe('Efectivo');
    expect(d.sobregiro).toBeNull();
    expect(d.entradasDelPeriodo.map((x) => [x.transaccionId, x.monto])).toEqual([['d-abr', c(20)]]);
  });

  it('PRU-DOM-CATEG-102 arma el calendario con la intensidad en puntos básicos', () => {
    const d = detalleCategoria(i, id('super'));
    // 3 abr: 80; 10 abr: 100; 12 abr: −20 (entrada, no cuenta en intensidad).
    expect(d.calendario).toEqual([
      { fecha: '2027-04-03', gastado: c(80), intensidadBp: 8000 },
      { fecha: '2027-04-10', gastado: c(100), intensidadBp: 10_000 },
      { fecha: '2027-04-12', gastado: c(-20), intensidadBp: 0 },
    ]);
  });

  it('PRU-DOM-CATEG-102 el historial toma los 6 cerrados anteriores en que existía la categoría', () => {
    const d = detalleCategoria(i, id('super'));
    expect(d.historial.map((x) => x.periodo.inicio)).toEqual([
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
      '2027-01-01',
      '2027-02-01',
      '2027-03-01',
    ]);
    const feb = d.historial[4];
    expect(feb).toMatchObject({ asignado: c(100), gastado: c(130), disponible: c(60) });
    // gastado: 0, 0, 0, 80, 130, 0 → promedio 35; excedidos (gastado > asignado): feb.
    expect(d.historialResumen).toEqual({ promedioGastado: c(35), periodosExcedidos: 1 });
  });

  it('PRU-DOM-CATEG-102 un período sin Asig ni actividad no cuenta en el historial', () => {
    const d = detalleCategoria(i, id('cine'));
    // Cine: asignación en enero y consumo en marzo; febrero no existía.
    expect(d.historial.map((x) => x.periodo.inicio)).toEqual(['2027-01-01', '2027-03-01']);
    expect(detalleCategoria(i, id('nueva')).historial).toEqual([]);
    expect(detalleCategoria(i, id('nueva')).historialResumen).toEqual({
      promedioGastado: c(0),
      periodosExcedidos: 0,
    });
  });

  it('PRU-DOM-CATEG-102 navega entre períodos y deja asignar solo del activo en adelante', () => {
    const feb = detalleCategoria(i, id('super'), { periodoInicio: f('2027-02-01') });
    expect(feb.navegacion).toEqual({ anterior: '2027-01-01', siguiente: '2027-03-01' });
    expect(feb.numeros.disponible).toBe(c(60));
    expect(feb.acciones.puedeAsignar).toBe(false);
    expect(feb.historial.at(-1)?.periodo.inicio).toBe('2027-01-01');
    const abr = detalleCategoria(i, id('super'));
    expect(abr.acciones).toMatchObject({ puedeAsignar: true, asignadoEsperado: c(350) });
    expect(() => detalleCategoria(i, id('super'), { periodoInicio: f('2020-01-01') })).toThrow(
      RangeError,
    );
    expect(() => detalleCategoria(i, id('nada'))).toThrow(RangeError);
    expect(() => detalleCategoria(i, id('pago-vi'))).toThrow(RangeError);
  });

  it('PRU-DOM-CATEG-102 trae la meta, las programadas activas, las reglas y los bloqueos de archivo', () => {
    const d = detalleCategoria(i, id('cine'), {
      reglas: [
        { id: id('r1'), patron: 'CINE%', categoriaId: id('cine') },
        { id: id('r2'), patron: 'OTRO%', categoriaId: id('super') },
      ],
    });
    expect(d.meta).toMatchObject({ tipo: 'mensual', modo: 'acumular', monto: c(50) });
    expect(d.meta?.progresoBp).toBeUndefined();
    expect(d.programadas).toEqual([
      { programada: { id: 'netflix', nombre: 'NETFLIX' }, monto: c(15), proxima: '2027-04-20' },
    ]);
    expect(d.reglas).toEqual([{ id: 'r1', patron: 'CINE%' }]);
    expect(d.acciones.bloqueosArchivo).toEqual(['programadas']);
    expect(d.acciones.puedeEliminar).toBe(false);
    expect(detalleCategoria(i, id('super')).acciones.bloqueosArchivo).toEqual([
      'disponible',
      'asignaciones_futuras',
    ]);
    expect(detalleCategoria(i, id('nueva')).acciones).toMatchObject({
      puedeEliminar: true,
      bloqueosArchivo: [],
    });
  });

  it('PRU-DOM-CATEG-102 la meta de ahorro lleva progreso en puntos básicos con tope', () => {
    const d = detalleCategoria(i, id('viaje'));
    expect(d.meta).toMatchObject({ tipo: 'para_fecha', monto: c(1000), estado: 'vencida' });
    expect(d.meta?.progresoBp).toBe(1000);
  });
});

describe('metas y estructura', () => {
  it('PRU-DOM-CATEG-102 lista las metas con las vencidas primero y sin las de categorías archivadas', () => {
    const m = metas(i);
    expect(m.metas.map((x) => [x.categoria.nombre, x.estado, x.vencida])).toEqual([
      ['viaje', 'vencida', true],
      ['cine', 'con_faltante', false],
    ]);
    expect(m.metas[0]).toMatchObject({
      progreso: 1000,
      disponible: c(100),
      fechaObjetivoVigente: '2027-03-31',
    });
    expect(m.metas[1]).toMatchObject({
      montoPeriodo: c(50),
      pedido: c(50),
      falta: c(50),
      modo: 'acumular',
    });
    expect(m.metas[1]?.progreso).toBeUndefined();
    expect(m.metas[1]?.grupo.nombre).toBe('Ocio');
    expect(m.categoriasSinMeta.map((x) => x.nombre)).toEqual(['super', 'nueva']);
  });

  it('PRU-DOM-CATEG-102 arma el árbol con las precondiciones de OP-09 y OP-13', () => {
    const e = estructura(i, [{ id: id('r1'), patron: 'X', categoriaId: id('nueva') }]);
    expect(e.map((g) => [g.grupo.nombre, g.grupo.sistema])).toEqual([
      ['Hogar', false],
      ['Ocio', false],
      ['Pagos de tarjeta', true],
    ]);
    const ocio = e[1]?.categorias.map((x) => [
      x.categoria.nombre,
      x.tieneMeta,
      x.puedeEliminar,
      x.puedeArchivar,
    ]);
    expect(ocio).toEqual([
      ['cine', true, false, true],
      ['vieja', true, true, false],
      ['viaje', true, false, true],
      ['nueva', false, false, true],
    ]);
    expect(e[1]?.categorias[1]?.categoria.archivada).toBe(true);
    expect(e[2]?.categorias[0]).toMatchObject({
      clase: 'pago',
      puedeEliminar: false,
      puedeArchivar: false,
    });
  });
});
