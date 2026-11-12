// FT-65 Suscripciones detectadas (06 FT-65; 05 §2.10; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17) con el reloj del servidor fijo (DP-04) y abre `/reportes/suscripciones` como la persona. La detección y
// los montos los pone el motor: la prueba comprueba que la pantalla los dibuja y que el toque ejecuta la operación (PF-3). Los cobros de
// NETFLIX entran por SMS aprobado (comercio de la compra) o por ocurrencias de una programada, porque OP-20 de la siembra no lleva comercio.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { reportes as t } from '../../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

const INICIO = '2027-01-25';
// Ciclo de 2027 (día 21): P1 21/01, P2 21/02, P3 21/03, P4 21/04 y P5 21/05 (el activo con hoy el 25/05).
const HOY = '2027-05-25';

const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Streaming' },
  { op: 'OP-21', monto: 1000 },
];
// Un ingreso al comienzo de cada período, para que P1 a P4 existan como períodos cerrados y P5 sea el activo.
const ingreso = (hoy: string): Op => ({ op: 'OP-21', monto: 10, hoy });

/** Un cobro de $15.49 de NETFLIX con la tarjeta T, en Streaming: el SMS llega y se aprueba ese mismo día. */
const cobro = (fecha: string): Op[] => [
  {
    op: 'OP-35',
    etiqueta: `netflix-${fecha}`,
    cuenta: 'T',
    monto: 15.49,
    comercio: 'NETFLIX',
    recibido: `${fecha}T10:00`,
    fecha,
    hoy: fecha,
  },
  {
    op: 'OP-37',
    etiqueta: `netflix-${fecha}`,
    categoria: 'Streaming',
    aprobado: `${fecha}T12:00`,
    hoy: fecha,
  },
];

// CA-65.1: cobros los días 17, 17 y 18 en 3 de los 4 períodos cerrados (P1, P2 y P4) y ninguna programada.
const TRES_DE_CUATRO: Op[] = [
  ...BASE,
  ...cobro('2027-02-17'),
  ingreso('2027-02-22'),
  ...cobro('2027-03-17'),
  ingreso('2027-03-22'),
  ingreso('2027-04-22'),
  ...cobro('2027-05-18'),
  ingreso('2027-05-22'),
];
// CA-65.4: cobros en solo 2 de los 4 períodos cerrados.
const DOS_DE_CUATRO: Op[] = [
  ...BASE,
  ...cobro('2027-02-17'),
  ingreso('2027-02-22'),
  ...cobro('2027-03-17'),
  ingreso('2027-03-22'),
  ingreso('2027-04-22'),
  ingreso('2027-05-22'),
];
const ocurrencia = (fecha: string): Op => ({
  op: 'OP-43',
  modo: 'toque',
  programada: 'netflix',
  fecha,
  hoy: fecha,
});
// CA-65.3: una programada de NETFLIX con una ocurrencia registrada en cada período cerrado, que luego se desactiva.
const PROGRAMADA_CON_HISTORIAL: Op[] = [
  ...BASE,
  {
    op: 'OP-42',
    etiqueta: 'netflix',
    cuenta: 'T',
    comercio: 'NETFLIX',
    monto: 15.49,
    categoria: 'Streaming',
    primeraFecha: '2027-02-17',
  },
  ocurrencia('2027-02-17'),
  ingreso('2027-02-22'),
  ocurrencia('2027-03-17'),
  ingreso('2027-03-22'),
  ocurrencia('2027-04-17'),
  ingreso('2027-04-22'),
  ocurrencia('2027-05-17'),
  ingreso('2027-05-22'),
];

async function sembrarSemilla(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-SUSCRIPCIONES',
    titulo: 'Semilla de FT-65',
    refs: [],
    hoy: INICIO,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, INICIO);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
const hallazgo = (page: Page) => page.locator('[data-hallazgo-suscripcion]');
const fila = (page: Page, comercio: string) =>
  page.locator('[data-programada]').filter({ has: page.getByText(comercio, { exact: true }) });

