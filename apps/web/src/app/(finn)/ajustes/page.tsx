// `/ajustes` (05 §2.11, FT-04): índice de Ajustes; cada ficha agrega su enlace. El recordatorio de Primeros pasos es de TA-286.
import type { Metadata } from 'next';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { ajustesWebhook } from '../../../textos/ajustes-webhook';
import { navegacion } from '../../../textos/navegacion';

export const metadata: Metadata = { title: navegacion.secciones.ajustes };

export default function PaginaAjustes() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-5 py-4">
      <h1 className="text-titulo-pantalla">{navegacion.secciones.ajustes}</h1>
      <EnlaceFinn
        href="/ajustes/webhook"
        className="inline-flex min-h-11 items-center font-semibold text-enlace underline"
      >
        {ajustesWebhook.titulo}
      </EnlaceFinn>
    </main>
  );
}
