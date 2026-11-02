// FT-17 Metas (06 FT-17; 05 §2.3 y §7; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las operaciones
// reales de un escenario de 01 §8 (DP-17), con el reloj del servidor fijo en el período que dice el CA (DP-04), y abre la
// pantalla como la persona. Los números los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3). El
// «pide» de una meta lo dibujan `/metas` y el detalle; la fila de Presupuesto muestra solo lo que falta, por su indicador.
// AV-17 en Inicio es de FT-08 (`pruebas/pendientes-e2e.json`): acá se prueba en `/metas`.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-35 hasta el paso 1 (hoy 10 feb): Gas con meta de $200.00 «rellenar hasta» y Fondo con $200.00 «acumular»; Gas gastó $120.00.
const ESC35_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-07', categoria: 'Fondo' },
  { op: 'OP-18', categoria: 'Gas', monto: 200, modo: 'rellenar_hasta' },
  { op: 'OP-18', categoria: 'Fondo', monto: 200, modo: 'acumular' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Fondo', monto: 200, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 120, categoria: 'Gas' },
];
// ESC-36 hasta el paso 1 (hoy 10 feb): meta semanal de $50.00 «acumular» con $221.43 asignados en P1.
const ESC36_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Semanal' },
  { op: 'OP-18', categoria: 'Semanal', monto: 50, tipo: 'semanal', modo: 'acumular' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Semanal', monto: 221.43, periodo: 'P1' },
];
// ESC-37 hasta el paso 1 (hoy 25 ene 2027): meta anual de $1,200.00 con $92.31 asignados en P1.
const ESC37_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Viaje' },
  { op: 'OP-18', categoria: 'Viaje', monto: 1200, tipo: 'anual' },
  { op: 'OP-21', monto: 2000 },
  { op: 'OP-14', categoria: 'Viaje', monto: 92.31, periodo: 'P1' },
];
// ESC-37 hasta el paso 4: el historial de P2 y de P13 (hoy 21 ene 2028) con $600.00 gastados de Viaje.
const ESC37_PASO4: Op[] = [
  ...ESC37_PASO1,
  { op: 'OP-21', monto: 3000, fecha: '2027-02-21', hoy: '2027-02-21' },
  { op: 'OP-14', categoria: 'Viaje', monto: 1007.69, periodo: 'P2', hoy: '2027-02-21' },
  { op: 'OP-14', categoria: 'Viaje', monto: 100, hoy: '2028-01-21' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 600, categoria: 'Viaje', hoy: '2028-01-21' },
];
// ESC-38 rama 3b hasta el paso 4b: meta de $600.00 en Laptop para el 15 may 2027, con $400.00 asignados.
const ESC38_PASO4B: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Laptop' },
  { op: 'OP-18', categoria: 'Laptop', monto: 600, tipo: 'para_fecha', fecha: '2027-05-15' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Laptop', monto: 150, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Laptop', monto: 150, hoy: '2027-02-21' },
  { op: 'OP-14', categoria: 'Laptop', monto: 100, hoy: '2027-04-21' },
];

/** Siembra las operaciones con `hoy` y deja el reloj del servidor en `hoyServidor` (por defecto, el mismo día). */
async function sembrarOps(ops: Op[], hoy: string, hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-META',
    titulo: 'Semilla de FT-17',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
const meta = (page: Page, categoria: string) =>
  page.locator('[data-meta]').filter({ has: page.getByRole('heading', { name: categoria }) });
const pedido = (page: Page, categoria: string) =>
  meta(page, categoria).locator('[data-pedido] [data-centavos]');
const filaPresupuesto = (page: Page, categoria: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(categoria, { exact: true }) });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();

