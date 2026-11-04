// FT-27 Transacción olvidada y cambios retroactivos (06 FT-27; 05 §2.4; 07 §17: un flujo es una E2E). Cada prueba parte de una
// base sembrada con las operaciones reales del escenario de 01 §8 que nombra (DP-17), con el reloj del servidor fijo (DP-04), y
// registra la transacción olvidada en `/registrar/gasto` como la persona: la previsualización dice el impacto (AV-01), al confirmar
// el presupuesto queda como dice el escenario y Inicio guarda el aviso hasta marcarlo como leído. Los números los pone el motor.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import {
  esperarContenido,
  esperarControlHidratado,
  esperarHidratacion,
} from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { impactoLineas as impacto } from '../../../src/textos/formularios.ts';
import { inicio as ti } from '../../../src/textos/inicio.ts';
import { registrarGasto as t } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

// ESC-31 hasta el paso 0 (hoy 5 abr): el historial, cada operación con su día.
const ESC31_PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Super', monto: 200, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Salidas', hoy: '2027-02-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 200, categoria: 'Super', hoy: '2027-02-04' },
  { op: 'OP-14', categoria: 'Salidas', monto: 50, periodo: 'P2', hoy: '2027-02-21' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 50, categoria: 'Salidas', hoy: '2027-03-01' },
  { op: 'OP-14', categoria: 'Salidas', monto: 60, periodo: 'P3', hoy: '2027-03-21' },
];
// ESC-49 hasta el paso 5 (hoy 25 mar): tres períodos con asignaciones futuras, un débito en P1 y una compra con T.
const ESC49_PASO5: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1500, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 400, periodo: 'P1', hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P2', hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P3', hoy: '2027-02-10' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 450, categoria: 'Super', hoy: '2027-02-15' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super', hoy: '2027-02-28' },
];
// ESC-17 hasta el paso 1 (hoy 12 feb): dos compras del 10 feb, registradas ese día a las 10:00 y a las 12:00.
const ESC17_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 60,
    categoria: 'Super',
    etiqueta: 'D60',
    fecha: '2027-02-10',
    registrado: '2027-02-10T10:00',
  },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 70,
    categoria: 'Super',
    etiqueta: 'T70',
    fecha: '2027-02-10',
    registrado: '2027-02-10T12:00',
  },
];

async function preparar(hoy: string, estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-TX-OLVIDADA',
    titulo: 'Semilla de FT-27',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
/** La cuenta y el destino de la línea son selecciones nativas del export (K2, S5): se elige por el nombre de la opción. */
const elegir = async (page: Page, etiqueta: string, nombre: string): Promise<void> => {
  const control = campo(page, etiqueta);
  await esperarControlHidratado(control);
  await control.selectOption({ label: nombre });
};
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ hasText: nombre });
/** El primer monto de una fila de categoría es su Disponible (05 §10.8). */
const disponible = (page: Page, nombre: string) =>
  fila(page, nombre).locator('[data-centavos]').first();

/** Escribe el gasto olvidado de una sola parte y lo envía: queda en la previsualización del impacto. */
async function registrar(
  page: Page,
  datos: { cuenta: string; fecha: string; total: string; categoria: string },
): Promise<void> {
  await page.goto('/registrar/gasto');
  await esperarHidratacion(page);
  await elegir(page, t.cuenta, datos.cuenta);
  await campo(page, t.fecha).fill(datos.fecha);
  await campo(page, t.total).fill(datos.total);
  await campo(page, t.montoDeParte('1')).fill(datos.total);
  await elegir(page, t.categoriaDeParte('1'), datos.categoria);
  await page.getByRole('button', { name: /^Guardar/ }).click();
}

async function confirmar(page: Page): Promise<void> {
  await page.getByRole('button', { name: t.confirmar }).click();
  await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
}

async function abrirPresupuesto(page: Page): Promise<void> {
  await page.goto('/presupuesto');
  await esperarContenido(page);
}

const OLVIDADO_ESC31 = { cuenta: 'Ahorro', fecha: '2027-02-10', total: '50', categoria: 'Salidas' };

