// Foco visible (punto 10): recorre con Tab las pantallas principales y anota qué indicador de foco tiene cada control.
// Correr solo en computadora: node tools/auditoria/correr.mjs casos/92-foco --project=computadora-claro
// Salida: docs/auditoria-diseno/foco/<pantalla>.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SALIDA, entrar, escenarioA7, quieta, sembrarEscenario, test } from '../lib.ts';

mkdirSync(join(SALIDA, 'foco'), { recursive: true });
const RUTAS = [
  '/',
  '/presupuesto',
  '/bandeja',
  '/actividad',
  '/cuentas',
  '/reportes',
  '/ajustes',
  '/ajustes/seguridad',
  '/registrar',
  '/registrar/gasto',
  '/cuentas/nueva',
  '/metas',
  '/reglas/nueva',
  '/ingresar',
];

test('foco visible', async ({ page, context, baseURL }, info) => {
  test.skip(info.project.name !== 'computadora-claro', 'solo en computadora');
  test.setTimeout(600_000);
  await sembrarEscenario(escenarioA7(), '2026-10-15');
  for (const ruta of RUTAS) {
    if (ruta === '/ingresar') await context.clearCookies();
    else if (ruta === '/') await entrar(context, baseURL);
    await page.goto(ruta);
    await quieta(page);
    const vistos: Record<string, unknown>[] = [];
    const claves = new Set<string>();
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press('Tab');
      const d = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        // el indicador puede estar en el propio control o en su contenedor (campo relleno con :focus-within)
        const padre = el.parentElement ? getComputedStyle(el.parentElement) : null;
        return {
          nombre: (
            el.getAttribute('aria-label') ||
            el.innerText ||
            (el as HTMLInputElement).name ||
            el.tagName
          )
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 60),
          tag: el.tagName.toLowerCase(),
          visibleFoco: el.matches(':focus-visible'),
          outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}`,
          sombra: cs.boxShadow.slice(0, 140),
          sombraPadre: padre?.boxShadow.slice(0, 140) ?? '',
          outlinePadre: padre ? `${padre.outlineStyle} ${padre.outlineWidth}` : '',
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      });
      if (!d) continue;
      const clave = `${d.tag}|${d.nombre}|${d.x}|${d.y}`;
      if (claves.has(clave)) break;
      claves.add(clave);
      const conOutline = !/^none|^\S+ 0px/.test(d.outline);
      const conSombra = d.sombra !== 'none' && d.sombra !== '';
      const enPadre =
        (d.sombraPadre !== 'none' && d.sombraPadre !== '') ||
        !/^none|^\S+ 0px/.test(d.outlinePadre);
      vistos.push({
        ...d,
        indicador: conOutline
          ? 'outline'
          : conSombra
            ? 'sombra'
            : enPadre
              ? 'en el contenedor'
              : 'NINGUNO',
      });
    }
    const nombre = ruta === '/' ? 'inicio' : ruta.slice(1).replaceAll('/', '-');
    writeFileSync(join(SALIDA, 'foco', `${nombre}.json`), JSON.stringify(vistos, null, 1));
  }
});
