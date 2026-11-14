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
import { base } from '../../../src/textos/base.ts';
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
// [CH-276, CH-277] Los campos v3 (C-45 §4.8, C-49): el total es el billete «Total»; la cuenta, con 3 cuentas o menos, un segmentado
// en su fila (CA-K3-6); la categoría, una lista propia; las personas, chips; los montos de cada fila se nombran «Monto para …».
const total = (page: Page) => campo(page, t.totalV3);
const comercio = (page: Page) => page.getByLabel(t.comercio);
const elegirCuenta = async (page: Page, nombre: string): Promise<void> => {
  await page
    .getByRole('radiogroup', { name: t.cuentaV3 })
    .getByRole('radio', { name: nombre })
    .click();
};
const opcion = (page: Page, nombre: string) =>
  page
    .getByRole('option')
    .filter({ has: page.locator('.campo-opcion-nombre', { hasText: new RegExp(`^${nombre}$`) }) });
const disparadorDeCategoria = (page: Page) =>
  page.getByRole('button', { name: new RegExp(`^${t.categoria} `) }).first();
/** Con «Una», la categoría del gasto (o de tu parte). */
async function categoria(page: Page, nombre: string): Promise<void> {
  await disparadorDeCategoria(page).click();
  await opcion(page, nombre).click();
}
/** «Varias»: la primera queda como «Lo que queda»; cada otra se elige en su fila (la lista abre sola) y lleva su monto. */
async function varias(
  page: Page,
  primera: string,
  otras: readonly (readonly [string, string])[],
): Promise<void> {
  await categoria(page, primera);
  await page
    .getByRole('radiogroup', { name: t.cuantasCategorias })
    .getByRole('radio', { name: t.varias })
    .click();
  for (const [k, [nombre, monto]] of otras.entries()) {
    if (k > 0) await page.getByRole('button', { name: t.agregarCategoria }).click();
    await opcion(page, nombre).click();
    await campo(page, t.montoPara(nombre)).fill(monto);
  }
}
/** «Con alguien» con una persona nueva, escrita en «Otra persona». */
async function conPersonaNueva(page: Page, nombre: string): Promise<void> {
  await page.getByRole('radio', { name: t.conAlguien }).click();
  await page.getByRole('button', { name: base.otraPersona }).click();
  await campo(page, base.nombreDeLaPersona).fill(nombre);
  await page.getByRole('button', { name: base.agregar }).click();
}
const resumenes = (page: Page) => page.locator('.reparto-resumen');
/** Con el total escrito el botón dice «Guardar $X» (S5); sin él, «Guardar gasto». */
const guardar = (page: Page) => page.getByRole('button', { name: /^Guardar/ });
/** Apagado (`aria-disabled`, C-45 §11) sigue tocable: Playwright lo toma por deshabilitado, así que el clic se fuerza. */
const tocarGuardar = (page: Page) => guardar(page).click({ force: true });

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
    await expect(campo(page, t.fecha)).toHaveValue('10/02/2027');
    await elegirCuenta(page, 'T');
    await total(page).fill('150');
    // [CH-277] «Varias»: Super queda como «Lo que queda» y pasa a $110.00 sola al escribir Mascota (C-49 §2)
    await varias(page, 'Super', [['Mascota', '40']]);
    await expect(campo(page, t.montoPara('Super'))).toHaveValue('110.00');
    await expect(resumenes(page)).toHaveText(t.repartido('$150.00', '$150.00'));
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado').locator('p')).toHaveText(
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
    await elegirCuenta(page, 'T');
    await total(page).fill('200');
    // sin deudores todavía, Ana se escribe en «Otra persona» y se crea con la transacción (C-45 §9)
    await conPersonaNueva(page, 'Ana');
    await page
      .getByRole('radiogroup', { name: t.comoRepartirPersonas })
      .getByRole('radio', { name: t.montos })
      .click();
    await campo(page, t.tuParte).fill('120');
    await campo(page, t.montoDe('Ana')).fill('80');
    await varias(page, 'Super', [['Mascota', '30']]);
    await expect(campo(page, t.montoPara('Super'))).toHaveValue('90.00');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado').locator('p')).toHaveText(
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
    await elegirCuenta(page, 'Ahorro');
    await total(page).fill('50');
    // en partes iguales: Vos $25.00 y Ana $25.00 (C-45 §10)
    await conPersonaNueva(page, 'Ana');
    await categoria(page, 'Super');
    await expect(resumenes(page)).toHaveText(t.repartido('$50.00', '$50.00'));
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(listoParaAsignar(page), 67500);
    await expect(page.locator('[data-en-camino]').first()).toContainText('$25.00');
  });

  test('PRU-E2E-TX-379 [CA-21.4] con un deudor "Ana" ya creado, escribir "ana" como otra persona marca a Ana, lo dice y la parte queda a su nombre', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC20_PASO2);
    await abrir(page, '/registrar/gasto');
    await total(page).fill('40');
    await elegirCuenta(page, 'Ahorro');
    await page.getByRole('radio', { name: t.conAlguien }).click();
    await expect(page.getByRole('checkbox', { name: 'Ana' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await page.getByRole('button', { name: base.otraPersona }).click();
    await campo(page, base.nombreDeLaPersona).fill('ana');
    await page.getByRole('button', { name: base.agregar }).click();
    // [CH-276] se reutiliza la Ana existente sin importar mayúsculas y se avisa antes de guardar (C-45 §9)
    await expect(page.getByText(base.yaTenias('Ana'))).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Ana' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('checkbox')).toHaveCount(1);
    await categoria(page, 'Super');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByText(t.teDebe('Ana'))).toBeVisible();
  });

  test('PRU-E2E-TX-380 [CA-21.5] con categorías que suman $149.00 y un total de $150.00 la pantalla dice «Falta repartir $1.00.», Guardar dice por qué y no se guarda nada', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegirCuenta(page, 'T');
    await total(page).fill('150');
    await varias(page, 'Super', [['Mascota', '39']]);
    // [CH-277] escrita, Super deja de ser «Lo que queda»: al salir del campo se marca lo que falta (C-49 §3). El servidor sigue
    // validando la suma con `suma_lineas_distinta` (CA-R-15, en la prueba de componentes PRU-CMP-TX-870).
    await campo(page, t.montoPara('Super')).fill('110');
    await campo(page, t.montoPara('Super')).blur();
    await expect(resumenes(page)).toHaveText(t.faltaRepartirV3('$1.00'));
    await expect(guardar(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText(t.motivoCategorias(false))).toBeVisible();
    await tocarGuardar(page);
    await expect(page.getByRole('heading', { name: t.listo })).toHaveCount(0);
    // no se guardó nada: Super y Mascota siguen como en el paso 1
    await page.goto('/presupuesto');
    await esperarContenido(page);
    await esperarMonto(disponible(page, 'Super'), 10000);
    await esperarMonto(disponible(page, 'Mascota'), 2000);
  });

  test('PRU-E2E-TX-381 [CA-21.6] un gasto sin categoría no se envía: la fila dice «Elegí una categoría.» y no se crea nada', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegirCuenta(page, 'T');
    await total(page).fill('50');
    await tocarGuardar(page);
    // [CH-277] la línea sin destino se marca en el cliente antes de enviar; el servidor sigue con `linea_sin_destino`
    await expect(page.getByText(t.elegiCategoria)).toBeVisible();
    await expect(page.getByText(t.motivoCategoria)).toBeVisible();
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

  test('PRU-E2E-TX-390 [FT-21] con el período activo, una fecha posterior a hoy o anterior al inicio del período queda fuera del rango del campo con «Elegí una fecha dentro del rango permitido.» y no se guarda nada', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC20_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegirCuenta(page, 'Ahorro');
    await total(page).fill('10');
    await categoria(page, 'Super');
    // [CH-260] El campo limita la fecha al período en contexto: una posterior a hoy o anterior a su inicio no se entrega.
    await campo(page, t.fecha).fill('2027-02-11');
    await expect(page.getByText(base.fechaFuera)).toBeVisible();
    await campo(page, t.fecha).fill('2027-01-10');
    await expect(page.getByText(base.fechaFuera)).toBeVisible();
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
    await elegirCuenta(page, 'T');
    await total(page).fill('25');
    await categoria(page, 'Intereses y comisiones');
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

  test('PRU-E2E-TX-392 [CA-21.9] con el formulario a medio llenar, recargar la pestaña restaura los campos y las categorías y permite descartar el borrador', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegirCuenta(page, 'T');
    await total(page).fill('150');
    await comercio(page).fill('PriceSmart');
    await varias(page, 'Super', [['Mascota', '40']]);
    await total(page).focus(); // al salir, el monto se completa a dos decimales (C-45 §5)
    // el borrador se escribe 500 ms después del último cambio: se espera a que tenga la segunda categoría
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.entries<string>(sessionStorage as unknown as Record<string, string>).some(
            ([k, v]) => k.startsWith('finn:borrador:') && v.includes('"monto":"40.00"'),
          ),
        ),
      )
      .toBe(true);
    await page.reload();
    await esperarHidratacion(page);
    await expect(page.getByText(formularios.borradorRecuperado)).toBeVisible();
    await expect(total(page)).toHaveValue('150.00');
    await expect(comercio(page)).toHaveValue('PriceSmart');
    await expect(campo(page, t.montoPara('Super'))).toHaveValue('110.00');
    await expect(campo(page, t.montoPara('Mascota'))).toHaveValue('40.00');
    await page.getByRole('button', { name: formularios.descartarBorrador }).click();
    await expect(total(page)).toHaveValue('');
    await expect(page.getByText(formularios.borradorRecuperado)).toHaveCount(0);
  });

  test('PRU-E2E-TX-393 [CA-21.10] con una compra aprobada de "Mercado" en Super, escribir ese comercio sugiere Super y lo pone en la categoría vacía', async ({
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
    await comercio(page).fill('Mercado');
    // [CH-277] la sugerencia llena «Una» si está vacía y nunca cambia una categoría elegida (C-49 §1)
    await expect(page.getByTestId('sugerencia')).toHaveText(base.sueleIrA('Super'));
    await expect(disparadorDeCategoria(page)).toContainText('Super');
    await comercio(page).fill('Otro sitio');
    await expect(page.getByTestId('sugerencia')).toHaveCount(0);
    await expect(disparadorDeCategoria(page)).toContainText('Super');
  });

  test('PRU-E2E-TX-394 [CA-21.12, AV-01] un gasto de $148.60 con 3 líneas en el período activo se guarda sin previsualizar y dice "Guardado: PRICESMART · $148.60 · T · 3 líneas" con un enlace a cada categoría, y con la fecha en un período cerrado primero pide confirmar con el aviso', async ({
    page,
  }) => {
    // El saldo inicial de Ahorro (21 de enero) pone ese período en Presupuesto: el cierre de abajo lo abre con `?periodo=`.
    await preparar('2027-03-05', [
      { op: 'OP-01', cuenta: 'Ahorro', saldo: 100 },
      ...ESC19_PASO1.slice(1, 5),
      { op: 'OP-14', categoria: 'Super', monto: 100 },
      { op: 'OP-14', categoria: 'Mascota', monto: 20 },
    ]);
    await abrir(page, '/registrar/gasto');
    await elegirCuenta(page, 'T');
    await total(page).fill('148.60');
    await comercio(page).fill('PRICESMART');
    // [CH-277] una categoría no se repite (C-49 §2): las 3 líneas son Super $100.00, Mascota $40.00 y Ana $8.60 por cobrar
    await conPersonaNueva(page, 'Ana');
    await page
      .getByRole('radiogroup', { name: t.comoRepartirPersonas })
      .getByRole('radio', { name: t.montos })
      .click();
    await campo(page, t.tuParte).fill('140');
    await campo(page, t.montoDe('Ana')).fill('8.60');
    await varias(page, 'Super', [['Mascota', '40']]);
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado').locator('p')).toHaveText(
      t.guardado('PRICESMART', '$148.60', 'T', '3'),
    );
    // E4-2 «Repartido en»: cada categoría tocada lleva su enlace «Ver la categoría», en su fila
    const partes = page.getByRole('list', { name: t.lineasGuardadas }).getByRole('listitem');
    await expect(
      partes
        .filter({ has: page.getByText('Super', { exact: true }) })
        .getByRole('link', { name: t.verLaCategoria }),
    ).toHaveAttribute('href', /\/presupuesto\/categorias\/.+/);
    await expect(
      partes
        .filter({ has: page.getByText('Mascota', { exact: true }) })
        .getByRole('link', { name: t.verLaCategoria }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: t.verLaCategoria })).toHaveCount(2);
    await expect(page.getByRole('link', { name: t.verEnPorCobrar })).toHaveCount(1);
    // con la fecha en un período cerrado, antes aparece el impacto con el aviso AV-01
    await page.getByRole('button', { name: t.registrarOtro }).click();
    await esperarHidratacion(page);
    // [CH-260] Un período cerrado se registra abriendo Registrar con ese período en contexto.
    await abrir(page, '/registrar/gasto?periodo=2027-01-21');
    await elegirCuenta(page, 'T');
    await campo(page, t.fecha).fill('2027-01-25');
    await total(page).fill('10');
    await categoria(page, 'Super');
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(t.avisoPeriodoCerrado)).toBeVisible();
    await page.getByRole('button', { name: t.confirmar }).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
  });

  test('PRU-E2E-TX-440 [CA-21.1] el total es el billete con «$» y «Las comas de miles se ponen solas.», la cuenta dice la deuda de la tarjeta y no hay «Se entiende como» ni «Fecha elegida»', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegirCuenta(page, 'T');
    // [CH-276] C-45 §4: el total va como billete, arriba y solo; la fecha y la cuenta son filas del grupo de datos
    await total(page).fill('1236.4');
    await expect(total(page)).toHaveValue('1,236.4');
    await campo(page, t.fecha).focus();
    await expect(total(page)).toHaveValue('1,236.40');
    const billete = page.locator('.campo-billete');
    await expect(billete).toContainText('$');
    await expect(billete).toContainText(base.comasSolas);
    await expect(page.getByText('Se entiende como')).toHaveCount(0);
    await expect(page.getByText('Fecha elegida')).toHaveCount(0);
  });

  test('PRU-E2E-TX-441 [CA-21.1] «¿En qué categorías?» abre en «Una»; «Varias» suma una fila con su lista abierta, cada fila tiene la categoría y el monto en la misma altura, desde tres filas hay × y «+ Agregar categoría» suma otra', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    const cuantas = page.getByRole('radiogroup', { name: t.cuantasCategorias });
    await expect(cuantas.getByRole('radio', { name: t.una })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await total(page).fill('30');
    await categoria(page, 'Super');
    await cuantas.getByRole('radio', { name: t.varias }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(opcion(page, 'Super')).toHaveAttribute('aria-disabled', 'true');
    await opcion(page, 'Mascota').click();
    await expect(page.getByRole('button', { name: t.quitarCategoria('Mascota') })).toHaveCount(0);
    const disparador = await page.getByRole('button', { name: /^Categoría Mascota/ }).boundingBox();
    const monto = await campo(page, t.montoPara('Mascota')).boundingBox();
    expect(
      Math.abs(
        (disparador?.y ?? 0) +
          (disparador?.height ?? 0) / 2 -
          (monto?.y ?? 99) -
          (monto?.height ?? 0) / 2,
      ),
    ).toBeLessThan(12);
    await page.getByRole('button', { name: t.agregarCategoria }).click();
    await page.keyboard.press('Escape');
    const quitar = page.getByRole('button', { name: t.quitarCategoria('Mascota') });
    expect((await quitar.boundingBox())?.width).toBe(44);
    await quitar.click();
    await expect(page.getByRole('button', { name: /^Categoría / })).toHaveCount(2);
  });

  test('PRU-E2E-TX-442 [CA-21.12] el botón dice «Guardar $X» con el total escrito y queda en un pie fijo abajo en teléfono y bajo las secciones, a la derecha, en computadora', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await expect(guardar(page)).toHaveText(t.guardar);
    await total(page).fill('150');
    await expect(guardar(page)).toHaveText(t.guardarMonto('$150.00'));
    const boton = await guardar(page).boundingBox();
    const lineas = await page.locator('[data-campo-lineas]').boundingBox();
    const alto = page.viewportSize()?.height ?? 0;
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      expect(Math.abs((boton?.x ?? 0) - (lineas?.x ?? 99))).toBeLessThan(2);
    } else {
      expect((boton?.y ?? 0) + (boton?.height ?? 0)).toBeGreaterThan(alto - 40);
      expect((boton?.y ?? 0) + (boton?.height ?? 0)).toBeLessThanOrEqual(alto);
    }
  });

  test('PRU-E2E-TX-443 [CA-21.12] al guardar, el resultado dice el monto de cada línea, enlaza a cada categoría, ofrece «Registrar otro» y «Volver a Inicio»', async ({
    page,
  }) => {
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await elegirCuenta(page, 'T');
    await total(page).fill('150');
    await varias(page, 'Super', [['Mascota', '40']]);
    await guardar(page).click();
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    const detalle = page.getByRole('list', { name: t.lineasGuardadas });
    await expect(detalle).toContainText('Super');
    await expect(detalle).toContainText('$110.00');
    await expect(detalle).toContainText('Mascota');
    await expect(detalle).toContainText('$40.00');
    await expect(page.getByRole('link', { name: t.volverAInicio })).toHaveAttribute('href', '/');
    await expect(page.getByRole('button', { name: t.registrarOtro })).toBeVisible();
  });

  test('PRU-E2E-TX-444 [CA-21.1] en computadora la pantalla va en dos columnas iguales: el total y los datos a la izquierda, «¿Quién paga?» y las categorías a la derecha', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await preparar('2027-02-10', ESC19_PASO1);
    await abrir(page, '/registrar/gasto');
    await expect(page.locator('[data-campo-lineas]')).toBeVisible();
    const datos = await page.locator('.campo-billete').boundingBox();
    const secciones = await page.locator('[data-campo-lineas]').boundingBox();
    expect(Math.abs((datos?.width ?? 0) - (secciones?.width ?? 99))).toBeLessThan(2);
    expect(secciones?.x ?? 0).toBeGreaterThan((datos?.x ?? 0) + (datos?.width ?? 0));
    expect(Math.abs((datos?.y ?? 0) - (secciones?.y ?? 99))).toBeLessThan(60);
  });
});
