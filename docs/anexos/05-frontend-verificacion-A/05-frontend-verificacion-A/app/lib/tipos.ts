// Subconjunto de 04 §7.1 para la verificación.
export type CategoriaError = 'VALIDACION' | 'DOMINIO' | 'REQUIERE_CONFIRMACION' | 'CONFLICTO' | 'NO_ENCONTRADO'
  | 'NO_AUTORIZADO' | 'OCUPADO' | 'INCIERTO' | 'INTERNO';
export interface Previsualizacion { revisionVista: string; huellaImpacto: string; impacto: { deltaLpa: number } }
export interface ErrorFinn { categoria: CategoriaError; codigo: string; mensaje: string; previsualizacion?: Previsualizacion; datos?: Record<string, unknown> }
export type ResultadoAccion<T> = { ok: true; valor: T; yaAplicada: boolean } | { ok: false; error: ErrorFinn };
