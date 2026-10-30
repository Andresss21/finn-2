// OP-48 Registrar o editar las condiciones de un préstamo (04 §3.9): valor absoluto (4.6.2), como OP-02 pero solo sobre
// los campos de `prestamos`. Cada campo que cambia trae el valor que vio la interfaz; bajo el bloqueo, todos en el
// valor nuevo es `ya_aplicada`, todos en el visto se aplica y cualquier otra mezcla es `conflicto_desactualizado`.
// Una cuenta que existe pero no es préstamo sigue a `aplicar`: el dominio la rechaza con `cuenta_tipo_no_valido`.
import {
  CLAVES_PRESTAMO,
  op48,
  type EntradaOp48,
  type SalidaCuenta,
} from '../../contratos/cuentas.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { aContrato, aDominio } from './comunes.ts';

const campos = (e: Readonly<Record<string, unknown>>): Record<string, unknown> =>
  aDominio(Object.fromEntries(CLAVES_PRESTAMO.map((k) => [k, e[k]])));

export const OP48: DefinicionOperacion<EntradaOp48, EntradaOp48, SalidaCuenta> = {
  id: 'OP-48',
  contrato: op48,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(_tx, e, h) {
    const prestamo = h.prestamos.find((p) => p.cuentaId === e.prestamoId);
    if (prestamo === undefined)
      return h.cuentas.some((c) => c.id === e.prestamoId)
        ? { tipo: 'aplicar' }
        : { tipo: 'no_encontrado' };
    const actual: Readonly<Record<string, unknown>> = { ...prestamo };
    const nuevo = campos(e);
    const visto = aDominio(e.esperado);
    const claves = Object.keys(nuevo);
    if (claves.every((k) => actual[k] === nuevo[k])) return { tipo: 'ya_aplicada', salida: {} };
    if (claves.every((k) => actual[k] === visto[k])) return { tipo: 'aplicar' };
    const actuales = aContrato(Object.fromEntries(claves.map((k) => [k, actual[k]])));
    return { tipo: 'conflicto_desactualizado', actuales };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({
    operacion: 'OP-48',
    prestamoId: e.prestamoId,
    campos: campos(e),
    esperado: aDominio(e.esperado),
  }),
  salida: () => ({}),
};
