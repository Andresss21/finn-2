// `EnlaceFinn` pendiente (E6-2, FE-39; `T2-navegacion`) y el esqueleto del detalle de categoría (E6-1).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import Cargando from '../../app/(finn)/presupuesto/categorias/[categoriaId]/loading';
import { EnlaceFinn } from './enlace-finn';

// Solo el límite externo: `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene.
const estado = vi.hoisted(() => ({ pendiente: false }));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, {
    default: Enlace,
    useLinkStatus: () => ({ pending: estado.pendiente }),
  });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let montado: { raiz: Root; nodo: HTMLElement } | undefined;
afterEach(() => {
  if (montado !== undefined) {
    const { raiz, nodo } = montado;
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
    montado = undefined;
  }
  estado.pendiente = false;
});

function montar(ui: ReactNode): { nodo: HTMLElement; volver: (ui: ReactNode) => void } {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montado = { raiz, nodo };
  return {
    nodo,
    volver: (otra) => {
      act(() => {
        raiz.render(otra);
      });
    },
  };
}

describe('PRU-CMP-PWA señal de navegación', () => {
  it('PRU-CMP-PWA-731 [CA-E6-2] EnlaceFinn pendiente lleva aria-busy y el punto de 8 px; al terminar, ninguno; con movimiento reducido, sin animación', () => {
    const enlace = (
      <EnlaceFinn href="/cuentas" punto="icono" className="relative">
        Cuentas
      </EnlaceFinn>
    );
    estado.pendiente = true;
    const { nodo, volver } = montar(enlace);
    const a = nodo.querySelector('a') as HTMLElement;
    expect(a.getAttribute('aria-busy')).toBe('true');
    const punto = nodo.querySelector('[data-punto-pendiente]') as HTMLElement;
    expect(punto).not.toBeNull();
    expect(punto.getBoundingClientRect().width).toBe(8);
    expect(punto.getBoundingClientRect().height).toBe(8);
    const sonda = document.createElement('span');
    sonda.style.backgroundColor = 'var(--accion)';
    nodo.append(sonda);
    expect(getComputedStyle(punto).backgroundColor).toBe(getComputedStyle(sonda).backgroundColor);
    expect(getComputedStyle(punto).animationName).toBe('none');

    estado.pendiente = false;
    volver(
      <EnlaceFinn href="/cuentas" punto="icono" className="relative">
        Cuentas
      </EnlaceFinn>,
    );
    expect(a.getAttribute('aria-busy')).toBeNull();
    expect(nodo.querySelector('[data-punto-pendiente]')).toBeNull();
  });

  it('PRU-CMP-PWA-732 [CA-E6-1] el loading.tsx del detalle de categoría anuncia «Cargando categoría» una vez, sin ningún dato', () => {
    const { nodo } = montar(<Cargando />);
    const anuncios = nodo.querySelectorAll('[role="status"]');
    expect(anuncios).toHaveLength(1);
    expect(anuncios[0]?.textContent).toBe('Cargando categoría');
    expect(nodo.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(nodo.querySelector('h1')).toBeNull();
    expect(nodo.querySelector('[data-centavos]')).toBeNull();
    expect(nodo.textContent).not.toMatch(/\d/);
  });
});
