// PRU-E2E-PWA-761 (TA-567; GLO-07, GLO-08; 06-identidad-visual §2.2): con el teclado, cada control con foco muestra la línea
// `--foco` de 3 px y no el anillo del navegador.
import type { Page } from '@playwright/test';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { expect, test } from '../configuracion/semilla.ts';

const RUTAS = ['/', '/presupuesto', '/ajustes'] as const;
const PASOS = 25;

async function medirFoco(page: Page): Promise<{ estilo: string; ancho: string; color: string }> {
  return page.evaluate(() => {
    const e = document.activeElement as HTMLElement;
    const sonda = document.createElement('span');
    sonda.style.color = 'var(--foco)';
    document.body.append(sonda);
    const color = getComputedStyle(sonda).color;
    sonda.remove();
    const c = getComputedStyle(e);
    // Un control puede dibujar su foco en un `::after` (fila entera tocable): también cuenta.
    const despues = getComputedStyle(e, '::after');
    const propio = c.outlineStyle === 'solid' ? c : despues;
    return {
      estilo: propio.outlineStyle,
      ancho: propio.outlineWidth,
      color: propio.outlineColor + '|' + color,
    };
  });
}

test.describe('PRU-E2E-PWA', () => {
  test('PRU-E2E-PWA-761 [] recorriendo con Tab Inicio, Presupuesto y Ajustes, cada control con foco muestra la línea --foco', async ({
    page,
    context,
    baseURL,
  }) => {
    await entrarAal2(context, baseURL ?? '');
    for (const ruta of RUTAS) {
      await page.goto(ruta);
      await esperarContenido(page);
      for (let i = 0; i < PASOS; i++) {
        await page.keyboard.press('Tab');
        const activo = await page.evaluate(
          () => document.activeElement !== document.body && document.activeElement !== null,
        );
        if (!activo) continue;
        const foco = await medirFoco(page);
        expect(foco.estilo, `${ruta} paso ${String(i)}`).toBe('solid');
        expect(foco.ancho).toBe('3px');
        const [obtenido, esperado] = foco.color.split('|');
        expect(obtenido).toBe(esperado);
      }
    }
  });
});
