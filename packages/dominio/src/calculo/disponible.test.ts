import { describe, expect, it } from 'vitest';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Efecto,
  Linea,
  TipoCuenta,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import {
  celda,
  type HechosDePresupuesto,
  type PagoImplicito,
  presupuesto,
  reduccionAlCierre,
} from './disponible';
import { ciclo } from './periodos';
import {
  atribucionDelExcedente,
  pagoExcedente,
  reduccionProyectada,
  sobregiro,
  sobregiroConTarjetaDelActivo,
} from './sobregiros';

const c = (n: number) => Centavos.desdeEntero(n * 100);
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;
const mensual = ciclo([{ diaInicio: 1, rigeDesde: null }]);

type LineaNueva = { cat: string; monto: number; de?: string | undefined };

/** Libro de hechos mínimo: cada transacción mueve una cuenta de efectivo o tarjeta. */
class Libro implements HechosDePresupuesto {
  readonly cuentas: Cuenta[] = [];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly condonaciones: HechosDePresupuesto['condonaciones'][number][] = [];
  readonly categorias: Categoria[] = [];
  readonly asignaciones: Asignacion[] = [];

  constructor(cuentas: [string, TipoCuenta][]) {
    for (const [nombre, tipo] of cuentas)
      this.cuentas.push({ id: id(nombre), tipo, nombre } as Cuenta);
  }

  categoria(nombre: string, clase: 'normal' | 'pago', tarjeta: string | null, archivada = false) {
    this.categorias.push({
      id: id(nombre),
      clase,
      tarjetaId: tarjeta === null ? null : id(tarjeta),
      archivada,
    } as Categoria);
  }

  asignar(cat: string, periodoInicio: string, monto: number) {
    this.asignaciones.push({
      id: id(`asig-${cat}-${periodoInicio}`),
      categoriaId: id(cat),
      periodoInicio: f(periodoInicio),
      monto: c(monto),
    } as Asignacion);
  }

  /** Registra la transacción y devuelve los ids de sus líneas (`<tx>.<orden>`). */
  mov(tx: string, tipo: TipoTransaccion, cuenta: string, fecha: string, lineas: LineaNueva[]) {
    const total = lineas.reduce((s, l) => s + l.monto, 0);
    const signo = tipo === 'devolucion' || tipo === 'pago_tarjeta' ? 1 : -1;
    this.transacciones.push({
      id: id(tx),
      tipo,
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: String(this.transacciones.length + 1),
      total: c(total),
    } as Transaccion);
    this.efectos.push({
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id(cuenta),
      monto: c(signo * total),
    } as Efecto);
    return lineas.map((l, i) => {
      this.lineas.push({
        id: id(`${tx}.${i}`),
        transaccionId: id(tx),
        orden: i,
        monto: c(l.monto),
        categoriaId: id(l.cat),
        deudorId: null,
        lineaOriginalId: l.de === undefined ? null : id(l.de),
      } as Linea);
      return `${tx}.${i}`;
    });
  }
}

/**
 * Tres períodos con hechos (enero y febrero cerrados, marzo activo) y abril futuro. Super es normal,
 * Ropa es normal y archivada (N5, CB-11) y PagoT es pago(T).
 */
