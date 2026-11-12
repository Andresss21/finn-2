// E4-17 (CA-E4-21b): eliminar confirma dentro del flujo: caja `--problema-fondo` con `trash`, la pregunta con el foco, «Cancelar» y el
// verbo en peligro. Lo comparten las metas, las programadas y las reglas; sus formularios llaman a Server Actions y van en las E2E.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { metas } from '../../textos/metas';
import { ConfirmarEliminar } from './confirmar-eliminar';

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

describe('PRU-CMP-META confirmar eliminar', () => {
  it('PRU-CMP-META-702 [CA-E4-21b] la confirmación lleva trash, la pregunta con el foco, «Cancelar» y «Eliminar» en peligro, y cada botón llama a lo suyo', () => {
    const alCancelar = vi.fn();
    const alEliminar = vi.fn();
    const nodo = montar(
      <ConfirmarEliminar
        pregunta={metas.confirmarEliminar('Viaje')}
        cancelar={metas.noEliminar}
        eliminar={metas.siEliminar}
        eliminando={metas.eliminando}
        enviando={false}
        alCancelar={alCancelar}
        alEliminar={alEliminar}
      />,
    );
    const caja = nodo.querySelector('[data-confirmar-eliminar]') as HTMLElement;
    expect(caja.querySelector('svg')).not.toBeNull();
    expect(getComputedStyle(caja).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    const pregunta = caja.querySelector('p') as HTMLElement;
    expect(pregunta.textContent).toBe('¿Eliminar la meta de Viaje? No cambia lo asignado.');
    expect(document.activeElement).toBe(pregunta);
    const botones = [...caja.querySelectorAll('button')];
    expect(botones.map((b) => b.textContent)).toEqual(['Cancelar', 'Eliminar']);
    for (const b of botones) expect(b.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    act(() => {
      botones[0]?.click();
    });
    expect(alCancelar).toHaveBeenCalledTimes(1);
    act(() => {
      botones[1]?.click();
    });
    expect(alEliminar).toHaveBeenCalledTimes(1);
  });
});
