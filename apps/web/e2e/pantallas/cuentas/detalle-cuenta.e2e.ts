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
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 10,
          categoria: 'Super',
          fecha: '2027-02-10',
          hoy: '2027-02-10',
        },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 20,
          categoria: 'Super',
          fecha: '2027-03-05',
          hoy: '2027-03-05',
        },
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
    const selector = page.locator('[data-selector-periodo="cerrado"]');
    // El siguiente es el período activo: su enlace no lleva `?periodo=` (05 §3.4)
    await expect(selector.getByRole('link', { name: 'Período siguiente' })).toHaveAttribute(
      'href',
      /\/cuentas\/[0-9a-f-]{36}$/,
    );
    await expect(selector.getByRole('link', { name: 'Ir al período actual' })).toBeVisible();
    // El período siguiente, pedido por su inicio, trae solo el gasto del 5 mar
    await page.goto(`${page.url().split('?')[0] ?? ''}?periodo=2027-02-21`);
    await esperarContenido(page);
    await expect(movimientos(page)).toHaveCount(1);
  });

  test('PRU-E2E-CTA-114 [CA-52.5] con 120 movimientos cada página sigue el saldo corrido de la anterior y el más reciente es el saldo de la cuenta', async ({
    page,
  }) => {
    test.slow();
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

  test('PRU-E2E-CTA-115 [AV-07] el detalle de una tarjeta con deuda de $18.75 y límite de $2,500.00 muestra la deuda, "Te falta reservar" por $18.75 y su ciclo', async ({
    page,
  }) => {
    await sembrarOps(
      [{ op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta', saldo: 18.75, limite: 2500 }],
      '2027-02-05',
    );
    await page.goto('/cuentas');
    await esperarContenido(page);
    await page.getByRole('link', { name: 'Ver detalle de Visa Oro' }).click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
    await esperarContenido(page);
    const bloque = page.locator('[data-bloque="tarjeta"]');
    await expect(bloque).toContainText('Te falta reservar');
    await esperarMonto(bloque.locator('[data-centavos]').first(), 1875);
    await expect(bloque).toContainText('Ciclo de facturación');
    await expect(page.locator('[data-bloque="prestamo"], [data-bloque="inversion"]')).toHaveCount(
      0,
    );
  });

  test('PRU-E2E-CTA-116 el detalle de una inversión muestra su valor de $3,000.00 y sus aportes', async ({
    page,
  }) => {
    await sembrarOps(
      [{ op: 'OP-01', cuenta: 'Inversión', tipo: 'inversion', saldo: 3000 }],
      '2027-02-05',
    );
    await page.goto('/cuentas');
    await esperarContenido(page);
    await page.locator('[data-grupo="Inversiones"] a').first().click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
    await esperarContenido(page);
    const cabecera = page.locator('[data-identidad="inversion"]');
    await esperarMonto(cabecera.locator('dd [data-centavos]').first(), 300000);
    await expect(page.locator('[data-bloque="inversion"]')).toContainText('Aportes');
  });

  test('PRU-E2E-CTA-261 [Q-detalleCuenta] el detalle de un préstamo muestra la próxima cuota con Pagar, las condiciones con Editar, con controles de 44 px', async ({
    page,
  }) => {
    await sembrarOps(
      [
        {
          op: 'OP-01',
          cuenta: 'Préstamo',
          tipo: 'prestamo',
          saldo: 10000,
          prestamo: {
            contraparte: 'Banco',
            montoOriginal: 10000,
            cuota: 350,
            plazoCuotas: 36,
            cuotasPagadas: 0,
          },
        },
      ],
      '2027-02-05',
    );
    await page.goto('/cuentas');
    await esperarContenido(page);
    await page.locator('[data-grupo="Préstamos"] a').first().click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
    await esperarContenido(page);
    const proxima = page.locator('[data-bloque="proxima-cuota"]');
    // Sin modelo de cálculo no hay tabla: la tarjeta dice la cuota pactada y no inventa «n de N» (PF-3)
    await expect(proxima).toContainText('Cuota pactada');
    await esperarMonto(proxima.locator('[data-centavos]').first(), 35000);
    const pagar = await proxima.getByRole('link', { name: 'Pagar' }).boundingBox();
    expect(pagar?.height ?? 0).toBeGreaterThanOrEqual(44);
    const editar = await page
      .locator('[data-bloque="prestamo"]')
      .getByRole('link', { name: 'Editar' })
      .boundingBox();
    expect(editar?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('PRU-E2E-CTA-260 [Q-detalleCuenta] el detalle de una cuenta de efectivo va en dos columnas en computadora y en una en teléfono, con sus botones de 44 px y «Más acciones» con Editar, Ordenar y los bloqueos con su motivo', async ({
    page,
  }) => {
    await sembrarOps(
      [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 100, apertura: '2027-02-05' }],
      '2027-02-10',
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await abrirDetalle(page);
    const cabecera = await page.locator('main header[data-identidad]').boundingBox();
    const lista = await page.locator('[data-movimientos]').boundingBox();
    expect((cabecera?.x ?? 0) + (cabecera?.width ?? 0)).toBeLessThanOrEqual(lista?.x ?? 0);
    await page.getByRole('button', { name: 'Más acciones' }).click();
    await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Ordenar cuentas' })).toBeVisible();
    await expect(page.getByRole('menu')).toContainText('su saldo debe ser $0.00');
    await page.keyboard.press('Escape');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await esperarContenido(page);
    const arriba = await page.locator('main header[data-identidad]').boundingBox();
    const abajo = await page.locator('[data-movimientos]').boundingBox();
    expect(arriba?.y ?? 0).toBeLessThan(abajo?.y ?? 0);
    expect(Math.abs((arriba?.x ?? 0) - (abajo?.x ?? 1))).toBeLessThan(2);
    for (const nombre of ['Verificar saldo', 'Registrar']) {
      const caja = await page.getByRole('link', { name: nombre, exact: true }).boundingBox();
      expect(caja?.height ?? 0, nombre).toBeGreaterThanOrEqual(44);
    }
  });
});
