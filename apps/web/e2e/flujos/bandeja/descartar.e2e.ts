// FT-37 Descartar, restaurar, duplicados y coincidencias (06 §2.5; 04 OP-39, OP-40; 07 §17: una pantalla o un flujo es una E2E). El
// estado sale de operaciones reales de 01 §8 (DP-17): SMS de la tarjeta que el motor deja pendientes, autodescartados, duplicados
// o con coincidencia. Los números los pone el motor y los textos salen del catálogo (FE-51). Cada paso espera lo que dejó el
// anterior: ningún clic compite con la revalidación (PRU-E2E-BAND-141).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
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
// Ahorro con $500.00, la tarjeta T y Super con $50.00 en P1
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
];
// Una compra anterior en Super ya aprobada: los SMS siguientes de ese comercio traen la categoría sugerida
const HISTORIAL: Op[] = [
  sms('anterior', 'Super', 30, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Super', aprobado: `${DIA_20}T09:30` },
];
const NETFLIX: Op = {
  op: 'OP-42',
  etiqueta: 'Netflix',
  cuenta: 'T',
  comercio: 'Netflix',
  monto: 15.49,
  categoria: 'Super',
  primeraFecha: DIA_20,
};

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-37',
    titulo: 'Semilla de FT-37, descartar y resolver',
    refs: [],
    hoy: DIA_20,
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
}

