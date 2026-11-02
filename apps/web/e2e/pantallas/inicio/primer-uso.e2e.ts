// FT-04 Primer uso guiado (06 §2.1; 05 §2.3; 07 §17: una pantalla, una navegación o un flujo). Cada prueba parte de una base
// sembrada con operaciones reales y recorre Inicio y la plantilla como la persona. Los elementos se buscan por su rol y su nombre del
// catálogo (FE-51). Los rechazos con su código y el reenvío con los mismos ids los prueba la integración (PRU-INT-INICIO).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';

import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesWebhook } from '../../../src/textos/ajustes-webhook.ts';
import { estructura as te } from '../../../src/textos/estructura.ts';
import { plantilla as t } from '../../../src/textos/plantilla.ts';
import { primerosPasos as p } from '../../../src/textos/primeros-pasos.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const PLANTILLA = '/presupuesto/estructura/plantilla';
const ESTRUCTURA = '/presupuesto/estructura';
const HOY = '2027-02-05';
const SISTEMA = 'Pagos de tarjeta';
const SEMILLA = 'Gastos'; // el grupo vacío que `sembrar()` crea en toda base (ejecutor `int`, 01 §8.0); no es de la aplicación

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-INI',
    titulo: 'Semilla de FT-04',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

interface Elemento {
  id: string;
  tipo: 'grupo' | 'categoria';
  grupoId?: string;
}

/** Los elementos de cada llamada a la acción de la plantilla (POST a la misma ruta), en el orden en que salen. */
async function contarLlamadas(page: Page): Promise<Elemento[][]> {
  const llamadas: Elemento[][] = [];
  await page.route(`**${PLANTILLA}`, (ruta) => {
    if (ruta.request().method() === 'POST') {
      const cuerpo = JSON.parse(ruta.request().postData() ?? '[]') as [{ elementos: Elemento[] }];
      llamadas.push(cuerpo[0].elementos);
    }
    return ruta.fallback();
  });
  return llamadas;
}

const crear = (page: Page, n: number) =>
  page.getByRole('button', { name: t.crear(n), exact: true });

/** Los grupos de `/presupuesto/estructura` con sus categorías, en el orden en que se ven. */
async function leerEstructura(page: Page): Promise<[string, string[]][]> {
  await abrir(page, ESTRUCTURA);
  return page
    .locator('main section')
    .evaluateAll((secciones) =>
      secciones.map((s): [string, string[]] => [
        s.querySelector('h2')?.textContent ?? '',
        [...s.querySelectorAll('li')].map((li) => li.firstElementChild?.textContent ?? ''),
      ]),
    );
}
const sinSistema = (e: [string, string[]][]) => e.filter(([g]) => g !== SISTEMA && g !== SEMILLA);

