// D-6 (CA-11.2) y E4-25: el impacto de Mover dinero y las filas «valor actual → nuevo» de la K4. El formulario importa su Server
// Action, así que se prueban sus piezas: lo que dibujan con lo que trae la previsualización de OP-15 [CH-246].
import type { Centavos } from '@finn/dominio/valores';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { glosario } from '../../textos/glosario';
import { FilaAntesDespues, TarjetaImpacto } from '../presupuesto-impacto-k4';
import { ImpactoMover } from './impacto';

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
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const c = (n: number) => n as Centavos;
const SUPER = { id: 's', nombre: 'Supermercado' };
const REST = { id: 'r', nombre: 'Restaurantes' };

describe('PRU-CMP-PRES impacto «antes → después»', () => {
  it('PRU-CMP-PRES-760 [CA-E4-21] la fila muestra «antes → después» como lo dijo el servidor y solo un valor nuevo negativo lleva el indicador', () => {
    const nodo = montar(
      <TarjetaImpacto
        rotulo="Antes de confirmar"
        filas={[
          <FilaAntesDespues key="a" nombre="Super" antes={c(6285)} despues={c(-1715)} />,
          <FilaAntesDespues key="b" nombre="Casa" antes={c(-2630)} despues={c(5370)} />,
          <FilaAntesDespues
            key="c"
            nombre="Listo"
            antes={c(100)}
            despues={c(-100)}
            conEstado={false}
          />,
        ]}
      />,
    );
    const [a, b, d] = [...nodo.querySelectorAll('[data-fila-impacto]')];
    expect(a?.textContent).toContain('$62.85 → −$17.15');
    expect(a?.querySelector('[data-estado="problema"]')?.textContent).toContain(
      glosario.sobregiroConDebitoOEfectivo,
    );
    expect(b?.textContent).toContain('−$26.30 → $53.70');
    expect(b?.querySelector('[data-estado]')).toBeNull();
    expect(d?.querySelector('[data-estado]')).toBeNull();
  });

  it('PRU-CMP-PRES-761 [CA-E4-17, CA-E4-18] mover más que el Disponible muestra el aviso con el negativo, sin error, y los dos Disponibles en el bloque de impacto', () => {
    const nodo = montar(
      <ImpactoMover
        origen={SUPER}
        destino={REST}
        deltas={[
          { categoriaId: 'r', antes: c(-2630), despues: c(5370) },
          { categoriaId: 's', antes: c(6285), despues: c(-1715) },
        ]}
      />,
    );
    const aviso = nodo.querySelector('[role=status]');
    expect(aviso?.textContent).toContain('Supermercado va a quedar en −$17.15');
    expect(aviso?.textContent).toContain(
      'Queda sobregirada. Si no la cubrís antes del cierre, Listo para asignar bajará $17.15.',
    );
    expect(nodo.querySelector('[role=alert]')).toBeNull();
    const filas = [...nodo.querySelectorAll('[data-fila-impacto]')].map((f) => f.textContent);
    expect(filas[0]).toContain('Supermercado');
    expect(filas[0]).toContain('$62.85 → −$17.15');
    expect(filas[1]).toContain('Restaurantes');
    expect(filas[1]).toContain('−$26.30 → $53.70');
  });

  it('PRU-CMP-PRES-762 [CA-E4-17] si el origen queda sin negativo no hay aviso, y sin Disponibles del servidor no se dibuja nada', () => {
    const nodo = montar(
      <ImpactoMover
        origen={SUPER}
        destino={REST}
        deltas={[{ categoriaId: 's', antes: c(6285), despues: c(285) }]}
      />,
    );
    expect(nodo.querySelector('[role=status]')).toBeNull();
    expect(nodo.querySelectorAll('[data-fila-impacto]')).toHaveLength(1);
    const vacio = montar(<ImpactoMover origen={SUPER} destino={REST} deltas={[]} />);
    expect(vacio.querySelector('[data-impacto-k4]')).toBeNull();
  });
});
