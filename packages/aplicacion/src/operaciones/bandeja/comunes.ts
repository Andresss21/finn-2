// Piezas de OP-36, OP-37, OP-39 y OP-40 (04 §3.6): el movimiento [H] con su SMS [I] (BE-10) y la salida de aprobar (CP-15).
import { leerDatosDeBandeja, type LectorTx } from '@finn/db';
import type {
  Cambio,
  GeneradorIds,
  Hechos,
  Instante,
  Movimiento,
  MovimientoConTexto,
  MovimientoLinea,
  ReglaComercio,
  Uuid,
} from '@finn/dominio';
import type { LineaVista, SalidaAprobacion, SalidaMovimiento } from '../../contratos/bandeja.ts';
import { ErrorValidacion, type Veredicto } from '../marco.ts';

export interface ContextoMovimiento {
  readonly movimiento: Movimiento;
  readonly lineas: readonly MovimientoLinea[];
  readonly recibidoEn: Instante;
  readonly texto: string;
  readonly reglas: readonly ReglaComercio[];
  /** Todos los movimientos con el texto de su SMS (duplicados, 4.17). */
  readonly movimientos: readonly MovimientoConTexto[];
}
export type SalidaAprobada = SalidaMovimiento & SalidaAprobacion;

/** El movimiento `id` con su SMS, o `null` si no existe. */
export async function cargarMovimiento(tx: LectorTx, id: Uuid): Promise<ContextoMovimiento | null> {
  const b = await leerDatosDeBandeja(tx);
  const x = b.movimientos.find((y) => y.movimiento.id === id);
  if (x === undefined) return null;
  const sms = new Map(b.sms.map((s) => [s.id, s]));
  const propio = sms.get(x.movimiento.smsId);
  if (propio === undefined) throw new Error(`El movimiento ${id} no tiene su SMS`);
  return {
    movimiento: x.movimiento,
    lineas: [...x.lineas].sort((a, c) => a.orden - c.orden),
    recibidoEn: propio.recibidoEn,
    texto: propio.texto,
    reglas: b.reglas,
    movimientos: b.movimientos.map(({ movimiento: m }) => ({
      ...m,
      texto: sms.get(m.smsId)?.texto ?? '',
    })),
  };
}

/**
 * `resolver`: un movimiento inexistente solo llega de `previsualizar` (`confirmar` responde `no_encontrado` antes). Si
 * se aprueba, un pago de tarjeta pide la cuenta de la que salió, que el SMS no informa (04 OP-37).
 */
export async function resolverMovimiento(
  tx: LectorTx,
  id: Uuid,
  aprobando?: { readonly origenId?: Uuid | undefined },
): Promise<ContextoMovimiento> {
  const c = await cargarMovimiento(tx, id);
  if (c === null) throw new ErrorValidacion('movimientoId', 'Este movimiento ya no existe.');
  if (aprobando && c.movimiento.tipoPropuesto === 'pago_tarjeta' && !aprobando.origenId)
    throw new ErrorValidacion('origenId', 'Elegí de qué cuenta salió el pago.');
  return c;
}

/** Las líneas como las muestra `esperado.lineas` del DTO de la bandeja. */
export const lineasVistas = (lineas: readonly MovimientoLinea[]): LineaVista[] =>
  lineas.map((l) => ({
    monto: l.monto,
    categoriaId: l.categoriaId,
    deudorId: l.deudorId,
    lineaOriginalId: l.lineaOriginalId,
  }));

/** ¿Son las mismas líneas, en el mismo orden? */
export const mismasLineas = (a: readonly LineaVista[], b: readonly LineaVista[]): boolean =>
  JSON.stringify(a.map((l) => Object.values(l))) === JSON.stringify(b.map((l) => Object.values(l)));

/** Los campos que el dominio cambió en el movimiento `id` (F4 de `movimientos`). */
export const camposDeMovimiento = (cambios: readonly Cambio[], id: Uuid): Partial<Movimiento> =>
  (
    cambios.find((c) => c.tipo === 'actualizar' && c.tabla === 'movimientos' && c.id === id) as
      { campos: Partial<Movimiento> } | undefined
  )?.campos ?? {};

/** La salida de una aprobación (CP-15): lo que la transacción dejó según los hechos, con la cuenta del movimiento. */
export function salidaAprobada(h: Hechos, m: Movimiento): SalidaAprobada {
  const t = h.transacciones.find((x) => x.id === m.transaccionId);
  const cuenta = h.cuentas.find((k) => k.id === m.cuentaId);
  if (t === undefined || cuenta === undefined)
    throw new Error(`El movimiento ${m.id} no quedó aprobado`);
  const lineas = h.lineas.filter((l) => l.transaccionId === t.id);
  const [una] = lineas;
  const ref = (id: Uuid, lista: readonly { id: Uuid; nombre: string }[]) => ({
    id,
    nombre: lista.find((x) => x.id === id)?.nombre ?? '',
  });
  const destino =
    lineas.length !== 1 || una === undefined
      ? { partes: lineas.length }
      : una.categoriaId !== null
        ? { categoria: ref(una.categoriaId, h.categorias) }
        : una.deudorId !== null
          ? { deudor: ref(una.deudorId, h.deudores) }
          : { partes: 1 };
  const { id, nombre } = cuenta;
  const aprobado = {
    total: t.total,
    comercio: t.comercio,
    fecha: t.fecha,
    cuenta: { id, nombre },
    destino,
  };
  return { movimientoId: m.id, estado: 'aprobado', transaccionId: t.id, aprobado };
}

/**
 * Idempotencia de una aprobación (OP-37, OP-40): aprobado → `ya_aplicada` con su transacción; un `id` que ya es de
 * otra transacción → `conflicto_id` (4.6.1). `undefined` si hay que seguir.
 */
export function veredictoDeAprobacion(
  m: Movimiento,
  h: Hechos,
  id: Uuid,
): Veredicto<SalidaAprobada> | undefined {
  if (m.estado === 'aprobado' && h.transacciones.some((t) => t.id === m.transaccionId))
    return { tipo: 'ya_aplicada', salida: salidaAprobada(h, m) };
  return h.transacciones.some((t) => t.id === id) ? { tipo: 'conflicto_id' } : undefined;
}

/** Lo que el dominio recibe de una aprobación (OP-37 y la confirmación de OP-40). */
export const aprobacionDe = (
  r: ContextoMovimiento,
  e: { id: Uuid; origenId?: Uuid | undefined; recordarRegla?: boolean | undefined },
  instante: Instante,
  ids: GeneradorIds,
) => ({
  movimiento: r.movimiento,
  lineas: r.lineas,
  id: e.id,
  instante,
  recibidoEn: r.recibidoEn,
  ids,
  reglas: r.reglas,
  ...(e.origenId === undefined ? {} : { origenId: e.origenId }),
  ...(e.recordarRegla === undefined ? {} : { recordarRegla: e.recordarRegla }),
});
