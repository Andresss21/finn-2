// FT-46 Cobrar (06 FT-46; 05 §2; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones reales de un
// escenario de 01 §8 (DP-17), con el reloj del servidor fijo (DP-04), y recorre `/por-cobrar/cobrar` como la persona: desde Por cobrar,
// con la cuenta, la fecha, el monto y la casilla de reservar. Los números los pone el motor: la prueba solo comprueba que las pantallas
// de otras fichas los dibujan (PF-3). Los CA pendientes de punta a punta de FT-25, FT-26 y FT-29 (DT-27) cobran por este flujo.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { categoriaPago } from '../../../src/textos/categoria-pago.ts';
import { porCobrarCobrar as t } from '../../../src/textos/por-cobrar-cobrar.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import { transaccion as tx } from '../../../src/textos/transaccion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-20 hasta el paso 2 (hoy 10 feb): compra de $50.00 con débito, $25.00 por cobrar a Ana.
const ESC20_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Super', monto: 25 },
      { deudor: 'Ana', monto: 25 },
    ],
  },
];
// ESC-22 paso 1 (hoy 10 feb): compra de $80.00 con la tarjeta T, $40.00 por cobrar a Ana.
const ESC22_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 80,
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Super', monto: 40 },
      { deudor: 'Ana', monto: 40 },
    ],
  },
];
// ESC-23 paso 1 (hoy 12 feb): compra de $120.00 con T el 5 feb, $60.00 por cobrar a Beto.
const ESC23_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 120,
    fecha: '2027-02-05',
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Salidas', monto: 60 },
      { deudor: 'Beto', monto: 60 },
    ],
  },
];
// ESC-48 paso 1, con reserva (hoy 10 feb): Pago T tiene los $100.00 de la deuda; $25.00 por cobrar a Ana con débito.
const ESC48_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    etiqueta: 'cobro',
    lineas: [
      { categoria: 'Super', monto: 25 },
      { deudor: 'Ana', monto: 25 },
    ],
  },
];
// ESC-48 alternativa sr1, sin reserva: la compra con T fue de Salidas, que no tiene asignado.
const ESC48_SR1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Salidas' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    etiqueta: 'cobro',
    lineas: [
      { categoria: 'Super', monto: 25 },
      { deudor: 'Ana', monto: 25 },
    ],
  },
];
// Una compra de $50.00 con $30.00 por cobrar a Ana (CA-25.6 y CA-26.4).
const COMPRA_DE_50: Op[] = [
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
];

async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-COBRAR',
    titulo: 'Semilla de FT-46',
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

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const botonCobrar = (page: Page) => page.getByRole('button', { name: /^Cobrar \$/ });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const numero = (page: Page, clave: string) =>
  page.locator(`[data-numeros="periodo"] [data-numero="${clave}"] [data-centavos]`);
const faltaReservar = (page: Page) => page.locator('[data-falta-reservar] [data-centavos]');

/** Desde Por cobrar, toca «Cobrar» de la única partida abierta y espera a que el formulario hidrate. */
async function irACobrar(page: Page): Promise<void> {
  await abrir(page, '/por-cobrar');
  await page.getByRole('link', { name: /^Cobrar / }).click();
  await expect(botonCobrar(page)).toBeVisible();
}

/** Cobra por el flujo: cuenta (si no es la propuesta), fecha (si no es hoy), monto y, opcionalmente, la casilla de reservar. */
async function cobrar(
  page: Page,
  datos: { monto?: string; cuenta?: string; fecha?: string; sinReservar?: boolean },
): Promise<void> {
  await irACobrar(page);
  if (datos.cuenta !== undefined) await elegirOpcion(page, t.cuenta, datos.cuenta);
  if (datos.fecha !== undefined) await campo(page, t.fecha).fill(datos.fecha);
  if (datos.monto !== undefined) await campo(page, t.monto).fill(datos.monto);
  if (datos.sinReservar === true) await page.getByRole('checkbox').uncheck();
  await botonCobrar(page).click();
  await expect(page.getByRole('heading', { name: t.tituloListo })).toBeVisible();
}

/** Abre la categoría de pago de T desde el enlace del resultado. */
async function verPagoT(page: Page): Promise<void> {
  await page.getByRole('link', { name: t.verCategoria('T') }).click();
  await esperarContenido(page);
}

