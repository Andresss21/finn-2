// La puesta al día (04 §10.1, BE-50): la llama el layout autenticado con `after()`. Corre los pasos 1 y 2 de 10.2 (hoy,
// el 2; el 1 llega con TA-194) salvo que ya haya una de hoy terminada o una en curso de menos de 5 minutos. La
// verificación y el inicio no son atómicos: dos peticiones simultáneas pueden ejecutarla dos veces y es inocuo (10.3).
import { randomUUID } from 'node:crypto';
import { eventosDeTareaDeHoy, leer as leerDb, type EventoDeTarea } from '@finn/db';
import {
  correrPasos,
  PASOS_DIARIA,
  pasosParaEvento,
  registrarDeTarea,
  type DepsTarea,
  type ResultadoPaso,
} from './diaria.ts';

/** BE-50: una ejecución sin fin con un inicio más nuevo que esto sigue en curso. */
export const ESPERA_MS = 5 * 60_000;
const FINES = ['puesta_al_dia', 'diaria'];

/** Las reglas 1 y 2 de BE-50 sobre los eventos de hoy. */
export function debeCorrer(eventos: readonly EventoDeTarea[], ahora: Date): boolean {
  if (eventos.some((e) => FINES.includes(e.mensaje))) return false;
  const terminadas = new Set(
    eventos.filter((e) => e.mensaje === 'puesta_al_dia').map((e) => e.ejecucion),
  );
  return !eventos.some(
    (e) =>
      e.mensaje === 'puesta_al_dia_inicio' &&
      ahora.getTime() - e.ocurridoEn.getTime() < ESPERA_MS &&
      !terminadas.has(e.ejecucion),
  );
}

export async function ponerAlDia(
  d: DepsTarea,
): Promise<{ ejecutada: boolean; pasos: ResultadoPaso[] }> {
  const { hoy, ahora, eventos } = await (d.leer ?? leerDb)(async (tx) => {
    const r = await eventosDeTareaDeHoy(tx, tx.estado.hoy);
    return { hoy: tx.estado.hoy, ...r };
  }, d.opciones?.());
  if (!debeCorrer(eventos, ahora)) return { ejecutada: false, pasos: [] };
  const ejecucion = (d.nuevaEjecucion ?? randomUUID)();
  await registrarDeTarea(d, {
    nivel: 'info',
    origen: 'tarea_diaria',
    mensaje: 'puesta_al_dia_inicio',
    datos: { hoy, ejecucion },
  });
  const pasos = await correrPasos(
    PASOS_DIARIA.filter((p) => p.n <= 2),
    d,
  );
  await registrarDeTarea(d, {
    nivel: 'info',
    origen: 'tarea_diaria',
    mensaje: 'puesta_al_dia',
    datos: { hoy, ejecucion, pasos: pasosParaEvento(pasos) },
  });
  return { ejecutada: true, pasos };
}
