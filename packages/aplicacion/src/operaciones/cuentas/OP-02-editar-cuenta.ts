// OP-02 Editar cuenta (04 §3.1): valor absoluto (4.6.2). Cada campo que cambia trae el valor que vio la
// interfaz; bajo el bloqueo, todos en el valor nuevo es `ya_aplicada`, todos en el visto se aplica y cualquier
// otra mezcla es `conflicto_desactualizado` con los valores actuales.
import {
  CLAVES_EDITABLES,
  CLAVES_GENERALES,
  op02,
  type EntradaOp02,
  type SalidaCuenta,
} from '../../contratos/cuentas.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { aContrato, aDominio } from './comunes.ts';

type Resuelto = {
  readonly entrada: EntradaOp02;
  readonly campos: Record<string, unknown>;
  readonly subtipo: Record<string, unknown>;
};

const TABLA = { tarjeta: 'tarjetas', prestamo: 'prestamos', inversion: 'inversiones' } as const;

/** Los campos editables que la solicitud cambia, con los nombres del dominio. */
const nuevos = (e: EntradaOp02): Record<string, unknown> =>
  aDominio(Object.fromEntries(CLAVES_EDITABLES.map((k) => [k, (e as Record<string, unknown>)[k]])));

/** Reparte los campos entre la cuenta y su subtipo (uno ajeno al tipo lo rechaza la comprobación de 4.6.2). */
function repartir(e: EntradaOp02): Resuelto {
  const todos = Object.entries(nuevos(e));
  const generales = new Set(CLAVES_GENERALES);
  const campos = Object.fromEntries(todos.filter(([k]) => generales.has(k)));
  const subtipo = Object.fromEntries(todos.filter(([k]) => !generales.has(k)));
  return { entrada: e, campos, subtipo };
}

export const OP02: DefinicionOperacion<EntradaOp02, Resuelto, SalidaCuenta> = {
  id: 'OP-02',
  contrato: op02,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(_tx, e, h) {
    const cuenta = h.cuentas.find((c) => c.id === e.cuentaId);
    if (cuenta === undefined) return { tipo: 'no_encontrado' };
    const sub =
      cuenta.tipo === 'efectivo'
        ? undefined
        : h[TABLA[cuenta.tipo]].find((s) => s.cuentaId === cuenta.id);
    const actual: Readonly<Record<string, unknown>> = { ...sub, ...cuenta };
    const nuevo = nuevos(e);
    const visto = aDominio(e.esperado);
    const claves = Object.keys(nuevo);
    const ajeno = claves.find((k) => !(k in actual)); // un campo de otro tipo de cuenta (error de quien llama)
    if (ajeno !== undefined)
      throw new TypeError(`OP-02: ${ajeno} no es un campo de una cuenta ${cuenta.tipo}`);
    if (claves.every((k) => actual[k] === nuevo[k])) return { tipo: 'ya_aplicada', salida: {} };
    if (claves.every((k) => actual[k] === visto[k])) return { tipo: 'aplicar' };
    // `actuales` con los nombres del contrato, los mismos que la interfaz envió (04 §4.6.2)
    const actuales = aContrato(Object.fromEntries(claves.map((k) => [k, actual[k]])));
    return { tipo: 'conflicto_desactualizado', actuales };
  },
  resolver: (_tx, e) => Promise.resolve(repartir(e)),
  comando: ({ entrada, campos, subtipo }, instante, ids) => ({
    operacion: 'OP-02',
    cuentaId: entrada.cuentaId,
    instante,
    ids,
    campos,
    ...(Object.keys(subtipo).length === 0 ? {} : { subtipo }),
  }),
  salida: () => ({}),
};
