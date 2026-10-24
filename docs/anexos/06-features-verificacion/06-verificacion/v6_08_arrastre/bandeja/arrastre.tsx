'use client';
import { DndContext, type KeyboardCoordinateGetter, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type Announcements, type DragEndEvent } from '@dnd-kit/core';
import { useState } from 'react';
import type { PropsArrastre } from './lista';
const nombre = (d: PropsArrastre['destinos'], id?: string | number | null) => d.frecuentes.find((c) => c.id === id)?.nombre ?? 'ninguna categoría';
function Fila({ m, resultado }: { m: PropsArrastre['movimientos'][number]; resultado?: string }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: m.id, disabled: !m.arrastrable || !!resultado, attributes: { roleDescription: 'movimiento arrastrable' } });
  return (
    <li data-testid={`fila-${m.id}`}>
      {resultado ?? <>
        <span ref={setNodeRef} {...listeners} {...attributes} data-testid={`asa-${m.id}`} aria-label={`Arrastrar ${m.comercio} a una categoría`}>{m.comercio} {m.monto}</span>
        <button>Aprobar</button> <a href={`/bandeja/${m.id}`}>Revisar</a>
      </>}
    </li>
  );
}
function Destino({ id, texto }: { id: string; texto: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <li ref={setNodeRef} data-testid={`destino-${id}`} data-sobre={isOver || undefined} style={{ height: 44 }}>{texto}</li>;
}
// Teclado: las flechas saltan entre los destinos del panel, en orden vertical (no se mueve de a 25 px).
const saltarEntreDestinos: KeyboardCoordinateGetter = (evento, { context: { droppableRects, over, collisionRect } }) => {
  if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(evento.code)) return undefined;
  evento.preventDefault();
  const rects = [...droppableRects.entries()].map(([id, r]) => ({ id, r })).sort((a, b) => a.r.top - b.r.top);
  if (!rects.length || !collisionRect) return undefined;
  const i = rects.findIndex((x) => x.id === over?.id);
  const sig = evento.code === 'ArrowDown' || evento.code === 'ArrowRight' ? (i < 0 ? 0 : Math.min(i + 1, rects.length - 1)) : (i < 0 ? 0 : Math.max(i - 1, 0));
  const r = rects[sig].r;
  return { x: r.left + r.width / 2 - collisionRect.width / 2, y: r.top + r.height / 2 - collisionRect.height / 2 };
};
export function ListaArrastrable(p: PropsArrastre) {
  const [activo, setActivo] = useState<string | null>(null);
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: saltarEntreDestinos }),
  );
  const m = p.movimientos.find((x) => x.id === activo);
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${active.id}. Usá las flechas para elegir una categoría y Espacio para soltar.`,
    onDragOver: ({ over }) => over ? `Sobre ${nombre(p.destinos, over.id)}.` : 'Fuera de las categorías.',
    onDragEnd: ({ active, over }) => over ? `Soltaste ${active.id} en ${nombre(p.destinos, over.id)}.` : 'Soltaste fuera de las categorías; no se aprobó.',
    onDragCancel: () => 'Arrastre cancelado.',
  };
  const fin = (e: DragEndEvent) => { setActivo(null); if (e.over) p.alSoltar(String(e.active.id), String(e.over.id)); };
  return (
    <DndContext sensors={sensores} accessibility={{ announcements: anuncios, screenReaderInstructions: { draggable: 'Para arrastrar, presioná Espacio. Mientras arrastrás, usá las flechas y Espacio para soltar o Escape para cancelar.' } }}
      onDragStart={(e) => setActivo(String(e.active.id))} onDragEnd={fin} onDragCancel={() => setActivo(null)}>
      <ul>{p.movimientos.map((x) => <Fila key={x.id} m={x} resultado={p.resultados[x.id]} />)}</ul>
      {activo && <aside data-testid="panel-destinos" style={{ position: "fixed", top: 0, right: 0, width: 220, background: "#eee" }}><ul>
        {m?.sugerida && <Destino id={m.sugerida.id} texto={`Sugerida: ${m.sugerida.nombre}`} />}
        {p.destinos.frecuentes.filter((c) => c.id !== m?.sugerida?.id).map((c) => <Destino key={c.id} id={c.id} texto={c.nombre} />)}
      </ul><button>Otra categoría…</button></aside>}
      <DragOverlay>{m ? <div>{m.comercio}</div> : null}</DragOverlay>
    </DndContext>
  );
}
