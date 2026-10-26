// Metas (01 §4.12 y §7.5; H11, P6, N8, O5, F2, A-4, supuestos 3 y 4). El pedido, la falta y el
// estado son derivados: salen de la meta y de las celdas de `presupuesto` (§4.6). Las únicas
// divisiones son las de `Centavos` (meta semanal y techo de las metas de ahorro, 01 §0.4).
import type { Categoria, Meta, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import type { Celda, Presupuesto } from './disponible';
import { type Ciclo, duracion, type Periodo, periodoDe, periodosEntre } from './periodos';

export type EstadoDeMeta =
  'cubierta' | 'con_faltante' | 'cumplida' | 'en_curso' | 'completada' | 'vencida';

export interface EvaluacionDeMeta {
  readonly metaId: Uuid;
  readonly categoriaId: Uuid;
  readonly periodo: Periodo;
  /** Base(c, p) = Arr(c, p) + Act(c, p) = Disp(c, p) − Asig(c, p). */
  readonly base: Centavos;
  readonly asignado: Centavos;
  /** Monto del período de una meta mensual o semanal; `null` en las de ahorro. */
  readonly montoDelPeriodo: Centavos | null;
  /** FO vigente para p en las metas de ahorro; `null` en las mensuales y semanales. */
  readonly fechaObjetivo: FechaLocal | null;
  /** n(p) en las metas de ahorro; `null` en las mensuales y semanales. */
  readonly periodosRestantes: number | null;
  readonly pedido: Centavos;
  /** Falta(c, p) = máx(0, Pedido − Asig(c, p)). */
  readonly falta: Centavos;
  readonly estado: EstadoDeMeta;
}

type Valores = Pick<Celda, 'arrastre' | 'asignado' | 'actividad' | 'disponible'>;

const cero = Centavos.cero;
const positivo = (x: Centavos) => Centavos.max(cero, x);

/**
 * FO vigente para p. Para una fecha: la indicada. Anual: FO₀ = la indicada o la de creación + 1 año
 * (29 feb → 28 feb), FOₖ = FO₀ + k años, y rige la menor FOₖ ≥ inicio(p) [N8, O5].
 */
export function fechaObjetivo(m: Meta, p: Periodo): FechaLocal {
  if (m.tipo === 'para_fecha') {
    if (m.fechaObjetivo === null) throw new RangeError(`la meta ${m.id} no tiene fecha objetivo`);
    return m.fechaObjetivo;
  }
  if (m.tipo !== 'anual') throw new RangeError(`la meta ${m.id} es ${m.tipo}: no tiene FO`);
  const fo0 = m.fechaObjetivo ?? FechaLocal.sumarAnios(m.fechaCreacion, 1);
  // FOₖ con k = año(inicio) − año(FO₀) − 1 cae en el año anterior al de inicio(p): es < inicio(p).
  const anios = FechaLocal.partes(p.inicio).anio - FechaLocal.partes(fo0).anio - 1;
  let k = Math.max(0, anios);
  while (FechaLocal.sumarAnios(fo0, k) < p.inicio) k += 1;
  return FechaLocal.sumarAnios(fo0, k);
}

/**
 * Valores de la categoría en p. Después del último período de `b` no hay hechos ni asignaciones:
 * Arr = máx(0, último Disp) y Asig = Act = 0. Antes del primero, todo es 0.
 */
function valoresEn(b: Presupuesto, categoriaId: Uuid, p: Periodo): Valores {
  const propias = b.celdas.filter((x) => x.categoriaId === categoriaId);
  const ultima = propias[propias.length - 1];
  if (ultima === undefined) throw new RangeError(`la categoría ${categoriaId} no tiene celdas`);
  const x = propias.find((y) => y.periodo.inicio === p.inicio);
  if (x !== undefined) return x;
  const arrastre = p.inicio > ultima.periodo.inicio ? positivo(ultima.disponible) : cero;
  return { arrastre, asignado: cero, actividad: cero, disponible: arrastre };
}

/**
 * Evalúa la meta en el período p (activo o futuro; por defecto, el activo). `b` sale de los mismos
 * hechos con el mismo `hoy`. Una meta de una categoría archivada no se evalúa: `null` [CB-34].
 */
export function evaluarMeta(
  m: Meta,
  categoria: Pick<Categoria, 'id' | 'archivada'>,
  b: Presupuesto,
  c: Ciclo,
  hoy: FechaLocal,
  p: Periodo = b.activo,
): EvaluacionDeMeta | null {
  if (categoria.id !== m.categoriaId)
    throw new RangeError(`la meta ${m.id} no es de la categoría ${categoria.id}`);
  if (categoria.archivada) return null;
  if (p.inicio < b.activo.inicio) throw new RangeError(`el período ${p.inicio} está cerrado`);
  const x = valoresEn(b, m.categoriaId, p);
  const base = Centavos.sumar(x.arrastre, x.actividad);
  const evaluacion = (
    pedido: Centavos,
    estado: (falta: Centavos) => EstadoDeMeta,
    resto: Pick<EvaluacionDeMeta, 'montoDelPeriodo' | 'fechaObjetivo' | 'periodosRestantes'>,
  ): EvaluacionDeMeta => {
    const falta = positivo(Centavos.restar(pedido, x.asignado));
    const comun = { metaId: m.id, categoriaId: m.categoriaId, periodo: p, base };
    return { ...comun, asignado: x.asignado, ...resto, pedido, falta, estado: estado(falta) };
  };

  if (m.tipo === 'mensual' || m.tipo === 'semanal') {
    const montoDelPeriodo =
      m.tipo === 'mensual' ? m.monto : Centavos.metaSemanalDelPeriodo(m.monto, duracion(p));
    const pedido =
      m.modo === 'rellenar_hasta'
        ? positivo(Centavos.restar(montoDelPeriodo, x.arrastre))
        : montoDelPeriodo;
    return evaluacion(pedido, (falta) => (falta > 0 ? 'con_faltante' : 'cubierta'), {
      montoDelPeriodo,
      fechaObjetivo: null,
      periodosRestantes: null,
    });
  }

  const fo = fechaObjetivo(m, p);
  const n = p.inicio > fo ? 1 : periodosEntre(c, p.inicio, fo).length;
  const alcanza = (d: Centavos) => d >= m.monto;
  const enActivo = alcanza(valoresEn(b, m.categoriaId, b.activo).disponible);
  let estado: EstadoDeMeta = enActivo ? 'cumplida' : 'en_curso';
  if (m.tipo === 'para_fecha' && hoy > fo)
    estado =
      enActivo || alcanza(valoresEn(b, m.categoriaId, periodoDe(c, fo)).disponible)
        ? 'completada'
        : 'vencida';
  const pedido =
    estado === 'completada'
      ? cero
      : Centavos.cuotaConTecho(positivo(Centavos.restar(m.monto, base)), n);
  return evaluacion(pedido, () => estado, {
    montoDelPeriodo: null,
    fechaObjetivo: fo,
    periodosRestantes: n,
  });
}
