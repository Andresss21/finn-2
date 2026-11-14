// [CH-220 A5] «Volver a…» de una pantalla hija en computadora: la flecha de 44 a la izquierda del título, en su misma fila (margen
// −8), como en el detalle de transacción. En teléfono la lleva la barra (CH-109, `volverDeRuta`), así que acá se oculta debajo
// de `md`. La ruta la arma la pantalla, con su `?periodo=` si corresponde: no se deduce nada. [CH-288] Es la `FlechaVolver`:
// si se llegó navegando dentro de Finn, vuelve a la pantalla anterior.
import { Icono } from '../base/icono';
import { FlechaVolver } from './flecha-volver';

export function VolverEnTitulo({
  href,
  etiqueta,
}: {
  readonly href: string;
  readonly etiqueta: string;
}) {
  return (
    <FlechaVolver
      href={href}
      etiqueta={etiqueta}
      data-volver-titulo
      className="hidden size-11 shrink-0 items-center justify-center rounded-pastilla text-texto focus-visible:outline-3 focus-visible:outline-foco md:inline-flex"
    >
      <Icono nombre="arrowL" tamano={22} />
    </FlechaVolver>
  );
}
