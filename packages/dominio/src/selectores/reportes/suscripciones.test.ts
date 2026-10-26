import { describe, expect, it } from 'vitest';
import { calcular } from '../../calculo/calcular';
import type {
  Categoria,
  Cuenta,
  Efecto,
  Grupo,
  Hechos,
  Linea,
  OcurrenciaResuelta,
  Programada,
  ProgramadaLinea,
  Transaccion,
  Uuid,
} from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { suscripciones } from './index';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Hoy = 2027-04-15, ciclo mensual: diciembre a marzo cerrados (4 períodos) y abril activo. Una sola
 * cuenta de efectivo `ef`; las filas se arman a mano, una por llamada.
 */
class Libro {
  readonly categorias: Categoria[] = [];
  readonly transacciones: Transaccion[] = [];
  readonly efectos: Efecto[] = [];
  readonly lineas: Linea[] = [];
  readonly programadas: Programada[] = [];
  readonly programadaLineas: ProgramadaLinea[] = [];
  readonly resueltas: OcurrenciaResuelta[] = [];

  categoria(nombre: string, orden: number, archivada = false) {
    this.categorias.push({
      id: id(nombre),
      grupoId: id('g'),
      nombre,
      orden,
      clase: 'normal',
      tarjetaId: null,
      archivada,
    } as Categoria);
  }

