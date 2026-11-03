// FT-25 Detalle de una transacción (06 FT-25; 05 §2.6; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17), con el reloj del servidor fijo (DP-04), y abre el detalle como la persona, desde la lista de Actividad.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { transaccion as t } from '../../../src/textos/transaccion.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';

const HOY = '2027-02-21';

test.describe('PRU-E2E-TX detalle de una transacción', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-410 [CA-25.8] RUTA-/actividad/[transaccionId] una transacción aprobada desde un SMS muestra el texto original del SMS y «Volver» regresa a la lista', async ({
    page,
  }) => {
    fijarRelojServidor(`${HOY}T10:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-ACT-25',
      titulo: 'Semilla de FT-25, detalle',
      refs: [],
      hoy: '2027-02-20',
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
          recibido: '2027-02-20T19:00',
          fecha: '2027-02-20',
        },
        { op: 'OP-37', etiqueta: 'sms', categoria: 'Super', aprobado: '2027-02-21T08:00' },
      ],
      pasos: [],
    };
    await sembrar(escenario, HOY);

    await page.goto('/actividad');
    await esperarContenido(page);
    await page.locator('[data-fila-transaccion]').filter({ hasText: 'Super' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Super' })).toBeVisible();
    await expect(page.getByRole('heading', { name: t.mensajeOriginal })).toBeVisible();
    await expect(page.locator('blockquote')).toContainText('compra por USD 30.00');
    await expect(page.locator('blockquote')).toContainText('Super');

    await page.getByRole('link', { name: t.volver }).click();
    await expect(page).toHaveURL(/\/actividad(\?.*)?$/);
  });
});
