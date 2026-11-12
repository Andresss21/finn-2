// CH-248 (E6-14): eliminar una programada y guardar sus cambios dejan su resultado en la lista de Programadas. Se prueba el contrato de
// la URL que lo lleva y lo que dibuja la pantalla; el recorrido completo (eliminar, volver a la lista) es de la E2E.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import {
  leerResultadoProgramada,
  rutaProgramadasConResultado,
} from '../../../flujos/programadas-nueva/resultado';
import { ResultadoDeProgramada } from './resultado';

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

const ID = '3f2b8a1e-0c4d-4e6a-9b7f-1a2b3c4d5e6f';
const programadas = [{ id: ID, comercio: 'Netflix' }];

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-PROG-780 el resultado de eliminar y de ajustar una programada viaja en la URL de la lista', () => {
  it('PRU-CMP-PROG-780 la ruta lleva el resultado y se lee de vuelta; un valor mal formado no se muestra', () => {
    expect(rutaProgramadasConResultado({ tipo: 'eliminada' })).toBe(
      '/programadas?resultado=eliminada',
    );
    expect(rutaProgramadasConResultado({ tipo: 'ajustada', programadaId: ID })).toBe(
      `/programadas?resultado=ajustada%3A${ID}`,
    );
    expect(leerResultadoProgramada('eliminada')).toEqual({ tipo: 'eliminada' });
    expect(leerResultadoProgramada(`ajustada:${ID}`)).toEqual({
      tipo: 'ajustada',
      programadaId: ID,
    });
    for (const malo of [
      undefined,
      '',
      'ajustada',
      'ajustada:p1',
      `eliminada:${ID}`,
      `ajustada:${ID}:x`,
      'otro',
    ]) {
      expect(leerResultadoProgramada(malo)).toBeUndefined();
    }
  });
});

describe('PRU-CMP-PROG-781 el resultado en la lista de Programadas', () => {
  it('PRU-CMP-PROG-781 [CA-E6-17] eliminar y ajustar dejan su resultado en la lista, sin salida para revertir', () => {
    const eliminada = montar(
      <ResultadoDeProgramada programadas={programadas} resultado={{ tipo: 'eliminada' }} />,
    );
    const r = eliminada.querySelector('[data-testid="resultado"]');
    expect(r?.textContent).toBe('Eliminaste la programada.');
    expect(r?.querySelector('button')).toBeNull();
    const ajustada = montar(
      <ResultadoDeProgramada
        programadas={programadas}
        resultado={{ tipo: 'ajustada', programadaId: ID }}
      />,
    );
    const a = ajustada.querySelector('[data-testid="resultado"]');
    expect(a?.textContent).toBe('Guardaste los cambios de Netflix.');
    expect(a?.querySelector('button')).toBeNull();
  });

  it('PRU-CMP-PROG-781 sin resultado, o con una programada que no está, no se dibuja nada', () => {
    expect(
      montar(<ResultadoDeProgramada resultado={undefined} programadas={programadas} />).querySelector(
        '[data-testid="resultado"]',
      ),
    ).toBeNull();
    expect(
      montar(
        <ResultadoDeProgramada
          programadas={programadas}
          resultado={{ tipo: 'ajustada', programadaId: '00000000-0000-4000-8000-000000000000' }}
        />,
      ).querySelector('[data-testid="resultado"]'),
    ).toBeNull();
  });
});
