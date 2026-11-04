'use client';
// «Marcar como leído» de un cambio retroactivo (FT-08 paso 5; 05 §4.14, OPT-04): un toque, sin vista previa. La acción revalida el
// layout, así que la notificación desaparece sola al volver; mientras tanto el botón queda ocupado y un fallo se dice en línea.
import { useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { inicio as t } from '../../textos/inicio';

export function MarcarLeido({
  id,
  accion,
}: {
  readonly id: string;
  /** `marcarLeidas` (OPT-04): la pone el lector, así el componente se prueba sin servidor. */
  readonly accion: AccionEscritura;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();
  const tocar = async (): Promise<void> => {
    setEnviando(true);
    setError(undefined);
    const r = await accion({ ids: [id] });
    if (!r.ok) setError(r.error.mensaje);
    setEnviando(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <Boton
        variante="secundaria"
        enviando={enviando}
        textoEnviando={t.marcando}
        onClick={() => void tocar()}
      >
        {t.marcarLeido}
      </Boton>
      {error === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {error}
        </AvisoEnLinea>
      )}
    </div>
  );
}
