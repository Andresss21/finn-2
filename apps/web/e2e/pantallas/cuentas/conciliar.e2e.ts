// FT-43 Conciliar con estado de cuenta CSV, parte 1 (06 FT-43; 05 §2.7; 07 §17: una pantalla o un flujo es una E2E). Cada prueba parte
// de una base sembrada con operaciones reales (DP-17), con el paso 0 de ESC-47 (hoy 16 feb), y del reloj del servidor fijo (DP-04);
// sube un CSV sintético como la persona. La clasificación, los saldos y la diferencia los pone el servidor: la prueba solo comprueba
// que la pantalla los dibuja (PF-3). Agregar desde el estado (CA-43.4, CA-43.5) y los pendientes que completa la ficha son de TA-483.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { conciliar as t } from '../../../src/textos/conciliar.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import { transaccion as tx } from '../../../src/textos/transaccion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-16';
/** Ahorro es la primera cuenta que crea el ejecutor después del grupo Gastos; T, la segunda (ids secuenciales). */
const T = '00000000-0000-4000-8000-000000000003';
const conciliar = `/cuentas/${T}/conciliar`;

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

async function preparar(): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CONCILIAR',
    titulo: 'Semilla de FT-43',
    refs: [],
    hoy: HOY,
    estadoInicial: ESC47_PASO_0,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** Sube el archivo y pide la clasificación (pasos 1 y 2 del flujo). */
async function subir(page: Page, contenido: string | Buffer, nombre = 'estado.csv'): Promise<void> {
  await page.getByLabel(t.archivo, { exact: true }).setInputFiles({
    name: nombre,
    mimeType: nombre.endsWith('.pdf') ? 'application/pdf' : 'text/csv',
    buffer: typeof contenido === 'string' ? Buffer.from(contenido, 'utf8') : contenido,
  });
  await page.getByRole('button', { name: t.revisar }).click();
}

const terminar = (page: Page) => page.getByRole('button', { name: t.terminar });
const coincidencias = (page: Page) => page.locator('[data-coincidencia]');

/** Cambia el monto de la compra de Actividad que muestra `texto`, desde la edición (FT-25). */
async function editarMonto(page: Page, texto: string, nuevo: string): Promise<void> {
  await abrir(page, '/actividad');
  await esperarContenido(page);
  await page.locator('[data-fila-transaccion]').filter({ hasText: texto }).first().click();
  await page.getByRole('link', { name: tx.editar }).click();
  await page.getByRole('textbox', { name: g.total, exact: true }).fill(nuevo);
  await page.getByRole('button', { name: tx.guardar }).click();
  await expect(page.getByRole('heading', { level: 1, name: tx.editarTitulo })).toHaveCount(0);
}

