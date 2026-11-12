// E4-16, CA-ET4-1: el tipo de una meta y de una programada es un dato fijo (texto con `lock`), no un control deshabilitado. Los
// formularios llaman a acciones del servidor, que el navegador de prueba no carga; sus pasos van en las E2E de Metas y Programadas.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { metas } from '../../textos/metas';
import { programadas } from '../../textos/programadas';
import { DatoFijo } from './dato-fijo';

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

function verificar(nodo: HTMLElement, valor: string, motivo: string): void {
  const dato = nodo.querySelector('[data-dato-fijo]') as HTMLElement;
  expect(dato.textContent).toContain(valor);
  expect(dato.textContent).toContain(motivo);
  const candado = dato.querySelector('svg') as SVGElement;
  expect(Math.round(candado.getBoundingClientRect().width)).toBe(16);
  expect(dato.querySelector('input, select, textarea, button, [disabled]')).toBeNull();
  expect(
    Number(getComputedStyle(candado.parentElement?.parentElement as Element).fontWeight),
  ).toBeGreaterThanOrEqual(700);
}

describe('PRU-CMP-DATOFIJO', () => {
  it('PRU-CMP-META-701 [CA-ET4-1] el tipo de una meta es texto con lock de 16 px, el valor en negrita y su motivo, sin control deshabilitado', () => {
    verificar(
      montar(
        <DatoFijo rotulo={metas.tipo} valor={metas.tipos.mensual} motivo={metas.tipoNoSeCambia} />,
      ),
      'Mensual',
      'El tipo no se cambia. Para otro tipo, eliminá la meta y creá otra.',
    );
  });

  it('PRU-CMP-PROG-701 [CA-ET4-1] el tipo de una programada es texto con lock de 16 px, el valor en negrita y su motivo, sin control deshabilitado', () => {
    verificar(
      montar(
        <DatoFijo
          rotulo={programadas.tipo}
          valor={programadas.tipos.gasto}
          motivo={programadas.tipoNoSeCambia}
        />,
      ),
      'Gasto',
      'El tipo no se cambia. Para otro tipo, desactivala y creá otra.',
    );
  });
});
