// FT-08 paso 5, «Marcar como leído» (07 §17: un texto o un estado de un componente es una CMP). La acción la pone el lector: la
// prueba le da una propia, sin servidor. Que la notificación desaparezca al recargar lo prueba la E2E (PRU-E2E-INICIO-134).
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../globals.css';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { inicio as t } from '../../textos/inicio';
import { MarcarLeido } from './marcar-leido';

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

function montar(accion: AccionEscritura): HTMLElement {
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<MarcarLeido id="n-1" accion={accion} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const tocar = async (nodo: HTMLElement): Promise<void> => {
  const boton = nodo.querySelector('button');
  if (boton === null) throw new Error('no hay botón');
  await act(async () => {
    boton.click();
    await Promise.resolve();
  });
};

describe('PRU-CMP-INICIO', () => {
  it('PRU-CMP-INICIO-130 [CA-08.5] «Marcar como leído» envía el id de la notificación y, si sale bien, no muestra ningún error', async () => {
    const accion = vi.fn(() =>
      Promise.resolve({ ok: true as const, valor: { marcadas: 1 }, avisos: [], yaAplicada: false }),
    );
    const nodo = montar(accion);
    expect(nodo.textContent).toContain(t.marcarLeido);
    await tocar(nodo);
    expect(accion).toHaveBeenCalledWith({ ids: ['n-1'] });
    expect(nodo.querySelector('[role="status"]')).toBeNull();
  });

  it('PRU-CMP-INICIO-131 [CA-08.5] si la acción falla muestra el mensaje en línea y deja el botón para reintentar', async () => {
    const accion = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: { categoria: 'INTERNO', codigo: 'interno', mensaje: 'No se pudo guardar.' },
      }),
    );
    const nodo = montar(accion as unknown as AccionEscritura);
    await tocar(nodo);
    expect(nodo.querySelector('[role="status"]')?.textContent).toContain('No se pudo guardar.');
    expect(nodo.querySelector('button')?.textContent).toContain(t.marcarLeido);
  });
});
