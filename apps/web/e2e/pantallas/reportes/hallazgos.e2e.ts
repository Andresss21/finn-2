// FT-67 Hallazgos accionables (06 FT-67; 05 §2.10; 07 §17: una pantalla es una E2E). Cada prueba parte de A.7 con el reloj del servidor
// fijo en el 15/10/2026 (DP-04) y abre `/reportes/hallazgos` como la persona. Los números los pone el motor: la prueba solo comprueba
// que la pantalla los dibuja y que la propuesta de un toque se ejecuta y se revierte (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY_A7 = '2026-10-15';

/** A.7 después del paso 3 de 4.2 con el reloj del servidor en el 15/10/2026 (las E2E no importan valores del dominio). */
async function sembrarA7(): Promise<void> {
  const { escenarioA7 } = await import('../../../../../packages/aplicacion/test/escenarios/a7.ts');
  const escenario = escenarioA7();
  fijarRelojServidor(`${HOY_A7}T10:00:00-06:00`);
  await sembrar(escenario, escenario.hoy ?? HOY_A7);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
const fila = (page: Page, categoria: string) =>
  page.locator('[data-hallazgo-fila]').filter({ hasText: categoria });

test.describe('PRU-E2E-REP hallazgos accionables', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-234 [FT-67, CA-67.2] con A.7 Restaurantes aparece una sola vez, con el hallazgo de ritmo y su acción de un toque', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/hallazgos');
    await expect(page.locator('[data-hallazgo-fila]').first()).toBeVisible();
    expect(await page.locator('[data-hallazgo-fila]').count()).toBeLessThanOrEqual(5);
    const h = fila(page, 'Restaurantes');
    await expect(h).toHaveCount(1);
    await expect(h).toContainText(ti.hallazgo.ya('$26.30', 'Restaurantes', '$55.56', '20/10'));
    await expect(
      h.getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-sin-hallazgos]')).toHaveCount(0);
  });

  test('PRU-E2E-REP-235 [FT-67, CA-67.3] al ejecutar la propuesta queda «Deshacer»; al tocarla vuelve Asignado a $120.00 y el hallazgo reaparece', async ({
    page,
  }) => {
    await sembrarA7();
    await abrir(page, '/reportes/hallazgos');
    const h = fila(page, 'Restaurantes');
    const id =
      (await h.locator('[data-hallazgo]').getAttribute('data-hallazgo'))?.replace(
        'categoria:',
        '',
      ) ?? '';
    await h.getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true }).click();
    const salida = page.locator('[data-ritmo-asignado]');
    await expect(salida).toContainText(t.ritmo.asignado('$55.56', 'Restaurantes'));
    await expect(h.locator('[data-hallazgo]')).toBeHidden();
    await salida.getByRole('button', { name: ti.deshacer, exact: true }).click();
    await expect(salida).toHaveCount(0);
    await expect(fila(page, 'Restaurantes').locator('[data-hallazgo]')).toBeVisible();
    await abrir(page, `/presupuesto/asignar/${id}`);
    await esperarMonto(
      page.locator('[data-resumen-asignar] [data-campo="asignado"] [data-centavos]'),
      12000,
    );
  });

  // Una suscripción sin programar (como CA-65.1 de FT-65): cobros de NETFLIX en 3 de los 4 períodos cerrados, con hoy el 25/05/2027.
  const ingreso = (hoy: string): Op => ({ op: 'OP-21', monto: 10, hoy });
  const cobro = (fecha: string): Op[] => [
    {
      op: 'OP-35',
      etiqueta: `netflix-${fecha}`,
      cuenta: 'T',
      monto: 15.49,
      comercio: 'NETFLIX',
      recibido: `${fecha}T10:00`,
      fecha,
      hoy: fecha,
    },
    {
      op: 'OP-37',
      etiqueta: `netflix-${fecha}`,
      categoria: 'Streaming',
      aprobado: `${fecha}T12:00`,
      hoy: fecha,
    },
  ];
  async function sembrarSuscripcion(): Promise<void> {
    fijarRelojServidor('2027-05-25T10:00:00-06:00');
    const escenario: Escenario = {
      id: 'SEM-REP-HALLAZGOS-SUSCRIPCION',
      titulo: 'Semilla de FT-67 con una suscripción sin programar',
      refs: [],
      hoy: '2027-01-25',
      estadoInicial: [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
        { op: 'OP-07', categoria: 'Streaming' },
        { op: 'OP-21', monto: 1000 },
        ...cobro('2027-02-17'),
        ingreso('2027-02-22'),
        ...cobro('2027-03-17'),
        ingreso('2027-03-22'),
        ingreso('2027-04-22'),
        ...cobro('2027-05-18'),
        ingreso('2027-05-22'),
      ],
      pasos: [],
    };
    await sembrar(escenario, '2027-01-25');
  }
  const suscripcion = (page: Page) => page.locator('[data-hallazgo-fila="comercio:netflix"]');
  const netflix = (page: Page) => page.locator('[data-programada]').filter({ hasText: 'NETFLIX' });

  test('PRU-E2E-REP-236 [FT-67] el hallazgo de una suscripción sin programar trae «Programarla»; al tocarla se crea la programada y queda «Deshacer»', async ({
    page,
  }) => {
    await sembrarSuscripcion();
    await abrir(page, '/reportes/hallazgos');
    const h = suscripcion(page);
    await expect(h).toContainText(t.suscripciones.sinProgramar('NETFLIX', '$15.49', '$185.88'));
    await h.getByRole('button', { name: t.suscripciones.programarla, exact: true }).click();
    await expect(h.locator('[data-suscripciones-hecho]')).toContainText(
      t.suscripciones.programada('NETFLIX', '$15.49'),
    );
    await abrir(page, '/programadas');
    await expect(netflix(page)).toHaveCount(1);
  });

  test('PRU-E2E-REP-237 [FT-67, CA-67.3] «Deshacer» tras «Programarla» elimina la programada y el hallazgo de la suscripción reaparece', async ({
    page,
  }) => {
    await sembrarSuscripcion();
    await abrir(page, '/reportes/hallazgos');
    const h = suscripcion(page);
    await h.getByRole('button', { name: t.suscripciones.programarla, exact: true }).click();
    const hecho = h.locator('[data-suscripciones-hecho]');
    await expect(hecho).toBeVisible();
    await expect(h.locator('[data-hallazgo-suscripcion]')).toBeHidden();
    await hecho.getByRole('button', { name: ti.deshacer, exact: true }).click();
    await expect(hecho).toHaveCount(0);
    await expect(h.locator('[data-hallazgo-suscripcion]')).toBeVisible();
    await abrir(page, '/programadas');
    await expect(netflix(page)).toHaveCount(0);
  });
});
