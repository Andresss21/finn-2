// FT-30 Pagar tarjeta con desglose y pago excedente (06 FT-30; 05 §2.7; 07 §17: una pantalla o un flujo es una E2E). Cada prueba parte
// de una base sembrada con las operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre
// `/cuentas/[cuentaId]/pagar` como la persona. Los campos se buscan por su etiqueta del catálogo (FE-51). Los números los pone el motor:
// la pantalla solo los dibuja (PF-3) y la prueba lo comprueba abriendo la pantalla de la otra ficha (la categoría de pago, Inicio).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { categoriaPago } from '../../../src/textos/categoria-pago.ts';
import { cuentasPagar as t } from '../../../src/textos/cuentas-pagar.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { impactoLineas } from '../../../src/textos/formularios.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

/** Ids secuenciales del ejecutor (como `cuota-prestamo.e2e.ts`): el grupo Gastos es el 1, y luego van las cuentas en orden. */
const id = (n: number): string =>
  `/cuentas/00000000-0000-4000-8000-${String(n).padStart(12, '0')}/pagar`;
const TARJETA = id(3);

// ESC-08 hasta el paso 1 (T con día de corte 15; hoy 19 feb): deuda anterior $200.00, cargos del ciclo $100.00.
const ESC08_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', diaCorte: 15 },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 500, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 200, categoria: 'Super', fecha: '2027-02-03' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super', fecha: '2027-02-18' },
];
// ESC-08 hasta el paso 2: ya se pagaron $150.00.
const ESC08_PASO2: Op[] = [...ESC08_PASO1, { op: 'OP-23', tarjeta: 'T', monto: 150 }];
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
// ESC-13 hasta el paso 1 (hoy 10 feb): deuda de $100.00, todo reservado.
const ESC13_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
];

