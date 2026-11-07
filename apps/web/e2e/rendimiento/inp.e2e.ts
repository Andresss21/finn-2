// INP de laboratorio y orden de las Server Actions (05 §13.4, FE-48, V5-27a y V5-11; 07 §6.6) sobre las pantallas reales, con
// sesión AAL2 y una base sembrada con operaciones reales (DP-17). Corren solo en el job `ren` del nocturno (FINN_REN=1): superar un
// presupuesto no falla la prueba, la medida va a test-results/ren/web.json y tools/pruebas/volumen/registrar.ts abre el aviso y
// fija FINN_REN_ROJO (regla de persistencia de 07 §6.6). Lo que aquí falla es no poder medir.
import { expect, test } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { elegirOpcion } from '../ayudas/seleccion-nativa.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { mediana } from '../../../../tools/pruebas/rendimiento/clasificar.ts';
import { navegacion } from '../../src/textos/navegacion.ts';
import { dominio } from '../../src/textos/dominio.ts';
import { registrarGasto as g } from '../../src/textos/registrar-gasto.ts';
import type { Page } from '@playwright/test';
import {
  NOCTURNO,
  P,
  inpMedido,
  observarEventos,
  olvidarEventos,
  prepararInp,
  ralentizar,
  registrar,
  sembrarBase,
  soloNocturno,
} from './medidas.ts';

const CORRIDAS_INP = 3; // 05 §13.4: mediana de 3; la base trae un SMS por corrida
const CORRIDAS_TX = 5; // 07 §6.6: los tiempos del servidor, mediana de 5
// 04 §5.6: escritura ≤ 400 ms; 04 §6.0.7 y 05 §4.12: la lectura interactiva que va delante, ≤ 30 ms
const ESCRITURA_MS = 400;
const LECTURA_MS = 30;

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
  await observarEventos(page);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const guardar = (page: Page) => page.getByRole('button', { name: /^Guardar/ });

/** Un gasto válido de $10.00 en Super, escrito antes de medir. */
async function gastoValido(page: Page): Promise<void> {
  await elegirOpcion(page, g.cuenta, 'Ahorro');
  await campo(page, g.total).fill('10');
  await campo(page, g.montoDeParte('1')).fill('10');
  await elegirOpcion(page, g.categoriaDeParte('1'), 'Super');
}

interface Paso {
  readonly ruta: string;
  readonly antes?: (page: Page) => Promise<void>;
  /** Las interacciones medidas, cada una con la señal de que terminó. */
  readonly medir: (page: Page) => Promise<void>;
}

