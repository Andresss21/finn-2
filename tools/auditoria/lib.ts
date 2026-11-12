// Ayudas de la auditoría de diseño. Cada `caso` es una entrada del inventario: siembra, abre, fuerza el estado, captura y mide.
// Salidas (por variante = proyecto de Playwright):
//   docs/auditoria-diseno/capturas/<id>__<variante>.png   pantalla completa, con las fuentes cargadas
//   docs/auditoria-diseno/medidas/<id>__<variante>.json   lo medido con getComputedStyle / getBoundingClientRect
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page, TestInfo, BrowserContext } from '@playwright/test';
import { test, expect, sembrar } from '../../apps/web/e2e/configuracion/semilla.ts';
import { entrarAal2 } from '../../apps/web/e2e/ayudas/sesion.ts';
import { esperarAnimaciones, esperarHidratacion } from '../../apps/web/e2e/ayudas/esperas.ts';
import { fijarRelojServidor } from '../pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../packages/dominio/escenarios/tipos.ts';
import type { NotificacionSembrada } from '../../packages/aplicacion/test/escenarios/int.ts';
import { medir } from './medir.ts';

export { test, expect, sembrar, entrarAal2, fijarRelojServidor };
export { escenarioA7 } from '../../packages/aplicacion/test/escenarios/a7.ts';
export { codigoTotp } from '../../apps/web/e2e/ayudas/totp.ts';
export { variable } from '../../apps/web/e2e/ayudas/sesion.ts';
export type { Op, Escenario, Page, TestInfo, BrowserContext };

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SALIDA = join(raiz, 'docs', 'auditoria-diseno');
for (const d of ['capturas', 'capturas/pliegue', 'medidas', 'videos'])
  mkdirSync(join(SALIDA, d), { recursive: true });

export interface Meta {
  /** Ruta de la app, con su patrón (p. ej. /cuentas/[cuentaId]) */
  ruta: string;
  /** Archivo del componente o página */
  comp: string;
  /** Referencia sin la variante: '02-referencias/entrega-2/pantallas/11-ajustes/indice', 'PANTALLAS §2.17', o 'SIN DISEÑO' */
  ref: string;
  nota?: string;
}

/** Espera a que la pantalla esté quieta: hidratada, sin carga, con fuentes y sin animaciones finitas en curso. */
export async function quieta(page: Page, opciones: { carga?: boolean } = {}): Promise<void> {
  await esperarHidratacion(page).catch(() => undefined);
  if (opciones.carga !== true)
    await expect(
      page.locator(
        '[aria-busy="true"], template[id^="B:"], div[hidden][id^="S:"]:has(> :not(template))',
      ),
    )
      .toHaveCount(0, { timeout: 15_000 })
      .catch(() => undefined);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Trozos `lazy` con `Suspense fallback={null}` (p. ej. los campos de Editar transacción) no dejan marca de carga:
  // AUDITORIA_ESPERA_MS da un margen fijo antes de capturar, solo cuando se pide.
  const extra = Number(process.env['AUDITORIA_ESPERA_MS'] ?? '0');
  if (extra > 0) await page.waitForTimeout(extra);
  await esperarAnimaciones(page).catch(() => undefined);
}

/** Captura y mide. `id` = <pantalla>__<estado>. */
export async function capturar(
  page: Page,
  info: TestInfo,
  id: string,
  meta: Meta,
  opciones: { carga?: boolean; completa?: boolean } = {},
): Promise<void> {
  const variante = info.project.name;
  await quieta(page, opciones);
  const nombre = `${id}__${variante}`;
  // 1) Se mide con el tamaño real de la variante.
  const m = await page.evaluate(medir);
  writeFileSync(
    join(SALIDA, 'medidas', `${nombre}.json`),
    JSON.stringify({ id, variante, ...meta, ...m }),
  );
  const foto = { animations: 'disabled', caret: 'hide' } as const;
  // 2) El primer pliegue, tal como se ve al abrir (390×844 o 1440×900).
  await page.screenshot({ path: join(SALIDA, 'capturas', 'pliegue', `${nombre}.png`), ...foto });
  // 3) La pantalla completa: se estira la ventana al alto del documento, así las barras fijas quedan arriba y abajo
  //    (como en los PNG de referencia) y no cruzadas en medio de la captura.
  const vp = page.viewportSize();
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const estirar = opciones.completa !== false && vp !== null && alto > vp.height + 1;
  if (estirar) {
    await page.setViewportSize({ width: vp.width, height: Math.min(alto, 12_000) });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
  }
  await page.screenshot({ path: join(SALIDA, 'capturas', `${nombre}.png`), ...foto });
  if (estirar) await page.setViewportSize(vp);
}

