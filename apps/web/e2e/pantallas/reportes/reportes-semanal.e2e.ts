// FT-61 Gasto semanal (06 FT-61; 05 §2.10 y §7; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17), con el reloj del servidor fijo (DP-04), y abre `/reportes/gasto-semanal` como la persona. Los números
// los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3). El período es el de A.7, de 30 días: 21/04 al 20/05.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-05-15';

async function sembrarOps(ops: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-3',
    titulo: 'Semilla de FT-61',
    refs: [],
    hoy: HOY,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
const referencia = (page: Page, k: number) =>
  page.locator(`[data-fila="${k}"] [data-col="referencia"] [data-centavos]`);

// Supermercado de A.7: asignado $350.00 y gasto por semana de $92.40, $71.15, $88.60 y $35.00 (acumulado $287.15).
const SUPERMERCADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-21', monto: 2000, fecha: '2027-04-21', hoy: '2027-04-21' },
  { op: 'OP-14', categoria: 'Supermercado', monto: 350, periodo: 'P4' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 92.4, categoria: 'Supermercado', fecha: '2027-04-22' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 71.15, categoria: 'Supermercado', fecha: '2027-04-29' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 88.6, categoria: 'Supermercado', fecha: '2027-05-06' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 35, categoria: 'Supermercado', fecha: '2027-05-13' },
];

test.describe('PRU-E2E-REP gasto semanal', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-170 [CA-61.1, CA-61.4, CA-61.6] con Supermercado de A.7 hay 5 semanas con referencias $81.67, $81.66, $81.67, $81.67 y $23.33; la 5 figura futura, sin barra; y la semana en curso dice «43 % de la referencia» y «Vas $39.52 por debajo»', async ({
    page,
  }) => {
    await sembrarOps(SUPERMERCADO);
    await abrir(page, '/reportes/gasto-semanal');
    await expect(page.locator('[data-fila]')).toHaveCount(5);
    const esperadas = [8167, 8166, 8167, 8167, 2333];
    for (const [i, centavos] of esperadas.entries())
      await esperarMonto(referencia(page, i + 1), centavos);
    await expect(page.locator('[data-fila="5"] [data-col="semana"]')).toContainText('futura');
    await expect(page.locator('[data-grafico="barras"] [data-punto="5"] rect')).toHaveCount(1);
    await expect(page.locator('[data-porcentaje]')).toHaveText('43 % de la referencia');
    await expect(page.locator('[data-diferencia]')).toHaveText('Vas $39.52 por debajo');
    await esperarMonto(page.locator('[data-resumen] [data-centavos]').nth(2), 32667);
  });

  test('PRU-E2E-REP-171 [CA-61.2, CA-61.7] con Asignado −$20.00 todas las referencias son $0.00, se muestra el aviso y no el porcentaje', async ({
    page,
  }) => {
    await sembrarOps([
      ...SUPERMERCADO.slice(0, 3),
      { op: 'OP-07', categoria: 'Ajuste' },
      { op: 'OP-14', categoria: 'Ajuste', monto: -20, periodo: 'P4' },
    ]);
    await abrir(page, '/reportes/gasto-semanal');
    const ajuste = page.locator('[data-categoria]').filter({ hasText: 'Ajuste' });
    for (const k of [1, 2, 3, 4, 5])
      await esperarMonto(
        ajuste.locator(`[data-fila="${k}"] [data-col="referencia"] [data-centavos]`),
        0,
      );
    await expect(ajuste).toContainText('Lo asignado es negativo: la referencia queda en $0.00.');
    await expect(ajuste.locator('[data-porcentaje]')).toHaveCount(0);
  });

  test('PRU-E2E-REP-172 [CA-61.3] una categoría sin períodos anteriores dice «Categoría nueva» y sus semanas no traen comparación', async ({
    page,
  }) => {
    await sembrarOps(SUPERMERCADO);
    await abrir(page, '/reportes/gasto-semanal');
    const seccion = page.locator('[data-categoria]').first();
    await expect(seccion).toContainText('Categoría nueva');
    await expect(seccion.locator('[data-fila="1"] [data-col="anteriores"]')).toHaveText('—');
  });
});
