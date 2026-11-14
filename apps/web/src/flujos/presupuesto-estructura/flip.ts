// [CH-275] C-46 §3: lo que se corre (filas, grupos, el hueco, la fila soltada) va de su lugar viejo al nuevo con FLIP, en
// `--duracion-normal` y `--curva-estandar`. Cada pieza lleva `data-flip`; las posiciones son relativas a la raíz, así que
// desplazar la página no anima nada. Una pieza dentro de otra que también se corre solo anima su diferencia. Con «reducir
// movimiento», nada.
import { useLayoutEffect, useRef, type RefObject } from 'react';

interface Punto {
  readonly x: number;
  readonly y: number;
}

export function useFlip(raiz: RefObject<HTMLElement | null>): (clave: string, r: DOMRect) => void {
  const previas = useRef(new Map<string, Punto>());
  useLayoutEffect(() => {
    const r = raiz.current;
    if (r === null) return;
    const base = r.getBoundingClientRect();
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const estilo = getComputedStyle(r);
    const duracion = parseFloat(estilo.getPropertyValue('--duracion-normal')) || 220;
    const curva = estilo.getPropertyValue('--curva-estandar').trim() || 'ease';
    const nuevas = new Map<string, Punto>();
    const corridas = new Map<Element, Punto>();
    for (const e of r.querySelectorAll<HTMLElement>('[data-flip]')) {
      for (const a of e.getAnimations()) if (a.id === 'flip') a.cancel();
      const b = e.getBoundingClientRect();
      const ahora = { x: b.left - base.left, y: b.top - base.top };
      const clave = e.dataset.flip ?? '';
      const antes = previas.current.get(clave);
      nuevas.set(clave, ahora);
      if (quieto || antes === undefined) continue;
      const padre = corridas.get(e.parentElement?.closest('[data-flip]') ?? r) ?? { x: 0, y: 0 };
      const d = { x: antes.x - ahora.x, y: antes.y - ahora.y };
      corridas.set(e, d);
      const dx = d.x - padre.x;
      const dy = d.y - padre.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      e.animate(
        [{ transform: `translate(${String(dx)}px, ${String(dy)}px)` }, { transform: 'none' }],
        { duration: duracion, easing: curva, id: 'flip' },
      );
    }
    previas.current = nuevas;
  });
  /** Dónde estaba algo que no estaba en la lista (la fila levantada al soltar o cancelar). */
  return (clave, rect) => {
    const base = raiz.current?.getBoundingClientRect();
    if (base !== undefined)
      previas.current.set(clave, { x: rect.left - base.left, y: rect.top - base.top });
  };
}
