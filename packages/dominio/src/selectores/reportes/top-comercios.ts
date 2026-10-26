// Reporte `top_comercios` (04 §6.9.2 y §6.9.6, BE-43, R3): dónde más se gasta. Sobre las
// transacciones de tipo `gasto` con fecha en W, agrupadas por la regla de comercio que coincide
// (el patrón más largo; a igual largo, el primero en orden alfabético) o por el comercio normalizado.
// Se consideran todas las reglas, también las de categorías archivadas. El selector es puro: las
// reglas ([H]) se las pasa la consulta.
import type { Instantanea, ReglaComercio, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import {
  claveDeComercio,
  devueltoPorLinea,
  masFrecuente,
  menorPrimero,
  patronesOrdenados,
  SIN_COMERCIO,
} from './agrupacion';
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
  const patrones = patronesOrdenados(reglas);
  // Devoluciones vinculadas a una línea, con fecha en W y cuenta en K.
  const devuelto = devueltoPorLinea(i, enW, k);

  const grupos = new Map<string, Grupo>();
  for (const t of h.transacciones) {
    if (t.tipo !== 'gasto' || !enW(t.fecha) || !tocaK(k, cx.cuentasDe(t.id))) continue;
    const lineas = h.lineas.filter((l) => l.transaccionId === t.id && l.categoriaId !== null);
    if (lineas.length === 0) continue;
    const { clave, porRegla, etiqueta, variante, escrito } = claveDeComercio(patrones, t.comercio);
    const g: Grupo = grupos.get(clave) ?? {
      etiqueta,
      porRegla,
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
    const v = g.variantes.get(variante) ?? { monto: Centavos.cero, frecuencia: 0 };
    g.variantes.set(variante, {
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
      return {
        clave,
        etiqueta: g.porRegla ? g.etiqueta : masFrecuente(g.escritos) || SIN_COMERCIO,
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
