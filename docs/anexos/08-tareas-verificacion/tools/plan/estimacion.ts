// tools/plan/estimacion.ts — V8-02: tareas, PR, minutos de CI y meses, con el modelo de 07 §6.4.
// Sin dependencias. Uso: node tools/plan/estimacion.ts

type Supuesto = { nombre: string; pushesPorPr: number; pushesListoPorPr: number };

// Costos por corrida (minutos cobrados, redondeo hacia arriba por job), 07 §6.4.
const RAPIDO = 3, INTEGRACION = 4, E2E_PR = 7, E2E_MAIN = 11, DESPLEGAR = 3;
const AHORRO_M5 = 1;                 // un arranque de job menos cuando corren los dos (07 §32.2)
const AFECTA_DB = 0.4, AFECTA_WEB = 0.7;
const CORRIDAS_MAIN_POR_MERGE = 25 / 40; // concurrencia de main (07 §6.1)
// Fijos al mes
const NOCTURNO = 13 * 20, CIERRE = 15;
const RESPALDO = 30 * 2 + 30, RESTAURACION = 5; // respaldo + control de dinero (07 §31.1), solo con producción
const RESTAURACION_TRANSICION = 15;           // semanal durante las 8 semanas (CT-09)
const RESPALDO_10 = 60;                        // si se mantiene el respaldo de la 1.0 en Actions (P8-14)
const UMBRAL_RECORTE = 1700, CUOTA = 2000, PUSHES_MAX = 150;

// Tareas por bloque: todos exactos (partes A a D).
const BLOQUES: [string, number, number][] = [
  ['B0 Fundación (exacto, con TA-015)', 15, 15], ['B1 Base de datos (exacto)', 10, 10], ['B2 Dominio (exacto)', 48, 48],
  ['B3 db, aplicación, sms, conciliación (exacto)', 50, 50], ['B4 Web base (exacto)', 25, 25], ['B5 Operación (exacto)', 8, 8],
  ['B6 Features [I] (exacto: 31 fichas, 233 CA)', 36, 36], ['B7 Features [M] (exacto: 38 fichas, 232 CA, 2 recorridos y TA-470)', 43, 43],
  ['B8 Features [P] y FT-49 (exacto)', 8, 8],
];
// Tareas hasta HT-5 (sin producción), exacto: B0, B1, la ola 1 de B2 y B3, TA-250 a TA-253 y las 20 tareas de HT-5.
const ANTES_HT5 = 15 + 10 + 38 + 43 + 4 + 20; // [D] con TA-015 y la ola 1 ampliada (TA-138, TA-139, TA-193, TA-194)

function minutosPorPr(s: Supuesto): number {
  const rapido = RAPIDO * s.pushesPorPr;
  const integ = (INTEGRACION - AHORRO_M5) * AFECTA_DB * s.pushesPorPr;
  const e2e = E2E_PR * AFECTA_WEB * s.pushesListoPorPr;
  const main = CORRIDAS_MAIN_POR_MERGE * (RAPIDO + INTEGRACION - AHORRO_M5 + E2E_MAIN + DESPLEGAR);
  return rapido + integ + e2e + main;
}

function capacidad(s: Supuesto, fijos: number, techo: number): number {
  const porMinutos = Math.floor((techo - fijos) / minutosPorPr(s));
  const porPushes = Math.floor(PUSHES_MAX / s.pushesPorPr);
  return Math.min(porMinutos, porPushes);
}

const supuestos: Supuesto[] = [
  { nombre: '07 §6.4: 3,75 pushes por PR (1,5 en listo)', pushesPorPr: 3.75, pushesListoPorPr: 1.5 },
  { nombre: 'DT-07: 2 pushes por PR (1 en listo)', pushesPorPr: 2, pushesListoPorPr: 1 },
];

const [min, max] = BLOQUES.reduce(([a, b], [, x, y]) => [a + x, b + y], [0, 0]);
const minPuerta = min - (BLOQUES[8] as [string, number, number])[1];
const maxPuerta = max - (BLOQUES[8] as [string, number, number])[2];
console.log('Tareas estimadas por bloque (mín–máx):');
for (const [n, a, b] of BLOQUES) console.log(`  ${n}: ${a}–${b}`);
console.log(`  Total: ${min}–${max}; hasta la puerta (sin [P]): ${minPuerta}–${maxPuerta}. Un PR por tarea.`);
console.log('');

const fijosSinProd = NOCTURNO + CIERRE;
const fijosConProd = NOCTURNO + CIERRE + RESPALDO + RESTAURACION;
for (const s of supuestos) {
  const pr = minutosPorPr(s);
  const capSin = capacidad(s, fijosSinProd, UMBRAL_RECORTE);
  const capCon = capacidad(s, fijosConProd, UMBRAL_RECORTE);
  const capCon10 = capacidad(s, fijosConProd + RESPALDO_10, UMBRAL_RECORTE);
  const capDuro = capacidad(s, fijosConProd, CUOTA);
  const porPushes = Math.floor(PUSHES_MAX / s.pushesPorPr);
  // Meses: hasta HT-5 sin producción (ANTES_HT5 tareas, exacto); después, con producción.
  const meses = (n: number, c1: number, c2: number): number => { const antes = Math.min(n, ANTES_HT5); return antes / c1 + (n - antes) / c2; };
  console.log(`${s.nombre}`);
  console.log(`  Minutos por PR: ${pr.toFixed(1)} (PR + parte de las corridas de main)`);
  console.log(`  Límite por pushes (150/mes): ${porPushes} PR/mes`);
  console.log(`  PR/mes con ≤ ${UMBRAL_RECORTE} min: ${capSin} sin producción; ${capCon} con producción; ${capCon10} si se mantiene el respaldo de la 1.0`);
  console.log(`  PR/mes con la cuota completa (${CUOTA}): ${capDuro} con producción`);
  console.log(`  Minutos al mes a esa capacidad (con producción): ${(capCon * pr + fijosConProd).toFixed(0)}; pushes: ${(capCon * s.pushesPorPr).toFixed(0)}`);
  console.log(`  Meses hasta la puerta: ${meses(minPuerta, capSin, capCon).toFixed(1)}–${meses(maxPuerta, capSin, capCon).toFixed(1)} (solo CI; el ritmo real de agentes y revisiones puede ser menor)`);
  console.log(`  Meses hasta terminar las [P]: ${meses(min, capSin, capCon).toFixed(1)}–${meses(max, capSin, capCon).toFixed(1)}`);
  console.log('');
}
console.log(`Comprobación del modelo: con 3,75 pushes y 40 PR, minutos = ${(40 * minutosPorPr(supuestos[0] as Supuesto) + fijosConProd).toFixed(0)} (07 §32.2 da 1.804–1.834 con M5).`);
console.log(`Restauración semanal en la transición: +${RESTAURACION_TRANSICION - RESTAURACION} min en esos dos meses.`);
