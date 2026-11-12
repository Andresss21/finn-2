// FT-32 Cashback, avance y transferencia de deuda (06 FT-32; 05 §2.4; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada
// con las operaciones reales de un paso de ESC-14 (01 §8, DP-17) y del reloj del servidor fijo (DP-04), y hace el movimiento del paso
// siguiente como la persona, en `/registrar/entrada-tarjeta`, `/registrar/avance` o `/registrar/transferencia-deuda`. Los números los
// pone el motor (PF-3): la prueba comprueba que se dibujan en la categoría de pago, en Inicio y en el detalle de Listo para asignar.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { registrarTarjeta as t } from '../../../src/textos/registrar-tarjeta.ts';
import { registrarTipo as c0 } from '../../../src/textos/registrar-tipo.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-15';
// ESC-14, pasos 0 a 3 (hoy 15 feb): cada prueba toma los pasos anteriores al movimiento que hace.
const PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-01', cuenta: 'U', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super' },
];
const PASO1: Op[] = [...PASO0, { op: 'OP-27', modalidad: 'entrada', tarjeta: 'T', monto: 30 }];
const PASO2: Op[] = [
  ...PASO1,
  { op: 'OP-27', modalidad: 'avance', tarjeta: 'T', monto: 200, cuenta: 'Ahorro' },
];
const PASO3: Op[] = [
  ...PASO2,
  { op: 'OP-27', modalidad: 'transferencia_deuda', tarjeta: 'T', monto: 100, destino: 'U' },
];

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-MOV-TARJETA',
    titulo: 'Semilla de FT-32',
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

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const cuenta = (page: Page, grupo: string, nombre: string) =>
  page.getByRole('radiogroup', { name: grupo }).getByRole('radio', { name: nombre, exact: true });
/** Abre la categoría de pago de la tarjeta `nombre`, tocando su fila en Presupuesto. */
async function abrirPago(page: Page, nombre: string): Promise<void> {
  await abrir(page, '/presupuesto');
  const href = await page
    .locator('[data-fila-pago]')
    .filter({ hasText: new RegExp(`\\b${nombre}\\b`) })
    .getAttribute('href');
  if (href === null) throw new Error(`no hay una fila de pago de «${nombre}» en Presupuesto`);
  await abrir(page, href);
}
const faltaReservar = (page: Page, centavos: number) =>
  expect(page.locator('[data-falta-reservar]')).toHaveAttribute(
    'data-falta-reservar',
    String(centavos),
  );
const billete = (page: Page) =>
  page.locator('[data-resumen-lpa="billete"] [data-centavos]').first();

/** Registra una entrada a la tarjeta T de `monto`, desde la pantalla de la ruta. */
async function entrada(page: Page, monto: string): Promise<void> {
  await abrir(page, '/registrar/entrada-tarjeta');
  await cuenta(page, t.tarjetaEntrada, 'T').click();
  await campo(page, c0.total).fill(monto);
  await page.getByRole('button', { name: t.flujos['entrada-tarjeta'].guardar }).click();
  await expect(
    page.getByRole('heading', { name: t.flujos['entrada-tarjeta'].listo }),
  ).toBeVisible();
}

test.describe('PRU-E2E-TX', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-507 [CA-32.1, ESC-14] con el paso 0 de ESC-14 un cashback de $30.00 en T baja «Te falta reservar» de $100.00 a $70.00 y Listo para asignar sigue en $700.00', async ({
    page,
  }) => {
    await preparar(PASO0);
    await abrirPago(page, 'T');
    await faltaReservar(page, 10000);
    await entrada(page, '30');
    await expect(page.getByTestId('resultado')).toHaveText(t.entradaGuardada('$30.00', 'T'));
    await abrirPago(page, 'T');
    await faltaReservar(page, 7000);
    await abrir(page, '/');
    await esperarMonto(billete(page), 70000);
  });

  test('PRU-E2E-TX-508 [CA-32.2, ESC-14] con el paso 1 de ESC-14 un avance de $200.00 de T a Ahorro lleva Listo para asignar a $900.00, «Te falta reservar» a $270.00 y suma a «Otras entradas»', async ({
    page,
  }) => {
    await preparar(PASO1);
    await abrir(page, '/registrar/avance');
    await esperarHidratacion(page);
    await cuenta(page, t.tarjetaAvance, 'T').click();
    await cuenta(page, t.cuentaAvance, 'Ahorro').click();
    await campo(page, c0.total).fill('200');
    await page.getByRole('button', { name: t.flujos.avance.guardar }).click();
    // [CH-240 E3-22] El avance no pide confirmación: la hoja se cierra y el resultado queda arriba del selector
    await expect(page).toHaveURL(/\/registrar$/);
    await expect(
      page.locator('[data-rol="resultado-avance"]').getByTestId('resultado'),
    ).toContainText(t.avanceResultado('$200.00', 'T', 'Ahorro'));
    await abrir(page, '/');
    await esperarMonto(billete(page), 90000);
    await abrirPago(page, 'T');
    await faltaReservar(page, 27000);
    await abrir(page, '/presupuesto/listo-para-asignar');
    await esperarMonto(
      page
        .locator('[data-seccion="descomposicion"] dl > div')
        .filter({ has: page.getByText('Otras entradas', { exact: true }) })
        .locator('[data-centavos]'),
      20000,
    );
  });

  test('PRU-E2E-TX-509 [CA-32.3, AV-24, ESC-14] con el paso 2 de ESC-14 pasar $100.00 de deuda de T a U deja a T con $170.00 por reservar y a U con $100.00, y AV-24 informa los dos cambios', async ({
    page,
  }) => {
    await preparar(PASO2);
    await abrir(page, '/registrar/transferencia-deuda');
    await cuenta(page, t.tarjetaOrigen, 'T').click();
    await cuenta(page, t.tarjetaDestino, 'U').click();
    await campo(page, c0.total).fill('100');
    await page.getByRole('button', { name: t.flujos['transferencia-deuda'].guardar }).click();
    await expect(page.getByRole('heading', { name: t.revisar })).toBeFocused();
    await expect(page.getByText(t.av24Tarjeta('T', '$270.00', '$170.00'))).toBeVisible();
    await expect(page.getByText(t.av24Tarjeta('U', '$0.00', '$100.00'))).toBeVisible();
    await page.getByRole('button', { name: c0.confirmar }).click();
    await expect(
      page.getByRole('heading', { name: t.flujos['transferencia-deuda'].listo }),
    ).toBeVisible();
    await expect(page.getByTestId('av-24')).toContainText(t.av24Tarjeta('T', '$270.00', '$170.00'));
    await expect(page.getByTestId('av-24')).toContainText(t.av24Tarjeta('U', '$0.00', '$100.00'));
    await abrirPago(page, 'T');
    await faltaReservar(page, 17000);
    await abrirPago(page, 'U');
    await faltaReservar(page, 10000);
  });

  test('PRU-E2E-TX-510 [CA-32.4, AV-08, ESC-14] con el paso 3 de ESC-14 un cashback de $400.00 en T deja a T con reserva excedente de $230.00 y AV-08', async ({
    page,
  }) => {
    await preparar(PASO3);
    await entrada(page, '400');
    await abrirPago(page, 'T');
    const aviso = page.locator('[data-aviso="AV-08"]');
    await expect(aviso).toContainText('reservado');
    await esperarMonto(aviso.locator('[data-centavos]'), 23000);
  });
});