  /** Un gasto en efectivo con una línea por (categoría, monto). */
  gasto(tx: string, fecha: string, comercio: string, lineas: [string, number][]) {
    const total = lineas.reduce((s, [, m]) => s + m, 0);
    this.transacciones.push({
      id: id(tx),
      tipo: tx === 'si' ? 'saldo_inicial' : 'gasto',
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: String(this.transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio,
      total: c(total),
      lineaCobradaId: null,
    } as Transaccion);
    this.efectos.push({
      id: id(`ef-${tx}`),
      transaccionId: id(tx),
      cuentaId: id('ef'),
      monto: c(tx === 'si' ? total : -total),
      interes: null,
      seguro: null,
    } as Efecto);
    lineas.forEach(([cat, monto], k) =>
      this.lineas.push({
        id: id(`${tx}-${k}`),
        transaccionId: id(tx),
        orden: k + 1,
        monto: c(monto),
        categoriaId: id(cat),
        deudorId: null,
        lineaOriginalId: null,
      } as Linea),
    );
  }

  programada(
    n: string,
    comercio: string,
    monto: number,
    extra: Partial<Programada> = {},
    categoria = 'subs',
  ) {
    this.programadas.push({
      id: id(n),
      tipo: 'gasto',
      cuentaId: id('ef'),
      cuentaDestinoId: null,
      comercio,
      monto: c(monto),
      tolerancia: c(0),
      frecuencia: 'mensual',
      frecuenciaDias: null,
      primeraFecha: f('2026-01-01'),
      fechaFin: null,
      registroAutomatico: false,
      activa: true,
      ...extra,
    } as Programada);
    this.programadaLineas.push({
      id: id(`pl-${n}`),
      programadaId: id(n),
      orden: 1,
      monto: c(monto),
      categoriaId: id(categoria),
    } as ProgramadaLinea);
  }

  hechos(): Hechos {
    return {
      vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
      cuentas: [
        { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', archivada: false },
      ] as Cuenta[],
      tarjetas: [],
      prestamos: [],
      inversiones: [],
      grupos: [
        { id: id('g'), nombre: 'Gastos', orden: 1, archivado: false, claveSistema: null },
      ] as Grupo[],
      categorias: this.categorias,
      asignaciones: [],
      deudores: [],
      transacciones: this.transacciones,
      efectos: this.efectos,
      lineas: this.lineas,
      condonaciones: [],
      metas: [],
      programadas: this.programadas,
      programada_lineas: this.programadaLineas,
      ocurrencias_resueltas: this.resueltas,
      conciliaciones: [],
    };
  }
}

const REGLAS = [{ patron: 'NETFLIX' }, { patron: 'SPOTIFY' }];
const MESES = ['2027-01', '2027-02', '2027-03'] as const;

function estado() {
  const l = new Libro();
  for (const [k, n] of ['subs', 'vieja'].entries()) l.categoria(n, k + 1, n === 'vieja');
  l.gasto('si', '2026-12-01', '', [['subs', 5000]]);
  // Netflix: días 17, 17 y 18 con variantes del comercio.
  ['NETFLIX.COM 123', 'netflix', '  NETFLIX US '].forEach((v, k) => {
    l.gasto(`nf-${k}`, `${MESES[k]}-${k === 2 ? 18 : 17}`, v, [['subs', 15.49]]);
  });
  // Spotify: programada desactivada con una resolución y otra sin resoluciones.
  MESES.forEach((m, k) => {
    l.gasto(`sp-${k}`, `${m}-0${k === 2 ? 6 : 5}`, 'SPOTIFY AB', [['subs', 9.99]]);
  });
  l.programada('sp-con', 'SPOTIFY', 9.99, { activa: false, primeraFecha: f('2026-06-01') });
  l.programada('sp-sin', 'SPOTIFY OLD', 9.99, { activa: false, primeraFecha: f('2026-09-01') });
  l.resueltas.push({
    id: id('or-sp'),
    programadaId: id('sp-con'),
    fechaEsperada: f('2026-07-01'),
    estado: 'registrada',
    transaccionId: null,
  } as OcurrenciaResuelta);
  // Gimnasio: categoría archivada, 30, 30 y 32.
  MESES.forEach((m, k) => {
    l.gasto(`gym-${k}`, `${m}-10`, 'GYM', [['vieja', [30, 30, 32][k] as number]]);
  });
  // HBO: cobros en solo 2 de los 4 períodos.
  for (const m of MESES.slice(0, 2)) l.gasto(`hbo-${m}`, `${m}-20`, 'HBO', [['subs', 12.99]]);
  // Disney: ya programada, no se detecta; una programada cada 10 días se convierte a mensual.
  MESES.forEach((m) => {
    l.gasto(`di-${m}`, `${m}-03`, 'DISNEY', [['subs', 7.99]]);
  });
  l.programada('p-disney', 'Disney', 7.99);
  l.programada('p-luz', 'CAESS', 20, { frecuencia: 'cada_n_dias', frecuenciaDias: 10 });
  return calcular(l.hechos(), f('2027-04-15'));
}

describe('PRU-DOM-REP', () => {
  const i = estado();

  it('PRU-DOM-REP-106 [CA-65.1, CA-65.3, CA-65.4] suscripciones: la clave de BE-43 une las variantes, reactiva la programada desactivada y exige 3 de 4 períodos', () => {
    const r = suscripciones(i, REGLAS);
    expect(r.suficiente).toBe(true);
    expect(
      r.detectadas.map((x) => [x.clave, x.mensual, x.anual, x.dia, x.periodosConCobro]),
    ).toEqual(
      [
        ['GYM'.toLowerCase(), c(30), c(360), 10, 3],
        ['NETFLIX', c(15.49), c(185.88), 17, 3],
        ['SPOTIFY', c(9.99), c(119.88), 5, 3],
      ].sort((a, b) => (b[1] as number) - (a[1] as number)),
    );
    const accion = (clave: string) =>
      r.hallazgos.find((x) => x.clave === `comercio:${clave}`)?.accion;
    expect(accion('NETFLIX')).toEqual({
      tipo: 'programar',
      valores: {
        cuentaId: 'ef',
        comercio: 'NETFLIX',
        monto: c(15.49),
        tolerancia: c(0),
        frecuencia: 'mensual',
        primeraFecha: f('2027-04-17'),
        categoriaId: 'subs',
        registroAutomatico: false,
      },
    });
    // Reactiva la de la resolución más reciente, no la que nunca se resolvió.
    expect(accion('SPOTIFY')).toEqual({ tipo: 'reactivar', programadaId: 'sp-con' });
    expect(r.detectadas.find((x) => x.clave === 'SPOTIFY')?.programadaDesactivada).toEqual({
      id: 'sp-con',
      nombre: 'SPOTIFY',
    });
    // Categoría archivada: abre el flujo; la tolerancia es la mayor diferencia observada.
    expect(accion('gym')).toMatchObject({
      tipo: 'abrir_flujo',
      valores: { tolerancia: c(2), categoriaId: 'vieja', monto: c(30) },
    });
    // Disney ya está programada, HBO solo cobró en 2 períodos.
    expect(r.detectadas.some((x) => /disney|hbo/i.test(x.clave))).toBe(false);
    expect(r.programadas.map((x) => [x.programada.id, x.mensual, x.anual])).toEqual(
      [
        ['p-disney', c(7.99), c(95.88)],
        ['p-luz', c(60.83), c(730)],
      ].sort((a, b) => (b[1] as number) - (a[1] as number)),
    );
    expect(r.hallazgos.map((x) => x.impacto)).toEqual([c(30), c(15.49), c(9.99)]);
  });

  it('PRU-DOM-REP-106 [CA-65.4] suscripciones: con menos de 4 períodos cerrados no se detecta nada', () => {
    const l = new Libro();
    l.categoria('subs', 1);
    l.gasto('si', '2027-02-01', '', [['subs', 100]]);
    l.programada('p', 'X', 5, { frecuencia: 'semanal' });
    const r = suscripciones(calcular(l.hechos(), f('2027-04-15')), []);
    expect(r).toMatchObject({ suficiente: false, detectadas: [], hallazgos: [] });
    expect(r.programadas[0]).toMatchObject({ mensual: c(21.67), anual: c(260) });
  });
});
