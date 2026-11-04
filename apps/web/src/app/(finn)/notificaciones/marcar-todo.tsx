'use client';
// «Marcar todo como leído» (FT-69 paso 4; OPT-04 `todas`): un toque, sin vista previa. La acción revalida el layout, así que
// la campana y `?no-leidas=1` se vacían solos; mientras tanto el botón queda ocupado y un fallo se dice en línea.
import { useState } from 'react';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import type { AccionEscritura } from '../../../formularios/use-operacion';
import { notificaciones } from '../../../textos/notificaciones';

const t = notificaciones.centro;

export function MarcarTodo({ accion }: { readonly accion: AccionEscritura }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();
  const tocar = async (): Promise<void> => {
    setEnviando(true);
    setError(undefined);
    const r = await accion({ todas: true });
    if (!r.ok) setError(r.error.mensaje);
    setEnviando(false);
  };
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={enviando}
        aria-busy={enviando}
        onClick={() => void tocar()}
        className="inline-flex min-h-11 items-center rounded-control px-2 font-bold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:opacity-60"
      >
        {enviando ? t.marcando : t.marcarTodo}
      </button>
      {error === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {error}
        </AvisoEnLinea>
      )}
    </div>
  );
}
