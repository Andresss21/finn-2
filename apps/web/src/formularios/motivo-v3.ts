'use client';
// [C-45] «Guardar» de los formularios v3 (CAMPOS-V3 §5 y §11): se ve apagado mientras falte algo, sigue tocable y dice debajo qué
// falta; al tocarlo, el contrato marca los errores y el foco va al primero. Lo usan Registrar ingreso, Cobrar y Editar
// transacción; Registrar gasto tiene su propio motivo (C-49 §3). Las pantallas de Cuentas tienen el suyo (#588): aquí el
// único faltante del monto dice «Escribí el monto para guardar.» (CAMPOS-V3 §5).
import { useEffect, type RefObject } from 'react';
import type * as z from 'zod';
import { base } from '../textos/base';

/** Qué falta para guardar: «Escribí el monto para guardar.» si es solo el monto; si no, cuántos campos corregir. */
export function motivoQueFalta(
  contrato: z.ZodType,
  valores: unknown,
  monto = 'total',
): string | undefined {
  const r = contrato.safeParse(valores);
  if (r.success) return undefined;
  const rutas = new Set(r.error.issues.map((i) => i.path.join('.')));
  return rutas.size === 1 && rutas.has(monto) ? base.motivoMonto : base.corregirCampos(rutas.size);
}

/** Después de tocar Guardar con errores, el foco va al primero (CA-K3-13). */
export function useFocoAlPrimerError(forma: RefObject<HTMLElement | null>, intentos: number): void {
  useEffect(() => {
    // [C-45] El disparador de la lista y el segmentado no llevan `aria-invalid`: su fila con error sí (`data-error`).
    if (intentos > 0)
      forma.current
        ?.querySelector<HTMLElement>(
          '[aria-invalid="true"], .campo-fila[data-error] :is([role=radio], [aria-haspopup=listbox])',
        )
        ?.focus();
  }, [forma, intentos]);
}
