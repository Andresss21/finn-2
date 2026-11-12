// CH-240 (entrega 4, E3-10 a E3-14, E4-1, E4-3, E4-4): Revisar movimiento en dos columnas, sin «Después de aprobar», con el paso
// de «Revisá el impacto» solo cuando el servidor lo pide. Cada prueba parte de una base sembrada con operaciones reales y del reloj
// del servidor fijo (DP-04); los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
const sms = (etiqueta: string, comercio: string, monto: number, recibido: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${DIA_20}T${recibido}`,
  fecha: DIA_20,
});
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Supermercado', monto: 100, periodo: 'P1' },
];

async function preparar(estadoInicial: Op[], ahora = `${DIA_20}T20:00:00`): Promise<void> {
  fijarRelojServidor(`${ahora}-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-35',
    titulo: 'Semilla de FT-35 en la entrega 4',
    refs: [],
    hoy: DIA_20,
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
}

/** Abre la revisión del primer movimiento de la Bandeja. */
async function abrirRevision(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
  await page.locator('[data-movimiento]').getByRole('link').first().click();
  await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
  await esperarHidratacion(page);
}

test.describe('PRU-E2E-BAND revisar movimiento de la entrega 4', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-721 [CA-E4-5, CA-E4-21c] a 1440 px Revisar va en dos columnas, sin «Después de aprobar»; a 390 px una devolución no desborda y «Cambiar compra» se ve entero', async ({
    page,
    isMobile,
  }) => {
    await preparar([
      sms('compra', 'Super', 30, '09:00'),
      { op: 'OP-37', etiqueta: 'compra', categoria: 'Supermercado', aprobado: `${DIA_20}T09:30` },
      sms('devolucion', 'Super', 12, '15:00'),
    ]);
    if (!isMobile) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await abrirRevision(page);
      const izquierda = await page.locator('[data-columna="identifica"]').boundingBox();
      const derecha = await page.locator('[data-columna="campos"]').boundingBox();
      expect(izquierda?.x).toBeLessThan(derecha?.x ?? 0);
      expect(Math.abs((izquierda?.y ?? 0) - (derecha?.y ?? 99))).toBeLessThan(4);
      // La izquierda dice qué movimiento es (el SMS); la derecha tiene los campos
      await expect(page.locator('[data-columna="identifica"]')).toContainText('Super');
      await expect(
        page.locator('[data-columna="campos"]').getByLabel(t.revisar.monto),
      ).toBeVisible();
      await expect(page.getByText('Después de aprobar')).toHaveCount(0);
      return;
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await abrirRevision(page);
    await page.getByRole('radio', { name: t.revisar.tipos.devolucion }).click();
    await page.getByRole('searchbox', { name: t.revisar.buscarCompra }).fill('Super');
    await page.locator('li button').filter({ hasText: 'Super' }).click();
    const cambiar = page.getByRole('button', { name: t.revisar.cambiarCompra });
    await expect(cambiar).toBeVisible();
    await expect(cambiar).toBeInViewport({ ratio: 1 });
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde).toBeLessThanOrEqual(0);
    await expect(page.getByText('Después de aprobar')).toHaveCount(0);
  });

  test('PRU-E2E-BAND-722 [CA-E4-21b] aprobar un movimiento de un período cerrado pide el paso con AV-01 y confirma con la huella', async ({
    page,
  }) => {
    // Fecha en un período cerrado: aprobar se detiene en la confirmación de AV-01 (E4-1: el servidor lo pide)
    await preparar([sms('cerrado', 'Selectos', 30, '19:00')], '2027-02-21T08:00:00');
    await abrirRevision(page);
    await elegirOpcion(page, g.categoriaDeParte('1'), 'Supermercado');
    await page.getByRole('button', { name: /^Aprobar/ }).click();
    await expect(page.getByRole('heading', { name: t.revisar.revisarImpacto })).toBeVisible();
    await expect(page.getByText(g.avisoPeriodoCerrado)).toBeVisible();
    await page.getByRole('button', { name: g.confirmar }).click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('Selectos', '$30.00', 'T', 'Supermercado'),
    );
  });
});
