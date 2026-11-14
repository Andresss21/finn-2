'use client';
// [CH-275] C-46 (ESTRUCTURA-Y-COLAPSO §1.3): ordenar arrastrando desde el asa. Es el único módulo de Estructura que importa
// `@dnd-kit/core` (la librería de la Bandeja) y la lista lo carga con `import()`. dnd-kit da el gesto: 4 px desde el asa en
// teléfono y computadora, y cancela con Escape, `pointercancel`, al cambiar el tamaño o al ocultarse la página. El asa no cambia:
// un solo `useDraggable` se engancha al asa presionada, así que cargar el módulo no vuelve a montar la lista. El lugar sale de la
// posición del puntero sobre las secciones y filas que dibuja la lista; la lista decide qué mostrar y qué enviar.
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useEffect, useRef, type PointerEvent as EventoPuntero, type RefObject } from 'react';
import { avisarArrastre } from '../../componentes/marco/arrastre';

type Tipo = 'grupo' | 'categoria';
export type Tomar = (e: EventoPuntero, tipo: Tipo, id: string) => void;
/** Dónde caería: el grupo (categorías), la posición sin lo que se mueve y si cae al final de un grupo colapsado. */
export interface Apunte {
  readonly grupoId: string;
  readonly idx: number;
  readonly colapsado: boolean;
}
export interface PropsArrastre {
  readonly registrar: (tomar: Tomar | null) => void;
  readonly alTomar: (tipo: Tipo, id: string, caja: DOMRect) => void;
  readonly alApuntar: (a: Apunte) => void;
  /** A los 650 ms quieto sobre un grupo colapsado. */
  readonly alAbrir: (grupoId: string) => void;
  /** Con la caja de la fila levantada, de donde parte el movimiento a su lugar. */
  readonly alSoltar: (caja: DOMRect | undefined) => void;
  readonly alCancelar: (caja: DOMRect | undefined) => void;
}
interface Objetivo {
  tipo: Tipo;
  id: string;
}

const BORDE = 56;
const ESPERA = 650;
const callar = () => undefined;
const SIN_ANUNCIOS = {
  onDragStart: callar,
  onDragOver: callar,
  onDragEnd: callar,
  onDragCancel: callar,
};

/** El rectángulo sin el desplazamiento de FLIP que esté corriendo, para que el hueco no oscile mientras se anima. */
function caja(e: Element) {
  const r = e.getBoundingClientRect();
  let dy = 0;
  for (let x: Element | null = e; x !== null && x.tagName !== 'MAIN'; x = x.parentElement)
    dy += new DOMMatrixReadOnly(getComputedStyle(x).transform).m42;
  return { top: r.top - dy, bottom: r.bottom - dy, left: r.left, right: r.right };
}
const antesDe = (es: readonly Element[], y: number) =>
  es.filter((e) => {
    const c = caja(e);
    return (c.top + c.bottom) / 2 < y;
  }).length;

/** Dónde caería lo tomado con el puntero en `x`, `y`; `undefined` fuera de todo grupo (queda el lugar anterior). */
function apuntar({ tipo, id }: Objetivo, x: number, y: number): Apunte | undefined {
  const zonas = [...document.querySelectorAll('section[data-zona]')];
  if (tipo === 'grupo')
    return {
      grupoId: '',
      idx: antesDe(
        zonas.filter((z) => z.getAttribute('data-zona') !== id),
        y,
      ),
      colapsado: false,
    };
  const z = zonas.find((s) => {
    const c = caja(s);
    return x >= c.left && x <= c.right && y >= c.top && y <= c.bottom;
  });
  if (z === undefined) return undefined;
  const grupoId = z.getAttribute('data-zona') ?? '';
  const cuantas = z.getAttribute('data-colapsado');
  if (cuantas !== null) return { grupoId, idx: Number(cuantas), colapsado: true };
  const filas = [...z.querySelectorAll(`[data-fila-cat]:not([data-fila-cat="${id}"])`)];
  return { grupoId, idx: antesDe(filas, y), colapsado: false };
}

function Ancla({
  registrar,
  objetivo,
}: Pick<PropsArrastre, 'registrar'> & { readonly objetivo: RefObject<Objetivo> }) {
  const { setNodeRef, listeners } = useDraggable({ id: 'estructura' });
  const tomar = useRef<Tomar>(() => undefined);
  useEffect(() => {
    tomar.current = (e, tipo, id) => {
      objetivo.current = { tipo, id };
      setNodeRef(e.currentTarget as HTMLElement);
      listeners?.onPointerDown?.(e);
    };
  });
  useEffect(() => {
    registrar((e, tipo, id) => {
      tomar.current(e, tipo, id);
    });
    return () => {
      registrar(null);
    };
  }, [registrar]);
  return null;
}

