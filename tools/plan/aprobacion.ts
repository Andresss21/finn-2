// tools/plan/aprobacion.ts — la aprobación de DT-33 (08 §37.3) que `pr:mergear --aprobado` exige (TA-014).
// El hook .claude/hooks/aprobar.mjs escribe <carpeta>/TA-nnn.json cuando el usuario escribe "mergeá TA-nnn".
// La carpeta es un parámetro solo para las pruebas: la línea de comandos usa siempre CARPETA, sin variable de entorno.
import { existsSync, readFileSync, rmSync } from 'node:fs';

export const CARPETA = 'C:/finn/_aprobaciones';
export type Aprobacion =
  { ok: true; huella: string; archivo: string } | { ok: false; error: string };

/** El archivo de la tarea, con esa misma tarea y escrito después del último commit del PR (fecha ISO de git). */
export function leerAprobacion(tarea: string, ultimoCommit: string, carpeta = CARPETA): Aprobacion {
  const archivo = `${carpeta}/${tarea}.json`;
  const no = (error: string): Aprobacion => ({ ok: false, error });
  if (!existsSync(archivo))
    return no(`falta ${archivo}: el usuario escribe "mergeá ${tarea}" en la sesión`);
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(readFileSync(archivo, 'utf8')) as Record<string, unknown>;
  } catch {
    return no(`${archivo} no es JSON`);
  }
  if (d['tarea'] !== tarea) return no(`${archivo} es de ${String(d['tarea'])}, no de ${tarea}`);
  const en = String(d['aprobadoEn']);
  if (!(Date.parse(en) > Date.parse(ultimoCommit)))
    return no(`la aprobación (${en}) no es posterior al último commit del PR (${ultimoCommit})`);
  const huella = String(d['huella']);
  if (!/^[0-9a-f]{64}$/.test(huella)) return no(`${archivo} no tiene la huella del mensaje`);
  return { ok: true, huella, archivo };
}

/** Se borra al mergear: una aprobación sirve para un solo merge. */
export const consumirAprobacion = (archivo: string): void => rmSync(archivo, { force: true });

/** `--aprobado --terminal` (§37.3): solo en una terminal interactiva y fuera de Claude Code. */
export const puedePreguntar = (env: Record<string, string | undefined>, tty: boolean): boolean =>
  tty && !env['CLAUDECODE'];
