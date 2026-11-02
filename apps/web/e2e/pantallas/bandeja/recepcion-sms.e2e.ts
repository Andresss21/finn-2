// FT-34 Recepción y procesamiento de SMS, 2 de 2 (06 §2.5; 05 §2.5; 07 §17: una pantalla, una navegación o un flujo).
// La primera prueba recorre el flujo completo contra el servidor real: el token de FT-03, `POST /api/sms` como lo haría
// MacroDroid y el resultado en `/bandeja` (CA-03.3). Las otras dos parten de una base sembrada con operaciones reales (OP-35
// procesa el SMS como lo haría `POST /api/sms`) y del reloj del servidor fijo (DP-04). Los textos salen del catálogo (FE-51).
// El procesamiento está probado en `sms-recepcion-ii.int.test.ts` (INT); aquí, lo que la persona ve.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesWebhook } from '../../../src/textos/ajustes-webhook.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-18';
const CUENTAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', ultimos4: '4821' },
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-07', categoria: 'Streaming' },
];
const sms = (
  etiqueta: string,
  comercio: string,
  monto: number,
  recibido: string,
): Extract<Op, { op: 'OP-35' }> => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'Visa',
  monto,
  comercio,
  recibido,
  fecha: recibido.slice(0, 10),
});
const escenario = (estadoInicial: Op[]): Escenario => ({
  id: 'SEM-BAND-34-II',
  titulo: 'Semilla de FT-34 (2 de 2)',
  refs: [],
  hoy: HOY,
  estadoInicial,
  pasos: [],
});

/** El servidor fija las 20:00 del día 18, después de los SMS sembrados. */
const fijarServidor = () => fijarRelojServidor(`${HOY}T20:00:00-06:00`);

async function abrirBandeja(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
}
const filas = (page: Page) => page.locator('[data-movimiento]');

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-110 [CA-03.3] con el token generado en Ajustes, un SMS que no coincide con ningún formato llega por POST /api/sms y la Bandeja lo muestra como no reconocido con el texto original', async ({
    page,
    request,
  }) => {
    fijarServidor();
    await sembrar(escenario([]), HOY);
    await page.goto('/ajustes/webhook');
    await esperarHidratacion(page);
    await page.getByRole('button', { name: ajustesWebhook.generar, exact: true }).click();
    const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const texto = 'Mensaje de prueba "sin formato" de MacroDroid';
    const respuesta = await request.post('/api/sms', {
      headers: { authorization: `Bearer ${token}` },
      data: { texto, remitente: 'BAC' },
    });
    expect(respuesta.status()).toBe(200);

    // El procesamiento corre después de responder (BE-44): la pantalla se vuelve a abrir hasta que aparece su resultado
    await expect(async () => {
      await abrirBandeja(page);
      await expect(filas(page)).toHaveCount(1);
    }).toPass();
    const fila = filas(page);
    await expect(fila).toHaveAttribute('data-vista', 'noReconocido');
    await expect(fila).toContainText(cuentas.bandeja.estados.noReconocido);
    await expect(fila.getByText(texto, { exact: true })).toBeVisible();
    await expect(page.getByText(t.desglose.noReconocidos(1))).toBeVisible();
  });

  test('PRU-E2E-BAND-111 [CA-34.9] la compra de $15.49 del día 18 de la tarjeta con la ocurrencia de Netflix del 17 pendiente se ve "con coincidencia", y la otra de $15.49 del 17 sigue como pendiente', async ({
    page,
  }) => {
    fijarServidor();
    await sembrar(
      escenario([
        ...CUENTAS,
        sms('previo', 'Libreria Luz', 15.49, '2027-02-17T10:00'),
        {
          op: 'OP-42',
          etiqueta: 'netflix',
          cuenta: 'Visa',
          comercio: 'Netflix',
          monto: 15.49,
          categoria: 'Streaming',
          primeraFecha: '2027-02-17',
        },
        sms('netflix', 'Netflix', 15.49, '2027-02-18T14:00'),
      ]),
      HOY,
    );
    await abrirBandeja(page);

    await expect(page.getByText(t.porRevisar(2))).toBeVisible();
    await expect(
      page.getByText(`${t.desglose.pendientes(1)} · ${t.desglose.conCoincidencia(1)}`),
    ).toBeVisible();
    const coincidencia = page.locator('[data-vista="coincidencia"]');
    await expect(coincidencia).toHaveCount(1);
    await expect(coincidencia).toContainText('Netflix');
    await expect(coincidencia).toContainText('Visa · 18/02/2027');
    await expect(coincidencia).toContainText(cuentas.bandeja.estados.coincidencia);
    await expect(page.locator('[data-vista="duplicado"]')).toHaveCount(0);
    await expect(page.locator('[data-movimiento]:not([data-vista="coincidencia"])')).toContainText(
      'Libreria Luz',
    );
  });

  test('PRU-E2E-BAND-112 [CA-34.10] con la regla "SELECTOS → Supermercado", el SMS de SUPER SELECTOS ESCALON aparece con Supermercado propuesto por regla', async ({
    page,
  }) => {
    fijarServidor();
    // OP-41 no es una operación de los escenarios: se aplica por el marco entre el estado y el SMS, y el SMS llega después
    const { ejecutorInt, copiarEstadoA } =
      await import('../../../../../packages/aplicacion/test/escenarios/int.ts');
    const { consultar } = await import('../../../../../packages/db/test/ayudantes/conexion.ts');
    const { confirmar } =
      await import('../../../../../packages/aplicacion/src/operaciones/marco.ts');
    const { OP41 } =
      await import('../../../../../packages/aplicacion/src/operaciones/bandeja/index.ts');
    const s = await ejecutorInt.iniciar(escenario(CUENTAS), HOY);
    const [categoria] = await consultar(
      s.base.urlAdmin,
      `SELECT id FROM finn.categorias WHERE nombre = 'Supermercado'`,
    );
    const regla = await confirmar(
      OP41 as never,
      {
        accion: 'crear',
        id: 'c0ffee00-0000-4000-8000-000000000041',
        patron: 'SELECTOS',
        categoriaId: categoria,
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
    await ejecutorInt.paso(s, {
      n: '1',
      ops: [sms('selectos', 'SUPER SELECTOS ESCALON', 12, '2027-02-18T14:10')],
      espera: {},
    });
    await copiarEstadoA(s, 'finn_e2e');
    await ejecutorInt.terminar(s);
    await abrirBandeja(page);

    const fila = filas(page);
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText('SUPER SELECTOS ESCALON');
    await expect(fila).toContainText('$12.00');
    await expect(fila).toContainText(`→ Supermercado (${cuentas.bandeja.porRegla})`);
    await expect(fila).toHaveAttribute('data-vista', 'listo');
  });
});