/** Siembra operaciones reales con `hoy` y deja el reloj del servidor en `hoyServidor`. */
export async function sembrarOps(
  ops: Op[],
  hoy: string,
  hoyServidor = hoy,
  notificaciones: readonly NotificacionSembrada[] = [],
): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  await sembrar(
    {
      id: 'SEM-AUDITORIA',
      titulo: 'Auditoría de diseño',
      refs: [],
      hoy,
      estadoInicial: ops,
      pasos: [],
    },
    hoy,
    notificaciones,
  );
}

/** Siembra un escenario completo (p. ej. la semilla de A.7) y fija el reloj del servidor. */
export async function sembrarEscenario(
  escenario: Escenario,
  hoyServidor: string,
  notificaciones: readonly NotificacionSembrada[] = [],
): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  await sembrar(escenario, escenario.hoy ?? '2027-02-10', notificaciones);
}

export async function entrar(context: BrowserContext, baseURL: string | undefined): Promise<void> {
  await entrarAal2(context, baseURL ?? 'http://localhost:3100');
}

export async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await quieta(page);
}

export interface Caso extends Meta {
  /** <pantalla>__<estado> */
  id: string;
  /** URL que se abre (por defecto `ruta`); o una función que la resuelve con la página ya autenticada */
  url?: string | ((page: Page) => Promise<string>);
  /** Semilla: operaciones o escenario. Sin ninguna, no se siembra (queda lo del caso anterior). */
  ops?: Op[];
  escenario?: Escenario;
  hoy?: string;
  hoyServidor?: string;
  notificaciones?: readonly NotificacionSembrada[];
  /** false = sin sesión (acceso) */
  sesion?: boolean;
  /** Antes de abrir: mocks de red, almacenamiento, etc. */
  antes?: (page: Page, context: BrowserContext) => Promise<void>;
  /** Después de abrir: los pasos que fuerzan el estado */
  pasos?: (page: Page, info: TestInfo) => Promise<void>;
  /** La captura es de un estado de carga: no se espera a que termine */
  carga?: boolean;
  /** El caso no escribe en la base: el siguiente caso con la misma semilla no vuelve a sembrar (ahorra tiempo) */
  soloLectura?: boolean;
}

// Semilla que quedó en la base y si el último caso la dejó intacta. Vive por trabajador: si uno muere, se vuelve a sembrar.
let semillaEnBase = '';

/** Una entrada del inventario = una prueba que deja su captura y su medida en cada variante. */
export function caso(c: Caso): void {
  test(c.id, async ({ page, context, baseURL }, info) => {
    const clave = JSON.stringify([
      c.ops ?? c.escenario?.id,
      c.hoy,
      c.hoyServidor,
      c.notificaciones,
    ]);
    if (clave === semillaEnBase) {
      // misma base, intacta: solo se repone el reloj del servidor
      const hoy = c.hoyServidor ?? c.hoy ?? c.escenario?.hoy ?? '2027-02-10';
      fijarRelojServidor(`${hoy}T10:00:00-06:00`);
    } else if (c.ops !== undefined)
      await sembrarOps(c.ops, c.hoy ?? '2027-02-10', c.hoyServidor, c.notificaciones);
    else if (c.escenario !== undefined)
      await sembrarEscenario(
        c.escenario,
        c.hoyServidor ?? c.escenario.hoy ?? '2027-02-10',
        c.notificaciones,
      );
    semillaEnBase =
      c.soloLectura === true && (c.ops !== undefined || c.escenario !== undefined) ? clave : '';
    if (c.sesion !== false) await entrar(context, baseURL);
    await c.antes?.(page, context);
    const url = typeof c.url === 'function' ? await c.url(page) : (c.url ?? c.ruta);
    await page.goto(url);
    await quieta(page, { carga: c.carga });
    await c.pasos?.(page, info);
    await capturar(
      page,
      info,
      c.id,
      { ruta: c.ruta, comp: c.comp, ref: c.ref, nota: c.nota },
      { carga: c.carga },
    );
  });
}
