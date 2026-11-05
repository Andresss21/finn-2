'use client';
// El texto del SMS de `/bandeja/[movimientoId]` (05 §2.5: «Muestra el texto del SMS siempre»; S4 del export): un contenedor hundido con
// el rótulo y el texto original, sin tocarlo.
import { Icono } from '../../componentes/base/icono';
import { bandeja as t } from '../../textos/bandeja';

export function TextoDelSms({ texto }: { readonly texto: string }) {
  return (
    <section
      aria-label={t.revisar.sms}
      className="flex flex-col gap-1 rounded-contenedor bg-superficie-hundida px-4 py-3"
    >
      <h2 className="flex items-center gap-2 text-rotulo text-texto-secundario">
        <Icono nombre="sms" tamano={16} />
        {t.revisar.sms}
      </h2>
      <blockquote className="text-cuerpo-pequeno text-texto">{texto}</blockquote>
    </section>
  );
}
