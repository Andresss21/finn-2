// Recorrido 4.1 «Primer uso» de 06 (REC-4.1; 07 §17: un recorrido es una E2E). Parte de una base recién sembrada (hoy 05/02/2027,
// como ESC-01) y encadena las pantallas de sus fichas con el reloj de prueba alineado (07 §4.1), sin datos sembrados a mitad del
// recorrido. Los números los pone el motor (PF-3). Pasos que no se recorren: 1 a 3 (ingresar y registrar el factor): el usuario de
// prueba ya tiene su factor (`entrarAal2`) y 06 los asigna a FT-01 y FT-02, que los recorren por su cuenta (PRU-E2E-ACCESO); y 10
// (aceptar las notificaciones): el permiso del navegador y la suscripción push no se dan en la E2E (CA-70.7, lista manual).
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../ayudas/esperas.ts';
import { esperarMonto } from '../ayudas/montos.ts';
import { alinearRelojes } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario } from '../../../../packages/dominio/escenarios/tipos.ts';
import { ajustesWebhook as aw } from '../../src/textos/ajustes-webhook.ts';
import { bandeja as tb } from '../../src/textos/bandeja.ts';
import { cuentas } from '../../src/textos/cuentas.ts';
import { cuentasNueva as tc } from '../../src/textos/cuentas-nueva.ts';
import { estructura as te } from '../../src/textos/estructura.ts';
import { glosario } from '../../src/textos/glosario.ts';
import { plantilla as tp } from '../../src/textos/plantilla.ts';
import { primerosPasos as p } from '../../src/textos/primeros-pasos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-05';

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const enlace = (page: Page, nombre: string) =>
  page.getByRole('link', { name: nombre, exact: true });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const montoDePago = (page: Page, n: 0 | 1) =>
  page.locator('[data-fila-pago] [data-centavos]').nth(n);

