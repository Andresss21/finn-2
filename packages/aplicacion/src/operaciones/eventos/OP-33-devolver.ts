// OP-33 Devolver (04 §3.5): creación de una transacción `devolucion` con +total en efectivo o tarjeta. a) Vinculada:
// una línea por parte del reparto, solo con `lineaOriginalId` (DB-05); la cuenta por defecto es la de la compra.
// b) Sin compra original: una línea a la categoría. La huella de 4.6.1 compara además el vínculo de cada línea.
import type { Uuid } from '@finn/dominio';
import { op33, type EntradaOp33 } from '../../contratos/eventos.ts';
import type { SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion, type HuellaCreacion } from '../transacciones/comunes.ts';

export const OP33: DefinicionOperacion<EntradaOp33, EntradaOp33, SalidaTransaccion> = {
  id: 'OP-33',
  contrato: op33,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  async comprobarIdempotencia(tx, e, h) {
    if (!h.transacciones.some((t) => t.id === e.id)) return { tipo: 'aplicar' };
    const deLaCompra = h.efectos.find((f) => f.transaccionId === e.transaccionOriginalId)?.cuentaId;
    const cuentaId = (e.cuentaId ?? deLaCompra ?? '') as Uuid;
    const esperada: HuellaCreacion = {
      entrada: e,
      tipo: 'devolucion',
      efectos: [{ cuentaId, monto: e.total }],
      lineas: e.reparto?.map((r) => ({ monto: r.monto, destino: { sinDestino: true } })) ?? [
        { monto: e.total, destino: { categoriaId: e.categoriaId as Uuid } },
      ],
    };
    const v = await creacion(tx, h, e.id, esperada);
    if (v.tipo !== 'ya_aplicada' || e.reparto === undefined) return v;
    const originales = h.lineas
      .filter((l) => l.transaccionId === e.id)
      .sort((a, b) => a.orden - b.orden)
      .map((l) => l.lineaOriginalId);
    return originales.join() === e.reparto.map((r) => r.lineaId).join()
      ? v
      : { tipo: 'conflicto_id' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => {
    const alta = altaDe(e, instante, ids);
    if (e.transaccionOriginalId !== undefined)
      return {
        operacion: 'OP-33',
        ...alta,
        transaccionOriginalId: e.transaccionOriginalId,
        ...(e.cuentaId === undefined ? {} : { cuentaId: e.cuentaId }),
        reparto: e.reparto ?? [],
      };
    return {
      operacion: 'OP-33',
      ...alta,
      cuentaId: e.cuentaId as Uuid,
      categoriaId: e.categoriaId as Uuid,
    };
  },
  salida: (_r, e) => ({ id: e.id }),
};
