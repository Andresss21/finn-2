// FT-35, coincidencia con un pago programado (07 §17: un texto o un estado de un componente es una CMP). Dibuja lo que trae
// `bandeja()` en `coincidencia`; el servidor decide qué pasa al confirmar (OP-40) y lo prueban la integración y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { bandeja as t } from '../../textos/bandeja';
import { Coincidencia, type DatosCoincidencia } from './coincidencia';

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
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const PENDIENTE: DatosCoincidencia = {
  programada: 'Netflix',
  fecha: '20 de febrero',
  monto: '$15.49',
  registrada: false,
};
const boton = (nodo: HTMLElement): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find(
    (x) => x.textContent === t.revisar.confirmarCoincidencia,
  );
  if (b === undefined) throw new Error('no hay «Confirmar»');
  return b;
};

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-110 [CA-35.5] con una ocurrencia pendiente dice que se crea la transacción y «Confirmar» avisa al flujo', async () => {
    const alConfirmar = vi.fn();
    const nodo = montar(
      <Coincidencia
        coincidencia={PENDIENTE}
        enviando={false}
        deshabilitado={false}
        alConfirmar={alConfirmar}
      />,
    );
    expect(nodo.textContent).toContain(
      t.revisar.coincidePendiente('Netflix', '20 de febrero', '$15.49'),
    );
    await act(() => {
      boton(nodo).click();
      return Promise.resolve();
    });
    expect(alConfirmar).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-BAND-111 [CA-35.6] con la ocurrencia ya registrada dice que no se crea otra transacción', () => {
    const nodo = montar(
      <Coincidencia
        coincidencia={{ ...PENDIENTE, registrada: true }}
        enviando={false}
        deshabilitado={false}
        alConfirmar={vi.fn()}
      />,
    );
    expect(nodo.textContent).toContain(
      t.revisar.coincideRegistrada('Netflix', '20 de febrero', '$15.49'),
    );
    expect(nodo.textContent).not.toContain(
      t.revisar.coincidePendiente('Netflix', '20 de febrero', '$15.49'),
    );
  });
});
