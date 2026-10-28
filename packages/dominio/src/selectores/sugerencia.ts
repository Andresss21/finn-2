// Sugerencia de categoría para un comercio y comercios recientes (04 §6.14.3), y la forma de
// `Propuesta` extendida (04 §3.0.3, CF-05; 06 §3.6). Es el mismo criterio de §4.17 que usa la bandeja
// (OP-35 paso 10): `sugerirCategoria`. El texto de una propuesta (voseo, 7.10) lo pone la aplicación.
import { normalizarComercio, categoriaPorHistorial, reglaDeComercio } from '../criterios/categoria';
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type { Instantanea, ReglaComercio, TipoCuenta, Uuid } from '../hechos';
import { ajuste } from '../operaciones/op-47';
import { nombres, type Ref } from './comunes';

/** Cuántos comercios devuelve `comerciosRecientes` (04 §6.14.3). */
export const COMERCIOS_RECIENTES_MAX = 300;

/** `Propuesta` extendida (CF-05). `un_toque`: entrada completa; `abrir_flujo`: valores iniciales. */
export interface Propuesta {
  readonly aviso: 'AV-08' | 'AV-14' | 'AV-21' | 'AV-22' | 'regla_comercio' | 'hallazgo';
  readonly texto: string;
  readonly operacion:
    'OP-11' | 'OP-14' | 'OP-15' | 'OP-18' | 'OP-20' | 'OP-21' | 'OP-27' | 'OP-41' | 'OP-42';
  readonly ejecucion: 'un_toque' | 'abrir_flujo';
  readonly entrada: Readonly<Record<string, unknown>>;
}

/** "Recordar esta categoría para este comercio": OP-41 crear, de un toque (el `id` lo agrega el cliente). */
export const propuestaDeRegla = (texto: string, patron: string, categoriaId: Uuid): Propuesta => ({
  aviso: 'regla_comercio',
  texto,
  operacion: 'OP-41',
  ejecucion: 'un_toque',
  entrada: { patron, categoriaId },
});

/**
 * AV-21: ajuste de conciliación (FD-06). La operación sale de la cuenta y del signo de la diferencia
 * (tabla de OP-47); se abre el flujo con cuenta, fecha del estado, total y comercio fijos.
 */
export function propuestaDeAjuste(
  texto: string,
  x: {
    readonly cuentaId: Uuid;
    readonly tipoCuenta: TipoCuenta;
    readonly fechaEstado: FechaLocal;
    readonly diferencia: Centavos;
    readonly total: Centavos;
  },
): Propuesta {
  const a = ajuste(x.tipoCuenta, x.diferencia);
  return {
    aviso: 'AV-21',
    texto,
    operacion: a.operacion as 'OP-20' | 'OP-21' | 'OP-27',
    ejecucion: 'abrir_flujo',
    entrada: {
      cuentaId: x.cuentaId,
      fecha: x.fechaEstado,
      total: x.total,
      comercio: 'Ajuste de conciliación',
    },
  };
}

export interface Sugerencia {
  readonly categoria: Ref;
  readonly origen: 'regla' | 'historial';
}

/** `consultas.sugerencia({ comercio })` (6.14.3): la regla de patrón más largo; si no, el historial. */
export function sugerencia(
  i: Instantanea,
  reglas: readonly ReglaComercio[],
  comercio: string | null,
): Sugerencia | null {
  if (comercio === null) return null;
  const regla = reglaDeComercio(i.hechos, reglas, comercio)?.categoriaId;
  const id = regla ?? categoriaPorHistorial(i.hechos, comercio);
  return id === undefined
    ? null
    : { categoria: nombres(i).categoria(id), origen: regla === undefined ? 'historial' : 'regla' };
}

export interface ComercioReciente {
  readonly comercio: string;
  readonly ultimoUso: FechaLocal;
  readonly usos: number;
  readonly sugerencia: Sugerencia | null;
}

/** Los comercios de los gastos agrupados por comercio normalizado (§4.17), del uso más reciente al más antiguo. */
export function comerciosRecientes(
  i: Instantanea,
  reglas: readonly ReglaComercio[],
  limite: number = COMERCIOS_RECIENTES_MAX,
): ComercioReciente[] {
  const grupos = new Map<
    string,
    { comercio: string; ultimo: string; ultimoUso: FechaLocal; usos: number }
  >();
  for (const t of i.hechos.transacciones) {
    if (t.tipo !== 'gasto' || t.comercio === null || t.comercio.trim() === '') continue;
    const clave = normalizarComercio(t.comercio);
    const orden = `${t.fecha}|${t.claveOrden}`;
    const g = grupos.get(clave);
    if (g === undefined) {
      grupos.set(clave, { comercio: t.comercio, ultimo: orden, ultimoUso: t.fecha, usos: 1 });
      continue;
    }
    g.usos += 1;
    if (orden > g.ultimo) {
      g.comercio = t.comercio;
      g.ultimo = orden;
    }
    if (t.fecha > g.ultimoUso) g.ultimoUso = t.fecha;
  }
  return [...grupos.entries()]
    .sort(([ka, a], [kb, b]) =>
      a.ultimoUso !== b.ultimoUso ? (a.ultimoUso < b.ultimoUso ? 1 : -1) : ka < kb ? -1 : 1,
    )
    .slice(0, limite)
    .map(([, g]) => ({
      comercio: g.comercio,
      ultimoUso: g.ultimoUso,
      usos: g.usos,
      sugerencia: sugerencia(i, reglas, g.comercio),
    }));
}
