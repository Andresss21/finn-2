// OP-45 y OP-47 como `OperacionAccionable` (04 §2.3.1, §9): necesitan las claves de la carga firmada (04 §14.2) y el reloj de la
// petición, que `crearConciliacion` recibe una vez por llamada. Las claves se leen al llamar, nunca al importar: la compilación
// corre sin variables (compilar.mjs). Este archivo NO lleva 'use server': solo los de `acciones/` exponen Server Actions.
import { ahoraMsDeLaPeticion } from '@finn/aplicacion';
import {
  crearConciliacion,
  type ClavesConciliacion,
} from '@finn/aplicacion/operaciones/conciliacion';
import type { OperacionAccionable } from './accion.ts';
import { operacion, operacionLote } from './operaciones.ts';

/** `FINN_CONCILIACION_CLAVES` = `k2:<base64>,k1:<…>` y `FINN_CONCILIACION_CLAVE_ACTIVA` (04 §9.6). */
export function clavesDeConciliacion(
  env: Readonly<Record<string, string | undefined>> = process.env,
): ClavesConciliacion {
  const pares = (env['FINN_CONCILIACION_CLAVES'] ?? '').split(',').filter((p) => p.includes(':'));
  const claves = Object.fromEntries(
    pares.map((p) => [p.slice(0, p.indexOf(':')), p.slice(p.indexOf(':') + 1)]),
  );
  const activa = env['FINN_CONCILIACION_CLAVE_ACTIVA'] ?? '';
  if (!Object.hasOwn(claves, activa))
    throw new Error('finn: falta la clave activa de la conciliación (04 §14.2)');
  return { activa, claves };
}

const conciliacion = () =>
  crearConciliacion({
    claves: clavesDeConciliacion(),
    // Control técnico de la carga firmada, no una fecha de negocio (04 §9.6): el reloj de la petición
    ahoraMs: () => ahoraMsDeLaPeticion(),
  });

/** OP-45 es de lectura: solo `confirmar` la ejecuta, igual que una variante en lote. */
export const iniciar: OperacionAccionable<unknown> = operacionLote((cruda, deps) =>
  conciliacion().iniciar(cruda, deps),
);

export const terminar: OperacionAccionable<unknown> = {
  previsualizar: (entrada) => operacion(conciliacion().OP47).previsualizar(entrada),
  confirmar: (entrada) => operacion(conciliacion().OP47).confirmar(entrada),
};
