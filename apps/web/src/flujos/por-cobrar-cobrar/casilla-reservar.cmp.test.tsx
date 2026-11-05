// FT-46 Cobrar (07 §17: un texto, un estado o el foco de un componente es una CMP). La casilla de AV-22 dibuja el texto que le dan y
// avisa del cambio; qué monto reserva y si aparece lo decide el servidor, y lo prueban las E2E (PF-3).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { CasillaReservar } from './casilla-reservar';

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

function mostrar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const casilla = (nodo: HTMLElement) => nodo.querySelector<HTMLInputElement>('input[type=checkbox]');

describe('PRU-CMP-COBRO casilla de reservar de Cobrar', () => {
  it('PRU-CMP-COBRO-120 [CA-46.2] con el monto que trae el servidor dice «Reservar $40.00 para T», viene marcada y su ayuda la describe', () => {
    const nodo = mostrar(
      <CasillaReservar marcada alCambiar={() => undefined} tarjeta="T" monto="$40.00" />,
    );
    expect(nodo.textContent).toContain('Reservar $40.00 para T');
    expect(nodo.textContent).toContain('La compra fue con tarjeta');
    expect(casilla(nodo)?.checked).toBe(true);
    const ayuda = casilla(nodo)?.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(ayuda)?.textContent).toContain('pago de la tarjeta');
  });

  it('PRU-CMP-COBRO-121 [CA-46.3] sin monto conocido dice «Reservar lo cobrado», al tocarla avisa que se desmarca y mide al menos 44 px', () => {
    const cambios: boolean[] = [];
    const nodo = mostrar(
      <CasillaReservar
        marcada
        alCambiar={(m) => {
          cambios.push(m);
        }}
        tarjeta="T"
        monto={undefined}
      />,
    );
    expect(nodo.textContent).toContain('Reservar lo cobrado para T');
    const c = casilla(nodo);
    expect(c).not.toBeNull();
    const { width, height } = (c as HTMLInputElement).getBoundingClientRect();
    expect(Math.min(width, height)).toBeGreaterThanOrEqual(44);
    act(() => {
      (c as HTMLInputElement).click();
    });
    expect(cambios).toEqual([false]);
  });

  it('PRU-CMP-COBRO-122 [CA-46.2] la casilla marcada y la desmarcada no tienen violaciones de accesibilidad', async () => {
    for (const marcada of [true, false]) {
      const nodo = mostrar(
        <CasillaReservar
          marcada={marcada}
          alCambiar={() => undefined}
          tarjeta="T"
          monto="$40.00"
        />,
      );
      const resultado = await axe.run(nodo, { rules: { 'color-contrast': { enabled: false } } });
      expect(
        resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
      ).toEqual([]);
    }
  });
});