test.describe('PRU-E2E-COBRO flujo de cobrar', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-COBRO-120 [CA-46.1, ESC-20] RUTA-/por-cobrar/cobrar con el paso 2 de ESC-20 Ana paga $10.00 y Listo para asignar es $685.00 y «En camino» $15.00; con $20.00 más, Listo para asignar es $705.00 y la partida queda cerrada', async ({
    page,
  }) => {
    await sembrarOps(ESC20_PASO2, '2027-02-10');
    await irACobrar(page);
    await abrir(page, page.url()); // una carga completa, como el resto de las E2E que miden el tamaño táctil
    await elegirOpcion(page, t.cuenta, 'Ahorro'); // espera a que React hidrate el flujo
    await page.keyboard.press('Tab'); // el primer Tab muestra «Saltar al contenido» (11.2): se mide ya visible
    await revisarTactil(page);
    await expect(campo(page, t.monto)).toHaveValue('25.00'); // el saldo abierto que propone el servidor
    await campo(page, t.monto).fill('10');
    await expect(botonCobrar(page)).toHaveText(t.cobrarMonto('$10.00'));
    await botonCobrar(page).click();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('$10.00', 'Ana'));
    // El paso 3: la partida abierta baja a $15.00 y Listo para asignar sube a $685.00
    await abrir(page, '/por-cobrar');
    await esperarMonto(page.locator('[data-en-camino] [data-centavos]'), 1500);
    await abrir(page, '/');
    await esperarMonto(lpa(page), 68500);
    // El paso 4: $20.00 más, con $5.00 de excedente
    await cobrar(page, { monto: '20' });
    await abrir(page, '/');
    await esperarMonto(lpa(page), 70500);
    await abrir(page, '/por-cobrar?cerrados=1');
    await expect(page.locator('[data-partida]')).toHaveAttribute('data-partida-estado', 'cerrado');
  });

  test('PRU-E2E-COBRO-121 [CA-46.2, ESC-22, AV-22] con el paso 1 de ESC-22 Ana paga $40.00 a Ahorro con la casilla de reservar marcada: Listo para asignar queda en $700.00, Pago T en $80.00 y «Te falta reservar» en $0.00', async ({
    page,
  }) => {
    await sembrarOps(ESC22_PASO1, '2027-02-10');
    await irACobrar(page);
    await expect(page.getByRole('checkbox')).toBeChecked();
    await expect(page.getByText(t.reservar('$40.00', 'T'))).toBeVisible();
    await botonCobrar(page).click();
    await expect(page.getByRole('heading', { name: t.tituloListo })).toBeVisible();
    await expect(page.getByText(t.avisoAV22('T'))).toHaveCount(0); // ya se reservó en el mismo paso
    await abrir(page, '/');
    await esperarMonto(lpa(page), 70000);
    await abrir(page, '/presupuesto');
    await page.locator('[data-fila-pago]').filter({ hasText: 'T' }).click();
    await esperarContenido(page);
    await esperarMonto(numero(page, 'disponible'), 8000);
    await esperarMonto(faltaReservar(page), 0);
  });

  test('PRU-E2E-COBRO-122 [CA-46.3, ESC-23, AV-22] con el paso 1 de ESC-23 Beto paga $20.00 y la casilla se desmarca: Listo para asignar sube a $420.00 y el resultado propone reservarlo para T', async ({
    page,
  }) => {
    await sembrarOps(ESC23_PASO1, '2027-02-12');
    await cobrar(page, { monto: '20', fecha: '2027-02-08', sinReservar: true });
    await expect(page.getByText(t.avisoAV22('T'))).toBeVisible();
    await expect(page.getByRole('link', { name: t.asignarA('T') })).toBeVisible();
    await abrir(page, '/');
    await esperarMonto(lpa(page), 42000);
  });

  test('PRU-E2E-COBRO-123 [CA-46.4, ESC-48, AV-08] con el paso 1 de ESC-48 con reserva, Ana deposita $30.00 en T: Listo para asignar queda en $700.00, Pago T en $75.00 y T con reserva excedente de $5.00', async ({
    page,
  }) => {
    await sembrarOps(ESC48_PASO1, '2027-02-10');
    await irACobrar(page);
    await elegirOpcion(page, t.cuenta, 'T');
    await expect(page.getByRole('checkbox')).toHaveCount(0); // sin casilla: el depósito en la tarjeta es el pago implícito
    await campo(page, t.monto).fill('30');
    await botonCobrar(page).click();
    await expect(page.getByRole('heading', { name: t.tituloListo })).toBeVisible();
    await verPagoT(page);
    await esperarMonto(numero(page, 'disponible'), 7500);
    await esperarMonto(page.locator('[data-aviso="AV-08"] [data-centavos]'), 500);
    await abrir(page, '/');
    await esperarMonto(lpa(page), 70000);
  });

  test('PRU-E2E-COBRO-124 [CA-46.5, ESC-48, AV-05] con el paso 1 de ESC-48 sin reserva, Ana deposita $30.00 en T: Pago T queda en −$25.00 y aparece AV-05', async ({
    page,
  }) => {
    await sembrarOps(ESC48_SR1, '2027-02-10');
    await cobrar(page, { cuenta: 'T', monto: '30' });
    await verPagoT(page);
    await esperarMonto(numero(page, 'disponible'), -2500);
    await expect(page.locator('[data-aviso="AV-05"]')).toBeVisible();
  });

  test('PRU-E2E-COBRO-125 [CA-46.6, CB-23] una partida que otra pestaña ya cobró entera se rechaza al cobrarla con «no tiene saldo pendiente» y, al volver a abrirla, no se ofrece cobrar', async ({
    page,
    context,
  }) => {
    await sembrarOps(ESC20_PASO2, '2027-02-10');
    await irACobrar(page);
    const ruta = page.url();
    const otra = await context.newPage();
    await abrir(otra, ruta);
    await botonCobrar(otra).click(); // cobra los $25.00 completos: la partida queda cerrada
    await expect(otra.getByRole('heading', { name: t.tituloListo })).toBeVisible();
    await otra.close();
    await campo(page, t.monto).fill('10');
    await botonCobrar(page).click();
    await expect(page.getByText(/no tiene saldo pendiente/)).toBeVisible();
    await expect(page.getByRole('heading', { name: t.tituloListo })).toHaveCount(0);
    await abrir(page, ruta);
    await expect(page.getByRole('heading', { name: t.sinSaldoTitulo })).toBeVisible();
    await expect(botonCobrar(page)).toHaveCount(0);
  });

  test('PRU-E2E-COBRO-126 [CA-46.7, ESC-20, D1, N9] con el paso 4 de ESC-20 cobrado por el flujo, el reporte de ingresos frente a gastos cuenta $1,005.00 de ingresos con el excedente de $5.00 y las restituciones de $25.00 aparte', async ({
    page,
  }) => {
    await sembrarOps(ESC20_PASO2, '2027-02-10');
    await cobrar(page, { monto: '10' });
    await cobrar(page, { monto: '20' });
    await abrir(page, '/reportes/ingresos-gastos');
    const fila = page.locator('[data-reporte] [data-fila="2027-01-21"]');
    await esperarMonto(fila.locator('[data-col="ingresos"] [data-centavos]'), 100500);
    await esperarMonto(fila.locator('[data-col="restituciones"] [data-centavos]'), 2500);
  });

  test('PRU-E2E-COBRO-127 [CA-25.6, CB-03] RUTA-/actividad/[transaccionId]/editar con $15.00 cobrados por el flujo, bajar la parte por cobrar a $10.00 se rechaza con linea_menor_que_eventos', async ({
    page,
  }) => {
    await sembrarOps(COMPRA_DE_50, '2027-02-12');
    await cobrar(page, { monto: '15' });
    await abrir(page, '/actividad');
    await page.locator('[data-fila-transaccion]').filter({ hasText: '$50.00' }).first().click();
    await page.getByRole('link', { name: tx.editar }).click();
    await expect(page.getByRole('heading', { level: 1, name: tx.editarTitulo })).toBeVisible();
    await page.getByRole('textbox', { name: g.montoDeParte('1') }).fill('40');
    await page.getByRole('textbox', { name: g.montoDeParte('2') }).fill('10');
    await page.getByRole('button', { name: tx.guardar }).click();
    await expect(page.getByText(/\$15\.00 cobrado/)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: tx.editarTitulo })).toBeVisible();
  });

  test('PRU-E2E-COBRO-128 [CA-26.4] RUTA-/actividad/[transaccionId]/eliminar una compra con un cobro hecho por el flujo no se elimina: explica transaccion_con_eventos', async ({
    page,
  }) => {
    await sembrarOps(COMPRA_DE_50, '2027-02-12');
    await cobrar(page, { monto: '15' });
    await abrir(page, '/actividad');
    await page.locator('[data-fila-transaccion]').filter({ hasText: '$50.00' }).last().click();
    await page.getByRole('button', { name: 'Más acciones' }).click();
    await page.getByRole('menuitem', { name: tx.eliminar }).click();
    await expect(page.getByRole('heading', { name: tx.noSePuedeEliminar })).toBeVisible();
    await expect(page.locator('[data-eventos]')).toContainText('$15.00');
    await expect(page.getByRole('button', { name: tx.verCambios })).toHaveCount(0);
  });

  test('PRU-E2E-COBRO-129 [CA-29.4, ESC-48, AV-05] con el paso 1 de ESC-48 sin reserva, el cobro de $30.00 depositado en T por el flujo deja en Pago T un pago excedente de $25.00 atribuido a un cobro, con AV-05', async ({
    page,
  }) => {
    await sembrarOps(ESC48_SR1, '2027-02-10');
    await cobrar(page, { cuenta: 'T', monto: '30' });
    await verPagoT(page);
    const aviso = page.locator('[data-aviso="AV-05"]');
    const [antes] = categoriaPago.avisos['AV-05'];
    await expect(aviso).toContainText(antes);
    await esperarMonto(aviso.locator('[data-centavos]'), 2500);
    await expect(page.locator('[data-aviso="AV-04"]')).toHaveCount(0);
  });
});
