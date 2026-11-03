// FT-25 Edición completa (06 FT-25; 05 §2.6; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17), con el reloj del servidor fijo (DP-04), y llega a la edición como la persona:
// desde la lista de Actividad, al detalle y con «Editar». Los números los pone el motor (PF-3): la prueba comprueba que se dibujan.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { formularios } from '../../../src/textos/formularios.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import { transaccion as t } from '../../../src/textos/transaccion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

async function preparar(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-ACT-25E',
    titulo: 'Semilla de FT-25, edición',
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

/** Abre el detalle de la fila de Actividad que contiene `texto` y entra a «Editar». */
async function irAEditar(page: Page, texto: string): Promise<void> {
  await abrir(page, '/actividad');
  await page.locator('[data-fila-transaccion]').filter({ hasText: texto }).first().click();
  await expect(page.getByRole('link', { name: t.editar })).toBeVisible();
  await page.getByRole('link', { name: t.editar }).click();
  await expect(page.getByRole('heading', { level: 1, name: t.editarTitulo })).toBeVisible();
}

const monto = (page: Page) => page.getByRole('textbox', { name: 'Monto', exact: true });
const guardar = (page: Page) => page.getByRole('button', { name: t.guardar });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const cuentaRadio = (page: Page, nombre: string) =>
  page.getByRole('radiogroup', { name: g.cuenta }).getByRole('radio', { name: nombre });
const terminada = (page: Page) =>
  expect(page.getByRole('heading', { level: 1, name: t.editarTitulo })).toHaveCount(0);

// ESC-17 hasta el paso 2 (hoy 12 feb): D60, T70 y D20 de Super, el 10 feb
const HOY17 = '2027-02-12';
const compra = (cuenta: string, m: number, etiqueta: string, hora?: string): Op => ({
  op: 'OP-20',
  cuenta,
  monto: m,
  categoria: 'Super',
  etiqueta,
  fecha: '2027-02-10',
  ...(hora === undefined ? {} : { registrado: `2027-02-10T${hora}` }),
  hoy: HOY17,
});
const ESC17: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500, hoy: HOY17 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: HOY17 },
  compra('Ahorro', 60, 'D60', '10:00'),
  compra('T', 70, 'T70', '12:00'),
  compra('Ahorro', 20, 'D20'),
];

// ESC-34 paso 1 (hoy 25 feb)
const ESC34: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 500, fecha: '2027-02-01', hoy: '2027-02-01' },
  { op: 'OP-14', categoria: 'Salidas', monto: 50, periodo: 'P1', hoy: '2027-02-01' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 80,
    categoria: 'Salidas',
    fecha: '2027-02-19',
    hoy: '2027-02-19',
    etiqueta: 'debito',
  },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P2' },
];

// ESC-47 hasta el paso 1 (hoy 16 feb): A 40, B 25 y C 12 en T, conciliadas A y B; con Casa para cambiar de categoría
const gastoT = (m: number, etiqueta: string, fecha: string): Op => ({
  op: 'OP-20',
  cuenta: 'T',
  monto: m,
  categoria: 'Super',
  etiqueta,
  fecha,
  hoy: fecha,
});
const ESC47: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Casa' },
  { op: 'OP-21', monto: 100, fecha: '2027-02-01', hoy: '2027-02-01' },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: '2027-02-01' },
  gastoT(40, 'A', '2027-02-03'),
  gastoT(25, 'B', '2027-02-06'),
  gastoT(12, 'C', '2027-02-10'),
  {
    op: 'OP-47',
    cuenta: 'T',
    fecha: '2027-02-15',
    saldo: -75,
    movimientos: [
      { indice: 1, fecha: '2027-02-03', monto: -40 },
      { indice: 2, fecha: '2027-02-06', monto: -25 },
      { indice: 3, fecha: '2027-02-12', monto: -10 },
    ],
    coincidencias: [
      { etiqueta: 'A', indice: 1 },
      { etiqueta: 'B', indice: 2 },
    ],
  },
];

