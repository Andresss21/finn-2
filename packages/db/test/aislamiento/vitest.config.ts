// Vitest de los dos archivos de PRU-INT-ESQ-101. Los corre aislamiento.int.test.ts, con el contenedor del
// arnés que recibe en FINN_ARNES_PG; los dos archivos van a la vez, cada uno en su proceso.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import type { ConexionArnes } from '../ayudantes/base.ts';

const finnPg = JSON.parse(process.env['FINN_ARNES_PG'] ?? 'null') as ConexionArnes;

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['*.aislamiento.ts'],
    provide: { finnPg },
    fileParallelism: true,
    maxWorkers: 2,
    testTimeout: 30_000,
  },
});
