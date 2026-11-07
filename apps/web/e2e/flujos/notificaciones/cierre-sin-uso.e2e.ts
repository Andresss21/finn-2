// FT-71 Push de programadas, cierre, metas, tarjetas y sistema (06 FT-71; 04 §10.2 paso 3, BE-51; 07 §17: un flujo es una E2E).
// Completa CA-16.5 (pendiente de punta a punta, DT-27): la persona no usa la app durante tres períodos; cuando corre la tarea
// diaria (`GET /api/tareas/diaria`, como Vercel Cron, con el reloj del servidor ya movido, DP-04) el centro de notificaciones
// (FT-69) muestra una sola de cierre, la del último período. Los anteriores quedan en `eventos_sistema`; el envío real del push
// lo prueba PRU-INT-NOTIF-106 (INT).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { correrTareaDiaria } from '../../ayudas/tarea-diaria.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';

const SEMBRADO = '2027-02-10';
// Tres períodos completos sin abrir la app: 21/02–20/03, 21/03–20/04 y 21/04–20/05; hoy es el 25/05.
const DESPUES = '2027-05-25';
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
];

test.describe('PRU-E2E-NOTIF cierre del período', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-NOTIF-122 [CA-16.5] con la app sin usar durante 3 períodos, la tarea diaria deja una sola notificación de cierre, la del último período, en el centro', async ({
    page,
    request,
  }) => {
    fijarRelojServidor(`${SEMBRADO}T10:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-NOTIF-71',
      titulo: 'Semilla de FT-71',
      refs: [],
      hoy: SEMBRADO,
      estadoInicial: ESTADO,
      pasos: [],
    };
    await sembrar(escenario, SEMBRADO);

    fijarRelojServidor(`${DESPUES}T10:00:00-06:00`);
    await correrTareaDiaria(request);
    // Una segunda corrida el mismo día no suma otra (CA-71.2)
    await correrTareaDiaria(request);

    await page.goto('/notificaciones');
    await esperarContenido(page);
    const cierres = page.locator('[data-notificacion]').filter({ hasText: 'Cerró el período' });
    await expect(cierres).toHaveCount(1);
    await expect(cierres).toContainText('del 21/04 al 20/05');
  });
});
