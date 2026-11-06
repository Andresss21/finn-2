// FT-42 Registro automático y puesta al día (06 FT-42; 04 §10.1, BE-50; 05 §6.6; 07 §17: un flujo es una E2E). La ficha no tiene pantalla
// propia: el resultado se ve en Actividad. El estado sale de operaciones reales de 01 §8 (DP-17) con el reloj del servidor fijo (DP-04):
// una programada automática de Netflix que vence hoy y que la tarea diaria todavía no registró. Los números los pone el motor (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-20';
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Streaming' },
  { op: 'OP-21', monto: 500 },
  {
    op: 'OP-42',
    etiqueta: 'Netflix',
    cuenta: 'T',
    comercio: 'Netflix',
    monto: 15.49,
    categoria: 'Streaming',
    primeraFecha: HOY,
    automatico: true,
  },
];

const netflix = (page: Page) =>
  page.locator('[data-fila-transaccion]').filter({ hasText: 'Netflix' });

/** Recarga `/actividad` hasta que la puesta al día (que corre después de pintar, BE-50) deja la transacción a la vista. */
async function netflixEnActividad(page: Page): Promise<number> {
  await page.goto('/actividad');
  await esperarContenido(page);
  return netflix(page).count();
}

test.describe('PRU-E2E-PROG registro automático', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PROG-140 [CA-42.5] al abrir la app el primer día sin tarea diaria, la página se pinta y la puesta al día registra lo pendiente; la siguiente visita ya lo muestra y otra pestaña no lo duplica', async ({
    page,
    context,
  }) => {
    fijarRelojServidor(`${HOY}T10:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-PROG-42',
      titulo: 'Semilla de FT-42',
      refs: [],
      hoy: HOY,
      estadoInicial: ESTADO,
      pasos: [],
    };
    await sembrar(escenario, HOY);

    // La primera página se pinta sin esperar a la puesta al día
    await page.goto('/inicio');
    await esperarContenido(page);

    // La navegación siguiente ya muestra la transacción registrada sola, una vez
    await expect.poll(() => netflixEnActividad(page)).toBe(1);

    // Una segunda pestaña en los minutos siguientes no la vuelve a lanzar: sigue siendo una sola
    const otra = await context.newPage();
    expect(await netflixEnActividad(otra)).toBe(1);
    await otra.goto('/inicio');
    await esperarContenido(otra);
    expect(await netflixEnActividad(otra)).toBe(1);
  });
});
