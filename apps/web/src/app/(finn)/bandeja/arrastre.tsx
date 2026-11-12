'use client';
// FT-78 (FD-30, CF-21, CF-22): arrastrar un movimiento a una categoría. Este módulo es el único que importa `@dnd-kit/core`
// y se carga con `import()` desde la lista, después de hidratar (05 §13.3, V6-08). El gesto empieza con 6 px de ratón, con una
// pulsación larga de 350 ms y tolerancia de 8 px en el teléfono, o con Espacio o Enter sobre el asa (WCAG 2.5.7, 2.1.1).
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icono } from '../../../componentes/base/icono';
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';
import { avisarArrastre } from '../../../componentes/marco/arrastre';
import { formatearMonto } from '../../../formato';
import { bandeja } from '../../../textos/bandeja';

const t = bandeja.arrastre;
const OTRA = 'otra';
/** Las frecuentes que se muestran: hasta 5, distintas de la sugerida (CA-78.10). */
const FRECUENTES = 5;

interface Ref {
  readonly id: string;
  readonly nombre: string;
}
/** `destinosArrastre` de `bandeja()` (04 §6.8, CF-22). */
export interface DestinosArrastre {
  readonly frecuentes: readonly Ref[];
  readonly grupos: readonly { readonly grupo: Ref; readonly categorias: readonly Ref[] }[];
}

// Con el teclado no hay puntero: se elige por el rectángulo que cae sobre el destino
const colision: CollisionDetection = (a) =>
  a.pointerCoordinates === null ? rectIntersection(a) : pointerWithin(a);

/**
 * [CH-240 E3-2, E3-3] Un destino de 48 px. Libre: borde punteado `--borde-control` («se puede soltar acá»). Con la fila encima:
 * fondo `--accion`, texto `--texto-sobre-accion`, borde de 2 px y el glifo `in` (tres señales); «Otra categoría…» usa el tonal.
 */
function Destino({
  id,
  texto,
  sobre,
  ancho,
}: {
  id: string;
  texto: string;
  sobre: boolean;
  ancho?: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <li
      ref={setNodeRef}
      data-destino={id}
      {...(sobre ? { 'data-sobre': '' } : {})}
      className={[
        'flex min-h-12 items-center gap-1 rounded-xl border-2 px-3 text-cuerpo',
        ancho === true ? 'col-span-2' : '',
        sobre
          ? id === OTRA
            ? 'border-accion bg-accion-tonal font-bold text-accion'
            : 'border-accion bg-accion font-bold text-texto-sobre-accion'
          : 'border-dashed border-borde-control bg-superficie',
      ].join(' ')}
    >
      {sobre ? <Icono nombre="in" tamano={16} /> : null}
      <span className="min-w-0 truncate">{texto}</span>
    </li>
  );
}

/** El nombre del asa: el comercio y el monto de la fila (FT-78). */
const etiquetaDe = (m: MovimientoDto): string =>
  [m.comercio ?? t.sinComercio, m.monto === null ? '' : formatearMonto(m.monto)]
    .filter(Boolean)
    .join(' ');

/** El asa de una fila arrastrable: un botón con nombre propio, que nunca es la única forma de aprobar (WCAG 2.5.7). */
export function AsaArrastre({
  id,
  etiqueta,
  deshabilitado,
}: {
  id: string;
  etiqueta: string;
  deshabilitado?: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    disabled: deshabilitado === true,
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={etiqueta}
      data-asa={id}
      {...(deshabilitado === true
        ? { 'aria-disabled': true, 'aria-describedby': 'bandeja-sin-conexion' }
        : {})}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
      // [CH-240 E3-1] Teléfono: sin asa visible, el botón cubre la cabecera (pulsación larga). Computadora: 44 px, aparece al pasar y con foco.
      className="group/asa inline-flex size-full select-none items-center justify-center rounded-full text-texto-secundario [-webkit-touch-callout:none] [touch-action:manipulation] lg:size-11"
    >
      <span className="hidden opacity-0 group-hover/fila:opacity-100 group-focus-visible/asa:opacity-100 lg:inline-flex">
        <Icono nombre="grip" tamano={18} />
      </span>
      <span
        aria-hidden="true"
        data-instruccion-asa
        className="pointer-events-none absolute top-full right-0 z-20 mt-1 hidden w-64 rounded-xl bg-superficie p-2 text-left text-cuerpo-pequeno font-normal text-texto shadow-elevacion-2 lg:group-focus-visible/asa:block"
      >
        {t.instrucciones}
      </span>
    </button>
  );
}

