'use client';
// Salida animada antes de desmontar (CH-220 C1, FIXES §3): hojas, velo, panel y menú terminan su animación y recién después
// se desmontan. Se cierra con `animationend` del propio elemento o, como tope, a la duración del token (nunca un número suelto).
// Con movimiento reducido no hay animación: se cierra en el acto.
import { useEffect, useRef, useState, type AnimationEvent } from 'react';
import { useMovimientoReducido } from './use-movimiento-reducido';

/** Duración en milisegundos de un token de `tokens.css` (`--duracion-*`); sin estilos (servidor, pruebas), 0. */
export function duracionToken(nombre: string): number {
  if (typeof window === 'undefined') return 0;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  const n = Number.parseFloat(valor);
  if (!Number.isFinite(n)) return 0;
  return valor.endsWith('ms') ? n : n * 1000;
}

export interface Salida {
  /** `true` desde que empezó la salida: el elemento sigue montado con su animación de salida. */
  readonly saliendo: boolean;
  /** Empieza la salida; una segunda llamada mientras sale no hace nada. */
  readonly salir: () => void;
  /** Para `onAnimationEnd` del elemento que sale: solo cuenta su propia animación, no la de un hijo. */
  readonly alTerminarAnimacion: (evento: AnimationEvent<HTMLElement>) => void;
  /** Vuelve al estado de reposo (un menú que se abre de nuevo). */
  readonly reiniciar: () => void;
}

export function useSalida(alTerminar: () => void, token: string): Salida {
  const reducido = useMovimientoReducido();
  const [saliendo, setSaliendo] = useState(false);
  const enCurso = useRef(false);
  const montado = useRef(true);
  const reloj = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ultimo = useRef(alTerminar);
  useEffect(() => {
    ultimo.current = alTerminar;
  });
  useEffect(() => {
    montado.current = true;
    return () => {
      // Desmontado mientras salía (otra navegación): no se llama al cierre.
      montado.current = false;
      clearTimeout(reloj.current);
    };
  }, []);
  const terminar = (): void => {
    if (!enCurso.current || !montado.current) return;
    enCurso.current = false;
    clearTimeout(reloj.current);
    ultimo.current();
  };
  return {
    saliendo,
    salir: () => {
      if (enCurso.current) return;
      enCurso.current = true;
      if (reducido) {
        terminar();
        return;
      }
      setSaliendo(true);
      reloj.current = setTimeout(terminar, duracionToken(token));
    },
    alTerminarAnimacion: (evento) => {
      if (evento.target === evento.currentTarget) terminar();
    },
    reiniciar: () => {
      enCurso.current = false;
      clearTimeout(reloj.current);
      setSaliendo(false);
    },
  };
}
