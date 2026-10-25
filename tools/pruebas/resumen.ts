// tools/pruebas/resumen.ts — `pnpm pruebas:resumen <features-base.json>` (07 §13.5, §22.2, P7-18): fichas que cambian de
// estado respecto de la base y manuales pendientes de las fichas terminadas. `pr:mergear` lo imprime antes de mergear.
// Node 24 lo ejecuta sin compilar.
import { existsSync, readFileSync } from 'node:fs';
import { cargarEntradas, verificar } from './matriz.ts';
import type { Entradas } from './matriz.ts';

type Features = Entradas['features'];

/** `FT-30: en_curso → terminada`; la ficha que no figura está `pendiente` (07 §13.4). */
export function cambiosDeEstado(base: Features, cabeza: Features): string[] {
  const fts = [...new Set([...Object.keys(base), ...Object.keys(cabeza)])]
    .filter((k) => /^FT-\d{2}$/.test(k))
    .sort();
  return fts.flatMap((ft) => {
    const [b, c] = [base[ft] ?? 'pendiente', cabeza[ft] ?? 'pendiente'];
    return b === c ? [] : [`${ft}: ${b} → ${c}`];
  });
}

export function resumen(base: Features, e: Entradas): { lineas: string[]; aTerminada: boolean } {
  const cambios = cambiosDeEstado(base, e.features);
  const pend = [...verificar(e).manualesPendientes].sort(([a], [b]) => a.localeCompare(b));
  return {
    aTerminada: cambios.some((c) => c.endsWith('→ terminada')),
    lineas: [
      cambios.length ? 'fichas que cambian de estado:' : 'fichas que cambian de estado: ninguna',
      ...cambios.map((c) => '  ' + c),
      pend.length ? 'manuales pendientes:' : 'manuales pendientes: ninguno',
      ...pend.map(([ft, ms]) => `  ${ft}: ${ms.join(', ')}`),
    ],
  };
}

if (import.meta.main) {
  const p = process.argv[2];
  if (!p || !existsSync(p)) {
    console.error('uso: pnpm pruebas:resumen <features-base.json>');
    process.exit(2);
  }
  const base = JSON.parse(readFileSync(p, 'utf8')) as Features;
  for (const l of resumen(base, cargarEntradas('.')).lineas) console.log(l);
}
