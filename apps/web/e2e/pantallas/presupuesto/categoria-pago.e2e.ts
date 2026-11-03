// FT-29 Categoría de pago y «te falta reservar» (07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y abre la pantalla como la persona.
// Los números los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3). Inicio todavía es la página
// provisional: la igualdad con Inicio (CA-29.6) la prueba el dominio (PRU-DOM-TARJ-101).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/presupuesto';

// Las operaciones de 01 §8, copiadas como las de FT-14 (las E2E no importan datos del dominio, solo sus tipos).
const BASE_T: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
];
const ESC04_PASO2: Op[] = [
  ...BASE_T,
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
];
const ESC05_PASO2: Op[] = [
  ...BASE_T,
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super', fecha: '2027-02-10' },
];
const ESC11_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 300 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
  { op: 'OP-20', cuenta: 'T', monto: 50, categoria: 'Salidas' },
  { op: 'OP-23', tarjeta: 'T', monto: 120 },
];
// ESC-48, rama «sin reserva»: sr1 y sr2.
const ESC48_SR2: Op[] = [
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
    lineas: [
      { categoria: 'Super', monto: 25 },
      { deudor: 'Ana', monto: 25 },
    ],
    etiqueta: 'cobro',
  },
  { op: 'OP-31', cobro: 'cobro', monto: 30, cuenta: 'T' },
];
const ESC01_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 300 },
];
const ESC01_PASO3: Op[] = [
  ...ESC01_PASO2,
  { op: 'OP-14', categoria: 'Pago T', monto: 300, periodo: 'P1' },
];
const DOS_TARJETAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', saldo: 300 },
  { op: 'OP-01', cuenta: 'Master', tipo: 'tarjeta', saldo: 150 },
];
const VISA_ORO: Op[] = [
  {
    op: 'OP-01',
    cuenta: 'Cuenta corriente',
    saldo: 3000,
    apertura: '2026-03-21',
    hoy: '2026-03-21',
  },
  {
    op: 'OP-01',
    cuenta: 'Visa Oro',
    tipo: 'tarjeta',
    apertura: '2026-03-21',
    diaCorte: 25,
    diaPago: 15,
    hoy: '2026-03-21',
  },
];

