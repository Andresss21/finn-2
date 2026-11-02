// FT-22 Registrar ingreso y FT-23 Transferencia entre cuentas propias (06 §2.8; 05 §2.4; 07 §17: una pantalla o un flujo). Cada
// prueba parte de una base sembrada con operaciones reales y del reloj del servidor fijo (DP-04), y recorre
// `/registrar/ingreso` o `/registrar/transferencia` como la persona. Los campos se buscan por su etiqueta del catálogo (FE-51).
// Los números del motor (LPA, saldos, Disponibles) los miden las pruebas de integración de OP-21 y OP-22.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { estados } from '../../../src/textos/estados.ts';
import { registrarTipo as t } from '../../../src/textos/registrar-tipo.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

/** Una base con el estado inicial dado y `hoy` el día de la prueba; el servidor fija el mismo instante. */
async function preparar(hoy: string, estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REG',
    titulo: 'Semilla de FT-22 y FT-23',
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
const cuenta = (page: Page, grupo: string, nombre: string) =>
  page.getByRole('radiogroup', { name: grupo }).getByRole('radio', { name: nombre });

test.describe('PRU-E2E-TX', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-371 [ESC-03] registro un ingreso de $1,000.00 en Ahorro con la descripción "Salario" y el resultado lo confirma', async ({
    page,
  }) => {
    await preparar('2027-02-05', [
      { op: 'OP-01', cuenta: 'Ahorro', saldo: 0 },
      { op: 'OP-01', cuenta: 'Débito', saldo: 0 },
    ]);
    await abrir(page, '/registrar/ingreso');
    await page.keyboard.press('Tab'); // el primer Tab muestra «Saltar al contenido» (11.2): se mide ya visible
    await revisarTactil(page);
    await expect(campo(page, t.fecha)).toHaveValue('2027-02-05');
    await cuenta(page, t.cuentaIngreso, 'Ahorro').click();
    await campo(page, t.total).fill('1000');
    await campo(page, t.descripcion).fill('Salario');
    await page.getByRole('button', { name: t.guardarIngreso }).click();
    await expect(page.getByRole('heading', { name: t.listoIngreso })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.ingresoGuardado('$1,000.00', 'Ahorro'),
    );
  });

  test('PRU-E2E-TX-372 [AV-01] con hoy el 5 de marzo, un ingreso del 25 de enero muestra el impacto en Listo para asignar antes de confirmar', async ({
    page,
  }) => {
    await preparar('2027-03-05', [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 0 }]);
    await abrir(page, '/registrar/ingreso');
    await cuenta(page, t.cuentaIngreso, 'Ahorro').click();
    await campo(page, t.fecha).fill('2027-01-25');
    await campo(page, t.total).fill('500');
    await page.getByRole('button', { name: t.guardarIngreso }).click();
    await expect(page.getByRole('heading', { name: t.revisar })).toBeFocused();
    await expect(page.getByText(t.impactoLpa('+$500.00'))).toBeVisible();
    await expect(page.getByText(t.avisoPeriodoCerrado)).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.listoIngreso })).toBeVisible();
  });

  test('PRU-E2E-TX-373 [CA-23.2, CB-29] elijo la misma cuenta de origen y de destino y se rechaza con "Elegí dos cuentas distintas."', async ({
    page,
  }) => {
    await preparar('2027-02-05', [
      { op: 'OP-01', cuenta: 'Ahorro', saldo: 500 },
      { op: 'OP-01', cuenta: 'Débito', saldo: 0 },
      { op: 'OP-01', cuenta: 'Caja', saldo: 20 },
    ]);
    await abrir(page, '/registrar/transferencia');
    await page.keyboard.press('Tab'); // el primer Tab muestra «Saltar al contenido» (11.2): se mide ya visible
    await revisarTactil(page);
    await cuenta(page, t.origen, 'Ahorro').click();
    await cuenta(page, t.destino, 'Ahorro').click();
    await campo(page, t.total).fill('50');
    await page.getByRole('button', { name: t.guardarTransferencia }).click();
    await expect(page.getByText('Elegí dos cuentas distintas.')).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listoTransferencia })).toHaveCount(0);
  });

  test('PRU-E2E-TX-374 transfiero $200.00 de Ahorro a Débito con la cuenta de origen preseleccionada por ?cuenta= y el resultado nombra las dos cuentas', async ({
    page,
  }) => {
    await preparar('2027-02-05', [
      { op: 'OP-01', cuenta: 'Ahorro', saldo: 500 },
      { op: 'OP-01', cuenta: 'Débito', saldo: 0 },
    ]);
    await abrir(page, '/registrar/transferencia');
    // sin `?cuenta=` el origen llega vacío: se toma el id de la cuenta Ahorro de su propia opción y se reabre con él
    const id = await cuenta(page, t.origen, 'Ahorro').getAttribute('value');
    await abrir(page, `/registrar/transferencia?cuenta=${id ?? ''}`);
    await expect(cuenta(page, t.origen, 'Ahorro')).toBeChecked();
    await cuenta(page, t.destino, 'Débito').click();
    await campo(page, t.total).fill('200');
    await page.getByRole('button', { name: t.guardarTransferencia }).click();
    await expect(page.getByRole('heading', { name: t.listoTransferencia })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.transferenciaGuardada('$200.00', 'Ahorro', 'Débito'),
    );
  });

  test('PRU-E2E-TX-375 un tipo que no es del flujo da "no encontrada" y con una sola cuenta de efectivo la transferencia lo explica y enlaza a crear otra', async ({
    page,
  }) => {
    await preparar('2027-02-05', [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 0 }]);
    await abrir(page, '/registrar/inexistente');
    await expect(page.getByRole('heading', { name: estados.noExisteTitulo })).toBeVisible();
    await abrir(page, '/registrar/transferencia');
    await expect(page.getByRole('heading', { name: t.pocasTitulo })).toBeVisible();
    await expect(page.getByRole('link', { name: t.crearCuenta })).toHaveAttribute(
      'href',
      '/cuentas/nueva',
    );
  });
});
