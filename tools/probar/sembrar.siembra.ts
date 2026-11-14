// Datos de ejemplo de `pnpm probar`: la semilla de A.7 (la de la auditoría de diseño) con operaciones reales de
// @finn/aplicacion (DP-17), y el reloj del servidor en su último día. El reloj sigue corriendo desde ahí.
import { sembrar, test } from '../../apps/web/e2e/configuracion/semilla.ts';
import { escenarioA7 } from '../../packages/aplicacion/test/escenarios/a7.ts';
import { ultimoDia } from '../pruebas/e2e/local.ts';
import { fijarRelojServidor } from '../pruebas/e2e/reloj.ts';

// Sin página no hace falta bloquear la red: la redefinición no pide `page`, así Playwright no abre navegador.
const sinNavegador = test.extend({
  redBloqueada: async ({}, usar: (v: undefined) => Promise<void>) => {
    await usar(undefined);
  },
});

sinNavegador('probar: sembrar A.7', async () => {
  const escenario = escenarioA7();
  const inicio = escenario.hoy ?? '2026-03-21';
  // `hoy` de SEM-A7 es su primer día; con el reloj ahí, las transacciones posteriores quedan en el futuro (inv. 12) y
  // toda escritura termina en `invariante_violada` (INTERNO). El servidor va al día de la última operación, como la
  // auditoría y la E2E (2026-10-15).
  fijarRelojServidor(`${ultimoDia(escenario.estadoInicial, inicio)}T10:00:00-06:00`);
  await sembrar(escenario, inicio);
});
