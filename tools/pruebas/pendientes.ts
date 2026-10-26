// tools/pruebas/pendientes.ts — M18 (07 §13.3, CH-08, DT-27): los CA de una ficha [I] probados con el estado sembrado
// porque la ficha que produce ese estado todavía no existe ("pendientes de punta a punta", pruebas/pendientes-e2e.json).
// Node 24 lo ejecuta sin compilar.
//   node tools/pruebas/pendientes.ts resumen <pendientes-base.json> <features-base.json>
//     los pendientes que abre y cierra el PR respecto de la base (lo imprime el resumen de `pr:mergear`, TA-010/TA-014)
import { existsSync, readFileSync } from 'node:fs';
import { fichas } from './documentos.ts';
import type { Objetivo } from './documentos.ts';
import type { Entradas, Prueba } from './matriz.ts';

export interface Pendiente {
  ca: string; // CA-nn.m de una ficha [I]
  completa: string; // FT-nn: la ficha que produce el estado y escribe la E2E que lo cierra
}
type Features = Entradas['features'];
const MARCA = 'pendiente_e2e';
export const ES_CA = /^CA-\d{2}\.\d{1,2}$/;

/** Abierto mientras la ficha que lo completa no está terminada (con la E2E, que M18 exige al terminarla). */
export const abierto = (p: Pendiente, features: Features): boolean =>
  features[p.completa] !== 'terminada';

/** M18: errores y avisos de los pendientes; `activas` son las pruebas fuera de cuarentena. */
export function pendientesE2e(e: Entradas, activas: Prueba[], obj: Objetivo[]) {
  const errores: string[] = [];
  const avisos: string[] = [];
  const fs = fichas(e.d06);
  const vistos = new Map<string, number>();
  for (const p of e.pendientes) vistos.set(p.ca, (vistos.get(p.ca) ?? 0) + 1);
  for (const [ca, n] of vistos)
    if (n > 1) errores.push(`M18 ${ca} aparece ${n} veces en pruebas/pendientes-e2e.json`);
  for (const p of e.pendientes.filter((x, i, xs) => xs.findIndex((y) => y.ca === x.ca) === i)) {
    const o = obj.find((x) => x.tipo === 'CA' && x.id === p.ca);
    const f = fs.find((x) => x.ft === p.completa);
    if (!o) {
      errores.push(`M18 pruebas/pendientes-e2e.json cita ${p.ca}, que no existe en 06`);
      continue;
    }
    if (o.prioridad !== 'I') {
      errores.push(
        `M18 ${p.ca} es de ${o.ft} [${o.prioridad}]: solo un CA de una ficha [I] queda pendiente de punta a punta`,
      );
      continue;
    }
    if (!p.completa) {
      errores.push(`M18 ${p.ca} en pruebas/pendientes-e2e.json no dice qué ficha lo completa`);
      continue;
    }
    if (!f) {
      errores.push(`M18 ${p.ca} lo completa ${p.completa}, que no tiene ficha en 06`);
      continue;
    }
    if (f.ft === o.ft) {
      errores.push(`M18 ${p.ca} no puede completarlo su propia ficha (${o.ft})`);
      continue;
    }
    const marcado = e.features[p.ca] === MARCA;
    if (!abierto(p, e.features)) {
      // Cierre (07 §27, condición 8): una E2E activa cuyo título cite el CA
      if (!activas.some((t) => t.id.startsWith('PRU-E2E-') && t.refs.includes(p.ca)))
        errores.push(
          `M18 ${f.ft} está terminada y no tiene una E2E que cite ${p.ca} (pendiente de punta a punta de ${o.ft})`,
        );
      else if (marcado)
        errores.push(`M18 ${p.ca} ya lo cerró ${f.ft}: quitá "${MARCA}" de pruebas/features.json`);
      continue;
    }
    if (!marcado)
      errores.push(
        `M18 ${p.ca} es pendiente de punta a punta: pruebas/features.json lo marca "${MARCA}" hasta que ${f.ft} esté terminada`,
      );
    // Puerta (07 §30, condición 7): ningún pendiente, salvo los de fichas [P]
    if (e.puerta && f.prioridad !== 'P')
      errores.push(
        `M18 ${p.ca} sigue pendiente de punta a punta: lo completa ${f.ft} [${f.prioridad}], y la puerta solo admite pendientes de fichas [P]`,
      );
    else avisos.push(`M18 ${p.ca} (${o.ft}) pendiente de punta a punta: lo completa ${f.ft}`);
  }
  // Las marcas de features.json: solo "pendiente_e2e" y solo para un CA de pendientes-e2e.json
  for (const [k, v] of Object.entries(e.features)) {
    if (!ES_CA.test(k)) continue;
    if (v !== MARCA)
      errores.push(
        `M18 pruebas/features.json marca ${k} como "${v}": un CA solo admite "${MARCA}"`,
      );
    else if (!vistos.has(k))
      errores.push(
        `M18 pruebas/features.json marca ${k} como "${MARCA}" y no está en pruebas/pendientes-e2e.json`,
      );
  }
  return { errores, avisos };
}

// ---------------------------------------------------------------- resumen de pr:mergear
export interface Lado {
  pendientes: Pendiente[];
  features: Features;
}

/** Los pendientes que el PR abre (abiertos en la cabeza y no en la base) y cierra (al revés). */
export function resumenPendientes(base: Lado, cabeza: Lado) {
  const abiertos = (l: Lado): Pendiente[] => l.pendientes.filter((p) => abierto(p, l.features));
  const b = abiertos(base);
  const c = abiertos(cabeza);
  return {
    abre: c.filter((p) => !b.some((x) => x.ca === p.ca)),
    cierra: b.filter((p) => !c.some((x) => x.ca === p.ca)),
  };
}

export function lineasResumen(r: ReturnType<typeof resumenPendientes>): string[] {
  if (!r.abre.length && !r.cierra.length)
    return ['pendientes de punta a punta: ninguno abierto ni cerrado por este PR'];
  return [
    `pendientes de punta a punta: abre ${r.abre.length}, cierra ${r.cierra.length}`,
    ...r.abre.map((p) => `  abre   ${p.ca} (lo completa ${p.completa})`),
    ...r.cierra.map((p) => `  cierra ${p.ca} (lo completa ${p.completa})`),
  ];
}

const leerJson = <T>(p: string | undefined, d: T): T =>
  p && existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T) : d;

if (import.meta.main) {
  const [cmd, pBase, fBase] = process.argv.slice(2);
  if (cmd !== 'resumen') {
    console.error(
      'uso: node tools/pruebas/pendientes.ts resumen <pendientes-base.json> <features-base.json>',
    );
    process.exit(2);
  }
  const base: Lado = { pendientes: leerJson(pBase, []), features: leerJson(fBase, {}) };
  const cabeza: Lado = {
    pendientes: leerJson('pruebas/pendientes-e2e.json', []),
    features: leerJson('pruebas/features.json', {}),
  };
  for (const l of lineasResumen(resumenPendientes(base, cabeza))) console.log(l);
}
