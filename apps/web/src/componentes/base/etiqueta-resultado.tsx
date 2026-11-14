'use client';
// [CH-278] Etiqueta de resultado (C-50, enmienda el principio 5; `docs/anexos/finn-aviso-de-resultado/AVISO-DE-RESULTADO.md`):
// después de una acción sobre una fila, una pastilla sobre esa fila con el glifo, una palabra y como máximo una acción; la fila
// se resalta mientras se ve (tres señales). Se va sola a los ms de `--duracion-aviso` (leídos del token, nunca escritos acá),
// espera con el puntero encima, el foco adentro o un arrastre, y Escape la quita. Un solo componente para toda la app y una
// sola etiqueta por pantalla (`useEtiqueta`). No es región viva: la frase completa va una vez a la región `role="status"` de la
// pantalla (`anunciar`). Los avisos que muestran un problema o traen información siguen siendo banda (`Resultado`, §9).
// Posiciones de §3: `centro` (filas sin datos a la derecha, la fila que cambia de sección y el encabezado de un grupo) y
// `arriba` (filas con monto, pegada al borde de arriba); la fila que sale va en `FilaQueSale` y se recoge al irse la etiqueta.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { EnlaceFinn } from '../navegacion/enlace-finn';
import {
  crearEtiquetaReloj,
  deshacerEnFila,
  type EstadoReloj,
  type MotivoEspera,
} from './etiqueta-reloj';
import { Icono, type NombreIcono } from './icono';

export type AccionEtiqueta =
  | { readonly texto: string; readonly icono?: NombreIcono; readonly alTocar: () => void }
  | { readonly texto: string; readonly href: string };

export interface ResultadoEtiqueta {
  /** La fila o el encabezado donde va. */
  readonly id: string;
  /** «Movida», «Creada», «Aprobado»… */
  readonly palabra: string;
  /** La frase completa de la región de estado (§8, «Se anuncia»). */
  readonly frase: string;
  /** Solo si tiene otro lugar permanente (§6). */
  readonly accion?: AccionEtiqueta;
  /** Con esto la acción es el inverso: al irse la etiqueta queda ↶ en la fila, con este `aria-label` (§5). */
  readonly inverso?: string;
  /** Posición 4: la fila sale de la lista. Se llama cuando terminó de recogerse, para quitarla. */
  readonly alIrse?: () => void;
}

const MS_POR_S = 1000;
const ENFOCABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Un token de tiempo en ms, como lo resuelve el navegador; `undefined` si no está. */
function leerMs(token: string): number | undefined {
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) return undefined;
  return v.endsWith('ms') ? n : n * MS_POR_S;
}
const reducido = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ultimoEnfocable(e: Element | null): HTMLElement | null {
  if (e === null) return null;
  if (e.matches(ENFOCABLE)) return e as HTMLElement;
  return [...e.querySelectorAll<HTMLElement>(ENFOCABLE)].at(-1) ?? null;
}

/** §7: la fila que se recoge tenía el foco → pasa a la fila siguiente, o a la anterior si era la última. */
function pasarFoco(id: string): void {
  const fila = document.querySelector(`[data-fila-sale="${CSS.escape(id)}"]`);
  if (fila === null || !fila.contains(document.activeElement)) return;
  const otra = [fila.nextElementSibling, fila.previousElementSibling]
    .map((x) => x?.querySelector<HTMLElement>(ENFOCABLE) ?? null)
    .find((x) => x !== null);
  otra?.focus();
}

const VACIO: EstadoReloj<ResultadoEtiqueta> = {
  actual: null,
  fase: 'nada',
  pausado: false,
  ultimo: null,
};