test.describe('PRU-E2E-TX edición de una transacción', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-411 [CA-25.1, ESC-17, ESC-18] RUTA-/actividad/[transaccionId]/editar al cambiar la cuenta de la compra de $70.00 a Ahorro, Super queda en −$50.00 y «Te falta reservar» de T en $0.00', async ({
    page,
  }) => {
    await preparar(ESC17, HOY17);
    await irAEditar(page, '$70.00');
    await cuentaRadio(page, 'Ahorro').click();
    await guardar(page).click();
    await terminada(page);

    await abrir(page, '/presupuesto');
    await esperarMonto(
      page
        .locator('[data-fila-categoria]')
        .filter({ hasText: 'Super' })
        .locator('[data-centavos]')
        .first(),
      -5000,
    );
    const href = await page
      .locator('[data-fila-pago]')
      .filter({ hasText: 'T' })
      .getAttribute('href');
    await abrir(page, href ?? '/presupuesto');
    await esperarMonto(page.locator('[data-falta-reservar] [data-centavos]'), 0);
  });

  test('PRU-E2E-TX-412 [CA-25.2, ESC-34, AV-01] RUTA-/actividad/[transaccionId]/editar al mover el débito de $80.00 al 22 de febrero veo AV-01 con la diferencia de Listo para asignar y, al confirmar, queda en $350.00', async ({
    page,
  }) => {
    await preparar(ESC34, '2027-02-25');
    await irAEditar(page, '$80.00');
    await page.getByLabel(g.fecha).fill('2027-02-22');
    await guardar(page).click();

    await expect(page.getByText(t.avisos['AV-01'] ?? '')).toBeVisible();
    await expect(page.getByText(t.impactoLpa('+$30.00'))).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();

    await terminada(page);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 35000);
  });

  test('PRU-E2E-TX-413 [CA-25.3, ESC-47, AV-16] RUTA-/actividad/[transaccionId]/editar al editar el monto de una compra conciliada a $45.00 veo AV-16 y, al confirmar, queda confirmada con un cambio posterior', async ({
    page,
  }) => {
    await preparar(ESC47, '2027-02-16');
    await irAEditar(page, '$40.00');
    await monto(page).fill('45');
    await guardar(page).click();

    await expect(page.getByText(t.avisos['AV-16'] ?? '')).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();

    await expect(page.locator('[data-cambios-posteriores]')).toContainText(t.motivos.monto);
    await expect(page.getByText('Conciliada con el estado de cuenta')).toHaveCount(0);
  });

  test('PRU-E2E-TX-414 [CA-25.4, P12] RUTA-/actividad/[transaccionId]/editar al cambiar solo la categoría de una compra conciliada sigue conciliada y no registra un cambio posterior', async ({
    page,
  }) => {
    await preparar(ESC47, '2027-02-16');
    await irAEditar(page, '$40.00');
    await page
      .getByRole('radiogroup', { name: g.categoriaDeParte('1') })
      .getByRole('radio', { name: 'Casa' })
      .click();
    await guardar(page).click();
    await page.getByRole('button', { name: t.confirmar }).click();

    await terminada(page);
    await expect(page.getByText('Conciliada con el estado de cuenta')).toBeVisible();
    await expect(page.locator('[data-cambios-posteriores]')).toHaveCount(0);
  });

  test('PRU-E2E-TX-415 [CA-25.5, CB-30] RUTA-/actividad/[transaccionId]/editar con una devolución vinculada la cuenta está deshabilitada y dice por qué', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'Corriente' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Super', etiqueta: 'compra' },
        { op: 'OP-33', monto: 10, compra: 'compra' },
      ],
      '2027-02-12',
    );
    await irAEditar(page, '$40.00');
    await expect(cuentaRadio(page, 'Corriente')).toBeDisabled();
    await expect(page.getByText(/devoluci/i)).toBeVisible();
  });

  test('PRU-E2E-TX-416 [CA-25.6, CB-03] RUTA-/actividad/[transaccionId]/editar al bajar a $10.00 una parte por cobrar con $15.00 cobrados se rechaza con linea_menor_que_eventos y no cambia nada', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        {
          op: 'OP-20',
          cuenta: 'Ahorro',
          monto: 50,
          lineas: [
            { categoria: 'Super', monto: 20 },
            { deudor: 'Ana', monto: 30 },
          ],
          etiqueta: 'cobro',
        },
        { op: 'OP-31', cobro: 'cobro', monto: 15 },
      ],
      '2027-02-12',
    );
    await irAEditar(page, '$50.00');
    await page.getByRole('textbox', { name: g.montoDeParte('1') }).fill('40');
    await page.getByRole('textbox', { name: g.montoDeParte('2') }).fill('10');
    await guardar(page).click();

    await expect(page.getByText(/\$15\.00 cobrado/)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: t.editarTitulo })).toBeVisible();
  });

  test('PRU-E2E-TX-417 [CA-25.7] RUTA-/actividad/[transaccionId]/editar si otra pestaña editó la transacción después de abrir el flujo, al enviar responde conflicto_desactualizado', async ({
    page,
    context,
  }) => {
    await preparar(ESC17, HOY17);
    await irAEditar(page, '$70.00');

    const otra = await context.newPage();
    await otra.bringToFront();
    await irAEditar(otra, '$70.00');
    await otra.getByRole('textbox', { name: g.comercio }).fill('Tienda');
    await otra.getByRole('button', { name: t.guardar }).click();
    await terminada(otra);
    await page.bringToFront();

    await page.getByRole('textbox', { name: g.comercio }).fill('Otro');
    await guardar(page).click();
    await expect(page.getByRole('button', { name: formularios.usarValorActual })).toBeVisible();
  });
});
