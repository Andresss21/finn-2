'use client';
// [C-45] Guardar de la familia v3 (CAMPOS-V3 §5 y §11; 05 §4.3): el botón se ve apagado mientras el contrato no pasa, sigue
// tocable (`aria-disabled`) y dice debajo cuántos campos corregir. Al tocarlo, el formulario marca los errores y el foco va al
// primero, también a los campos que no se registran con `register` (montos, fechas, porcentajes y selecciones).
// Con `monto`, si lo único que falta es ese monto dice «Escribí el monto para guardar.» (`motivoQueFalta`, CAMPOS-V3 §5).
import { useEffect, useRef } from 'react';
import type * as z from 'zod';
import { base } from '../textos/base';
import { motivoQueFalta } from './motivo-v3';

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
  monto,
}: {
  readonly contrato: z.ZodType;
  readonly campos: unknown;
  /** `formState.submitCount`: cada intento de guardar lleva el foco al primer error. */
  readonly intentos: number;
  /** El de `useOperacion` (sin conexión), que manda sobre el de los campos. */
  readonly motivoSinEnvio: string | undefined;
  /** El nombre del campo del monto, para decir «Escribí el monto para guardar.» cuando es lo único que falta. */
  readonly monto?: string;
}) {
  const forma = useRef<HTMLFormElement>(null);
  // El segmentado y el disparador de la lista no llevan `aria-invalid`: su fila con error sí (`data-error`), y el foco va a su
  // primera opción o al disparador.
  useEffect(() => {
    if (intentos > 0)
      forma.current
        ?.querySelector<HTMLElement>(
          '[aria-invalid="true"], .campo-fila[data-error] :is([role=radio], [aria-haspopup=listbox])',
        )
        ?.focus();
  }, [intentos]);
  const faltan = porCorregir(contrato, campos);
  const motivo =
    motivoSinEnvio ??
    (monto === undefined
      ? faltan > 0
        ? base.corregirCampos(faltan)
        : undefined
      : motivoQueFalta(contrato, campos, monto));
  return {
    forma,
    /** Las props de `Boton` para guardar: apagado con su motivo. */
    boton: {
      apagado: faltan > 0,
      ...(motivo === undefined ? {} : { motivoDeshabilitado: motivo }),
    },
  };
}
