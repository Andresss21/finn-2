'use client';
// [C-45] Guardar de la familia v3 (CAMPOS-V3 §5 y §11; 05 §4.3): el botón se ve apagado mientras el contrato no pasa, sigue
// tocable (`aria-disabled`) y dice debajo cuántos campos corregir. Al tocarlo, el formulario marca los errores y el foco va al
// primero, también a los campos que no se registran con `register` (montos, fechas, porcentajes y selecciones).
import { useEffect, useRef } from 'react';
import type * as z from 'zod';
import { base } from '../textos/base';

/** Cuántos campos faltan o están mal según el contrato del formulario. */
export function porCorregir(contrato: z.ZodType, campos: unknown): number {
  const r = contrato.safeParse(campos);
  return r.success ? 0 : new Set(r.error.issues.map((i) => i.path.join('.'))).size;
}

export function useGuardarV3({
  contrato,
  campos,
  intentos,
  motivoSinEnvio,
}: {
  readonly contrato: z.ZodType;
  readonly campos: unknown;
  /** `formState.submitCount`: cada intento de guardar lleva el foco al primer error. */
  readonly intentos: number;
  /** El de `useOperacion` (sin conexión), que manda sobre el de los campos. */
  readonly motivoSinEnvio: string | undefined;
}) {
  const forma = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (intentos > 0) forma.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [intentos]);
  const faltan = porCorregir(contrato, campos);
  const motivo = motivoSinEnvio ?? (faltan > 0 ? base.corregirCampos(faltan) : undefined);
  return {
    forma,
    /** Las props de `Boton` para guardar: apagado con su motivo. */
    boton: { apagado: faltan > 0, ...(motivo === undefined ? {} : { motivoDeshabilitado: motivo }) },
  };
}
