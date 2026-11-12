// FT-47 Condonar (06 FT-47; 05 §2; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones reales de un
// escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y llega a la condonación como la persona: desde Por cobrar, con
// «Condonar» de la partida. Los números los pone el motor (PF-3): la prueba comprueba que se dibujan en Presupuesto, en la categoría de
// pago y en Por cobrar. Completa el CA-19.3 de FT-19 (DT-27): que la interfaz no deja condonar hacia una archivada y propone elegir
// una activa; el rechazo `categoria_archivada` de la operación lo prueba la integración (PRU-INT-CATEG-110).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { elegirOpcion, seleccion } from '../../ayudas/seleccion-nativa.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { porCobrarCondonar as t } from '../../../src/textos/por-cobrar-condonar.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

/** Siembra las operaciones en `hoy` y deja el reloj del servidor en ese día. */
async function preparar(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CONDONAR',
    titulo: 'Semilla de FT-47, condonar',
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

/** De Por cobrar al flujo de condonar, con el «Condonar» de la partida (la app lo abre superpuesto). */
async function irACondonar(page: Page, deudor: string): Promise<void> {
  await abrir(page, '/por-cobrar');
  await page.getByRole('link', { name: /^Condonar / }).click();
  await expect(page.getByRole('dialog', { name: t.titulo(deudor) })).toBeVisible();
  await esperarHidratacion(page);
}

const monto = (page: Page) => page.getByRole('textbox', { name: t.monto, exact: true });
const condonar = (page: Page) => page.getByRole('button', { name: /^Condonar \$/ });
const disponible = (page: Page, nombre: string) =>
  page
    .locator('[data-fila-categoria]')
    .filter({ hasText: nombre })
    .locator('[data-centavos]')
    .first();
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const faltaReservar = (page: Page) =>
  page.locator('[data-fila-pago]').first().locator('[data-centavos]').first();
const disponibleDePago = (page: Page) =>
  page.locator('[data-numeros="periodo"] [data-numero="disponible"] [data-centavos]');

// ESC-21 hasta el paso 2 (hoy 10 feb): $60.00 con débito, $30.00 por cobrar a Beto y Beto ya pagó $10.00; Ropa sin asignar
const ESC21: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Ropa' },
  { op: 'OP-21', monto: 200 },
  { op: 'OP-14', categoria: 'Salidas', monto: 50, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 60,
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Salidas', monto: 30 },
      { deudor: 'Beto', monto: 30 },
    ],
  },
  { op: 'OP-31', cobro: 'compartida', monto: 10 },
];
// ESC-23 hasta el paso 2 (hoy 12 feb): $120.00 con T el 5 feb, $60.00 por cobrar a Beto, y Beto pagó $20.00 el 8 feb
const ESC23: Op[] = [
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
  { op: 'OP-31', cobro: 'compartida', monto: 20, fecha: '2027-02-08' },
];
// ESC-20 hasta el paso 3 (hoy 10 feb): Ana debe $15.00 de una compra de $50.00 con débito
const ESC20_PASO3: Op[] = [
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
  { op: 'OP-31', cobro: 'compartida', monto: 10 },
];
// ESC-44 hasta el paso 1 (hoy 5 mar), con una compra compartida de $20.00 hecha en Gimnasio antes de archivarla ($10.00 por cobrar a Ana)
// y una categoría activa, Ropa: la categoría de la compra queda archivada
const ESC44: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gimnasio' },
  { op: 'OP-07', categoria: 'Ropa' },
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
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 20,
    fecha: '2027-03-01',
    etiqueta: 'ana',
    lineas: [
      { categoria: 'Gimnasio', monto: 10 },
      { deudor: 'Ana', monto: 10 },
    ],
  },
  {
    op: 'OP-09',
    categoria: 'Gimnasio',
    destino: 'LPA',
    devolverFuturas: true,
    desactivar: ['gimnasio'],
  },
];