interface Estado {
  x: number;
  y: number;
  readonly y0: number;
  clave: string;
  espera: number;
  cuadro: number;
}

export function ContextoArrastre(props: PropsArrastre) {
  const p = useRef(props);
  useEffect(() => {
    p.current = props;
  });
  const objetivo = useRef<Objetivo>({ tipo: 'categoria', id: '' });
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const estado = useRef<Estado | null>(null);
  const fin = useRef<() => DOMRect | undefined>(() => undefined);
  const arrancar = useRef<() => void>(() => undefined);

  useEffect(() => {
    const levantada = () => document.querySelector<HTMLElement>('[data-fila-levantada]');
    const actualizar = (s: Estado) => {
      const l = levantada();
      if (l !== null) l.style.translate = `0 ${String(s.y - s.y0)}px`;
      const a = apuntar(objetivo.current, s.x, s.y);
      const clave =
        a === undefined ? s.clave : `${a.grupoId}:${String(a.idx)}:${String(a.colapsado)}`;
      if (a === undefined || clave === s.clave) return;
      s.clave = clave;
      window.clearTimeout(s.espera);
      if (a.colapsado)
        s.espera = window.setTimeout(() => {
          s.clave = '';
          p.current.alAbrir(a.grupoId);
        }, ESPERA);
      p.current.alApuntar(a);
    };
    // Antes que dnd-kit (captura en `window`): al soltar, el lugar es el del último punto.
    const seguir = (e: PointerEvent) => {
      const s = estado.current;
      if (s === null) return;
      s.x = e.clientX;
      s.y = e.clientY;
      actualizar(s);
    };
    // Cerca de los bordes la página se desplaza sola, cuadro a cuadro, aunque el dedo quede quieto.
    const desplazar = () => {
      const s = estado.current;
      if (s === null) return;
      const arriba = BORDE - s.y;
      const abajo = s.y - (window.innerHeight - BORDE);
      const paso = arriba > 0 ? -Math.ceil(arriba / 4) : abajo > 0 ? Math.ceil(abajo / 4) : 0;
      if (paso !== 0) {
        window.scrollBy(0, paso);
        actualizar(s);
      }
      s.cuadro = window.requestAnimationFrame(desplazar);
    };
    window.addEventListener('pointermove', seguir, true);
    window.addEventListener('pointerup', seguir, true);
    arrancar.current = () => {
      if (estado.current !== null) estado.current.cuadro = window.requestAnimationFrame(desplazar);
    };
    fin.current = () => {
      const s = estado.current;
      if (s === null) return undefined;
      window.clearTimeout(s.espera);
      window.cancelAnimationFrame(s.cuadro);
      estado.current = null;
      avisarArrastre(false);
      return levantada()?.getBoundingClientRect();
    };
    return () => {
      window.removeEventListener('pointermove', seguir, true);
      window.removeEventListener('pointerup', seguir, true);
      fin.current();
    };
  }, []);

  return (
    <DndContext
      sensors={sensores}
      autoScroll={false}
      accessibility={{ announcements: SIN_ANUNCIOS }}
      onDragStart={({ activatorEvent }: DragStartEvent) => {
        const e = activatorEvent as PointerEvent;
        const { tipo, id } = objetivo.current;
        const zona = document.querySelector(
          tipo === 'grupo' ? `section[data-zona="${id}"]` : `[data-fila-cat="${id}"]`,
        );
        estado.current = {
          x: e.clientX,
          y: e.clientY,
          y0: e.clientY,
          clave: '',
          espera: 0,
          cuadro: 0,
        };
        avisarArrastre(true);
        p.current.alTomar(tipo, id, (zona ?? document.body).getBoundingClientRect());
        arrancar.current();
      }}
      onDragEnd={() => {
        const s = estado.current;
        const r = fin.current();
        if (s === null) return;
        // Soltar fuera de la pantalla cancela.
        if (s.x < 0 || s.y < 0 || s.x > window.innerWidth || s.y > window.innerHeight)
          p.current.alCancelar(r);
        else p.current.alSoltar(r);
      }}
      onDragCancel={() => {
        if (estado.current !== null) p.current.alCancelar(fin.current());
      }}
    >
      <Ancla registrar={props.registrar} objetivo={objetivo} />
    </DndContext>
  );
}
