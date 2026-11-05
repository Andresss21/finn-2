// FT-10 Asignar y desasignar (06 FT-10; 05 §2.3; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona.
// Los números los pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3). El detalle de la categoría
// (destino de CA-10.8) es de FT-14: acá solo se comprueba a dónde llega la URL.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const P1 = '2027-01-21';
const P2 = '2027-02-21';

// Las operaciones de 01 §8. ESC-03 hasta el paso 3 (hoy 5 feb, A = P1): ingreso de $1,000.00, Super $600.00 en P1 y Salidas
// $300.00 en P2. Mascota tiene su meta de $50.00 como estado previo.
const ESC03_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-18', categoria: 'Mascota', monto: 50 },
  { op: 'OP-21', monto: 1000 },
];
const ESC03_PASO3: Op[] = [
  ...ESC03_PASO1,
  { op: 'OP-14', categoria: 'Super', monto: 600, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Salidas', monto: 300, periodo: 'P2' },
];
// ESC-05 hasta el paso 2 con su historial en P1 (hoy 21 feb: P1 cerrado, A = P2); es el estado del que parten ESC-06 y ESC-07.
const ESC05_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1', hoy: '2027-02-10' },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 400,
    categoria: 'Super',
    fecha: '2027-02-10',
    hoy: '2027-02-10',
  },
];

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PRES-ASIGNAR',
    titulo: 'Semilla de FT-10',
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

// Por el nombre exacto: "Gas" también está en "Gastado" de todas las filas.
const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
/** Los montos de una fila de categoría: Disponible, Asignado y Gastado, en ese orden (05 §10.8). */
const montoDeFila = (page: Page, nombre: string, n: 0 | 1 | 2) =>
  fila(page, nombre).locator('[data-centavos]').nth(n);

async function idDe(page: Page, nombre: string): Promise<string> {
  const id = await fila(page, nombre).getAttribute('data-fila-categoria');
  if (id === null) throw new Error(`no hay una fila de ${nombre}`);
  return id;
}

/** Los montos de la fila de pago de tarjeta: lo que falta reservar y el disponible para pagar. */
const montoDePago = (page: Page, n: 0 | 1) =>
  page.locator('[data-fila-pago] [data-centavos]').nth(n);

async function idDePago(page: Page): Promise<string> {
  const href = await page.locator('[data-fila-pago]').first().getAttribute('href');
  const id = href?.split('?')[0]?.split('/').pop();
  if (id === undefined || id === '') throw new Error('no hay una fila de pago de tarjeta');
  return id;
}

const campoMonto = (page: Page) => page.getByLabel(/Nuevo valor de Asignado/);
const guardar = (page: Page) => page.getByRole('button', { name: 'Guardar', exact: true });

async function escribirYGuardar(page: Page, monto: string): Promise<void> {
  await campoMonto(page).fill(monto);
  await guardar(page).click();
}

