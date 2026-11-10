// [CH-220 A5] «Volver a…» de una pantalla hija en computadora: la flecha de 44 a la izquierda del título, en su misma fila (margen
// −8), como en el detalle de transacción. En teléfono la lleva la barra (CH-109, `volverDeRuta`), así que acá se oculta debajo
// de `md`. La ruta la arma la pantalla, con su `?periodo=` si corresponde: no se deduce nada.
import { Icono } from '../base/icono';
import { EnlaceFinn } from './enlace-finn';

export function VolverEnTitulo({
  href,
  etiqueta,
}: {
  readonly href: string;
  readonly etiqueta: string;
}) {
  return (
    <EnlaceFinn
      href={href}
      aria-label={etiqueta}
      data-volver-titulo
      className="hidden size-11 shrink-0 items-center justify-center rounded-pastilla text-texto focus-visible:outline-3 focus-visible:outline-foco md:inline-flex"
    >
      <Icono nombre="arrowL" tamano={22} />
    </EnlaceFinn>
  );
}
