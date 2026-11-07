// Recorrido 4.2 «Un día típico» de 06 (REC-4.2; 07 §17: un recorrido es una E2E). Parte de SEM-A7 antes del paso 3 (hoy 15/10/2026,
// período 21/09 a 20/10) con las operaciones reales (DP-17) y encadena las pantallas de sus fichas con el reloj de prueba alineado
// (07 §4.1). El estado de partida lleva la regla «SELECTOS → Supermercado» (04 OP-41, precondición del paso 1) y los últimos 4
// dígitos de Visa Oro, para que el SMS la encuentre. Los números los pone el motor (PF-3). Huecos del plan: (1) el paso 1 usa el
// token de FT-03 generado en Ajustes (06 no lo nombra en 4.2); (2) el paso 6 dice que Inicio asigna de un toque, pero Inicio solo
// enlaza a la pantalla de asignar y la propuesta con «Deshacer» vive en /reportes/ritmo (FT-62): se recorre ahí; (3) el paso 7 dice
// «en efectivo», pero A.7 no tiene cuenta de efectivo: se usa Cuenta corriente; (4) el push (paso 1) se comprueba por su
// notificación en el centro, no por la entrega real (CA-70.7, lista manual).
import { expect, test } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../ayudas/esperas.ts';
import { esperarMonto } from '../ayudas/montos.ts';
import { alinearRelojes } from '../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesWebhook } from '../../src/textos/ajustes-webhook.ts';
import { bandeja as t } from '../../src/textos/bandeja.ts';
import { cuentas } from '../../src/textos/cuentas.ts';
import { inicio as ti } from '../../src/textos/inicio.ts';
import { reportes as tr } from '../../src/textos/reportes.ts';
import { registrarGasto as g } from '../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';
import type { Locator, Page } from '@playwright/test';

const HOY = '2026-10-15';
const BASE_E2E = 'finn_e2e';

/** SEM-A7 antes del paso 3 de 4.2: SUPER SELECTOS no existe todavía, y Visa Oro tiene los últimos 4 dígitos de los SMS. */
async function sembrarA7ConRegla(): Promise<void> {
  const { escenarioA7 } = await import('../../../../packages/aplicacion/test/escenarios/a7.ts');
  const completo = escenarioA7();
  const estadoInicial = (completo.estadoInicial ?? [])
    .filter((op) => !(op.op === 'OP-20' && op.etiqueta === 'super-selectos'))
    .map((op): Op =>
      op.op === 'OP-01' && op.cuenta === 'Visa Oro' ? { ...op, ultimos4: '1234' } : op,
    );
  const escenario: Escenario = { ...completo, id: 'SEM-REC-4.2', refs: ['REC-4.2'], estadoInicial };
  // OP-41 no es una operación de los escenarios: se aplica por el marco entre el estado y el recorrido (como PRU-E2E-BAND-112)
  const { ejecutorInt, copiarEstadoA, idDeCategoria } =
    await import('../../../../packages/aplicacion/test/escenarios/int.ts');
  const { confirmar } = await import('../../../../packages/aplicacion/src/operaciones/marco.ts');
  const { OP41 } = await import('../../../../packages/aplicacion/src/operaciones/bandeja/index.ts');
  const s = await ejecutorInt.iniciar(escenario, HOY);
  const regla = await confirmar(
    OP41 as never,
    {
      accion: 'crear',
      id: 'c0ffee00-0000-4000-8000-000000000042',
      patron: 'SELECTOS',
      categoriaId: await idDeCategoria(s, 'Supermercado'),
    },
    {
      memoria: s.memoria,
      escribir: s.tx.escribir,
      leer: s.tx.leer,
      escribirTecnico: s.tx.escribirTecnico,
      opciones: () => ({ reloj: { hoy: HOY, desfaseMs: 0 } }),
    },
  );
  expect(regla.ok, JSON.stringify(regla)).toBe(true);
  await copiarEstadoA(s, BASE_E2E);
  await ejecutorInt.terminar(s);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const filas = (page: Page) => page.locator('[data-movimiento]');
const fila = (page: Page, texto: string) => filas(page).filter({ hasText: texto });
const hallazgo = (page: Page, categoria: string) =>
  page.locator('[data-hallazgo]').filter({ hasText: categoria });
const filaCategoria = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
/** El primer monto de una fila de categoría es su Disponible (05 §10.8). */
const disponible = (page: Page, nombre: string) =>
  filaCategoria(page, nombre).locator('[data-centavos]').first();

async function centavos(l: Locator): Promise<number> {
  return Number(await l.getAttribute('data-centavos'));
}

/** Arrastra con el ratón: el asa se mueve más de 6 px y se suelta sobre el destino. */
async function arrastrarAl(page: Page, origen: Locator, categoria: string): Promise<void> {
  await expect(origen).toBeVisible();
  const caja = await origen.boundingBox();
  if (caja === null) throw new Error('el asa no tiene caja');
  const x = caja.x + caja.width / 2;
  const y = caja.y + caja.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 12, y + 12, { steps: 4 });
  const sobre = page
    .locator('[data-panel-destinos] [data-destino]')
    .filter({ hasText: categoria })
    .first();
  await expect(sobre).toBeVisible();
  const d = await sobre.boundingBox();
  if (d === null) throw new Error('el destino no tiene caja');
  await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2, { steps: 8 });
  await page.mouse.up();
}