async function abrir(page: Page, ruta = '/bandeja'): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const filas = (page: Page) => page.locator('[data-movimiento]');
const accion = (nombre: string, comercio: string) => cuentas.bandeja.accionDe(nombre, comercio);

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-150 [CA-37.1] «Descartar» un pendiente lo saca de la lista y deja «Descartaste … Restaurar» en su lugar; «Restaurar» lo devuelve a la lista', async ({
    page,
  }) => {
    await preparar([...HISTORIAL, sms('a', 'Super', 12, '15:00')]);
    await abrir(page);
    await expect(filas(page)).toHaveCount(1);

    await page.getByRole('button', { name: accion(cuentas.bandeja.descartar, 'Super') }).click();
    const resultado = page.getByTestId('resultado');
    await expect(resultado).toContainText(t.descartaste('Super $12.00'));
    await expect(page.getByText(t.alDia.titulo)).toHaveCount(0);
    await expect(filas(page)).toHaveCount(0);

    // La revalidación ya sacó el movimiento de los activos: el resultado sigue en su lugar
    await abrir(page);
    await expect(page.getByText(t.alDia.titulo)).toBeVisible();

    // Restaurar desde la vista de descartados vuelve a dejarlo en la lista
    await abrir(page, '/bandeja?vista=descartados');
    await page.getByRole('button', { name: accion(t.restaurar, 'Super') }).click();
    await expect(page.getByTestId('resultado')).toContainText(t.restauraste('Super $12.00'));
    await abrir(page);
    await expect(filas(page)).toHaveCount(1);
    await expect(filas(page)).toContainText('Super');
  });

  test('PRU-E2E-BAND-151 [CA-37.2] un autodescartado se ve en la vista de descartados y al restaurarlo se reevalúa y queda pendiente, porque su texto es idéntico al del original', async ({
    page,
  }) => {
    await preparar([
      sms('primero', 'Libreria', 7, '10:00'),
      sms('repetido', 'Libreria', 7, '10:09'),
    ]);
    await abrir(page, '/bandeja?vista=descartados');
    await expect(filas(page)).toHaveCount(1);
    await expect(filas(page)).toContainText(t.descartados.autodescartado);

    await page.getByRole('button', { name: accion(t.restaurar, 'Libreria') }).click();
    await expect(page.getByTestId('resultado')).toContainText(t.restauraste('Libreria $7.00'));
    // Quedó pendiente: admite «Descartar» como salida
    await expect(page.getByTestId('resultado').getByRole('button')).toHaveText(
      cuentas.bandeja.descartar,
    );

    await abrir(page);
    await expect(filas(page)).toHaveCount(2);
    // CH-101: el texto es idéntico al del original (01 §4.17 exige texto distinto): queda pendiente, sin candidata
    await expect(page.locator('[data-vista="duplicado"]')).toHaveCount(0);
    await expect(page.locator('[data-vista="falta"]')).toHaveCount(2);
    await abrir(page, '/bandeja?vista=descartados');
    await expect(page.getByText(t.descartados.vacio.titulo)).toBeVisible();
  });

  test('PRU-E2E-BAND-152 [CA-37.3] «Es otro gasto» en un posible duplicado lo pasa a pendiente sin candidata y no deja una salida para revertir', async ({
    page,
  }) => {
    await preparar([sms('a', 'Cafe Luna', 3.5, '10:15'), sms('b', 'Cafe Sol', 3.5, '10:17')]);
    await abrir(page);
    await expect(page.locator('[data-vista="duplicado"]')).toHaveCount(1);

    await page
      .getByRole('button', { name: accion(cuentas.bandeja.esOtroGasto, 'Cafe Sol') })
      .click();
    await expect(page.locator('[data-vista="duplicado"]')).toHaveCount(0);
    await expect(page.getByTestId('resultado')).toHaveCount(0);
    await expect(filas(page)).toHaveCount(2);
    await expect(page.getByText(t.desglose.pendientes(2))).toBeVisible();
  });

  test('PRU-E2E-BAND-153 [CA-37.4] «No es este pago» en un movimiento con coincidencia lo deja pendiente y no crea ninguna transacción', async ({
    page,
  }) => {
    await preparar([NETFLIX, sms('sms', 'Netflix', 15.49, '19:00')]);
    await abrir(page);
    await filas(page).getByRole('link').click();
    await expect(page.getByText(t.revisar.coincidencia).first()).toBeVisible();

    await page.getByRole('button', { name: t.noEsEstePago }).click();
    await expect(page.getByText(t.revisar.coincidencia)).toHaveCount(0);
    await expect(page.getByRole('button', { name: t.noEsEstePago })).toHaveCount(0);

    await abrir(page);
    await expect(page.locator('[data-vista="coincidencia"]')).toHaveCount(0);
    await expect(filas(page)).toHaveCount(1);
    // Nada se aprobó: Super sigue con $50.00
    await abrir(page, '/presupuesto');
    await esperarMonto(
      page
        .locator('[data-fila-categoria]')
        .filter({ hasText: 'Super' })
        .locator('[data-centavos]')
        .first(),
      5000,
    );
  });

  test('PRU-E2E-BAND-154 [CA-37.5] dos SMS de la misma ocurrencia: el primero se empareja y el segundo se ve como posible duplicado, no como otra coincidencia', async ({
    page,
  }) => {
    await preparar([
      NETFLIX,
      sms('uno', 'Netflix', 15.49, '19:00'),
      sms('dos', 'Netflix.com', 15.49, '19:05'),
    ]);
    await abrir(page);

    await expect(filas(page)).toHaveCount(2);
    await expect(page.locator('[data-vista="coincidencia"]')).toHaveCount(1);
    await expect(page.locator('[data-vista="duplicado"]')).toHaveCount(1);
    await expect(page.locator('[data-vista="duplicado"]')).toContainText('Netflix.com');
  });

  test('PRU-E2E-BAND-155 [CA-37.6] un movimiento con coincidencia no ofrece «Descartar», ni en la lista ni en su revisión', async ({
    page,
  }) => {
    await preparar([NETFLIX, sms('sms', 'Netflix', 15.49, '19:00')]);
    await abrir(page);
    await expect(page.locator('[data-vista="coincidencia"]')).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: accion(cuentas.bandeja.descartar, 'Netflix') }),
    ).toHaveCount(0);

    await filas(page).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    await expect(page.getByRole('button', { name: t.noEsEstePago })).toBeVisible();
    await expect(page.getByRole('button', { name: cuentas.bandeja.descartar })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-156 [CA-37.1] «Descartar» desde la revisión de un movimiento deja «Descartaste … Restaurar» y «Restaurar» lo devuelve a pendiente', async ({
    page,
  }) => {
    await preparar([sms('a', 'Cafe Luna', 3.5, '10:15')]);
    await abrir(page);
    await filas(page).getByRole('link').first().click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();

    await page.getByRole('button', { name: cuentas.bandeja.descartar }).click();
    await expect(page.getByTestId('resultado')).toContainText(t.descartaste('Cafe Luna $3.50'));
    await page.getByTestId('resultado').getByRole('button', { name: t.restaurar }).click();
    await expect(page.getByTestId('resultado')).toContainText(t.restauraste('Cafe Luna $3.50'));

    await abrir(page);
    await expect(filas(page)).toHaveCount(1);
  });

  test('PRU-E2E-BAND-216 [FT-34] el selector segmentado «Por revisar · N» / «Descartados» cambia de vista, marca la elegida y vuelve', async ({
    page,
  }) => {
    await preparar([
      sms('primero', 'Libreria', 7, '10:00'),
      sms('repetido', 'Libreria', 7, '10:09'),
    ]);
    await abrir(page);
    const grupo = page.getByRole('radiogroup', { name: t.vistas.nombre });
    const porRevisar = grupo.getByRole('radio', { name: t.vistas.activosConConteo(1) });
    const descartados = grupo.getByRole('radio', { name: t.vistas.descartados });
    await expect(porRevisar).toBeChecked();
    await expect(descartados).not.toBeChecked();

    await descartados.click();
    await expect(page).toHaveURL(/\/bandeja\?vista=descartados$/);
    await expect(grupo.getByRole('radio', { name: t.vistas.descartados })).toBeChecked();
    await expect(filas(page)).toHaveCount(1);

    await grupo.getByRole('radio', { name: t.vistas.activosConConteo(1) }).click();
    await expect(page).toHaveURL(/\/bandeja$/);
    await expect(grupo.getByRole('radio', { name: t.vistas.activosConConteo(1) })).toBeChecked();
  });

  test('PRU-E2E-BAND-217 [FT-37] la fila de un descartado lleva el monto con el signo de su tipo y un «Restaurar» de al menos 44 px', async ({
    page,
  }) => {
    await preparar([
      sms('primero', 'Libreria', 7, '10:00'),
      sms('repetido', 'Libreria', 7, '10:09'),
    ]);
    await abrir(page, '/bandeja?vista=descartados');
    const monto = filas(page).locator('[data-centavos]');
    await esperarMonto(monto, 700);
    await expect(monto.locator('[aria-hidden="true"]')).toHaveText(/^[−-]\$7\.00$/);
    const caja = await page
      .getByRole('button', { name: accion(t.restaurar, 'Libreria') })
      .boundingBox();
    expect(caja?.height).toBeGreaterThanOrEqual(44);
    expect(caja?.width).toBeGreaterThanOrEqual(44);
  });
});
