// Recorrido 4.6 «Cerrar con sobregiros» de 06 (REC-4.6; 07 §17: un recorrido es una E2E). Parte del estado sembrado de `estado_4_6`
// (SEM-4.6, hoy 12/02/2027) con las operaciones reales (DP-17) y encadena las pantallas de sus fichas con el reloj de prueba
// alineado (07 §4.1): servidor y navegador saltan juntos al 21/02 en el paso 4, el cierre, sin ninguna operación (01 §7.3). Los
// números los pone el motor (PF-3); la prueba comprueba que cada pantalla dibuja los de 06 §4.6 y, en cada paso, la identidad de saldo
// vista desde Presupuesto (Listo para asignar + Disponibles + te falta reservar = saldo de Ahorro).
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { esperarMonto } from '../ayudas/montos.ts';
import { alinearRelojes, fijarRelojServidor } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as ti } from '../../src/textos/inicio.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-12';
const CIERRE = '2027-02-21';

// `estado_4_6` de recorridos.py (07 §12.4): Ahorro con $1,000.00 el 01/02 y la tarjeta T sin deuda; en P1, Super $100.00, Salidas
// $100.00 y Ropa $80.00; Salidas gasta $150.00 con débito (08/02) y Super $60.00 con débito, $70.00 con T y $20.00 de un débito
// olvidado (fecha 10/02, registrado hoy).
const ESTADO_4_6: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Ropa' },
  { op: 'OP-21', monto: 1000, cuenta: 'Ahorro', fecha: '2027-02-01' },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Ropa', monto: 80, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas', fecha: '2027-02-08' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 60,
    categoria: 'Super',
    fecha: '2027-02-10',
    registrado: '2027-02-10T10:00',
  },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 70,
    categoria: 'Super',
    fecha: '2027-02-10',
    registrado: '2027-02-10T12:00',
  },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Super', fecha: '2027-02-10' },
];

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** El reloj salta en los dos lados a la vez (07 §4.1): es el cierre del período, no una operación. */
async function saltarA(page: Page, dia: string): Promise<void> {
  const instante = `${dia}T10:00:00-06:00`;
  fijarRelojServidor(instante);
  await page.clock.setSystemTime(new Date(instante));
}

const sobregiro = (page: Page, categoria: string) =>
  page.locator('details[data-sobregiro]').filter({ hasText: categoria });
const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
/** Los montos de una fila de categoría: Disponible, Asignado y Gastado, en ese orden (05 §10.8). */
const montoDeFila = (page: Page, nombre: string, n: 0 | 1 | 2) =>
  fila(page, nombre).locator('[data-centavos]').nth(n);
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
/** La fila de pago de la tarjeta: lo que falta reservar y el disponible para pagar. */
const montoDePago = (page: Page, n: 0 | 1) =>
  page.locator('[data-fila-pago] [data-centavos]').nth(n);
const linea = (page: Page, etiqueta: string) =>
  page
    .locator('[data-seccion="descomposicion"] dl > div')
    .filter({ has: page.getByText(etiqueta, { exact: true }) })
    .locator('[data-centavos]');
const consumos = (page: Page) => page.locator('[data-consumo]');
const montos = (f: ReturnType<typeof consumos>) => f.locator('[data-centavos]');

