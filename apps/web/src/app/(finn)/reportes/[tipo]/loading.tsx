// Estado de carga de `/reportes/[tipo]` (export 04-reportes; 05 §7.1, FE-33): el título, las pestañas, la barra de períodos y la
// tarjeta del gráfico, sin texto ni números inventados. La región lleva `aria-busy` y el texto accesible se anuncia una vez.
import { estados } from '../../../../textos/estados';
import { reportes as t } from '../../../../textos/reportes';

const PESTANAS = [0, 1, 2, 3] as const;
// Clases literales (L13).
const PESTANA =
  'h-11 w-28 shrink-0 rounded-pastilla bg-superficie-hundida motion-safe:animate-pulse';
const TITULO = 'h-6 w-3/4 rounded-control bg-superficie-hundida motion-safe:animate-pulse';
const PERIODOS = 'h-13 w-full rounded-control bg-superficie-hundida motion-safe:animate-pulse';
const TARJETA = 'h-64 w-full rounded-contenedor bg-superficie-hundida motion-safe:animate-pulse';

export default function Cargando() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4 md:max-w-6xl">
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <div role="status" aria-busy="true" className="flex flex-col gap-6">
        <span className="sr-only">{estados.cargando}</span>
        <div aria-hidden="true" className="flex gap-2 overflow-hidden">
          {PESTANAS.map((i) => (
            <span key={i} className={PESTANA} />
          ))}
        </div>
        <div
          aria-hidden="true"
          className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-start md:gap-10"
        >
          <div className="flex flex-col gap-5">
            <span className={TITULO} />
            <span className={PERIODOS} />
          </div>
          <span className={TARJETA} />
        </div>
      </div>
    </main>
  );
}
