// Las operaciones de `@finn/aplicacion` como `OperacionAccionable` (04 §2.3.1): `previsualizar(entrada)` y `confirmar(entrada)`
// con los colaboradores de la petición (la memoria de la instancia y el reloj de prueba). Este archivo NO lleva 'use server':
// solo los de `acciones/` exponen Server Actions.
import { instanteDeLaPeticion, relojDePrueba } from '@finn/aplicacion';
import { errorDeValidacion, type ResultadoAccion } from '@finn/aplicacion/errores';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '@finn/aplicacion/operaciones';
import type { OperacionAccionable } from './accion.ts';

const dependencias = (): DepsMarco => ({
  memoria: memoriaDeInstancia,
  opciones: () => ({ reloj: relojDePrueba() }),
  instante: () => instanteDeLaPeticion(),
});

/** Una variante en lote (CF-19): sin vista previa (cada elemento es su propia operación); `confirmar` ejecuta el lote. */
export function operacionLote<S>(
  ejecutar: (cruda: unknown, deps: DepsMarco) => Promise<ResultadoAccion<S>>,
): OperacionAccionable<S> {
  const sinVista = [{ path: ['modo'], message: 'Esta operación no se previsualiza.' }];
  return {
    previsualizar: () => Promise.resolve({ ok: false, error: errorDeValidacion(sinVista) }),
    confirmar: (entrada) => ejecutar(entrada, dependencias()),
  };
}

export function operacion<E, R, S>(def: DefinicionOperacion<E, R, S>): OperacionAccionable<S> {
  return {
    previsualizar: (entrada) => previsualizar(def, entrada, dependencias()),
    confirmar: (entrada) => confirmar(def, entrada, dependencias()),
  };
}
