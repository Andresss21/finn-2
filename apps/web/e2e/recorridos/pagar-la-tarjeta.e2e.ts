// Recorrido 4.4 «Pagar la tarjeta» de 06 (REC-4.4; 07 §17: un recorrido es una E2E). Parte de ESC-08 hasta el paso 1 (hoy 19/02, corte
// el 15, fecha de pago el 22) con las operaciones reales (DP-17) y encadena las pantallas de sus fichas con el reloj de prueba alineado
// (07 §4.1): la tarea diaria del 19 deja el aviso del pago, el aviso abre el detalle de la tarjeta, se paga en dos veces y la variante
// con $100.00 reservados avisa del pago excedente. Los números los pone el motor (PF-3). Los pasos 4 y 5 (el SMS del pago y «Es
// duplicado») no se recorren: 06 §4.4 los marca ⚠ porque el formato de SMS de un pago todavía no existe (P4-3, S6-1) y Finn no
// tiene cómo recibirlo; el duplicado entre un pago y su SMS lo prueba el dominio.
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { esperarMonto } from '../ayudas/montos.ts';
import { correrTareaDiaria } from '../ayudas/tarea-diaria.ts';
import { alinearRelojes } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';
import { cuentasPagar as t } from '../../src/textos/cuentas-pagar.ts';
import { impactoLineas } from '../../src/textos/formularios.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-19';

// ESC-08 hasta el paso 1: T con corte el 15 y pago el 22; deuda anterior $200.00 (3 feb) y cargos del ciclo $100.00 (18 feb).
const ESC08_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', diaCorte: 15, diaPago: 22 },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 500, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 200, categoria: 'Super', fecha: '2027-02-03' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super', fecha: '2027-02-18' },
];
// ESC-10 hasta el paso 2 (hoy 15 feb): Pago T tiene $100.00 reservados y la deuda es de $150.00.
const ESC10_PASO2: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 200 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
  { op: 'OP-20', cuenta: 'T', monto: 50, categoria: 'Salidas' },
];

