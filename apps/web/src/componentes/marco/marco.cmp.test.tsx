// El marco portado del export de diseño (CH-109; 06-identidad-visual §3; 05 §3.3): «Volver» de las pantallas hijas en la
// barra y la campana que no lleva a una ruta que no existe (FT-69 sin construir).
// La forma (dónde se ve cada cosa en teléfono y en computadora) la prueba PRU-E2E-PWA-180.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { navegacion } from '../../textos/navegacion';
import { Marco } from './marco';

// Solo el límite externo: `next/link` y `next/navigation` necesitan el enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
const ruta = vi.hoisted(() => ({ pathname: '/', busqueda: '' }));
vi.mock('next/navigation', () => ({
  usePathname: () => ruta.pathname,
  useSearchParams: () => new URLSearchParams(ruta.busqueda),
  useRouter: () => ({ refresh: () => undefined, replace: () => undefined, back: () => undefined }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
beforeEach(() => {
  ruta.pathname = '/';
  ruta.busqueda = '';
});
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

function montar(pathname: string, busqueda: string, pagina: ReactNode): HTMLElement {
  ruta.pathname = pathname;
  ruta.busqueda = busqueda;
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<Marco>{pagina}</Marco>);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

// Radix y el menú escuchan el puntero y el teclado de verdad: se opera fuera de `act`.
async function sinAct(accion: () => Promise<void>): Promise<void> {
  const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  entorno.IS_REACT_ACT_ENVIRONMENT = false;
  try {
    await accion();
  } finally {
    entorno.IS_REACT_ACT_ENVIRONMENT = true;
  }
}

const enlaceVolver = (nodo: HTMLElement): HTMLAnchorElement | null =>
  nodo.querySelector<HTMLAnchorElement>('header a[aria-label^="Volver"]');

describe('PRU-CMP-PWA', () => {
  it('PRU-CMP-PWA-180 [] en una pantalla hija la barra lleva «Volver a…» a su rutaPadre de 05 §3.3 (con el mismo período, o ?volver= si es interna) y no lleva Registrar ni «Más secciones»; en una principal es al revés', () => {
    const categoria = montar('/presupuesto/categorias/c1', 'periodo=2026-10-21', <main />);
    expect(enlaceVolver(categoria)?.getAttribute('href')).toBe('/presupuesto?periodo=2026-10-21');
    expect(enlaceVolver(categoria)?.getAttribute('aria-label')).toBe('Volver a Presupuesto');
    expect(categoria.querySelector('header a[href="/registrar"]')).toBeNull();
    expect(
      categoria.querySelector(`header button[aria-label="${navegacion.secundarias}"]`),
    ).toBeNull();
    expect(categoria.querySelector('#contenido')?.getAttribute('data-barra')).toBe('hija');

    const transaccion = montar('/actividad/t1', 'volver=%2Fcuentas%2Fa1', <main />);
    expect(enlaceVolver(transaccion)?.getAttribute('href')).toBe('/cuentas/a1');
    expect(enlaceVolver(transaccion)?.getAttribute('aria-label')).toBe('Volver a Cuentas');

    // Una ruta que no es interna (3.6) no se sigue: vuelve a la rutaPadre.
    const ajena = montar('/actividad/t1', 'volver=%2F%2Fejemplo.com', <main />);
    expect(enlaceVolver(ajena)?.getAttribute('href')).toBe('/actividad');

    const principal = montar('/presupuesto', '', <main />);
    expect(enlaceVolver(principal)).toBeNull();
    expect(principal.querySelector('header a[href="/registrar"]')).not.toBeNull();
    expect(
      principal.querySelector(`header button[aria-label="${navegacion.secundarias}"]`),
    ).not.toBeNull();
    expect(principal.querySelector('#contenido')?.getAttribute('data-barra')).toBe('principal');

    // Un flujo no es un detalle: `/cuentas/nueva` cuelga de Cuentas sin «Volver» de la barra (lo cierra `cerrarFlujo()`).
    expect(enlaceVolver(montar('/cuentas/nueva', '', <main />))).toBeNull();
  });

  it('PRU-CMP-PWA-181 [] la campana no es un enlace a /notificaciones (FT-69 sin construir): es un botón con el contador en su nombre que abre el panel desde arriba', async () => {
    const nodo = montar('/presupuesto', '', <main />);
    // La barra (no la fila de la sección en la barra lateral, que es el contrato de 3.1) ya no enlaza a la ruta.
    expect(nodo.querySelector('header a[href="/notificaciones"]')).toBeNull();
    const campana = nodo.querySelector<HTMLButtonElement>(
      `header button[aria-label="${navegacion.notificaciones(null)}"]`,
    );
    expect(campana?.getAttribute('aria-haspopup')).toBe('dialog');

    await sinAct(async () => {
      await userEvent.click(campana as HTMLButtonElement);
    });
    await vi.waitFor(() => {
      expect(document.querySelector('[role=dialog]')).not.toBeNull();
    });
    const panel = document.querySelector<HTMLElement>('[role=dialog]') as HTMLElement;
    expect(panel.querySelector('h2')?.textContent).toBe(navegacion.secciones.notificaciones);
    expect(panel.textContent).toContain(navegacion.notificacionesPie);
    expect(panel.className).toContain('top-0');

    await sinAct(async () => {
      await userEvent.keyboard('{Escape}');
    });
    await vi.waitFor(() => {
      expect(document.querySelector('[role=dialog]')).toBeNull();
    });
    expect(document.activeElement).toBe(campana);
  });
});
