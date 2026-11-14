// PRU-E2E-PWA-820 (TA-597; D-1, D-2 y E5-11 del diseño): los flujos largos con dos bloques naturales van en dos columnas iguales
// en computadora desde 1280 px de ventana, y en una por debajo. Archivar y Fusionar (el impacto K4 a la derecha), Registrar
// devolución (dos secciones con título) y la revisión de Conciliar (lo que coincide a la izquierda, lo que no a la derecha). A
// 1440 × 900 los dos bloques quedan lado a lado con el mismo ancho; a 1024 × 900, uno debajo del otro; nunca hay desplazamiento
// horizontal. La base es el paso 0 de ESC-47 (operaciones reales, DP-17) con el reloj del servidor fijo (DP-04).
import type { Locator, Page } from '@playwright/test';
import { entrarAal2 } from './ayudas/sesion.ts';
import { esperarContenido } from './ayudas/esperas.ts';
import { expect, sembrar, test } from './configuracion/semilla.ts';
import { fijarRelojServidor } from '../../../tools/pruebas/e2e/reloj.ts';
import { conciliar as tc } from '../src/textos/conciliar.ts';
import type { Escenario, Op } from '../../../packages/dominio/escenarios/tipos.ts';

const HOY = '2027-02-16';
const TOLERANCIA = 1.5;
/** Ahorro es la primera cuenta que crea el ejecutor después del grupo Gastos; T, la segunda (ids secuenciales). */
const T = '00000000-0000-4000-8000-000000000003';
const gastoT = (monto: number, etiqueta: string, fecha: string): Op => ({
  op: 'OP-20',
  cuenta: 'T',
  monto,
  categoria: 'Super',
  etiqueta,
  fecha,
  hoy: fecha,
});
/** ESC-47, paso 0: A 40 (3 feb), B 25 (6 feb) y C 12 (10 feb) en la tarjeta T. */
const ESC47_PASO_0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Casa' },
  { op: 'OP-21', monto: 100, fecha: '2027-02-01', hoy: '2027-02-01' },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: '2027-02-01' },
  gastoT(40, 'A', '2027-02-03'),
  gastoT(25, 'B', '2027-02-06'),
  gastoT(12, 'C', '2027-02-10'),
];
/** El estado de cuenta al 15 de febrero: A y B coinciden, D solo está en el estado y C solo en Finn. */
const CSV = [
  'Pro000000000000duct,VISA 1234',
  'Fecha de corte,15/02/2027',
  'Saldo final,75.00',
  'Date,Description,Reference,Amount',
  '03/02/2027,COMPRA A,,40.00',
  '06/02/2027,COMPRA B,,25.00',
  '12/02/2027,COMPRA D,,10.00',
  '',
].join('\n');

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

async function caja(l: Locator, nombre: string) {
  const c = await l.boundingBox();
  if (c === null) throw new Error(`sin caja: ${nombre}`);
  return c;
}

/**
 * Dos columnas: el bloque `derecho` empieza en la mitad del contenido más la mitad de la separación de 36 (columnas iguales) y a la
 * derecha del `izquierdo`. Una: el `derecho` empieza en el borde del contenido, debajo del `izquierdo`.
 */
async function comprobar(
  page: Page,
  nombre: string,
  izquierdo: Locator,
  derecho: Locator,
  columnas: 1 | 2,
): Promise<void> {
  await expect(izquierdo).toBeVisible();
  await expect(derecho).toBeVisible();
  const main = await caja(page.locator('#contenido > main'), `${nombre} contenido`);
  const a = await caja(izquierdo, `${nombre} izquierdo`);
  const b = await caja(derecho, `${nombre} derecho`);
  if (columnas === 2) {
    expect(b.x, `${nombre}: el segundo bloque a la derecha`).toBeGreaterThanOrEqual(a.x + a.width);
    expect(
      Math.abs(b.x - (main.x + main.width / 2 + 18)),
      `${nombre}: dos columnas iguales`,
    ).toBeLessThanOrEqual(TOLERANCIA);
  } else {
    expect(b.y, `${nombre}: el segundo bloque debajo`).toBeGreaterThanOrEqual(a.y + a.height);
    expect(Math.abs(b.x - main.x), `${nombre}: una sola columna`).toBeLessThanOrEqual(TOLERANCIA);
  }
  const desborda = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(desborda, `${nombre}: desplazamiento horizontal`).toBe(false);
}

test.describe('PRU-E2E-PWA flujos largos en dos columnas', () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-820 [CA-E4-5] a 1440 px Archivar, Fusionar, Registrar devolución y la revisión de Conciliar van en dos columnas iguales, a 1024 px en una, y sin desplazamiento horizontal', async ({
    page,
  }) => {
    fijarRelojServidor(`${HOY}T10:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-DOS-COLUMNAS',
      titulo: 'Semilla de los flujos en dos columnas',
      refs: [],
      hoy: HOY,
      estadoInicial: ESC47_PASO_0,
      pasos: [],
    };
    await sembrar(escenario, HOY);
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrir(page, '/presupuesto');
    const super_ = page
      .locator('[data-fila-categoria]')
      .filter({ has: page.getByText('Super', { exact: true }) });
    const id = await super_.getAttribute('data-fila-categoria');
    const k4 = page.locator('[data-impacto-k4]');

    for (const [ancho, columnas] of [
      [1440, 2],
      [1024, 1],
    ] as const) {
      await page.setViewportSize({ width: ancho, height: 900 });

      await abrir(page, `/presupuesto/categorias/${String(id)}/archivar`);
      await comprobar(
        page,
        `${String(ancho)} archivar`,
        page.locator('#contenido > main form > div > div').first(),
        k4,
        columnas,
      );

      await abrir(page, `/presupuesto/categorias/${String(id)}/fusionar`);
      await page.getByLabel('Fusionar con').selectOption({ label: 'Casa' });
      await comprobar(
        page,
        `${String(ancho)} fusionar`,
        page.getByLabel('Fusionar con'),
        k4,
        columnas,
      );

      await abrir(page, '/registrar/devolucion');
      await comprobar(
        page,
        `${String(ancho)} devolución`,
        page.locator('section[aria-labelledby="devolucion-compra"]'),
        page.locator('section[aria-labelledby="devolucion-sin-compra"]'),
        columnas,
      );

      // La revisión puede volver del borrador al abrir de nuevo: el archivo se sube solo si se pide
      await abrir(page, `/cuentas/${T}/conciliar`);
      await expect(page.locator('[data-fecha-corte], [data-zona-archivo]').first()).toBeVisible();
      if ((await page.locator('[data-zona-archivo]').count()) > 0) {
        await page.getByLabel(tc.archivo, { exact: true }).setInputFiles({
          name: 'estado.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(CSV, 'utf8'),
        });
        await page.getByRole('button', { name: tc.revisar }).click();
      }
      await comprobar(
        page,
        `${String(ancho)} conciliar`,
        page.locator('[data-fecha-corte]'),
        page.locator('[data-solo-en-estado]').first(),
        columnas,
      );
    }
  });
});
