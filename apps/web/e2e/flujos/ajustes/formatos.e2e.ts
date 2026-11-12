// FT-73 Formatos bancarios, 1 y 2 de 3 (06 FT-73; 05 §2.11; 07 §17: un flujo es una E2E; CH-125). Instituciones es la parte 3. Cada prueba parte de una base sembrada con
// las operaciones reales de ESC-45 (DP-17), con el reloj del servidor fijo (DP-04), entra como la persona y recorre el flujo contra el
// servidor real: la política del patrón (BE-46), la auditoría (BE-47) y el efecto de desactivar un formato salen de él. Los tres
// formatos sembrados por la migración no pasan la política (03 §9.5, FX-1): por eso los flujos que guardan crean uno propio.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { eventosQueNombran } from '../../../../../tools/pruebas/e2e/pila.ts';
import { ajustesFormatos as t } from '../../../src/textos/ajustes-formatos.ts';
import { generarTokenWebhook } from '../../ayudas/webhook.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { APIRequestContext, Page } from '@playwright/test';

const HOY = '2027-02-18';
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', ultimos4: '4821' },
  { op: 'OP-07', categoria: 'Supermercado' },
];
// F-1 de 03 §9.5, el patrón sembrado del BAC: grado de retroceso 3 (la política acepta hasta 2)
const PATRON_LENTO = String.raw`(?:MASTERCARD|VISA)\s+(?<ultimos4>\d{4}):\s+has realizado una compra por USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})`;
const PATRON_SIN_MONTO = String.raw`Pago aprobado tarjeta (?<ultimos4>\d{4}) comercio (?<comercio>\S+)`;
const PATRON_VALIDO = String.raw`Pago aprobado tarjeta (?<ultimos4>\d{4}) monto USD (?<monto>[\d.]+) comercio (?<comercio>\S+) fecha (?<fecha>\d{4}/\d{2}/\d{2})`;
const SMS_PAGO = (monto: string): string =>
  `Pago aprobado tarjeta 4821 monto USD ${monto} comercio Cafeteria fecha 2027/02/18`;

