// OP-20 Registrar gasto (01 §5.4, 04 §3.4): un efecto −total en efectivo o tarjeta y sus líneas a
// categorías normales o a por cobrar (P10, N3). Aquí vive también el alta PT (04 §3.0.4) y las
// precondiciones que comparten OP-21 a OP-24 y OP-27; las de fecha y archivo las verifica `aplicar`.
import type * as H from '../hechos';
import { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { esRechazo } from './rechazos';

type R = H.Rechazo;

/** Un efecto de la tabla de 03 §4.5.1; `interes` y `seguro`, solo en el préstamo de una cuota. */
export interface Parte {
  readonly cuentaId: H.Uuid;
  readonly monto: Centavos;
  readonly interes?: Centavos;
  readonly seguro?: Centavos;
}
export type LineaNueva = Pick<H.Linea, 'monto' | 'categoriaId' | 'deudorId'> &
  Partial<Pick<H.Linea, 'lineaOriginalId'>>; // solo en una devolución vinculada (OP-33a)

/** La cuenta `id` si existe y su tipo es uno de `tipos`; si no, `no_encontrado` o `cuenta_tipo_no_valido`. */
export function cuentaDe(h: H.Hechos, id: H.Uuid, ...tipos: H.TipoCuenta[]): H.Cuenta | R {
  const k = buscar(h.cuentas, id, 'cuentas');
  if (esRechazo(k) || tipos.includes(k.tipo)) return k;
  return { codigo: 'cuenta_tipo_no_valido', datos: { cuentaId: id, tipo: k.tipo } };
}

/** La categoría `id`, normal (inv. 8); el archivo lo verifica `aplicar` (inv. 20). */
export function categoriaNormal(h: H.Hechos, id: H.Uuid): H.Categoria | R {
  const c = buscar(h.categorias, id, 'categorias');
  if (esRechazo(c) || c.clase === 'normal') return c;
  return { codigo: 'categoria_de_pago_no_permitida', datos: { categoriaId: id } };
}

/** PT: la transacción, sus efectos y sus líneas (orden 1..n), con ids del generador. */
export function alta(
  x: H.AltaTransaccion,
  tipo: H.TipoTransaccion,
  partes: readonly Parte[],
  lineas: readonly LineaNueva[] = [],
): H.Cambio[] {
  if (x.total <= 0 || lineas.some((l) => l.monto <= 0))
    throw new TypeError(`${tipo}: monto no positivo (CB-28)`);
  const origen = x.origen ?? 'manual';
  const fila: H.Transaccion = {
    id: x.id,
    tipo,
    fecha: x.fecha,
    horaRegistro: x.instante,
    claveOrden: x.instante,
    secuencia: null,
    origen,
    estadoBancario: origen === 'importada' ? 'confirmada' : 'pendiente',
    conciliacionId: null,
    comercio: x.comercio ?? null,
    nota: x.nota ?? null,
    total: x.total,
    monedaOriginal: x.monedaOriginal ?? null,
    montoOriginal: x.montoOriginal ?? null,
    lineaCobradaId: null,
    revision: null,
  };
  const comunes = { transaccionId: x.id, revision: null };
  return [
    { tipo: 'insertar', tabla: 'transacciones', fila },
    ...partes.map(({ cuentaId, monto, interes = null, seguro = null }): H.Cambio => {
      const efecto = { id: x.ids.siguiente(), cuentaId, monto, interes, seguro, ...comunes };
      return { tipo: 'insertar', tabla: 'efectos', fila: efecto };
    }),
    ...lineas.map((l, n): H.Cambio => {
      const linea = { id: x.ids.siguiente(), orden: n + 1, lineaOriginalId: null, ...l };
      return { tipo: 'insertar', tabla: 'lineas', fila: { ...linea, ...comunes } };
    }),
  ];
}

/** Σ líneas = total (inv. 6). */
export function sumaDistinta(total: Centavos, montos: readonly Centavos[]): R | undefined {
  const suma = montos.reduce(Centavos.sumar, Centavos.cero);
  return suma === total ? undefined : { codigo: 'suma_lineas_distinta', datos: { suma, total } };
}

export function op20(antes: H.Instantanea, x: H.ComandoOp20): Efecto | R {
  const { hechos: h } = antes;
  const k = cuentaDe(h, x.cuentaId, 'efectivo', 'tarjeta');
  if (esRechazo(k)) return k;
  const distinta = sumaDistinta(
    x.total,
    x.lineas.map((l) => l.monto),
  );
  if (distinta !== undefined) return distinta;
  const deudores: H.Deudor[] = [];
  const lineas: LineaNueva[] = [];
  for (const { monto, destino } of x.lineas) {
    if ('categoriaId' in destino) {
      const c = categoriaNormal(h, destino.categoriaId);
      if (esRechazo(c)) return c;
      lineas.push({ monto, categoriaId: c.id, deudorId: null });
      continue;
    }
    let d: H.Deudor | R;
    if ('deudorId' in destino) d = buscar(h.deudores, destino.deudorId, 'deudores');
    else {
      // 04 §3.0.2: el mismo nombre sin mayúsculas reutiliza el deudor (también uno de esta alta).
      const nombre = destino.deudorNuevo;
      const igual = (y: H.Deudor) => y.nombre.toLowerCase() === nombre.toLowerCase();
      d = h.deudores.find(igual) ??
        deudores.find(igual) ?? { id: x.ids.siguiente(), nombre, revision: null };
      if (!h.deudores.includes(d) && !deudores.includes(d)) deudores.push(d);
    }
    if (esRechazo(d)) return d;
    lineas.push({ monto, categoriaId: null, deudorId: d.id });
  }
  const efecto = { cuentaId: k.id, monto: Centavos.negar(x.total) };
  return {
    cambios: [
      ...deudores.map((fila): H.Cambio => ({ tipo: 'insertar', tabla: 'deudores', fila })),
      ...alta(x, 'gasto', [efecto], lineas),
    ],
  };
}
