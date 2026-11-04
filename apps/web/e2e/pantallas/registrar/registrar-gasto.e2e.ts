// FT-21 Registrar gasto con división y por cobrar, trozo 1 (06 §2.8; 05 §2.4; 07 §17: una pantalla o un flujo es una E2E). Cada prueba parte
// de una base sembrada con las operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre
// `/registrar/gasto` como la persona. Los números los pone el motor: la prueba abre el presupuesto y comprueba que los dibuja (PF-3).
// Los campos se buscan por su etiqueta del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { formularios } from '../../../src/textos/formularios.ts';
import { registrarGasto as t } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// Las operaciones de 01 §8 hasta el paso 1 de ESC-19, ESC-24 y ESC-20 (y, para CA-21.4, hasta el paso 2 de ESC-20, que crea a Ana).
const ESC19_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Mascota', monto: 20, periodo: 'P1' },
];
const ESC24_PASO1: Op[] = [
  ...ESC19_PASO1.slice(0, 4),
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Mascota', monto: 50, periodo: 'P1' },
];
const ESC20_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
];
const ESC20_PASO2: Op[] = [
  ...ESC20_PASO1,
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Super', monto: 25 },
      { deudor: 'Ana', monto: 25 },
    ],
  },
];

const ESC12_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Intereses y comisiones' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Intereses y comisiones', monto: 20, periodo: 'P1' },
];

async function preparar(hoy: string, estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REG-GASTO',
    titulo: 'Semilla de FT-21',
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
/** La cuenta y el destino de cada línea son selecciones nativas del export (K2, S5): se elige por el nombre de la opción. */
const elegir = async (page: Page, etiqueta: string, nombre: string): Promise<void> => {
  const control = campo(page, etiqueta);
  // React pone el valor del estado al hidratar el control: un cambio hecho antes se perdería (los campos de texto lo repiten, este no)
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  await control.selectOption({ label: nombre });
};
const elegida = (page: Page, etiqueta: string) => campo(page, etiqueta).locator('option:checked');
/** Con el total escrito el botón dice «Guardar $X» (S5); sin él, «Guardar gasto». */
const guardar = (page: Page) => page.getByRole('button', { name: /^Guardar/ });

/** Escribe una parte con categoría: su monto y la categoría elegida. */
async function parteConCategoria(
  page: Page,
  n: number,
  monto: string,
  categoria: string,
): Promise<void> {
  await campo(page, t.montoDeParte(String(n))).fill(monto);
  await elegir(page, t.categoriaDeParte(String(n)), categoria);
}

async function agregarParte(page: Page): Promise<void> {
  await page.getByRole('button', { name: t.agregarLinea }).click();
}

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ hasText: nombre });
/** El primer monto de una fila de categoría es su Disponible (05 §10.8). */
const disponible = (page: Page, nombre: string) =>
  fila(page, nombre).locator('[data-centavos]').first();
/** La fila de pago de una tarjeta: su primer monto es «Te falta reservar» y el segundo, lo disponible para pagar (05 §10.8). */
const pagoTarjeta = (page: Page) =>
  page.locator('[data-fila-pago]').first().locator('[data-centavos]');
const listoParaAsignar = (page: Page) =>
  page.locator('[data-resumen-lpa]').locator('[data-centavos]').first();

