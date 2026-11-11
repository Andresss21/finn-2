// Prueba de humo del arnés: Inicio y Presupuesto con la semilla de A.7 (los datos de las referencias).
import { caso, escenarioA7 } from '../lib.ts';

const A7 = { escenario: escenarioA7(), hoyServidor: '2026-10-15', soloLectura: true } as const;

caso({
  id: 'inicio__principal',
  ruta: '/',
  comp: 'apps/web/src/app/(finn)/page.tsx',
  ref: '02-referencias/entrega-1/pantallas/S1-Inicio',
  ...A7,
});
caso({
  id: 'presupuesto__principal',
  ruta: '/presupuesto',
  comp: 'apps/web/src/app/(finn)/presupuesto/page.tsx',
  ref: '02-referencias/entrega-1/pantallas/S2-Presupuesto',
  ...A7,
});
