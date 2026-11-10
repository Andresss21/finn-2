// Insignia de fecha de Programadas (06-identidad-visual §2.16; FIXES A22): el mes en rótulo arriba y el día en Archivo 800,
// ancho 72 % y 1.5 rem abajo. Se mide en el navegador de prueba.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { InsigniaDeFecha } from '../../../componentes/dominio/insignia-fecha';

// Solo el límite externo: `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-PROG insignia de fecha', () => {
  it('PRU-CMP-PROG-130 [] la insignia de fecha lleva el mes arriba en rótulo y el día abajo en Archivo 800, ancho 72 % y 1.5 rem', () => {
    const nodo = montar(<InsigniaDeFecha fecha="2027-02-10" />);
    const mes = nodo.querySelector('[data-mes]') as HTMLElement;
    const dia = nodo.querySelector('[data-dia]') as HTMLElement;
    expect(dia.textContent).toBe('10');
    expect(mes.textContent?.length).toBeGreaterThan(0);
    // El mes va antes (arriba) que el día.
    expect(mes.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      dia.getBoundingClientRect().top + 1,
    );
    const e = getComputedStyle(dia);
    expect(e.fontWeight).toBe('800');
    expect(e.fontSize).toBe('24px');
    expect(e.fontStretch).toBe('72%');
    expect(e.fontVariantNumeric).toContain('tabular-nums');
    expect(nodo.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});
