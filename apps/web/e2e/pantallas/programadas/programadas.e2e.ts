// FT-40 Administrar programadas, la lista (06 FT-40; 05 §2 y §7; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y abre la pantalla como la persona. Los números y las
// fechas los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3). Crear, editar y eliminar son de TA-468.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Streaming' },
  { op: 'OP-21', monto: 1000 },
];
const NETFLIX: Op = {
  op: 'OP-42',
  etiqueta: 'netflix',
  cuenta: 'Visa Oro',
  comercio: 'Netflix',
  monto: 15.49,
  categoria: 'Streaming',
  primeraFecha: '2027-02-17',
};

/** Siembra las operaciones con `hoy` y deja el reloj del servidor en `hoyServidor` (por defecto, el mismo día). */
async function sembrarOps(ops: Op[], hoy: string, hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PROG',
    titulo: 'Semilla de FT-40',
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

const fila = (page: Page, comercio: string) =>
  page.locator('[data-programada]').filter({ has: page.getByText(comercio, { exact: true }) });
const proximos = (page: Page) => page.locator('[data-seccion="proximos"] [data-proximo]');

test.describe('PRU-E2E-PROG pantalla de programadas', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PROG-110 [CA-40.5] RUTA-/programadas la mensual del 17 desactivada el 1 de junio y reactivada el 20 de septiembre no tiene atrasadas y su próxima es el 17 de octubre', async ({
    page,
  }) => {
    await sembrarOps(
      [...BASE, { ...NETFLIX, primeraFecha: '2027-06-17' }],
      '2027-05-25',
      '2027-06-01',
    );
    await abrir(page, '/programadas');
    await fila(page, 'Netflix').getByRole('button', { name: 'Desactivar', exact: true }).click();
    await expect(fila(page, 'Netflix').getByTestId('resultado')).toContainText('desactivada');

    fijarRelojServidor('2027-09-20T10:00:00-06:00');
    await abrir(page, '/programadas');
    await expect(fila(page, 'Netflix')).toContainText('Desactivada');
    await fila(page, 'Netflix').getByRole('button', { name: 'Reactivar', exact: true }).click();
    await expect(fila(page, 'Netflix').getByTestId('resultado')).toContainText('activa');

    await abrir(page, '/programadas');
    await expect(page.locator('[data-seccion="atrasadas"]')).toHaveCount(0);
    await expect(proximos(page)).toHaveCount(1);
    await expect(proximos(page)).toContainText('17');
  });

  test('PRU-E2E-PROG-111 [CA-40.7] RUTA-/programadas desactivar una programada deja el resultado con Reactivar y tocarlo la vuelve a dejar activa', async ({
    page,
  }) => {
    await sembrarOps([...BASE, NETFLIX], '2027-02-10');
    await abrir(page, '/programadas');
    await expect(proximos(page)).toHaveCount(1);
    await fila(page, 'Netflix').getByRole('button', { name: 'Desactivar', exact: true }).click();
    const resultado = fila(page, 'Netflix').getByTestId('resultado');
    await expect(resultado).toContainText('quedó desactivada');
    await resultado.getByRole('button', { name: 'Reactivar' }).click();
    await expect(resultado).toContainText('quedó activa');
    await abrir(page, '/programadas');
    await expect(fila(page, 'Netflix')).not.toContainText('Desactivada');
    await expect(proximos(page)).toHaveCount(1);
  });
});
