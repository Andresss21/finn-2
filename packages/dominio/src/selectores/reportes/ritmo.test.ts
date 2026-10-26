import { describe, expect, it } from 'vitest';
import { calcular } from '../../calculo/calcular';
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
  Tarjeta,
  Transaccion,
  Uuid,
} from '../../hechos';
import { Centavos } from '../../valores/centavos';
import { FechaLocal } from '../../valores/fecha-local';
import { inicio } from '../inicio';
import { ritmo } from './ritmo';

const c = (n: number) => Centavos.desdeEntero(Math.round(n * 100));
const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (t: string) => t as Uuid;

/**
 * Hoy = 2027-04-15; abril activo (1 al 30): 15 días transcurridos y 15 restantes. Efectivo `ef` con
 * 1000 y la tarjeta `vi`. `rest` tiene 100 asignados y gasta 10, 20 y 30 en efectivo (ritmo: 60 más
 * hasta el 30, disponible proyectado −20); `ocio` tiene 200 sin gastos.
 */
function estado(ajustar: (h: Hechos) => Hechos = (h) => h) {
  const cat = (n: string, orden: number, extra: Partial<Categoria> = {}) =>
    ({
      id: id(n),
      grupoId: id('g'),
      nombre: n,
      orden,
      clase: 'normal',
      tarjetaId: null,
      archivada: false,
      ...extra,
    }) as Categoria;
  const transacciones: Transaccion[] = [];
  const efectos: Efecto[] = [];
  const lineas: Linea[] = [];
  const mov = (tx: string, fecha: string, cuenta: string, monto: number, categoria?: string) => {
    transacciones.push({
      id: id(tx),
      tipo: categoria === undefined ? 'saldo_inicial' : 'gasto',
      fecha: f(fecha),
      claveOrden: `${fecha}T12:00:00.000Z`,
      secuencia: String(transacciones.length + 1),
      estadoBancario: 'confirmada',
      comercio: null,
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
    if (categoria !== undefined)
      lineas.push({
        id: id(`l-${tx}`),
        transaccionId: id(tx),
        orden: 1,
        monto: c(Math.abs(monto)),
        categoriaId: id(categoria),
        deudorId: null,
        lineaOriginalId: null,
      } as Linea);
  };
  mov('si', '2027-04-01', 'ef', 1000);
  mov('g1', '2027-04-02', 'ef', -10, 'rest');
  mov('g2', '2027-04-05', 'ef', -20, 'rest');
  mov('g3', '2027-04-09', 'ef', -30, 'rest');
  const asig = (categoria: string, monto: number) =>
    ({
      id: id(`a-${categoria}`),
      categoriaId: id(categoria),
      periodoInicio: f('2027-04-01'),
      monto: c(monto),
    }) as Asignacion;
  const hechos: Hechos = {
    vigencias_ciclo: [{ id: id('v1'), diaInicio: 1, rigeDesde: null, revision: null }],
    cuentas: [
      { id: id('ef'), tipo: 'efectivo', nombre: 'Efectivo', archivada: false },
      { id: id('vi'), tipo: 'tarjeta', nombre: 'Visa', archivada: false },
    ] as Cuenta[],
    tarjetas: [
      { cuentaId: id('vi'), tipo: 'tarjeta', limiteCredito: c(1000), diaCorte: 1, diaPago: 17 },
    ] as Tarjeta[],
    prestamos: [],
    inversiones: [],
    grupos: [
      { id: id('g'), nombre: 'Gastos', orden: 1, archivado: false, claveSistema: null },
      { id: id('pagos'), nombre: 'Pagos', orden: 2, archivado: false, claveSistema: 'pagos' },
    ] as Grupo[],
    categorias: [
      cat('rest', 1),
      cat('ocio', 2),
      cat('pago-vi', 1, { grupoId: id('pagos'), clase: 'pago', tarjetaId: id('vi') }),
    ],
    asignaciones: [asig('rest', 100), asig('ocio', 200)],
    deudores: [],
    transacciones,
    efectos,
    lineas,
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
  return calcular(ajustar(hechos), f('2027-04-15'));
}

const programada = (n: string, fecha: string, monto: number) =>
  ({
    id: id(n),
    tipo: 'gasto',
    cuentaId: id('ef'),
    cuentaDestinoId: null,
    comercio: n,
    monto: c(monto),
    tolerancia: c(0),
    frecuencia: 'mensual',
    frecuenciaDias: null,
    primeraFecha: f(fecha),
    fechaFin: null,
    registroAutomatico: false,
    activa: true,
  }) as Programada;
const linea = (programadaId: string, categoria: string, monto: number) =>
  ({
    id: id(`pl-${programadaId}-${categoria}`),
    programadaId: id(programadaId),
    orden: 1,
    monto: c(monto),
    categoriaId: id(categoria),
  }) as ProgramadaLinea;

describe('PRU-DOM-REP', () => {
  it('PRU-DOM-REP-103 ritmo: proyección de Restaurantes, hallazgo con "mover" y totales del cierre', () => {
    const r = ritmo(estado());
    const rest = r.categorias.find((x) => x.categoria.id === 'rest');
    expect(rest).toMatchObject({
      evaluable: true,
      gastoVariable: c(60),
      proyeccionVariable: c(60),
      disponible: c(40),
      disponibleProyectado: c(-20),
      exceso: c(20),
    });
    expect(r.hallazgos).toEqual([
      {
        tipo: 'ritmo',
        clave: 'categoria:rest',
        impacto: c(20),
        estado: 'problema',
        categoria: { id: 'rest', nombre: 'rest' },
        exceso: c(20),
        sobregiroActual: 0,
        fin: f('2027-04-30'),
        accion: { tipo: 'mover', origen: { id: 'ocio', nombre: 'ocio' }, monto: c(20) },
      },
    ]);
    expect(r.proyeccion).toEqual({
      sobregiradas: 1,
      reduccionLpa: c(20),
      sobrante: c(200),
      faltaReservar: [],
    });
  });

  it('PRU-DOM-REP-103 ritmo: una programada pendiente se descuenta; una meta de ahorro impide "mover" y sin origen se asigna', () => {
    const r = ritmo(
      estado((h) => ({
        ...h,
        programadas: [programada('seguro', '2027-04-25', 5), programada('renta', '2027-04-10', 30)],
        programada_lineas: [linea('seguro', 'rest', 5), linea('renta', 'ocio', 30)],
        metas: [
          {
            id: id('m'),
            categoriaId: id('ocio'),
            tipo: 'anual',
            modo: null,
            monto: c(1000),
            fechaObjetivo: null,
            fechaCreacion: f('2027-01-01'),
          } as Meta,
        ],
      })),
    );
    // La atrasada (10/04) también cuenta: ocio queda en 200 − 30; rest en 40 − 60 − 5.
    expect(
      r.categorias.map((x) => [x.categoria.id, x.programadasPendientes, x.disponibleProyectado]),
    ).toEqual([
      ['rest', c(5), c(-25)],
      ['ocio', c(30), c(170)],
    ]);
    expect(r.hallazgos[0]?.accion).toEqual({ tipo: 'asignar', montoNuevo: c(125) });
  });

  it('PRU-DOM-REP-103 ritmo: un consumo que resolvió una ocurrencia no es variable y menos de 3 consumos no se proyectan', () => {
    const r = ritmo(
      estado((h) => ({
        ...h,
        programadas: [programada('seguro', '2027-04-12', 15)],
        programada_lineas: [linea('seguro', 'rest', 15)],
        transacciones: [
          ...h.transacciones,
          { ...h.transacciones[1], id: id('gp'), fecha: f('2027-04-12') } as Transaccion,
        ],
        efectos: [
          ...h.efectos,
          { ...h.efectos[1], id: id('ef-gp'), transaccionId: id('gp') } as Efecto,
        ],
        lineas: [...h.lineas, { ...h.lineas[0], id: id('l-gp'), transaccionId: id('gp') } as Linea],
        ocurrencias_resueltas: [
          {
            id: id('o'),
            programadaId: id('seguro'),
            fechaEsperada: f('2027-04-12'),
            estado: 'emparejada',
            transaccionId: id('gp'),
          },
        ] as unknown as Hechos['ocurrencias_resueltas'],
      })),
    );
    const rest = r.categorias[0];
    expect(rest).toMatchObject({ gastoVariable: c(60), proyeccionVariable: c(60) });
    const pocos = ritmo(
      estado((h) => ({
        ...h,
        transacciones: h.transacciones.filter((t) => t.id !== 'g3'),
        lineas: h.lineas.filter((l) => l.transaccionId !== 'g3'),
        efectos: h.efectos.filter((e) => e.transaccionId !== 'g3'),
      })),
    );
    expect(pocos.categorias[0]).toMatchObject({
      evaluable: false,
      proyeccionVariable: 0,
      exceso: 0,
    });
    expect(pocos.hallazgos).toEqual([]);
  });

  it('PRU-DOM-REP-103 Inicio muestra los RITMO_INICIO_MAX hallazgos de mayor impacto, los mismos del reporte', () => {
    const mas = estado((h) => {
      const extra = ['a', 'b', 'c'].map((n, k) => ({
        id: id(n),
        grupoId: id('g'),
        nombre: n,
        orden: 10 + k,
        clase: 'normal',
        tarjetaId: null,
        archivada: false,
      })) as Categoria[];
      const gastos = extra.flatMap((x, k) =>
        [1, 2, 3].map((d) => ({
          t: { ...h.transacciones[1], id: id(`${x.id}${d}`), fecha: f(`2027-04-0${d + 1}`) },
          e: {
            ...h.efectos[1],
            id: id(`e${x.id}${d}`),
            transaccionId: id(`${x.id}${d}`),
            monto: c(-(10 + k * 5)),
          },
          l: {
            ...h.lineas[0],
            id: id(`l${x.id}${d}`),
            transaccionId: id(`${x.id}${d}`),
            categoriaId: x.id,
            monto: c(10 + k * 5),
          },
        })),
      );
      return {
        ...h,
        categorias: [...h.categorias, ...extra],
        asignaciones: h.asignaciones,
        transacciones: [...h.transacciones, ...gastos.map((x) => x.t as Transaccion)],
        efectos: [...h.efectos, ...gastos.map((x) => x.e as Efecto)],
        lineas: [...h.lineas, ...gastos.map((x) => x.l as Linea)],
      };
    });
    const todos = ritmo(mas).hallazgos;
    expect(todos.map((x) => x.categoria.id)).toEqual(['c', 'b', 'a', 'rest']);
    expect(todos.map((x) => x.impacto)).toEqual([c(120), c(90), c(60), c(20)]);
    expect(inicio(mas, true).atencion.hallazgosRitmo).toEqual(todos.slice(0, 3));
    expect(inicio(estado(), true).atencion.hallazgosRitmo).toHaveLength(1);
  });
});
