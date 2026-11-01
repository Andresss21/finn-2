// Las operaciones de `@finn/aplicacion` como `OperacionAccionable` (04 §2.3.1): `previsualizar(entrada)` y `confirmar(entrada)`
// con los colaboradores de la petición (la memoria de la instancia y el reloj de prueba). Este archivo NO lleva 'use server':
// solo los de `acciones/` exponen Server Actions.
import { instanteDeLaPeticion, relojDePrueba } from '@finn/aplicacion';
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

export function operacion<E, R, S>(def: DefinicionOperacion<E, R, S>): OperacionAccionable<S> {
  return {
    previsualizar: (entrada) => previsualizar(def, entrada, dependencias()),
    confirmar: (entrada) => confirmar(def, entrada, dependencias()),
  };
}