/** El estado de la etiqueta de una pantalla. `anunciar` escribe en su única región `role="status"`. */
export function useEtiqueta(anunciar: (frase: string) => void) {
  const [estado, setEstado] = useState(VACIO);
  const decir = useRef(anunciar);
  useEffect(() => {
    decir.current = anunciar;
  }, [anunciar]);
  const [reloj] = useState(() =>
    crearEtiquetaReloj<ResultadoEtiqueta>({
      duracion: () => leerMs('--duracion-aviso'),
      salida: () => (reducido() ? 0 : (leerMs('--duracion-normal') ?? 0)),
      reloj: {
        poner: (f, ms) => window.setTimeout(f, ms),
        quitar: (i) => {
          window.clearTimeout(i);
        },
      },
      alCambiar: setEstado,
      alIrse: (r) => {
        if (r.alIrse === undefined) return;
        pasarFoco(r.id);
        r.alIrse();
      },
    }),
  );
  useEffect(
    () => () => {
      reloj.cerrar();
    },
    [reloj],
  );
  const mostrar = useCallback(
    (r: ResultadoEtiqueta) => {
      reloj.mostrar(r, r.inverso !== undefined);
      decir.current(r.frase);
    },
    [reloj],
  );
  return useMemo(
    () => ({
      estado,
      mostrar,
      pausar: (m: MotivoEspera) => {
        reloj.pausar(m);
      },
      reanudar: (m: MotivoEspera) => {
        reloj.reanudar(m);
      },
      cerrar: () => {
        reloj.cerrar();
      },
      otraAccion: () => {
        reloj.otraAccion();
      },
      /** La fila `id` va con `--positivo-fondo` (señal 3); se apaga cuando la etiqueta empieza a irse. */
      resaltada: (id: string) => estado.actual?.id === id && estado.fase === 'visible',
      /** Hay ↶ disponible para `id` (aunque la etiqueta todavía se vea). */
      conInverso: (id: string) => estado.ultimo?.id === id,
    }),
    [estado, mostrar, reloj],
  );
}
export type ApiEtiqueta = ReturnType<typeof useEtiqueta>;

/** La pastilla, dentro de la fila (`position: relative`) y después de su contenido: Tab llega a la acción justo después. */
export function EtiquetaResultado({
  api,
  id,
  posicion = 'centro',
}: {
  readonly api: ApiEtiqueta;
  readonly id: string;
  readonly posicion?: 'centro' | 'arriba';
}) {
  const r = api.estado.actual;
  if (r?.id !== id) return null;
  const a = r.accion;
  const escape = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    // El foco no se pierde: vuelve a lo anterior de la fila (su botón principal).
    let x = e.currentTarget.previousElementSibling;
    let destino: HTMLElement | null = null;
    while (x !== null && destino === null) {
      destino = ultimoEnfocable(x);
      x = x.previousElementSibling;
    }
    destino?.focus();
    api.cerrar();
  };
  return (
    <div
      data-etiqueta={id}
      data-posicion={posicion}
      data-fase={api.estado.fase}
      className={a === undefined ? 'fz-etiqueta fz-etiqueta-sola' : 'fz-etiqueta'}
      onPointerEnter={() => {
        api.pausar('puntero');
      }}
      onPointerLeave={() => {
        api.reanudar('puntero');
      }}
      onFocus={() => {
        api.pausar('foco');
      }}
      onBlur={(e: FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget)) api.reanudar('foco');
      }}
      onKeyDown={escape}
    >
      <Icono nombre="check" tamano={18} className="shrink-0 text-positivo-texto" />
      <span className="fz-etiqueta-palabra">{r.palabra}</span>
      {a === undefined ? null : 'href' in a ? (
        <EnlaceFinn href={a.href} className="fz-etiqueta-accion">
          {a.texto}
        </EnlaceFinn>
      ) : (
        <button type="button" onClick={a.alTocar} className="fz-etiqueta-accion">
          {a.icono === undefined ? null : <Icono nombre={a.icono} tamano={18} />}
          {a.texto}
        </button>
      )}
    </div>
  );
}

/** ↶ de 44 × 44 a la derecha de la fila cuando la etiqueta con inverso ya no se ve o se está yendo (§5). */
export function DeshacerFila({ api, id }: { readonly api: ApiEtiqueta; readonly id: string }) {
  const u = api.estado.ultimo;
  const a = u?.accion;
  if (u?.inverso === undefined || a === undefined || 'href' in a || !deshacerEnFila(api.estado, id))
    return null;
  return (
    <button
      type="button"
      data-deshacer-fila={id}
      aria-label={u.inverso}
      onClick={a.alTocar}
      className="fz-deshacer-fila"
    >
      <Icono nombre="undo" tamano={18} />
    </button>
  );
}

/** Posición 4: la fila se queda con la etiqueta y, cuando se va, se recoge con `--duracion-normal` (sin animar si se reduce). */
export function FilaQueSale({
  api,
  id,
  className,
  children,
}: {
  readonly api: ApiEtiqueta;
  readonly id: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const { actual, fase } = api.estado;
  const recoge = actual?.id === id && actual.alIrse !== undefined && fase === 'saliendo';
  return (
    <li
      data-fila-sale={id}
      {...(recoge ? { 'data-recogiendo': '' } : {})}
      className={className === undefined ? 'fz-fila-sale' : `fz-fila-sale ${className}`}
    >
      <div className="fz-fila-sale-dentro">{children}</div>
    </li>
  );
}
