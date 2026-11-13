// FT-39 Editar una regla (07 §17: un texto de un componente es una CMP). «Coincide con» (E4-22) dibuja `ReglaDto.coincideCon`
// tal como llega de `reglas()` (04 §6.12.2, CH-251): qué comercios coinciden lo prueban el dominio y la integración.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { CoincideCon, UsosDeRegla } from './coincide-con';

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

function montar(coincideCon: readonly string[]): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<CoincideCon comercios={coincideCon} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-795 [FT-39, CA-39.1] (CH-251) editar una regla dice «Coincide con: PUMA SANTA ELENA, PUMA ESCALON.»; sin coincidencias no dice nada', () => {
    const con = montar(['PUMA SANTA ELENA', 'PUMA ESCALON']);
    expect(con.querySelector('[data-coincide-con]')?.textContent).toBe(
      'Coincide con: PUMA SANTA ELENA, PUMA ESCALON.',
    );
    expect(montar([]).querySelector('[data-coincide-con]')).toBeNull();
  });

  it('PRU-CMP-BAND-801 [FT-39] editar una regla dice «Usada N veces» con el número que trae el DTO', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(<UsosDeRegla usos={12} />);
    });
    montados.push({ raiz, nodo });
    expect(nodo.querySelector('[data-usos]')?.textContent).toBe('Usada 12 veces');
  });
});
