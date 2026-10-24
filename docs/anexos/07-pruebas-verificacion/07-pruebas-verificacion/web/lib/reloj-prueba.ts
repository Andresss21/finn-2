// Prototipo de CT-01 (V7-04, ajustado por P7-10): reloj de prueba cambiable en ejecución. Solo servidor.
// Fuente: archivo JSON { "instante": ISO con zona, "fijadoEn": ms reales } que escribe la prueba.
// El reloj simulado avanza con el real: simulado = ahora real + (instante − fijadoEn).
import { readFileSync } from 'node:fs';
import { relojPermitido } from './reloj-permitido';
export interface RelojPrueba { desfaseMs: number; hoy: string; instanteMs: number }
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit', day: '2-digit' });
export function relojDePrueba(env: NodeJS.ProcessEnv = process.env): RelojPrueba | null {
  if (!relojPermitido(env)) return null;                 // barrera 2: fuera de la lista de permitidos se ignora
  const ruta = env.FINN_RELOJ_ARCHIVO;
  if (!ruta) return null;
  let datos: { instante: string; fijadoEn: number };
  try { datos = JSON.parse(readFileSync(ruta, 'utf8')); } catch { return null; }
  const desfaseMs = Date.parse(datos.instante) - datos.fijadoEn;
  const instanteMs = Date.now() + desfaseMs;
  return { desfaseMs, hoy: fmt.format(new Date(instanteMs)), instanteMs };
}
