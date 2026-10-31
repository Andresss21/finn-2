// Círculo con el número de la campana y de la Bandeja (06-identidad-visual 3.1). Sin dato (`null`) o en cero no se dibuja:
// el número ya está en el nombre accesible del enlace (3.3) y nunca se inventa un cero (1.6). Se pinta con `::after` para que
// no entre en el texto visible del enlace (axe: label-content-name-mismatch).
import { navegacion } from '../../textos/navegacion';

export function Contador({ valor }: { readonly valor: number | null }) {
  if (valor === null || valor <= 0) return null;
  return (
    <span
      aria-hidden="true"
      data-contador={valor > 99 ? navegacion.masDeNoventaYNueve : valor}
      className="absolute -top-1.5 -right-1.5 inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-pastilla border-2 border-fondo bg-accion px-1 text-[0.65rem] leading-none font-bold text-texto-sobre-accion after:content-[attr(data-contador)]"
    />
  );
}
