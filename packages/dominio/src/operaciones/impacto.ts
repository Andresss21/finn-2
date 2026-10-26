// Impacto de una operación en el período activo (01 §5.0.3, 04 §2.4), sus avisos y la forma
// canónica para la huella (04 §4.3). Compara dos instantáneas: no recalcula fórmulas (ADR-07).
import { avisosDeEstado } from '../avisos/estado';
import { periodoDe } from '../calculo/periodos';
import type { EstadoDeTarjeta } from '../calculo/tarjetas';
import type { AvisoOperacion, Cambio, Impacto, Instantanea, ResultadoAplicar } from '../hechos';
import { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import { claveDe } from './comunes';

const { restar, cero } = Centavos;

/** Δ del valor de cada clave de `a` a `b`, en orden de clave. */
function deltas<T, K>(a: readonly T[], b: readonly T[], par: (x: T) => readonly [K, Centavos]) {
  const [ma, mb] = [new Map(a.map(par)), new Map(b.map(par))];
  return [...new Set([...ma.keys(), ...mb.keys()])]
    .sort()
    .map((k) => ({ k, d: restar(mb.get(k) ?? cero, ma.get(k) ?? cero) }));
}

const delActivo = (i: Instantanea) =>
  i.presupuesto.celdas.filter((x) => x.periodo.inicio === i.presupuesto.activo.inicio);

/** Δ LPA, Δ Disp(c, A), Δ S(t), Δ RE(t) y Δ de la reducción proyectada (§5.0.3); los Δ ≠ 0. */
export function impacto(antes: Instantanea, despues: Instantanea): Omit<Impacto, 'avisos'> {
  const delta = (f: (i: Instantanea) => Centavos) => restar(f(despues), f(antes));
  const disp = deltas(delActivo(antes), delActivo(despues), (x) => [x.categoriaId, x.disponible]);
  const t = (f: (x: EstadoDeTarjeta) => Centavos) =>
    deltas(antes.tarjetas, despues.tarjetas, (x) => [x.tarjetaId, f(x)]);
  const re = t((x) => x.reservaExcedente);
  return {
    deltaLpa: delta((i) => i.lpa.total),
    deltaDisponible: disp.filter((x) => x.d !== 0).map((x) => ({ categoriaId: x.k, delta: x.d })),
    deltaTarjetas: t((x) => x.sinRespaldo).flatMap(({ k, d }, n) => {
      const deltaReserva = re[n]?.d ?? cero;
      return d === 0 && deltaReserva === 0 ? [] : [{ tarjetaId: k, deltaSaldo: d, deltaReserva }];
    }),
    deltaReduccionProyectadaLpaAlCierre: delta((i) => i.reduccionProyectada),
  };
}

const CON_FECHA = new Set(['transacciones', 'efectos', 'lineas', 'condonaciones', 'asignaciones']);

/** La fecha de una fila de `CON_FECHA` (la de su transacción, o su período), si está en los hechos. */
function fechaEn({ hechos: h }: Instantanea, tabla: string, id: string): FechaLocal | undefined {
  if (tabla === 'condonaciones') return h.condonaciones.find((x) => x.id === id)?.fecha;
  if (tabla === 'asignaciones') return h.asignaciones.find((x) => x.id === id)?.periodoInicio;
  const otras = [...h.efectos, ...h.lineas];
  const tx = tabla === 'transacciones' ? id : otras.find((x) => x.id === id)?.transaccionId;
  return h.transacciones.find((t) => t.id === tx)?.fecha;
}

/** §5.0.3: la operación escribe un hecho con fecha en un período cerrado o lo cambia de período. */
export function retroactiva(antes: Instantanea, despues: Instantanea, cambios: readonly Cambio[]) {
  const cerrado = (i: Instantanea, f: FechaLocal | undefined) =>
    f !== undefined && f < i.presupuesto.activo.inicio;
  const periodo = (i: Instantanea, f: FechaLocal | undefined) =>
    f === undefined ? undefined : periodoDe(i.ciclo, f).inicio;
  return cambios.some((x) => {
    if (x.tipo === 'eliminarConciliacionesDeCuenta' || !CON_FECHA.has(x.tabla)) return false;
    const id = x.tipo === 'insertar' ? claveDe(x.fila) : x.id;
    const [a, d] = [antes, despues].map((i) => fechaEn(i, x.tabla, id));
    return (
      cerrado(antes, a) ||
      cerrado(despues, d) ||
      (a !== undefined && d !== undefined && periodo(antes, a) !== periodo(despues, d))
    );
  });
}

/** Avisos de estado que aparecen o cambian por la operación (04 §3.0.5): se informan después. */
export function avisosNuevosDeEstado(antes: Instantanea, despues: Instantanea): AvisoOperacion[] {
  const forma = (i: Instantanea) =>
    new Map(
      avisosDeEstado(i).map((x) => [`${x.aviso}|${x.clave}`, { clave: x.clave, ...x.datos }]),
    );
  const previos = forma(antes);
  return [...forma(despues)]
    .filter(([k, datos]) => JSON.stringify(previos.get(k)) !== JSON.stringify(datos))
    .map(([k, datos]) => ({
      codigo: k.slice(0, k.indexOf('|')) as AvisoOperacion['codigo'],
      momento: 'despues',
      requiereConfirmacion: false,
      datos,
    }));
}

/** Forma canónica: claves ordenadas, listas ordenadas por su forma, ids nuevos como `@nueva#k`. */
function canonica(v: unknown, nuevas: ReadonlyMap<unknown, string>): unknown {
  if (Array.isArray(v))
    return v
      .map((x) => canonica(x, nuevas))
      .sort((x, y) => (JSON.stringify(x) < JSON.stringify(y) ? -1 : 1));
  if (typeof v === 'object' && v !== null)
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, canonica((v as Record<string, unknown>)[k], nuevas)]),
    );
  return nuevas.get(v) ?? v;
}

/**
 * Serialización canónica de `impacto` y `avisos` (04 §4.3, V-20): todo id de una fila insertada pasa
 * a `@nueva#k` (k = posición de su `insertar` en los cambios) y las listas se ordenan después, para
 * que tampoco el orden dependa del generador. La aplicación calcula el SHA-256 de este texto.
 */
export function formaCanonicaDelImpacto(
  r: Pick<Extract<ResultadoAplicar, { ok: true }>, 'cambios' | 'impacto' | 'avisos'>,
): string {
  const nuevas = new Map<unknown, string>();
  r.cambios.forEach((x, k) => {
    if (x.tipo === 'insertar' && !nuevas.has(claveDe(x.fila)))
      nuevas.set(claveDe(x.fila), `@nueva#${k}`);
  });
  return JSON.stringify(canonica({ impacto: r.impacto, avisos: r.avisos }, nuevas));
}
