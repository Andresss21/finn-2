// FT-69 Centro de notificaciones (06 FT-69; 05 §2.9, §3.5; 07 §17: una pantalla o una navegación es una E2E). Cada prueba parte de
// una base sembrada con las operaciones reales de un escenario (DP-17) y con las notificaciones que el marco registraría
// (BE-38, 04 §11.1): ninguna operación las registra todavía, así que la semilla las agrega a la fuente. El reloj del servidor queda
// fijo (DP-04). Los números de la campana los pone el servidor: la prueba solo comprueba que el marco los dibuja (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { notificaciones as textos } from '../../../src/textos/notificaciones.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const t = textos.centro;
const HOY = '2027-02-10';

// Una cuenta, una categoría con asignación y un gasto: deja una transacción a la que apuntar y Presupuesto con datos.
const OPS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Gas' },
];

type Semilla = Parameters<typeof sembrar>[2];
const registro = (titulo: string, extra: Record<string, unknown> = {}) => ({
  aviso: 'AV-23',
  motivo: 'registro_automatico',
  titulo,
  cuerpo: 'Se registró solo.',
  ...extra,
});

async function sembrarNotificaciones(notificaciones: Semilla): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-NOTIF',
    titulo: 'Semilla de FT-69',
    refs: [],
    hoy: HOY,
    estadoInicial: OPS,
    pasos: [],
  };
  await sembrar(escenario, HOY, notificaciones);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** La campana de la barra (no la fila de la sección en la barra lateral). */
const campana = (page: Page, nombre: string) =>
  page.locator('[data-marco-barra]').getByRole('link', { name: nombre, exact: true });

const SIN_DESTINO = '7a1c1f0e-5b7e-4c53-9f0e-2d9a8b6c4d11';

test.describe('PRU-E2E-NOTIF', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-NOTIF-110 [CA-69.1] RUTA-/notificaciones con 3 notificaciones sin leer, al abrir cualquier pantalla la campana dice "Notificaciones, 3 sin leer" como nombre accesible', async ({
    page,
  }) => {
    await sembrarNotificaciones([registro('Uno'), registro('Dos'), registro('Tres')]);
    for (const ruta of ['/', '/presupuesto', '/cuentas', '/notificaciones']) {
      await abrir(page, ruta);
      await expect(campana(page, 'Notificaciones, 3 sin leer')).toBeVisible();
    }
  });

  test('PRU-E2E-NOTIF-111 [CA-69.2] RUTA-/notificaciones al tocar un registro_automatico abre /actividad/[transaccionId], queda leída, el parámetro desaparece sin agregar una entrada al historial y la campana baja a 2', async ({
    page,
  }) => {
    await sembrarNotificaciones([
      registro('Se registró Netflix', { destino: 'primera_transaccion' }),
      registro('Dos'),
      registro('Tres'),
    ]);
    await abrir(page, '/notificaciones');
    await expect(campana(page, 'Notificaciones, 3 sin leer')).toBeVisible();
    await page.getByRole('link', { name: /Se registró Netflix/ }).click();

    await expect(page).toHaveURL(/\/actividad\/[0-9a-f-]{36}$/);
    await expect(campana(page, 'Notificaciones, 2 sin leer')).toBeVisible();
    // Sin una entrada de más: un solo «atrás» vuelve al centro.
    await page.goBack();
    await expect(page).toHaveURL(/\/notificaciones$/);
    await esperarContenido(page);
    await expect(page.locator('[data-leida="si"]')).toHaveCount(1);
    await expect(page.locator('[data-leida="no"]')).toHaveCount(2);
  });

  test('PRU-E2E-NOTIF-112 [CA-69.3] RUTA-/notificaciones con una notificación de una transacción eliminada, el centro la muestra sin enlace y con "Esto ya no existe"', async ({
    page,
  }) => {
    await sembrarNotificaciones([
      registro('Cuota de Gimnasio registrada', {
        destino: { pantalla: 'transaccion', transaccionId: SIN_DESTINO },
      }),
      registro('Otra'),
    ]);
    await abrir(page, '/notificaciones');
    const fila = page.locator('[data-notificacion]').filter({ hasText: 'Cuota de Gimnasio' });
    await expect(fila).toBeVisible();
    await expect(fila.getByText(t.yaNoExiste)).toBeVisible();
    await expect(fila.getByRole('link')).toHaveCount(0);
    await expect(
      page.locator('[data-notificacion]').filter({ hasText: 'Otra' }).getByRole('link'),
    ).toHaveCount(1);
  });

  test('PRU-E2E-NOTIF-113 [CA-69.4] RUTA-/notificaciones con "Marcar todo como leído" la campana desaparece y ?no-leidas=1 queda vacío', async ({
    page,
  }) => {
    await sembrarNotificaciones([registro('Uno'), registro('Dos'), registro('Tres')]);
    await abrir(page, '/notificaciones?no-leidas=1');
    await expect(page.locator('[data-notificacion]')).toHaveCount(3);
    await page.getByRole('button', { name: t.marcarTodo }).click();

    await expect(campana(page, 'Notificaciones')).toBeVisible();
    await expect(campana(page, 'Notificaciones, 3 sin leer')).toHaveCount(0);
    await expect(page.locator('[data-notificacion]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: t.sinLeerVacioTitulo })).toBeVisible();
    await abrir(page, '/notificaciones?no-leidas=1');
    await expect(page.locator('[data-notificacion]')).toHaveCount(0);
    await abrir(page, '/notificaciones');
    await expect(page.locator('[data-notificacion]')).toHaveCount(3);
  });

  test('PRU-E2E-NOTIF-114 [CA-69.5] RUTA-/notificaciones desde Presupuesto la campana abre el panel sobre la pantalla con la URL /notificaciones, al cerrar vuelve sin recargarla, y abierta directamente es página completa', async ({
    page,
  }) => {
    await sembrarNotificaciones([registro('Uno'), registro('Dos')]);
    await abrir(page, '/presupuesto');
    await page.evaluate(() => {
      (window as unknown as { marcaDeDocumento: number }).marcaDeDocumento = 1;
    });
    await campana(page, 'Notificaciones, 2 sin leer').click();

    await expect(page).toHaveURL(/\/notificaciones$/);
    const panel = page.getByRole('dialog', { name: 'Notificaciones' });
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-notificacion]')).toHaveCount(2);
    await panel.getByRole('button', { name: 'Cerrar' }).click();

    await expect(page).toHaveURL(/\/presupuesto$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => (window as unknown as { marcaDeDocumento?: number }).marcaDeDocumento,
      ),
    ).toBe(1);

    await abrir(page, '/notificaciones');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Notificaciones' })).toBeVisible();
  });

  test('PRU-E2E-NOTIF-115 [CA-69.6] RUTA-/notificaciones con un destino que no valida con el contrato, al tocar la notificación se queda en el centro', async ({
    page,
  }) => {
    await sembrarNotificaciones([
      registro('Destino roto', { destino: { pantalla: 'inexistente' } }),
    ]);
    await abrir(page, '/notificaciones');
    await page.getByRole('link', { name: /Destino roto/ }).click();
    await esperarContenido(page);
    await expect(page).toHaveURL(/\/notificaciones$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Notificaciones' })).toBeVisible();
    await expect(page.locator('[data-notificacion]')).toHaveCount(1);
  });
});
