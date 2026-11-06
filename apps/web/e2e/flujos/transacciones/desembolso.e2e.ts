// FT-56 Desembolso de préstamo (06 FT-56; 05 §2.4; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales del paso 0 de ESC-40 (01 §8, DP-17) y del reloj del servidor fijo (DP-04), más el préstamo nuevo con saldo 0
// (01 §2, "Desembolso"), y registra el desembolso como la persona, en `/registrar/desembolso`. Los números los pone el motor (PF-3):
// la prueba comprueba que se dibujan en Cuentas y en el detalle de Listo para asignar. El rechazo `cuenta_tipo_no_valido` de una
// tarjeta lo prueba la integración (PRU-INT-PRES-103).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { registrarDesembolso as t } from '../../../src/textos/registrar-desembolso.ts';
import { registrarTipo as c0 } from '../../../src/textos/registrar-tipo.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-10';
// ESC-40, paso 0 y el préstamo nuevo sin desembolsar.
const PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Inversión', tipo: 'inversion', saldo: 3000 },
  {
    op: 'OP-01',
    cuenta: 'Préstamo',
    tipo: 'prestamo',
    saldo: 0,
    prestamo: {
      contraparte: 'Banco',
      montoOriginal: 5000,
      cuota: 500,
      plazoCuotas: 12,
      cuotasPagadas: 0,
    },
  },
];

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-DESEMBOLSO',
    titulo: 'Semilla de FT-56',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const grupo = (page: Page, etiqueta: string) => page.getByRole('radiogroup', { name: etiqueta });
const cuenta = (page: Page, etiqueta: string, nombre: string) =>
  grupo(page, etiqueta).getByRole('radio', { name: nombre, exact: true });

/** Registra el desembolso de `monto` del préstamo a Ahorro, desde la pantalla de la ruta. */
async function desembolsar(page: Page, monto: string): Promise<void> {
  await abrir(page, '/registrar/desembolso');
  await esperarHidratacion(page);
  await cuenta(page, t.prestamo, 'Préstamo').click();
  await cuenta(page, t.cuenta, 'Ahorro').click();
  await campo(page, c0.total).fill(monto);
  await page.getByRole('button', { name: t.guardar }).click();
  await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
  await expect(page.getByTestId('resultado')).toHaveText(
    t.guardado(`$${monto === '5000' ? '5,000.00' : monto}`, 'Préstamo', 'Ahorro'),
  );
}

const neto = (page: Page) => page.locator('[data-posicion-neta] [data-centavos]').first();
const filaCuentas = (page: Page, nombre: 'Activos' | 'Deudas') =>
  page.locator(`[data-fila-posicion="${nombre}"] [data-centavos]`).first();
const linea = (page: Page, etiqueta: string) =>
  page
    .locator('[data-seccion="descomposicion"] dl > div')
    .filter({ has: page.getByText(etiqueta, { exact: true }) })
    .locator('[data-centavos]');

test.describe('PRU-E2E-TX', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-520 [CA-56.1, ESC-40] con el paso 0 de ESC-40 un desembolso de $5,000.00 deja Listo para asignar en $5,000.00, el capital pendiente en $5,000.00 y el patrimonio en $3,000.00', async ({
    page,
  }) => {
    await preparar(PASO0);
    await desembolsar(page, '5000');
    await abrir(page, '/presupuesto/listo-para-asignar');
    await esperarMonto(
      page.locator('[data-resumen-lpa="billete"] [data-centavos]').first(),
      500000,
    );
    await abrir(page, '/cuentas');
    await esperarMonto(filaCuentas(page, 'Deudas'), 500000);
    await esperarMonto(neto(page), 300000);
  });

  test('PRU-E2E-TX-521 [CA-56.2, ESC-40] el desembolso suma a «Otras entradas» en el detalle de Listo para asignar y no a «Ingresos»', async ({
    page,
  }) => {
    await preparar(PASO0);
    await desembolsar(page, '5000');
    await abrir(page, '/presupuesto/listo-para-asignar');
    await esperarMonto(linea(page, 'Otras entradas'), 500000);
    await esperarMonto(linea(page, 'Ingresos'), 0);
  });

  test('PRU-E2E-TX-522 [CA-56.3] con una tarjeta abierta, la cuenta que recibe el desembolso ofrece solo cuentas de efectivo', async ({
    page,
  }) => {
    await preparar([...PASO0, { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' }]);
    await abrir(page, '/registrar/desembolso');
    await esperarHidratacion(page);
    await expect(cuenta(page, t.cuenta, 'Ahorro')).toBeVisible();
    await expect(cuenta(page, t.cuenta, 'T')).toHaveCount(0);
    await expect(cuenta(page, t.cuenta, 'Inversión')).toHaveCount(0);
    await expect(cuenta(page, t.prestamo, 'Préstamo')).toBeVisible();
  });
});
