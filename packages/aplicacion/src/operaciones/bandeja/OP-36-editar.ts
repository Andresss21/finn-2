// OP-36 Editar movimiento (04 §3.6): valor absoluto (4.6.2); las líneas se comparan en orden, como en `esperado`.
import type { Hechos } from '@finn/dominio';
import {
  CAMPOS_OP36,
  op36,
  type EntradaOp36,
  type LineaVista,
  type SalidaMovimiento,
} from '../../contratos/bandeja.ts';
import type { DefinicionOperacion } from '../marco.ts';
import {
  cargarMovimiento,
  lineasVistas,
  mismasLineas,
  resolverMovimiento,
  type ContextoMovimiento,
} from './comunes.ts';

type Campo = (typeof CAMPOS_OP36)[number];

const EDITABLES = ['pendiente', 'con_coincidencia', 'posible_duplicado', 'no_reconocido', 'error'];

/** El destino pedido de cada línea como tres columnas; `deudorNuevo` se reconoce por nombre sin mayúsculas. */
const lineasPedidas = (h: Hechos, lineas: NonNullable<EntradaOp36['lineas']>): LineaVista[] =>
  lineas.map(({ monto, destino: d = {} }) => {
    const nuevo = 'deudorNuevo' in d ? d.deudorNuevo.toLowerCase() : undefined;
    const deudor =
      'deudorId' in d ? d.deudorId : h.deudores.find((x) => x.nombre.toLowerCase() === nuevo)?.id;
    return {
      monto,
      categoriaId: 'categoriaId' in d ? d.categoriaId : null,
      deudorId: nuevo === undefined && !('deudorId' in d) ? null : (deudor ?? null),
      lineaOriginalId: 'lineaOriginalId' in d ? d.lineaOriginalId : null,
    };
  });

const iguales = (k: Campo, a: unknown, b: unknown): boolean =>
  k === 'lineas'
    ? mismasLineas(a as LineaVista[], b as LineaVista[])
    : JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export const OP36: DefinicionOperacion<
  EntradaOp36,
  ContextoMovimiento & { readonly entrada: EntradaOp36 },
  SalidaMovimiento
> = {
  id: 'OP-36',
  contrato: op36,
  idempotencia: 'valor_absoluto',
  async comprobarIdempotencia(tx, e, h) {
    const c = await cargarMovimiento(tx, e.movimientoId);
    if (c === null) return { tipo: 'no_encontrado' };
    const { movimiento: m } = c;
    if (!EDITABLES.includes(m.estado)) return { tipo: 'aplicar' }; // lo rechaza el dominio
    const claves = CAMPOS_OP36.filter((k) => e[k] !== undefined);
    const actual: Record<Campo, unknown> = { ...m, lineas: lineasVistas(c.lineas) };
    const nuevo = (k: Campo) => (k === 'lineas' ? lineasPedidas(h, e.lineas ?? []) : e[k]);
    if (claves.every((k) => iguales(k, actual[k], nuevo(k))))
      return { tipo: 'ya_aplicada', salida: { movimientoId: m.id, estado: m.estado } };
    if (claves.every((k) => iguales(k, actual[k], e.esperado[k]))) return { tipo: 'aplicar' };
    return {
      tipo: 'conflicto_desactualizado',
      actuales: Object.fromEntries(claves.map((k) => [k, actual[k]])),
    };
  },
  async resolver(tx, e) {
    return { ...(await resolverMovimiento(tx, e.movimientoId)), entrada: e };
  },
  comando: ({ movimiento, lineas, entrada: e }, _instante, ids) => ({
    operacion: 'OP-36',
    movimiento,
    lineas,
    ids,
    campos: Object.fromEntries(
      CAMPOS_OP36.filter((k) => k !== 'lineas' && e[k] !== undefined).map((k) => [k, e[k]]),
    ),
    ...(e.lineas === undefined
      ? {}
      : {
          lineasNuevas: e.lineas.map((l) => ({
            monto: l.monto,
            ...(l.destino && { destino: l.destino }),
          })),
        }),
  }),
  salida: (_r, { movimiento }) => ({ movimientoId: movimiento.id, estado: movimiento.estado }),
};
