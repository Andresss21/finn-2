// FT-14 Detalle de categoría: reparto, calendario e historial (06 FT-14; 05 §2.3 y §7; 07 §17: una pantalla, una navegación o un
// flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones reales de un escenario de 01 §8 (DP-17) o de la
// semilla de Restaurantes de A.7, con el reloj del servidor fijo (DP-04), y abre la pantalla como la persona. Los números los
// pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Locator, Page } from '@playwright/test';

const RUTA = '/presupuesto';
const P1 = '2027-01-21';

// Las operaciones de 01 §8: ESC-17 hasta los pasos 1 y 2 (hoy 12 feb), ESC-19 hasta el paso 2 (hoy 10 feb) y ESC-44 hasta el
// paso 2 (hoy 5 mar). Las E2E no importan datos del dominio (solo tipos), así que las copian como las de FT-09.
const ESC17_BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
];
const ESC17_PASO1: Op[] = [
  ...ESC17_BASE,
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 60,
    categoria: 'Super',
    etiqueta: 'D60',
    fecha: '2027-02-10',
    registrado: '2027-02-10T10:00',
  },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 70,
    categoria: 'Super',
    etiqueta: 'T70',
    fecha: '2027-02-10',
    registrado: '2027-02-10T12:00',
  },
];
const ESC17_PASO2: Op[] = [
  ...ESC17_PASO1,
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 20,
    categoria: 'Super',
    etiqueta: 'D20',
    fecha: '2027-02-10',
  },
];
const ESC19_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Mascota', monto: 20, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 150,
    lineas: [
      { categoria: 'Super', monto: 110 },
      { categoria: 'Mascota', monto: 40 },
    ],
  },
];
const ESC44_PASO2: Op[] = [
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
// Restaurantes de A.7 (05 A.7 [F7]; `estado-a7-restaurantes.ts`): seis períodos de historia y el período activo del 21/09 al
// 20/10/2026, con su gasto del 23/09 al 13/10. Cada operación lleva el día en que se hizo.
const HISTORIA: readonly (readonly [string, number, number])[] = [
  ['2026-03-21', 100, 88.2],
  ['2026-04-21', 102, 101.5],
  ['2026-05-21', 100, 96.4],
  ['2026-06-21', 100, 112.2],
  ['2026-07-21', 120, 104.75],
  ['2026-08-21', 99.95, 118.9],
];
const gastoA7 = (cuenta: string, monto: number, fecha: string): Op => ({
  op: 'OP-20',
  cuenta,
  monto,
  categoria: 'Restaurantes',
  fecha,
  hoy: fecha,
});
const A7_RESTAURANTES: Op[] = [
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
    hoy: '2026-03-21',
  },
  { op: 'OP-07', categoria: 'Restaurantes', hoy: '2026-03-21' },
  ...HISTORIA.flatMap(([inicio, asignado, gastado]): Op[] => [
    { op: 'OP-14', categoria: 'Restaurantes', monto: asignado, hoy: inicio },
    gastoA7('Cuenta corriente', gastado, `${inicio.slice(0, 8)}28`),
  ]),
  { op: 'OP-14', categoria: 'Restaurantes', monto: 120, hoy: '2026-09-21' },
  gastoA7('Cuenta corriente', 42.1, '2026-09-23'),
  gastoA7('Visa Oro', 25.6, '2026-09-30'),
  gastoA7('Cuenta corriente', 8.75, '2026-10-05'),
  gastoA7('Cuenta corriente', 23.05, '2026-10-08'),
  gastoA7('Cuenta corriente', 28.3, '2026-10-11'),
  gastoA7('Cuenta corriente', 18.5, '2026-10-13'),
];