test.describe('PRU-E2E-BAND recorrido 4.2 un día típico', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-420 [REC-4.2, CA-34.10, CA-70.1, CA-69.2, CA-35.1, CA-78.1, CA-62.3, CA-08.6, CA-21.3, CA-24.1] desde SEM-A7 el SMS de SUPER SELECTOS llega con Supermercado por regla y su push, se aprueba, FARMACIA se arrastra a su categoría, Inicio propone $55.56 para Restaurantes y asignarlos sube su Disponible, el almuerzo a medias deja $4.25 en camino y Actividad encuentra la compra', async ({
    page,
    request,
  }) => {
    await alinearRelojes(page, `${HOY}T12:41:00-06:00`);
    await sembrarA7ConRegla();

    // Paso 0: el token de FT-03 para el «teléfono» (MacroDroid)
    await abrir(page, '/ajustes/webhook');
    await page.getByRole('button', { name: ajustesWebhook.generar, exact: true }).click();
    const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const recibir = async (comercio: string, monto: string): Promise<void> => {
      const respuesta = await request.post('/api/sms', {
        headers: { authorization: `Bearer ${token}` },
        data: {
          texto: `VISA 1234: has realizado una compra por USD ${monto} en el comercio ${comercio} 2026/10/15`,
          remitente: 'BAC',
        },
      });
      expect(respuesta.status()).toBe(200);
    };

    // Paso 1: el SMS de SUPER SELECTOS: movimiento pendiente con Supermercado por regla, y el push sin el texto del SMS
    await recibir('SUPER SELECTOS', '35.00');
    await expect(async () => {
      await abrir(page, '/bandeja');
      await expect(fila(page, 'SUPER SELECTOS')).toHaveCount(1);
    }).toPass();
    await expect(fila(page, 'SUPER SELECTOS')).toContainText('$35.00');
    await expect(fila(page, 'SUPER SELECTOS')).toContainText(
      `→ Supermercado (${cuentas.bandeja.porRegla})`,
    );
    await abrir(page, '/notificaciones');
    const aviso = page.locator('[data-notificacion]').filter({ hasText: 'SUPER SELECTOS' });
    await expect(aviso).toHaveCount(1);
    await expect(aviso).toContainText('$35.00');

    // Paso 2: tocar la notificación abre el movimiento y la deja leída (CA-69.2)
    await aviso.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/bandeja\/[0-9a-f-]+/);
    await esperarContenido(page);
    await abrir(page, '/notificaciones?no-leidas=1');
    await expect(
      page.locator('[data-notificacion]').filter({ hasText: 'SUPER SELECTOS' }),
    ).toHaveCount(0);

    // Paso 3: «Aprobar» desde la lista: «Aprobado: … · Supermercado», sin «Deshacer» (CA-35.1)
    await abrir(page, '/bandeja');
    await fila(page, 'SUPER SELECTOS')
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('SUPER SELECTOS', '$35.00', 'Visa Oro', 'Supermercado'),
    );
    await expect(page.getByRole('button', { name: /Deshacer/ })).toHaveCount(0);

    // Paso 4: llega FARMACIA sin categoría; se arrastra a Farmacia y se aprueba en una sola operación (CA-78.1)
    await recibir('FARMACIA', '9.50');
    await expect(async () => {
      await abrir(page, '/bandeja');
      await expect(fila(page, 'FARMACIA')).toHaveCount(1);
    }).toPass();
    await esperarHidratacion(page);
    await arrastrarAl(page, fila(page, 'FARMACIA').locator('[data-asa]'), 'Farmacia');
    await expect(page.getByTestId('resultado')).toContainText(
      t.aprobado('FARMACIA', '$9.50', 'Visa Oro', 'Farmacia'),
    );
    await expect(page.getByRole('button', { name: /Deshacer/ })).toHaveCount(0);

    // Paso 5: Inicio avisa el ritmo de Restaurantes: «Ya te pasaste $26.30…, llegarías a $55.56 el 20/10.»
    await abrir(page, '/presupuesto');
    const antes = await centavos(disponible(page, 'Restaurantes'));
    await abrir(page, '/');
    await expect(hallazgo(page, 'Restaurantes')).toContainText(
      ti.hallazgo.ya('$26.30', 'Restaurantes', '$55.56', '20/10'),
    );

    // Paso 6: «Asignar $55.56». Inicio enlaza el hallazgo a la pantalla de asignar de Restaurantes; la propuesta de un toque, con
    // «Deshacer», vive en el reporte de ritmo (FT-62, CA-62.3): se toca ahí. Restaurantes sube $55.56 y su número es el mismo
    // en Inicio, Presupuesto y el reporte (CA-62.6).
    await hallazgo(page, 'Restaurantes')
      .getByRole('link', { name: ti.hallazgo.asignar('$55.56') })
      .click();
    await expect(page).toHaveURL(/\/presupuesto\/asignar\//);
    await esperarContenido(page);
    await abrir(page, '/reportes/ritmo');
    await hallazgo(page, 'Restaurantes')
      .getByRole('button', { name: ti.hallazgo.asignar('$55.56'), exact: true })
      .click();
    const salida = page.locator('[data-ritmo-asignado]');
    await expect(salida).toContainText(tr.ritmo.asignado('$55.56', 'Restaurantes'));
    await expect(salida.getByRole('button', { name: ti.deshacer, exact: true })).toBeVisible();
    await abrir(page, '/');
    await expect(hallazgo(page, 'Restaurantes')).toHaveCount(0);
    await abrir(page, '/presupuesto');
    await esperarMonto(disponible(page, 'Restaurantes'), antes + 5556);

    // «En camino» del billete (05 §10.8): el monto es el texto de la fila, en pesos
    const enCamino = async (): Promise<number> => {
      if ((await page.locator('[data-en-camino]').count()) === 0) return 0;
      const texto = (await page.locator('[data-en-camino]').first().innerText()).match(
        /\$([\d,]+\.\d{2})/,
      );
      return Math.round(Number((texto?.[1] ?? '0').replaceAll(',', '')) * 100);
    };
    const enCaminoAntes = await enCamino();

    // Paso 7: un almuerzo de $8.50, mitad por cobrar a Carlos: $4.25 en camino (CA-21.3 con estos montos)
    await abrir(page, '/registrar/gasto');
    const elegir = async (etiqueta: string, nombre: string): Promise<void> => {
      const control = campo(page, etiqueta);
      await expect
        .poll(() =>
          control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
        )
        .toBe(true);
      await control.selectOption({ label: nombre });
    };
    await elegir(g.cuenta, 'Cuenta corriente');
    await campo(page, g.total).fill('8.50');
    await campo(page, g.montoDeParte('1')).fill('4.25');
    await elegir(g.categoriaDeParte('1'), 'Restaurantes');
    await page.getByRole('button', { name: g.agregarLinea }).click();
    await campo(page, g.montoDeParte('2')).fill('4.25');
    await elegir(g.categoriaDeParte('2'), g.porCobrarA(g.otraPersona));
    await campo(page, g.deudorNuevoDeParte('2')).fill('Carlos');
    await page.getByRole('button', { name: /^Guardar/ }).click();
    await expect(page.getByRole('heading', { name: g.listo })).toBeVisible();
    await abrir(page, '/presupuesto');
    await expect.poll(enCamino).toBe(enCaminoAntes + 425);

    // Paso 8: «selectos» en Actividad encuentra la compra del paso 3 (CA-24.1)
    await abrir(page, '/actividad?texto=selectos');
    const resultados = page.locator('[data-fila-transaccion]');
    await expect(resultados).toHaveCount(1);
    await expect(resultados).toContainText('SUPER SELECTOS');
    await expect(resultados).toContainText('$35.00');
  });
});