test.describe('PRU-E2E-TX', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-430 [CA-27.1, ESC-31, AV-01] RUTA-/registrar/gasto un débito de $50.00 en Salidas con fecha 10 de febrero muestra Listo para asignar −$30.00 y Salidas −$20.00 antes de confirmar y, al confirmar, Listo para asignar queda en $560.00 y Salidas en $60.00', async ({
    page,
  }) => {
    await preparar('2027-04-05', ESC31_PASO0);
    await registrar(page, OLVIDADO_ESC31);

    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(t.avisoPeriodoCerrado)).toBeVisible();
    await expect(page.getByText(impacto.listoParaAsignar('−$30.00'))).toBeVisible();
    await expect(page.getByText(impacto.disponible('Salidas', '−$20.00'))).toBeVisible();
    await confirmar(page);

    await abrirPresupuesto(page);
    await esperarMonto(lpa(page), 56000);
    await esperarMonto(disponible(page, 'Salidas'), 6000);
  });

  test('PRU-E2E-TX-431 [CA-27.2, ESC-32, AV-01] RUTA-/registrar/gasto una compra con T de $50.00 en Salidas con fecha 10 de febrero muestra Salidas −$20.00, Pago T +$20.00, Te falta reservar +$30.00 y Listo para asignar $0.00 antes de confirmar', async ({
    page,
  }) => {
    await preparar('2027-04-05', ESC31_PASO0);
    await registrar(page, { ...OLVIDADO_ESC31, cuenta: 'T' });

    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(impacto.listoParaAsignar('$0.00'))).toBeVisible();
    await expect(page.getByText(impacto.disponible('Salidas', '−$20.00'))).toBeVisible();
    await expect(page.getByText(impacto.disponible('Pago T', '+$20.00'))).toBeVisible();
    await expect(page.getByText(impacto.teFaltaReservar('T', '+$30.00'))).toBeVisible();
    await confirmar(page);

    await abrirPresupuesto(page);
    await esperarMonto(lpa(page), 59000);
    await esperarMonto(disponible(page, 'Salidas'), 6000);
  });

  test('PRU-E2E-TX-432 [CA-27.3, ESC-49, AV-01] RUTA-/registrar/gasto un débito olvidado de $350.00 en Super con fecha 1 de marzo, ya cerrado ese período, deja Listo para asignar en $300.00 y Super en $300.00', async ({
    page,
  }) => {
    await preparar('2027-03-25', ESC49_PASO5);
    await registrar(page, {
      cuenta: 'Ahorro',
      fecha: '2027-03-01',
      total: '350',
      categoria: 'Super',
    });

    await expect(page.getByRole('heading', { name: t.revisar })).toBeVisible();
    await expect(page.getByText(impacto.listoParaAsignar('−$150.00'))).toBeVisible();
    await expect(page.getByText(impacto.disponible('Super', '−$200.00'))).toBeVisible();
    await confirmar(page);

    await abrirPresupuesto(page);
    await esperarMonto(lpa(page), 30000);
    await esperarMonto(disponible(page, 'Super'), 30000);
  });

  test('PRU-E2E-TX-433 [CA-27.4, ESC-17] RUTA-/registrar/gasto un débito olvidado de $20.00 registrado el 12 de febrero con fecha 10 de febrero queda detrás de las compras del mismo día: Super −$50.00 y Pago T $40.00', async ({
    page,
  }) => {
    await preparar('2027-02-12', ESC17_PASO1);
    await registrar(page, {
      cuenta: 'Ahorro',
      fecha: '2027-02-10',
      total: '20',
      categoria: 'Super',
    });
    // la fecha es del período activo: no es AV-01 y se guarda sin previsualizar
    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();

    await abrirPresupuesto(page);
    await esperarMonto(disponible(page, 'Super'), -5000);
    await esperarMonto(
      page.locator('[data-fila-pago]').first().locator('[data-centavos]').nth(1),
      4000,
    );
  });

  test('PRU-E2E-TX-434 [CA-27.6, ESC-31] RUTA-/ el resumen del cambio retroactivo confirmado se ve igual en Inicio desde otro dispositivo, sin haber abierto Inicio antes', async ({
    page,
    browser,
    baseURL,
  }) => {
    await preparar('2027-04-05', ESC31_PASO0);
    await registrar(page, OLVIDADO_ESC31);
    await confirmar(page);

    const otro = await browser.newContext({ baseURL: baseURL ?? '' });
    await otro.route('**/*', (ruta) => {
      const { protocol, host } = new URL(ruta.request().url());
      const local =
        protocol === 'data:' || protocol === 'blob:' || host === new URL(baseURL ?? '').host;
      return local ? ruta.fallback() : ruta.abort('blockedbyclient');
    });
    try {
      await entrarAal2(otro, baseURL ?? '');
      const pagina = await otro.newPage();
      await pagina.goto('/');
      await esperarContenido(pagina);
      const cambio = pagina.locator('[data-cambio-retroactivo]');
      await expect(cambio).toHaveCount(1);
      await expect(cambio).toContainText('Δ LPA −$30.00, Δ Salidas −$20.00');
    } finally {
      await otro.close();
    }
  });

  test('PRU-E2E-TX-435 [CA-08.5, ESC-31] RUTA-/ después de registrar el débito olvidado de ESC-31 Inicio muestra su resumen (Δ LPA −$30.00, Δ Salidas −$20.00) y "Marcar como leído" lo quita y no vuelve al recargar', async ({
    page,
  }) => {
    await preparar('2027-04-05', ESC31_PASO0);
    await registrar(page, OLVIDADO_ESC31);
    await confirmar(page);

    await page.goto('/');
    await esperarContenido(page);
    const cambio = page.locator('[data-cambio-retroactivo]');
    await expect(cambio).toHaveCount(1);
    await expect(cambio).toContainText('−$30.00');
    await expect(cambio).toContainText('−$20.00');

    await cambio.getByRole('button', { name: ti.marcarLeido, exact: true }).click();
    await expect(cambio).toHaveCount(0);
    await page.reload();
    await esperarContenido(page);
    await expect(cambio).toHaveCount(0);
  });
});
