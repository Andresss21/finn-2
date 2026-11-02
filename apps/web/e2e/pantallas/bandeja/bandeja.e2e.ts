// FT-34 Recepción y procesamiento de SMS (06 §2.5; 05 §2.5; 07 §17: una pantalla, una navegación o un flujo). Cada prueba parte de
// una base sembrada con operaciones reales (OP-35 procesa el SMS como lo haría `POST /api/sms`) y del reloj del servidor fijo
// (DP-04), y recorre `/bandeja` como la persona. Los textos salen del catálogo (FE-51). Las respuestas HTTP de `/api/sms` las
// prueban `route.rh.test.ts` (RH) y el procesamiento, `sms-recepcion.int.test.ts` (INT).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
import { navegacion } from '../../../src/textos/navegacion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/bandeja';
const HOY = '2027-02-20';
const CUENTAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
];
const sms = (
  etiqueta: string,
  comercio: string,
  monto: number,
  recibido: string,
): Extract<Op, { op: 'OP-35' }> => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${HOY}T${recibido}`,
  fecha: HOY,
});

/** Una base con el estado inicial dado; el servidor fija las 20:00 del día 20, después de los SMS sembrados. */
async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-34',
    titulo: 'Semilla de FT-34',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page): Promise<void> {
  await page.goto(RUTA);
  await esperarContenido(page);
}

const filas = (page: Page) => page.locator('[data-movimiento]');

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-105 [CA-34.6] el SMS de ESC-46 de las 19:00 del día 20 aparece en la Bandeja con la fecha 20/02/2027, la cuenta y el monto, sin categoría que sugerir', async ({
    page,
  }) => {
    await preparar([...CUENTAS, sms('sms', 'Super', 30, '19:00')]);
    await abrir(page);

    await expect(page.getByRole('heading', { level: 1, name: t.titulo })).toBeVisible();
    await expect(page.getByText(t.porRevisar(1))).toBeVisible();
    await expect(page.getByText(t.desglose.pendientes(1))).toBeVisible();
    const fila = filas(page);
    await expect(fila).toHaveCount(1);
    await expect(fila).toHaveAttribute('data-vista', 'falta');
    await expect(fila).toContainText('T · 20/02/2027');
    await expect(fila).toContainText('$30.00');
    await expect(fila).toContainText(cuentas.bandeja.estados.falta);
    // Sin acción de un toque, toda la fila abre la revisión completa (06-identidad-visual §7)
    await expect(fila.getByRole('link')).toHaveAttribute('href', /^\/bandeja\/[0-9a-f-]{36}$/);
    // El contador del marco sale del encabezado de la misma consulta
    await expect(
      page.getByRole('navigation').getByRole('link', { name: navegacion.bandeja(1), exact: true }),
    ).toBeVisible();
  });

  test('PRU-E2E-BAND-106 sin movimientos la Bandeja dice que está al día', async ({ page }) => {
    await preparar(CUENTAS);
    await abrir(page);

    await expect(page.getByRole('heading', { name: t.alDia.titulo })).toBeVisible();
    await expect(page.getByText(t.alDia.texto)).toBeVisible();
    await expect(filas(page)).toHaveCount(0);
  });

  test('PRU-E2E-BAND-107 [CA-34.4] un SMS idéntico recibido 9 minutos después no aparece en la Bandeja: queda una sola fila', async ({
    page,
  }) => {
    await preparar([
      ...CUENTAS,
      sms('primero', 'Libreria', 7, '10:00'),
      sms('repetido', 'Libreria', 7, '10:09'),
    ]);
    await abrir(page);

    await expect(page.getByText(t.porRevisar(1))).toBeVisible();
    await expect(filas(page)).toHaveCount(1);
  });

  test('PRU-E2E-BAND-108 [CA-34.5] dos compras de $3.50 en la misma tarjeta con 2 minutos de diferencia y comercios distintos: la segunda se ve como posible duplicado con sus acciones', async ({
    page,
  }) => {
    await preparar([
      ...CUENTAS,
      sms('a', 'Cafe Luna', 3.5, '10:15'),
      sms('b', 'Cafe Sol', 3.5, '10:17'),
    ]);
    await abrir(page);

    await expect(page.getByText(t.porRevisar(2))).toBeVisible();
    await expect(
      page.getByText(`${t.desglose.pendientes(1)} · ${t.desglose.posiblesDuplicados(1)}`),
    ).toBeVisible();
    const duplicado = page.locator('[data-vista="duplicado"]');
    await expect(duplicado).toHaveCount(1);
    await expect(duplicado).toContainText('Cafe Sol');
    await expect(
      duplicado.getByRole('button', {
        name: cuentas.bandeja.accionDe(cuentas.bandeja.esOtroGasto, 'Cafe Sol'),
      }),
    ).toBeVisible();
    await expect(
      duplicado.getByRole('button', {
        name: cuentas.bandeja.accionDe(cuentas.bandeja.descartar, 'Cafe Sol'),
      }),
    ).toBeVisible();
  });

  test('PRU-E2E-BAND-109 todo control de la Bandeja mide al menos 44 px, con las filas ya cargadas', async ({
    page,
  }) => {
    await preparar([
      ...CUENTAS,
      sms('a', 'Cafe Luna', 3.5, '10:15'),
      sms('b', 'Cafe Sol', 3.5, '10:17'),
    ]);
    await abrir(page);
    await expect(filas(page)).toHaveCount(2);
    await page.getByRole('link', { name: navegacion.saltar }).focus();
    await revisarTactil(page);
  });
});