function escenario() {
  const libro = new Libro([
    ['E', 'efectivo'],
    ['T', 'tarjeta'],
  ]);
  libro.categoria('Super', 'normal', null);
  libro.categoria('Ropa', 'normal', null, true);
  libro.categoria('PagoT', 'pago', 'T');

  // Enero. Super: 100 − 30 = 70, que pasa entero a febrero. Ropa: F = 20 y una compra con T de 50,
  // que deja 30 sin cubrir (SobT) y traslada 20 a PagoT. PagoT: 20 − pago de 50 = −30 (E).
  libro.asignar('Super', '2026-01-01', 100);
  libro.mov('g1', 'gasto', 'E', '2026-01-05', [{ cat: 'Super', monto: 30 }]);
  libro.asignar('Ropa', '2026-01-01', 20);
  const [ropaEnero] = libro.mov('g2', 'gasto', 'T', '2026-01-10', [{ cat: 'Ropa', monto: 50 }]);
  libro.mov('p1', 'pago_tarjeta', 'T', '2026-01-20', [{ cat: 'PagoT', monto: 50 }]);

  // Febrero. Super: 70 − 100 = −30, todo con débito (SobD). Ropa (archivada): −10 con débito.
  // PagoT: Arr 0 (el −30 de enero se reinicia) + 40.
  libro.mov('g3', 'gasto', 'E', '2026-02-03', [{ cat: 'Super', monto: 100 }]);
  libro.mov('g4', 'gasto', 'E', '2026-02-04', [{ cat: 'Ropa', monto: 10 }]);
  libro.asignar('PagoT', '2026-02-01', 40);

  // Marzo (activo). Super: F = 50 + 15 de una D-4 en T. E40 se cubre; T30 cubre 25 y deja 5
  // (SobT); E10 queda sin cubrir (SobD). Ropa: D-3 de 40 sobre la compra de enero, con U_L = 30:
  // a = 30 y r = 10. PagoT: 40 + 25 (traslado) − 100 (pago) − 25 (pago implícito) − 10 (r) − 15 (X).
  libro.asignar('Super', '2026-03-01', 50);
  libro.mov('g5', 'gasto', 'E', '2026-03-02', [{ cat: 'Super', monto: 40 }]);
  libro.mov('g6', 'gasto', 'T', '2026-03-05', [{ cat: 'Super', monto: 30 }]);
  libro.mov('g7', 'gasto', 'E', '2026-03-06', [{ cat: 'Super', monto: 10 }]);
  libro.mov('d1', 'devolucion', 'T', '2026-03-07', [{ cat: 'Ropa', monto: 40, de: ropaEnero }]);
  libro.mov('d2', 'devolucion', 'T', '2026-03-08', [{ cat: 'Super', monto: 15 }]);
  libro.mov('p2', 'pago_tarjeta', 'T', '2026-03-10', [{ cat: 'PagoT', monto: 100 }]);

  // Abril (futuro): solo una asignación; la actividad es cero (§4.1 conv. 3).
  libro.asignar('Super', '2026-04-01', 10);

  const implicitos: PagoImplicito[] = [
    { tarjetaId: id('T'), fecha: f('2026-03-12'), monto: c(25) },
  ];
  return { libro, implicitos };
}

const hoy = f('2026-03-15');

