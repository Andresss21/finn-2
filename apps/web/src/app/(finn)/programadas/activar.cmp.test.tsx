// MAS-105, E6-14: en la lista de Programadas solo se reactiva. Una fila activa no dibuja nada (Desactivar vive en la hoja de editar);
// una pausada ofrece «Reactivar» y, hecho, deja «Reactivaste …» en su lugar. Se prueba con una acción simulada, sin servidor.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { Activar } from './activar';

// [CH-281] `Activar` cierra la hoja de editar al desactivar (`flujo-de-ruta`): `next/link` y `next/navigation` necesitan el
// enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/programadas',
}));
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

function montar(ui: React.ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-PROG activar en la lista', () => {
  it('PRU-CMP-PROG-702 [] una fila activa no dibuja nada y una pausada ofrece «Reactivar» de 44 px', () => {
    const accion = vi.fn();
    const activa = montar(
      <Activar programadaId="p1" nombre="Netflix" activa soloReactivar accion={accion} />,
    );
    expect(activa.textContent).toBe('');
    const pausada = montar(
      <Activar programadaId="p2" nombre="Gimnasio" activa={false} soloReactivar accion={accion} />,
    );
    const boton = pausada.querySelector('button') as HTMLButtonElement;
    expect(boton.textContent).toBe('Reactivar');
    expect(boton.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });
});
