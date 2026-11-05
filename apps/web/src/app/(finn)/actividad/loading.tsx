// Estado de carga de `/actividad` (export 02-actividad, «cargando»; 05 §7.1, FE-33): el título, el buscador y filas sin texto ni
// números, solo la forma de la lista. La región lleva `aria-busy` y el texto accesible se anuncia una vez. Con movimiento
// reducido no hay animación.
import { estados } from '../../../textos/estados';
import { actividad as t } from '../../../textos/actividad';

const BLOQUE = 'rounded-control bg-superficie-hundida motion-safe:animate-pulse';
const FILAS = [0, 1, 2, 3] as const;

export default function Cargando() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4">
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <div role="status" aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">{estados.cargando}</span>
        <div aria-hidden="true" className={`h-12 w-full ${BLOQUE}`} />
        <ul
          aria-hidden="true"
          className="flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie"
        >
          {FILAS.map((i) => (
            <li
              key={i}
              className="grid min-h-16 grid-cols-[2.25rem_1fr_auto] items-center gap-2.5 px-4 py-2"
            >
              <span className={`size-9 ${BLOQUE}`} />
              <span className="flex flex-col gap-1.5">
                <span className={`h-4 w-3/5 ${BLOQUE}`} />
                <span className={`h-3 w-2/5 ${BLOQUE}`} />
              </span>
              <span className={`h-5 w-16 ${BLOQUE}`} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
