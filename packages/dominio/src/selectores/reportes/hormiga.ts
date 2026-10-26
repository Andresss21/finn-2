// Gastos hormiga (06 §3.5.8, FD-14 [R1], CF-04): compras pequeñas agrupadas por comercio (clave de
// BE-43) y por categoría. El hallazgo lleva datos y un enlace a Actividad; el texto lo arma la
// aplicación (04 §7.10). Las reglas de comercio son [H] y llegan como parámetro.
import type { Instantanea, ReglaComercio, Uuid } from '../../hechos';
import { Centavos } from '../../valores/centavos';
import type { FechaLocal } from '../../valores/fecha-local';
import { nombres, type PeriodoDto, periodoDto, type Ref } from '../comunes';
import {
  claveDeComercio,
  devueltoPorLinea,
  masFrecuente,
  menorPrimero,
  patronesOrdenados,
  SIN_COMERCIO,
} from './agrupacion';
import { conjuntoDeCuentas, contexto, dentro, type FiltroDeReporte, tocaK } from './comunes';
import { HORMIGA_CANT_MIN, HORMIGA_MONTO_MAX, HORMIGA_TOTAL_MIN } from './umbrales';

export interface ParametrosHormiga extends Pick<FiltroDeReporte, 'cuentaIds'> {
  /** Inicio del período a ver; por defecto, el activo. */
  readonly periodo?: FechaLocal;
}

export interface GrupoHormiga {
  readonly agrupacion: 'comercio' | 'categoria';
  readonly clave: string;
  readonly etiqueta: string;
  readonly porRegla?: boolean;
  readonly categoria?: Ref;
  readonly compras: number;
  readonly total: Centavos;
  readonly categoriaPrincipal?: Ref;
}

export interface HallazgoDeHormiga {
  readonly tipo: 'hormiga';
  /** `comercio:<clave BE-43>` o `categoria:<id>`. */
  readonly clave: string;
  readonly impacto: Centavos;
  readonly estado: 'advertencia';
  readonly agrupacion: 'comercio' | 'categoria';
  readonly etiqueta: string;
  readonly compras: number;
  readonly total: Centavos;
  readonly categoria?: Ref;
  readonly comercio?: string;
  /** Enlace a Actividad con el período y el tope de monto (05 §2.2). */
  readonly enlace: {
    readonly pantalla: 'actividad';
    readonly texto?: string;
    readonly categoriaId?: Uuid;
    readonly desde: FechaLocal;
    readonly hasta: FechaLocal;
    readonly montoHasta: Centavos;
  };
}

export interface HormigaSel {
  readonly periodo: PeriodoDto;
  readonly navegacion: { readonly anterior?: FechaLocal; readonly siguiente?: FechaLocal };
  /** Grupos con al menos 2 compras pequeñas, por total descendente. */
  readonly grupos: readonly GrupoHormiga[];
  /** Sin compras en común entre sí; por total descendente. */
  readonly hallazgos: readonly HallazgoDeHormiga[];
}

interface Acumulado {
  readonly agrupacion: 'comercio' | 'categoria';
  readonly clave: string;
  etiqueta: string;
  readonly porRegla?: boolean;
  readonly categoriaId?: Uuid;
  readonly compras: Set<Uuid>;
  total: Centavos;
  readonly porCategoria: Map<Uuid, Centavos>;
  readonly escritos: Map<string, number>;
}

const sumarEn = <K>(m: Map<K, Centavos>, k: K, v: Centavos) =>
  m.set(k, Centavos.sumar(m.get(k) ?? Centavos.cero, v));

