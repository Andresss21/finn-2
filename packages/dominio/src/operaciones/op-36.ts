// OP-36 Editar movimiento (01 §5.6, 04 §3.6): cambia cuenta, fecha, monto, comercio, tipo, líneas o
// nota de un movimiento que espera una decisión. Sin efectos de cálculo ni en la revisión: el estado y
// las candidatas no cambian. Una línea que cambia se reemplaza con un orden nuevo (BE-16); sin lista
// de líneas, la única sigue al monto, como en OP-28. Aquí viven también lo que comparte con OP-37.
import type * as H from '../hechos';
import type { Centavos } from '../valores/centavos';
import type { Efecto } from './aplicar';
import { distintos } from './op-02';
import { buscar } from './op-07';
import { categoriaNormal } from './op-20';
import { esRechazo, rechazo } from './rechazos';

type R = H.Rechazo;
type Destino = Pick<H.MovimientoLinea, 'categoriaId' | 'deudorId' | 'lineaOriginalId'>;

/** Estados en los que el movimiento espera una decisión (04 OP-36). */
const EDITABLES = new Set(
  'pendiente con_coincidencia posible_duplicado no_reconocido error'.split(' '),
);
/** Los tipos con operación de aprobación (04 §3.6, tabla de OP-37). */
const TIPOS = new Set<H.TipoTransaccion>(['gasto', 'ingreso', 'pago_tarjeta', 'devolucion']);
const SIN: Destino = { categoriaId: null, deudorId: null, lineaOriginalId: null };

/** `movimiento_estado_no_valido` (§7.1); aprobado, con su transacción (idempotencia natural). */
export const estadoNoValido = (m: H.Movimiento): R => ({
  codigo: 'movimiento_estado_no_valido',
  datos: {
    movimientoId: m.id,
    estado: m.estado,
    ...(m.transaccionId !== null && { transaccionId: m.transaccionId }),
  },
});

/** La categoría `id`, normal y activa (inv. 8, 20). */
export function categoriaActiva(h: H.Hechos, id: H.Uuid): H.Categoria | R {
  const c = categoriaNormal(h, id);
  if (esRechazo(c) || !c.archivada) return c;
  return rechazo('categoria_archivada', { categoriaId: c.id });
}

const DESTINO = ['categoriaId', 'deudorId', 'lineaOriginalId'] as const;
const mismo = (a: H.MovimientoLinea, monto: Centavos, d: Destino) =>
  a.monto === monto && DESTINO.every((k) => a[k] === d[k]);

export function op36(antes: H.Instantanea, x: H.ComandoOp36): Efecto | R {
  const { hechos: h } = antes;
  const m = x.movimiento;
  if (!EDITABLES.has(m.estado)) return estadoNoValido(m);
  const { cuentaId, monto, tipoPropuesto } = x.campos;
  const mal = (que: string) => new TypeError(`OP-36 ${m.id}: ${que}`);
  if (typeof monto === 'number' && monto <= 0) throw mal('monto no positivo (CB-28)');
  if (tipoPropuesto && !TIPOS.has(tipoPropuesto)) throw mal(`tipo ${tipoPropuesto} sin aprobación`);
  if (cuentaId) {
    const k = buscar(h.cuentas, cuentaId, 'cuentas');
    if (esRechazo(k)) return k;
  }

  // 04 §3.0.2: `deudorNuevo` reutiliza el deudor de igual nombre sin mayúsculas, o lo crea.
  const deudores: H.Deudor[] = [];
  const destinoDe = (d: H.DestinoMovimiento | undefined): Destino | R => {
    if (d === undefined) return SIN;
    if ('lineaOriginalId' in d) {
      const l = buscar(h.lineas, d.lineaOriginalId, 'lineas');
      return esRechazo(l) ? l : { ...SIN, lineaOriginalId: l.id };
    }
    if ('categoriaId' in d) {
      const c = categoriaActiva(h, d.categoriaId);
      return esRechazo(c) ? c : { ...SIN, categoriaId: c.id };
    }
    if ('deudorId' in d) {
      const k = buscar(h.deudores, d.deudorId, 'deudores');
      return esRechazo(k) ? k : { ...SIN, deudorId: k.id };
    }
    const igual = (y: H.Deudor) => y.nombre.toLowerCase() === d.deudorNuevo.toLowerCase();
    const k = h.deudores.find(igual) ??
      deudores.find(igual) ?? { id: x.ids.siguiente(), nombre: d.deudorNuevo, revision: null };
    if (!h.deudores.includes(k) && !deudores.includes(k)) deudores.push(k);
    return { ...SIN, deudorId: k.id };
  };

  const actuales = [...x.lineas].sort((a, b) => a.orden - b.orden);
  const total = monto === undefined ? m.monto : monto;
  const pedidas: { readonly monto: Centavos; readonly destino: Destino }[] = [];
  for (const l of x.lineasNuevas ?? []) {
    if (l.monto <= 0) throw mal('línea no positiva (CB-28)');
    const destino = destinoDe(l.destino);
    if (esRechazo(destino)) return destino;
    pedidas.push({ monto: l.monto, destino });
  }
  if (x.lineasNuevas === undefined)
    for (const a of actuales)
      pedidas.push({ monto: actuales.length === 1 && total ? total : a.monto, destino: a });

  // BE-16: la línea igual en su posición se conserva; las demás se reemplazan con orden nuevo.
  let orden = Math.max(0, ...actuales.map((l) => l.orden));
  const quedan = actuales.filter((a, n) => {
    const p = pedidas[n];
    return p !== undefined && mismo(a, p.monto, p.destino);
  });
  const tabla = 'movimiento_lineas';
  const lineas = actuales
    .filter((a) => !quedan.includes(a))
    .map((a): H.Cambio => ({ tipo: 'eliminar', tabla, id: a.id }));
  pedidas.forEach(({ monto: v, destino: d }, n) => {
    if (quedan.includes(actuales[n] as H.MovimientoLinea)) return;
    const destino = Object.fromEntries(DESTINO.map((k) => [k, d[k]])) as Destino;
    const fila = { id: x.ids.siguiente(), movimientoId: m.id, orden: ++orden, monto: v };
    lineas.push({ tipo: 'insertar', tabla, fila: { ...fila, ...destino } });
  });
  const campos = distintos(m, x.campos);
  const movimiento: H.Cambio[] = campos
    ? [{ tipo: 'actualizar', tabla: 'movimientos', id: m.id, campos }]
    : [];
  const altas = deudores.map((fila): H.Cambio => ({ tipo: 'insertar', tabla: 'deudores', fila }));
  return { cambios: [...altas, ...movimiento, ...lineas] };
}
