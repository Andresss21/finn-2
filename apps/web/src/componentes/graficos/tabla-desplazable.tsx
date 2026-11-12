// Tabla ancha de un reporte (entrega 4, E5-4; 05 §11.3). En el teléfono una tabla de más de 3 columnas desplaza en horizontal con la
// primera columna fija (fondo `--superficie` y un filete `--borde-sutil`), un degradado de 24 px en el borde derecho y, encima,
// «Desplazá para ver más columnas.». El área desplazable es una `region` con `tabindex="0"` y el nombre de su sección, para llegar con
// Tab. En computadora no desplaza. Una tabla de 3 columnas o menos no cambia. Componente de servidor: solo CSS.
import type { ReactNode } from 'react';
import { reportes } from '../../textos/reportes';
import { Icono } from '../base/icono';

const t = reportes.tablaAncha;

// Clases literales (L13). `max-md`: solo en el teléfono; la columna fija sale de la primera celda de cada fila.
const AREA =
  'overflow-x-auto in-[.sr-only]:overflow-visible md:overflow-visible focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco max-md:[&_tr>:first-child]:sticky max-md:[&_tr>:first-child]:left-0 max-md:[&_tr>:first-child]:z-1 max-md:[&_tr>:first-child]:bg-superficie max-md:[&_tr>:first-child]:pr-3 max-md:[&_tr>:first-child]:border-r max-md:[&_tr>:first-child]:border-borde-sutil';

export function TablaDesplazable({
  nombre,
  ancha,
  children,
}: {
  /** El nombre de la sección de la tabla: el área lo dice con «, con desplazamiento horizontal». */
  readonly nombre: string;
  /** `true` si la tabla tiene más de 3 columnas (o se pidió explícitamente). */
  readonly ancha: boolean;
  readonly children: ReactNode;
}) {
  if (!ancha)
    return <div className="overflow-x-auto in-[.sr-only]:overflow-visible">{children}</div>;
  // Un `div` con rol `region` enfocable: lo exige axe (scrollable-region-focusable) para llegar con Tab a lo que desplaza.
  const region = { role: 'region', tabIndex: 0, 'aria-label': t.region(nombre) };
  return (
    <div className="flex flex-col gap-1.5">
      <p
        data-aviso-desplazar
        className="flex items-center gap-1.5 text-cuerpo-pequeno text-texto-secundario md:hidden"
      >
        {t.desplazar}
        <Icono nombre="arrowR" tamano={16} />
      </p>
      <div className="relative">
        <div {...region} className={AREA}>
          {children}
        </div>
        <span
          aria-hidden="true"
          data-degradado-tabla
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-superficie to-transparent md:hidden"
        />
      </div>
    </div>
  );
}
