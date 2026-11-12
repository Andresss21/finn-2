// Movimiento (punto 8): graba un video corto de cada momento clave y registra qué animaciones corrieron de verdad
// (nombre, duración, retraso, curva, destino), con y sin `prefers-reduced-motion`.
// Salidas: docs/auditoria-diseno/videos/<momento>__<proyecto>.webm y docs/auditoria-diseno/movimiento/<momento>__<proyecto>[__reducido].json
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SALIDA,
  codigoTotp,
  entrar,
  escenarioA7,
  quieta,
  sembrarEscenario,
  sembrarOps,
  test,
  variable,
  type Op,
  type Page,
  type TestInfo,
} from '../lib.ts';

mkdirSync(join(SALIDA, 'movimiento'), { recursive: true });

/** Dentro de la página: anota en cada cuadro las animaciones y transiciones vivas. */
const REGISTRADOR = () => {
  const w = window as unknown as { __mov: Record<string, unknown>[]; __vistos: Set<string> };
  w.__mov = [];
  w.__vistos = new Set();
  const describir = (el: Element | null | undefined): string => {
    if (!el) return '';
    const partes: string[] = [];
    for (
      let e: Element | null = el, i = 0;
      e && i < 3 && e !== document.body;
      e = e.parentElement, i++
    ) {
      const dato = ['role', 'aria-label', 'data-componente']
        .map((a) => (e!.getAttribute(a) ? `[${a}=${e!.getAttribute(a)!.slice(0, 30)}]` : ''))
        .join('');
      const clase = [...e.classList].filter((c) => /^(fz-|finn-|animate-)/.test(c)).join('.');
      partes.unshift(`${e.tagName.toLowerCase()}${dato}${clase ? '.' + clase : ''}`);
    }
    return partes.join(' > ');
  };
  const paso = () => {
    for (const a of document.getAnimations()) {
      // solo las que están corriendo: las terminadas con `fill` siguen en la lista y no son de este momento
      if (a.playState !== 'running' || a.pending) continue;
      const efecto = a.effect as KeyframeEffect | null;
      const t = efecto?.getComputedTiming();
      const nombre =
        (a as CSSAnimation).animationName ??
        `transition:${(a as CSSTransition).transitionProperty ?? '?'}`;
      const destino = describir(efecto?.target);
      const clave = `${nombre}|${destino}|${String(t?.duration)}|${String(t?.delay)}`;
      if (w.__vistos.has(clave)) continue;
      w.__vistos.add(clave);
      let cuadros: string[] = [];
      let curvaCuadro = '';
      try {
        curvaCuadro = String(efecto?.getKeyframes()[0]?.easing ?? '');
        cuadros = (efecto?.getKeyframes() ?? []).map((k) =>
          Object.entries(k)
            .filter(([p]) => !['offset', 'computedOffset', 'easing', 'composite'].includes(p))
            .map(([p, v]) => `${p}:${String(v)}`)
            .join(';'),
        );
      } catch {
        /* sin cuadros legibles */
      }
      w.__mov.push({
        nombre,
        destino,
        duracion: t?.duration,
        retraso: t?.delay,
        iteraciones: String(t?.iterations),
        curva: curvaCuadro || t?.easing,
        cuadros: cuadros.slice(0, 4),
        en: Math.round(performance.now()),
      });
    }
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
};

const vaciar = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __mov?: Record<string, unknown>[]; __vistos?: Set<string> };
    const r = w.__mov ?? [];
    w.__mov = [];
    w.__vistos = new Set();
    return r;
  });

interface Momento {
  nombre: string;
  /** Lo que §11 / DECISIONES esperan, para leerlo junto a lo medido */
  esperado: string;
  accion: (page: Page) => Promise<void>;
}

async function grabar(
  page: Page,
  info: TestInfo,
  id: string,
  reducido: boolean,
  momentos: Momento[],
): Promise<void> {
  const resultado: Record<string, unknown>[] = [];
  for (const m of momentos) {
    await vaciar(page).catch(() => []);
    await m.accion(page);
    // deja correr la transición completa (hasta 1,8 s) antes de leer
    await page.waitForTimeout(1800);
    const animaciones = (await vaciar(page).catch(() => [])).filter(
      (a) => a['iteraciones'] !== 'Infinity',
    );
    const estado = await page.evaluate(() => ({
      url: location.pathname + location.search,
      dialogos: [...document.querySelectorAll('[role=dialog]')].map(
        (d) => d.getAttribute('aria-label') ?? d.querySelector('h1,h2')?.textContent ?? '',
      ),
    }));
    resultado.push({ momento: m.nombre, esperado: m.esperado, despues: estado, animaciones });
  }
  const sufijo = `${info.project.name}${reducido ? '__reducido' : ''}`;
  writeFileSync(
    join(SALIDA, 'movimiento', `${id}__${sufijo}.json`),
    JSON.stringify(resultado, null, 1),
  );
  const video = page.video();
  await page.close();
  if (video && !reducido)
    await video.saveAs(join(SALIDA, 'videos', `${id}__${info.project.name}.webm`));
}

