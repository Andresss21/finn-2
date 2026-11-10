// Insignia de fecha de Inicio y Programadas (06-identidad-visual §2.16; FIXES A22): el mes en rótulo arriba y el día en Archivo
// 800, ancho 72 % y 1.5 rem abajo. Decorativa: la fecha completa ya está en el texto de la fila.
import { formatearFechaTexto } from '../../formato';

export function InsigniaDeFecha({ fecha }: { readonly fecha: string }) {
  const [dia, mes] = formatearFechaTexto(fecha).split(' ');
  return (
    <span className="flex w-10 shrink-0 flex-col items-center leading-tight" aria-hidden="true">
      <span data-mes className="text-rotulo uppercase">
        {mes}
      </span>
      <span
        data-dia
        className="text-[1.5rem] leading-none font-extrabold tabular-nums [font-stretch:72%]"
      >
        {dia}
      </span>
    </span>
  );
}