test.describe('PRU-E2E-INICIO', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-INICIO-101 [CA-04.1] en una base recién sembrada Inicio muestra los tres Primeros pasos sin marcar y con su enlace, sin "Ocultar por ahora" ni "Todo al día"', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, '/');
    await expect(page.getByRole('heading', { name: p.titulo })).toBeVisible();
    const enlace = (nombre: string) => page.getByRole('link', { name: nombre, exact: true });
    await expect(enlace(p.pasos.cuenta)).toHaveAttribute('href', '/cuentas/nueva');
    await expect(enlace(p.pasos.categorias)).toHaveAttribute('href', '/presupuesto/estructura');
    await expect(enlace(p.pasos.sms)).toHaveAttribute('href', '/ajustes/webhook');
    await expect(page.getByText(/^Hecho: /)).toHaveCount(0);
    await expect(page.getByText('Ocultar por ahora')).toHaveCount(0);
    await expect(page.getByText('Todo al día')).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-102 [CA-04.2, CF-08] desde la estructura vacía, "Crear 36 categorías" deja los 11 grupos y las 36 categorías de 3.9.2 en ese orden, más "Pagos de tarjeta"', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, ESTRUCTURA);
    await page.getByRole('link', { name: te.usarPlantilla, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${PLANTILLA}$`));
    await esperarContenido(page);
    await expect(crear(page, 36)).toBeVisible();
    await crear(page, 36).click();
    await expect(page.getByText(t.creadas(47), { exact: true })).toBeVisible();

    const salida = await leerEstructura(page);
    expect(salida.map(([g]) => g)).toContain(SISTEMA);
    expect(sinSistema(salida)).toEqual(t.grupos.map((g) => [g.nombre, [...g.categorias]]));
    for (const [, categorias] of salida)
      expect(new Set(categorias.map((c) => c.toLowerCase())).size).toBe(categorias.length);
  });

  test('PRU-E2E-INICIO-103 [CA-04.3] quitar "Educación" y renombrar "Streaming" a "Netflix y Disney" crea todo menos "Educación", y la renombrada queda en "Suscripciones"', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, PLANTILLA);
    await page.getByRole('button', { name: t.quitarGrupo('Educación'), exact: true }).click();
    await page.getByLabel(t.nombreCategoria('Streaming'), { exact: true }).fill('Netflix y Disney');
    await crear(page, 34).click();
    await expect(page.getByText(t.creadas(44), { exact: true })).toBeVisible();

    const salida = new Map(await leerEstructura(page));
    expect(salida.has('Educación')).toBe(false);
    const todas = [...salida.values()].flat();
    expect(todas).not.toContain('Colegiatura');
    expect(todas).not.toContain('Cursos y libros');
    expect(salida.get('Suscripciones')).toEqual(['Netflix y Disney', 'Apps y servicios digitales']);
  });

  test('PRU-E2E-INICIO-104 [CA-04.4] si la conexión se corta después de la primera tanda, al volver ofrece seguir y crea los 35 restantes sin duplicar ninguno', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, PLANTILLA);
    // Las acciones de servidor son POST a la misma ruta: la segunda llamada se corta antes de salir.
    let llamadas = 0;
    await page.route(`**${PLANTILLA}`, (ruta) => {
      const accion = ruta.request().method() === 'POST';
      llamadas += accion ? 1 : 0;
      return accion && llamadas === 2 ? ruta.abort('connectionfailed') : ruta.fallback();
    });
    await crear(page, 36).click();
    await expect(page.getByRole('button', { name: t.seguir(12, 47), exact: true })).toBeVisible();
    await page.unroute(`**${PLANTILLA}`);

    await abrir(page, PLANTILLA); // volver a abrirla: el borrador de la pestaña sigue ahí
    await page.getByRole('button', { name: t.seguir(12, 47), exact: true }).click();
    await expect(page.getByText(t.creadas(47), { exact: true })).toBeVisible();

    const salida = await leerEstructura(page);
    expect(sinSistema(salida)).toEqual(t.grupos.map((g) => [g.nombre, [...g.categorias]]));
  });

  test('PRU-E2E-INICIO-105 [CA-04.5] "Supermercado" repetido en "Vida diaria" se crea una vez, la otra aparece en el resumen con el mensaje del nombre repetido y las demás se crean', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, PLANTILLA);
    await page
      .getByRole('button', { name: t.quitarCategoria('Supermercado'), exact: true })
      .click();
    for (let i = 0; i < 2; i += 1) {
      await page
        .getByRole('button', { name: t.agregarCategoria('Vida diaria'), exact: true })
        .click();
      await page
        .getByLabel(t.nombreCategoria(t.categoriaNueva), { exact: true })
        .fill('Supermercado');
    }
    await crear(page, 37).click();
    await expect(page.getByText(t.creadas(47), { exact: true })).toBeVisible();
    await expect(page.getByText(t.noSeCrearon(1), { exact: true })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: /^Supermercado: / })).toHaveCount(1);

    const vida = new Map(await leerEstructura(page)).get('Vida diaria') ?? [];
    expect(vida.filter((c) => c === 'Supermercado')).toHaveLength(1);
    expect(vida).toContain('Farmacia');
    expect(vida).toHaveLength(5);
  });

  test('PRU-E2E-INICIO-106 [CA-04.6] con una categoría normal ya creada, la plantilla redirige a la estructura', async ({
    page,
  }) => {
    await preparar([{ op: 'OP-07', categoria: 'Supermercado' }]);
    await page.goto(PLANTILLA);
    await expect(page).toHaveURL(new RegExp(`${ESTRUCTURA}$`));
    await esperarContenido(page);
    await expect(page.getByRole('heading', { name: te.titulo, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: te.usarPlantilla })).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-107 /ajustes abre con su título y enlaza a "Conectar los SMS", el tercer paso de los Primeros pasos', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, '/ajustes');
    await expect(page.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible();
    await page.getByRole('link', { name: ajustesWebhook.titulo, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/webhook$/);
  });
  test('PRU-E2E-INICIO-108 [CA-04.8] aplicar la plantilla completa hace 4 llamadas a la acción, ninguna con más de 15 elementos y con cada grupo antes que sus categorías', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, PLANTILLA);
    const llamadas = await contarLlamadas(page);
    await crear(page, 36).click();
    await expect(page.getByText(t.creadas(47), { exact: true })).toBeVisible();

    expect(llamadas.map((l) => l.length)).toEqual([12, 12, 12, 11]);
    const grupos = new Set<string>();
    for (const e of llamadas.flat()) {
      if (e.tipo === 'grupo') grupos.add(e.id);
      else expect(grupos.has(e.grupoId ?? '')).toBe(true);
    }
  });

  test('PRU-E2E-INICIO-109 [CA-04.10] sin el borrador de la pestaña, la plantilla a medias ofrece seguir con 12 de 47 y crea solo los 35 restantes, sin repetir los que ya existen', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, PLANTILLA);
    let llamadas = 0;
    await page.route(`**${PLANTILLA}`, (ruta) => {
      const accion = ruta.request().method() === 'POST';
      llamadas += accion ? 1 : 0;
      return accion && llamadas === 2 ? ruta.abort('connectionfailed') : ruta.fallback();
    });
    await crear(page, 36).click();
    await expect(page.getByRole('button', { name: t.seguir(12, 47), exact: true })).toBeVisible();
    await page.unroute(`**${PLANTILLA}`);

    await page.evaluate(() => {
      window.sessionStorage.clear(); // el borrador no está disponible (otra pestaña)
    });
    await abrir(page, PLANTILLA);
    const enviadas = await contarLlamadas(page);
    await page.getByRole('button', { name: t.seguir(12, 47), exact: true }).click();
    await expect(page.getByText(t.creadas(47), { exact: true })).toBeVisible();

    expect(enviadas.flat()).toHaveLength(35);
    await expect(page.getByText(t.noSeCrearon(1))).toHaveCount(0);
    const salida = await leerEstructura(page);
    expect(sinSistema(salida)).toEqual(t.grupos.map((g) => [g.nombre, [...g.categorias]]));
  });

  test('PRU-E2E-INICIO-110 [CA-04.11] con una cuenta y las categorías, "Ocultar por ahora" esconde los Primeros pasos en este dispositivo, no en otro, y Ajustes muestra "2 de 3" con "Mostrar en Inicio"', async ({
    page,
    browser,
    baseURL,
  }) => {
    await preparar([
      { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: HOY },
      { op: 'OP-07', categoria: 'Supermercado' },
    ]);
    await abrir(page, '/');
    await page.getByRole('button', { name: p.ocultar, exact: true }).click();
    await expect(page.getByRole('heading', { name: p.titulo })).toHaveCount(0);
    await page.reload();
    await esperarContenido(page);
    await expect(page.getByRole('heading', { name: p.titulo })).toHaveCount(0);

    const otro = await browser.newContext({ baseURL: baseURL ?? '' });
    try {
      await entrarAal2(otro, baseURL ?? '');
      const hoja = await otro.newPage();
      await abrir(hoja, '/');
      await expect(hoja.getByRole('heading', { name: p.titulo })).toBeVisible();
    } finally {
      await otro.close();
    }

    await abrir(page, '/ajustes');
    await expect(page.getByText(p.recordatorio(2), { exact: true })).toBeVisible();
    await page.getByRole('button', { name: p.mostrar, exact: true }).click();
    await expect(page.getByText(p.recordatorio(2))).toHaveCount(0);
    await abrir(page, '/');
    await expect(page.getByRole('heading', { name: p.titulo })).toBeVisible();
  });

  test('PRU-E2E-INICIO-111 [CA-04.12] con los tres pasos hechos, los Primeros pasos no aparecen en Inicio ni en Ajustes, aunque estuvieran ocultos', async ({
    page,
  }) => {
    await preparar([
      { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: HOY },
      { op: 'OP-07', categoria: 'Supermercado' },
    ]);
    await abrir(page, '/');
    await page.getByRole('button', { name: p.ocultar, exact: true }).click();
    await abrir(page, '/ajustes/webhook');
    await page.getByRole('button', { name: ajustesWebhook.generar, exact: true }).click();
    await expect(page.getByTestId('token')).toBeVisible();

    await abrir(page, '/');
    await expect(page.getByRole('heading', { name: p.titulo })).toHaveCount(0);
    await abrir(page, '/ajustes');
    await expect(page.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible();
    await expect(page.getByText(/^Primeros pasos: /)).toHaveCount(0);
    await expect(page.getByRole('button', { name: p.mostrar })).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-112 [CA-04.13] si falla el grupo "Pagos de tarjeta" de la plantilla, sus categorías aparecen en el resumen con el motivo del grupo y las de los demás grupos se crean', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, PLANTILLA);
    await page.getByRole('button', { name: t.agregarGrupo, exact: true }).click();
    await page.getByLabel(t.nombreGrupo(t.grupoNuevo), { exact: true }).fill(SISTEMA);
    await page.getByRole('button', { name: t.agregarCategoria(SISTEMA), exact: true }).click();
    await page.getByLabel(t.nombreCategoria(t.categoriaNueva), { exact: true }).fill('Cuota');
    await crear(page, 37).click();
    await expect(page.getByText(t.creadas(47), { exact: true })).toBeVisible();
    await expect(page.getByText(t.noSeCrearon(2), { exact: true })).toBeVisible();
    const motivos = page.getByRole('listitem').filter({ hasText: /^(Pagos de tarjeta|Cuota): / });
    await expect(motivos).toHaveCount(2);
    const textos = await motivos.allTextContents();
    expect(new Set(textos.map((x) => x.split(': ').slice(1).join(': '))).size).toBe(1);

    const salida = await leerEstructura(page);
    expect(salida.flatMap(([, c]) => c)).not.toContain('Cuota');
    expect(sinSistema(salida)).toEqual(t.grupos.map((g) => [g.nombre, [...g.categorias]]));
  });
});
