// Política de patrones al guardar un formato (04 §8.5, BE-46, OPT-05) y en `ci:politica-patrones`.
// Es la barrera previa a `interpretar` (8.3): ahí un patrón que no compila "no coincide"; aquí ese
// patrón, uno sin los grupos obligatorios o uno con retroceso de grado > 2 no se acepta nunca.
// Solo importa tipos de este paquete, para que Node lo ejecute tal cual desde tools/ci.
import { checkSync } from 'recheck';
import type { FormatoSms } from './interpretar';

export type ValidacionFormato =
  | { valido: true; grado: 0 | 1 | 2 | null } // null: `safe` del fuzzer, sin grado
  | { valido: false; error: 'patron_invalido' | 'banderas_no_permitidas' | 'grupos_obligatorios' }
  | {
      valido: false;
      error: 'patron_lento';
      grado: number | 'exponencial' | null; // null: recheck no terminó (`unknown`)
      ataque: string;
    };

/** 04 §8.5: `checker: 'auto'`, `timeout: 10 s`. */
export const TIEMPO_ANALISIS_MS = 10_000;

const BANDERAS = /^i?m?s?u?$/; // 03 §3.21

/** Nombres de los grupos con nombre del patrón, sin analizar su texto a mano. */
function gruposDe(patron: string, banderas: string): Set<string> {
  // La alternativa vacía coincide siempre; `groups` trae todas las claves aunque no participen.
  const m = new RegExp(`(?:${patron})|`, banderas).exec('');
  return new Set(Object.keys(m?.groups ?? {}));
}

export function validarFormato(
  formato: FormatoSms,
  opciones?: { timeoutMs?: number },
): ValidacionFormato {
  const { patron, banderas } = formato;
  if (!BANDERAS.test(banderas)) return { valido: false, error: 'banderas_no_permitidas' };
  let grupos: Set<string>;
  try {
    new RegExp(patron, banderas);
    grupos = gruposDe(patron, banderas);
  } catch {
    return { valido: false, error: 'patron_invalido' };
  }
  if (
    !grupos.has('ultimos4') ||
    !grupos.has('monto') ||
    grupos.has('fecha') !== formato.formatosFecha.length > 0
  )
    return { valido: false, error: 'grupos_obligatorios' };

  const r = checkSync(patron, banderas, {
    checker: 'auto',
    timeout: opciones?.timeoutMs ?? TIEMPO_ANALISIS_MS,
  });
  if (r.status === 'safe') {
    const tipo = r.complexity.type;
    return { valido: true, grado: tipo === 'constant' ? 0 : tipo === 'linear' ? 1 : null };
  }
  if (r.status === 'unknown')
    return { valido: false, error: 'patron_lento', grado: null, ataque: '' };
  const c = r.complexity;
  if (c.type === 'polynomial' && c.degree <= 2)
    return { valido: true, grado: c.degree <= 1 ? 1 : 2 };
  return {
    valido: false,
    error: 'patron_lento',
    grado: c.type === 'polynomial' ? c.degree : 'exponencial',
    ataque: r.attack.pattern,
  };
}
