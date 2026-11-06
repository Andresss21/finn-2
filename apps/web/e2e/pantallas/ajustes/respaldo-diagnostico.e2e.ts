// FT-76 Respaldo y diagnóstico (06 FT-76; 05 §2.11; 07 §17: una pantalla es una E2E). El respaldo y la prueba de restauración los informa
// GitHub Actions por `POST /api/respaldo/[evento]` (OPT-09): la prueba hace lo mismo con el secreto de la E2E y mueve el reloj del servidor
// para que pasen las 36 horas y los 35 días. Los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { revisarTactil } from '../../ayudas/tactil.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { SECRETO_RESPALDO_E2E } from '../../../../../tools/pruebas/e2e/respaldo.ts';
import { ajustesDiagnostico as d } from '../../../src/textos/ajustes-diagnostico.ts';
import { ajustesRespaldo as r } from '../../../src/textos/ajustes-respaldo.ts';
import { navegacion } from '../../../src/textos/navegacion.ts';
import type { Escenario } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { APIRequestContext, Page } from '@playwright/test';

const HOY = '2027-02-10';

async function preparar(): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-AJUS-76',
    titulo: 'Semilla de FT-76',
    refs: [],
    hoy: HOY,
    estadoInicial: [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 500, apertura: '2027-02-05' }],
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

/** Lo que haría GitHub Actions al terminar (04 §16.3 paso 4 y §16.4). */
async function informar(
  request: APIRequestContext,
  evento: 'respaldo' | 'restauracion',
  token = SECRETO_RESPALDO_E2E,
): Promise<number> {
  const respuesta = await request.post(`/api/respaldo/${evento}`, {
    headers: { authorization: `Bearer ${token}` },
    data:
      evento === 'respaldo' ? { objeto: 'diarios/2027-02-10.dump', revision: 1, bytes: 1000 } : {},
  });
  return respuesta.status();
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

test.describe('PRU-E2E-AJUS', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
    await preparar();
  });

  test('PRU-E2E-AJUS-150 [CA-76.1] con el último respaldo de hace más de 36 horas, el índice dice «Respaldo atrasado» y Respaldo muestra la fecha del último', async ({
    page,
    request,
  }) => {
    expect(await informar(request, 'respaldo')).toBe(200);
    // Al día: 12 horas después no hay aviso
    fijarRelojServidor(`${HOY}T22:00:00-06:00`);
    await abrir(page, '/ajustes');
    await expect(page.getByText(r.atrasadoEnIndice)).toHaveCount(0);
    // 38 horas después sí
    fijarRelojServidor('2027-02-12T00:00:00-06:00');
    await abrir(page, '/ajustes');
    await expect(page.getByText(r.atrasadoEnIndice)).toBeVisible();
    await page.locator('a[href="/ajustes/respaldo"]').click();
    await expect(page).toHaveURL(/\/ajustes\/respaldo$/);
    await esperarContenido(page);
    await expect(page.getByRole('heading', { level: 1, name: r.titulo })).toBeVisible();
    const bloque = page.locator('[data-rol="respaldo"]');
    await expect(bloque).toContainText(/2027/);
    await expect(bloque).toContainText(r.atrasado);
    await page.getByRole('link', { name: navegacion.saltar }).focus();
    await revisarTactil(page);
  });

  test('PRU-E2E-AJUS-151 [CA-76.2] con la última restauración de hace más de 35 días, Respaldo la marca como atrasada', async ({
    page,
    request,
  }) => {
    expect(await informar(request, 'respaldo')).toBe(200);
    expect(await informar(request, 'restauracion')).toBe(200);
    fijarRelojServidor('2027-03-01T10:00:00-06:00');
    await abrir(page, '/ajustes/respaldo');
    await expect(page.locator('[data-rol="restauracion"]')).toContainText(r.alDia);
    fijarRelojServidor('2027-03-20T10:00:00-06:00');
    await abrir(page, '/ajustes/respaldo');
    await expect(page.locator('[data-rol="restauracion"]')).toContainText(r.atrasado);
    await expect(page.locator('[data-rol="restauracion"]')).toContainText(r.restauracionAtrasada);
  });

  test('PRU-E2E-AJUS-152 [CA-76.3] un evento del sistema con su texto aparece en Diagnóstico y se encuentra buscándolo', async ({
    page,
    request,
  }) => {
    // Un aviso sin datos de la petición (04 §12.5): el token del respaldo es inválido
    expect(await informar(request, 'respaldo', 'x'.repeat(40))).toBe(401);
    await abrir(page, '/ajustes/diagnostico');
    await esperarHidratacion(page);
    const lista = page.locator('[data-rol="eventos"] > li');
    await expect(lista).toHaveCount(1);
    await expect(lista.first()).toContainText('token_invalido');
    const buscar = page.getByRole('searchbox', { name: d.buscar });
    await buscar.fill('no-existe');
    await expect(page.getByText(d.sinResultados)).toBeVisible();
    await buscar.fill('token_invalido');
    await expect(lista).toHaveCount(1);
  });

  test('PRU-E2E-AJUS-153 [CA-76.4] «Ejecutar tareas ahora» termina con aviso y una segunda ejecución inmediata no cambia ningún hecho', async ({
    page,
  }) => {
    const hechos = async (): Promise<unknown> =>
      ((await (await page.request.get('/api/exportar/json')).json()) as { hechos: unknown }).hechos;
    await page.goto('/ajustes');
    await esperarContenido(page);
    await page.getByRole('link', { name: d.enlace, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/diagnostico$/);
    await esperarHidratacion(page);
    await expect(page.getByRole('heading', { level: 1, name: d.titulo })).toBeVisible();
    const ejecutar = page.getByRole('button', { name: d.ejecutar, exact: true });
    await ejecutar.click();
    await expect(page.getByText(d.ejecutadas)).toBeVisible();
    const trasPrimera = await hechos();
    await ejecutar.click();
    await expect(page.getByText(d.ejecutadas)).toBeVisible();
    expect(await hechos()).toEqual(trasPrimera);
    await page.getByRole('link', { name: navegacion.saltar }).focus();
    await revisarTactil(page);
  });
});
