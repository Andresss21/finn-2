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

/** El enlace de edición de una fila, por el nombre accesible del catálogo. */
const editar = (page: Page, nombre: string) =>
  page.getByRole('link', { name: t.editar(nombre), exact: true });
const nombre = (page: Page) => page.getByLabel(t.nombre, { exact: true });

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
    await page.getByRole('button', { name: t.crear, exact: true }).click();
    await expect(page.getByText(t.grupoCreado)).toBeVisible();

    await abrir(page);
    await page.getByRole('link', { name: t.agregarCategoria('Gastos') }).click();
    await nombre(page).fill('supermercado');
    await page.getByRole('button', { name: t.crear, exact: true }).click();
    await expect(page.getByText(/ya existe/i)).toBeVisible();
    await expect(page.getByText(t.categoriaCreada)).toHaveCount(0);

    await page.getByRole('radio', { name: 'Hogar' }).click();
    await page.getByRole('button', { name: t.crear, exact: true }).click();
    await expect(page.getByText(t.categoriaCreada)).toBeVisible();
  });

  test('PRU-E2E-CATEG-102 [CA-18.2] una categoría sin historial se elimina y desaparece; con una asignación, "Eliminar" queda deshabilitado con el motivo y los enlaces a archivar y fusionar', async ({
    page,
  }) => {
    await preparar([
      { op: 'OP-07', categoria: 'Por error' },
      { op: 'OP-07', categoria: 'Comida' },
      { op: 'OP-14', categoria: 'Comida', monto: 100 },
    ]);
    await abrir(page);
    await editar(page, 'Por error').click();
    await page.getByRole('button', { name: t.eliminarCategoria, exact: true }).click();
    await expect(page.getByText(t.eliminado)).toBeVisible();
    await abrir(page);
    await expect(editar(page, 'Por error')).toHaveCount(0);

    await editar(page, 'Comida').click();
    const eliminar = page.getByRole('button', { name: t.eliminarCategoria, exact: true });
    await expect(eliminar).toBeDisabled();
    await expect(
      page.getByText('Comida tiene historial. Podés archivarla o fusionarla.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: t.archivarCategoria, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: t.fusionarCategoria, exact: true })).toBeVisible();
  });

  test('PRU-E2E-CATEG-103 [CA-18.3] "Bajar" una categoría la pasa al segundo lugar y "Deshacer" la devuelve a su lugar', async ({
    page,
  }) => {
    await preparar([
      { op: 'OP-07', categoria: 'Arriba' },
      { op: 'OP-07', categoria: 'Abajo' },
    ]);
    await abrir(page);
    const filas = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('link', { name: /^Editar / }) });
    await expect(filas.first()).toContainText('Arriba');
    await page.getByRole('button', { name: t.bajarA('Arriba'), exact: true }).click();
    await expect(filas.first()).toContainText('Abajo');
    await page.getByRole('button', { name: t.deshacer, exact: true }).click();
    await expect(filas.first()).toContainText('Arriba');
    await expect(page.getByRole('button', { name: t.deshacer, exact: true })).toHaveCount(0);
  });

  test('PRU-E2E-CATEG-104 [CA-18.5] un grupo con categorías activas no se archiva y, con todas archivadas, se archiva', async ({
    page,
  }) => {
    await preparar([{ op: 'OP-07', categoria: 'Activa' }]);
    await abrir(page);
    await page.getByRole('link', { name: t.editar('Gastos'), exact: true }).click();
    await page.getByRole('button', { name: t.archivarGrupo, exact: true }).click();
    await expect(page.getByText('Archivá primero todas las categorías de Gastos.')).toBeVisible();

    await preparar([
      { op: 'OP-07', categoria: 'Vieja' },
      { op: 'OP-07', categoria: 'Otra vieja' },
      { op: 'OP-09', categoria: 'Vieja' },
      { op: 'OP-09', categoria: 'Otra vieja' },
    ]);
    await abrir(page);
    await page.getByRole('link', { name: t.editar('Gastos'), exact: true }).click();
    await page.getByRole('button', { name: t.archivarGrupo, exact: true }).click();
    await expect(page.getByText(t.grupoArchivado)).toBeVisible();
  });

  test('PRU-E2E-CATEG-105 [CA-18.4] el grupo "Pagos de tarjeta" se muestra sin acciones y no se ofrece como destino de una categoría', async ({
    page,
  }) => {
    await preparar([{ op: 'OP-07', categoria: 'Suelta' }]);
    await abrir(page);
    await expect(page.getByText(t.delSistema)).toBeVisible();
    await expect(page.getByRole('link', { name: t.editar('Pagos de tarjeta') })).toHaveCount(0);
    await editar(page, 'Suelta').click();
    await expect(page.getByRole('radio', { name: 'Pagos de tarjeta' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'Gastos' })).toBeChecked();
  });
});
