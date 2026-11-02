// FT-52 Detalle de cuenta (06 §2.9; 05 §2.7; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17) y del reloj del servidor fijo (DP-04), entra por `/cuentas` como la persona y abre el detalle. Los
// números los pone el motor: la prueba solo comprueba que la pantalla los dibuja y que el saldo corrido es coherente (PF-3).
// CA-52.2 (conciliación con ESC-47) la completa FT-43, que trae OP-45 a OP-47: queda en `pruebas/pendientes-e2e.json`.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CTA-DETALLE',
    titulo: 'Semilla de FT-52',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

/** Entra por Cuentas y abre el detalle de la primera cuenta de efectivo, como lo haría la persona. */
async function abrirDetalle(page: Page): Promise<void> {
  await page.goto('/cuentas');
  await esperarContenido(page);
  await page.locator('[data-grupo="Efectivo"] a').first().click();
  await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
  await esperarContenido(page);
}

const movimientos = (page: Page) => page.locator('[data-movimiento]');

/** El efecto y el saldo después de cada fila visible, en el orden de la pantalla (del más reciente al más antiguo). */
async function filas(page: Page): Promise<{ efecto: number; saldo: number }[]> {
  return movimientos(page).evaluateAll((lis) =>
    lis.map((li) => {
      const montos = li.querySelectorAll('p [data-centavos]');
      return {
        efecto: Number(montos[0]?.getAttribute('data-centavos')),
        saldo: Number(montos[1]?.getAttribute('data-centavos')),
      };
    }),
  );
}

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-113 [CA-52.3] con el período cerrado elegido la cuenta muestra solo sus movimientos y los enlaces a los períodos vecinos', async ({
    page,
  }) => {
    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 10, categoria: 'Super', fecha: '2027-02-10', hoy: '2027-02-10' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Super', fecha: '2027-03-05', hoy: '2027-03-05' },
      ],
      '2027-03-10',
    );
    await abrirDetalle(page);
    // Sin período elegido: todo el historial y el selector del período activo
    await expect(movimientos(page)).toHaveCount(3);
    await page.getByRole('link', { name: 'Período anterior' }).click();
    await expect(page).toHaveURL(/\?periodo=2027-01-21$/);
    await esperarContenido(page);
    // El período cerrado trae el saldo inicial (5 feb) y el gasto del 10 feb, no el del 5 mar
    await expect(movimientos(page)).toHaveCount(2);
    const vecinos = page.locator('[data-selector-periodo="elegido"]');
    await expect(vecinos.getByRole('link', { name: 'Período siguiente' })).toHaveAttribute(
      'href',
      /\?periodo=2027-02-21$/,
    );
    await expect(vecinos.getByRole('link', { name: 'Ir al período actual' })).toBeVisible();
    await vecinos.getByRole('link', { name: 'Período siguiente' }).click();
    await expect(page).toHaveURL(/\?periodo=2027-02-21$/);
    await expect(movimientos(page)).toHaveCount(1);
  });

  test('PRU-E2E-CTA-114 [CA-52.5] con 120 movimientos cada página sigue el saldo corrido de la anterior y el más reciente es el saldo de la cuenta', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const gastos: Op[] = Array.from({ length: 120 }, (_, n) => ({
      op: 'OP-20',
      cuenta: 'Ahorro',
      monto: 1 + (n % 7),
      categoria: 'Super',
      fecha: '2027-02-10',
    }));
    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
        { op: 'OP-07', categoria: 'Super' },
        ...gastos,
      ],
      '2027-02-10',
    );
    await abrirDetalle(page);
    const saldo = page.locator('main header [data-centavos]').first();
    const saldoDeLaCuenta = Number(await saldo.getAttribute('data-centavos'));

    const paginas: { efecto: number; saldo: number }[][] = [];
    for (;;) {
      await expect(movimientos(page).first()).toBeVisible();
      paginas.push(await filas(page));
      const mas = page.getByRole('link', { name: 'Movimientos anteriores' });
      if ((await mas.count()) === 0) break;
      await mas.click();
      await esperarContenido(page);
    }
    expect(paginas.map((p) => p.length)).toEqual([50, 50, 21]);
    const todas = paginas.flat();
    // El más reciente es el saldo de la cuenta y cada fila es la siguiente (más antigua) más su efecto
    expect(todas[0]?.saldo).toBe(saldoDeLaCuenta);
    todas.forEach((m, n) => {
      const anterior = todas[n + 1];
      expect(anterior === undefined ? 0 : anterior.saldo).toBe(m.saldo - m.efecto);
    });
    await esperarMonto(saldo, saldoDeLaCuenta);
  });
});
