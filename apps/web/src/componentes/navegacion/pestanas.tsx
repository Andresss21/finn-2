// `Pestanas` (05 §10.7): si el contenido depende de la URL (filtros, vistas), son enlaces con `aria-current`, no pestañas de ARIA.
// Lo activo se distingue por fondo invertido y peso, no por color (06-identidad-visual 2.3).
import { EnlaceFinn } from './enlace-finn';

export interface PestanaDeEnlace {
  readonly id: string;
  readonly etiqueta: string;
  readonly href: string;
}

export interface PropsPestanas {
  /** Nombre de la navegación para lectores de pantalla. */
  readonly etiqueta: string;
  readonly pestanas: readonly PestanaDeEnlace[];
  /** Los ids marcados con `aria-current`: uno solo en una navegación, varios en un filtro de opciones. */
  readonly activas: readonly string[];
  readonly marca?: 'page' | 'true';
}

const BASE =
  'inline-flex min-h-11 shrink-0 items-center rounded-pastilla px-4 text-cuerpo-pequeno focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ACTIVA = `${BASE} bg-accion font-bold text-texto-sobre-accion`;
const INACTIVA = `${BASE} bg-superficie-hundida text-texto hover:bg-borde-sutil`;

export function Pestanas({ etiqueta, pestanas, activas, marca = 'page' }: PropsPestanas) {
  return (
    <nav aria-label={etiqueta} data-pestanas>
      <ul className="flex gap-2 overflow-x-auto p-1">
        {pestanas.map((p) => {
          const activa = activas.includes(p.id);
          return (
            <li key={p.id} className="shrink-0">
              <EnlaceFinn
                href={p.href}
                className={activa ? ACTIVA : INACTIVA}
                {...(activa ? { 'aria-current': marca } : {})}
              >
                {p.etiqueta}
              </EnlaceFinn>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
