// Presupuesto de `calcular` a 10 años de volumen alto (04 §5.6, BE-23; 02 §2.3): ≤ 150 ms, mediana de 5 corridas
// en el runner (07 §6.6, P7-5). Corre en el nocturno con `pnpm bench`; un tiempo superado no falla aquí: lo evalúa
// `tools/pruebas/volumen/registrar.ts`, que avisa y fija FINN_REN_ROJO (no bloquea el despliegue del día). Los
// hechos salen del generador de volumen (07 §12.7) fuera de la medición.
import { bench, describe } from 'vitest';
import { generarHechos, fechaFinal } from '../../../tools/pruebas/volumen/generar.ts';
import { calcular } from '../src/index.ts';

const VOLUMEN = { nivel: 'alto', anios: 10, semilla: 1 } as const;
const hechos = generarHechos(VOLUMEN);
const hoy = fechaFinal(VOLUMEN);

describe('calcular a 10 años, volumen alto', () => {
  bench(
    'PRU-REN-MOTOR-101 [V-13] calcular sobre el volumen alto a 10 años',
    () => {
      calcular(hechos, hoy);
    },
    // 5 corridas medidas tras una de calentamiento: la mediana de 5 de 07 §6.6
    { iterations: 5, warmupIterations: 1, time: 0, warmupTime: 0 },
  );
});
