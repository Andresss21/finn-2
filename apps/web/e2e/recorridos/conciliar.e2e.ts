// Recorrido 4.5 «Conciliar» de 06 (REC-4.5; 07 §17: un recorrido es una E2E). Parte de ESC-47 paso 0 (hoy 16/02: T con A $40.00, B $25.00
// y C $12.00; el estado al 15/02 trae A, B y D $10.00) con las operaciones reales (DP-17) y encadena las pantallas de sus fichas con el
// reloj de prueba alineado (07 §4.1). Los números los pone el motor (PF-3). El paso 2 («Agrega D como gasto», OP-46, CA-43.5) queda
// fuera de la secuencia (CH-218) y el paso 4 usa los valores iniciales del enlace (CA-43.4). El paso 6 usa Ahorro: 06 nombra la cuenta de una financiera, que
// el estado de partida de 4.5 no tiene.
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { alinearRelojes } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';
import { conciliar as t } from '../../src/textos/conciliar.ts';
import { registrarGasto as g } from '../../src/textos/registrar-gasto.ts';
import { registrarTarjeta as rt } from '../../src/textos/registrar-tarjeta.ts';
import { transaccion as tx } from '../../src/textos/transaccion.ts';
import { verificarSaldo as vs } from '../../src/textos/verificar-saldo.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-16';
/** Ahorro es la primera cuenta que crea el ejecutor después del grupo Gastos; T, la segunda (ids secuenciales). */
const AHORRO = '00000000-0000-4000-8000-000000000002';
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
  { op: 'OP-21', monto: 100, fecha: '2027-02-01', hoy: '2027-02-01' },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: '2027-02-01' },
  gastoT(40, 'A', '2027-02-03'),
  gastoT(25, 'B', '2027-02-06'),
  gastoT(12, 'C', '2027-02-10'),
];

/** El estado de cuenta al 15 de febrero: A 40, B 25 y D 10, con saldo −75 (deuda 75 en el archivo). */
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

const coincidencias = (page: Page) => page.locator('[data-coincidencia]');
const conciliacion = (page: Page) => page.locator('[data-conciliacion]');
const diferencia = (page: Page, cual: 'aceptada' | 'actual') =>
  conciliacion(page).locator(`[data-diferencia="${cual}"] [data-centavos]`);

test.describe('PRU-E2E-CONC recorrido 4.5 conciliar', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CONC-450 [REC-4.5, ESC-47, CA-43.1, CA-43.2, CA-25.3, CA-52.2, CA-44.1, CA-44.5] desde ESC-47 el estado de cuenta empareja A y B, deja D solo en el estado y C solo en Finn con +$2.00; terminar concilia A y B con AV-21; el ajuste de $2.00 y la edición de A a $45.00 dejan la diferencia actual en +$5.00 con un cambio posterior; y verificar el saldo de Ahorro queda en $0.00', async ({
    page,
  }) => {
    const escenario: Escenario = {
      id: 'SEM-REC-4.5',
      titulo: 'Semilla de 4.5 Conciliar',
      refs: ['REC-4.5'],
      hoy: HOY,
      estadoInicial: ESC47_PASO_0,
      pasos: [],
    };
    await alinearRelojes(page, `${HOY}T10:00:00-06:00`);
    await sembrar(escenario, HOY);

    // Paso 1: sube el CSV: A y B coinciden, D solo en el estado, C solo en Finn y diferencia propuesta +$2.00
    await abrir(page, `/cuentas/${T}/conciliar`);
    await page.getByLabel(t.archivo, { exact: true }).setInputFiles({
      name: 'estado.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV, 'utf8'),
    });
    await page.getByRole('button', { name: t.revisar }).click();
    await expect(coincidencias(page)).toHaveCount(2);
    await expect(page.locator('[data-solo-en-estado]')).toContainText('COMPRA D');
    await expect(page.locator('[data-solo-en-finn]')).toContainText('−$12.00');
    await expect(page.getByText(t.diferencia('+$2.00'))).toBeVisible();

    // Paso 2: CH-218: Agregar va fuera del recorrido; lo cubre PRU-E2E-CONC-156
    // Paso 3: termina con A y B marcadas: conciliadas, diferencia aceptada +$2.00 y la propuesta de ajuste (AV-21)
    await expect(coincidencias(page).first().getByRole('checkbox')).toBeChecked();
    await page.getByRole('button', { name: t.terminar }).click();
    await expect(page.getByTestId('resultado')).toContainText(t.guardado('T', '15/02/2027', 2));
    await expect(page.getByText(t.ajusteEntrada('$2.00'))).toBeVisible();

    // Paso 4: toca la propuesta de ajuste: la entrada a la tarjeta T, con el monto y la fecha del estado
    await page.getByRole('link', { name: t.crearAjuste }).click();
    await expect(page).toHaveURL(
      new RegExp(`/registrar/entrada-tarjeta\\?cuenta=${T}&fecha=2027-02-15&total=2\\.00`),
    );
    await esperarContenido(page);
    await expect(
      page
        .getByRole('radiogroup', { name: rt.tarjetaEntrada })
        .getByRole('radio', { name: 'T', exact: true }),
    ).toBeChecked();
    await page.getByRole('button', { name: rt.flujos['entrada-tarjeta'].guardar }).click();
    await expect(page.getByRole('dialog').getByTestId('resultado')).toHaveText(
      rt.entradaGuardada('$2.00', 'T'),
    );

    // Paso 5: edita A a $45.00: AV-16 antes, queda con un cambio posterior y la diferencia actual es +$5.00
    await abrir(page, '/actividad');
    await page.locator('[data-fila-transaccion]').filter({ hasText: '$40.00' }).first().click();
    await page.getByRole('link', { name: tx.editar }).click();
    await page.getByRole('textbox', { name: g.total, exact: true }).fill('45');
    await page.getByRole('button', { name: tx.guardar }).click();
    await expect(page.getByText(tx.conciliadaAdvertencia('T', tx.queCambio.total))).toBeVisible();
    await page.getByRole('button', { name: tx.confirmar }).click();
    await expect(page.locator('[data-cambios-posteriores]')).toContainText(tx.motivos.monto);
    await abrir(page, `/cuentas/${T}`);
    await expect(diferencia(page, 'aceptada')).toHaveAttribute('data-centavos', '200');
    await expect(diferencia(page, 'actual')).toHaveAttribute('data-centavos', '500');

    // Paso 6: verifica el saldo de una cuenta sin CSV: diferencia $0.00, todas marcadas, queda como «Verificación de saldo»
    await abrir(page, `/cuentas/${AHORRO}/verificar-saldo?fecha=2027-02-15`);
    await page.getByLabel(vs.saldoBanco, { exact: true }).fill('100');
    await page.getByRole('button', { name: vs.verDiferencia }).click();
    await expect(page.getByText(vs.diferencia('$0.00'))).toBeVisible();
    await expect(page.getByText(vs.coincide)).toBeVisible();
    await expect(page.getByRole('checkbox').first()).toBeChecked();
    await page.getByRole('button', { name: vs.revisar }).click();
    await page.getByRole('button', { name: vs.confirmar }).click();
    // E2-13: el resultado queda en el detalle de la cuenta, con las transacciones que quedaron conciliadas
    await expect(page.getByTestId('resultado')).toContainText(
      'Verificaste el saldo al 15/02/2027: coincide con el banco.',
    );
    await abrir(page, `/cuentas/${AHORRO}`);
    await expect(conciliacion(page).getByRole('heading', { level: 3 })).toContainText(
      'Verificación de saldo',
    );
  });
});
