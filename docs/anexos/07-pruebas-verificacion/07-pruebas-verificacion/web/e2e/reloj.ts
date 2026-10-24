// Ayuda de E2E (CT-01): fija el instante simulado del servidor. La base recibe el mismo desfase por transacción.
import { writeFileSync } from 'node:fs';
import { ARCHIVO_RELOJ } from '../playwright.config';
export const fijarReloj = (instante: string) => writeFileSync(ARCHIVO_RELOJ, JSON.stringify({ instante, fijadoEn: Date.now() }));
