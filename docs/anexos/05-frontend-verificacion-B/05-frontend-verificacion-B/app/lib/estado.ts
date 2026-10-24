// "Base de datos" en memoria del proceso: suficiente para verificar el contrato de la interfaz.
import { createHash } from 'node:crypto';
type Estado = { revision: number; lpa: number; asignado: number; creadas: Map<string, number>; llamadas: string[]; fallos: Record<string, number> };
const g = globalThis as unknown as { __finn?: Estado };
export const estado: Estado = (g.__finn ??= { revision: 1, lpa: 10000, asignado: 5000, creadas: new Map(), llamadas: [], fallos: {} });
export const huella = (o: unknown) => createHash('sha256').update(JSON.stringify(o)).digest('hex');
export const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