test.describe('PRU-E2E-TX', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-376 [CA-21.1, ESC-19] registro una compra con T de $150.00 con $110.00 en Super y $40.00 en Mascota y el presupuesto queda con Super −$10.00, Mascota −$20.00, Pago T $120.00 y $30.00 por reservar', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await page.keyboard.press('Tab'); // el primer Tab muestra «Saltar al contenido» (11.2): se mide ya visible
    await revisarTactil(page);
    await expect(campo(page, t.fecha)).toHaveValue('2027-02-10');
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('150');
    await parteConCategoria(page, 1, '110', 'Super');
    await expect(page.getByTestId('falta-repartir')).toHaveText(t.faltaRepartir('$40.00'));
    await agregarParte(page);
    await parteConCategoria(page, 2, '40', 'Mascota');
    await expect(page.getByTestId('falta-repartir')).toHaveCount(0);
    await expect(page.getByTestId('suma-lineas')).toHaveText(
      `${t.sumaDeLineas}$150.00${t.sumaDe}$150.00`,
    );
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.guardado(t.sinComercio, '$150.00', 'T', '2'),
    );
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), -1000);
    await esperarMonto(disponible(page, 'Mascota'), -2000);
    await esperarMonto(pagoTarjeta(page).nth(0), 3000);
    await esperarMonto(pagoTarjeta(page).nth(1), 12000);
  });

  test('PRU-E2E-TX-377 [CA-21.2, ESC-24] registro una compra con T de $200.00 con $90.00 en Super, $30.00 en Mascota y $80.00 por cobrar a Ana y el presupuesto queda con Super $10.00, Mascota $20.00, Pago T $120.00 y $80.00 por reservar', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC24_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('200');
    await parteConCategoria(page, 1, '90', 'Super');
    await agregarParte(page);
    await parteConCategoria(page, 2, '30', 'Mascota');
    await agregarParte(page);
    await campo(page, t.montoDeParte('3')).fill('80');
    // sin deudores todavía, la persona se escribe: se elige «Otra persona» entre las que me deben y aparece su nombre
    await elegir(page, t.categoriaDeParte('3'), t.porCobrarA(t.otraPersona));
    await campo(page, t.deudorNuevoDeParte('3')).fill('Ana');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.guardado(t.sinComercio, '$200.00', 'T', '3'),
    );
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), 1000);
    await esperarMonto(disponible(page, 'Mascota'), 2000);
    await esperarMonto(pagoTarjeta(page).nth(0), 8000);
    await esperarMonto(pagoTarjeta(page).nth(1), 12000);
  });

  test('PRU-E2E-TX-378 [CA-21.3, ESC-20] registro una compra con débito de $50.00 con $25.00 en Super y $25.00 por cobrar a Ana y Listo para asignar baja a $675.00 con $25.00 en camino', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC20_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'Ahorro');
    await campo(page, t.total).fill('50');
    await parteConCategoria(page, 1, '25', 'Super');
    await agregarParte(page);
    await campo(page, t.montoDeParte('2')).fill('25');
    await elegir(page, t.categoriaDeParte('2'), t.porCobrarA(t.otraPersona));
    await campo(page, t.deudorNuevoDeParte('2')).fill('Ana');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(listoParaAsignar(page), 67500);
    await expect(page.locator('[data-en-camino]').first()).toContainText('$25.00');
  });

  test('PRU-E2E-TX-379 [CA-21.4] con un deudor "Ana" ya creado, escribir "ana" como otra persona deja la parte a nombre de Ana y el resultado lo dice', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC20_PASO2);
    await abrir(page, '/registrar/gasto');
    await campo(page, t.total).fill('40');
    await elegir(page, t.cuenta, 'Ahorro');
    await parteConCategoria(page, 1, '20', 'Super');
    await agregarParte(page);
    await campo(page, t.montoDeParte('2')).fill('20');
    await expect(
      campo(page, t.categoriaDeParte('2')).locator('option', { hasText: t.porCobrarA('Ana') }),
    ).toHaveCount(1);
    await elegir(page, t.categoriaDeParte('2'), t.porCobrarA(t.otraPersona));
    await campo(page, t.deudorNuevoDeParte('2')).fill('ana');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('deudor-existente')).toHaveText(t.deudorExistente('Ana'));
  });

  test('PRU-E2E-TX-380 [CA-21.5] con partes que suman $149.00 y un total de $150.00, enviar muestra "Las partes suman $149.00 y el total es $150.00." junto al campo de las partes y no guarda', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('150');
    await parteConCategoria(page, 1, '110', 'Super');
    await agregarParte(page);
    await parteConCategoria(page, 2, '39', 'Mascota');
    await expect(page.getByTestId('falta-repartir')).toHaveText(t.faltaRepartir('$1.00'));
    await guardar(page).click();
    await expect(
      page
        .locator('[data-campo-lineas]')
        .getByText('Las partes suman $149.00 y el total es $150.00.'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listo })).toHaveCount(0);
    // el servidor no guardó nada: Super y Mascota siguen como en el paso 1
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), 10000);
    await esperarMonto(disponible(page, 'Mascota'), 2000);
  });

  test('PRU-E2E-TX-381 [CA-21.6] una parte sin categoría ni deudor se rechaza con "Cada parte necesita una categoría o un por cobrar." y no se crea nada', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('50');
    await campo(page, t.montoDeParte('1')).fill('50');
    await guardar(page).click();
    await expect(page.getByText(t.lineaSinDestino)).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listo })).toHaveCount(0);
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), 10000);
    await expect(page.locator('[data-fila-pago]').first()).toBeVisible();
    await esperarMonto(pagoTarjeta(page).nth(1), 0);
  });

  test('PRU-E2E-TX-382 desde Registrar elijo un gasto y se abre la página completa del gasto, y un ingreso se abre sobre Registrar y se cierra volviendo a ella', async ({
    page,
  }) => {
    await preparar('2027-02-10', [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'Débito' },
    ]);
    await abrir(page, '/registrar');
    await expect(page.getByRole('heading', { name: t.titulo, level: 1 })).toBeVisible();
    await page.getByRole('link', { name: t.tipoIngreso }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(/\/registrar\/ingreso$/);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/registrar$/);
    await page.getByRole('link', { name: t.tipoGasto }).click();
    await expect(page).toHaveURL(/\/registrar\/gasto$/);
    await expect(page.getByRole('heading', { name: t.tituloGasto, level: 1 })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(campo(page, t.total)).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/registrar$/);
    await expect(page.getByRole('heading', { name: t.titulo, level: 1 })).toBeVisible();
  });

  test('PRU-E2E-TX-383 sin cuentas, Registrar y el gasto explican que primero hay que crear una y enlazan a crearla', async ({
    page,
  }) => {
    await preparar('2027-02-10', []);
    await abrir(page, '/registrar');
    await expect(page.getByRole('heading', { name: t.sinCuentasTitulo })).toBeVisible();
    await expect(page.getByRole('link', { name: t.crearCuenta })).toHaveAttribute(
      'href',
      '/cuentas/nueva',
    );
    await abrir(page, '/registrar/gasto');
    await expect(page.getByRole('heading', { name: t.sinCuentasTitulo })).toBeVisible();
    await expect(page.getByRole('link', { name: t.crearCuenta })).toHaveAttribute(
      'href',
      '/cuentas/nueva',
    );
  });

  test('PRU-E2E-TX-390 [CA-21.7] una fecha posterior a hoy se rechaza nombrando hoy, y una anterior a la apertura de la cuenta se rechaza nombrando la apertura, y no se guarda nada', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC20_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'Ahorro');
    await campo(page, t.total).fill('10');
    await parteConCategoria(page, 1, '10', 'Super');
    await campo(page, t.fecha).fill('2027-02-11');
    await guardar(page).click();
    await expect(
      page.getByText('La fecha no puede ser posterior a hoy (10/02/2027).'),
    ).toBeVisible();
    await campo(page, t.fecha).fill('2027-01-10');
    await guardar(page).click();
    await expect(
      page.getByText('Ahorro se abrió el 21/01/2027; la fecha no puede ser anterior.'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: t.listo })).toHaveCount(0);
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), 30000);
  });

  test('PRU-E2E-TX-391 [CA-21.8, ESC-12] registro un cargo con T de $25.00 en "Intereses y comisiones" y Int queda en −$5.00 con sobregiro de tarjeta de $5.00 y Pago T en $20.00', async ({
    page,
  }) => {
    await preparar('2027-02-16', ESC12_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('25');
    await parteConCategoria(page, 1, '25', 'Intereses y comisiones');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Intereses y comisiones'), -500);
    await esperarMonto(pagoTarjeta(page).nth(1), 2000);
    await fila(page, 'Intereses y comisiones').click();
    const sobregiro = page.locator('[data-sobregiro]');
    await expect(sobregiro.first()).toHaveAttribute('data-sobregiro', 'tarjeta');
    await esperarMonto(sobregiro.locator('[data-centavos]').first(), 500);
  });

  test('PRU-E2E-TX-392 [CA-21.9] con el formulario a medio llenar, recargar la pestaña restaura los campos y las partes y permite descartar el borrador', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('150');
    await campo(page, t.comercio).fill('PriceSmart');
    await parteConCategoria(page, 1, '110', 'Super');
    await agregarParte(page);
    await campo(page, t.montoDeParte('2')).fill('40');
    // el borrador se escribe 500 ms después del último cambio: se espera a que tenga la segunda parte
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.entries<string>(sessionStorage as unknown as Record<string, string>).some(
            ([k, v]) => k.startsWith('finn:borrador:') && v.includes('"monto":"40"'),
          ),
        ),
      )
      .toBe(true);
    await page.reload();
    await esperarHidratacion(page);
    await expect(page.getByText(formularios.borradorRecuperado)).toBeVisible();
    await expect(campo(page, t.total)).toHaveValue('150');
    await expect(campo(page, t.comercio)).toHaveValue('PriceSmart');
    await expect(campo(page, t.montoDeParte('1'))).toHaveValue('110');
    await expect(campo(page, t.montoDeParte('2'))).toHaveValue('40');
    await expect(elegida(page, t.categoriaDeParte('1'))).toHaveText('Super');
    await page.getByRole('button', { name: formularios.descartarBorrador }).click();
    await expect(campo(page, t.total)).toHaveValue('');
    await expect(page.getByText(formularios.borradorRecuperado)).toHaveCount(0);
  });

  test('PRU-E2E-TX-393 [CA-21.10] con una compra aprobada de "Mercado" en Super, escribir ese comercio sugiere Super y un toque lo pone en la parte 1', async ({
    page,
  }) => {
    await preparar('2027-02-21', [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-07', categoria: 'Mascota' },
      { op: 'OP-21', monto: 500 },
      { op: 'OP-14', categoria: 'Super', monto: 50 },
      {
        op: 'OP-35',
        etiqueta: 'sms',
        cuenta: 'T',
        monto: 30,
        comercio: 'Mercado',
        recibido: '2027-02-20T19:00',
        fecha: '2027-02-20',
      },
      { op: 'OP-37', etiqueta: 'sms', categoria: 'Super', aprobado: '2027-02-21T08:00' },
    ]);
    await abrir(page, '/registrar/gasto');
    await campo(page, t.comercio).fill('Mercado');
    await expect(page.getByTestId('sugerencia')).toContainText(t.sugerencia('Super'));
    await page.getByRole('button', { name: t.usarSugerencia }).click();
    await expect(elegida(page, t.categoriaDeParte('1'))).toHaveText('Super');
    await campo(page, t.comercio).fill('Otro sitio');
    await expect(page.getByTestId('sugerencia')).toHaveCount(0);
  });

  test('PRU-E2E-TX-394 [CA-21.12, AV-01] un gasto de $148.60 con 3 líneas en el período activo se guarda sin previsualizar y dice "Guardado: PRICESMART · $148.60 · T · 3 líneas" con un enlace a cada categoría, y con la fecha en un período cerrado primero pide confirmar con el aviso', async ({
    page,
  }) => {
    await preparar('2027-03-05', [
      ...ESC19_PASO1.slice(0, 5),
      { op: 'OP-14', categoria: 'Super', monto: 100 },
      { op: 'OP-14', categoria: 'Mascota', monto: 20 },
    ]);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('148.60');
    await campo(page, t.comercio).fill('PRICESMART');
    await parteConCategoria(page, 1, '100', 'Super');
    await agregarParte(page);
    await parteConCategoria(page, 2, '40', 'Mascota');
    await agregarParte(page);
    await parteConCategoria(page, 3, '8.60', 'Super');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado')).toHaveText(
      t.guardado('PRICESMART', '$148.60', 'T', '3'),
    );
    await expect(page.getByRole('link', { name: t.verCategoria('Super') })).toHaveAttribute(
      'href',
      /\/presupuesto\/categorias\/.+/,
    );
    await expect(page.getByRole('link', { name: t.verCategoria('Mascota') })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Ver / })).toHaveCount(2);
    // con la fecha en un período cerrado, antes aparece el impacto con el aviso AV-01
    await page.getByRole('button', { name: t.registrarOtro }).click();
    await esperarHidratacion(page);
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.fecha).fill('2027-01-25');
    await campo(page, t.total).fill('10');
    await parteConCategoria(page, 1, '10', 'Super');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(t.avisoPeriodoCerrado)).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
  });

  test('PRU-E2E-TX-440 [CA-21.1] la cuenta se elige en una selección de 52 px que dice la deuda de la tarjeta y Fecha y Total van en dos columnas', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegir(page, t.cuenta, 'T');
    await expect(campo(page, t.cuenta).locator('xpath=..')).toContainText(t.deudaDeCuenta('$0.00'));
    expect((await campo(page, t.cuenta).locator('xpath=..').boundingBox())?.height).toBe(52);
    await campo(page, t.total).fill('150');
    const fecha = await campo(page, t.fecha).boundingBox();
    const total = await campo(page, t.total).boundingBox();
    expect(Math.abs((fecha?.y ?? 0) - (total?.y ?? 99))).toBeLessThan(2);
    expect(total?.x ?? 0).toBeGreaterThan((fecha?.x ?? 0) + (fecha?.width ?? 0) - 1);
  });

  test('PRU-E2E-TX-441 [CA-21.1] dividir dice «Dividir · opcional · N líneas», cada línea es una fila con selección, monto y × en la misma altura y «+ Agregar línea» suma otra', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    const lineas = page.locator('[data-campo-lineas]');
    await expect(lineas).toContainText(t.dividir);
    await expect(lineas).toContainText(t.opcional);
    await expect(lineas).toContainText(t.lineas('1'));
    await agregarParte(page);
    await expect(lineas).toContainText(t.lineas('2'));
    const destino = await campo(page, t.categoriaDeParte('2')).boundingBox();
    const monto = await campo(page, t.montoDeParte('2')).boundingBox();
    const quitar = await page.getByRole('button', { name: t.quitarParte('2') }).boundingBox();
    expect(Math.abs((destino?.y ?? 0) - (monto?.y ?? 99))).toBeLessThan(2);
    expect(monto?.width).toBe(120);
    expect(quitar?.width).toBe(44);
    expect((quitar?.x ?? 0) > (monto?.x ?? 99)).toBe(true);
    await page.getByRole('button', { name: t.quitarParte('2') }).click();
    await expect(lineas).toContainText(t.lineas('1'));
  });

  test('PRU-E2E-TX-442 [CA-21.12] el botón dice «Guardar $X» con el total escrito y queda en un pie fijo abajo en teléfono y bajo las líneas, a la derecha, en computadora', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await expect(guardar(page)).toHaveText(t.guardar);
    await campo(page, t.total).fill('150');
    await expect(guardar(page)).toHaveText(t.guardarMonto('$150.00'));
    const boton = await guardar(page).boundingBox();
    const lineas = await page.locator('[data-campo-lineas]').boundingBox();
    const alto = page.viewportSize()?.height ?? 0;
    if ((page.viewportSize()?.width ?? 0) >= 768) {
      expect(Math.abs((boton?.x ?? 0) - (lineas?.x ?? 99))).toBeLessThan(2);
    } else {
      expect((boton?.y ?? 0) + (boton?.height ?? 0)).toBeGreaterThan(alto - 40);
      expect((boton?.y ?? 0) + (boton?.height ?? 0)).toBeLessThanOrEqual(alto);
    }
  });
});
