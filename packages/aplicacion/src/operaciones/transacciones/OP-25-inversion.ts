// OP-25 Aportar, retirar o ajustar una inversión (04 §3.4): creación. Aporte: efectivo −total, inversión +total y una
// línea a la categoría; retiro: inversión −total, efectivo +total; ajuste: inversión ±total sin efecto presupuestario.
// En el ajuste el total de la entrada lleva signo y la transacción guarda |total| (el signo va en el efecto, 03 §4.5.1).
import { Centavos } from '@finn/dominio/valores';
import { op25, type EntradaOp25, type SalidaTransaccion } from '../../contratos/transacciones.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { altaDe, creacion } from './comunes.ts';

export const OP25: DefinicionOperacion<EntradaOp25, EntradaOp25, SalidaTransaccion> = {
  id: 'OP-25',
  contrato: op25,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia(tx, e, h) {
    const menos = Centavos.negar(e.total);
    const entrada = { ...e, total: Centavos.max(e.total, menos) };
    const tipo = `${e.modalidad}_inversion`;
    if (e.modalidad === 'ajuste')
      return creacion(tx, h, e.id, {
        entrada,
        tipo,
        efectos: [{ cuentaId: e.inversionId, monto: e.total }],
      });
    const inversion = {
      cuentaId: e.inversionId,
      monto: e.modalidad === 'aporte' ? e.total : menos,
    };
    const efectivo = { cuentaId: e.cuentaId, monto: e.modalidad === 'aporte' ? menos : e.total };
    return creacion(tx, h, e.id, {
      entrada,
      tipo,
      efectos: [efectivo, inversion],
      ...(e.modalidad === 'aporte'
        ? { lineas: [{ monto: e.total, destino: { categoriaId: e.categoriaId } }] }
        : {}),
    });
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante, ids) => ({
    operacion: 'OP-25',
    ...altaDe(e, instante, ids),
    inversionId: e.inversionId,
    ...(e.modalidad === 'ajuste'
      ? { modalidad: 'ajuste' as const }
      : e.modalidad === 'retiro'
        ? { modalidad: 'retiro' as const, cuentaId: e.cuentaId }
        : { modalidad: 'aporte' as const, cuentaId: e.cuentaId, categoriaId: e.categoriaId }),
  }),
  salida: (_r, e) => ({ id: e.id }),
};
