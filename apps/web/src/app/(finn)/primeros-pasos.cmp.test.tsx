import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../globals.css';
import { primerosPasos as p } from '../../textos/primeros-pasos';
import { RecordatorioPrimerosPasos } from './ajustes/recordatorio-primeros-pasos';
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
  window.localStorage.clear();
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

const boton = (nodo: HTMLElement, nombre: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === nombre);
  if (b === undefined) throw new Error('no hay un botón ' + nombre);
  return b;
};

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
    const r = await axe.run(nodo, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });

  it('PRU-CMP-INICIO-108 [CA-04.11] con una cuenta, "Ocultar por ahora" quita los Primeros pasos y el recordatorio de Ajustes muestra "2 de 3" con "Mostrar en Inicio", que los devuelve', async () => {
    const pasos = { cuenta: true, categorias: true, sms: false };
    const nodo = montar(
      <>
        <PrimerosPasosDeInicio pasos={pasos} />
        <RecordatorioPrimerosPasos pasos={pasos} />
      </>,
    );
    expect(nodo.textContent).not.toContain(p.recordatorio(2));
    await act(() => {
      boton(nodo, p.ocultar).click();
      return Promise.resolve();
    });
    expect(nodo.querySelector('h2')).toBeNull();
    expect(nodo.textContent).toContain(p.recordatorio(2));
    expect(window.localStorage.getItem('finn:primeros-pasos:oculto')).toBe('1');
    await act(() => {
      boton(nodo, p.mostrar).click();
      return Promise.resolve();
    });
    expect(nodo.querySelector('h2')?.textContent).toBe(p.titulo);
    expect(nodo.textContent).not.toContain(p.recordatorio(2));
    expect(window.localStorage.getItem('finn:primeros-pasos:oculto')).toBeNull();
  });

  it('PRU-CMP-INICIO-109 [CA-04.12] sin cuenta no se ofrece "Ocultar por ahora"; con los tres pasos hechos (primerosPasos nulo) el recordatorio no se dibuja aunque esté oculto', () => {
    const sinCuenta = montar(
      <PrimerosPasosDeInicio pasos={{ cuenta: false, categorias: true, sms: false }} />,
    );
    expect(sinCuenta.textContent).not.toContain(p.ocultar);
    window.localStorage.setItem('finn:primeros-pasos:oculto', '1');
    const completo = montar(<RecordatorioPrimerosPasos pasos={null} />);
    expect(completo.textContent).toBe('');
  });
});