test.describe('PRU-E2E-COBRO condonar', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-COBRO-106 [CA-47.1, ESC-21, AV-02] RUTA-/por-cobrar/condonar/[lineaId] con el paso 2 de ESC-21, al condonar $20.00 a Ropa Listo para asignar sube a $150.00, Ropa queda en −$20.00 con AV-02 y «En camino» en $0.00; al cierre Listo para asignar baja a $130.00', async ({
    page,
  }) => {
    await preparar(ESC21, '2027-02-10');
    await irACondonar(page, 'Beto');
    await expect(page.getByText(t.hastaAbierto('$20.00'))).toBeVisible();
    await elegirOpcion(page, t.categoria, 'Ropa');
    await expect(monto(page)).toHaveValue('20.00');
    await condonar(page).click();
    await expect(page.locator('[data-aviso="AV-02"]')).toHaveText(t.avisos['AV-02'] ?? '');
    await page.getByRole('button', { name: t.listo, exact: true }).click();

    await abrir(page, '/por-cobrar?cerrados=1');
    // Sin nada en camino la pantalla muestra «Nadie te debe nada» y no dibuja «En camino» (en $0.00)
    await expect(page.locator('[data-en-camino]')).toHaveCount(0);
    await expect(page.getByText('Nadie te debe nada')).toBeVisible();
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 15000);
    await esperarMonto(disponible(page, 'Ropa'), -2000);
    await esperarMonto(disponible(page, 'Salidas'), 2000);

    fijarRelojServidor('2027-02-21T10:00:00-06:00');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 13000);
  });

  test('PRU-E2E-COBRO-107 [CA-47.2, ESC-23, AV-03] con el paso 2 de ESC-23, al condonar $40.00 a Salidas, Salidas queda en $0.00, Pago T en $100.00 y «Te falta reservar» en $20.00', async ({
    page,
  }) => {
    await preparar(ESC23, '2027-02-12');
    await irACondonar(page, 'Beto');
    await expect(page.getByText(t.hastaAbierto('$40.00'))).toBeVisible();
    await expect(seleccion(page, t.categoria)).toHaveValue(/.+/); // propone Salidas, la de la compra
    await condonar(page).click();
    await expect(page.getByRole('dialog')).toHaveCount(0); // sin sobregiro no hay aviso: el flujo se cierra solo

    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Salidas'), 0);
    await esperarMonto(faltaReservar(page), 2000);
    const href = await page
      .locator('[data-fila-pago]')
      .filter({ hasText: 'T' })
      .getAttribute('href');
    if (href === null) throw new Error('no hay una fila de pago de «T» en Presupuesto');
    await abrir(page, href);
    await esperarMonto(disponibleDePago(page), 10000);
  });

  test('PRU-E2E-COBRO-108 [CA-47.3, CB-22] con un saldo abierto de $15.00, condonar $20.00 se rechaza con «Solo quedan $15.00 por cobrar.» y la partida sigue abierta', async ({
    page,
  }) => {
    await preparar(ESC20_PASO3, '2027-02-10');
    await irACondonar(page, 'Ana');
    await expect(page.getByText(t.hastaAbierto('$15.00'))).toBeVisible();
    await monto(page).fill('20');
    await condonar(page).click();
    await expect(page.getByText('Solo quedan $15.00 por cobrar.')).toBeVisible();
    await expect(page.getByRole('dialog', { name: t.titulo('Ana') })).toBeVisible();

    await monto(page).fill('15');
    await condonar(page).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await abrir(page, '/por-cobrar?cerrados=1');
    await expect(page.locator('[data-partida]')).toHaveAttribute('data-partida-estado', 'cerrado');
  });

  test('PRU-E2E-COBRO-109 [CA-47.4, CA-19.3, ESC-44] con Gimnasio archivada, condonar no ofrece Gimnasio ni la propone: pide elegir una categoría activa y con Ropa la condonación se registra', async ({
    page,
  }) => {
    await preparar(ESC44, '2027-03-05');
    await irACondonar(page, 'Ana');
    await expect(page.locator('[data-sin-propuesta]')).toHaveText(t.sinPropuesta);
    await expect(seleccion(page, t.categoria)).toHaveValue('');
    await expect(
      seleccion(page, t.categoria).locator('option', { hasText: 'Gimnasio' }),
    ).toHaveCount(0);

    await condonar(page).click();
    await expect(page.getByText(t.elegirCategoria)).toBeVisible();
    await elegirOpcion(page, t.categoria, 'Ropa');
    await condonar(page).click();
    await expect(page.locator('[data-aviso="AV-02"]')).toBeVisible(); // Ropa no tenía Disponible
    await page.getByRole('button', { name: t.listo, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Ropa'), -1000);
  });
});
