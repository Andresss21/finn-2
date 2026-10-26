// Rechazos comunes a todas las operaciones (04 §3.0.6 "Comunes", §7.5). El dominio produce el
// código y sus datos; el mensaje lo arma la aplicación (7.10). Cada operación agrega los suyos.
import type { Rechazo, Violacion } from '../hechos';

/** Códigos de la tabla "Comunes" de 04 §3.0.6 que verifica el marco de `aplicar`, más inv. 18. */
export type CodigoComun =
  | 'fecha_posterior_a_hoy' // inv. 12
  | 'fecha_anterior_a_apertura' // inv. 12, CB-19
  | 'evento_anterior_a_original' // inv. 12
  | 'cuenta_archivada' // §5.0.5, A-1, CB-24
  | 'categoria_archivada' // inv. 20
  | 'periodo_cerrado' // §5.0.4, inv. 18
  | 'invariante_violada'; // §5.0.1; la aplicación lo trata como INTERNO (04 §2.4)

export function rechazo(codigo: CodigoComun, datos: NonNullable<Rechazo['datos']>): Rechazo {
  return { codigo, datos };
}

/** Un rechazo `invariante_violada` por cada violación, con el número y el detalle. */
export const porInvariantes = (vs: readonly Violacion[]): readonly Rechazo[] =>
  vs.map((v) => rechazo('invariante_violada', { invariante: v.invariante, ...v.detalle }));

/** Distingue el rechazo de una operación de su resultado. */
export const esRechazo = (x: object): x is Rechazo => 'codigo' in x;