test.describe('PRU-E2E-META pantalla de metas', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-META-101 [CA-17.1, ESC-35] con el paso 2 de ESC-35 Gas (rellenar hasta) pide $120.00 y Fondo (acumular) pide $200.00, y las dos filas de Presupuesto dicen que falta para la meta', async ({
    page,
  }) => {
    await sembrarOps(ESC35_PASO1, '2027-02-10', '2027-02-21');
    await abrir(page, '/metas');
    await expect(page.locator('[data-meta]')).toHaveCount(2);
    await esperarMonto(pedido(page, 'Gas'), 12000);
    await esperarMonto(pedido(page, 'Fondo'), 20000);
    await expect(meta(page, 'Gas')).toContainText('Rellenar hasta');
    await expect(meta(page, 'Fondo')).toContainText('Acumular');

    await abrir(page, '/presupuesto');
    await expect(filaPresupuesto(page, 'Gas').locator('[data-estado="advertencia"]')).toHaveText(
      'Falta para la meta',
    );
    await expect(filaPresupuesto(page, 'Fondo').locator('[data-estado="advertencia"]')).toHaveText(
      'Falta para la meta',
    );
  });

  test('PRU-E2E-META-102 [CA-17.7, ESC-35] cuando pasa el período con las metas de ESC-35 ninguna asignación cambia sola: Gas sigue con $80.00, Fondo con $200.00 y Listo para asignar con $600.00', async ({
    page,
  }) => {
    await sembrarOps(ESC35_PASO1, '2027-02-10', '2027-02-21');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 60000);
    await esperarMonto(filaPresupuesto(page, 'Gas').locator('[data-centavos]').first(), 8000);
    await esperarMonto(filaPresupuesto(page, 'Fondo').locator('[data-centavos]').first(), 20000);
  });

  test('PRU-E2E-META-103 [CA-17.2, ESC-36] la meta semanal de $50.00 tiene monto del período $221.43 en P1 (31 días), $200.00 en P2 (28) y $214.29 en P4 (30)', async ({
    page,
  }) => {
    await sembrarOps(ESC36_PASO1, '2027-02-10');
    const monto = meta(page, 'Semanal').locator('[data-monto-periodo] [data-centavos]');
    for (const [hoy, centavos] of [
      ['2027-02-10', 22143],
      ['2027-03-01', 20000],
      ['2027-04-25', 21429],
    ] as const) {
      fijarRelojServidor(`${hoy}T10:00:00-06:00`);
      await abrir(page, '/metas');
      await esperarMonto(monto, centavos);
    }
  });

  test('PRU-E2E-META-104 [CA-17.3, ESC-37] con la meta anual de ESC-37 en P1 pide $92.31 y, en el período siguiente a la renovación con Base $600.00, pide $50.00', async ({
    page,
  }) => {
    await sembrarOps(ESC37_PASO1, '2027-01-25');
    await abrir(page, '/metas');
    await esperarMonto(pedido(page, 'Viaje'), 9231);
    await expect(meta(page, 'Viaje')).toContainText('Anual');

    await sembrarOps(ESC37_PASO4, '2027-01-25', '2028-02-21');
    await abrir(page, '/metas');
    await esperarMonto(pedido(page, 'Viaje'), 5000);
  });

  test('PRU-E2E-META-105 [CA-17.4, ESC-38, AV-17] la meta de ESC-38 sin cumplirse en P5 muestra AV-17 con las dos acciones y su pedido de $200.00', async ({
    page,
  }) => {
    await sembrarOps(ESC38_PASO4B, '2027-01-25', '2027-05-21');
    await abrir(page, '/metas');
    const laptop = meta(page, 'Laptop');
    await expect(laptop.locator('[data-estado="advertencia"]').first()).toContainText(
      'Meta vencida',
    );
    await expect(laptop.getByRole('link', { name: 'Extender la fecha' })).toBeVisible();
    await expect(laptop.getByRole('link', { name: 'Ajustar el monto' })).toBeVisible();
    await esperarMonto(pedido(page, 'Laptop'), 20000);
  });

  test('PRU-E2E-META-106 sin metas la pantalla lo dice y ofrece crear una con una categoría sin meta', async ({
    page,
  }) => {
    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-07', categoria: 'Viaje' },
      ],
      '2027-02-10',
    );
    await abrir(page, '/metas');
    await expect(page.getByText('Todavía no tenés metas')).toBeVisible();
    await page.getByRole('link', { name: 'Crear una meta' }).click();
    await expect(page).toHaveURL(/\/metas\/nueva\?categoria=[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { name: 'Nueva meta', level: 1 })).toBeVisible();
  });
});
