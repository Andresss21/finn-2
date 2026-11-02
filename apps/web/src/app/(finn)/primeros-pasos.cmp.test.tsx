import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../globals.css';
import { primerosPasos as p } from '../../textos/primeros-pasos';
import { PrimerosPasosDeInicio } from './primeros-pasos';

// `next/link` necesita `process`, que el navegador del proyecto no trae: el enlace se simula con un ancla.
vi.mock('../../componentes/navegacion/enlace-finn', () => ({
  EnlaceFinn: ({
    href,
    children,
    className,
  }: {
    href: string;
    children?: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

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
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-INICIO', () => {
  it('PRU-CMP-INICIO-103 los Primeros pasos marcan lo hecho con su nombre accesible, sin enlace, y dejan los pendientes como enlaces', async () => {
    const nodo = montar(
      <PrimerosPasosDeInicio pasos={{ cuenta: true, categorias: false, sms: false }} />,
    );
    expect(nodo.textContent).toContain(p.hecho(p.pasos.cuenta));
    const enlaces = [...nodo.querySelectorAll('a')].map((a) => [
      a.textContent,
      a.getAttribute('href'),
    ]);
    expect(enlaces).toEqual([
      [p.pasos.categorias, '/presupuesto/estructura'],
      [p.pasos.sms, '/ajustes/webhook'],
    ]);
    expect(nodo.textContent).not.toContain('Ocultar por ahora');
    const r = await axe.run(nodo, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
