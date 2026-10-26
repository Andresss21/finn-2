import { describe, expect, it } from 'vitest';
import type { Asignacion, BigintTexto, Instante, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { asignado, entradas, noCubiertaDe, repartoD2, trasladoA } from './d2';
import type { Aporte, Consumo } from './devoluciones';
import { ciclo, periodoDe } from './periodos';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const mensual = ciclo([{ diaInicio: 1, rigeDesde: null }]);
const feb = periodoDe(mensual, f('2026-02-10'));
const mar = periodoDe(mensual, f('2026-03-10'));

/** Un consumo de la categoría `cat`; `tarjeta` = null es débito. */
function k(
  nombre: string,
  fecha: string,
  hora: string,
  secuencia: number,
  orden: number,
  neto: number,
  tarjeta: string | null,
  cat = 'A',
  monto = neto,
): Consumo {
  return {
    id: id(nombre),
    fuente: 'linea',
    categoriaId: id(cat),
    fecha: f(fecha),
    claveOrden: `${fecha}T${hora}:00.000Z` as Instante,
    secuencia: String(secuencia) as BigintTexto,
    orden,
    cuentaId: id(tarjeta ?? 'banco'),
    tarjetaId: tarjeta === null ? null : id(tarjeta),
    monto: c(monto),
    neto: c(neto),
  };
}

/** Un aporte D-2 de +X a `cat` con fecha `fecha`. */
const aporte = (cat: string, fecha: string, x: number): Aporte => ({
  ...k(`dev-${cat}-${fecha}`, fecha, '09:00', 99, 0, x, null, cat),
  lineaId: id(`dev-${cat}-${fecha}`),
  periodo: periodoDe(mensual, f(fecha)).inicio,
  lineaOriginalId: null,
  caso: 'D-2',
  a: Centavos.cero,
  aCategoria: c(x),
  aPago: Centavos.cero,
});

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-104 [CB-08, CB-21] MOT-4.5: reparto D2 (01 §4.5): orden (fecha, clave de orden, secuencia, orden de línea), dos líneas de una compra en la misma categoría, desempate por secuencia, traslados, SobT y SobD', () => {
    // Misma fecha y clave de orden: k2 (secuencia 2) va antes que k1 (secuencia 3) aunque k1 tenga
    // orden de línea 0 (CB-21, CH-14). k4 y k3 son dos líneas de la misma compra: van por su orden
    // de línea (CB-08). k1 está neteado por una D-1: reparte su neto (30), no su monto (40).
    const k0 = k('k0', '2026-02-01', '08:00', 1, 0, 10, 'T1');
    const k1 = k('k1', '2026-02-05', '10:00', 3, 0, 30, 'T1', 'A', 40);
    const k2 = k('k2', '2026-02-05', '10:00', 2, 1, 25, null);
    const k3 = k('k3', '2026-02-08', '12:00', 4, 1, 15, 'T2');
    const k4 = k('k4', '2026-02-08', '12:00', 4, 0, 20, 'T2');
    const k5 = k('k5', '2026-02-20', '18:00', 5, 0, 10, null);
    const otraCategoria = k('b1', '2026-02-03', '08:00', 6, 0, 7, 'T1', 'B');
    const otroPeriodo = k('a-mar', '2026-03-02', '08:00', 7, 0, 50, 'T1');
    // Entregados desordenados: el reparto ordena por su cuenta (paso 3).
    const todos = [k5, k3, otroPeriodo, k1, k4, otraCategoria, k2, k0];
    const aportes = [
      aporte('A', '2026-02-15', 10),
      aporte('A', '2026-03-01', 4),
      aporte('B', '2026-02-15', 3),
    ];
    const asignaciones = [
      { categoriaId: id('A'), periodoInicio: feb.inicio, monto: c(50) },
      { categoriaId: id('A'), periodoInicio: mar.inicio, monto: c(9) },
      { categoriaId: id('B'), periodoInicio: feb.inicio, monto: c(1) },
    ] as Asignacion[];

    expect(entradas(aportes, id('A'), feb)).toBe(c(10));
    expect(asignado(asignaciones, id('A'), feb)).toBe(c(50));

    const r = repartoD2({
      categoriaId: id('A'),
      periodo: feb,
      consumos: todos,
      aportes,
      arrastre: c(20),
      asignado: asignado(asignaciones, id('A'), feb),
    });
    // F = Arr + Asig + Ent = 20 + 50 + 10 (paso 2).
    expect(r.entradas).toBe(c(10));
    expect(r.fondo).toBe(c(80));
    expect(r.partes.map((x) => [x.consumo.id, x.cubierto, x.noCubierto])).toEqual([
      ['k0', c(10), c(0)],
      ['k2', c(25), c(0)],
      ['k1', c(30), c(0)],
      ['k4', c(15), c(5)],
      ['k3', c(0), c(15)],
      ['k5', c(0), c(10)],
    ]);
    // Tr(A, feb, T1) = 10 + 30; Tr(A, feb, T2) = 15 (paso 5).
    expect([...r.traslados]).toEqual([
      [id('T1'), c(40)],
      [id('T2'), c(15)],
    ]);
    // Disp = 80 − 110 = −30; SobT = 5 + 15; SobD = 30 − 20 (pasos 6 y 7).
    expect(r.disponible).toBe(c(-30));
    expect(r.sobT).toBe(c(20));
    expect(r.sobD).toBe(c(10));

    // U_L para la D-3 (§4.4): lo no cubierto de cada consumo en su propio período.
    const B = repartoD2({
      categoriaId: id('B'),
      periodo: feb,
      consumos: todos,
      aportes,
      arrastre: Centavos.cero,
      asignado: asignado(asignaciones, id('B'), feb),
    });
    expect(B.partes.map((x) => [x.consumo.id, x.cubierto, x.noCubierto])).toEqual([
      ['b1', c(4), c(3)],
    ]);
    const u = noCubiertaDe([r, B]);
    expect([u(id('k4')), u(id('k3')), u(id('k0')), u(id('b1')), u(id('otra'))]).toEqual([
      c(5),
      c(15),
      Centavos.cero,
      c(3),
      Centavos.cero,
    ]);
    // Σ_c Tr(c, feb, t): lo que llega a pago(t) es lo que salió de las categorías (inv. 5).
    expect(trasladoA([r, B], id('T1'), feb)).toBe(c(44));
    expect(trasladoA([r, B], id('T2'), feb)).toBe(c(15));
    expect(trasladoA([r, B], id('T1'), mar)).toBe(Centavos.cero);

    // Fondo negativo: nada se cubre; SobT es toda la parte con tarjeta y SobD el resto.
    const base = {
      categoriaId: id('A'),
      periodo: feb,
      consumos: todos,
      aportes: [],
      arrastre: Centavos.cero,
    };
    const negativo = repartoD2({ ...base, asignado: c(-5) });
    expect(negativo.partes.every((x) => x.cubierto === Centavos.cero)).toBe(true);
    expect(negativo.traslados.size).toBe(0);
    expect([negativo.disponible, negativo.sobT, negativo.sobD]).toEqual([c(-115), c(75), c(40)]);

    // Fondo de sobra: todo cubierto, sin sobregiro; un período sin consumos no reparte nada.
    const holgado = repartoD2({ ...base, asignado: c(200) });
    expect([holgado.disponible, holgado.sobT, holgado.sobD]).toEqual([
      c(90),
      Centavos.cero,
      Centavos.cero,
    ]);
    const vacio = repartoD2({
      ...base,
      asignado: c(200),
      periodo: periodoDe(mensual, f('2026-04-02')),
    });
    expect([vacio.partes.length, vacio.disponible, vacio.sobT, vacio.sobD]).toEqual([
      0,
      c(200),
      Centavos.cero,
      Centavos.cero,
    ]);
  });
});
