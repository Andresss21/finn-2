// FT-50 Crear cuenta con saldo inicial (06 §2.9; 05 §2.3; 07 §17: una pantalla, una navegación o un flujo). Cada prueba parte de una
// base sembrada con operaciones reales y del reloj del servidor fijo (DP-04), y recorre `/cuentas/nueva` como la persona. Los campos
// se buscan por su etiqueta del catálogo (FE-51). Los números del motor (LPA, patrimonio) los miden las pruebas de integración.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentasNueva as t } from '../../../src/textos/cuentas-nueva.ts';
import { cuentaSubtipo as s } from '../../../src/textos/cuenta-subtipo.ts';
import { glosario } from '../../../src/textos/glosario.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/cuentas/nueva';

/** Una base con el estado inicial dado y `hoy` el día de la prueba; el servidor fija el mismo instante. */
async function preparar(hoy: string, estadoInicial: Op[] = []): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CTA',
    titulo: 'Semilla de FT-50',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta = RUTA): Promise<void> {
  await page.goto(ruta);
  await esperarHidratacion(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const crear = (page: Page) => page.getByRole('button', { name: t.guardar });
/** Al terminar, el flujo se cierra a Cuentas (`cerrarFlujo()`, 05 §1.4): la cuenta nueva ya está ahí. */
const alTerminar = (page: Page) => expect(page).toHaveURL(/\/cuentas$/);

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-101 [CA-50.1, ESC-01, AV-07] creo un ahorro con $1,000.00 y una tarjeta con deuda de $300.00; la tarjeta avisa que la deuda queda como "te falta reservar"', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page);
    await campo(page, t.nombre).fill('Ahorro');
    await campo(page, t.saldo.efectivo).fill('1000');
    await crear(page).click();
    await alTerminar(page);
    await expect(page.locator('[data-identidad="efectivo"]').getByText('Ahorro')).toBeVisible();

    await abrir(page, `${RUTA}?tipo-cuenta=tarjeta`);
    await campo(page, t.nombre).fill('T');
    await campo(page, t.saldo.tarjeta).fill('300');
    await expect(page.getByRole('radio', { name: t.debo })).toBeChecked();
    await campo(page, t.limiteCredito).fill('1500');
    await campo(page, t.diaCorte).fill('15');
    await campo(page, t.diaPago).fill('5');
    await crear(page).click();
    await alTerminar(page);
    // AV-07: la deuda de la tarjeta queda como "te falta reservar" $300.00, a la vista en Cuentas
    await expect(page.locator('[data-detalle-tarjeta]')).toContainText(glosario.teFaltaReservar);
    await esperarMonto(page.locator('[data-detalle-tarjeta] [data-centavos]').first(), 30000);
  });

  test('PRU-E2E-CTA-102 [CA-50.2, ESC-02, AV-01] con hoy el 5 de marzo, un ahorro con apertura el 25 de enero muestra el impacto en Listo para asignar antes de confirmar', async ({
    page,
  }) => {
    await preparar('2027-03-05');
    await abrir(page);
    await campo(page, t.nombre).fill('Ahorro');
    await campo(page, t.apertura).fill('2027-01-25');
    await campo(page, t.saldo.efectivo).fill('500');
    await crear(page).click();

    const titulo = page.getByRole('heading', { name: t.revisar });
    await expect(titulo).toBeFocused();
    await expect(page.getByText(t.impactoLpa('+$500.00'))).toBeVisible();
    await expect(page.getByText(t.avisos['AV-01'] ?? '')).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await alTerminar(page);
  });

  test('PRU-E2E-CTA-103 [CA-50.3, ESC-01] creo un préstamo en curso con capital pendiente de $5,000.00 y 10 cuotas pagadas', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page, `${RUTA}?tipo-cuenta=prestamo`);
    await campo(page, t.nombre).fill('Carro');
    await campo(page, t.contraparte).fill('Banco');
    await campo(page, t.montoOriginal).fill('8000');
    await campo(page, t.saldo.prestamo).fill('5000');
    await campo(page, t.cuotaPactada).fill('250');
    await campo(page, t.plazoCuotas).fill('36');
    await campo(page, t.cuotasPagadas).fill('10');
    await crear(page).click();
    await alTerminar(page);
  });

  test('PRU-E2E-CTA-104 [CA-50.4] el formulario avisa antes de enviar que "visa oro" ya se usa y el servidor la rechaza', async ({
    page,
  }) => {
    await preparar('2027-02-05', [{ op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta', saldo: 0 }]);
    await abrir(page, `${RUTA}?tipo-cuenta=tarjeta`);
    await campo(page, t.nombre).fill('visa oro');
    await expect(page.getByText(t.nombreEnUso('Visa Oro'))).toBeVisible();
    await campo(page, t.saldo.tarjeta).fill('0');
    await campo(page, t.limiteCredito).fill('1500');
    await campo(page, t.diaCorte).fill('15');
    await campo(page, t.diaPago).fill('5');
    await crear(page).click();
    await expect(page.getByText('Ya existe visa oro en Pagos de tarjeta.')).toBeVisible();
    await expect(page).toHaveURL(/\/cuentas\/nueva(\?|$)/);
  });

  test('PRU-E2E-CTA-105 [CA-50.5, CB-14] una segunda cuenta del BAC terminada en 4821 se rechaza y una de Banco Agrícola con 4821 se acepta', async ({
    page,
  }) => {
    await preparar('2027-02-05', [
      { op: 'OP-01', cuenta: 'Cuenta BAC', saldo: 100, ultimos4: '4821' },
    ]);
    await abrir(page);
    await campo(page, t.nombre).fill('Otra del BAC');
    await page.getByRole('radio', { name: 'BAC', exact: true }).click();
    await campo(page, t.ultimos4).fill('4821');
    await campo(page, t.saldo.efectivo).fill('10');
    await crear(page).click();
    await expect(page.getByText('Ya tenés una cuenta de BAC terminada en 4821.')).toBeVisible();

    await page.getByRole('radio', { name: 'Banco Agrícola' }).click();
    await crear(page).click();
    await alTerminar(page);
  });

  test('PRU-E2E-CTA-400 [CA-50.1] creo una billetera y una cuenta de ahorro; Cuentas y su detalle las dibujan con la identidad de su subtipo', async ({
    page,
  }) => {
    await preparar('2027-02-05');
    await abrir(page);
    await expect(campo(page, t.nombre)).toHaveValue(s.nombres.corriente);
    await page
      .getByRole('radiogroup', { name: s.etiqueta })
      .getByRole('radio', { name: s.opciones.billetera })
      .click();
    await expect(campo(page, t.nombre)).toHaveValue(s.nombres.billetera);
    await expect(page.getByText(s.ayudas.billetera)).toBeVisible();
    await expect(campo(page, t.ultimos4)).toHaveCount(0);
    await campo(page, t.saldo.efectivo).fill('40');
    await crear(page).click();
    await alTerminar(page);

    await abrir(page);
    await page
      .getByRole('radiogroup', { name: s.etiqueta })
      .getByRole('radio', { name: s.opciones.ahorro })
      .click();
    await expect(campo(page, t.nombre)).toHaveValue(s.nombres.ahorro);
    await expect(campo(page, t.ultimos4)).toHaveValue('');
    await campo(page, t.saldo.efectivo).fill('500');
    await crear(page).click();
    await alTerminar(page);

    const tarjeta = (nombre: string) =>
      page.locator('[data-identidad="efectivo"]').filter({ hasText: nombre });
    await expect(tarjeta(s.nombres.billetera)).toHaveAttribute('data-subtipo', 'billetera');
    await expect(tarjeta(s.nombres.ahorro)).toHaveAttribute('data-subtipo', 'ahorro');
    await tarjeta(s.nombres.ahorro).click();
    await expect(page).toHaveURL(/\/cuentas\/[^/]+$/);
    await expect(page.locator('header[data-identidad="efectivo"]')).toHaveAttribute(
      'data-subtipo',
      'ahorro',
    );
  });
  // [CH-261] [CH-262] El préstamo en curso del usuario: 6 de 18 cuotas pagadas y Banco Agrícola con sus condiciones.
  test('PRU-E2E-CTA-410 [CA-50.3] con Banco Agrícola pido seguro y comisión al crear un préstamo con 6 de 18 cuotas pagadas; el detalle sigue en la 7 y a 1440 px el formulario va en dos columnas sin desplazamiento horizontal', async ({
    page,
  }) => {
    await preparar('2026-11-13');
    if (test.info().project.name === 'escritorio')
      await page.setViewportSize({ width: 1440, height: 900 });
    await abrir(page, `${RUTA}?tipo-cuenta=prestamo`);
    await campo(page, t.nombre).fill('Préstamo BA');
    await campo(page, t.contraparte).fill('Banco Agrícola');
    await campo(page, t.montoOriginal).fill('6295');
    await campo(page, t.saldo.prestamo).fill('3934.62');
    await campo(page, t.cuotaPactada).fill('377.98');
    await campo(page, t.plazoCuotas).fill('18');
    await campo(page, t.cuotasPagadas).fill('6');
    await page.getByText(t.seccionCondiciones).click();
    await campo(page, t.tasaAnual).fill('8.25');
    await expect(campo(page, t.seguroPrimerMes)).toHaveCount(0);
    await page
      .getByRole('radiogroup', { name: t.modelo })
      .getByRole('radio', { name: t.modelos.banco_agricola })
      .click();
    await campo(page, t.seguroPrimerMes).fill('5');
    await campo(page, t.comision).fill('62.95');
    if (test.info().project.name === 'escritorio') {
      const formulario = page.locator('form[data-columnas="2"]');
      const [izquierda, derecha] = await Promise.all([
        formulario.locator(':scope > div').nth(0).boundingBox(),
        formulario.locator(':scope > div').nth(1).boundingBox(),
      ]);
      expect(Math.round((await formulario.boundingBox())?.width ?? 0)).toBe(1096);
      expect(Math.abs((izquierda?.width ?? 0) - (derecha?.width ?? 0))).toBeLessThanOrEqual(1);
      expect(derecha?.x ?? 0).toBeGreaterThan((izquierda?.x ?? 0) + (izquierda?.width ?? 0));
      await expect(
        formulario.locator(':scope > div').nth(1).getByRole('button', { name: t.guardar }),
      ).toBeVisible();
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(desborde).toBe(0);
    }
    await crear(page).click();
    await alTerminar(page);
    await page.getByText('Préstamo BA').first().click();
    await expect(page).toHaveURL(/\/cuentas\/[^/]+$/);
    const proxima = page.locator('[data-bloque="proxima-cuota"]');
    await expect(proxima).toContainText('7 de 18');
    await expect(proxima).toContainText('Cuotas pagadas 6 de 18');
  });

  // [CH-264] [CH-265] El caso del usuario: Banco Agrícola elegido como institución, abierto el 08/05/2026 con 6 de 18 pagadas.
  test('PRU-E2E-CTA-830 [CA-50.3] con Banco Agrícola como institución no pido «Quién te prestó»; el modelo sin tasa se rechaza en la tasa y, con 8.25 %, la próxima cuota es la 7 del 08/12/2026 y ninguna sale atrasada', async ({
    page,
  }) => {
    await preparar('2026-11-13');
    await abrir(page, `${RUTA}?tipo-cuenta=prestamo`);
    await campo(page, t.nombre).fill('Préstamo BA');
    await expect(campo(page, t.contraparte)).toBeVisible();
    await page
      .getByRole('radiogroup', { name: t.institucion })
      .getByRole('radio', { name: 'Banco Agrícola' })
      .click();
    await expect(campo(page, t.contraparte)).toHaveCount(0);
    await campo(page, t.apertura).fill('2026-05-08');
    await campo(page, t.montoOriginal).fill('6295');
    await campo(page, t.saldo.prestamo).fill('3934.62');
    await campo(page, t.cuotaPactada).fill('377.98');
    await campo(page, t.plazoCuotas).fill('18');
    await campo(page, t.cuotasPagadas).fill('6');
    await page.getByText(t.seccionCondiciones).click();
    await page
      .getByRole('radiogroup', { name: t.modelo })
      .getByRole('radio', { name: t.modelos.banco_agricola })
      .click();
    await crear(page).click();
    await expect(
      page.getByText('Con el modelo Banco Agrícola, indicá la tasa anual.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/cuentas\/nueva/);
    await campo(page, t.tasaAnual).fill('8.25');
    await crear(page).click();
    // La apertura cae en un período cerrado: AV-01 pide confirmar
    await page.getByRole('button', { name: t.confirmar }).click();
    await alTerminar(page);
    await page.getByText('Préstamo BA').first().click();
    await expect(page).toHaveURL(/\/cuentas\/[^/]+$/);
    const proxima = page.locator('[data-bloque="proxima-cuota"]');
    await expect(proxima).toContainText('7 de 18');
    await expect(proxima).toContainText('08/12/2026');
    await expect(proxima).toContainText('Cuotas pagadas 6 de 18');
    await expect(page.getByText('Atrasada')).toHaveCount(0);
    await expect(page.getByText('Banco Agrícola').first()).toBeVisible();
  });
});