test.describe('PRU-E2E-PRES', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-130 [CA-10.1, ESC-03] asignar $600.00 a Super desde su fila deja Listo para asignar en $400.00 y vuelve a Presupuesto', async ({
    page,
  }) => {
    await sembrarOps(ESC03_PASO1, '2027-02-05');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);
    await page.getByRole('link', { name: 'Asignar a Super' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await escribirYGuardar(page, '600');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarMonto(lpa(page), 40000);
    await esperarMonto(montoDeFila(page, 'Super', 0), 60000);
  });

  test('PRU-E2E-PRES-251 [FT-10] la hoja de Asignar dibuja Asignado y Disponible como cifras en columnas y «Cancelar», que cierra sin guardar', async ({
    page,
  }) => {
    await sembrarOps(ESC03_PASO1, '2027-02-05');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);
    await page.getByRole('link', { name: 'Asignar a Super' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const resumen = page.locator('[data-resumen-asignar]');
    await expect(resumen.locator('dt')).toHaveText(['Asignado', 'Disponible']);
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarMonto(lpa(page), 100000);
  });

  test('PRU-E2E-PRES-131 [CA-10.2, ESC-03] asignar $200.00 a Gas en el período futuro se rechaza con lpa_negativo_en_futuro y dice que faltan $100.00', async ({
    page,
  }) => {
    await sembrarOps(ESC03_PASO3, '2027-02-05');
    await abrir(page, '/presupuesto');
    const gas = await idDe(page, 'Gas');
    await abrir(page, `/presupuesto/asignar/${gas}?periodo=${P2}`);
    await escribirYGuardar(page, '200');
    await expect(page.getByText(/te faltan \$100\.00/)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/presupuesto/asignar/${gas}`));
    // No se escribió nada: el activo sigue con Gas en $0.00 y Listo para asignar en $100.00
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Gas', 0), 0);
    await esperarMonto(lpa(page), 10000);
  });

  test('PRU-E2E-PRES-132 [CA-10.3, ESC-03, AV-11, AV-20] asignar $200.00 a Gas en el activo avisa que dejará Listo para asignar en −$100.00 y, al confirmar, queda así con AV-20', async ({
    page,
  }) => {
    await sembrarOps(ESC03_PASO3, '2027-02-05');
    await abrir(page, '/presupuesto');
    const gas = await idDe(page, 'Gas');
    await abrir(page, `/presupuesto/asignar/${gas}`);
    await escribirYGuardar(page, '200');
    await expect(page.getByText('dejará Listo para asignar en −$100.00')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(lpa(page), -10000);
    await expect(page.getByText('Asignaste más de lo que tenés')).toBeVisible();
    await esperarMonto(montoDeFila(page, 'Gas', 0), 20000);
  });

  test('PRU-E2E-PRES-133 [CA-10.4, ESC-05, ESC-06] asignar $100.00 más a Super en P1 lo deja en $0.00, Pago T en $400.00 y sin nada por reservar', async ({
    page,
  }) => {
    // Con P1 todavía activo (15 feb): es el estado del paso 2 de ESC-05
    await sembrarOps(ESC05_PASO2, '2027-02-15');
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Super', 0), -10000);
    await esperarMonto(montoDePago(page, 0), 10000);
    await abrir(page, `/presupuesto/asignar/${await idDe(page, 'Super')}`);
    await escribirYGuardar(page, '400');
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Super', 0), 0);
    await esperarMonto(montoDePago(page, 0), 0);
    await esperarMonto(montoDePago(page, 1), 40000);
  });

  test('PRU-E2E-PRES-134 [CA-10.5, ESC-07] asignar $100.00 a Pago T en P2 baja lo que falta reservar de T de $100.00 a $0.00', async ({
    page,
  }) => {
    await sembrarOps(
      [...ESC05_PASO2, { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P2' }],
      '2027-02-21',
    );
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDePago(page, 0), 10000);
    await abrir(page, `/presupuesto/asignar/${await idDePago(page)}`);
    await escribirYGuardar(page, '100');
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDePago(page, 0), 0);
    await esperarMonto(montoDePago(page, 1), 40000);
  });

  test('PRU-E2E-PRES-135 [CA-10.6, CB-09] con Asignado $50.00, escribir −$20.00 deja Asignado y Disponible en −$20.00 de débito', async ({
    page,
  }) => {
    await sembrarOps(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
      ],
      '2027-02-05',
    );
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Super', 1), 5000);
    await abrir(page, `/presupuesto/asignar/${await idDe(page, 'Super')}`);
    await campoMonto(page).fill('20');
    await page.getByRole('radio', { name: '−' }).click();
    await guardar(page).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Super', 1), -2000);
    await esperarMonto(montoDeFila(page, 'Super', 0), -2000);
    await expect(fila(page, 'Super')).toContainText('Sobregiro con débito o efectivo');
  });

  test('PRU-E2E-PRES-136 [CA-10.7] si otra pestaña cambió lo asignado, enviar responde conflicto_desactualizado y ofrece el valor actual', async ({
    page,
    context,
  }) => {
    await sembrarOps(ESC03_PASO1, '2027-02-05');
    await abrir(page, '/presupuesto');
    const ruta = `/presupuesto/asignar/${await idDe(page, 'Super')}`;
    await abrir(page, ruta);
    // La otra pestaña asigna $700.00 mientras esta sigue abierta con el valor de antes
    const otra = await context.newPage();
    await abrir(otra, ruta);
    await escribirYGuardar(otra, '700');
    await expect(otra).toHaveURL(/\/presupuesto$/);
    await otra.close();
    await escribirYGuardar(page, '800');
    await expect(page.getByText(/Este valor cambió mientras lo editabas/)).toBeVisible();
    await expect(page.getByText('El valor actual de Asignado es $700.00.')).toBeVisible();
    // "Usar el valor actual" conserva lo escrito y la siguiente vez se envía
    await page.getByRole('button', { name: 'Usar el valor actual' }).click();
    await expect(campoMonto(page)).toHaveValue('800');
    await guardar(page).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Super', 1), 80000);
  });

  test('PRU-E2E-PRES-137 [CA-10.8] abrir asignar con un período cerrado llega al detalle de la categoría con el motivo periodo_cerrado', async ({
    page,
  }) => {
    await sembrarOps(ESC05_PASO2, '2027-02-21');
    await abrir(page, '/presupuesto');
    const super_ = await idDe(page, 'Super');
    await page.goto(`/presupuesto/asignar/${super_}?periodo=${P1}`);
    // El `redirect()` llega con la página ya en streaming: es una navegación del cliente
    await expect(page).toHaveURL(
      (u) =>
        u.pathname === `/presupuesto/categorias/${super_}` &&
        u.search === `?periodo=${P1}&motivo=periodo_cerrado`,
    );
  });
});
