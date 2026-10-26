// Reporte `top_comercios` (04 §6.9.2 y §6.9.6, BE-43, R3): dónde más se gasta. Sobre las
// transacciones de tipo `gasto` con fecha en W, agrupadas por la regla de comercio que coincide
// (el patrón más largo; a igual largo, el primero en orden alfabético) o por el comercio normalizado.
// Se consideran todas las reglas, también las de categorías archivadas. El selector es puro: las
// reglas ([H]) se las pasa la consulta.
import type { Instantanea, ReglaComercio, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import {
  conjuntoDeCuentas,
  contexto,
  dentro,
  type FiltroDeReporte,
  periodosDeVentana,
  tocaK,
} from './comunes';

export interface ParametrosTopComercios extends FiltroDeReporte {
  /** Por defecto 10. */
  readonly limite?: number;
}

export interface Variante {
  readonly comercio: string;
  readonly monto: Centavos;
  readonly frecuencia: number;
}

export interface ComercioDelTop {
  readonly clave: string;
  readonly etiqueta: string;
  readonly porRegla: boolean;
  readonly monto: Centavos;
  readonly frecuencia: number;
  readonly categoriaPrincipal: Uuid;
  readonly variantes: readonly Variante[];
}

const SIN_COMERCIO = '(sin comercio)';

/** Minúsculas, sin espacios en los extremos ni repetidos (04 §4.17). */
const normalizar = (c: string): string => c.trim().replace(/\s+/g, ' ').toLowerCase();

const menorPrimero = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

interface Grupo {
  etiqueta: string;
  porRegla: boolean;
  monto: Centavos;
  frecuencia: number;
  porCategoria: Map<Uuid, Centavos>;
  variantes: Map<string, { monto: Centavos; frecuencia: number }>;
  escritos: Map<string, number>;
}

export function topComercios(
  i: Instantanea,
  reglas: readonly Pick<ReglaComercio, 'patron'>[],
  parametros: ParametrosTopComercios = {},
): ComercioDelTop[] {
  const k = conjuntoDeCuentas(parametros.cuentaIds);
  const ventana = periodosDeVentana(i, parametros.ventana);
  const enW = (f: Parameters<typeof dentro>[1]) => ventana.some((p) => dentro(p, f));
  const cx = contexto(i);
  const h = i.hechos;
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const patrones = reglas
    .map((r) => r.patron)
    .sort((a, b) => b.length - a.length || menorPrimero(a, b));

  // Devoluciones vinculadas a una línea, con fecha en W y cuenta en K.
  const devuelto = new Map<Uuid, Centavos>();
  for (const l of h.lineas) {
    const t = txs.get(l.transaccionId);
    if (t?.tipo !== 'devolucion' || l.lineaOriginalId === null) continue;
    if (!enW(t.fecha) || !tocaK(k, cx.cuentasDe(t.id))) continue;
    devuelto.set(
      l.lineaOriginalId,
      Centavos.sumar(devuelto.get(l.lineaOriginalId) ?? Centavos.cero, l.monto),
    );
  }

  const grupos = new Map<string, Grupo>();
  for (const t of h.transacciones) {
    if (t.tipo !== 'gasto' || !enW(t.fecha) || !tocaK(k, cx.cuentasDe(t.id))) continue;
    const lineas = h.lineas.filter((l) => l.transaccionId === t.id && l.categoriaId !== null);
    if (lineas.length === 0) continue;
    const escrito = t.comercio === null ? '' : t.comercio.trim();
    const normal = normalizar(escrito);
    const patron = patrones.find((p) => normal.includes(p.toLowerCase()));
    const clave = patron ?? (normal === '' ? SIN_COMERCIO : normal);
    const g: Grupo = grupos.get(clave) ?? {
      etiqueta: patron ?? SIN_COMERCIO,
      porRegla: patron !== undefined,
      monto: Centavos.cero,
      frecuencia: 0,
      porCategoria: new Map(),
      variantes: new Map(),
      escritos: new Map(),
    };
    let monto = Centavos.cero;
    for (const l of lineas) {
      const neto = Centavos.restar(l.monto, devuelto.get(l.id) ?? Centavos.cero);
      monto = Centavos.sumar(monto, neto);
      const c = l.categoriaId as Uuid;
      g.porCategoria.set(c, Centavos.sumar(g.porCategoria.get(c) ?? Centavos.cero, neto));
    }
    g.monto = Centavos.sumar(g.monto, monto);
    g.frecuencia += 1;
    const nombre = normal === '' ? SIN_COMERCIO : normal;
    const v = g.variantes.get(nombre) ?? { monto: Centavos.cero, frecuencia: 0 };
    g.variantes.set(nombre, {
      monto: Centavos.sumar(v.monto, monto),
      frecuencia: v.frecuencia + 1,
    });
    g.escritos.set(escrito, (g.escritos.get(escrito) ?? 0) + 1);
    grupos.set(clave, g);
  }

  return [...grupos.entries()]
    .map(([clave, g]): ComercioDelTop => {
      const [principal] = [...g.porCategoria].sort(
        (a, b) => b[1] - a[1] || menorPrimero(a[0], b[0]),
      );
      const [masFrecuente] = [...g.escritos].sort(
        (a, b) => b[1] - a[1] || menorPrimero(a[0], b[0]),
      );
      return {
        clave,
        etiqueta: g.porRegla ? g.etiqueta : masFrecuente?.[0] || SIN_COMERCIO,
        porRegla: g.porRegla,
        monto: g.monto,
        frecuencia: g.frecuencia,
        categoriaPrincipal: principal?.[0] as Uuid,
        variantes: [...g.variantes]
          .map(([comercio, v]) => ({ comercio, ...v }))
          .sort((a, b) => b.monto - a.monto || menorPrimero(a.comercio, b.comercio)),
      };
    })
    .sort((a, b) => b.monto - a.monto || menorPrimero(a.clave, b.clave))
    .slice(0, parametros.limite ?? 10);
}