// 05 §13.4: «abrir Registrar, escribir un monto, enviar con error y sin error, cambiar de período, aprobar con un toque, abrir y
// cerrar un flujo superpuesto».
const ESCENARIOS: Record<string, Paso> = {
  'abrir Registrar': {
    ruta: '/presupuesto',
    medir: async (page) => {
      await page
        .getByRole('link', { name: navegacion.registrar, exact: true })
        .filter({ visible: true })
        .click();
      await expect(page.getByRole('heading', { name: g.titulo, level: 1 })).toBeVisible();
    },
  },
  'escribir un monto': {
    ruta: '/registrar/gasto',
    medir: async (page) => {
      await campo(page, g.total).click();
      await campo(page, g.total).pressSequentially('1234.56');
      await expect(campo(page, g.total)).toHaveValue(/1,?234\.56/);
    },
  },
  'enviar con error': {
    ruta: '/registrar/gasto',
    medir: async (page) => {
      await guardar(page).click();
      await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
      await expect(page.getByRole('heading', { name: g.listo })).toHaveCount(0);
    },
  },
  'enviar sin error': {
    ruta: '/registrar/gasto',
    antes: gastoValido,
    medir: async (page) => {
      await guardar(page).click();
      await expect(page.getByRole('heading', { name: g.listo })).toBeVisible();
    },
  },
  'cambiar de período': {
    ruta: '/presupuesto',
    medir: async (page) => {
      await page.getByRole('link', { name: dominio.periodo.siguiente }).click();
      await expect(page.locator('[data-selector-periodo="futuro"]')).toBeVisible();
    },
  },
  'aprobar con un toque': {
    ruta: '/bandeja',
    medir: async (page) => {
      await page
        .locator('[data-movimiento]')
        .first()
        .getByRole('button', { name: /^Aprobar/ })
        .click();
      await expect(page.getByTestId('resultado')).toBeVisible();
    },
  },
  'abrir y cerrar un flujo superpuesto': {
    ruta: '/presupuesto',
    medir: async (page) => {
      await page.getByRole('link', { name: 'Asignar a Super' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    },
  },
};

test.describe('PRU-REN-WEB', () => {
  test.describe.configure({ timeout: 900_000 });

  test('PRU-REN-PWA-101 el método de INP de 05 §13.4 detecta una interacción lenta', async ({
    page,
  }) => {
    await page.setContent(
      `<button onclick="const f = performance.now() + 300; while (performance.now() < f);">lenta</button>`,
    );
    await prepararInp(page);
    await page.getByRole('button', { name: 'lenta' }).click();
    await expect
      .poll(() => inpMedido(page), { message: 'el manejador bloquea 300 ms' })
      .toBeGreaterThan(P.inpMs);
  });

  test('PRU-REN-PWA-004 [V5-27] INP: la interacción más lenta de cada escenario de 05 §13.4, mediana de 3, contra 05 §13.1', async ({
    page,
    context,
    baseURL,
  }) => {
    test.skip(soloNocturno, NOCTURNO);
    await entrarAal2(context, baseURL ?? '');
    await sembrarBase();
    await ralentizar(page);
    const porEscenario: Record<string, number[]> = {};
    for (let i = 0; i < CORRIDAS_INP; i += 1)
      for (const [nombre, paso] of Object.entries(ESCENARIOS)) {
        await abrir(page, paso.ruta);
        await paso.antes?.(page);
        await olvidarEventos(page);
        await paso.medir(page);
        (porEscenario[nombre] ??= []).push(await inpMedido(page));
      }
    const medidas = Object.entries(porEscenario).map(([nombre, ms]) => ({
      id: 'PRU-REN-PWA-004',
      nombre: `INP de «${nombre}», mediana de 3`,
      medianaMs: mediana(ms),
      presupuestoMs: P.inpMs,
    }));
    registrar(medidas);
    expect(medidas).toHaveLength(Object.keys(ESCENARIOS).length);
    for (const ms of Object.values(porEscenario)) expect(ms).toHaveLength(CORRIDAS_INP);
  });

  test('PRU-REN-TX-001 [V5-11] una escritura lanzada con una lectura en vuelo espera su turno dentro del presupuesto', async ({
    page,
    context,
    baseURL,
  }) => {
    test.skip(soloNocturno, NOCTURNO);
    await entrarAal2(context, baseURL ?? '');
    await sembrarBase();
    const url = new URL('/registrar/gasto', baseURL).href;
    const enCola: number[] = [];
    const solas: number[] = [];
    // La primera corrida calienta la memoria del servidor (04 §5.6: «con memoria caliente») y no se cuenta
    for (let i = 0; i <= CORRIDAS_TX; i += 1) {
      for (const conLectura of [false, true]) {
        await page.goto('/registrar/gasto');
        await esperarContenido(page);
        await gastoValido(page);
        // La lectura interactiva (la sugerencia del comercio, 05 §4.12) se retiene hasta el toque de «Guardar»: así está en vuelo
        // cuando sale la escritura, y su tiempo en el servidor empieza con ella. No se le suma ningún retardo.
        let tocado = (): void => undefined;
        const toque = new Promise<void>((r) => {
          tocado = r;
        });
        let salio = (): void => undefined;
        const enVuelo = new Promise<void>((r) => {
          salio = r;
        });
        let retenida = !conLectura;
        await page.route(url, async (ruta) => {
          const p = ruta.request();
          if (retenida || p.method() !== 'POST' || p.headers()['next-action'] === undefined)
            return ruta.fallback();
          retenida = true;
          salio();
          await toque;
          return ruta.fallback();
        });
        if (conLectura) {
          await campo(page, g.comercio).fill('Super');
          await enVuelo;
        }
        const inicio = await guardar(page).evaluate((b: HTMLButtonElement) => {
          const t = performance.now();
          b.click();
          return t;
        });
        tocado();
        await expect(page.getByRole('heading', { name: g.listo })).toBeVisible();
        await page.unroute(url);
        const pedidos = await page.evaluate(
          (u) =>
            performance
              .getEntriesByType('resource')
              .filter(
                (e) => e.name === u && (e as PerformanceResourceTiming).initiatorType === 'fetch',
              )
              .map((e) => ({
                inicio: e.startTime,
                fin: (e as PerformanceResourceTiming).responseEnd,
              })),
          url,
        );
        const escritura = pedidos.find((e) => e.inicio >= inicio);
        expect(escritura, 'la escritura figura en Resource Timing').toBeDefined();
        if (conLectura) {
          const lectura = pedidos.find((e) => e.inicio < inicio);
          expect(lectura, 'la lectura salió antes del toque').toBeDefined();
          // V5-11: Next despacha las Server Actions de una en una; la escritura sale cuando la lectura terminó
          expect(escritura?.inicio).toBeGreaterThanOrEqual(lectura?.fin ?? Infinity);
        }
        if (i > 0) (conLectura ? enCola : solas).push((escritura?.fin ?? Infinity) - inicio);
      }
    }
    registrar([
      {
        id: 'PRU-REN-TX-001',
        nombre:
          'escritura con una lectura interactiva en vuelo, del toque a la respuesta, mediana de 5',
        medianaMs: mediana(enCola),
        presupuestoMs: ESCRITURA_MS + LECTURA_MS,
      },
      {
        id: 'PRU-REN-TX-001',
        nombre: 'la misma escritura sola, mediana de 5 (informativo, V5-11)',
        medianaMs: mediana(solas),
        presupuestoMs: null,
      },
    ]);
    expect(enCola).toHaveLength(CORRIDAS_TX);
  });
});