async function preparar(hoy: string, estadoInicial: Op[]): Promise<void> {
  const escenario: Escenario = {
    id: 'SEM-REC-4.4',
    titulo: 'Semilla de 4.4 Pagar la tarjeta',
    refs: ['REC-4.4'],
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
const pagar = (page: Page) => page.getByRole('button', { name: /^Pagar \$/ });
/** La cuenta es una selección nativa: se elige cuando React ya hidrató el control. */
async function desde(page: Page, nombre: string): Promise<void> {
  const control = campo(page, t.desde);
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  await control.selectOption({ label: nombre });
}
const fila = (page: Page, etiqueta: string) =>
  page.getByRole('term').filter({ hasText: etiqueta }).locator('xpath=..');
/** La fila de pago de la tarjeta en Presupuesto: «Te falta reservar» y lo disponible para pagar. */
const montoDePago = (page: Page, n: 0 | 1) =>
  page.locator('[data-fila-pago] [data-centavos]').nth(n);
const faltaReservarEnInicio = (page: Page) =>
  page.locator('a[href^="/cuentas/"]').filter({ hasText: 'Te falta reservar' });

test.describe('PRU-E2E-CTA recorrido 4.4 pagar la tarjeta', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-440 [REC-4.4, ESC-08, CA-33.2, CA-33.3, CA-33.5, CA-30.1, CA-30.2] desde ESC-08 la tarea diaria del 19 deja un solo aviso de pago, que abre el detalle con $200.00 para no generar intereses y el pago el 22; pagar $150.00 deja $50.00 y pagar los $150.00 restantes deja la deuda en $0.00 con Presupuesto, Inicio y la tarjeta de acuerdo', async ({
    page,
    request,
  }) => {
    await alinearRelojes(page, `${HOY}T10:00:00-06:00`);
    await preparar(HOY, ESC08_PASO1);

    // Paso 1: la tarea diaria del 19, dos veces: un solo aviso en el ciclo y sin montos (CA-33.3, CA-33.5)
    await correrTareaDiaria(request);
    await correrTareaDiaria(request);
    await abrir(page, '/notificaciones');
    const avisos = page.locator('[data-notificacion]').filter({ hasText: 'Pago de tarjeta' });
    await expect(avisos).toHaveCount(1);
    await expect(avisos).toContainText('22/02');
    await expect(avisos).not.toContainText('$');

    // Paso 2: tocar el aviso abre el detalle de T: para no generar intereses $200.00 y el próximo pago el 22
    await avisos.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]+$/);
    await esperarContenido(page);
    const tarjeta = page.url().split('/').pop() ?? '';
    await esperarMonto(
      page
        .locator('[data-bloque="tarjeta"] dt', { hasText: t.paraNoGenerarIntereses })
        .locator('xpath=..')
        .locator('[data-centavos]'),
      20000,
    );
    // La fecha de pago vive en la tarjeta de Cuentas (el detalle trae el ciclo): el próximo pago es el 22
    await abrir(page, '/cuentas');
    await expect(
      page
        .locator('[data-detalle-tarjeta] dt', { hasText: /^Pago$/ })
        .locator('xpath=following-sibling::dd'),
    ).toHaveText('22/02/2027');
    await abrir(page, `/cuentas/${tarjeta}`);

    // Paso 3: «Pagar» $150.00 desde Ahorro: el desglose previo y, después, $50.00 para no generar intereses
    await page.getByRole('link', { name: 'Pagar tarjeta', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/cuentas/${tarjeta}/pagar$`));
    await esperarContenido(page);
    await desde(page, 'Ahorro');
    await expect(fila(page, t.deudaAnterior('15/02'))).toContainText('$200.00');
    await expect(fila(page, t.cargosDelCiclo)).toContainText('$100.00');
    await expect(fila(page, t.yaPagado)).toContainText('$0.00');
    await campo(page, t.monto).fill('150');
    await pagar(page).click();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('$150.00', 'T'));
    await abrir(page, `/cuentas/${tarjeta}/pagar`);
    await expect(page.getByText(t.deuda('$150.00'))).toBeVisible();
    await expect(fila(page, t.yaPagado)).toContainText('−$150.00');
    await expect(fila(page, t.paraNoGenerarIntereses)).toContainText('$50.00');
    // «Te falta reservar» es el mismo en Presupuesto, Inicio y la tarjeta: $0.00 (el pago no afecta dos veces el presupuesto)
    await expect(fila(page, t.reservadoPara('T'))).toContainText('$150.00');
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDePago(page, 0), 0);
    await esperarMonto(montoDePago(page, 1), 15000);
    await abrir(page, '/');
    await expect(faltaReservarEnInicio(page)).toHaveCount(0);

    // Paso 6: paga los $150.00 restantes: deuda $0.00 (ESC-09)
    await abrir(page, `/cuentas/${tarjeta}/pagar`);
    await desde(page, 'Ahorro');
    await page.getByRole('button', { name: t.todaLaDeuda }).click();
    await expect(campo(page, t.monto)).toHaveValue('150.00');
    await pagar(page).click();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('$150.00', 'T'));
    await abrir(page, `/cuentas/${tarjeta}/pagar`);
    await expect(page.getByText(t.deuda('$0.00'))).toBeVisible();
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDePago(page, 0), 0);
    await esperarMonto(montoDePago(page, 1), 0);
    await abrir(page, '/');
    await expect(faltaReservarEnInicio(page)).toHaveCount(0);
  });

  test('PRU-E2E-CTA-441 [REC-4.4, ESC-10, CA-30.3, AV-10, AV-04] variante del paso 7: desde ESC-10 pagar $150.00 con $100.00 reservados avisa antes de los $50.00 de más y la reducción proyectada, y después la categoría de pago lo recuerda', async ({
    page,
  }) => {
    await alinearRelojes(page, '2027-02-15T10:00:00-06:00');
    await preparar('2027-02-15', ESC10_PASO2);
    await abrir(page, '/cuentas');
    await page.getByRole('link', { name: 'Ver detalle de T' }).click();
    await esperarContenido(page);
    await page.getByRole('link', { name: 'Pagar tarjeta', exact: true }).click();
    await esperarContenido(page);
    await desde(page, 'Ahorro');
    await campo(page, t.monto).fill('150');
    await pagar(page).click();
    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(t.avisos['AV-10']('$50.00', 'T'))).toBeVisible();
    await expect(page.getByText(impactoLineas.reduccion('+$50.00'))).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    // E2-13: sin pantalla de resultado propia, vuelve al detalle de la tarjeta con el resultado bajo sus acciones
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}\?resultado=pagado/);
    await expect(page.getByText(t.avisoExcedente('T'))).toBeVisible();
    await page.getByRole('link', { name: t.verCategoria('T') }).click();
    await esperarContenido(page);
    await expect(page.locator('[data-aviso="AV-04"]')).toContainText('$50.00');
  });
});
