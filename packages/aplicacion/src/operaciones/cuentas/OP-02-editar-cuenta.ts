// OP-02 Editar cuenta (04 §3.1): valor absoluto (4.6.2). Cada campo que cambia trae el valor que vio la
// interfaz; bajo el bloqueo, todos en el valor nuevo es `ya_aplicada`, todos en el visto se aplica y cualquier
// otra mezcla es `conflicto_desactualizado` con los valores actuales.
import type { Cuenta } from '@finn/dominio';
import {
  CLAVES_EDITABLES,
  CLAVES_GENERALES,
  CLAVES_SUBTIPO,
  op02,
  type EntradaOp02,
  type SalidaCuenta,
} from '../../contratos/cuentas.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { aDominio, columnasDe, cuentaDe, hechosDe } from './comunes.ts';

type Resuelto = {
  readonly entrada: EntradaOp02;
  readonly campos: Record<string, unknown>;
  readonly subtipo: Record<string, unknown>;
};

const TABLA = { tarjeta: 'tarjetas', prestamo: 'prestamos', inversion: 'inversiones' } as const;

/** Los campos editables que la solicitud cambia, con los nombres del dominio. */
const nuevos = (e: EntradaOp02): Record<string, unknown> =>
  aDominio(Object.fromEntries(CLAVES_EDITABLES.map((k) => [k, (e as Record<string, unknown>)[k]])));

/** Reparte los campos entre la cuenta y su subtipo; uno que no es del tipo de la cuenta es un error de quien llama. */
function repartir(e: EntradaOp02, cuenta: Cuenta | undefined): Resuelto {
  const todos = nuevos(e);
  const generales = new Set(CLAVES_GENERALES);
  const campos = Object.fromEntries(Object.entries(todos).filter(([k]) => generales.has(k)));
  const subtipo = Object.fromEntries(Object.entries(todos).filter(([k]) => !generales.has(k)));
  if (cuenta !== undefined) {
    const propias = cuenta.tipo === 'efectivo' ? [] : columnasDe(CLAVES_SUBTIPO[cuenta.tipo]);
    const ajenos = Object.keys(subtipo).filter((k) => !propias.includes(k));
    if (ajenos.length > 0)
      throw new TypeError(`OP-02: ${ajenos.join(', ')} no son campos de una cuenta ${cuenta.tipo}`);
  }
  return { entrada: e, campos, subtipo };
}

export const OP02: DefinicionOperacion<EntradaOp02, Resuelto, SalidaCuenta> = {
  id: 'OP-02',
  contrato: op02,
  idempotencia: 'valor_absoluto',
  async comprobarIdempotencia(tx, e) {
    const h = await hechosDe(tx);
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
    const actuales = Object.fromEntries(claves.map((k) => [k, actual[k]]));
    return { tipo: 'conflicto_desactualizado', actuales };
  },
  async resolver(tx, e) {
    return repartir(e, await cuentaDe(tx, e.cuentaId));
  },
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