async function preparar(): Promise<void> {
  fijarRelojServidor(`${HOY}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-73',
    titulo: 'Semilla de FT-73, formatos e instituciones',
    refs: [],
    hoy: HOY,
    estadoInicial: BASE,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
  await esperarHidratacion(page);
}

const guardar = (page: Page) => page.getByRole('button', { name: t.guardar, exact: true });

/** Llena el formulario de un formato nuevo con lo mínimo (la institución es el BAC sembrado). */
async function llenarFormato(
  page: Page,
  datos: { nombre: string; patron: string; conFecha?: boolean },
): Promise<void> {
  await abrir(page, '/ajustes/formatos/nuevo');
  await page.getByLabel(t.campos.institucion, { exact: true }).selectOption({ label: 'BAC' });
  await page.getByLabel(t.campos.nombre, { exact: true }).fill(datos.nombre);
  await page.getByLabel(t.campos.patron, { exact: true }).fill(datos.patron);
  if (datos.conFecha === true) await page.getByLabel('AAAA/MM/DD', { exact: true }).check();
}

async function crearFormato(page: Page, nombre: string): Promise<void> {
  await llenarFormato(page, { nombre, patron: PATRON_VALIDO, conFecha: true });
  await guardar(page).click();
  await expect(page).toHaveURL(/\/ajustes\/formatos\?guardado=/);
}

/** El token de FT-03 generado desde Ajustes, como lo pegaría MacroDroid. */
async function generarToken(page: Page): Promise<string> {
  await abrir(page, '/ajustes/webhook');
  await generarTokenWebhook(page);
  const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  return token;
}

async function enviarSms(request: APIRequestContext, token: string, texto: string): Promise<void> {
  const r = await request.post('/api/sms', {
    headers: { authorization: `Bearer ${token}` },
    data: { texto, remitente: 'BAC' },
  });
  expect(r.status()).toBe(200);
}

test.describe('PRU-E2E-AJUS', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-AJUS-120 [CA-73.1] RUTA-/ajustes/formatos/nuevo un patrón con grado de retroceso 3 se rechaza al guardar con el grado y la cadena de ataque en el campo del patrón, y no se crea nada', async ({
    page,
  }) => {
    await preparar();
    await llenarFormato(page, { nombre: 'Lento', patron: PATRON_LENTO, conFecha: true });
    await guardar(page).click();
    await expect(page.getByText(/retroceso de grado 3 \(se trabó con «/)).toBeVisible();
    await expect(page.getByLabel(t.campos.patron, { exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(page).toHaveURL(/\/ajustes\/formatos\/nuevo$/);
    expect(eventosQueNombran('auditoria_formato')).toBe(0);
  });

  test('PRU-E2E-AJUS-121 [CA-73.2] RUTA-/ajustes/formatos/nuevo un patrón sin el grupo monto se rechaza al guardar con el aviso de los grupos obligatorios y no se crea nada', async ({
    page,
  }) => {
    await preparar();
    await llenarFormato(page, { nombre: 'Sin monto', patron: PATRON_SIN_MONTO });
    await guardar(page).click();
    await expect(page.getByText(/Al patrón le faltan los grupos monto:/)).toBeVisible();
    await expect(page).toHaveURL(/\/ajustes\/formatos\/nuevo$/);
    expect(eventosQueNombran('auditoria_formato')).toBe(0);
  });

  test('PRU-E2E-AJUS-122 [CA-73.4] RUTA-/ajustes/formatos/[formatoId] al editar un formato queda una fila auditoria_formato por cada cambio, la de crear y la de editar', async ({
    page,
  }) => {
    await preparar();
    await crearFormato(page, 'Pago de prueba');
    expect(eventosQueNombran('auditoria_formato crear')).toBe(1);

    await page.getByRole('link', { name: /Pago de prueba/ }).click();
    await esperarHidratacion(page);
    await expect(page.getByLabel(t.campos.nombre, { exact: true })).toHaveValue('Pago de prueba');
    await page.getByLabel(t.campos.nombre, { exact: true }).fill('Pago de prueba 2');
    await guardar(page).click();
    await expect(page).toHaveURL(/\/ajustes\/formatos\?guardado=/);
    // La lista dibuja el formato y, aparte, el resultado de guardar con su nombre: se mira la fila
    await expect(
      page.locator('[data-formato]').filter({ hasText: /Pago de prueba 2/ }),
    ).toBeVisible();
    expect(eventosQueNombran('auditoria_formato editar')).toBe(1);
    // El antes y el después van en la misma fila
    expect(eventosQueNombran('"nombre": "Pago de prueba 2"')).toBeGreaterThanOrEqual(1);
  });

  test('PRU-E2E-AJUS-123 [CA-73.5] RUTA-/ajustes/formatos/[formatoId] con el formato activo un SMS se reconoce; al desactivarlo, el mismo tipo de SMS queda como no reconocido y la lista lo marca inactivo', async ({
    page,
    request,
  }) => {
    await preparar();
    await crearFormato(page, 'Pago de prueba');
    const token = await generarToken(page);

    await enviarSms(request, token, SMS_PAGO('9.99'));
    const filas = page.locator('[data-movimiento]');
    await expect(async () => {
      await abrir(page, '/bandeja');
      await expect(filas).toHaveCount(1);
    }).toPass();
    await expect(filas).not.toHaveAttribute('data-vista', 'noReconocido');

    await abrir(page, '/ajustes/formatos');
    await page.getByRole('link', { name: /Pago de prueba/ }).click();
    await esperarHidratacion(page);
    await page.getByRole('switch', { name: t.campos.activo, exact: true }).click();
    await guardar(page).click();
    await expect(page).toHaveURL(/\/ajustes\/formatos\?guardado=/);
    await expect(
      page.locator('[data-formato]').filter({ hasText: /Pago de prueba/ }),
    ).toContainText(t.inactivo);

    await enviarSms(request, token, SMS_PAGO('10.50'));
    await expect(async () => {
      await abrir(page, '/bandeja');
      await expect(page.locator('[data-vista="noReconocido"]')).toHaveCount(1);
    }).toPass();
  });

  test('PRU-E2E-AJUS-124 [FT-73] RUTA-/ajustes/formatos desde Ajustes se llega a la lista, que muestra los formatos sembrados con su institución y sin usos, y enlaza a crear uno y a Instituciones', async ({
    page,
  }) => {
    await preparar();
    await abrir(page, '/ajustes');
    await page.getByRole('link', { name: t.enlace, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/formatos$/);
    const filas = page.locator('[data-formato]');
    await expect(filas).toHaveCount(3);
    await expect(filas.filter({ hasText: 'BAC · BAC compra' })).toContainText(t.sinUsos);
    await expect(filas.filter({ hasText: 'Banco Agrícola · Banco Agrícola compra' })).toBeVisible();
    await expect(page.getByRole('link', { name: t.nuevo, exact: true })).toHaveAttribute(
      'href',
      '/ajustes/formatos/nuevo',
    );
    await expect(page.getByRole('link', { name: t.instituciones, exact: true })).toHaveAttribute(
      'href',
      '/ajustes/instituciones',
    );
  });
});
