// FT-41 Próximos pagos, registro de un toque y omitir (06 FT-41; 05 §2 y §7; 07 §17: una pantalla o un flujo es una E2E). Cada prueba
// parte de una base sembrada con las operaciones reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y llega
// a `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` como la persona: desde Inicio o Programadas. Los números y las fechas los
// pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3). Las últimas pruebas completan los pendientes de punta a
// punta de FT-08, FT-26, FT-34, FT-35 y FT-37 (DT-27): hacen en esas pantallas lo suyo y verifican la ocurrencia en la de esta ficha.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import esc50 from '../../../../../packages/dominio/escenarios/datos/esc-50.ts';
import { bandeja as b } from '../../../src/textos/bandeja.ts';
import { estados } from '../../../src/textos/estados.ts';
import { inicio } from '../../../src/textos/inicio.ts';
import { programadas } from '../../../src/textos/programadas.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import { transaccion } from '../../../src/textos/transaccion.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const t = programadas.ocurrencia;
const MENSAJE_RESUELTA = 'Ese pago programado ya está registrado.';
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Streaming' },
  { op: 'OP-21', monto: 1000 },
];
const NETFLIX: Op = {
  op: 'OP-42',
  etiqueta: 'netflix',
  cuenta: 'Visa Oro',
  comercio: 'Netflix',
  monto: 15.49,
  categoria: 'Streaming',
  primeraFecha: '2027-02-17',
};