test.describe('PRU-E2E-REP suscripciones detectadas', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-210 [CA-65.1] con cobros de $15.49 de NETFLIX los días 17, 17 y 18 en 3 de los 4 períodos cerrados y ninguna programada, el reporte detecta NETFLIX con $15.49 al mes y $185.88 al año', async ({
    page,
  }) => {
    await sembrarSemilla(TRES_DE_CUATRO, HOY);
    await abrir(page, '/reportes/suscripciones');
    await expect(hallazgo(page)).toHaveCount(1);
    await expect(hallazgo(page)).toContainText(
      t.suscripciones.sinProgramar('NETFLIX', '$15.49', '$185.88'),
    );
    await expect(
      hallazgo(page).getByRole('button', { name: t.suscripciones.programarla }),
    ).toBeVisible();
  });

  test('PRU-E2E-REP-211 [CA-65.2] «Programarla» crea una programada mensual de $15.49 con la cuenta y la categoría de la última compra, sin registro automático, y el reporte la pasa a «Ya programadas»', async ({
    page,
  }) => {
    await sembrarSemilla(TRES_DE_CUATRO, HOY);
    await abrir(page, '/reportes/suscripciones');
    await hallazgo(page)
      .getByRole('button', { name: t.suscripciones.programarla, exact: true })
      .click();
    const hecho = page.locator('[data-suscripciones-hecho]');
    await expect(hecho).toContainText(t.suscripciones.programada('NETFLIX', '$15.49'));

    await abrir(page, '/programadas');
    await expect(fila(page, 'NETFLIX')).toHaveCount(1);
    await expect(fila(page, 'NETFLIX')).toContainText('$15.49');
    await fila(page, 'NETFLIX').getByRole('link').click();
    await esperarContenido(page);
    await expect(page.getByLabel('Frecuencia')).toHaveValue('mensual');
    await expect(page.getByLabel('Cuenta', { exact: true })).toHaveValue(/.+/);
    await expect(
      page.getByRole('switch', { name: 'Registrar sola en su fecha' }),
    ).not.toBeChecked();

    await abrir(page, '/reportes/suscripciones');
    await expect(hallazgo(page)).toHaveCount(0);
    await expect(page.locator('[data-ya-programadas]')).toContainText('NETFLIX');
  });

  test('PRU-E2E-REP-212 [CA-65.2] «Deshacer» tras «Programarla» elimina la programada creada y deja de figurar en Programadas', async ({
    page,
  }) => {
    await sembrarSemilla(TRES_DE_CUATRO, HOY);
    await abrir(page, '/reportes/suscripciones');
    await hallazgo(page)
      .getByRole('button', { name: t.suscripciones.programarla, exact: true })
      .click();
    const hecho = page.locator('[data-suscripciones-hecho]');
    await expect(hecho).toContainText(t.suscripciones.programada('NETFLIX', '$15.49'));
    await hecho.getByRole('button', { name: ti.deshacer, exact: true }).click();
    await expect(hecho).toHaveCount(0);

    await abrir(page, '/programadas');
    await expect(fila(page, 'NETFLIX')).toHaveCount(0);
    await abrir(page, '/reportes/suscripciones');
    await expect(hallazgo(page)).toContainText(
      t.suscripciones.sinProgramar('NETFLIX', '$15.49', '$185.88'),
    );
  });

  test('PRU-E2E-REP-213 [CA-65.3] con la programada de NETFLIX desactivada la acción es «Reactivarla» y, al tocarla, vuelve a estar activa sin atrasadas del tiempo inactivo', async ({
    page,
  }) => {
    await sembrarSemilla(PROGRAMADA_CON_HISTORIAL, HOY);
    await abrir(page, '/programadas');
    // E4-24: «Desactivar» vive en la edición de la programada; el resultado queda en la lista, de donde se salió
    await fila(page, 'NETFLIX').getByRole('link').click();
    await esperarContenido(page);
    await page.getByRole('button', { name: 'Desactivar', exact: true }).click();
    await expect(page.getByTestId('resultado')).toContainText('desactivada');

    // El 17/06 cae mientras está desactivada; el 18/06 se reactiva desde el reporte (CF-20).
    fijarRelojServidor('2027-06-18T10:00:00-06:00');
    await abrir(page, '/reportes/suscripciones');
    await expect(hallazgo(page)).toContainText(t.suscripciones.desactivada('NETFLIX', '$15.49'));
    await expect(
      hallazgo(page).getByRole('button', { name: t.suscripciones.programarla }),
    ).toHaveCount(0);
    await hallazgo(page)
      .getByRole('button', { name: t.suscripciones.reactivarla, exact: true })
      .click();
    await expect(page.locator('[data-suscripciones-hecho]')).toContainText(
      t.suscripciones.reactivada('NETFLIX'),
    );

    await abrir(page, '/programadas');
    await expect(fila(page, 'NETFLIX')).toHaveCount(1);
    await expect(fila(page, 'NETFLIX')).not.toContainText('Desactivada');
    await expect(page.locator('[data-seccion="atrasadas"]')).toHaveCount(0);
  });

  test('PRU-E2E-REP-214 [CA-65.4] con cobros en solo 2 de los 4 períodos cerrados no se detecta ninguna suscripción', async ({
    page,
  }) => {
    await sembrarSemilla(DOS_DE_CUATRO, HOY);
    await abrir(page, '/reportes/suscripciones');
    await expect(hallazgo(page)).toHaveCount(0);
    await expect(page.locator('[data-sin-detectadas]')).toHaveText(t.suscripciones.sinDetectadas);
  });
});