// Tres gastos en tres días del primer período: $10.00, $40.00 y $20.00 (CA-14.8).
const TRES_DIAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 200, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 10, categoria: 'Super', fecha: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Super', fecha: '2027-01-27' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Super', fecha: '2027-02-02' },
];
const SIN_GASTOS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
];
/** Siembra las operaciones con `hoy` y deja el reloj del servidor en `hoyServidor` (por defecto, el mismo día). */
async function sembrarOps(ops: Op[], hoy: string, hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-DETALLE-CATEGORIA',
    titulo: 'Semilla de FT-14',
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
/** El id de una categoría, tomado de su fila en `/presupuesto`. */
async function idDe(page: Page, nombre: string): Promise<string> {
  await abrir(page, RUTA);
  const id = await page
    .locator('[data-fila-categoria]')
    .filter({ hasText: nombre })
    .getAttribute('data-fila-categoria');
  if (id === null) throw new Error(`no hay una fila de «${nombre}» en Presupuesto`);
  return id;
}
const abrirDetalle = async (page: Page, nombre: string, consulta = ''): Promise<string> => {
  const id = await idDe(page, nombre);
  await abrir(page, `${RUTA}/categorias/${id}${consulta}`);
  return id;
};
const consumos = (page: Page) => page.locator('[data-consumo]');
/** Los montos de una fila de consumo, en orden: cubierto, [no cubierto] y neto. */
const montos = (fila: Locator) => fila.locator('[data-centavos]');
const sobregiro = (page: Page) => page.locator('[data-sobregiro]');

test.describe('PRU-E2E-PRES detalle de categoría', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-107 [CA-14.1, ESC-17] con el paso 1 de ESC-17 Super muestra el débito de $60.00 cubierto, la tarjeta de $70.00 con $40.00 cubiertos y $30.00 no, y un sobregiro de tarjeta de $30.00', async ({
    page,
  }) => {
    await sembrarOps(ESC17_PASO1, '2027-02-12');
    await abrirDetalle(page, 'Super');
    await expect(consumos(page)).toHaveCount(2);
    await expect(consumos(page).nth(0)).toContainText('Débito');
    await expect(montos(consumos(page).nth(0))).toHaveCount(2);
    await esperarMonto(montos(consumos(page).nth(0)).nth(0), 6000);
    await expect(consumos(page).nth(1)).toContainText('Tarjeta');
    await expect(montos(consumos(page).nth(1))).toHaveCount(3);
    await esperarMonto(montos(consumos(page).nth(1)).nth(0), 4000);
    await esperarMonto(montos(consumos(page).nth(1)).nth(1), 3000);
    await esperarMonto(montos(consumos(page).nth(1)).nth(2), 7000);
    await expect(sobregiro(page)).toHaveAttribute('data-sobregiro', 'tarjeta');
    await esperarMonto(sobregiro(page).locator('[data-centavos]').first(), 3000);
  });

  test('PRU-E2E-PRES-108 [CA-14.2, ESC-17] con el paso 2 de ESC-17 el débito olvidado de $20.00 queda al final, no cubierto, y el sobregiro es mixto: tarjeta $30.00 y débito $20.00', async ({
    page,
  }) => {
    await sembrarOps(ESC17_PASO2, '2027-02-12');
    await abrirDetalle(page, 'Super');
    await expect(consumos(page)).toHaveCount(3);
    const ultima = consumos(page).nth(2);
    await expect(ultima).toContainText('Débito');
    await expect(montos(ultima)).toHaveCount(3);
    await esperarMonto(montos(ultima).nth(0), 0);
    await esperarMonto(montos(ultima).nth(1), 2000);
    await expect(sobregiro(page).first()).toHaveAttribute('data-sobregiro', 'mixto');
    await expect(sobregiro(page).locator('[data-centavos="3000"]').first()).toBeVisible();
    await expect(sobregiro(page).locator('[data-centavos="2000"]').first()).toBeVisible();
  });

  test('PRU-E2E-PRES-109 [CA-14.3, ESC-19] con el paso 2 de ESC-19 la línea de $110.00 de la compra con T en Super muestra $100.00 cubiertos y $10.00 no cubiertos', async ({
    page,
  }) => {
    await sembrarOps(ESC19_PASO2, '2027-02-10');
    await abrirDetalle(page, 'Super');
    await expect(consumos(page)).toHaveCount(1);
    await expect(montos(consumos(page))).toHaveCount(3);
    await esperarMonto(montos(consumos(page)).nth(0), 10000);
    await esperarMonto(montos(consumos(page)).nth(1), 1000);
    await esperarMonto(montos(consumos(page)).nth(2), 11000);
  });

  test('PRU-E2E-PRES-110 [CA-14.6, ESC-17] con un sobregiro mixto Presupuesto muestra los dos indicadores por su nombre sin los montos de cada parte y, al tocar la fila, el detalle los trae', async ({
    page,
  }) => {
    await sembrarOps(ESC17_PASO2, '2027-02-12');
    await abrir(page, RUTA);
    const fila = page.locator('[data-fila-categoria]').filter({ hasText: 'Super' });
    await expect(fila.locator('[data-estado="problema"]')).toHaveText(
      'Sobregiro con débito o efectivo',
    );
    await expect(fila.locator('[data-estado="deuda-sin-respaldo"]')).toHaveText(
      'Deuda sin reservar',
    );
    await expect(fila).not.toContainText('$30.00');
    await expect(fila).not.toContainText('$20.00');
    await fila.getByRole('link', { name: /Super/ }).first().click();
    await expect(page).toHaveURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);
    await expect(sobregiro(page).locator('[data-centavos="3000"]').first()).toBeVisible();
    await expect(sobregiro(page).locator('[data-centavos="2000"]').first()).toBeVisible();
  });

  test('PRU-E2E-PRES-111 [CA-14.4, CA-14.8] con gasto de $10.00, $40.00 y $20.00 en tres días el calendario muestra esos 3 días con intensidad 2,500, 10,000 y 5,000 y la tabla trae las mismas cifras', async ({
    page,
  }) => {
    await sembrarOps(TRES_DIAS, '2027-02-10');
    await abrirDetalle(page, 'Super');
    const dias = page.locator('[data-calendario] button[data-dia]');
    await expect(dias).toHaveCount(3);
    await expect(dias.nth(0)).toHaveAttribute('data-intensidad', '2500');
    await expect(dias.nth(1)).toHaveAttribute('data-intensidad', '10000');
    await expect(dias.nth(2)).toHaveAttribute('data-intensidad', '5000');
    const tabla = page.locator('[data-seccion="calendario"] tbody tr');
    await expect(tabla).toHaveCount(3);
    for (const [k, centavos] of [1000, 4000, 2000].entries())
      await esperarMonto(tabla.nth(k).locator('[data-centavos]'), centavos);
    // Tocar un día deja solo sus consumos
    await dias.nth(1).click();
    await expect(consumos(page)).toHaveCount(1);
    await esperarMonto(montos(consumos(page)).last(), 4000);
    await page.getByRole('button', { name: 'Ver todos los días' }).click();
    await expect(consumos(page)).toHaveCount(3);
  });

  test('PRU-E2E-PRES-112 [CA-14.7, CA-14.9] el detalle de Restaurantes de A.7 trae «Cubrir $26.30», que abre asignar de la categoría sin llevar ningún monto, y «Se pasó 2 de 6» con sus 6 períodos', async ({
    page,
  }) => {
    await sembrarOps(A7_RESTAURANTES, '2026-03-21', '2026-10-15');
    const id = await abrirDetalle(page, 'Restaurantes');
    await esperarMonto(page.locator('main header [data-centavos]').first(), -2630);
    await expect(sobregiro(page)).toHaveAttribute('data-sobregiro', 'debito');
    const cubrir = page.getByRole('link', { name: /^Cubrir/ });
    // El enlace no lleva ningún monto: $146.30 lo calcula el servidor en Asignar (`rapida.cubrirSobregiro`, CA-12.9)
    await expect(cubrir).toHaveAttribute('href', `/presupuesto/asignar/${id}`);
    await esperarMonto(cubrir.locator('[data-centavos]'), 2630);
    // El reparto de A.7: 6 consumos en orden, el de $28.30 con $20.50 cubiertos y $7.80 no
    await expect(consumos(page)).toHaveCount(6);
    await expect(consumos(page).nth(4)).toHaveAttribute('data-consumo', '2026-10-11');
    await esperarMonto(montos(consumos(page).nth(4)).nth(0), 2050);
    await esperarMonto(montos(consumos(page).nth(4)).nth(1), 780);
    await expect(page.locator('[data-se-paso]')).toHaveText('Se pasó 2 de 6');
    await expect(page.locator('[data-historial] tbody tr')).toHaveCount(6);
  });

  test('PRU-E2E-PRES-240 [CH-140] el detalle de Restaurantes trae la cifra «Sobregiro $26.30» en la rejilla, la insignia de fecha de cada consumo y las acciones de asignar y mover', async ({
    page,
  }) => {
    await sembrarOps(A7_RESTAURANTES, '2026-03-21', '2026-10-15');
    await abrirDetalle(page, 'Restaurantes');
    const cifras = page.locator('[data-numeros] > div');
    await expect(cifras).toHaveCount(6);
    await expect(cifras.last()).toContainText('Sobregiro');
    await esperarMonto(montos(cifras.last()), 2630);
    const insignia = consumos(page).nth(4).locator('[data-insignia-fecha]');
    await expect(insignia).toHaveText('oct11');
    const acciones = page.getByRole('navigation', { name: 'Acciones de la categoría' });
    await expect(acciones.getByRole('link')).toHaveText(['Asignar', 'Mover dinero']);
  });

  test('PRU-E2E-PRES-113 una categoría sin consumos en el período dice «Sin gastos en este período»', async ({
    page,
  }) => {
    await sembrarOps(SIN_GASTOS, '2027-02-10');
    await abrirDetalle(page, 'Super');
    await expect(page.getByText('Sin gastos en este período')).toBeVisible();
    await expect(page.locator('[data-historial="vacio"]')).toBeVisible();
  });

  test('PRU-E2E-PRES-114 con P1 cerrado el detalle de Super lo dice, no ofrece asignar ni mover y "atrás" vuelve al activo', async ({
    page,
  }) => {
    await sembrarOps(
      [
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
      ],
      '2027-02-21',
    );
    await abrirDetalle(page, 'Super', `?periodo=${P1}`);
    await expect(page.locator('[data-selector-periodo="cerrado"]')).toBeVisible();
    await expect(page.getByText('Este período está cerrado')).toBeVisible();
    await expect(page.getByRole('link', { name: /^Asignar/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Mover dinero' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Cubrir|^Reservar/ })).toHaveCount(0);
    // [CH-109] El de la pantalla y, en teléfono, también el de la barra del marco: los dos vuelven al período que se veía.
    for (const volver of await page.getByRole('link', { name: 'Volver a Presupuesto' }).all())
      await expect(volver).toHaveAttribute('href', `/presupuesto?periodo=${P1}`);
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Volver a Presupuesto' }),
    ).toHaveAttribute('href', `/presupuesto?periodo=${P1}`);
  });

  test('PRU-E2E-PRES-115 [ESC-44, AV-14] una categoría archivada con $25.00 ofrece sacar el dinero y desarchivar, y al desarchivar vuelve a ofrecer asignar', async ({
    page,
  }) => {
    await sembrarOps(ESC44_PASO2, '2027-03-05');
    await abrir(page, RUTA);
    const id = await page.locator('[data-archivada]').getAttribute('data-archivada');
    await abrir(page, `${RUTA}/categorias/${id}`);
    await expect(page.getByText('Categoría archivada')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sacar el dinero' })).toHaveAttribute(
      'href',
      `/presupuesto/categorias/${id}/sacar`,
    );
    await expect(page.getByRole('link', { name: /^Asignar/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Desarchivar' }).click();
    await expect(page.getByRole('link', { name: 'Asignar', exact: true })).toBeVisible();
    await expect(page.getByText('Categoría archivada')).toHaveCount(0);
    // Con Disponible distinto de cero, archivar de nuevo queda deshabilitado con su motivo
    // (CH-115: «Archivar» vive en «Más acciones», deshabilitada con su motivo)
    await page.getByRole('button', { name: 'Más acciones' }).click();
    await expect(page.getByRole('menuitem', { name: /^Archivar/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(
      page.getByText('No se puede archivar: tiene Disponible distinto de cero.'),
    ).toBeVisible();
  });

  test('PRU-E2E-PRES-116 un id que no existe dice «Esto ya no existe.»', async ({ page }) => {
    await sembrarOps(SIN_GASTOS, '2027-02-10');
    await abrir(page, `${RUTA}/categorias/00000000-0000-4000-8000-000000000001`);
    await expect(page.getByText('Esto ya no existe.')).toBeVisible();
  });
});