async function preparar(ops: Op[], hoy: string, hora = '10:00'): Promise<void> {
  fijarRelojServidor(`${hoy}T${hora}:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PROG-41',
    titulo: 'Semilla de FT-41',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const atrasado = (page: Page) => page.locator('[data-pago-atrasado]');
const registrar = (page: Page, monto?: string) =>
  page.getByRole('button', { name: monto === undefined ? t.registrar : t.registrarMonto(monto) });

/** Abre la ocurrencia de `fecha` desde el enlace que Programadas pone en su fila o en su aviso de atrasada. */
async function irALaOcurrencia(page: Page, fecha: string): Promise<string> {
  await abrir(page, '/programadas');
  const enlace = page.locator(`a[href$="/ocurrencias/${fecha}"]`).first();
  const ruta = (await enlace.getAttribute('href')) ?? '';
  await enlace.click();
  await esperarHidratacion(page);
  return ruta;
}

test.describe('PRU-E2E-PROG ocurrencia de una programada', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PROG-120 [CA-41.1] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] la ocurrencia del 17 pendiente con hoy 19 está en pagos atrasados de Inicio y al registrarla con un toque la transacción tiene fecha 17', async ({
    page,
  }) => {
    await preparar([...BASE, NETFLIX], '2027-02-19');
    await abrir(page, '/');
    await expect(atrasado(page)).toContainText('Netflix');
    await atrasado(page).click();
    await esperarHidratacion(page);
    await expect(registrar(page, '$15.49')).toBeVisible();
    await registrar(page, '$15.49').click();
    const resultado = page.getByTestId('resultado');
    await expect(resultado).toContainText(t.registrado('Netflix', '$15.49', 'Visa Oro'));
    await resultado.getByRole('link', { name: t.verTransaccion }).click();
    await expect(page).toHaveURL(/\/actividad\/[0-9a-f-]{36}/);
    await expect(page.getByText('17 feb 2027').first()).toBeVisible();

    await abrir(page, '/');
    await expect(atrasado(page)).toHaveCount(0);
  });

  test('PRU-E2E-PROG-121 [CA-41.2] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] una ocurrencia omitida ya no aparece en Inicio ni en Programadas y no se registra', async ({
    page,
  }) => {
    await preparar([...BASE, NETFLIX], '2027-02-19');
    await abrir(page, '/');
    await atrasado(page).click();
    await esperarHidratacion(page);
    await page.getByRole('button', { name: t.omitir, exact: true }).click();
    await expect(page.getByTestId('resultado')).toContainText(t.omitido('Netflix', '17 feb'));

    await abrir(page, '/');
    await expect(atrasado(page)).toHaveCount(0);
    await abrir(page, '/programadas');
    await expect(page.locator('[data-seccion="atrasadas"]')).toHaveCount(0);
    await expect(page.locator('a[href$="/ocurrencias/2027-02-17"]')).toHaveCount(0);
    await abrir(page, '/actividad');
    await expect(
      page.locator('[data-fila-transaccion]').filter({ hasText: 'Netflix' }),
    ).toHaveCount(0);
  });

  test('PRU-E2E-PROG-122 [CA-41.3] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] una ocurrencia ya registrada dice que ya está registrada y enlaza a su transacción', async ({
    page,
  }) => {
    await preparar(
      [
        ...BASE,
        NETFLIX,
        { op: 'OP-43', modo: 'toque', programada: 'netflix', fecha: '2027-02-17' },
      ],
      '2027-02-19',
    );
    await abrir(page, '/actividad');
    await page.locator('[data-fila-transaccion]').filter({ hasText: '$15.49' }).first().click();
    await expect(page).toHaveURL(/\/actividad\/[0-9a-f-]{36}/);
    const detalle = new URL(page.url()).pathname;
    await abrir(page, '/programadas');
    const idProgramada =
      (await page.locator('[data-programada]').first().getAttribute('data-programada')) ?? '';
    await abrir(page, `/programadas/${idProgramada}/ocurrencias/2027-02-17`);
    await expect(page.getByText(MENSAJE_RESUELTA)).toBeVisible();
    await expect(page.getByRole('link', { name: t.verTransaccion })).toHaveAttribute(
      'href',
      detalle,
    );
    await expect(page.getByRole('button', { name: t.omitir, exact: true })).toHaveCount(0);
  });

  test('PRU-E2E-PROG-123 [CA-41.4] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] una fecha que no corresponde a la programada no se abre: dice que ya no existe', async ({
    page,
  }) => {
    await preparar([...BASE, NETFLIX], '2027-02-19');
    await abrir(page, '/programadas');
    const id =
      (await page.locator('[data-programada]').first().getAttribute('data-programada')) ?? '';
    await abrir(page, `/programadas/${id}/ocurrencias/2027-02-18`);
    await expect(page.getByText(estados.noExisteTitulo)).toBeVisible();
    await expect(registrar(page)).toHaveCount(0);
  });

  test('PRU-E2E-PROG-124 [CA-41.5, ESC-50, AV-01] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] con el paso 1 de ESC-50 registrar con un toque la ocurrencia del 25 de enero (P1, cerrado) muestra AV-01 y, al confirmar, llega al estado final del paso 1b', async ({
    page,
  }) => {
    const paso = (n: string) => esc50.pasos.find((p) => p.n === n)?.ops ?? [];
    await preparar([...esc50.estadoInicial, ...paso('0'), ...paso('1')], '2027-03-10');
    await abrir(page, '/');
    await atrasado(page).click();
    await esperarHidratacion(page);
    await registrar(page, '$10.00').click();
    await expect(page.getByText(t.avisoPeriodoCerrado)).toBeVisible();
    await page.getByRole('button', { name: t.confirmar, exact: true }).click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.registrado('Suscripción', '$10.00', 'T'),
    );

    await abrir(page, '/presupuesto');
    const disponible = (categoria: string) =>
      page
        .locator('[data-fila-categoria]')
        .filter({ hasText: categoria })
        .locator('[data-centavos]')
        .first();
    await esperarMonto(disponible('Suscripciones'), 0);
    await expect(
      page.getByRole('link', { name: /^T .*Disponible para pagar \$20\.00/ }),
    ).toBeVisible();
  });

  test('PRU-E2E-PROG-125 [CA-08.8] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] con una sola ocurrencia atrasada Inicio no dice "Todo al día" y al registrarla con un toque sí lo dice', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-07', categoria: 'Super' },
        { op: 'OP-21', monto: 1000 },
        { op: 'OP-14', categoria: 'Super', monto: 1000, periodo: 'P1' },
        {
          op: 'OP-42',
          etiqueta: 'renta',
          cuenta: 'Ahorro',
          comercio: 'Renta',
          monto: 50,
          categoria: 'Super',
          primeraFecha: '2027-02-05',
        },
      ],
      '2027-02-10',
    );
    await abrir(page, '/');
    await expect(page.locator('[data-todo-al-dia]')).toHaveCount(0);
    await expect(atrasado(page)).toContainText('Renta');
    await atrasado(page).click();
    await esperarHidratacion(page);
    await registrar(page, '$50.00').click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.registrado('Renta', '$50.00', 'Ahorro'),
    );

    await abrir(page, '/');
    await expect(page.locator('[data-todo-al-dia]')).toContainText(inicio.todoAlDia.titulo);
  });

  test('PRU-E2E-PROG-126 [CA-26.3] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] al eliminar la transacción que registró la ocurrencia, su ruta vuelve a ofrecer registrarla', async ({
    page,
  }) => {
    await preparar([...BASE, NETFLIX], '2027-02-19');
    const ruta = await irALaOcurrencia(page, '2027-02-17');
    await registrar(page, '$15.49').click();
    await page.getByTestId('resultado').getByRole('link', { name: t.verTransaccion }).click();
    await expect(page.getByRole('link', { name: transaccion.editar })).toBeVisible();
    await page.getByRole('button', { name: 'Más acciones' }).click();
    await page.getByRole('menuitem', { name: transaccion.eliminar }).click();
    await page.getByRole('button', { name: transaccion.verCambios }).click();
    await page.getByRole('button', { name: transaccion.eliminar }).click();
    await expect(page).toHaveURL(/\/actividad$/);

    await abrir(page, ruta);
    await esperarHidratacion(page);
    await expect(page.getByText(MENSAJE_RESUELTA)).toHaveCount(0);
    await expect(registrar(page, '$15.49')).toBeVisible();
  });

  test('PRU-E2E-PROG-127 [CA-34.9] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] el SMS de Netflix del 18 queda con coincidencia aunque haya otra compra igual del 17, y la ocurrencia del 17 sigue pendiente', async ({
    page,
  }) => {
    await preparar(
      [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', ultimos4: '4821' },
        { op: 'OP-07', categoria: 'Streaming' },
        sms('Visa', 'previo', 'Libreria Luz', '2027-02-17T10:00'),
        { ...NETFLIX, cuenta: 'Visa' },
        sms('Visa', 'netflix', 'Netflix', '2027-02-18T14:00'),
      ],
      '2027-02-18',
      '20:00',
    );
    await abrir(page, '/bandeja');
    await expect(page.locator('[data-vista="coincidencia"]')).toHaveCount(1);
    await expect(page.locator('[data-vista="coincidencia"]')).toContainText('Netflix');

    await irALaOcurrencia(page, '2027-02-17');
    await expect(registrar(page, '$15.49')).toBeVisible();
  });

  test('PRU-E2E-PROG-128 [CA-35.5] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] «Confirmar» la coincidencia crea la transacción y la ocurrencia queda registrada: su ruta lo dice y enlaza a la transacción', async ({
    page,
  }) => {
    await preparar(
      [...NETFLIX_Y_SMS_BASE, programadaNetflix, sms('T', 'sms', 'Netflix', '2027-02-20T19:00')],
      '2027-02-20',
      '20:00',
    );
    const ruta = await irALaOcurrencia(page, '2027-02-20');
    await expect(registrar(page, '$15.49')).toBeVisible();

    await abrir(page, '/bandeja');
    await page.locator('[data-movimiento]').getByRole('link').click();
    await expect(page.getByText(b.revisar.coincidencia).first()).toBeVisible();
    await elegirOpcion(page, g.categoriaDeParte('1'), 'Super');
    await page.getByRole('button', { name: b.revisar.confirmarCoincidencia }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();

    await abrir(page, ruta);
    await expect(page.getByText(MENSAJE_RESUELTA)).toBeVisible();
    await expect(page.getByRole('link', { name: t.verTransaccion })).toHaveAttribute(
      'href',
      /^\/actividad\/[0-9a-f-]{36}$/,
    );
  });

  test('PRU-E2E-PROG-129 [CA-37.4] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] «No es este pago» deja el movimiento pendiente y la ocurrencia sigue pendiente en su ruta', async ({
    page,
  }) => {
    await preparar(
      [...NETFLIX_Y_SMS_BASE, programadaNetflix, sms('T', 'sms', 'Netflix', '2027-02-20T19:00')],
      '2027-02-20',
      '20:00',
    );
    const ruta = await irALaOcurrencia(page, '2027-02-20');
    await abrir(page, '/bandeja');
    await page.locator('[data-movimiento]').getByRole('link').click();
    await expect(page.getByText(b.revisar.coincidencia).first()).toBeVisible();
    await page.getByRole('button', { name: b.noEsEstePago }).click();
    await expect(page.getByText(b.revisar.coincidencia)).toHaveCount(0);

    await abrir(page, ruta);
    await esperarHidratacion(page);
    await expect(page.getByText(MENSAJE_RESUELTA)).toHaveCount(0);
    await expect(registrar(page, '$15.49')).toBeVisible();
  });

  test('PRU-E2E-PROG-130 [CA-37.5] RUTA-/programadas/[programadaId]/ocurrencias/[fechaEsperada] dos SMS de la misma ocurrencia: uno con coincidencia y el otro posible duplicado, y la ocurrencia sigue siendo una sola pendiente', async ({
    page,
  }) => {
    await preparar(
      [
        ...NETFLIX_Y_SMS_BASE,
        programadaNetflix,
        sms('T', 'uno', 'Netflix', '2027-02-20T19:00'),
        sms('T', 'dos', 'Netflix.com', '2027-02-20T19:05'),
      ],
      '2027-02-20',
      '20:00',
    );
    await abrir(page, '/bandeja');
    await expect(page.locator('[data-vista="coincidencia"]')).toHaveCount(1);
    await expect(page.locator('[data-vista="duplicado"]')).toHaveCount(1);

    await irALaOcurrencia(page, '2027-02-20');
    await expect(registrar(page, '$15.49')).toBeVisible();
    await abrir(page, '/programadas');
    await expect(page.locator('a[href$="/ocurrencias/2027-02-20"]')).toHaveCount(1);
  });
});

const NETFLIX_Y_SMS_BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
];
const programadaNetflix: Op = {
  op: 'OP-42',
  etiqueta: 'Netflix',
  cuenta: 'T',
  comercio: 'Netflix',
  monto: 15.49,
  categoria: 'Super',
  primeraFecha: '2027-02-20',
};
function sms(cuenta: string, etiqueta: string, comercio: string, recibido: string): Op {
  return {
    op: 'OP-35',
    etiqueta,
    cuenta,
    monto: 15.49,
    comercio,
    recibido,
    fecha: recibido.slice(0, 10),
  };
}
