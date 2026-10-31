'use client';
// Cuerpo de `error.tsx` (05 §7.3, FE-28): la referencia es el `digest` y «Intentar de nuevo» pide otra vez los Server
// Components (`router.refresh()`) y reinicia el límite (`reset()`) dentro de una transición.
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { estados } from '../../textos/estados';
import { ErrorPantalla } from '../base/error-pantalla';

export function ErrorDeLaPantalla({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const router = useRouter();
  return (
    <main>
      <ErrorPantalla
        titulo={estados.errorTitulo}
        {...(error.digest === undefined ? {} : { referencia: estados.referencia(error.digest) })}
        reintentar={() => {
          startTransition(() => {
            router.refresh();
            reset();
          });
        }}
      />
    </main>
  );
}
