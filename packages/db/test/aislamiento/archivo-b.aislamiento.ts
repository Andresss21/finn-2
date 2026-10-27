// Segundo archivo de PRU-INT-ESQ-101: lo corre aislamiento.int.test.ts en un Vitest aparte.
import { probarAislamiento } from './comun.ts';

await probarAislamiento('b');
