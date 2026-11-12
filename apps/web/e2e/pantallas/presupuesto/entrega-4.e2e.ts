// Presupuesto en la entrega 4 (TA-570 y TA-571; CH-240 D-3, D-5, D-6, E4-10 a E4-12, C-22; 06 CA-10.8, CA-11.2). Cada prueba parte de
// una base sembrada con operaciones reales (DP-17) y con el reloj del servidor fijo (DP-04); los montos los pone el motor (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const P1 = '2027-01-21';
// Hoy 21 feb: P1 está cerrado y el período actual (21 feb a 20 mar) está activo.
const HOY_CERRADO = '2027-02-21';
const OPS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-21', monto: 1000, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1', hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-02-10' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    categoria: 'Super',
    fecha: '2027-02-10',
    hoy: '2027-02-10',
  },
];

// ESC-44 hasta el paso 2 (hoy 5 mar): Gimnasio archivada con $25.00 de Disponible y su programada desactivada.
const ESC44: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gimnasio' },
  { op: 'OP-21', monto: 700, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 70, periodo: 'P1', hoy: '2027-01-25' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 30,
    categoria: 'Gimnasio',
    fecha: '2027-02-02',
    hoy: '2027-02-02',
    etiqueta: 'gimnasio',
  },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 30, periodo: 'P3' },
  {
    op: 'OP-42',
    etiqueta: 'gimnasio',
    cuenta: 'Ahorro',
    comercio: 'Gimnasio',
    monto: 30,
    categoria: 'Gimnasio',
    primeraFecha: '2027-03-10',
  },
  {
    op: 'OP-09',
    categoria: 'Gimnasio',
    destino: 'LPA',
    devolverFuturas: true,
    desactivar: ['gimnasio'],
  },
  { op: 'OP-33', compra: 'gimnasio', monto: 25 },
];

