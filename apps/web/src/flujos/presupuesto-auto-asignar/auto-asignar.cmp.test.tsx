// La fila de la tarjeta K4 con el indicador de estado de un valor nuevo negativo (E4-25, 05 §10.3). La fila solo dibuja el estado
// que le pasa el llamador: qué número es negativo lo dice el servidor (PF-3).
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { glosario } from '../../textos/glosario';
import { FilaImpacto, TarjetaImpacto } from '../presupuesto-impacto-k4';

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

describe('PRU-CMP-PRES', () => {
  it('PRU-CMP-PRES-741 [CA-E4-21] un valor nuevo negativo en la K4 lleva su indicador debajo del nombre de la fila, con su estado; sin estado, la fila no lo dibuja', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(
        <TarjetaImpacto
          rotulo="Antes de confirmar"
          filas={[
            <FilaImpacto
              key="a"
              nombre="Comida fuera"
              valor="−$26.30"
              estado={{ estado: 'problema', etiqueta: glosario.sobregiroConDebitoOEfectivo }}
            />,
            <FilaImpacto key="b" nombre="Casa" valor="$69.45" />,
          ]}
        />,
      );
    });
    montados.push({ raiz, nodo });
    const [negativa, normal] = [...nodo.querySelectorAll('[data-fila-impacto]')];
    const nombre = negativa?.querySelector('p');
    const indicador = negativa?.querySelector('[data-estado="problema"]');
    expect(nombre?.textContent).toBe('Comida fuera');
    expect(indicador?.textContent).toContain(glosario.sobregiroConDebitoOEfectivo);
    // Debajo del nombre: el indicador empieza donde termina el nombre y comparte su columna.
    expect(indicador?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      nombre?.getBoundingClientRect().bottom ?? Infinity,
    );
    expect(normal?.querySelector('[data-estado]')).toBeNull();
    expect(nodo.querySelector('[data-impacto-k4]')?.textContent).toContain('Antes de confirmar');
  });
});
