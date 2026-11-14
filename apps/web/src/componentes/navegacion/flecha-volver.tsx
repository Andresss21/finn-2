'use client';
// [CH-288] La flecha «Volver» de las pantallas hijas (05 §3.3, N8), la misma en la barra del teléfono y junto al título en
// computadora. El enlace apunta a la `rutaPadre` (lo que se ve sin JS y al entrar directo); si se llegó navegando dentro de
// Finn en esta pestaña, el toque vuelve atrás en el historial hasta la pantalla anterior (`anteriorEnFinn`) y el nombre
// accesible la nombra («Volver a Metas», o «Volver» si no es una sección).
import { useEffect, useState, type ReactNode } from 'react';
import { EnlaceFinn } from './enlace-finn';
import { anteriorEnFinn, etiquetaDeVuelta, historialDelNavegador } from './volver-anterior';

export function FlechaVolver({
  href,
  etiqueta,
  className,
  children,
  ...datos
}: {
  readonly href: string;
  readonly etiqueta: string;
  readonly className: string;
  readonly children: ReactNode;
  readonly 'data-volver-titulo'?: boolean;
}) {
  const [anterior, setAnterior] = useState<string | null>(null);
  useEffect(() => {
    const historial = historialDelNavegador();
    const leer = () => {
      setAnterior(anteriorEnFinn(historial, window.location.origin)?.ruta ?? null);
    };
    leer();
    historial?.addEventListener('currententrychange', leer);
    return () => {
      historial?.removeEventListener('currententrychange', leer);
    };
  }, [href]);
  return (
    <EnlaceFinn
      {...datos}
      href={href}
      aria-label={anterior === null ? etiqueta : etiquetaDeVuelta(anterior)}
      className={className}
      onClick={(evento) => {
        // Abrir en otra pestaña (o con un modificador) sigue siendo el enlace a la `rutaPadre`; sin conexión, `EnlaceFinn` avisa.
        const modificador = evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey;
        if (evento.button !== 0 || modificador || !navigator.onLine) return;
        const destino = anteriorEnFinn(historialDelNavegador(), window.location.origin);
        if (destino === null) return;
        evento.preventDefault();
        window.history.go(-destino.pasos);
      }}
    >
      {children}
    </EnlaceFinn>
  );
}
