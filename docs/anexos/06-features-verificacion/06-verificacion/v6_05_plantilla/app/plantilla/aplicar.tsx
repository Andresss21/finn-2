'use client';
import { useState } from 'react';
import { crear, crearLote, reiniciar, revalidarTodo } from '../acciones';
import { PLANTILLA } from './plantilla';
type Resultado = { totalMs: number; llamadas: number[]; };
declare global { interface Window { __aplicar: (servidorMs: number, modo: 'cada' | 'final' | 'lote') => Promise<Resultado>; __reiniciar: () => Promise<void> } }
export function Aplicar() {
  const [progreso, setProgreso] = useState('');
  if (typeof window !== 'undefined') {
    window.__reiniciar = async () => { await reiniciar(); };
    window.__aplicar = async (servidorMs, modo) => {
      const filas = PLANTILLA();
      const llamadas: number[] = []; const t0 = performance.now();
      if (modo === 'lote') { await crearLote({ filas, servidorMs }); return { totalMs: performance.now() - t0, llamadas: [performance.now() - t0] }; }
      for (let i = 0; i < filas.length; i++) {
        const t = performance.now();
        const r = await crear({ fila: filas[i], servidorMs, revalidar: modo === 'cada' });
        if (!r.ok) throw new Error('fallo');
        llamadas.push(performance.now() - t);
        setProgreso(`Creando ${i + 1} de ${filas.length}…`);
      }
      if (modo === 'final') await revalidarTodo();
      return { totalMs: performance.now() - t0, llamadas };
    };
  }
  return <p role="status">{progreso}</p>;
}
