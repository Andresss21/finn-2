// FT-25 Detalle de una transacción (06 FT-25; 05 §2.6; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17), con el reloj del servidor fijo (DP-04), y abre el detalle como la persona, desde la lista de Actividad.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as b } from '../../../src/textos/bandeja.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import { transaccion as t } from '../../../src/textos/transaccion.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';

const DIA_20 = '2027-02-20';

test.describe('PRU-E2E-TX detalle de una transacción', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-410 [CA-25.8] RUTA-/actividad/[transaccionId] una transacción aprobada desde un SMS muestra el texto original del SMS y «Volver» regresa a la lista', async ({
    page,
  }) => {
    fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
    // Un SMS de $30.00 de «Super» a las 7 pm; la transacción nace al aprobarlo desde la Bandeja
    const escenario: Escenario = {
      id: 'SEM-ACT-25',
      titulo: 'Semilla de FT-25, detalle',
      refs: [],
      hoy: DIA_20,
      estadoInicial: [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
        {
          op: 'OP-35',
          etiqueta: 'sms',
          cuenta: 'T',
          monto: 30,
          comercio: 'Super',
          recibido: `${DIA_20}T19:00`,
          fecha: DIA_20,
        },
      ],
      pasos: [],
    };
    await sembrar(escenario, DIA_20);

    await page.goto('/bandeja');
    await esperarContenido(page);
    await page.locator('[data-movimiento]').getByRole('link').click();
    await page
      .getByRole('radiogroup', { name: g.categoriaDeParte('1') })
      .getByRole('radio', { name: 'Super' })
      .click();
    await page.getByRole('button', { name: b.revisar.aprobar }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();

    await page.goto('/actividad');
    await esperarContenido(page);
    await page.locator('[data-fila-transaccion]').filter({ hasText: 'Super' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Super' })).toBeVisible();
    await expect(page.getByRole('heading', { name: t.mensajeOriginal })).toBeVisible();
    await expect(page.locator('blockquote')).toContainText('compra por USD 30.00');

    await page.getByRole('link', { name: t.volver }).click();
    await expect(page).toHaveURL(/\/actividad(\?.*)?$/);
  });
});