export function hormiga(
  i: Instantanea,
  reglas: readonly Pick<ReglaComercio, 'patron'>[],
  parametros: ParametrosHormiga = {},
): HormigaSel {
  const h = i.hechos;
  const periodos = i.presupuesto.periodos;
  const indice = Math.max(
    0,
    periodos.findIndex((p) => p.inicio === (parametros.periodo ?? i.presupuesto.activo.inicio)),
  );
  const p = periodos[indice] ?? i.presupuesto.activo;
  const k = conjuntoDeCuentas(parametros.cuentaIds);
  const cx = contexto(i);
  const nom = nombres(i);
  const patrones = patronesOrdenados(reglas);
  const enP = (f: FechaLocal) => dentro(p, f);
  const devuelto = devueltoPorLinea(i, enP, k);
  const resueltas = new Set(
    h.ocurrencias_resueltas.flatMap((r) =>
      r.transaccionId !== null && r.estado !== 'omitida' ? [r.transaccionId] : [],
    ),
  );

  const acumulados = new Map<string, Acumulado>();
  const grupo = (
    clave: string,
    nuevo: () => Omit<Acumulado, 'compras' | 'total' | 'porCategoria' | 'escritos' | 'clave'>,
  ): Acumulado => {
    let g = acumulados.get(clave);
    if (g === undefined) {
      g = {
        ...nuevo(),
        clave,
        compras: new Set(),
        total: Centavos.cero,
        porCategoria: new Map(),
        escritos: new Map(),
      };
      acumulados.set(clave, g);
    }
    return g;
  };

  for (const t of h.transacciones) {
    if (
      t.tipo !== 'gasto' ||
      !enP(t.fecha) ||
      t.total > HORMIGA_MONTO_MAX ||
      resueltas.has(t.id) ||
      !tocaK(k, cx.cuentasDe(t.id))
    )
      continue;
    const netas = new Map<Uuid, Centavos>();
    for (const l of h.lineas)
      if (l.transaccionId === t.id && l.categoriaId !== null)
        sumarEn(
          netas,
          l.categoriaId,
          Centavos.restar(l.monto, devuelto.get(l.id) ?? Centavos.cero),
        );
    if (netas.size === 0) continue;

    const c = claveDeComercio(patrones, t.comercio);
    const delComercio = grupo(`comercio:${c.clave}`, () => ({
      agrupacion: 'comercio',
      etiqueta: c.etiqueta,
      porRegla: c.porRegla,
    }));
    delComercio.compras.add(t.id);
    delComercio.escritos.set(c.escrito, (delComercio.escritos.get(c.escrito) ?? 0) + 1);
    for (const [categoriaId, neto] of netas) {
      delComercio.total = Centavos.sumar(delComercio.total, neto);
      sumarEn(delComercio.porCategoria, categoriaId, neto);
      const deCategoria = grupo(`categoria:${categoriaId}`, () => ({
        agrupacion: 'categoria',
        etiqueta: nom.categoria(categoriaId).nombre,
        categoriaId,
      }));
      deCategoria.compras.add(t.id);
      deCategoria.total = Centavos.sumar(deCategoria.total, neto);
    }
  }

  const porTotal = (a: Acumulado, b: Acumulado) =>
    b.total - a.total ||
    (a.agrupacion === b.agrupacion ? 0 : a.agrupacion === 'categoria' ? -1 : 1) ||
    menorPrimero(a.clave, b.clave);
  const ordenados = [...acumulados.values()].sort(porTotal);

  const grupos = ordenados
    .filter((g) => g.compras.size >= 2)
    .map((g): GrupoHormiga => {
      if (g.agrupacion === 'categoria')
        return {
          agrupacion: 'categoria',
          clave: g.clave,
          etiqueta: g.etiqueta,
          categoria: nom.categoria(g.categoriaId as Uuid),
          compras: g.compras.size,
          total: g.total,
        };
      const [principal] = [...g.porCategoria].sort(
        (x, y) => y[1] - x[1] || menorPrimero(x[0], y[0]),
      );
      return {
        agrupacion: 'comercio',
        clave: g.clave,
        etiqueta: g.porRegla === true ? g.etiqueta : masFrecuente(g.escritos) || SIN_COMERCIO,
        porRegla: g.porRegla === true,
        compras: g.compras.size,
        total: g.total,
        ...(principal === undefined ? {} : { categoriaPrincipal: nom.categoria(principal[0]) }),
      };
    });

  // Solapamiento [R1]: entre dos grupos que comparten una compra queda el de mayor total (a igual
  // total, el de categoría); se recorre en ese orden y se descarta el que toca compras ya tomadas.
  const tomadas = new Set<Uuid>();
  const hallazgos: HallazgoDeHormiga[] = [];
  for (const g of ordenados) {
    if (g.compras.size < HORMIGA_CANT_MIN || g.total < HORMIGA_TOTAL_MIN) continue;
    if ([...g.compras].some((id) => tomadas.has(id))) continue;
    for (const id of g.compras) tomadas.add(id);
    const base = {
      tipo: 'hormiga',
      clave: g.clave,
      impacto: g.total,
      estado: 'advertencia',
      agrupacion: g.agrupacion,
      compras: g.compras.size,
      total: g.total,
    } as const;
    const enlaceBase = {
      pantalla: 'actividad',
      desde: p.inicio,
      hasta: p.fin,
      montoHasta: HORMIGA_MONTO_MAX,
    } as const;
    if (g.agrupacion === 'categoria') {
      const categoria = nom.categoria(g.categoriaId as Uuid);
      hallazgos.push({
        ...base,
        etiqueta: categoria.nombre,
        categoria,
        enlace: { ...enlaceBase, categoriaId: g.categoriaId as Uuid },
      });
    } else {
      const etiqueta = g.porRegla === true ? g.etiqueta : masFrecuente(g.escritos) || SIN_COMERCIO;
      hallazgos.push({
        ...base,
        etiqueta,
        comercio: etiqueta,
        enlace: { ...enlaceBase, texto: etiqueta },
      });
    }
  }

  const anterior = periodos[indice - 1]?.inicio;
  const proximo = periodos[indice + 1];
  // No se navega a un período que todavía no empezó.
  const siguiente = proximo !== undefined && proximo.inicio <= i.hoy ? proximo.inicio : undefined;
  return {
    periodo: periodoDto(i, p),
    navegacion: {
      ...(anterior === undefined ? {} : { anterior }),
      ...(siguiente === undefined ? {} : { siguiente }),
    },
    grupos,
    hallazgos,
  };
}
