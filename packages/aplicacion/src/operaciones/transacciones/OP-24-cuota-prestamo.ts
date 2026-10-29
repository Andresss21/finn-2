// OP-24 Pagar cuota de préstamo o abonar a capital (04 §3.4): creación. Origen −total; en el préstamo −capital (con
// interés y seguro solo en una cuota); una línea a la categoría por el total. El desglose de una cuota es el que
// confirmó o corrigió el usuario; la propuesta del modelo va en la `propuesta` de la previsualización (04 §4.3 [CH-36]).
// En un abono todo el total es capital. `numeroCuota` solo elige la cuota de esa propuesta: no se guarda (03 no tiene
// la columna) y el comando del dominio no lo lleva.
import { calcular } from '@finn/dominio';
import { desglosePropuesto } from '@finn/dominio/selectores';
import { Centavos, FechaLocal } from '@finn/dominio/valores';
import { op24, type EntradaOp24, type SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from './comunes.ts';

/** El desglose que usa el comando: en un abono, todo capital. */
const desgloseDe = (e: EntradaOp24) =>
  e.modalidad === 'cuota'
    ? { capital: e.capital, interes: e.interes, seguro: e.seguro }
    : { capital: e.total, interes: Centavos.cero, seguro: Centavos.cero };

export const OP24: DefinicionOperacion<EntradaOp24, EntradaOp24, SalidaTransaccion> = {
  id: 'OP-24',
  contrato: op24,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia(tx, e, h) {
    const { capital, interes, seguro } = desgloseDe(e);
    return creacion(tx, h, e.id, {
      entrada: e,
      tipo: e.modalidad === 'cuota' ? 'cuota_prestamo' : 'abono_capital',
      efectos: [
        { cuentaId: e.origenId, monto: Centavos.negar(e.total) },
        {
          cuentaId: e.prestamoId,
          monto: Centavos.negar(capital),
          ...(e.modalidad === 'cuota' ? { interes, seguro } : {}),
        },
      ],
      lineas: [{ monto: e.total, destino: { categoriaId: e.categoriaId } }],
    });
  },
  resolver: (_tx, e) => Promise.resolve(e),
  /** Anexo A.2 puntos 7 y 8: la cuota emparejada con la fecha (o `numeroCuota`) y su desglose (6.14.4). */
  proponer(tx, e, h) {
    if (e.modalidad !== 'cuota') return undefined;
    const i = calcular(h, FechaLocal.desdeTexto(tx.estado.hoy));
    return desglosePropuesto(i, e.prestamoId, e.fecha, e.numeroCuota) ?? {};
  },
  comando: (e, instante, ids) => ({
    operacion: 'OP-24',
    ...altaDe(e, instante, ids),
    modalidad: e.modalidad,
    origenId: e.origenId,
    prestamoId: e.prestamoId,
    categoriaId: e.categoriaId,
    ...desgloseDe(e),
  }),
  salida: (_r, e) => ({ id: e.id }),
};
