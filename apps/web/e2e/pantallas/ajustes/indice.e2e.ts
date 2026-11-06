// Índice de Ajustes del export de diseño (pantalla 11; 06 FT-72; 07 §17). Recorre `/ajustes` como la persona: la lista de secciones
// con sus filas de 44 px o más y la navegación a una de ellas.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, irAlDocumentoFinal } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesCiclo } from '../../../src/textos/ajustes-ciclo.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';

test.describe('PRU-E2E-AJUS', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
    const hoy = '2027-02-05';
    fijarRelojServidor(`${hoy}T10:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-BAND',
      titulo: 'Semilla del índice de Ajustes',
      refs: [],
      hoy,
      estadoInicial: [],
      pasos: [],
    };
    await sembrar(escenario, hoy);
  });

  test('PRU-E2E-AJUS-140 [FT-04] el índice lista las secciones en filas de 44 px o más, y la fila «Ciclo» lleva a su pantalla', async ({
    page,
  }) => {
    await irAlDocumentoFinal(page, '/ajustes');
    await esperarContenido(page);
    const filas = page.locator('[data-rol="lista-ajustes"] a');
    await expect(filas).toHaveCount(10);
    for (const fila of await filas.all()) {
      const caja = await fila.boundingBox();
      expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await filas.filter({ hasText: ajustesCiclo.enlace }).click();
    await expect(page).toHaveURL(/\/ajustes\/ciclo$/);
  });
});
