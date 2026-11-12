// FT-19 Archivar y desarchivar categorías, y sacar el dinero de una archivada (06 FT-19; 05 §2.3; 07 §17: un flujo es una E2E). Cada
// prueba parte de una base sembrada con las operaciones reales de ESC-44 (01 §8, DP-17) y del reloj del servidor fijo (DP-04), y
// recorre el flujo como la persona. Los números los pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía
// (PF-3). Lo que completan otras fichas (DT-27) está en `pruebas/pendientes-e2e.json`.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-03-05';
// ESC-44 paso 0: Gimnasio con $70.00 en P1, el débito de $30.00 del 2 de febrero, $30.00 en P3 (futuro) y una programada activa.
const ESC44_PASO0: Op[] = [
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
];
const ARCHIVAR_GIMNASIO: Op = {
  op: 'OP-09',
  categoria: 'Gimnasio',
  destino: 'LPA',
  devolverFuturas: true,
  desactivar: ['gimnasio'],
};
// Paso 2: la devolución de $25.00 vinculada a la compra del 2 de febrero deja $25.00 en la archivada.
const ESC44_PASO2: Op[] = [
  ...ESC44_PASO0,
  ARCHIVAR_GIMNASIO,
  { op: 'OP-33', compra: 'gimnasio', monto: 25 },
];

async function sembrarOps(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CATEG-ARCHIVAR',
    titulo: 'Semilla de FT-19',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const archivadas = (page: Page) => page.locator('[data-seccion="archivadas-con-dinero"]');

test.describe('PRU-E2E-CATEG', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CATEG-107 [CA-19.1, ESC-44] archivar Gimnasio desde la estructura con su Disponible a Listo para asignar, las futuras devueltas y la programada desactivada deja Listo para asignar en $670.00 y a Gimnasio fuera de Presupuesto', async ({
    page,
  }) => {
    await sembrarOps(ESC44_PASO0);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 60000);
    await abrir(page, '/presupuesto/estructura');
    await page.getByRole('link', { name: 'Editar Gimnasio', exact: true }).click();
    await page.getByRole('link', { name: 'Archivar', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Archivar categoría', level: 1 })).toBeVisible();
    await expect(page.getByText('Tiene dinero asignado en 1 período futuro.')).toBeVisible();
    await page.getByLabel(/Programada Gimnasio/).selectOption({ label: 'Desactivarla' });
    // E4-1: la tarjeta de impacto está en la misma pantalla y el pie confirma con el verbo
    await expect(page.getByRole('heading', { name: 'Antes de confirmar' })).toBeVisible();
    await page.getByRole('button', { name: 'Archivar Gimnasio', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);

    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 67000);
    await expect(fila(page, 'Gimnasio')).toHaveCount(0);
    await expect(archivadas(page)).toHaveCount(0);
  });

  test('PRU-E2E-CATEG-108 [CA-19.4, ESC-44, AV-14] tocar la propuesta de AV-14 sube Listo para asignar de $670.00 a $695.00 y la sección de archivadas con dinero desaparece', async ({
    page,
  }) => {
    await sembrarOps(ESC44_PASO2);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 67000);
    await esperarMonto(archivadas(page).locator('[data-centavos]').first(), 2500);
    await archivadas(page)
      .getByRole('button', { name: 'Sacar $25.00 a Listo para asignar' })
      .click();
    await esperarMonto(lpa(page), 69500);
    await expect(archivadas(page)).toHaveCount(0);
  });

  test('PRU-E2E-CATEG-109 [AV-14, ESC-44] sacar parte del dinero de una archivada con el flujo corto lo deja en la categoría de destino y el resto sigue en AV-14', async ({
    page,
  }) => {
    await sembrarOps([{ op: 'OP-07', categoria: 'Salidas' }, ...ESC44_PASO2]);
    await abrir(page, '/presupuesto');
    await archivadas(page).getByRole('link', { name: 'Sacar el dinero de Gimnasio' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Poner en').selectOption({ label: 'Salidas' });
    await page.getByLabel(/Monto a sacar/).fill('10');
    await page.getByRole('button', { name: 'Sacar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(fila(page, 'Salidas').locator('[data-centavos]').first(), 1000);
    await esperarMonto(archivadas(page).locator('[data-centavos]').first(), 1500);
    await esperarMonto(lpa(page), 67000);
  });

  test('PRU-E2E-CATEG-110 [CA-19.6, ESC-44] una archivada aparece en el período cerrado en que se usó, con su nombre y sus números', async ({
    page,
  }) => {
    await sembrarOps([...ESC44_PASO0, ARCHIVAR_GIMNASIO]);
    await abrir(page, '/presupuesto?periodo=2027-01-21');
    await expect(fila(page, 'Gimnasio')).toHaveCount(1);
    // Disponible, Asignado y Gastado, en ese orden (05 §10.8)
    await esperarMonto(fila(page, 'Gimnasio').locator('[data-centavos]').nth(1), 7000);
    await esperarMonto(fila(page, 'Gimnasio').locator('[data-centavos]').nth(2), 3000);
    await abrir(page, '/presupuesto');
    await expect(fila(page, 'Gimnasio')).toHaveCount(0);
  });
});

test.describe('PRU-E2E-PRES', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-741 [CA-E4-21] archivar Gimnasio con su programada muestra la tarjeta K4 en la misma pantalla y, al cambiar «Desactivarla» por «Pasarla a otra categoría», vuelve a pedir el impacto al servidor', async ({
    page,
  }) => {
    await sembrarOps([{ op: 'OP-07', categoria: 'Salidas' }, ...ESC44_PASO0]);
    await abrir(page, '/presupuesto');
    const id = await fila(page, 'Gimnasio').getAttribute('data-fila-categoria');
    await abrir(page, `/presupuesto/categorias/${id}/archivar`);
    const k4 = page.locator('[data-impacto-k4]');
    await expect(k4).toBeVisible();
    await expect(page.getByLabel(/Programada Gimnasio/)).toHaveValue('desactivar');
    // Cada cambio de decisión es una previsualización nueva al servidor (una Server Action por cambio)
    const acciones: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST' && r.headers()['next-action'] !== undefined)
        acciones.push(r.postData() ?? '');
    });
    await page
      .getByLabel(/Programada Gimnasio/)
      .selectOption({ label: 'Pasarla a otra categoría' });
    await page.getByLabel('Pasarla a').selectOption({ label: 'Salidas' });
    await expect.poll(() => acciones.length).toBeGreaterThan(0);
    expect(acciones.at(-1)).toContain('reasignar');
    await expect(k4).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Archivar Gimnasio', exact: true }),
    ).toBeEnabled();
  });
});