/** Una base con el estado inicial dado, sembrada con `hoy`; el servidor fija el mismo instante (o `hoyServidor`). */
async function preparar(hoy: string, estadoInicial: Op[], hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PAGAR-TARJETA',
    titulo: 'Semilla de FT-30',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const pagar = (page: Page) => page.getByRole('button', { name: /^Pagar \$/ });
/** La cuenta es una selección nativa: se elige por el nombre de su opción, cuando React ya hidrató el control. */
async function desde(page: Page, nombre: string): Promise<void> {
  const control = campo(page, t.desde);
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  await control.selectOption({ label: nombre });
}
/** Una fila del desglose: su etiqueta y el monto que dibuja. */
const fila = (page: Page, etiqueta: string) =>
  page.getByRole('term').filter({ hasText: etiqueta }).locator('xpath=..');

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-250 [CA-30.1, ESC-08] con el paso 1 de ESC-08 el desglose dice deuda anterior $200.00, cargos del ciclo $100.00 y ya pagado $0.00; al pagar $150.00 el desglose queda con ya pagado $150.00 y $50.00 para no generar intereses', async ({
    page,
  }) => {
    await preparar('2027-02-19', ESC08_PASO1);
    await abrir(page, TARJETA);
    await desde(page, 'Ahorro');
    await page.keyboard.press('Tab'); // el primer Tab muestra «Saltar al contenido» (11.2): se mide ya visible
    await revisarTactil(page);
    await expect(page.getByText(t.deuda('$300.00'))).toBeVisible();
    await expect(fila(page, t.deudaAnterior('15/02'))).toContainText('$200.00');
    await expect(fila(page, t.cargosDelCiclo)).toContainText('$100.00');
    await expect(fila(page, t.yaPagado)).toContainText('$0.00');
    await expect(fila(page, t.reservadoPara('T'))).toContainText('$300.00');
    await campo(page, t.monto).fill('150');
    await expect(pagar(page)).toHaveText(t.pagarMonto('$150.00'));
    await pagar(page).click();
    await expect(page.getByRole('heading', { name: t.tituloListo })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('$150.00', 'T'));
    // El paso 2 de ESC-08: al abrir de nuevo, Pago T queda en $150.00 y el monto para no generar intereses en $50.00
    await abrir(page, TARJETA);
    await expect(page.getByText(t.deuda('$150.00'))).toBeVisible();
    await expect(fila(page, t.yaPagado)).toContainText('−$150.00');
    await expect(fila(page, t.paraNoGenerarIntereses)).toContainText('$50.00');
    await expect(fila(page, t.reservadoPara('T'))).toContainText('$150.00');
  });

  test('PRU-E2E-CTA-251 [CA-30.2, ESC-09] con el paso 2 de ESC-08 pago los $150.00 que faltan con «Toda la deuda»: la deuda queda en $0.00 y Pago T en $0.00', async ({
    page,
  }) => {
    await preparar('2027-02-19', ESC08_PASO2);
    await abrir(page, TARJETA);
    await expect(page.getByText(t.deuda('$150.00'))).toBeVisible();
    await page.getByRole('button', { name: t.todaLaDeuda }).click();
    await expect(campo(page, t.monto)).toHaveValue('150.00');
    await expect(pagar(page)).toHaveText(t.pagarMonto('$150.00'));
    await pagar(page).click();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('$150.00', 'T'));
    await abrir(page, TARJETA);
    await expect(page.getByText(t.deuda('$0.00'))).toBeVisible();
    await expect(fila(page, t.reservadoPara('T'))).toContainText('$0.00');
    await expect(page.getByRole('button', { name: t.todaLaDeuda })).toHaveCount(0);
  });

  test('PRU-E2E-CTA-252 [CA-30.3, ESC-10, AV-10, AV-04] con el paso 2 de ESC-10 pagar $150.00 con $100.00 reservados avisa antes que son $50.00 de más y la reducción proyectada, y después la categoría de pago dice que pagaste $50.00 de más', async ({
    page,
  }) => {
    await preparar('2027-02-15', ESC10_PASO2);
    await abrir(page, TARJETA);
    await desde(page, 'Ahorro');
    await campo(page, t.monto).fill('150');
    await pagar(page).click();
    // Antes de confirmar (AV-10): $50.00 más de lo reservado y la reducción proyectada del impacto; nada se guardó todavía
    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(t.avisos['AV-10']('$50.00', 'T'))).toBeVisible();
    await expect(page.getByText(impactoLineas.reduccion('+$50.00'))).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.tituloListo })).toBeVisible();
    // Después (AV-04): el aviso de estado y, en la categoría de pago, el monto de la reducción proyectada
    await expect(page.getByText(t.avisoExcedente('T'))).toBeVisible();
    await page.getByRole('link', { name: t.verCategoria('T') }).click();
    await esperarContenido(page);
    const aviso = page.locator('[data-aviso="AV-04"]');
    const [antes, despues] = categoriaPago.avisos['AV-04'];
    await expect(aviso).toContainText(antes);
    await expect(aviso).toContainText('$50.00');
    await expect(aviso).toContainText(despues);
  });

  test('PRU-E2E-CTA-253 [CA-30.4, ESC-13, AV-10] con el paso 1 de ESC-13 pagar $130.00 con una deuda de $100.00 dice en la previsualización «quedará saldo a favor de $30.00» además del aviso de $30.00 de más', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC13_PASO1);
    await abrir(page, TARJETA);
    await desde(page, 'Ahorro');
    await expect(page.getByText(t.deuda('$100.00'))).toBeVisible();
    await campo(page, t.monto).fill('130');
    await pagar(page).click();
    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(t.avisos['AV-10']('$30.00', 'T'))).toBeVisible();
    await expect(page.getByText(t.saldoAFavor('$30.00', 'T'))).toBeVisible();
    await page.getByRole('button', { name: t.volverAEditar }).click();
    await expect(campo(page, t.monto)).toHaveValue('130');
  });

  test('PRU-E2E-CTA-254 [CA-30.5, CB-01, AV-10] una tarjeta sin deuda acepta un pago de $20.00 con el aviso de $20.00 de más y «quedará saldo a favor de $20.00»', async ({
    page,
  }) => {
    await preparar('2027-02-10', [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
      { op: 'OP-21', monto: 100 },
    ]);
    await abrir(page, TARJETA);
    await desde(page, 'Ahorro');
    await expect(page.getByText(t.deuda('$0.00'))).toBeVisible();
    await campo(page, t.monto).fill('20');
    await pagar(page).click();
    await expect(page.getByText(t.avisos['AV-10']('$20.00', 'T'))).toBeVisible();
    await expect(page.getByText(t.saldoAFavor('$20.00', 'T'))).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('$20.00', 'T'));
  });

  test('PRU-E2E-CTA-255 [CA-30.6, CB-26, AV-01] un pago con fecha en un período cerrado pide confirmar con el aviso del período cerrado y, al confirmar, afecta a Pago T en ese período', async ({
    page,
  }) => {
    await preparar(
      '2027-01-25',
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 500 },
        { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
        { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
      ],
      '2027-03-05',
    );
    await abrir(page, TARJETA);
    await desde(page, 'Ahorro');
    await campo(page, t.fecha).fill('2027-02-10');
    await campo(page, t.monto).fill('100');
    await pagar(page).click();
    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(t.avisos['AV-01'])).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('$100.00', 'T'));
    // El pago quedó en febrero: la deuda de la tarjeta es $0.00
    await abrir(page, TARJETA);
    await expect(page.getByText(t.deuda('$0.00'))).toBeVisible();
  });

  test('PRU-E2E-CTA-256 [CA-30.7] si la última vez pagué T desde Ahorro, al abrir el flujo Ahorro viene preseleccionada y la otra cuenta no', async ({
    page,
  }) => {
    await preparar('2027-02-10', [
      { op: 'OP-01', cuenta: 'Corriente' },
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-21', monto: 500 },
      { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
      { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
      { op: 'OP-23', origen: 'Ahorro', tarjeta: 'T', monto: 40 },
    ]);
    await abrir(page, id(4));
    await expect(campo(page, t.desde).locator('option:checked')).toHaveText('Ahorro');
    await expect(campo(page, t.desde).locator('xpath=..')).toContainText(
      t.saldoPreseleccionada('$460.00'),
    );
  });

  test('PRU-E2E-CTA-257 [CA-08.7, AV-08] con $30.00 reservados de más en Pago T, pagar la deuda completa por el flujo deja la reserva excedente y Inicio la ofrece: la propuesta sube Listo para asignar $30.00 y «Deshacer» lo vuelve atrás', async ({
    page,
  }) => {
    // Como el paso 4 de ESC-13 deja $30.00 en Pago T sin deuda, pero el pago lo hace el flujo: Pago T con $130.00 y deuda de $100.00
    await preparar('2027-02-10', [
      ...ESC13_PASO1,
      { op: 'OP-14', categoria: 'Pago T', monto: 30, periodo: 'P1' },
    ]);
    await abrir(page, TARJETA);
    await desde(page, 'Ahorro');
    await expect(page.getByText(t.deuda('$100.00'))).toBeVisible();
    await page.getByRole('button', { name: t.todaLaDeuda }).click();
    await expect(pagar(page)).toHaveText(t.pagarMonto('$100.00'));
    await pagar(page).click();
    await expect(page.getByTestId('resultado')).toHaveText(t.guardado('$100.00', 'T'));
    // Inicio es la otra ficha: avisa de $30.00 reservados de más y su propuesta los devuelve con un toque
    await page.goto('/');
    await esperarContenido(page);
    const billete = page.locator('[data-resumen-lpa="billete"] [data-centavos]').first();
    await esperarMonto(billete, 37000);
    const propuesta = page.locator('[data-reserva-excedente]');
    await expect(propuesta).toContainText('$30.00');
    await propuesta.getByRole('button', { name: ti.devolverReserva('$30.00') }).click();
    await esperarMonto(billete, 40000);
    const salida = page.locator('[data-reserva-devuelta]');
    await expect(salida).toContainText(ti.reservaDevuelta('T', '$30.00'));
    await salida.getByRole('button', { name: ti.deshacer, exact: true }).click();
    await esperarMonto(billete, 37000);
    await expect(page.locator('[data-reserva-excedente]')).toHaveCount(1);
  });
});
