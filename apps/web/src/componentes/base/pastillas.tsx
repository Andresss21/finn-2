// Pastillas de filtro (06-identidad-visual 2.3): lo activo se distingue por fondo invertido (`--texto`) y peso, no por color.
// Dos usos: con `alCambiar` son botones con `aria-pressed` (componente de cliente que las usa); con `href` en cada opción son
// enlaces con `aria-current`, que un componente de servidor puede dibujar sin JavaScript (cada filtro tiene su URL).
import { Button, buttonVariants } from '../../components/ui/button';
import { cn } from '../../components/ui/utils';
import { EnlaceFinn } from '../navegacion/enlace-finn';

export interface OpcionPastilla {
  readonly valor: string;
  readonly etiqueta: string;
  /** Con él la pastilla es un enlace (usar `reemplazar` si cambiarla no debe sumar historial). */
  readonly href?: string;
}

export interface PropsPastillas {
  /** Nombre del grupo para lectores de pantalla. */
  readonly etiqueta: string;
  readonly opciones: readonly OpcionPastilla[];
  readonly valor: string;
  readonly alCambiar?: (valor: string) => void;
  /** Los enlaces reemplazan la entrada del historial (un filtro no es una página nueva). */
  readonly reemplazar?: boolean;
}

// En 390 px la fila se desplaza (D3) y sangra hasta el borde; sin barra visible.
const FILA = '-mx-5 flex gap-2 overflow-x-auto px-5 py-1 [scrollbar-width:none] md:mx-0 md:px-1';
const ACTIVA = 'bg-texto font-bold text-fondo hover:bg-texto';

export function Pastillas({ etiqueta, opciones, valor, alCambiar, reemplazar }: PropsPastillas) {
  return (
    <div role="group" aria-label={etiqueta} className={FILA}>
      {opciones.map((o) => {
        const activa = o.valor === valor;
        if (o.href !== undefined) {
          return (
            <EnlaceFinn
              key={o.valor}
              href={o.href}
              {...(reemplazar === true ? { replace: true } : {})}
              {...(activa ? { 'aria-current': 'true' as const } : {})}
              className={cn(buttonVariants({ variant: 'filter' }), activa && ACTIVA)}
            >
              {o.etiqueta}
            </EnlaceFinn>
          );
        }
        return (
          <Button
            key={o.valor}
            type="button"
            variant="filter"
            aria-pressed={activa}
            onClick={() => {
              alCambiar?.(o.valor);
            }}
          >
            {o.etiqueta}
          </Button>
        );
      })}
    </div>
  );
}
