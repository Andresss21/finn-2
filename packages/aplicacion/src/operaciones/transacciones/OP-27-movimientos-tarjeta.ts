// OP-27 Movimientos de tarjeta sin compra (04 §3.4): creación. a) avance (tarjeta −total, efectivo +total); b) entrada
// (tarjeta +total); c) transferencia de deuda (la tarjeta de origen +total, la destino −total; AV-24 después). Ninguna
// lleva líneas.
import { Centavos } from '@finn/dominio/valores';
import { op27, type EntradaOp27, type SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion, type EfectoEsperado } from './comunes.ts';

const TIPO = {
  avance: 'avance_efectivo',
  entrada: 'entrada_tarjeta',
  transferencia_deuda: 'transferencia_tarjetas',
} as const;

function efectosDe(e: EntradaOp27): readonly EfectoEsperado[] {
  const menos = Centavos.negar(e.total);
  switch (e.modalidad) {
    case 'avance':
      return [
        { cuentaId: e.tarjetaId, monto: menos },
        { cuentaId: e.cuentaId, monto: e.total },
      ];
    case 'entrada':
      return [{ cuentaId: e.tarjetaId, monto: e.total }];
    case 'transferencia_deuda':
      return [
        { cuentaId: e.tarjetaDestinoId, monto: menos },
        { cuentaId: e.tarjetaId, monto: e.total },
      ];
  }
}

export const OP27: DefinicionOperacion<EntradaOp27, EntradaOp27, SalidaTransaccion> = {
  id: 'OP-27',
  contrato: op27,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia: (tx, e, h) =>
    creacion(tx, h, e.id, { entrada: e, tipo: TIPO[e.modalidad], efectos: efectosDe(e) }),
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => {
    const alta = {
      operacion: 'OP-27' as const,
      ...altaDe(e, instante, ids),
      tarjetaId: e.tarjetaId,
    };
    switch (e.modalidad) {
      case 'avance':
        return { ...alta, modalidad: e.modalidad, cuentaId: e.cuentaId };
      case 'entrada':
        return { ...alta, modalidad: e.modalidad };
      case 'transferencia_deuda':
        return { ...alta, modalidad: e.modalidad, tarjetaDestinoId: e.tarjetaDestinoId };
    }
  },
  salida: (_r, e) => ({ id: e.id }),
};