test.describe('PRU-E2E-PRES recorrido 4.6 cerrar con sobregiros', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-460 [REC-4.6, ESC-17, CA-14.2, CA-16.3] desde SEM-4.6 Inicio avisa los sobregiros sin montos, Super reparte el débito olvidado al final, mover $50.00 de Ropa a Salidas baja la reducción a $20.00, el cierre del 21/02 solo baja Listo para asignar $20.00 y asignar $30.00 a Pago T deja $0.00 por reservar', async ({
    page,
  }) => {
    const escenario: Escenario = {
      id: 'SEM-4.6',
      titulo: 'Semilla de 4.6 Cerrar con sobregiros',
      refs: ['REC-4.6'],
      hoy: HOY,
      estadoInicial: ESTADO_4_6,
      pasos: [],
    };
    fijarRelojServidor(`${HOY}T10:00:00-06:00`);
    await sembrar(escenario, HOY);
    await alinearRelojes(page, `${HOY}T10:00:00-06:00`);

    // Paso 1: Inicio. Super (mixto) y Salidas (débito) sobregiradas, sin montos a la vista; T con «Te falta reservar» $30.00
    await abrir(page, '/');
    for (const [categoria, reduccion] of [
      ['Super', '$20.00'],
      ['Salidas', '$50.00'],
    ] as const) {
      const f = sobregiro(page, categoria);
      await expect(f).toBeVisible();
      await expect(f.getByText('Sobregiro con débito o efectivo')).toBeVisible();
      await expect(f.locator('summary [data-centavos]')).toHaveCount(0);
      await f.locator('summary').click();
      await expect(f.getByText(ti.reducira(reduccion), { exact: true })).toBeVisible();
    }
    const falta = page.locator('a[href^="/cuentas/"]').filter({ hasText: 'Te falta reservar' });
    await esperarMonto(falta.locator('[data-centavos]').first(), 3000);

    // Paso 2: el detalle de Super (reparto D2): débito $60.00; T $70.00 con $40.00 cubiertos y $30.00 no; débito olvidado al final
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 72000);
    await esperarMonto(montoDeFila(page, 'Super', 0), -5000);
    await esperarMonto(montoDeFila(page, 'Salidas', 0), -5000);
    await esperarMonto(montoDeFila(page, 'Ropa', 0), 8000);
    await esperarMonto(montoDePago(page, 0), 3000);
    await esperarMonto(montoDePago(page, 1), 4000);
    await fila(page, 'Super').getByRole('link', { name: /Super/ }).first().click();
    await expect(page).toHaveURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);
    await esperarContenido(page);
    await expect(consumos(page)).toHaveCount(3);
    await expect(consumos(page).nth(0)).toContainText('Débito');
    await esperarMonto(montos(consumos(page).nth(0)).nth(0), 6000);
    await expect(consumos(page).nth(1)).toContainText('Tarjeta');
    await esperarMonto(montos(consumos(page).nth(1)).nth(0), 4000);
    await esperarMonto(montos(consumos(page).nth(1)).nth(1), 3000);
    await expect(consumos(page).nth(2)).toContainText('Débito');
    await esperarMonto(montos(consumos(page).nth(2)).nth(0), 0);
    await esperarMonto(montos(consumos(page).nth(2)).nth(1), 2000);
    const mixto = page.locator('[data-sobregiro]').first();
    await expect(mixto).toHaveAttribute('data-sobregiro', 'mixto');
    await expect(mixto.locator('[data-centavos="3000"]').first()).toBeVisible();
    await expect(mixto.locator('[data-centavos="2000"]').first()).toBeVisible();

    // Paso 3: mover $50.00 de Ropa a Salidas (OP-15); LPA no se mueve y la reducción proyectada baja a $20.00
    await abrir(page, '/presupuesto');
    await page.getByRole('link', { name: 'Mover dinero' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Sacar de').selectOption({ label: 'Ropa' });
    await page.getByLabel('Poner en').selectOption({ label: 'Salidas' });
    await page.getByLabel(/Monto a mover/).fill('50');
    await page.getByRole('button', { name: 'Mover', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Salidas', 0), 0);
    await esperarMonto(montoDeFila(page, 'Ropa', 0), 3000);
    await esperarMonto(lpa(page), 72000);
    await abrir(page, '/presupuesto/listo-para-asignar');
    await esperarMonto(page.locator('[data-reduccion-total] [data-centavos]'), 2000);

    // Paso 4: llega el cierre (21/02). LPA baja $20.00 (solo el débito de Super); T sigue con $30.00 por reservar
    await saltarA(page, CIERRE);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 70000);
    await esperarMonto(montoDePago(page, 0), 3000);
    await esperarMonto(montoDeFila(page, 'Ropa', 0), 3000);
    await esperarMonto(montoDePago(page, 1), 4000);

    // Paso 5: asignar $30.00 a Pago T en P2 (OP-14): te falta reservar $0.00, Pago T $70.00, LPA $670.00
    const href = await page.locator('[data-fila-pago]').first().getAttribute('href');
    const idPago = href?.split('?')[0]?.split('/').pop();
    if (idPago === undefined || idPago === '')
      throw new Error('no hay una fila de pago de tarjeta');
    await abrir(page, `/presupuesto/asignar/${idPago}`);
    await page.getByLabel(/Nuevo valor de Asignado/).fill('30');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDePago(page, 0), 0);
    await esperarMonto(montoDePago(page, 1), 7000);
    await esperarMonto(lpa(page), 67000);

    // Paso 6: el detalle de LPA: reducción por sobregiro con débito de P1 $20.00 y la suma exacta de $670.00
    await abrir(page, '/presupuesto/listo-para-asignar');
    await esperarMonto(linea(page, 'Ingresos'), 100000);
    await esperarMonto(linea(page, 'Asignado en períodos cerrados'), 28000);
    await esperarMonto(linea(page, 'Asignado en el período actual'), 3000);
    await esperarMonto(linea(page, 'Reducciones por sobregiro con débito'), 2000);
  });
});
