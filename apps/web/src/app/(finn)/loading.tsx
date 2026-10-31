// Estado de carga (05 §7.1, FE-33): sin números ni ceros inventados, solo bloques de la estructura; la región lleva
// `aria-busy` y el texto accesible «Cargando…» se anuncia una vez. Con movimiento reducido no hay animación.
import { estados } from '../../textos/estados';

const BLOQUES = [
  'h-8 w-1/2 rounded-pastilla bg-superficie-hundida motion-safe:animate-pulse',
  'h-24 w-full rounded-pastilla bg-superficie-hundida motion-safe:animate-pulse',
  'h-24 w-full rounded-pastilla bg-superficie-hundida motion-safe:animate-pulse',
] as const;

export default function Cargando() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4 p-4">
      <span className="sr-only">{estados.cargando}</span>
      {BLOQUES.map((clases, i) => (
        <div key={i} className={clases} aria-hidden="true" />
      ))}
    </div>
  );
}
