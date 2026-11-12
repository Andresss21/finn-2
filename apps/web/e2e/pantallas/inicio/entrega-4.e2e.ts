// Inicio en la entrega 4 (TA-569; CH-240 D-3, D-7 y E5-15; 06 CA-06.1, CA-06.2, CA-08.11). Cada prueba parte de una base sembrada con
// operaciones reales (DP-17) y con el reloj del servidor fijo (DP-04); los montos los pone el motor (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as t } from '../../../src/textos/inicio.ts';
import { inicioEntrega4 as e4 } from '../../../src/textos/inicio-entrega-4.ts';
import { notificaciones as tn } from '../../../src/textos/notificaciones.ts';
import { primerosPasos as p } from '../../../src/textos/primeros-pasos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-05';
// A.7 hasta el paso 3 de ESC-03: ingreso de $1,000.00, Super $600.00 en P1 y Salidas $300.00 en P2; Gas y Mascota sin fondos.
const A7: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-18', categoria: 'Mascota', monto: 50 },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 600, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Salidas', monto: 300, periodo: 'P2' },
];

async function sembrarOps(ops: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  await sembrar(
    { id: 'SEM-INI-E4', titulo: 'Semilla de TA-569', refs: [], hoy: HOY, estadoInicial: ops, pasos: [] },
    HOY,
  );
}

async function abrir(page: Page): Promise<void> {
  await page.goto('/');
  await esperarContenido(page);
}

const billete = (page: Page) => page.locator('[data-resumen-lpa="billete"]');

test.describe('PRU-E2E-INICIO entrega 4', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-INICIO-701 [CA-E4-9, CA-E4-10] «Asignar $X» del billete llega a /presupuesto?filtro=sin-fondos sin abrir una hoja; sin categorías sin fondos, a /presupuesto', async ({
    page,
  }) => {
    await sembrarOps(A7);
    await abrir(page);
    await billete(page)
      .getByRole('link', { name: t.asignar('$100.00') })
      .click();
    await expect(page).toHaveURL(/\/presupuesto\?filtro=sin-fondos$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await sembrarOps(A7.filter((o) => o.op !== 'OP-18'));
    await abrir(page);
    await billete(page)
      .getByRole('link', { name: t.asignar('$100.00') })
      .click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-702 [CA-E4-11, CA-E4-13] con Listo para asignar negativo, «Quitar $X de una categoría» llega a Presupuesto; sin cuentas, «Primeros pasos · 0 de 3»', async ({
    page,
  }) => {
    await sembrarOps([...A7, { op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1' }]);
    await abrir(page);
    await billete(page)
      .getByRole('link', { name: t.quitar('$100.00') })
      .click();
    await expect(page).toHaveURL(/\/presupuesto$/);

    await sembrarOps([]);
    await abrir(page);
    await expect(page.getByRole('heading', { name: p.titulo })).toBeVisible();
    await expect(page.getByText(p.progreso(0), { exact: true })).toBeVisible();
    await expect(page.getByText(p.ocultar)).toHaveCount(0);
    await expect(page.getByText(e4.notaSinCuentas)).toBeVisible();
  });

  test('PRU-E2E-INICIO-703 [CA-E5-18] con el permiso sin decidir la tarjeta está entre el billete y «Necesita tu atención»; «Ahora no» la quita y no vuelve al recargar; la app no pidió el permiso', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __pedidos: number };
      w.__pedidos = 0;
      const original = Notification.requestPermission.bind(Notification);
      Notification.requestPermission = (...args) => {
        w.__pedidos += 1;
        return original(...args);
      };
    });
    // Con un sobregiro, la lista «Necesita tu atención» existe y la tarjeta va antes.
    await sembrarOps([...A7, { op: 'OP-20', cuenta: 'Ahorro', monto: 700, categoria: 'Gas' }]);
    await abrir(page);
    const tarjeta = page.getByRole('region', { name: e4.tarjetaNotificaciones.titulo });
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta).toContainText(e4.tarjetaNotificaciones.ayuda);
    const yTarjeta = (await tarjeta.boundingBox())?.y ?? 0;
    const yBillete = (await billete(page).boundingBox())?.y ?? 0;
    const yAtencion = (await page.getByRole('heading', { name: t.atencion }).boundingBox())?.y ?? 0;
    expect(yTarjeta).toBeGreaterThan(yBillete);
    expect(yTarjeta).toBeLessThan(yAtencion);
    expect(await page.evaluate(() => (window as unknown as { __pedidos: number }).__pedidos)).toBe(0);

    await tarjeta.getByRole('button', { name: tn.descartar }).click();
    await expect(tarjeta).toHaveCount(0);
    await page.reload();
    await esperarContenido(page);
    await expect(page.getByRole('region', { name: e4.tarjetaNotificaciones.titulo })).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __pedidos: number }).__pedidos)).toBe(0);
  });
});
