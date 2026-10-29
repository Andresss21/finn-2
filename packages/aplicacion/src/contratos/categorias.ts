// Contratos de las operaciones de grupos y categorías OP-07 a OP-13 (04 §3.2; BE-08). La salida de cada esquema ya
// es la entrada del dominio: montos en `Centavos`, ids como `Uuid`.
import * as z from 'zod';
import type { Uuid } from '@finn/dominio';
import type { ErrorFinn } from '../errores/index.ts';
import { montoTexto, montoTextoConSigno, textoLimpio, uuid } from './comunes.ts';

const nombre = textoLimpio.max(80, { error: 'El nombre no puede pasar de 80 caracteres.' });
const destino = z.union([z.object({ categoriaId: uuid }), z.literal('lpa')]);

/** OP-07 Crear grupo o categoría (también cada elemento de la variante en lote, CF-19). */
export const elementoOp07 = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('grupo'), id: uuid, nombre }),
  z.object({ tipo: z.literal('categoria'), id: uuid, nombre, grupoId: uuid }),
]);
export const op07 = elementoOp07;
export type EntradaOp07 = z.output<typeof op07>;

/** Variante en lote de OP-07: de 1 a 15 elementos por llamada (CF-19). */
export const op07Lote = z.object({ elementos: z.array(elementoOp07).min(1).max(15) });
export type EntradaOp07Lote = z.output<typeof op07Lote>;

/** OP-08 Renombrar, reordenar o mover: los campos que cambian y, de cada uno, el valor que vio la interfaz (4.6.2). */
export const CLAVES_OP08 = ['nombre', 'grupoId', 'orden'] as const;
const posicion = z.number({ error: 'Ingresá una posición.' }).int().min(1);
export const op08 = z
  .object({
    tipo: z.enum(['grupo', 'categoria']),
    id: uuid,
    nombre: nombre.optional(),
    grupoId: uuid.optional(),
    orden: posicion.optional(),
    esperado: z.object({
      nombre: nombre.optional(),
      grupoId: uuid.optional(),
      orden: posicion.optional(),
    }),
  })
  .superRefine((e, ctx) => {
    const falla = (path: string[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };
    const pedidas = CLAVES_OP08.filter((k) => e[k] !== undefined);
    if (pedidas.length === 0) falla(['nombre'], 'Indicá qué cambiar.');
    if (e.tipo === 'grupo' && e.grupoId !== undefined)
      falla(['grupoId'], 'Un grupo no pertenece a otro grupo.');
    for (const k of pedidas)
      if (e.esperado[k] === undefined) falla(['esperado', k], 'Falta el valor que viste.');
  });
export type EntradaOp08 = z.output<typeof op08>;

/** OP-09 Archivar categoría (compuesta). */
export const op09 = z.object({
  categoriaId: uuid,
  destinoDisponible: destino.optional(),
  cubrirSobregiroCon: destino.optional(),
  devolverAsignacionesFuturas: z.boolean().optional(),
  programadas: z
    .array(
      z.discriminatedUnion('accion', [
        z.object({ programadaId: uuid, accion: z.literal('reasignar'), categoriaId: uuid }),
        z.object({ programadaId: uuid, accion: z.literal('desactivar') }),
      ]),
    )
    .optional(),
});
export type EntradaOp09 = z.output<typeof op09>;

/** OP-10 Desarchivar categoría. */
export const op10 = z.object({ categoriaId: uuid, desarchivarGrupo: z.boolean().optional() });
export type EntradaOp10 = z.output<typeof op10>;

/** OP-11 Sacar el Disponible de una archivada; `esperado` trae Asig(c, A) de las celdas que toca. */
export const op11 = z
  .object({
    categoriaId: uuid,
    monto: montoTexto,
    destino,
    esperado: z.object({
      asignacionOrigen: montoTextoConSigno,
      asignacionDestino: montoTextoConSigno.optional(),
    }),
  })
  .superRefine((e, ctx) => {
    if (e.destino !== 'lpa' && e.esperado.asignacionDestino === undefined)
      ctx.addIssue({
        code: 'custom',
        path: ['esperado', 'asignacionDestino'],
        message: 'Falta el valor que viste.',
      });
  });
export type EntradaOp11 = z.output<typeof op11>;

/** OP-12 Fusionar categorías (`revisionVista` y `huellaImpacto` los separa el marco). */
export const op12 = z.object({ origenId: uuid, destinoId: uuid });
export type EntradaOp12 = z.output<typeof op12>;

/** OP-13 Eliminar categoría o grupo; archivar grupo. */
export const op13 = z.object({
  accion: z.enum(['eliminar_categoria', 'eliminar_grupo', 'archivar_grupo']),
  id: uuid,
});
export type EntradaOp13 = z.output<typeof op13>;

/** Salida común (04 §3.0.3): `id` solo si la operación crea el hecho principal. */
export interface SalidaCategoria {
  readonly id?: Uuid;
}

/** Salida de la variante en lote: por elemento y en el orden de la entrada (04 §3.2, OP-07). */
export interface SalidaOp07Lote {
  readonly elementos: readonly {
    readonly id: Uuid;
    readonly resultado: 'creado' | 'ya_aplicada' | ErrorFinn;
  }[];
}
