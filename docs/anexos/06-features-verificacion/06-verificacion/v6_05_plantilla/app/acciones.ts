'use server';
import { revalidatePath } from 'next/cache';
import { filas, reiniciar as vaciar, type Fila } from './almacen';
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Entrada = { fila: Fila; servidorMs: number; revalidar: boolean };
// Mismo envoltorio que 04 2.2.2: valida, "escribe" y revalida todo el árbol.
export async function crear(e: Entrada) {
  if (!e.fila?.id || !e.fila.nombre) return { ok: false as const, error: 'VALIDACION' };
  await espera(e.servidorMs);                      // tiempo de escribir() simulado (04 5.6)
  const ya = filas().some((f) => f.id === e.fila.id);
  if (!ya) filas().push(e.fila);
  if (e.revalidar) revalidatePath('/', 'layout');
  return { ok: true as const, valor: { id: e.fila.id }, yaAplicada: ya, avisos: [] };
}
export async function revalidarTodo() { revalidatePath('/', 'layout'); return { ok: true as const }; }
export async function reiniciar() { vaciar(); revalidatePath('/', 'layout'); return { ok: true as const }; }
// Alternativa medida en V6-05 c: el bucle en el servidor, un escribir() por elemento (como OP-38, 04 4.8)
export async function crearLote(e: { filas: Fila[]; servidorMs: number }) {
  for (const f of e.filas) { await espera(e.servidorMs); if (!filas().some((x) => x.id === f.id)) filas().push(f); }
  revalidatePath('/', 'layout');
  return { ok: true as const, creadas: e.filas.length };
}
