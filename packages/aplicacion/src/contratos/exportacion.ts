// Contrato de la exportación (OPT-08; 04 §3.10, §16; 02 ADR-22): el formato pedido y la forma del JSON de hechos con
// su versión de formato. Montos del JSON en centavos enteros (como los guarda la base); los del CSV, con el guion
// ASCII y dos decimales (04 §3.0.6, CF-15).
import * as z from 'zod';

/** Versión del formato del JSON; sube cuando cambia su forma. */
export const VERSION_FORMATO = 1;

export const formatoExportacion = z.enum(['json', 'csv'], { error: 'El formato no es válido.' });
export type FormatoExportacion = z.infer<typeof formatoExportacion>;

export const exportacionJson = z.strictObject({
  aplicacion: z.literal('finn'),
  versionFormato: z.literal(VERSION_FORMATO),
  revision: z.string().regex(/^\d+$/),
  hoy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Las 18 tablas [M] del motor, con todas sus filas. */
  hechos: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});
export type ExportacionJson = z.infer<typeof exportacionJson>;

export interface ArchivoExportado {
  readonly nombre: string;
  readonly tipoMime: string;
  readonly contenido: string;
}