/** Siembra las operaciones con `hoy` y deja el reloj del servidor en `hoyServidor` (por defecto, el mismo día). */
async function sembrarOps(ops: Op[], hoy: string, hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CATEGORIA-PAGO',
    titulo: 'Semilla de FT-29',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
/** Abre la categoría de pago de la tarjeta `nombre`, tocando su fila en Presupuesto. */
async function abrirPago(page: Page, nombre: string): Promise<void> {
  await abrir(page, RUTA);
  const href = await page
    .locator('[data-fila-pago]')
    .filter({ hasText: nombre })
    .getAttribute('href');
  if (href === null) throw new Error(`no hay una fila de pago de «${nombre}» en Presupuesto`);
  await abrir(page, href);
}
const faltaReservar = (page: Page) => page.locator('[data-falta-reservar] [data-centavos]');
const numero = (page: Page, clave: string) =>
  page.locator(`[data-numeros="periodo"] [data-numero="${clave}"] [data-centavos]`);

test.describe('PRU-E2E-PRES categoría de pago de tarjeta', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-170 [CA-29.1, ESC-04] con el paso 2 de ESC-04 Pago T tiene Disponible $100.00, «Te falta reservar» $0.00 y el traslado desde Super de $100.00', async ({
    page,
  }) => {
    await sembrarOps(ESC04_PASO2, '2027-02-10');
    await abrirPago(page, 'T');
    await esperarMonto(numero(page, 'disponible'), 10000);
    await esperarMonto(faltaReservar(page), 0);
    const traslado = page.locator('[data-traslado]');
    await expect(traslado).toHaveCount(1);
    await expect(traslado).toContainText('Super');
    await esperarMonto(traslado.locator('[data-centavos]'), 10000);
  });

  test('PRU-E2E-PRES-171 [CA-29.2, ESC-05] con el paso 2 de ESC-05 Pago T pide reservar $100.00, Super muestra «Deuda sin reservar» y su detalle lo dice con el alcance de la categoría y suma a lo que falta para T', async ({
    page,
  }) => {
    await sembrarOps(ESC05_PASO2, '2027-02-15');
    await abrirPago(page, 'T');
    await esperarMonto(faltaReservar(page), 10000);
    await abrir(page, RUTA);
    const fila = page.locator('[data-fila-categoria]').filter({ hasText: 'Super' });
    await expect(fila).toContainText('Deuda sin reservar');
    const id = await fila.getAttribute('data-fila-categoria');
    await abrir(page, `${RUTA}/categorias/${id}`);
    const sobregiro = page.locator('[data-sobregiro]');
    await expect(sobregiro).toContainText('Deuda sin reservar en Super: $100.00');
    await expect(sobregiro).toContainText('Esta deuda suma a lo que te falta reservar para T');
  });

  test('PRU-E2E-PRES-172 [CA-29.3, ESC-11, AV-04, AV-07] con el paso 2 de ESC-11 el número principal es «Te falta reservar $30.00» y AV-04 por $20.00 va como información secundaria', async ({
    page,
  }) => {
    await sembrarOps(ESC11_PASO2, '2027-02-15');
    await abrirPago(page, 'T');
    await esperarMonto(faltaReservar(page), 3000);
    const aviso = page.locator('[data-aviso="AV-04"]');
    await expect(aviso).toContainText('más de lo reservado');
    await esperarMonto(aviso.locator('[data-centavos]'), 2000);
    await expect(page.locator('[data-falta-reservar] [data-aviso]')).toHaveCount(0);
  });

  test('PRU-E2E-PRES-173 [CA-29.4, ESC-48, AV-05] con el paso 2 de ESC-48 sin reserva el pago excedente de $25.00 se atribuye a un cobro y muestra AV-05', async ({
    page,
  }) => {
    await sembrarOps(ESC48_SR2, '2027-02-10');
    await abrirPago(page, 'T');
    const aviso = page.locator('[data-aviso="AV-05"]');
    await expect(aviso).toContainText('se aplicó a la tarjeta sin reserva');
    await esperarMonto(aviso.locator('[data-centavos]'), 2500);
    await expect(page.locator('[data-aviso="AV-04"]')).toHaveCount(0);
  });

  test('PRU-E2E-PRES-174 [CA-29.5, ESC-01] con el paso 2 de ESC-01 sin asignar nada «Te falta reservar» es $300.00 y, al asignar $300.00 a Pago T (paso 3), $0.00', async ({
    page,
  }) => {
    await sembrarOps(ESC01_PASO2, '2027-02-05');
    await abrirPago(page, 'T');
    await esperarMonto(faltaReservar(page), 30000);
    await sembrarOps(ESC01_PASO3, '2027-02-05');
    await abrirPago(page, 'T');
    await esperarMonto(faltaReservar(page), 0);
    await esperarMonto(numero(page, 'disponible'), 30000);
  });

  test('PRU-E2E-PRES-175 [CA-29.6, AV-07] con deudas en dos tarjetas «Te falta reservar» de cada una es el mismo en Presupuesto y en Cuentas', async ({
    page,
  }) => {
    await sembrarOps(DOS_TARJETAS, '2027-02-05');
    await abrir(page, RUTA);
    const filas = page.locator('[data-fila-pago]');
    await expect(filas).toHaveCount(2);
    const enPresupuesto: Record<string, string | null> = {};
    for (const nombre of ['Visa', 'Master'])
      enPresupuesto[nombre] = await filas
        .filter({ hasText: nombre })
        .locator('[data-centavos]')
        .first()
        .getAttribute('data-centavos');
    expect(enPresupuesto).toEqual({ Visa: '30000', Master: '15000' });
    await abrir(page, '/cuentas');
    for (const nombre of ['Visa', 'Master']) {
      const delante = page.locator('[data-detalle-tarjeta] [data-centavos]').first();
      const trasera = page.locator('[data-billetera] button').filter({ hasText: nombre });
      if ((await trasera.count()) > 0) await trasera.dispatchEvent('click');
      await expect(delante).toHaveAttribute('data-centavos', enPresupuesto[nombre] ?? '');
    }
  });

  test('PRU-E2E-PRES-176 [CA-29.7] en un período futuro las filas de tarjeta de Presupuesto no muestran «Te falta reservar»', async ({
    page,
  }) => {
    await sembrarOps(ESC01_PASO2, '2027-02-05');
    await abrir(page, RUTA);
    await expect(page.locator('[data-fila-pago]')).toContainText('Te falta reservar');
    await abrir(page, `${RUTA}?periodo=2027-02-21`);
    await expect(page.locator('[data-fila-pago]')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('Te falta reservar');
  });

  test('PRU-E2E-PRES-177 [CA-29.8] Visa Oro con fecha de pago el 15/11 dice «Pagá antes del 15/11», el valor de desgloseAlPagar.proximoPago', async ({
    page,
  }) => {
    await sembrarOps(VISA_ORO, '2026-03-21', '2026-10-18');
    await abrirPago(page, 'Visa Oro');
    const fila = page.locator('[data-proximo-pago]');
    await expect(fila).toHaveAttribute('data-proximo-pago', '2026-11-15');
    await expect(fila).toHaveText('Pagá antes del 15/11');
  });
});