test.describe('PRU-E2E-CONC conciliar con estado de cuenta', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
    await preparar();
  });

  test('PRU-E2E-CONC-148 [CA-43.1, ESC-47] RUTA-/cuentas/[cuentaId]/conciliar al subir el estado al 15 de febrero, A y B coinciden, D queda solo en el estado, C solo en Finn y la diferencia es +$2.00', async ({
    page,
  }) => {
    await abrir(page, conciliar);
    await subir(page, CSV);
    await expect(page.getByRole('heading', { name: t.coinciden(2) })).toBeVisible();
    await expect(coincidencias(page)).toHaveCount(2);
    await expect(coincidencias(page).first()).toContainText('−$40.00');
    await expect(coincidencias(page).last()).toContainText('−$25.00');
    await expect(page.getByRole('heading', { name: t.soloEnEstado(1) })).toBeVisible();
    await expect(page.locator('[data-solo-en-estado]')).toContainText('COMPRA D');
    await expect(page.locator('[data-solo-en-estado]')).toContainText('−$10.00');
    await expect(page.getByRole('heading', { name: t.soloEnFinn(1) })).toBeVisible();
    await expect(page.locator('[data-solo-en-finn]')).toContainText('−$12.00');
    await expect(page.getByText(t.saldoEstado('15/02/2027', '−$75.00'))).toBeVisible();
    await expect(page.getByText(t.saldoFinn('15/02/2027', '−$77.00'))).toBeVisible();
    await expect(page.getByText(t.diferencia('+$2.00'))).toBeVisible();
  });

  test('PRU-E2E-CONC-149 [CA-43.2, AV-21] al terminar sin resolver C ni D, A y B quedan conciliadas, la diferencia aceptada es +$2.00 y aparece la propuesta de ajuste', async ({
    page,
  }) => {
    await abrir(page, conciliar);
    await subir(page, CSV);
    await expect(coincidencias(page).first().getByRole('checkbox')).toBeChecked();
    await terminar(page).click();
    await expect(page.getByTestId('resultado')).toContainText(t.guardado('T', '15/02/2027', 2));
    await expect(page.getByText(t.ajusteEntrada('$2.00'))).toBeVisible();
    await expect(page.getByRole('link', { name: t.crearAjuste })).toHaveAttribute(
      'href',
      `/registrar/entrada-tarjeta?cuenta=${T}`,
    );
    await abrir(page, `/cuentas/${T}`);
    const conciliacion = page.locator('[data-conciliacion]');
    await expect(conciliacion).toHaveCount(1);
    await expect(
      conciliacion.locator('[data-diferencia="aceptada"] [data-centavos]'),
    ).toHaveAttribute('data-centavos', '200');
  });

  test('PRU-E2E-CONC-150 [CA-43.3] después de terminar, al editar C a $10.00 desde la conciliación la diferencia actual pasa a $0.00 sin cambio posterior', async ({
    page,
  }) => {
    await abrir(page, conciliar);
    await subir(page, CSV);
    await terminar(page).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await page.locator('[data-solo-en-finn]').getByRole('link', { name: t.editar }).click();
    await page.getByRole('textbox', { name: g.total, exact: true }).fill('10');
    await page.getByRole('button', { name: tx.guardar }).click();
    await expect(page.getByRole('heading', { level: 1, name: tx.editarTitulo })).toHaveCount(0);
    await abrir(page, `/cuentas/${T}`);
    const conciliacion = page.locator('[data-conciliacion]');
    await expect(
      conciliacion.locator('[data-diferencia="aceptada"] [data-centavos]'),
    ).toHaveAttribute('data-centavos', '200');
    await expect(
      conciliacion.locator('[data-diferencia="actual"] [data-centavos]'),
    ).toHaveAttribute('data-centavos', '0');
    await expect(page.locator('[data-cambio-posterior]')).toHaveCount(0);
  });

  test('PRU-E2E-CONC-151 [CA-43.6] si entre la subida y «Terminar» edité el monto de A, al terminar con A marcada se rechaza con coincidencia_no_valida', async ({
    page,
    context,
  }) => {
    await abrir(page, conciliar);
    await subir(page, CSV);
    await expect(coincidencias(page)).toHaveCount(2);
    const otra = await context.newPage();
    await editarMonto(otra, '$40.00', '45');
    await otra.close();
    await terminar(page).click();
    await expect(
      page.getByText('Ese movimiento no coincide con la transacción elegida.'),
    ).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveCount(0);
    // No se concilió nada: la cuenta sigue sin conciliaciones
    await abrir(page, `/cuentas/${T}`);
    await expect(page.locator('[data-conciliacion]')).toHaveCount(0);
  });

  test('PRU-E2E-CONC-152 [CA-43.7] con una carga firmada hace más de 24 h, terminar responde firma_vencida; al subir el mismo archivo se restauran las marcas', async ({
    page,
  }) => {
    await abrir(page, conciliar);
    await subir(page, CSV);
    await expect(coincidencias(page)).toHaveCount(2);
    await coincidencias(page).last().getByRole('checkbox').uncheck();
    // 24 h y 1 minuto después de la carga (el servidor lee el reloj de prueba en cada petición)
    fijarRelojServidor('2027-02-17T10:01:00-06:00');
    await terminar(page).click();
    await expect(
      page.getByText('Pasaron más de 24 horas. Volvé a subir el estado de cuenta.'),
    ).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveCount(0);
    await page.getByRole('button', { name: t.elegirOtro }).click();
    await subir(page, CSV);
    await expect(coincidencias(page)).toHaveCount(2);
    await expect(coincidencias(page).first().getByRole('checkbox')).toBeChecked();
    await expect(coincidencias(page).last().getByRole('checkbox')).not.toBeChecked();
  });

  test('PRU-E2E-CONC-153 [CA-43.8] al subir un PDF responde archivo_pdf y deja volver a subir', async ({
    page,
  }) => {
    await abrir(page, conciliar);
    await subir(page, '%PDF-1.4\n1 0 obj\n', 'estado.pdf');
    await expect(page.getByText('Finn lee el estado de cuenta en CSV, no en PDF.')).toBeVisible();
    await expect(page.getByRole('button', { name: t.revisar })).toBeVisible();
    await subir(page, CSV);
    await expect(page.getByText(t.diferencia('+$2.00'))).toBeVisible();
  });

  test('PRU-E2E-CONC-154 [CA-43.9, INV-14] al terminar no se creó ni cambió ninguna transacción: la cuenta conserva A, B y C', async ({
    page,
  }) => {
    await abrir(page, `/cuentas/${T}`);
    await esperarContenido(page);
    const antes = await page.locator('[data-fila-transaccion]').count();
    await abrir(page, conciliar);
    await subir(page, CSV);
    await terminar(page).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await abrir(page, `/cuentas/${T}`);
    await esperarContenido(page);
    await expect(page.locator('[data-fila-transaccion]')).toHaveCount(antes);
    await expect(page.locator('[data-conciliacion]')).toContainText('2 transacciones');
  });
});
