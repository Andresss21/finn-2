// Círculo con el número de la campana y de la Bandeja (06-identidad-visual 3.1). Sin dato (`null`) o en cero no se dibuja:
// el número ya está en el nombre accesible del enlace (3.3) y nunca se inventa un cero (1.6). Se pinta con `::after` para que
// no entre en el texto visible del enlace (axe: label-content-name-mismatch). [CH-220 C2] El de la Bandeja rebota (.85 → 1) cada
// vez que cambia su número: la `key` lo vuelve a montar y la animación de entrada corre de nuevo.
import { navegacion } from '../../textos/navegacion';

// Mapa de clases literales (L13). Bandeja: 22 px, borde `fondo`. Campana (export K1): 17 px con anillo; en computadora, 18 px.
const FORMAS = {
  bandeja:
    'fz-rebote absolute -top-1.5 -right-1.5 inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-pastilla border-2 border-fondo bg-accion px-1 text-xs leading-none font-extrabold text-texto-sobre-accion after:content-[attr(data-contador)]',
  campana:
    'absolute top-1.5 right-1.25 inline-flex h-4.25 min-w-4.25 items-center justify-center rounded-pastilla bg-accion px-1 text-xs leading-none font-extrabold text-texto-sobre-accion ring-2 ring-fondo after:content-[attr(data-contador)] md:-top-1.5 md:-right-1.5 md:h-4.5 md:min-w-4.5 md:ring-0',
} as const;

export function Contador({
  valor,
  forma = 'bandeja',
}: {
  readonly valor: number | null;
  readonly forma?: keyof typeof FORMAS;
}) {
  if (valor === null || valor <= 0) return null;
  return (
    <span
      key={valor}
      aria-hidden="true"
      data-contador={valor > 99 ? navegacion.masDeNoventaYNueve : valor}
      className={FORMAS[forma]}
    />
  );
}
