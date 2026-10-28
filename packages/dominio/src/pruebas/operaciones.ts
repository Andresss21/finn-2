// `operacionesArb` (07 §12.5): secuencias de operaciones de 01 §5 con el modelo de `fc.commands`.
// Solo para archivos de prueba. Cada comando lleva índices, no ids: se resuelven contra los hechos
// que tenga el sistema en ese paso, y la precondición la decide `aplicar` (un rechazo es un resultado
// válido y deja los hechos como estaban). Sin reloj ni azar propio: todo sale de la semilla de
// fast-check, y los ids de un contador. La ola 2 (TA-136 a TA-139) agrega sus operaciones a `ESPECIES`.
import fc from 'fast-check';
import { calcular } from '../calculo/calcular';
import { periodoDe } from '../calculo/periodos';
import type {
  ComandoDominio,
  GeneradorIds,
  Hechos,
  Instantanea,
  Instante,
  ResultadoAplicar,
  Uuid,
  VarianteAsignacionRapida,
} from '../hechos';
import { aplicar } from '../operaciones/aplicar';
import { asignacionRapida } from '../operaciones/op-16';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { montoArb } from './generadores';

const INSTANTE = '2027-06-30T12:00:00.000Z' as Instante;

/** Un paso ya ejecutado: lo que había antes, el comando y lo que respondió `aplicar`. */
export interface Paso {
  readonly comando: ComandoDominio;
  readonly antes: Instantanea;
  readonly resultado: ResultadoAplicar;
  /** Los hechos vigentes (serializados) antes y después del paso, tal como los guarda el sistema. */
  readonly fotoAntes: string;
  readonly fotoDespues: string;
}

/** Modelo de `fc.commands`: no guarda nada, porque las precondiciones las decide `aplicar`. */
export type Modelo = Record<string, never>;

/** El sistema real: los hechos vigentes, `hoy` y el contador de ids; `alPaso` recibe cada paso. */
export class Sistema {
  hechos: Hechos;
  readonly pasos: Paso[] = [];
  private n = 0;

  constructor(
    hechos: Hechos,
    readonly hoy: FechaLocal,
    private readonly alPaso?: (p: Paso) => void,
  ) {
    this.hechos = hechos;
  }

  /** Ids nuevos y únicos entre todos los comandos de la corrida. */
  ids(): GeneradorIds {
    return {
      siguiente: () => `ffffffff-0000-4000-8000-${String(++this.n).padStart(12, '0')}` as Uuid,
    };
  }

  /** Aplica un comando; solo un resultado aceptado reemplaza los hechos (04 §5.3). */
  aplicar(comando: ComandoDominio, antes: Instantanea): ResultadoAplicar {
    const fotoAntes = JSON.stringify(this.hechos);
    const resultado = aplicar(this.hechos, comando, this.hoy);
    if (resultado.ok) this.hechos = resultado.hechosNuevos;
    const paso = { comando, antes, resultado, fotoAntes, fotoDespues: JSON.stringify(this.hechos) };
    this.pasos.push(paso);
    this.alPaso?.(paso);
    return resultado;
  }
}

/** Una especie de comando: lo que se genera y cómo se arma contra la instantánea vigente. */
interface Especie<S> {
  readonly nombre: string;
  readonly sel: fc.Arbitrary<S>;
  readonly armar: (i: Instantanea, sel: S, s: Sistema) => ComandoDominio | undefined;
}

const especie = <S>(e: Especie<S>): Especie<S> => e;
const pick = <T>(xs: readonly T[], k: number): T | undefined =>
  xs.length === 0 ? undefined : xs[k % xs.length];

/** El período `k` lugares del activo (negativo = cerrado, positivo = futuro). */
function periodoA(i: Instantanea, k: number): FechaLocal {
  let p = periodoDe(i.ciclo, i.hoy);
  for (let j = 0; j < Math.abs(k); j++)
    p = periodoDe(i.ciclo, FechaLocal.sumarDias(k < 0 ? p.inicio : p.fin, k < 0 ? -1 : 1));
  return p.inicio;
}

const desplazamiento = fc.integer({ min: -3, max: 3 });
const indice = fc.nat(1000);
const normales = (i: Instantanea) => i.hechos.categorias.filter((x) => x.clase === 'normal');
const bandera = fc.boolean();
const nombreArb = fc.nat(1_000_000).map((n) => `Nombre ${n}`);
const VARIANTES: readonly VarianteAsignacionRapida[] = [
  'falta_meta',
  'igual_periodo_anterior',
  'promedio_gasto',
  'cubrir_sobregiro',
];
const destinoDe = (i: Instantanea, k: number, aLpa: boolean) => {
  const otra = pick(normales(i), k);
  return aLpa || otra === undefined ? ('lpa' as const) : { categoriaId: otra.id };
};

