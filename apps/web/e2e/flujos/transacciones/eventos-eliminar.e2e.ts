// FT-28 Devoluciones, eliminar un evento y los CA de otras fichas que esta completa de punta a punta (06 FT-28; 05 §2.6; 07 §17: un flujo
// es una E2E; DT-27). Cada prueba parte de una base sembrada con las operaciones reales (DP-17) y del reloj del servidor fijo (DP-04),
// registra la devolución como la persona (detalle, «Más acciones», «Registrar devolución») y comprueba el resultado en la pantalla de la
// ficha que lo muestra. Los números los pone el motor (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { transaccion as t } from '../../../src/textos/transaccion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Locator, Page } from '@playwright/test';

/** Siembra las operaciones en `hoy` y deja el reloj del servidor en `servidor` (el día de la devolución). */
async function preparar(estadoInicial: Op[], hoy: string, servidor = hoy): Promise<void> {
  fijarRelojServidor(`${servidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-EVENTOS-ELIMINAR',
    titulo: 'Semilla de FT-28, eliminar un evento',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** Abre el detalle de la compra: la fila de Actividad que contiene todos los `textos`. */
async function irAlDetalle(page: Page, ...textos: string[]): Promise<void> {
  await abrir(page, '/actividad');
  let filas: Locator = page.locator('[data-fila-transaccion]');
  for (const texto of textos) filas = filas.filter({ hasText: texto });
  await filas.first().click();
  await expect(page.getByRole('link', { name: t.editar })).toBeVisible();
}

/** Registra la devolución de `monto` de una compra de una sola parte, a `cuenta` si se dice, y vuelve al detalle. */
async function devolver(
  page: Page,
  monto: string,
  textos: string[],
  cuenta?: string,
): Promise<void> {
  await irAlDetalle(page, ...textos);
  await page.getByRole('button', { name: 'Más acciones' }).click();
  await page.getByRole('menuitem', { name: t.registrarDevolucion }).click();
  await expect(page.getByRole('heading', { level: 1, name: t.devolverTitulo })).toBeVisible();
  await esperarHidratacion(page);
  await page.getByRole('textbox', { name: t.montoDevuelto, exact: true }).fill(monto);
  if (cuenta !== undefined) await elegirOpcion(page, t.devolverA, cuenta);
  await page.getByRole('button', { name: /^Registrar devolución/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: t.devolverTitulo })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: t.eventos })).toBeVisible();
}

/** Abre el detalle de la categoría `nombre` desde su fila en Presupuesto. */
async function abrirCategoria(page: Page, nombre: string): Promise<void> {
  await abrir(page, '/presupuesto');
  const href = await page
    .locator('[data-fila-categoria]')
    .filter({ hasText: nombre })
    .getByRole('link', { name: new RegExp(nombre) })
    .first()
    .getAttribute('href');
  if (href === null) throw new Error(`no hay una fila de «${nombre}» en Presupuesto`);
  await abrir(page, href);
}

const disponible = (page: Page, nombre: string) =>
  page
    .locator('[data-fila-categoria]')
    .filter({ hasText: nombre })
    .locator('[data-centavos]')
    .first();
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const filas = (page: Page) => page.locator('[data-fila-transaccion]');

// ESC-25 hasta el paso 1 (hoy 10 feb): Ropa con $100.00 asignados y una compra de $100.00 con débito el 5 feb
const ESC25: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Ropa' },
  { op: 'OP-21', monto: 300 },
  { op: 'OP-14', categoria: 'Ropa', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 100, categoria: 'Ropa', fecha: '2027-02-05' },
];
// Tres gastos en tres días del primer período: $10.00, $40.00 y $20.00 (CA-14.8)
const TRES_DIAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 200, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 10, categoria: 'Super', fecha: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Super', fecha: '2027-01-27' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Super', fecha: '2027-02-02' },
];
// ESC-44 hasta el paso 1: Gimnasio con $70.00 en P1, el débito de $30.00 del 2 de febrero, $30.00 en P3 y una programada; ya archivada
const ESC44_PASO1: Op[] = [
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
];
// Hormiga: gastos de Cafés, uno de $4.50 que se devuelve en parte
const CAFES: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Cafés' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, fecha: '2027-02-22' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 4.5, categoria: 'Cafés', fecha: '2027-02-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 8, categoria: 'Cafés', fecha: '2027-03-02' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 10, categoria: 'Cafés', fecha: '2027-03-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 12, categoria: 'Cafés', fecha: '2027-03-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 5, categoria: 'Super', fecha: '2027-03-01' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 6, categoria: 'Cafés', fecha: '2027-02-10' },
];

test.describe('PRU-E2E-TX eventos de una compra', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-500 [CA-28.9, ESC-25] RUTA-/actividad/[transaccionId]/eventos/eliminar con una devolución registrada, al eliminarla desde el detalle Ropa vuelve de $100.00 a $0.00 y la compra ya no lista el evento', async ({
    page,
  }) => {
    await preparar(ESC25, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), 0);
    await devolver(page, '100', ['$100.00']);
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), 10000);

    await irAlDetalle(page, '$100.00');
    await page.getByRole('link', { name: /^Eliminar devuelto/ }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: t.eliminarEventoTitulo }),
    ).toBeVisible();
    await expect(page.getByText(t.eliminarEventoPregunta.devolucion)).toBeVisible();
    await esperarHidratacion(page);
    await page.getByRole('button', { name: t.verCambios }).click();
    await page.getByRole('button', { name: t.eliminarEvento }).click();

    await expect(page.getByRole('link', { name: t.editar })).toBeVisible();
    await expect(page.getByRole('heading', { name: t.eventos })).toHaveCount(0);
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), 0);
  });

  test('PRU-E2E-TX-501 [CA-09.11, D-2] con Asignado $50.00, un gasto con débito de $80.00 y una devolución en efectivo de $30.00, Presupuesto no marca la categoría como sobregirada y su barra queda cubierta, sin excedente', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'Efectivo', tipo: 'efectivo' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Super', fecha: '2027-02-05' },
      ],
      '2027-02-10',
    );
    await devolver(page, '30', ['$80.00'], 'Efectivo');

    await abrir(page, '/presupuesto');
    const fila = page.locator('[data-fila-categoria]').filter({ hasText: 'Super' });
    await expect(fila.locator('[data-barra]')).toHaveAttribute('data-barra', 'dentro');
    await expect(fila.locator('[data-segmento="cubierto"]')).toHaveCount(1);
    await expect(fila.locator('[data-segmento="excedente"]')).toHaveCount(0);
    await expect(fila.locator('[data-estado="problema"]')).toHaveCount(0);
  });

  test('PRU-E2E-TX-502 [CA-14.8] con gastos de $10.00, $40.00 y $20.00 en tres días, al devolver $30.00 el día del de $20.00 el calendario de la categoría marca 2,500, 10,000 y 0', async ({
    page,
  }) => {
    await preparar(TRES_DIAS, '2027-02-02');
    await devolver(page, '30', ['$40.00']);

    await abrirCategoria(page, 'Super');
    const dias = page.locator('[data-calendario] button[data-dia]');
    await expect(dias).toHaveCount(3);
    await expect(dias.nth(0)).toHaveAttribute('data-intensidad', '2500');
    await expect(dias.nth(1)).toHaveAttribute('data-intensidad', '10000');
    await expect(dias.nth(2)).toHaveAttribute('data-intensidad', '0');
  });

  test('PRU-E2E-TX-503 [CA-14.8] si el único gasto de la categoría se devuelve completo el mismo día, ningún día tiene gasto positivo y todos los días del calendario quedan en 0', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 200, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Super', fecha: '2027-02-02' },
      ],
      '2027-02-02',
    );
    await devolver(page, '20', ['$20.00']);

    await abrirCategoria(page, 'Super');
    const dias = page.locator('[data-calendario] button[data-dia]');
    for (const dia of await dias.all()) await expect(dia).toHaveAttribute('data-intensidad', '0');
  });

  test('PRU-E2E-TX-504 [CA-19.2, ESC-44, AV-14] con Gimnasio archivada, al registrar la devolución de $25.00 de la compra del 2 de febrero Gimnasio queda con $25.00 y AV-14 aparece en Presupuesto y en Inicio', async ({
    page,
  }) => {
    await preparar(ESC44_PASO1, '2027-03-05');
    await devolver(page, '25', ['Gimnasio', '$30.00']);

    await abrir(page, '/presupuesto');
    const archivadas = page.locator('[data-seccion="archivadas-con-dinero"]');
    await esperarMonto(archivadas.locator('[data-centavos]').first(), 2500);
    await esperarMonto(lpa(page), 67000);
    await abrir(page, '/');
    const fila = page.locator('[data-archivada]');
    await expect(fila).toContainText('Gimnasio');
    await expect(fila).toContainText('$25.00');
  });

  test('PRU-E2E-TX-505 [CA-24.3] después de devolver parte de un café, la URL de la acción del hallazgo de hormiga muestra solo los tres gastos de Cafés de hasta $10.00, sin la devolución ni los demás', async ({
    page,
  }) => {
    await preparar(CAFES, '2027-03-05');
    await devolver(page, '3', ['$4.50']);

    await abrir(page, '/actividad');
    const cafes = await page
      .getByLabel('Categoría')
      .locator('option', { hasText: 'Cafés' })
      .getAttribute('value');
    expect(cafes).not.toBeNull();
    await abrir(
      page,
      `/actividad?categoria=${cafes}&tipo=gasto&desde=2027-02-21&hasta=2027-03-20&monto-hasta=10.00`,
    );
    await expect(filas(page)).toHaveCount(3);
    const montos = page.locator('[data-fila-transaccion] [data-centavos]');
    await esperarMonto(montos.nth(0), -1000);
    await esperarMonto(montos.nth(1), -800);
    await esperarMonto(montos.nth(2), -450);
  });

  test('PRU-E2E-TX-506 [CA-25.5, CB-30] después de registrar una devolución de la compra, «Editar» muestra la cuenta fija en solo lectura con el motivo de la devolución', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'Corriente' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Super' },
      ],
      '2027-02-12',
    );
    await devolver(page, '10', ['$40.00']);
    await page.getByRole('link', { name: t.editar }).click();
    await expect(page.getByRole('heading', { level: 1, name: t.editarTitulo })).toBeVisible();
    await expect(page.locator('[data-cuenta-fija]')).toContainText('Ahorro');
    await expect(page.locator('[data-cuenta-fija]')).toContainText(/devoluci/i);
  });
});
