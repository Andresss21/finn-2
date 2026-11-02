// FT-75 Exportar (06 §2.x; 05 §2.11; 07 §17: una pantalla, un flujo y la descarga). Cada prueba parte de una base sembrada con las
// operaciones reales (DP-17) y del reloj del servidor fijo (DP-04), abre `/ajustes/exportar` como la persona y descarga con el
// evento `download` de Playwright. Los datos salen de la semilla: la prueba solo compara lo descargado con lo que esa semilla escribió.
// El contenido de cada formato lo prueban `exportacion.ctr.test.ts` (CTR) y `route.rh.test.ts` (RH); acá, la pantalla y el archivo real.
import { readFileSync } from 'node:fs';
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { clienteConFrasco, entrarAal2, variable } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ingresar } from '../../../../../packages/aplicacion/src/autenticacion/supabase.ts';
import { ajustesExportar as t } from '../../../src/textos/ajustes-exportar.ts';
import { navegacion } from '../../../src/textos/navegacion.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/ajustes/exportar';
const HOY = '2027-02-10';
const MENOS = '−';

async function preparar(): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-AJUS',
    titulo: 'Semilla de FT-75',
    refs: [],
    hoy: HOY,
    estadoInicial: [
      { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 45, categoria: 'Super', fecha: HOY, hoy: HOY },
    ],
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page): Promise<void> {
  await page.goto(RUTA);
  await esperarContenido(page);
}

/** Toca el enlace de descarga y devuelve el archivo recibido, leído como texto. */
async function descargar(page: Page, nombre: string): Promise<{ archivo: string; texto: string }> {
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: nombre, exact: true }).click(),
  ]);
  const ruta = await descarga.path();
  return { archivo: descarga.suggestedFilename(), texto: readFileSync(ruta, 'utf8') };
}

interface Fila {
  id: string;
  transaccionId: string;
  total?: number;
  monto?: number;
}
interface Exportado {
  hechos: { transacciones: Fila[]; lineas: Fila[]; efectos: Fila[] };
}

test.describe('PRU-E2E-AJUS', () => {
  test('PRU-E2E-AJUS-101 [CA-75.1] el CSV descargado desde la pantalla lleva los negativos con guion normal y ningún U+2212', async ({
    context,
    baseURL,
    page,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await preparar();
    await abrir(page);
    const { archivo, texto } = await descargar(page, t.csv.descargar);
    expect(archivo).toBe(`finn-transacciones-${HOY}.csv`);
    expect(texto).toContain(',-45.00,');
    expect(texto).not.toContain(MENOS);
  });

  test('PRU-E2E-AJUS-102 [CA-75.2] el JSON descargado trae los montos en centavos enteros y cada transacción con sus líneas y efectos', async ({
    context,
    baseURL,
    page,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await preparar();
    await abrir(page);
    const { archivo, texto } = await descargar(page, t.json.descargar);
    expect(archivo).toBe(`finn-hechos-${HOY}.json`);
    const { hechos } = JSON.parse(texto) as Exportado;
    // El gasto de la semilla: 45.00 en centavos, con una línea y un efecto en la cuenta
    const gasto = hechos.transacciones.find((x) => x.total === -4500);
    expect(gasto).toBeDefined();
    for (const x of hechos.transacciones) {
      expect(Number.isInteger(x.total)).toBe(true);
      expect(hechos.lineas.some((l) => l.transaccionId === x.id)).toBe(true);
      expect(hechos.efectos.some((e) => e.transaccionId === x.id)).toBe(true);
    }
    for (const fila of [...hechos.lineas, ...hechos.efectos]) {
      expect(Number.isInteger(fila.monto)).toBe(true);
    }
  });

  test('PRU-E2E-AJUS-103 [CA-75.3] sin sesión y con una sesión AAL1, GET /api/exportar/csv se rechaza y no devuelve datos', async ({
    playwright,
    baseURL,
  }) => {
    await preparar();
    const sinSesion = await playwright.request.newContext({ baseURL: baseURL ?? '' });
    const a = await sinSesion.get('/api/exportar/csv', { maxRedirects: 0 });
    expect(a.status()).toBe(401);
    expect(await a.text()).toBe('');

    // AAL1: contraseña sin el segundo factor, con las cookies de ese cliente de Auth
    const { cliente, frasco } = clienteConFrasco();
    const paso = await ingresar(cliente.auth, variable('FINN_USUARIO_ID'), {
      email: variable('E2E_EMAIL'),
      contrasena: variable('E2E_CLAVE'),
    });
    expect(paso.ok).toBe(true);
    const aal1 = await playwright.request.newContext({
      baseURL: baseURL ?? '',
      extraHTTPHeaders: {
        cookie: [...frasco].map(([nombre, valor]) => `${nombre}=${valor}`).join('; '),
      },
    });
    const b = await aal1.get('/api/exportar/csv', { maxRedirects: 0 });
    expect(b.status()).toBe(401);
    expect(await b.text()).toBe('');
    await sinSesion.dispose();
    await aal1.dispose();
  });

  test('PRU-E2E-AJUS-104 [RUTA-/ajustes/exportar] el índice de Ajustes lleva a Exportar y todo control de la pantalla mide al menos 44 px', async ({
    context,
    baseURL,
    page,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    await preparar();
    await page.goto('/ajustes');
    await esperarContenido(page);
    await page.getByRole('link', { name: t.titulo, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/exportar$/);
    await esperarContenido(page);
    await expect(page.getByRole('heading', { level: 1, name: t.titulo })).toBeVisible();
    await expect(page.getByRole('link', { name: t.json.descargar })).toHaveAttribute(
      'href',
      '/api/exportar/json',
    );
    await page.getByRole('link', { name: navegacion.saltar }).focus();
    await revisarTactil(page);
  });
});
