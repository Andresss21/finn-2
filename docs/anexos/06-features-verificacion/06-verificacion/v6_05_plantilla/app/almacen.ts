// Simula la estructura (04 6.12.4): grupos y categorías en memoria del proceso.
export type Fila = { id: string; tipo: 'grupo' | 'categoria'; nombre: string; grupoId?: string; orden: number };
const g = globalThis as unknown as { __filas?: Fila[] };
export const filas = (): Fila[] => (g.__filas ??= []);
export const reiniciar = () => { g.__filas = []; };