async function sembrarOps(ops: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  await sembrar(
    {
      id: 'SEM-PRES-E4',
      titulo: 'Semilla de TA-570',
      refs: [],
      hoy,
      estadoInicial: ops,
      pasos: [],
    },
    hoy,
  );
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** El id de una categoría, del enlace de su fila en Presupuesto. */
async function idDe(page: Page, nombre: string): Promise<string> {
  await abrir(page, '/presupuesto');
  const href = await page
    .locator('[data-fila-categoria]')
    .filter({ has: page.getByText(nombre, { exact: true }) })
    .getByRole('link')
    .first()
    .getAttribute('href');
  const id = /categorias\/([0-9a-f-]{36})/.exec(href ?? '')?.[1];
  if (id === undefined) throw new Error(`no se encontró el id de ${nombre}`);
  return id;
}

test.describe('PRU-E2E-PRES entrega 4', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-711 [CA-E4-15, CA-E4-16] la URL de asignar de un período cerrado lleva al detalle en ese período con el aviso y sin Asignar, Mover, Archivar ni «Cubrir»; «Ir al período actual» muestra el detalle en el actual', async ({
    page,
  }) => {
    await sembrarOps(OPS, HOY_CERRADO);
    const id = await idDe(page, 'Super');
    await page.goto(`/presupuesto/asignar/${id}?periodo=${P1}`);
    // La ruta redirige: se espera la URL final antes de medir el contenido
    await expect(page).toHaveURL(new RegExp(`/presupuesto/categorias/${id}\\?periodo=${P1}`));
    await esperarContenido(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Período cerrado · 21/01 – 20/02/2027')).toBeVisible();
    await expect(
      page.getByText('No se puede cambiar lo asignado en un período cerrado.'),
    ).toBeVisible();
    for (const nombre of [/^Asignar/, 'Mover dinero', 'Archivar', /^Cubrir/]) {
      await expect(page.getByRole('link', { name: nombre })).toHaveCount(0);
      await expect(page.getByRole('button', { name: nombre })).toHaveCount(0);
    }
    await page.getByRole('link', { name: 'Ir al período actual' }).click();
    await esperarContenido(page);
    await expect(page).toHaveURL(new RegExp(`/presupuesto/categorias/${id}$`));
    await expect(page.getByRole('link', { name: /^Asignar/ })).toBeVisible();
    await expect(page.getByText('No se puede cambiar lo asignado')).toHaveCount(0);
  });

  test('PRU-E2E-PRES-712 [CA-E4-17, CA-E4-18] mover más que el Disponible: sin error en el campo y «Mover» activo; confirmado, el origen queda negativo y aparece en «Necesita tu atención»', async ({
    page,
  }) => {
    await sembrarOps(OPS, '2027-02-10');
    await abrir(page, '/presupuesto/mover');
    await page.getByLabel('Sacar de').selectOption({ label: 'Super' });
    await page.getByLabel('Poner en').selectOption({ label: 'Salidas' });
    await page.getByLabel(/Monto a mover/).fill('600');
    const boton = page.getByRole('button', { name: 'Mover', exact: true });
    // D-6: el aviso y los dos Disponibles vienen de la previsualización de OP-15 [CH-246].
    await expect(page.getByText('Super va a quedar en −$350.00')).toBeVisible();
    await expect(page.getByText('$250.00 → −$350.00')).toBeVisible();
    await expect(boton).toBeEnabled();
    // Ningún error de flujo ni de campo (el `alert` vacío del anunciador de rutas de Next siempre está)
    await expect(page.locator('[data-error-de-flujo], [aria-invalid="true"]')).toHaveCount(0);
    await boton.click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(
      page
        .locator('[data-fila-categoria]')
        .filter({ has: page.getByText('Super', { exact: true }) })
        .locator('[data-centavos]')
        .first(),
      -35000,
    );
    await abrir(page, '/');
    await expect(
      page.getByRole('region', { name: 'Necesita tu atención' }).getByText('Super').first(),
    ).toBeVisible();
  });

  test('PRU-E2E-PRES-713 [CA-E4-15] la franja «Asignar» de Presupuesto llega a ?filtro=sin-fondos y las filas de un período cerrado no tienen «+»', async ({
    page,
  }) => {
    await sembrarOps(OPS, '2027-02-10');
    await abrir(page, '/presupuesto');
    await page
      .locator('[data-resumen-lpa="franja"]')
      .getByRole('link', { name: 'Asignar' })
      .click();
    await expect(page).toHaveURL(/\/presupuesto\?filtro=sin-fondos$/);
    await expect(page.getByRole('link', { name: 'Sin fondos' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    await sembrarOps(OPS, HOY_CERRADO);
    await abrir(page, `/presupuesto?periodo=${P1}`);
    await expect(page.locator('[data-fila-categoria]').first()).toBeVisible();
    await expect(
      page.locator('[data-fila-categoria]').getByRole('link', { name: /^Asignar/ }),
    ).toHaveCount(0);
  });

  test('PRU-E2E-PRES-721 [CA-C-3] con la semilla, la composición del detalle de Listo para asignar suma el del billete y el historial no lista adelantos', async ({
    page,
  }) => {
    await sembrarOps(OPS, '2027-02-10');
    await abrir(page, '/presupuesto/listo-para-asignar');
    const total = Number(
      await page
        .locator('[data-resumen-lpa="billete"] [data-centavos]')
        .first()
        .getAttribute('data-centavos'),
    );
    const grupos = page.locator('[data-seccion="descomposicion"] dl');
    const suma = async (i: number) =>
      (
        await grupos
          .nth(i)
          .locator('[data-centavos]')
          .evaluateAll((es) => es.map((e) => Number(e.getAttribute('data-centavos'))))
      ).reduce((a, b) => a + b, 0);
    // Entradas menos lo que ya tiene un trabajo: lo comprueba la prueba, la pantalla no lo calcula.
    expect((await suma(0)) - (await suma(1))).toBe(total);
    await expect(page.getByText('Arrastre')).toHaveCount(0);
    await expect(page.locator('[data-seccion="historial"]')).not.toContainText(/adelanto/i);
  });

  test('PRU-E2E-CATEG-731 [] desde Estructura, Editar categoría abre la hoja, «Guardar» se habilita al cambiar el nombre y un nombre repetido muestra el error en el campo', async ({
    page,
  }) => {
    await sembrarOps(OPS, '2027-02-10');
    await abrir(page, '/presupuesto/estructura');
    await page.getByRole('link', { name: 'Editar Super', exact: true }).click();
    await esperarContenido(page);
    const guardar = page.getByRole('button', { name: 'Guardar', exact: true });
    await expect(guardar).toBeDisabled();
    const nombre = page.getByLabel('Nombre');
    await nombre.fill('Super mercado');
    await expect(guardar).toBeEnabled();
    await nombre.fill('Salidas');
    await guardar.click();
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  });

  test('PRU-E2E-CATEG-732 [] «Archivadas · N» se abre, «Desarchivar» deja el resultado en el lugar y la categoría vuelve a su grupo', async ({
    page,
  }) => {
    await sembrarOps(ESC44, '2027-03-05');
    await abrir(page, '/presupuesto/estructura');
    const resumen = page.getByText('Archivadas · 1');
    await expect(resumen).toBeVisible();
    await resumen.click();
    const fila = page.locator('[data-archivada]').filter({ hasText: 'Gimnasio' });
    await expect(fila).toBeVisible();
    await fila.getByRole('button', { name: 'Desarchivar', exact: true }).click();
    await expect(page.getByText(/^Desarchivaste Gimnasio: volvió a /)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Archivarla de nuevo' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Editar Gimnasio', exact: true })).toBeVisible();
  });
});
