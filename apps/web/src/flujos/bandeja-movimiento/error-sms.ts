'use client';
// SMS con error (FT-38, OP-49): la referencia que se copia y la entrada de «Intentar de nuevo». La referencia es el `idError`
// que Finn guardó junto al error (04 §7.8, «Ajustes > Diagnóstico»); si el detalle no trae uno (por ejemplo `content_type`, un
// cuerpo que el webhook no pudo leer), es el propio detalle saneado. No calcula nada del motor (PF-3).
import { useCallback, useState } from 'react';

const ID_ERROR = /\bE-[0-9A-HJKMNP-TV-Z]{6}\b/;

export const referenciaDe = (errorDetalle: string | undefined): string =>
  errorDetalle === undefined ? '' : (ID_ERROR.exec(errorDetalle)?.[0] ?? errorDetalle);

/** La entrada de OP-49: el SMS y el último intento que vio la pantalla (`intentoVisto`, CA-38.3). */
export const entradaDeReproceso = (m: {
  readonly sms: { readonly id?: string };
  readonly procesamiento?: { readonly intento: number };
}): { smsId: string; intentoVisto: number } | undefined =>
  m.sms.id === undefined
    ? undefined
    : { smsId: m.sms.id, intentoVisto: m.procesamiento?.intento ?? 0 };

/** «Copiar referencia»: copia al portapapeles y deja `copia` en `copiada` o `fallo` para avisarlo. */
export function useCopiarReferencia() {
  const [copia, setCopia] = useState<'nada' | 'copiada' | 'fallo'>('nada');
  const copiar = useCallback((referencia: string): void => {
    void navigator.clipboard.writeText(referencia).then(
      () => {
        setCopia('copiada');
      },
      () => {
        setCopia('fallo');
      },
    );
  }, []);
  return { copia, copiar };
}
