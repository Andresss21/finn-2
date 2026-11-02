import axe from 'axe-core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { ProveedorTema } from '../../../../componentes/marco/proveedor-tema';
import { ajustesApariencia as t } from '../../../../textos/ajustes-apariencia';
import { PanelApariencia } from './panel';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let montado: { raiz: Root; nodo: HTMLElement } | undefined;

/** `matchMedia` es el límite del navegador: el sistema del dispositivo está en el tema que diga la prueba. */
function sistemaEn(esquema: 'light' | 'dark'): void {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: consulta.includes(esquema),
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
  }));
}

function montar(): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <ProveedorTema>
        <PanelApariencia />
      </ProveedorTema>,
    );
  });
  montado = { raiz, nodo };
  return nodo;
}

const radio = (nodo: HTMLElement, nombre: string): HTMLElement => {
  const r = [...nodo.querySelectorAll<HTMLElement>('[role="radio"]')].find((x) =>
    (x.closest('label')?.textContent ?? '').startsWith(nombre),
  );
  if (r === undefined) throw new Error(`no hay una opción «${nombre}»`);
  return r;
};

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
afterEach(() => {
  if (montado !== undefined) {
    const { raiz, nodo } = montado;
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
    montado = undefined;
  }
  vi.unstubAllGlobals();
});

describe('PRU-CMP-PWA', () => {
  it('PRU-CMP-PWA-101 [CA-77.1] sin elección guardada, «Sistema» está marcado y <html> sigue el tema del dispositivo', async () => {
    sistemaEn('dark');
    const nodo = montar();
    await act(() => Promise.resolve());
    expect(radio(nodo, t.sistema).getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset['theme']).toBe('oscuro');
    expect(window.localStorage.getItem('finn-tema')).toBeNull();
  });

  it('PRU-CMP-PWA-102 [CA-77.2] elegir «Oscuro» lo guarda en el dispositivo y pone data-theme=«oscuro»; «Claro» lo cambia; sin tocar el servidor', async () => {
    sistemaEn('light');
    const pedidos = vi.fn();
    vi.stubGlobal('fetch', pedidos);
    const nodo = montar();
    await act(() => Promise.resolve());
    expect(document.documentElement.dataset['theme']).toBe('claro');

    await act(() => {
      radio(nodo, t.oscuro).click();
      return Promise.resolve();
    });
    expect(window.localStorage.getItem('finn-tema')).toBe('oscuro');
    expect(document.documentElement.dataset['theme']).toBe('oscuro');
    expect(radio(nodo, t.oscuro).getAttribute('aria-checked')).toBe('true');

    await act(() => {
      radio(nodo, t.claro).click();
      return Promise.resolve();
    });
    expect(document.documentElement.dataset['theme']).toBe('claro');
    expect(pedidos).not.toHaveBeenCalled();
  });

  it('PRU-CMP-PWA-104 [CA-77.2] un valor «dark» guardado antes de CH-74 se muestra como «Oscuro» y <html> queda en data-theme=«oscuro»', async () => {
    sistemaEn('light');
    window.localStorage.setItem('finn-tema', 'dark');
    const nodo = montar();
    await act(() => Promise.resolve());
    expect(radio(nodo, t.oscuro).getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset['theme']).toBe('oscuro');
  });

  it('PRU-CMP-PWA-103 [CA-77.2] con «Oscuro» ya guardado, el panel lo marca al montarse; sin violaciones de axe', async () => {
    sistemaEn('light');
    window.localStorage.setItem('finn-tema', 'oscuro');
    const nodo = montar();
    await act(() => Promise.resolve());
    expect(radio(nodo, t.oscuro).getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset['theme']).toBe('oscuro');
    const { violations } = await axe.run(nodo, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
