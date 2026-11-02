// FT-18 Grupos y categorías: crear, renombrar, reordenar y eliminar (06 §2.2; 05 §2.3; 07 §17: una pantalla, una navegación o un
// flujo). Cada prueba parte de una base sembrada con operaciones reales y recorre `/presupuesto/estructura` como la persona. Los
// elementos se buscan por su rol y su nombre del catálogo (FE-51). Los rechazos con su código los prueba la integración.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';

import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { estructura as t } from '../../../src/textos/estructura.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/presupuesto/estructura';
const HOY = '2027-02-05';

/** Una base con el estado inicial dado; el servidor fija el mismo instante. Cada semilla tiene un número distinto de hechos. */
async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-EST',
    titulo: 'Semilla de FT-18',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta = RUTA): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

/**
 * Todo control de la pantalla mide al menos 44 × 44 px (05 §11.5), con el contenido ya cargado. Se limita a `main`: «Saltar al
 * contenido» del marco solo se ve con foco y lo mide PRU-E2E-PWA-007.
 */
async function tactilEnMain(page: Page): Promise<void> {
  await expect(page.getByRole('heading').first()).toBeVisible();
  const chicos = await page
    .locator('main, [role="dialog"]')
    .locator('button, a')
    .evaluateAll((nodos) =>
      nodos.flatMap((n) => {
        const { width, height } = n.getBoundingClientRect();
        return width >= 44 && height >= 44 ? [] : [`${n.textContent} ${width}×${height}`];
      }),
    );
  expect(chicos).toEqual([]);
}

const nombre = (page: Page) => page.getByLabel(t.nombre, { exact: true });
const crear = (page: Page) => page.getByRole('button', { name: t.crear, exact: true });
const mover = (page: Page, accion: string) =>
  page.getByRole('button', { name: accion, exact: true });
/** Las filas que se pueden subir o bajar, en el orden en que se ven. */
const filas = (page: Page) =>
  page.getByRole('listitem').filter({ has: page.getByRole('button', { name: /^(Subir|Bajar) / }) });

test.describe('PRU-E2E-CATEG', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CATEG-101 [CA-18.1] "supermercado" en el grupo donde ya está "Supermercado" se rechaza con el nombre repetido y en otro grupo se acepta', async ({
    page,
  }) => {
    await preparar([{ op: 'OP-07', categoria: 'Supermercado' }]);
    await abrir(page);
    await page.getByRole('link', { name: t.nuevoGrupo, exact: true }).click();
    await nombre(page).fill('Hogar');
    await crear(page).click();
    await expect(page.getByText(t.grupoCreado)).toBeVisible();

    await abrir(page);
    await page.getByRole('link', { name: t.agregarCategoria('Gastos') }).click();
    await nombre(page).fill('supermercado');
    await crear(page).click();
    await expect(page.getByText(/ya existe/i)).toBeVisible();
    await expect(page.getByText(t.categoriaCreada)).toHaveCount(0);

    await page.getByRole('radio', { name: 'Hogar' }).click();
    await crear(page).click();
    await expect(page.getByText(t.categoriaCreada)).toBeVisible();
  });

  test('PRU-E2E-CATEG-103 [CA-18.3] con cuatro categorías, "Bajar" la primera la pasa al segundo lugar, "Deshacer" la devuelve y "Subir" la última la pasa al tercer lugar; todos los controles miden lo mínimo táctil', async ({
    page,
  }) => {
    await preparar([
      { op: 'OP-07', categoria: 'Alfa' },
      { op: 'OP-07', categoria: 'Beta' },
      { op: 'OP-07', categoria: 'Gama' },
      { op: 'OP-07', categoria: 'Delta' },
    ]);
    await abrir(page);
    await expect(filas(page)).toHaveCount(4);
    await expect(filas(page)).toHaveText([/^Alfa/, /^Beta/, /^Gama/, /^Delta/]);
    await tactilEnMain(page);
    // La primera no se sube y la última no se baja
    await expect(mover(page, t.subirA('Alfa'))).toHaveCount(0);
    await expect(mover(page, t.bajarA('Delta'))).toHaveCount(0);

    await mover(page, t.bajarA('Alfa')).click();
    await expect(filas(page)).toHaveText([/^Beta/, /^Alfa/, /^Gama/, /^Delta/]);
    await mover(page, t.deshacer).click();
    await expect(filas(page)).toHaveText([/^Alfa/, /^Beta/, /^Gama/, /^Delta/]);
    await expect(mover(page, t.deshacer)).toHaveCount(0);

    await mover(page, t.subirA('Delta')).click();
    await expect(filas(page)).toHaveText([/^Alfa/, /^Beta/, /^Delta/, /^Gama/]);
    await mover(page, t.deshacer).click();
    await expect(filas(page)).toHaveText([/^Alfa/, /^Beta/, /^Gama/, /^Delta/]);
  });

  test('PRU-E2E-CATEG-105 [CA-18.4] el grupo "Pagos de tarjeta" se muestra sin acciones y no se ofrece como grupo de una categoría nueva', async ({
    page,
  }) => {
    // La memoria del servidor se indexa por revisión: 5 categorías dan una que las pruebas anteriores no dejaron en ella
    await preparar(
      ['Suelta', 'Dos', 'Tres', 'Cuatro', 'Cinco'].map((categoria) => ({ op: 'OP-07', categoria })),
    );
    await abrir(page);
    await expect(page.getByText(t.delSistema)).toBeVisible();
    await expect(page.getByRole('button', { name: /Pagos de tarjeta/ })).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: t.agregarCategoria('Pagos de tarjeta') }),
    ).toHaveCount(0);
    await page.getByRole('link', { name: t.nuevaCategoria, exact: true }).click();
    await expect(nombre(page)).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Pagos de tarjeta' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'Gastos' })).toBeChecked();
    await tactilEnMain(page);
  });
});