export function ContextoArrastre({
  movimientos,
  destinos,
  alSoltar,
  alElegirOtra,
  deshabilitado,
}: {
  readonly movimientos: readonly MovimientoDto[];
  readonly destinos: DestinosArrastre;
  readonly alSoltar: (movimientoId: string, categoriaId: string) => void;
  /** Soltar sobre «Otra categoría…» termina el arrastre sin aprobar y abre el selector (CA-78.11). */
  readonly alElegirOtra: (movimientoId: string) => void;
  /** [CH-240 E6-3] Sin conexión el asa y la pulsación larga no empiezan ningún arrastre. */
  readonly deshabilitado?: boolean;
}) {
  const [activo, setActivo] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const orden = useRef<string[]>([]);
  const posicion = useRef(-1);
  // Las flechas saltan de un destino al siguiente en el orden del panel
  const coordenadas: KeyboardCoordinateGetter = (evento, { context }) => {
    if (evento.code !== 'ArrowDown' && evento.code !== 'ArrowUp') return undefined;
    evento.preventDefault();
    const { droppableRects: rects, collisionRect: mia } = context;
    const visibles = orden.current.filter((id) => (rects.get(id)?.width ?? 0) > 0);
    if (visibles.length === 0 || mia === null) return undefined;
    const paso = evento.code === 'ArrowDown' ? 1 : -1;
    const i = Math.max(0, Math.min(visibles.length - 1, posicion.current + paso));
    posicion.current = i;
    const r = rects.get(visibles[i] ?? '');
    return r === undefined ? undefined : { x: r.left, y: r.top + (r.height - mia.height) / 2 };
  };
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ['Space', 'Enter'], cancel: ['Escape'], end: ['Space', 'Enter'] },
      coordinateGetter: coordenadas,
    }),
  );

  // Las filas dejan su ranura vacía (`data-ranura-asa`); el asa se monta ahí sin volver a montar la fila
  const [ranuras, setRanuras] = useState<Readonly<Record<string, Element>>>({});
  useEffect(() => {
    const halladas: Record<string, Element> = {};
    for (const e of document.querySelectorAll('[data-ranura-asa]'))
      halladas[e.getAttribute('data-ranura-asa') ?? ''] = e;
    setRanuras((previas) => {
      const claves = Object.keys(halladas);
      return claves.length === Object.keys(previas).length &&
        claves.every((k) => previas[k] === halladas[k])
        ? previas
        : halladas;
    });
  });
  // [CH-240 E3-3, E3-6] La fila tomada deja su hueco punteado (`data-tomada`) y, mientras dura el arrastre, la barra inferior
  // del teléfono queda `inert`: el panel de destinos la tapa y nada debe recibir el foco detrás
  useEffect(() => {
    if (activo === null) return;
    const fila = document.querySelector(`[data-movimiento="${activo}"]`);
    fila?.setAttribute('data-tomada', '');
    avisarArrastre(true);
    return () => {
      fila?.removeAttribute('data-tomada');
      avisarArrastre(false);
    };
  }, [activo]);
  const devolverFoco = (id: string): void => {
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-asa="${id}"]`)?.focus();
    }, 0);
  };
  const movimiento = movimientos.find((m) => m.id === activo);
  const sugerida = movimiento?.categoriaSugerida ?? null;
  const frecuentes = destinos.frecuentes.filter((c) => c.id !== sugerida?.id).slice(0, FRECUENTES);
  const nombres = useMemo(() => {
    const todos = new Map<string, string>([[OTRA, t.otra]]);
    for (const m of movimientos)
      if (m.categoriaSugerida?.id !== undefined)
        todos.set(`f:${m.categoriaSugerida.id}`, m.categoriaSugerida.nombre);
    for (const c of destinos.frecuentes) todos.set(`f:${c.id}`, c.nombre);
    for (const g of destinos.grupos) for (const c of g.categorias) todos.set(`g:${c.id}`, c.nombre);
    return todos;
  }, [movimientos, destinos]);
  const comercioDe = (id: string | number): string =>
    movimientos.find((m) => m.id === id)?.comercio ?? t.sinComercio;
  const nombreDe = (id: string | number): string => nombres.get(String(id)) ?? '';

  const anuncios: Announcements = {
    onDragStart: ({ active }) => t.tomaste(comercioDe(active.id)),
    onDragOver: ({ over }) => (over === null ? undefined : t.sobre(nombreDe(over.id))),
    onDragEnd: ({ active, over }) =>
      over === null ? t.cancelado : t.soltaste(comercioDe(active.id), nombreDe(over.id)),
    onDragCancel: () => t.cancelado,
  };
  const ids = [
    ...(sugerida?.id === undefined ? [] : [`f:${sugerida.id}`]),
    ...frecuentes.map((c) => `f:${c.id}`),
    OTRA,
    ...destinos.grupos.flatMap((g) => g.categorias.map((c) => `g:${c.id}`)),
  ];
  // El orden del panel, para que las flechas salten de un destino al siguiente
  useEffect(() => {
    orden.current = ids;
  });
  const ficha = [
    movimiento?.comercio ?? t.sinComercio,
    movimiento?.monto == null ? '' : formatearMonto(movimiento.monto),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={colision}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: { draggable: t.instrucciones },
      }}
      onDragStart={({ active }: DragStartEvent) => {
        posicion.current = -1;
        setActivo(String(active.id));
      }}
      onDragOver={({ over }: DragOverEvent) => {
        setSobre(over === null ? null : String(over.id));
      }}
      onDragEnd={({ active, over }: DragEndEvent) => {
        const destino = over === null ? '' : String(over.id);
        setActivo(null);
        setSobre(null);
        // Soltar sobre una categoría aprueba; sobre «Otra categoría…» abre el selector; fuera del panel no envía nada
        if (destino.startsWith('f:') || destino.startsWith('g:'))
          alSoltar(String(active.id), destino.slice(2));
        else if (destino === OTRA) alElegirOtra(String(active.id));
        // Soltar fuera del panel cancela: la fila vuelve a su lugar y el foco, al asa (E3-4)
        else devolverFoco(String(active.id));
      }}
      onDragCancel={({ active }: DragCancelEvent) => {
        setActivo(null);
        setSobre(null);
        devolverFoco(String(active.id));
      }}
    >
      {movimientos.map((m) => {
        const ranura = ranuras[m.id];
        return ranura === undefined || m.aprobacion.arrastrable !== true
          ? null
          : createPortal(
              <AsaArrastre
                id={m.id}
                etiqueta={t.asa(etiquetaDe(m))}
                {...(deshabilitado === true ? { deshabilitado } : {})}
              />,
              ranura,
              m.id,
            );
      })}
      <DragOverlay dropAnimation={null}>
        {movimiento === undefined ? null : (
          // [CH-240 E3-3] Versión compacta levantada: asa, «{comercio} · {monto}», elevación 3, anillo de 2 px y escala 1.03
          <span
            data-fila-levantada
            className="inline-flex scale-103 items-center gap-2 rounded-full bg-superficie px-3 py-2 text-cuerpo font-bold whitespace-nowrap shadow-elevacion-3 ring-2 ring-accion"
          >
            <Icono nombre="grip" tamano={18} />
            {ficha}
            {sobre === null ? null : (
              <span className="font-normal text-texto-secundario">
                {t.haciaCategoria(nombreDe(sobre))}
              </span>
            )}
          </span>
        )}
      </DragOverlay>
      {activo === null ? null : (
        <aside
          aria-label={t.panel}
          data-panel-destinos
          className="fixed inset-x-0 bottom-0 z-40 max-h-[60vh] overflow-y-auto rounded-t-contenedor bg-superficie p-3 shadow-elevacion-3 lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-96 lg:rounded-none"
        >
          {/* Teléfono: rejilla de 2 columnas; «Sugerida» y «Otra categoría…» a todo el ancho (E3-2) */}
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {sugerida?.id === undefined ? null : (
              <Destino
                id={`f:${sugerida.id}`}
                texto={t.sugerida(sugerida.nombre)}
                sobre={sobre === `f:${sugerida.id}`}
                ancho
              />
            )}
            {frecuentes.map((c) => (
              <Destino key={c.id} id={`f:${c.id}`} texto={c.nombre} sobre={sobre === `f:${c.id}`} />
            ))}
            <Destino id={OTRA} texto={t.otra} sobre={sobre === OTRA} ancho />
          </ul>
          {destinos.grupos.map((g) => (
            <section key={g.grupo.id} className="mt-4 hidden lg:block">
              <h2 className="mb-1 text-titulo-seccion">{g.grupo.nombre}</h2>
              <ul className="flex flex-col gap-2">
                {g.categorias.map((c) => (
                  <Destino
                    key={c.id}
                    id={`g:${c.id}`}
                    texto={c.nombre}
                    sobre={sobre === `g:${c.id}`}
                  />
                ))}
              </ul>
            </section>
          ))}
        </aside>
      )}
    </DndContext>
  );
}