describe('PRU-DOM-MOTOR', () => {
  it('PRU-DOM-MOTOR-105 [MOT-4.6, MOT-4.7, CB-11] Disponible, arrastre y cierre (01 §4.6) y sobregiros y pago excedente (01 §4.7): tres períodos, reinicio N(c, p), cierre en categorías normales, de pago y archivadas, reducción proyectada y atribución del pago excedente por causa', () => {
    const { libro, implicitos } = escenario();
    const b = presupuesto(libro, mensual, hoy, implicitos);

    // §4.1 conv. 5: el primer período es el más antiguo con hechos; el último, el de la última
    // asignación (abril, futuro).
    expect(b.periodos.map((p) => p.inicio)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
      '2026-04-01',
    ]);
    expect(b.activo.inicio).toBe('2026-03-01');

    const fila = (cat: string, mes: string) => {
      const x = celda(b, id(cat), f(`2026-${mes}-01`));
      return [x.estado, x.arrastre, x.asignado, x.actividad, x.disponible, x.reinicio];
    };
    // [estado, Arr, Asig, Act, Disp, N]. Arr(c, p) = máx(0, Disp(c, p − 1)); 0 en enero.
    expect(fila('Super', '01')).toEqual(['cerrado', c(0), c(100), c(-30), c(70), c(0)]);
    expect(fila('Super', '02')).toEqual(['cerrado', c(70), c(0), c(-100), c(-30), c(30)]);
    expect(fila('Super', '03')).toEqual(['activo', c(0), c(50), c(-65), c(-15), c(15)]);
    expect(fila('Super', '04')).toEqual(['futuro', c(0), c(10), c(0), c(10), c(0)]);
    // Ropa, archivada: mismas reglas (N5). El −30 de enero no pasa a febrero.
    expect(fila('Ropa', '01')).toEqual(['cerrado', c(0), c(20), c(-50), c(-30), c(30)]);
    expect(fila('Ropa', '02')).toEqual(['cerrado', c(0), c(0), c(-10), c(-10), c(10)]);
    expect(fila('Ropa', '03')).toEqual(['activo', c(0), c(0), c(10), c(10), c(0)]);
    expect(fila('Ropa', '04')).toEqual(['futuro', c(10), c(0), c(0), c(10), c(0)]);
    // PagoT recibe los traslados de su mismo período (§4.1 conv. 4): 20 en enero, 25 en marzo.
    expect(fila('PagoT', '01')).toEqual(['cerrado', c(0), c(0), c(-30), c(-30), c(30)]);
    expect(fila('PagoT', '02')).toEqual(['cerrado', c(0), c(40), c(0), c(40), c(0)]);
    expect(fila('PagoT', '03')).toEqual(['activo', c(40), c(0), c(-125), c(-85), c(85)]);
    expect(fila('PagoT', '04')).toEqual(['futuro', c(0), c(0), c(0), c(0), c(0)]);

    // Disp = Arr + Asig + Act (§4.6) coincide con Disp = F − Σ m_k del reparto D2 (§4.5).
    for (const r of b.repartos)
      expect(celda(b, r.categoriaId, r.periodo.inicio).disponible).toBe(r.disponible);

    // La D-3 de marzo usa U_L = 30 del reparto de enero: a = 30, r = 10.
    const d3 = b.aportes.find((d) => d.caso === 'D-3');
    expect([d3?.a, d3?.aCategoria, d3?.aPago]).toEqual([c(30), c(10), c(-10)]);

    // Sobregiro total = SobT + SobD (§4.7).
    const partes = (cat: string, mes: string) => {
      const x = celda(b, id(cat), f(`2026-${mes}-01`));
      return [sobregiro(x), x.sobT, x.sobD, pagoExcedente(x)];
    };
    expect(partes('Ropa', '01')).toEqual([c(30), c(30), c(0), c(0)]);
    expect(partes('Ropa', '02')).toEqual([c(10), c(0), c(10), c(0)]);
    expect(partes('Super', '02')).toEqual([c(30), c(0), c(30), c(0)]);
    expect(partes('Super', '03')).toEqual([c(15), c(5), c(10), c(0)]);
    expect(partes('PagoT', '01')).toEqual([c(30), c(0), c(0), c(30)]);
    expect(partes('PagoT', '03')).toEqual([c(85), c(0), c(0), c(85)]);

    // Efectos del cierre: solo los períodos cerrados. Enero: SobT de Ropa (30) no reduce LPA (C1,
    // C2); E(T, enero) = 30 sí (H5). Febrero: SobD de Super (30) y de Ropa archivada (10, CB-11).
    expect(reduccionAlCierre(b)).toBe(c(70));
    // Marzo, al cierre: Σ_c SobD(c, A) + Σ_t E(t, A) = 10 + 85. SobTA = 5.
    expect(reduccionProyectada(b)).toBe(c(95));
    expect(sobregiroConTarjetaDelActivo(b)).toBe(c(5));

    // E(T, A) = 85: cobros hasta 25, devoluciones hasta 10 + 15, pagos el resto.
    expect(atribucionDelExcedente(b, id('T'))).toEqual({
      cobros: c(25),
      devoluciones: c(25),
      pagos: c(35),
    });

    // Una tarjeta sin pago(t) en el presupuesto no tiene excedente que atribuir.
    expect(atribucionDelExcedente(b, id('T9'))).toEqual({
      cobros: c(0),
      devoluciones: c(0),
      pagos: c(0),
    });

    // Con 70 más asignados a PagoT en marzo, E(T, A) = 15 y alcanza solo para los cobros.
    libro.asignar('PagoT', '2026-03-01', 70);
    const conReserva = presupuesto(libro, mensual, hoy, implicitos);
    expect(pagoExcedente(celda(conReserva, id('PagoT'), f('2026-03-01')))).toBe(c(15));
    expect(atribucionDelExcedente(conReserva, id('T'))).toEqual({
      cobros: c(15),
      devoluciones: c(0),
      pagos: c(0),
    });
    expect(reduccionProyectada(conReserva)).toBe(c(25));
    expect(reduccionAlCierre(conReserva)).toBe(c(70));

    // El cierre se deriva de hoy: el 1 de abril marzo queda cerrado y su reducción entra en LPA.
    const abril = presupuesto(libro, mensual, f('2026-04-01'), implicitos);
    expect(reduccionAlCierre(abril)).toBe(c(95));
    expect(atribucionDelExcedente(abril, id('T'))).toEqual({
      cobros: c(0),
      devoluciones: c(0),
      pagos: c(0),
    });

    // Sin hechos, el único período es el activo, con todo en cero.
    const vacio = presupuesto(new Libro([]), mensual, hoy);
    expect(vacio.periodos.map((p) => p.inicio)).toEqual(['2026-03-01']);
    expect(vacio.celdas).toEqual([]);
    expect(() => celda(vacio, id('Super'), hoy)).toThrow(RangeError);
  });
});
