// Datos de ejemplo de `pnpm probar`: la semilla de A.7 (la de la auditoría de diseño) con operaciones reales de
// @finn/aplicacion (DP-17), y el reloj del servidor en su día. El reloj sigue corriendo desde ahí.
import { sembrar, test } from '../../apps/web/e2e/configuracion/semilla.ts';
import { escenarioA7 } from '../../packages/aplicacion/test/escenarios/a7.ts';
import { fijarRelojServidor } from '../pruebas/e2e/reloj.ts';

// Sin página no hace falta bloquear la red: la redefinición no pide `page`, así Playwright no abre navegador.
const sinNavegador = test.extend({
  redBloqueada: async ({}, usar: (v: undefined) => Promise<void>) => {
    await usar(undefined);
  },
});

sinNavegador('probar: sembrar A.7', async () => {
  const escenario = escenarioA7();
  const hoy = escenario.hoy ?? '2026-03-21';
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  await sembrar(escenario, hoy);
});
