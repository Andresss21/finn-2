'use client';
// Cuerpo de `error.tsx` (05 §7.3, FE-28): la referencia es el `digest` y «Intentar de nuevo» pide otra vez los Server
// Components (`router.refresh()`) y reinicia el límite (`reset()`) dentro de una transición. Marcado del export de diseño,
// pantalla 14 «Error de pantalla»: tarjeta con el mensaje, la referencia con «Copiar referencia» (06-identidad-visual 2.19) y el botón.
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { base } from '../../textos/base';
import { estados } from '../../textos/estados';
import { Boton } from '../base/boton';
import { Icono } from '../base/icono';

export function ErrorDeLaPantalla({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const router = useRouter();
  const [copiada, setCopiada] = useState(false);
  const { digest } = error;
  return (
    <main>
      <div
        role="alert"
        className="mx-5 mt-1 flex flex-col items-start gap-2.5 rounded-contenedor bg-fondo p-4.5 shadow-elevacion-1"
      >
        <p className="font-semibold text-texto">{estados.errorTitulo}</p>
        {digest === undefined ? null : (
          <div className="flex items-center gap-1.5">
            <span className="text-cuerpo-pequeno tabular-nums text-texto-secundario">
              {estados.referencia(digest)}
            </span>
            <button
              type="button"
              aria-label={estados.copiarReferencia}
              onClick={() => {
                void navigator.clipboard.writeText(digest).then(
                  () => {
                    setCopiada(true);
                  },
                  () => undefined,
                );
              }}
              className="flex size-11 items-center justify-center text-texto-secundario"
            >
              <Icono nombre="copy" tamano={18} />
            </button>
            <span role="status" className="text-cuerpo-pequeno text-texto-secundario">
              {copiada ? estados.referenciaCopiada : ''}
            </span>
          </div>
        )}
        <Boton
          onClick={() => {
            startTransition(() => {
              router.refresh();
              reset();
            });
          }}
        >
          {base.reintentar}
        </Boton>
      </div>
    </main>
  );
}
