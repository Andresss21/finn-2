// MAS-105, E6-14: en la lista de Programadas solo se reactiva. Una fila activa no dibuja nada (Desactivar vive en la hoja de editar);
// una pausada ofrece «Reactivar» y, hecho, deja «Reactivaste …» en su lugar. Se prueba con una acción simulada, sin servidor.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { Activar } from './activar';

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
