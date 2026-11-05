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
  /** `tinta`: el activo en la tinta de la marca (reportes del export, CH-146). `segmento`: opciones iguales en una barra (CH-146). */
  readonly variante?: 'pastillas' | 'tinta' | 'segmento';
}

const BASE =
  'inline-flex min-h-11 shrink-0 items-center rounded-pastilla px-4 text-cuerpo-pequeno focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ACTIVA = `${BASE} bg-accion font-bold text-texto-sobre-accion`;
const INACTIVA = `${BASE} bg-superficie-hundida text-texto hover:bg-borde-sutil`;

// Clases literales (L13): la tinta del export (`border` transparente en la inactiva para que no salte) y la barra de segmentos.
const TINTA = {
  activa: `${BASE} border border-texto bg-marca font-bold text-texto-sobre-marca`,
  inactiva: `${BASE} border border-transparent bg-superficie-hundida text-texto hover:bg-borde-sutil`,
} as const;
const SEGMENTO = {
  activa: `${BASE} w-full justify-center rounded-lg bg-superficie px-1 text-center text-texto font-bold ring-1 ring-borde-control`,
  inactiva: `${BASE} w-full justify-center rounded-lg px-1 text-center text-texto-secundario hover:bg-borde-sutil`,
} as const;

export function Pestanas({
  etiqueta,
  pestanas,
  activas,
  marca = 'page',
  variante = 'pastillas',
}: PropsPestanas) {
  const estilo =
    variante === 'tinta'
      ? TINTA
      : variante === 'segmento'
        ? SEGMENTO
        : { activa: ACTIVA, inactiva: INACTIVA };
  return (
    <nav aria-label={etiqueta} data-pestanas>
      <ul
        className={
          variante === 'segmento'
            ? 'flex gap-0.5 rounded-control bg-superficie-hundida p-0.75'
            : 'flex gap-2 overflow-x-auto p-1'
        }
      >
        {pestanas.map((p) => {
          const activa = activas.includes(p.id);
          return (
            <li key={p.id} className={variante === 'segmento' ? 'min-w-0 flex-1' : 'shrink-0'}>
              <EnlaceFinn
                href={p.href}
                className={activa ? estilo.activa : estilo.inactiva}
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
