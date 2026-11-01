'use client';
// `EnlaceFinn` (05 §3.3, §7.1, FE-39): el único envoltorio de `Link` de Next (L11). Mientras su navegación está pendiente
// (`useLinkStatus`) el propio enlace lleva `aria-busy` y avisa al marco, que muestra el indicador global. Con la página
// sin hidratar no hay señal (V5-21b): el estado presionado de 10.9 es solo CSS y vive en el estilo del enlace.
import Link, { useLinkStatus } from 'next/link';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type MouseEventHandler,
} from 'react';

/** Lo entrega el marco: `marcar(id, true)` mientras el enlace `id` navega, `marcar(id, false)` al terminar. */
export const ContextoNavegacionPendiente = createContext<(id: string, pendiente: boolean) => void>(
  () => undefined,
);

// Hijo de `Link`, el único lugar donde `useLinkStatus` da el estado. `aria-busy` va en el `<a>`, que no es suyo.
function Senal() {
  const { pending } = useLinkStatus();
  const id = useId();
  const marcar = useContext(ContextoNavegacionPendiente);
  const ancla = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const enlace = ancla.current?.closest('a');
    if (pending) enlace?.setAttribute('aria-busy', 'true');
    else enlace?.removeAttribute('aria-busy');
    marcar(id, pending);
    return () => {
      marcar(id, false);
    };
  }, [pending, id, marcar]);
  return <span ref={ancla} hidden />;
}

/** El enlace avisa al marco con este evento cuando no navega por falta de conexión (05 §8.5, FE-56). */
export const EVENTO_SIN_CONEXION = 'finn:navegacion-sin-conexion';

type PropsEnlaceFinn = Omit<ComponentProps<typeof Link>, 'onClick'> & {
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function EnlaceFinn({ children, className, onClick, ...props }: PropsEnlaceFinn) {
  return (
    <Link
      {...props}
      onClick={(evento: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(evento);
        // Sin conexión Next haría una navegación de documento y se perdería la pantalla actual (V5-30b).
        if (!navigator.onLine) {
          evento.preventDefault();
          window.dispatchEvent(new Event(EVENTO_SIN_CONEXION));
        }
      }}
      className={[className, 'active:opacity-70 aria-busy:opacity-60'].filter(Boolean).join(' ')}
    >
      {children}
      <Senal />
    </Link>
  );
}
