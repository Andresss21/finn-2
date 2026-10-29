// OP-53 Verificar saldo (04 §3.8, CF-01): creación de `conciliaciones` (4.6.1) sin CSV, con `modo = 'saldo'`. Pide
// confirmación siempre (previsualizar primero, FE-07); la previsualización lleva `propuesta` con el saldo de Finn, la
// diferencia y cuántas transacciones marcaría (4.3 [CH-36]); AV-21 llega en los avisos si la diferencia no es cero.
// La repetición se compara por cuenta, fecha, saldo y, con `ids`, el conjunto marcado; con `todas` lo marcado depende
// de los hechos del momento y no se compara.
import { propuestaDeVerificacion } from '@finn/dominio/selectores';
import { Centavos } from '@finn/dominio/valores';
import { op53, type EntradaOp53 } from '../../contratos/conciliacion.ts';
import type { DefinicionOperacion } from '../marco.ts';

type Salida = { readonly id: EntradaOp53['id'] };

export const OP53: DefinicionOperacion<EntradaOp53, EntradaOp53, Salida> = {
  id: 'OP-53',
  contrato: op53,
  idempotencia: 'creacion',
  exigeConfirmacion: true,
  idPrincipal: (e) => e.id,
  comprobarIdempotencia(_tx, e, h) {
    const c = h.conciliaciones.find((x) => x.id === e.id);
    if (c === undefined) return { tipo: 'aplicar' };
    const tarjeta = h.cuentas.find((k) => k.id === e.cuentaId)?.tipo === 'tarjeta';
    const saldo = tarjeta ? Centavos.negar(e.saldoEstado) : e.saldoEstado;
    const marcadas = new Set(
      h.transacciones.filter((t) => t.conciliacionId === e.id).map((t) => t.id),
    );
    const iguales =
      c.cuentaId === e.cuentaId &&
      c.fechaEstado === e.fechaEstado &&
      c.saldoEstado === saldo &&
      c.modo === 'saldo' &&
      ('todas' in e.marcar ||
        (marcadas.size === new Set(e.marcar.ids).size &&
          e.marcar.ids.every((i) => marcadas.has(i))));
    return iguales ? { tipo: 'ya_aplicada', salida: { id: e.id } } : { tipo: 'conflicto_id' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  proponer: (_tx, e, h) => propuestaDeVerificacion(h, e),
  comando: (e, instante) => ({
    operacion: 'OP-53',
    id: e.id,
    instante,
    cuentaId: e.cuentaId,
    fechaEstado: e.fechaEstado,
    saldoEstado: e.saldoEstado,
    marcar: e.marcar,
  }),
  salida: (_r, e) => ({ id: e.id }),
};