/** Las operaciones que tocan períodos, asignaciones y estructura (01 §5.1 a §5.4). */
const ESPECIES = [
  especie({
    nombre: 'OP-14',
    sel: fc.record({ c: indice, p: desplazamiento, monto: montoArb(), negar: bandera }),
    armar: (i, x, s) => {
      const c = pick(normales(i), x.c);
      if (c === undefined) return undefined;
      return {
        operacion: 'OP-14',
        categoriaId: c.id,
        periodoInicio: periodoA(i, x.p),
        montoNuevo: x.negar ? Centavos.negar(x.monto) : x.monto,
        ids: s.ids(),
      };
    },
  }),
  especie({
    nombre: 'OP-15',
    sel: fc.record({ o: indice, d: indice, p: desplazamiento, monto: montoArb() }),
    armar: (i, x, s) => {
      const [o, d] = [pick(normales(i), x.o), pick(normales(i), x.d)];
      if (o === undefined || d === undefined) return undefined;
      return {
        operacion: 'OP-15',
        origenId: o.id,
        destinoId: d.id,
        periodoInicio: periodoA(i, x.p),
        monto: x.monto,
        ids: s.ids(),
      };
    },
  }),
  especie({
    nombre: 'OP-17',
    sel: fc.record({ p: desplazamiento }),
    armar: (i, x, s) => ({ operacion: 'OP-17', periodoInicio: periodoA(i, x.p), ids: s.ids() }),
  }),
  // TA-136: solo variantes que se ofrecen (04 §6.14.4); el ciclo, con cualquier día.
  especie({
    nombre: 'OP-16',
    sel: fc.record({ c: indice, p: desplazamiento, v: fc.nat(3) }),
    armar: (i, x, s) => {
      const c = pick(normales(i), x.c);
      if (c === undefined) return undefined;
      const periodoInicio = periodoA(i, x.p);
      const variante = VARIANTES[x.v] as VarianteAsignacionRapida;
      const valores = asignacionRapida(i, c.id, periodoDe(i.ciclo, periodoInicio));
      const ofrecida = {
        falta_meta: valores.faltaMeta,
        igual_periodo_anterior: valores.igualPeriodoAnterior,
        promedio_gasto: valores.promedioGasto,
        cubrir_sobregiro: valores.cubrirSobregiro,
      }[variante];
      if (ofrecida === undefined) return undefined;
      return { operacion: 'OP-16', categoriaId: c.id, periodoInicio, variante, ids: s.ids() };
    },
  }),
  especie({
    nombre: 'OP-19',
    sel: fc.record({ dia: fc.integer({ min: 1, max: 31 }) }),
    armar: (_i, x, s) => ({ operacion: 'OP-19', diaInicio: x.dia, ids: s.ids() }),
  }),
  especie({
    nombre: 'OP-07',
    sel: fc.record({ g: indice, nombre: nombreArb, grupo: bandera }),
    armar: (i, x, s) => {
      const g = pick(
        i.hechos.grupos.filter((y) => y.claveSistema === null),
        x.g,
      );
      const id = s.ids().siguiente();
      if (x.grupo || g === undefined)
        return { operacion: 'OP-07', id, tipo: 'grupo', nombre: x.nombre };
      return { operacion: 'OP-07', id, tipo: 'categoria', nombre: x.nombre, grupoId: g.id };
    },
  }),
  especie({
    nombre: 'OP-09',
    sel: fc.record({ c: indice, destino: indice, aLpa: bandera }),
    armar: (i, x, s) => {
      const c = pick(normales(i), x.c);
      if (c === undefined) return undefined;
      const destino = destinoDe(i, x.destino, x.aLpa);
      return {
        operacion: 'OP-09',
        categoriaId: c.id,
        ids: s.ids(),
        destinoDisponible: destino,
        cubrirSobregiroCon: destino,
        devolverAsignacionesFuturas: true,
      };
    },
  }),
  especie({
    nombre: 'OP-10',
    sel: fc.record({ c: indice, grupo: bandera }),
    armar: (i, x) => {
      const c = pick(
        i.hechos.categorias.filter((y) => y.archivada),
        x.c,
      );
      if (c === undefined) return undefined;
      return { operacion: 'OP-10', categoriaId: c.id, desarchivarGrupo: x.grupo };
    },
  }),
  especie({
    nombre: 'OP-11',
    sel: fc.record({ c: indice, destino: indice, aLpa: bandera, monto: montoArb() }),
    armar: (i, x, s) => {
      const c = pick(normales(i), x.c);
      if (c === undefined) return undefined;
      const destino = destinoDe(i, x.destino, x.aLpa);
      return { operacion: 'OP-11', categoriaId: c.id, ids: s.ids(), monto: x.monto, destino };
    },
  }),
  especie({
    nombre: 'OP-12',
    sel: fc.record({ o: indice, d: indice }),
    armar: (i, x, s) => {
      const [o, d] = [pick(normales(i), x.o), pick(normales(i), x.d)];
      if (o === undefined || d === undefined) return undefined;
      const ids = s.ids();
      return {
        operacion: 'OP-12',
        origenId: o.id,
        destinoId: d.id,
        ids,
        reglas: [],
        movimientoLineas: [],
      };
    },
  }),
  especie({
    nombre: 'OP-01',
    sel: fc.record({ nombre: nombreArb }),
    armar: (_i, x, s) => ({
      operacion: 'OP-01',
      id: s.ids().siguiente(),
      instante: INSTANTE,
      ids: s.ids(),
      cuenta: { tipo: 'efectivo', nombre: x.nombre, institucionId: null, ultimos4: null },
      saldo: Centavos.cero,
    }),
  }),
  especie({
    nombre: 'OP-04',
    sel: fc.record({ k: indice, devolver: bandera }),
    armar: (i, x) => {
      const k = pick(
        i.hechos.cuentas.filter((y) => !y.archivada),
        x.k,
      );
      if (k === undefined) return undefined;
      return { operacion: 'OP-04', cuentaId: k.id, devolverAsignacionesFuturas: x.devolver };
    },
  }),
  especie({
    nombre: 'OP-05',
    sel: fc.record({ k: indice }),
    armar: (i, x) => {
      const k = pick(
        i.hechos.cuentas.filter((y) => y.archivada),
        x.k,
      );
      return k === undefined ? undefined : { operacion: 'OP-05', cuentaId: k.id };
    },
  }),
  especie({
    nombre: 'OP-06',
    sel: fc.record({ k: indice }),
    armar: (i, x) => {
      const k = pick(i.hechos.cuentas, x.k);
      return k === undefined ? undefined : { operacion: 'OP-06', cuentaId: k.id };
    },
  }),
  especie({
    nombre: 'OP-20',
    sel: fc.record({ k: indice, c: indice, atras: fc.nat(120), monto: montoArb() }),
    armar: (i, x, s) => {
      const [k, c] = [pick(i.hechos.cuentas, x.k), pick(normales(i), x.c)];
      if (k === undefined || c === undefined) return undefined;
      return {
        operacion: 'OP-20',
        id: s.ids().siguiente(),
        instante: INSTANTE,
        ids: s.ids(),
        fecha: FechaLocal.sumarDias(i.hoy, -x.atras),
        total: x.monto,
        cuentaId: k.id,
        lineas: [{ monto: x.monto, destino: { categoriaId: c.id } }],
      };
    },
  }),
  especie({
    nombre: 'OP-21',
    sel: fc.record({ k: indice, monto: montoArb() }),
    armar: (i, x, s) => {
      const k = pick(
        i.hechos.cuentas.filter((y) => y.tipo === 'efectivo'),
        x.k,
      );
      if (k === undefined) return undefined;
      return {
        operacion: 'OP-21',
        id: s.ids().siguiente(),
        instante: INSTANTE,
        ids: s.ids(),
        fecha: i.hoy,
        total: x.monto,
        cuentaId: k.id,
      };
    },
  }),
  // TA-138: condonar, devolver (vinculada a un gasto o sin compra) y eliminar evento.
  especie({
    nombre: 'OP-32',
    sel: fc.record({ l: indice, c: indice, monto: montoArb() }),
    armar: (i, x, s) => {
      const [l, c] = [pick(i.porCobrar, x.l), pick(normales(i), x.c)];
      if (l === undefined || c === undefined) return undefined;
      const id = s.ids().siguiente();
      const base = { operacion: 'OP-32', id, instante: INSTANTE, lineaId: l.lineaId } as const;
      return { ...base, monto: x.monto, fecha: i.hoy, categoriaId: c.id };
    },
  }),
  especie({
    nombre: 'OP-33',
    sel: fc.record({ t: indice, k: indice, c: indice, monto: montoArb(), sin: bandera }),
    armar: (i, x, s) => {
      const k = pick(i.hechos.cuentas, x.k);
      const comun = { operacion: 'OP-33', id: s.ids().siguiente(), instante: INSTANTE } as const;
      const alta = { ...comun, ids: s.ids(), fecha: i.hoy, total: x.monto };
      const c = pick(normales(i), x.c);
      if (x.sin) return k && c && { ...alta, cuentaId: k.id, categoriaId: c.id };
      const t = pick(
        i.hechos.transacciones.filter((y) => y.tipo === 'gasto'),
        x.t,
      );
      const l = t && i.hechos.lineas.find((y) => y.transaccionId === t.id);
      if (t === undefined || l === undefined) return undefined;
      const reparto = [{ lineaId: l.id, monto: x.monto }];
      return { ...alta, transaccionOriginalId: t.id, reparto };
    },
  }),
  especie({
    nombre: 'OP-34',
    sel: fc.record({ e: indice }),
    armar: (i, x, s) => {
      const e = pick(
        i.porCobrar.flatMap((y) => y.eventos),
        x.e,
      );
      if (e === undefined) return undefined;
      const comun = {
        operacion: 'OP-34',
        instante: INSTANTE,
        ids: s.ids(),
        movimientos: [],
      } as const;
      if (e.tipo === 'condonacion') return { ...comun, tipo: e.tipo, condonacionId: e.id };
      const t = i.hechos.lineas.find((y) => y.id === e.id)?.transaccionId ?? e.id;
      return { ...comun, tipo: e.tipo, transaccionId: t };
    },
  }),
  // TA-139: programadas (crear, activar o desactivar), registrar u omitir una ocurrencia y eliminar.
  especie({
    nombre: 'OP-42',
    sel: fc.record({ k: indice, c: indice, monto: montoArb(), atras: fc.nat(60), auto: bandera }),
    armar: (i, x, s) => {
      const k = pick(
        i.hechos.cuentas.filter((y) => y.tipo === 'efectivo' || y.tipo === 'tarjeta'),
        x.k,
      );
      const c = pick(normales(i), x.c);
      if (k === undefined || c === undefined) return undefined;
      return {
        ...{ operacion: 'OP-42', accion: 'crear', id: s.ids().siguiente(), ids: s.ids() },
        ...{ tipo: 'gasto', cuentaId: k.id, cuentaDestinoId: null, comercio: 'Programada' },
        ...{
          monto: x.monto,
          tolerancia: Centavos.cero,
          frecuencia: 'semanal',
          frecuenciaDias: null,
        },
        ...{ primeraFecha: FechaLocal.sumarDias(i.hoy, -x.atras), fechaFin: null },
        ...{ registroAutomatico: x.auto, lineas: [{ monto: x.monto, categoriaId: c.id }] },
      };
    },
  }),
  especie({
    nombre: 'OP-43',
    sel: fc.record({ o: indice, omitir: bandera, eliminar: bandera, activar: bandera }),
    armar: (i, x, s): ComandoDominio | undefined => {
      const o = pick(i.ocurrencias, x.o);
      if (x.eliminar || x.activar) {
        const p = pick(i.hechos.programadas, x.o);
        if (p === undefined) return undefined;
        if (x.activar)
          return { operacion: 'OP-42', accion: 'activar', programadaId: p.id, activa: !p.activa };
        return { operacion: 'OP-51', programadaId: p.id, referencias: 0 };
      }
      if (o === undefined) return undefined;
      const ocurrencia = { programadaId: o.programadaId, fechaEsperada: o.fecha };
      if (x.omitir) return { operacion: 'OP-44', id: s.ids().siguiente(), ...ocurrencia };
      const alta = { id: s.ids().siguiente(), instante: INSTANTE, ids: s.ids() };
      return { operacion: 'OP-43', ...ocurrencia, ...alta };
    },
  }),
];

/** Un comando de `fc.commands`: arma el `ComandoDominio` contra los hechos del paso y lo aplica. */
class Orden<S> implements fc.Command<Modelo, Sistema> {
  constructor(
    private readonly e: Especie<S>,
    private readonly sel: S,
  ) {}
  check(): boolean {
    return true;
  }
  run(_m: Modelo, s: Sistema): void {
    const antes = calcular(s.hechos, s.hoy);
    const comando = this.e.armar(antes, this.sel, s);
    if (comando !== undefined) s.aplicar(comando, antes);
  }
  toString(): string {
    return `${this.e.nombre}(${JSON.stringify(this.sel)})`;
  }
}

const arbitrarios = ESPECIES.map((e) =>
  (e.sel as fc.Arbitrary<unknown>).map((sel) => new Orden(e as Especie<unknown>, sel)),
);

/** Secuencias de hasta `max` operaciones; se ejecutan con `fc.modelRun` sobre un `Sistema`. */
export function operacionesArb(max = 12): fc.Arbitrary<Iterable<fc.Command<Modelo, Sistema>>> {
  return fc.commands(arbitrarios, { maxCommands: max });
}