const A7 = escenarioA7();
const DIA_20 = '2027-02-20';
const sms = (etiqueta: string, comercio: string, monto: number, recibido: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${DIA_20}T${recibido}`,
  fecha: DIA_20,
});
const BANDEJA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Restaurantes' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Restaurantes', monto: 100, periodo: 'P1' },
  sms('anterior', 'Super', 30, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Super', aprobado: `${DIA_20}T09:30` },
  sms('a', 'Super', 12, '15:00'),
  sms('b', 'Super', 13, '15:10'),
  sms('c', 'Super', 14, '15:20'),
];

for (const reducido of [false, true]) {
  test.describe(reducido ? 'movimiento reducido' : 'movimiento', () => {
    test.use({ contextOptions: { reducedMotion: reducido ? 'reduce' : 'no-preference' } });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(REGISTRADOR);
    });

    test(`mov navegacion${reducido ? ' reducido' : ''}`, async ({
      page,
      context,
      baseURL,
    }, info) => {
      await sembrarEscenario(A7, '2026-10-15');
      await entrar(context, baseURL);
      await page.goto('/');
      await quieta(page);
      const telefono = (page.viewportSize()?.width ?? 0) < 700;
      const nav = (nombre: RegExp) => page.getByRole('link', { name: nombre }).first();
      await grabar(page, info, 'navegacion', reducido, [
        {
          nombre: 'entrada de Inicio y billete Listo para asignar (recarga)',
          esperado:
            '§2.8: cifras que ruedan una vez, 1.4 s, 90 ms entre dígitos; bloques escalonados',
          accion: async (p) => {
            await p.reload();
          },
        },
        {
          nombre: 'pestaña a la derecha: Inicio → Presupuesto',
          esperado: '§11: entra desde 22 px a la derecha, opacidad 0→1, 320 ms, --curva-estandar',
          accion: async () => nav(/^Presupuesto/).click(),
        },
        {
          nombre: 'abrir un detalle: Presupuesto → categoría Restaurantes',
          esperado: '§11: entra desde 70 px a la derecha, 360 ms',
          accion: async (p) =>
            p
              .getByRole('link', { name: /Restaurantes/ })
              .first()
              .click(),
        },
        {
          nombre: 'volver: categoría → Presupuesto',
          esperado: '§11: entra desde 50 px a la izquierda, 360 ms',
          accion: async (p) =>
            p
              .getByRole('link', { name: /^Volver/ })
              .first()
              .click(),
        },
        {
          nombre: 'pestaña a la izquierda: Presupuesto → Inicio',
          esperado: '§11: igual desde la izquierda, 320 ms',
          accion: async () => nav(/^Inicio/).click(),
        },
        {
          nombre: 'abrir Registrar (flujo largo)',
          esperado: '§11: sube desde abajo, 420 ms, --curva-entrada',
          accion: async (p) =>
            p
              .getByRole('link', { name: /^Registrar/ })
              .first()
              .click(),
        },
        {
          nombre: 'cerrar Registrar',
          esperado: '§11: aparece con 8 px hacia arriba, 300 ms',
          accion: async (p) =>
            p
              .getByRole('link', { name: /^Cerrar/ })
              .or(p.getByRole('button', { name: /^Cerrar/ }))
              .first()
              .click(),
        },
        ...(telefono
          ? [
              {
                nombre: 'abrir la hoja Más secciones',
                esperado:
                  '§11: velo 0→1 (280 ms), la hoja sube (380 ms, --curva-entrada), opciones escalonadas 40 ms',
                accion: async (p: Page) => p.getByRole('button', { name: /Más secciones/ }).click(),
              },
              {
                nombre: 'cerrar la hoja Más secciones (Escape)',
                esperado: '§11: baja (200 ms, --curva-salida) y recién entonces se desmonta',
                accion: async (p: Page) => p.keyboard.press('Escape'),
              },
            ]
          : []),
        {
          nombre: 'abrir el panel de notificaciones (campana)',
          esperado: '§11: cae desde arriba (360 ms), avisos escalonados 60 ms',
          accion: async (p) =>
            p
              .getByRole('link', { name: /Notificaciones/ })
              .or(p.getByRole('button', { name: /Notificaciones/ }))
              .first()
              .click(),
        },
        {
          nombre: 'cerrar el panel de notificaciones (Escape)',
          esperado: '§11: sube (200 ms)',
          accion: async (p) => p.keyboard.press('Escape'),
        },
        {
          nombre: 'abrir la hoja Asignar desde Inicio',
          esperado: '§11: velo (280 ms) y hoja que sube (380 ms); en computadora, panel lateral',
          accion: async (p) =>
            p
              .getByRole('link', { name: /^Asignar \$/ })
              .or(p.getByRole('button', { name: /^Asignar \$/ }))
              .first()
              .click(),
        },
        {
          nombre: 'cerrar la hoja Asignar (Escape)',
          esperado: '§11: baja (200 ms, --curva-salida)',
          accion: async (p) => p.keyboard.press('Escape'),
        },
      ]);
    });

    test(`mov bandeja${reducido ? ' reducido' : ''}`, async ({ page, context, baseURL }, info) => {
      await sembrarOps(BANDEJA, DIA_20);
      await entrar(context, baseURL);
      await page.goto('/');
      await quieta(page);
      const fila = (monto: string) => page.locator('[data-movimiento]').filter({ hasText: monto });
      await grabar(page, info, 'bandeja', reducido, [
        {
          nombre: 'entrar a la Bandeja (filas escalonadas)',
          esperado: '§2.12: las filas entran escalonadas (400 ms, 60 ms entre filas)',
          accion: async (p) =>
            p
              .getByRole('link', { name: /^Bandeja/ })
              .first()
              .click(),
        },
        {
          nombre: 'aprobar con un toque',
          esperado:
            '§2.13 y §11: el resultado aparece en el lugar con un rebote (300 ms, --curva-enfasis); sin transición de pantalla',
          accion: async () =>
            fila('12.00')
              .getByRole('button', { name: /^Aprobar/ })
              .click(),
        },
        {
          nombre: 'aprobar otro',
          esperado: 'igual; el contador de la Bandeja cambia',
          accion: async () =>
            fila('13.00')
              .getByRole('button', { name: /^Aprobar/ })
              .click(),
        },
      ]);
    });

    test(`mov arrastre${reducido ? ' reducido' : ''}`, async ({ page, context, baseURL }, info) => {
      await sembrarOps(BANDEJA, DIA_20);
      await entrar(context, baseURL);
      await page.goto('/bandeja');
      await quieta(page);
      const asa = page
        .locator('[data-movimiento]')
        .filter({ hasText: '12.00' })
        .locator('[data-asa]');
      await asa.waitFor({ timeout: 20_000 });
      const foto = (nombre: string) =>
        page.screenshot({
          path: join(
            SALIDA,
            'capturas',
            `bandeja__${nombre}__${info.project.name}${reducido ? '-reducido' : ''}.png`,
          ),
        });
      await grabar(page, info, 'arrastre', reducido, [
        {
          nombre: 'tomar el movimiento (ratón, más de 6 px)',
          esperado:
            'SIN DISEÑO: PANTALLAS §7 solo dice «Arrastrar a una categoría es un atajo; los botones siempre están»',
          accion: async (p) => {
            const c = await asa.boundingBox();
            if (!c) throw new Error('el asa no tiene caja');
            await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
            await p.mouse.down();
            await p.mouse.move(c.x + c.width / 2 + 14, c.y + c.height / 2 + 14, { steps: 6 });
            await p.waitForTimeout(700);
            await foto('arrastre-tomado');
          },
        },
        {
          nombre: 'llevarlo sobre un destino',
          esperado: 'SIN DISEÑO',
          accion: async (p) => {
            const d = await p.locator('[data-destino]').first().boundingBox();
            if (!d) throw new Error('no hay destinos de arrastre');
            await p.mouse.move(d.x + d.width / 2, d.y + d.height / 2, { steps: 14 });
            await p.waitForTimeout(500);
            await foto('arrastre-sobre-destino');
          },
        },
        {
          nombre: 'soltar sobre el destino',
          esperado: 'SIN DISEÑO; por DECISIONES el resultado queda en el lugar de la fila',
          accion: async (p) => {
            await p.mouse.up();
            await p.waitForTimeout(900);
            await foto('arrastre-soltado');
          },
        },
      ]);
    });

    test(`mov codigo${reducido ? ' reducido' : ''}`, async ({ page }, info) => {
      await page.goto('/ingresar');
      await quieta(page);
      await page
        .getByLabel(/correo|email/i)
        .first()
        .fill(variable('E2E_EMAIL'));
      await page
        .getByLabel(/contraseña/i)
        .first()
        .fill(variable('E2E_CLAVE'));
      await page.keyboard.press('Enter');
      await page.waitForURL('**/ingresar/verificar**');
      await quieta(page);
      const casillas = page.locator(
        'input[inputmode="numeric"], input[autocomplete="one-time-code"]',
      );
      await grabar(page, info, 'codigo', reducido, [
        {
          nombre: 'escribir tres dígitos',
          esperado:
            'DECISIONES: casilla llena con línea de 3 px en --accion, sube 2 px y hace un pop; avanza a la siguiente',
          accion: async (p) => {
            await casillas.first().click();
            await p.keyboard.type('123', { delay: 120 });
          },
        },
        {
          nombre: 'completar con un código incorrecto',
          esperado:
            'DECISIONES: se verifica sola al sexto dígito; error: el grupo tiembla 380 ms y las casillas toman --problema-borde',
          accion: async (p) => {
            await p.keyboard.type('000', { delay: 120 });
          },
        },
        {
          nombre: 'pegar el código correcto',
          esperado:
            'DECISIONES: pegar reparte los 6 dígitos; correcto: --positivo-fondo en cascada (40 ms), check con pop, sigue a los 650 ms',
          accion: async (p) => {
            const codigo = codigoTotp();
            await casillas.first().click();
            await p.evaluate((c) => {
              const dt = new DataTransfer();
              dt.setData('text/plain', c);
              document.activeElement?.dispatchEvent(
                new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
              );
            }, codigo);
          },
        },
      ]);
    });
  });
}