test.describe('PRU-E2E-INICIO recorrido 4.1 primer uso', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-INICIO-410 [REC-4.1, ESC-01, CA-04.1, CA-04.3, CA-04.12, CA-50.1, CA-03.1, CA-03.3, CA-10.1] de una base vacía a un presupuesto usable: los tres Primeros pasos se cumplen uno a uno, el token llega una sola vez, el SMS de prueba queda como no reconocido y asignar $300.00 a Pago T deja Listo para asignar en $700.00 y nada por reservar', async ({
    page,
    request,
  }) => {
    await alinearRelojes(page, `${HOY}T10:00:00-06:00`);
    const base: Escenario = {
      id: 'SEM-REC-4.1',
      titulo: 'Semilla de 4.1 Primer uso',
      refs: ['REC-4.1'],
      hoy: HOY,
      estadoInicial: [],
      pasos: [],
    };
    await sembrar(base, HOY);

    // Paso 4: Inicio con los tres Primeros pasos sin marcar y sin «Ocultar por ahora» (CA-04.1)
    await abrir(page, '/');
    await expect(page.getByRole('heading', { name: p.titulo })).toBeVisible();
    await expect(enlace(page, p.pasos.cuenta)).toHaveAttribute('href', '/cuentas/nueva');
    await expect(enlace(page, p.pasos.categorias)).toHaveAttribute(
      'href',
      '/presupuesto/estructura',
    );
    await expect(enlace(page, p.pasos.sms)).toHaveAttribute('href', '/ajustes/webhook');
    await expect(page.getByText(/^Hecho: /)).toHaveCount(0);
    await expect(page.getByText(p.ocultar)).toHaveCount(0);

    // Paso 5: «Crear una cuenta»: Ahorro con $1,000.00 (paso 1 de ESC-01)
    await enlace(page, p.pasos.cuenta).click();
    await expect(page).toHaveURL(/\/cuentas\/nueva$/);
    await esperarHidratacion(page);
    await campo(page, tc.nombre).fill('Ahorro');
    await campo(page, tc.saldo.efectivo).fill('1000');
    await page.getByRole('button', { name: tc.guardar }).click();
    await expect(page).toHaveURL(/\/cuentas$/);
    await expect(page.locator('[data-identidad="efectivo"]').getByText('Ahorro')).toBeVisible();
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);

    // Paso 6: la tarjeta T con deuda $300.00: AV-07, te falta reservar, y «Pago T» en «Pagos de tarjeta»
    await abrir(page, '/cuentas/nueva?tipo-cuenta=tarjeta');
    await campo(page, tc.nombre).fill('T');
    await campo(page, tc.saldo.tarjeta).fill('300');
    await expect(page.getByRole('radio', { name: tc.debo })).toBeChecked();
    await campo(page, tc.limiteCredito).fill('1500');
    await campo(page, tc.diaCorte).fill('15');
    await campo(page, tc.diaPago).fill('5');
    await page.getByRole('button', { name: tc.guardar }).click();
    await expect(page).toHaveURL(/\/cuentas$/);
    await expect(page.locator('[data-detalle-tarjeta]')).toContainText(glosario.teFaltaReservar);
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDePago(page, 0), 30000);
    await esperarMonto(lpa(page), 100000);

    // Paso 7: «Crear las categorías» → lista sugerida; quita «Educación»: 10 grupos y 34 categorías (CA-04.3)
    await abrir(page, '/');
    await enlace(page, p.pasos.categorias).click();
    await expect(page).toHaveURL(/\/presupuesto\/estructura$/);
    await esperarContenido(page);
    await enlace(page, te.usarPlantilla).click();
    await expect(page).toHaveURL(/\/presupuesto\/estructura\/plantilla$/);
    await esperarContenido(page);
    await page.getByRole('button', { name: tp.quitarGrupo('Educación'), exact: true }).click();
    await page.getByRole('button', { name: tp.crear(34), exact: true }).click();
    await expect(page.getByText(tp.creadas(44), { exact: true })).toBeVisible();
    await abrir(page, '/presupuesto/estructura');
    await expect(page.getByRole('heading', { name: 'Educación' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Pagos de tarjeta' })).toBeVisible();

    // Paso 8: «Conectar los SMS»: el token se ve una sola vez y los Primeros pasos desaparecen (CA-03.1, CA-04.12)
    await abrir(page, '/');
    await enlace(page, p.pasos.sms).click();
    await expect(page).toHaveURL(/\/ajustes\/webhook$/);
    await esperarHidratacion(page);
    await page.getByRole('button', { name: aw.generar, exact: true }).click();
    const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await abrir(page, '/ajustes/webhook');
    await expect(page.getByTestId('token')).toHaveCount(0);
    await abrir(page, '/');
    await expect(page.getByRole('heading', { name: p.titulo })).toHaveCount(0);

    // Paso 9: el SMS de prueba de MacroDroid (`POST /api/sms`) aparece en la Bandeja como no reconocido (CA-03.3)
    const texto = 'Mensaje de prueba "sin formato" de MacroDroid';
    const respuesta = await request.post('/api/sms', {
      headers: { authorization: `Bearer ${token}` },
      data: { texto, remitente: 'BAC' },
    });
    expect(respuesta.status()).toBe(200);
    const filas = page.locator('[data-movimiento]');
    await expect(async () => {
      await abrir(page, '/bandeja');
      await expect(filas).toHaveCount(1);
    }).toPass();
    await expect(filas).toHaveAttribute('data-vista', 'noReconocido');
    await expect(filas).toContainText(cuentas.bandeja.estados.noReconocido);
    await expect(filas.getByText(texto, { exact: true })).toBeVisible();
    await expect(page.getByText(tb.desglose.noReconocidos(1))).toBeVisible();

    // Paso 11: asignar $300.00 a Pago T: Listo para asignar $700.00 y te falta reservar $0.00 (paso 3 de ESC-01)
    await abrir(page, '/presupuesto');
    const href = await page.locator('[data-fila-pago]').first().getAttribute('href');
    const idPago = href?.split('?')[0]?.split('/').pop() ?? '';
    expect(idPago).not.toBe('');
    await abrir(page, `/presupuesto/asignar/${idPago}`);
    await page.getByLabel(/Nuevo valor de Asignado/).fill('300');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(lpa(page), 70000);
    await esperarMonto(montoDePago(page, 0), 0);
    await esperarMonto(montoDePago(page, 1), 30000);
  });
});
