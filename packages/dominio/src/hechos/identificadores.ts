// Tipos escalares del contrato público del motor (04 §2.4, §2.4.1). Solo tipos: los constructores
// llegan con quien los necesita (la aplicación valida y marca; el dominio no inventa ids ni instantes).

/** Identificador de fila (UUID en texto). Lo fija la aplicación (BE-31), nunca el dominio. */
export type Uuid = string & { readonly __marca: 'Uuid' };

/** Instante en texto ISO UTC con milisegundos, por ejemplo `2026-10-14T04:04:00.549Z` (04 §13.1). */
export type Instante = string & { readonly __marca: 'Instante' };

/**
 * `bigint` de la base en texto decimal (`secuencia::text`, 04 §5.2). `null` en una fila nueva
 * mientras la base no la haya completado con `RETURNING` (04 §2.4.1).
 */
export type BigintTexto = string & { readonly __marca: 'BigintTexto' };

/** Decimal exacto en texto (`Decimal(18,4)`), por ejemplo el monto en moneda original. */
export type DecimalTexto = string & { readonly __marca: 'DecimalTexto' };

/** Generador de ids para las filas secundarias que crea una operación (04 §2.4.1, BE-31). */
export interface GeneradorIds {
  siguiente(): Uuid;
}
