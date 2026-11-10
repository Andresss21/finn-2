// FT-35 Revisar un SMS como devolución de una compra (CH-226, A12 y D8; 07 §17: un flujo es una E2E). Parte de una base sembrada con
// operaciones reales (DP-17) y del reloj del servidor fijo (DP-04): una compra en Super ya aprobada desde un SMS y un SMS nuevo de Super.
// La persona lo revisa como Devolución, elige la compra con la búsqueda de CP-3 y aprueba; el detalle de la compra lista el evento
// «Devuelto». Los números los pone el motor (PF-3). Los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { transaccion as tx } from '../../../src/textos/transaccion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';

const DIA_20 = '2027-02-20';
const sms = (etiqueta: string, monto: number, recibido: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio: 'Super',
  recibido: `${DIA_20}T${recibido}`,
  fecha: DIA_20,
});
// La compra de $30.00 en Super aprobada a las 9:30 y el SMS de $12.00 de las 3 pm
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
  sms('compra', 30, '09:00'),
  { op: 'OP-37', etiqueta: 'compra', categoria: 'Super', aprobado: `${DIA_20}T09:30` },
  sms('devolucion', 12, '15:00'),
];

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-490 [] (CH-226) un SMS revisado como devolución de una compra queda vinculado a ella en el detalle de la transacción', async ({
    page,
  }) => {
    fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-BAND-490',
      titulo: 'Semilla de la devolución por SMS',
      refs: [],
      hoy: DIA_20,
      estadoInicial: ESTADO,
      pasos: [],
    };
    await sembrar(escenario, DIA_20);
    await page.goto('/bandeja');
    await esperarContenido(page);
    await page.locator('[data-movimiento]').getByRole('link').first().click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    await esperarHidratacion(page);

    await page.getByRole('radio', { name: t.revisar.tipos.devolucion }).click();
    await expect(page.getByText(t.revisar.elegirCompra)).toBeVisible();
    await page.getByRole('searchbox', { name: t.revisar.buscarCompra }).fill('Super');
    const compra = page.locator('li button').filter({ hasText: 'Super' });
    await expect(compra).toContainText('$30.00');
    await compra.click();
    await expect(page.getByText(t.revisar.queda('$30.00'))).toBeVisible();
    await expect(page.locator('input[name="devueltas.0.monto"]')).toHaveValue('12.00');
    await page.getByRole('button', { name: /^Aprobar/ }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();

    // El detalle de la compra lista la devolución como evento
    await page.goto('/actividad');
    await esperarContenido(page);
    await page
      .locator('[data-fila-transaccion]')
      .filter({ hasText: 'Super' })
      .filter({ hasText: '$30.00' })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: tx.eventos })).toBeVisible();
    const evento = page.locator('li').filter({ hasText: tx.devuelto });
    await expect(evento).toHaveCount(1);
    await esperarMonto(evento.locator('[data-centavos]').first(), 1200);
  });
});
