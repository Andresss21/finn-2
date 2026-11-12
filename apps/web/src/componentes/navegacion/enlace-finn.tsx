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
// E6-2 (FE-39, `T2-navegacion`): el punto de 8 px `--accion` del enlace pendiente. En la barra inferior va arriba a la derecha del
// ícono; en la barra lateral, al final de la fila. Solo lo piden esos enlaces (`punto`). Clases literales (L13).
const PUNTOS = {
  icono: 'absolute top-1.5 left-1/2 ml-2.5 size-2 rounded-full bg-accion',
  fila: 'ml-auto size-2 shrink-0 rounded-full bg-accion',
} as const;

function Senal({ punto }: { readonly punto?: keyof typeof PUNTOS | undefined }) {
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
  return (
    <>
      <span ref={ancla} hidden />
      {pending && punto !== undefined ? (
        <span aria-hidden="true" data-punto-pendiente className={PUNTOS[punto]} />
      ) : null}
    </>
  );
}

/** El enlace avisa al marco con este evento cuando no navega por falta de conexión (05 §8.5, FE-56). */
export const EVENTO_SIN_CONEXION = 'finn:navegacion-sin-conexion';

type PropsEnlaceFinn = Omit<ComponentProps<typeof Link>, 'onClick'> & {
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** E6-2: dónde dibuja el punto de «pendiente»: junto al ícono (barra inferior) o al final de la fila (barra lateral). */
  readonly punto?: keyof typeof PUNTOS;
};

export function EnlaceFinn({ children, className, onClick, punto, ...props }: PropsEnlaceFinn) {
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
      <Senal punto={punto} />
    </Link>
  );
}
